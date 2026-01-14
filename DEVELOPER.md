# Developer Notes

## Architecture

```
pages/api/* → lib/data/shipments.ts → DuckDB (in-memory)
     ↓
pages/*.tsx ← useSWR (client-side caching)
```

Data flows from JSON → DuckDB → API routes → SWR → React components.

## Key Decisions

**SQL**

- CTE + UNION ALL merges importers/exporters, then GROUP BY aggregates companies appearing in both roles
- `z.coerce.number()` in Zod schemas handles DuckDB returning numbers as strings in JSON

**Full-stack Integration**

- Stats endpoint (`/api/companies/stats`) separate from list so stats don't refetch on pagination
- Company detail uses 3 queries (stats, partners, commodities) to prevent N+1

**Domain Modeling**

- Companies keyed by (name, country) tuple—same company can be importer AND exporter
- `role` field derived from query results at runtime, not stored

**Frontend State**

- SWR cache keys include pagination params for independent page caching
- Search is client-side, pagination is server-side
