# Developer Notes

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000/companies](http://localhost:3000/companies) to see the analytics dashboard.

---

## Features in Action

### Dashboard Stats

The stats cards show aggregate counts across ~5,000 shipment records:

- **Total Importers/Exporters** - Distinct company counts from each role
- **Top 5 Commodities** - Ranked by total weight (kg) across all shipments

### Monthly Volume Chart

Bar chart visualizing shipment weight aggregated by month. Uses `strftime()` to group dates and formats output as "MMM YYYY".

### Company List

- Server-side pagination (20 per page) sorted by `totalShipments` DESC
- Client-side search filters the current page without refetching
- Click any row to load company details

### Company Detail Panel

Displays selected company's:

- **Role** - Derived at runtime: `importer`, `exporter`, or `both`
- **Top 5 Trading Partners** - Aggregated from both import and export relationships
- **Top 5 Commodities** - Weight-ranked commodities this company trades

---

## Architecture

```
pages/api/* → lib/data/shipments.ts → DuckDB (in-memory)
     ↓
pages/*.tsx ← useSWR (client-side caching)
```

**Data Flow:** JSON file → DuckDB table (created once) → SQL queries → API responses → SWR cache → React components

**Why DuckDB?** Columnar storage with fast aggregations. The in-memory instance handles complex GROUP BY queries on 5K records in sub-millisecond time without external database setup.

---

## Key Technical Decisions

### SQL Aggregation Strategy

**CTE + UNION ALL for company deduplication:**

```sql
WITH importers AS (
  SELECT importer_name AS name, importer_country AS country, ...
  FROM shipments
),
exporters AS (
  SELECT exporter_name AS name, exporter_country AS country, ...
  FROM shipments
)
SELECT name, country, SUM(shipments), SUM(weight)
FROM (SELECT * FROM importers UNION ALL SELECT * FROM exporters)
GROUP BY name, country
```

This pattern merges a company's activity from both roles into a single aggregated row.

**Composite key `(name, country)`:** The same company name can exist in different countries. Keying by the tuple ensures accurate deduplication.

**Weight conversion:** Source data uses metric tonnes. Queries multiply by 1000 and cast to integer for clean kg values.

### API Design

**Separated stats endpoint:** `/api/companies/stats` is independent from `/api/companies`. Stats don't refetch when paginating the company list.

**N+1 prevention:** `getCompanyDetail()` runs 3 queries in sequence (stats, partners, commodities) rather than one query per trading partner. Application code aggregates the results.

**Zod coercion:** DuckDB returns numbers as strings in JSON. Schemas use `z.coerce.number()` to convert at the API boundary.

### Domain Modeling

**Runtime role derivation:** The `role` field (`importer` | `exporter` | `both`) is computed from query results, not stored. A company's role reflects its current data, not a fixed label.

**Type hierarchy:**

- `CompanyListItem` - Name, country, aggregated totals
- `CompanyDetail` - Extends with role, trading partners, commodities

### Frontend Architecture

**SWR cache keys:** Pagination params are part of the cache key, so each page is cached independently. Navigating back to a page hits cache.

**Search vs pagination tradeoff:** Search filters client-side (instant feedback). Pagination is server-side (handles full dataset). Search disables pagination to avoid confusing UX.

---

## Testing Strategy

```bash
npm test
```

The test suite (Vitest) validates:

| Category        | What's Tested                                                                  |
| --------------- | ------------------------------------------------------------------------------ |
| **Happy path**  | All endpoints return correct data shapes, pagination works, sorting is correct |
| **Error cases** | Invalid HTTP methods (405), missing params (400), non-existent companies (404) |
| **SQL logic**   | Aggregation accuracy, pagination offsets, sorting order, date formatting       |
| **Security**    | SQL injection attempts return 404 safely, no database damage                   |

Tests run against a real DuckDB instance to verify actual SQL behavior.

---

## File Guide

| File                            | Purpose                                              |
| ------------------------------- | ---------------------------------------------------- |
| `lib/data/shipments.ts`         | All SQL queries, database initialization, indexes    |
| `pages/api/companies/index.ts`  | Paginated company list endpoint                      |
| `pages/api/companies/[name].ts` | Company detail endpoint                              |
| `pages/api/companies/stats.ts`  | Dashboard statistics endpoint                        |
| `pages/companies.tsx`           | Main dashboard UI (stats, chart, list, detail panel) |
| `types/company.ts`              | Zod schemas and TypeScript types                     |
| `lib/data/shipments.test.ts`    | Data layer tests                                     |
| `__tests__/api/companies/`      | API endpoint tests                                   |
