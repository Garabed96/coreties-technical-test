# Full-Stack Technical Assessment

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Your Tasks

Transform shipment data into company analytics. The `/companies` page has scaffolded UI with fake data - wire it up with real SQL queries.

### Checklist

- [ ] Define `Company` interface in [`types/company.ts`](types/company.ts)
- [ ] Implement `transformShipmentsToCompanies()` in [`lib/data/shipments.ts`](lib/data/shipments.ts) using SQL
- [ ] Create API endpoint(s) in `pages/api/`
- [ ] Wire up "Total Companies" card (count importers/exporters)
- [ ] Wire up "Top 5 Commodities" card (aggregate by weight)
- [ ] Wire up "Monthly Volume" chart (kg per month)
- [ ] Display company list table with real aggregated data
- [ ] Implement company detail panel (loads when clicking a company)

---

## What We're Evaluating

- **SQL** - aggregations, GROUP BY, filtering, date functions
- **Full-stack integration** - API design, data flow, frontend state
- **Domain modeling** - how you structure the Company type
- **Code clarity** - readable, maintainable code

---

## Supplemental Material

### About the Data

~5,000 shipment records in [`data/shipments.json`](data/shipments.json):

```ts
interface Shipment {
  id: string;
  importer_name: string;
  importer_country: string;
  importer_website: string;
  exporter_name: string;
  exporter_country: string;
  exporter_website: string;
  shipment_date: string; // ISO-8601
  commodity_name: string;
  industry_sector: string;
  weight_metric_tonnes: number;
}
```

### SQL Reference

Data is pre-loaded into a `shipments` table. Use the `query()` helper:

```ts
import { query } from '@/lib/data/shipments';

const results = await query<{ name: string; total: number }>(`
  SELECT importer_name as name, COUNT(*) as total
  FROM shipments
  GROUP BY importer_name
`);
```

DuckDB date functions: [duckdb.org/docs/sql/functions/date](https://duckdb.org/docs/sql/functions/date)

### Context

[Coreties](https://www.coreties.com/) analyzes shipment customs data. A "shipment" = goods moving from an exporter (seller) to an importer (buyer) across countries.

---

## Screenshots

### Homepage

![Homepage - Loaded](screenshots/homepage-loaded.png)
![Homepage - Loading Skeleton](screenshots/homepage-loading-skeleton.png)
![Homepage - Failure State](screenshots/homepage-failure-state.png)

### Companies Page

![Companies - Loaded View 1](screenshots/companies-loaded-1.png)
![Companies - Loaded View 2](screenshots/companies-loaded-2.png)
![Companies - Loading Skeleton](screenshots/companies-loading-skeleton.png)
![Companies - Failure State](screenshots/companies-failure-state.png)
