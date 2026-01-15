import path from 'path';
import { DuckDBInstance } from '@duckdb/node-api';
import { Shipment } from '@/types/shipment';
import {
  CompanyListItem,
  CompanyDetail,
  StatsResponse,
  TopCommodity,
  MonthlyVolumeItem,
  TradingPartner,
  Commodity,
} from '@/types/company';

let instance: DuckDBInstance | null = null;
let tableInitialized = false;

async function getInstance(): Promise<DuckDBInstance> {
  if (!instance) {
    instance = await DuckDBInstance.create(':memory:');
  }
  return instance;
}

/**
 * Returns raw shipment records with pagination support.
 *
 * Used by the /api/shipments endpoint to display the base shipment data.
 * Results are ordered by shipment_date DESC (most recent first).
 *
 * @param options.limit - Max shipments to return (default: 100)
 * @param options.offset - Number of shipments to skip for pagination (default: 0)
 * @returns Paginated shipment list with total count for pagination UI
 */
export async function loadShipments(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ data: Shipment[]; total: number }> {
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const countResult = await query<{ total: number }>(
    `SELECT COUNT(*) as total FROM shipments`
  );
  const total = countResult[0]?.total ?? 0;

  const data = await query<Shipment>(`
    SELECT * FROM shipments
    ORDER BY shipment_date DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return { data, total };
}

/**
 * Transforms raw shipment records into company-level aggregates (unpaginated).
 *
 * Similar to getCompanies() but returns ALL companies without pagination.
 * Used primarily for testing to verify the CTE + UNION ALL aggregation logic.
 *
 * Companies appearing as both importer and exporter are merged into single rows
 * with combined totalShipments and totalWeight across both roles.
 *
 * @returns All companies sorted by totalShipments DESC
 */
export async function transformShipmentsToCompanies(): Promise<
  CompanyListItem[]
> {
  return query<CompanyListItem>(`
    WITH importers AS (
      SELECT
        importer_name as name,
        importer_country as country,
        COUNT(*) as shipments,
        CAST(SUM(weight_metric_tonnes * 1000) AS INTEGER) as weight
      FROM shipments
      GROUP BY importer_name, importer_country
    ),
    exporters AS (
      SELECT
        exporter_name as name,
        exporter_country as country,
        COUNT(*) as shipments,
        CAST(SUM(weight_metric_tonnes * 1000) AS INTEGER) as weight
      FROM shipments
      GROUP BY exporter_name, exporter_country
    )
    SELECT
      name,
      country,
      CAST(SUM(shipments) AS INTEGER) as totalShipments,
      CAST(SUM(weight) AS INTEGER) as totalWeight
    FROM (
      SELECT * FROM importers
      UNION ALL
      SELECT * FROM exporters
    ) combined
    GROUP BY name, country
    ORDER BY totalShipments DESC
  `);
}

/**
 * Returns aggregated statistics for the dashboard cards and chart.
 *
 * Fetches three independent metrics in parallel-safe queries:
 * - **totalImporters/totalExporters**: COUNT(DISTINCT) on name columns
 * - **topCommodities**: Top 5 commodities ranked by total weight (kg)
 * - **monthlyVolume**: Shipment weight aggregated by month for the bar chart
 *
 * Note: A company can be counted in BOTH totalImporters and totalExporters
 * if it appears in both roles—these are not mutually exclusive counts.
 *
 * @returns Dashboard stats object matching StatsResponse schema
 */
export async function getCompanyStats(): Promise<StatsResponse> {
  // Get company counts
  const counts = await query<{
    total_importers: number;
    total_exporters: number;
  }>(`
    SELECT
      COUNT(DISTINCT importer_name) as total_importers,
      COUNT(DISTINCT exporter_name) as total_exporters
    FROM shipments
  `);

  // Get top 5 commodities by weight
  const topCommodities = await query<TopCommodity>(`
    SELECT
      commodity_name as commodity,
      CAST(SUM(weight_metric_tonnes * 1000) AS INTEGER) as kg
    FROM shipments
    GROUP BY commodity_name
    ORDER BY kg DESC
    LIMIT 5
  `);

  // Get monthly volume
  const monthlyVolume = await query<MonthlyVolumeItem>(`
    SELECT
      strftime(CAST(MIN(shipment_date) AS DATE), '%b %Y') as month,
      CAST(SUM(weight_metric_tonnes * 1000) AS INTEGER) as kg
    FROM shipments
    GROUP BY strftime(CAST(shipment_date AS DATE), '%Y-%m')
    ORDER BY strftime(CAST(MIN(shipment_date) AS DATE), '%Y-%m')
  `);

  return {
    totalImporters: counts[0]?.total_importers ?? 0,
    totalExporters: counts[0]?.total_exporters ?? 0,
    topCommodities,
    monthlyVolume,
  };
}

/**
 * Returns a paginated list of companies with aggregated shipment statistics.
 *
 * Companies can appear as both importers and exporters in the shipments data.
 * This function uses CTE + UNION ALL to merge both roles, then GROUP BY (name, country)
 * to deduplicate and sum totals across roles. A company that imported 10 shipments
 * and exported 5 will show totalShipments: 15.
 *
 * Results are sorted by totalShipments DESC (most active companies first).
 *
 * @param options.limit - Max companies to return (default: 100)
 * @param options.offset - Number of companies to skip for pagination (default: 0)
 * @returns Paginated company list with total count for pagination UI
 */
export async function getCompanies(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ data: CompanyListItem[]; total: number }> {
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  // Get total count of unique companies
  const countResult = await query<{ total: number }>(`
    SELECT COUNT(*) as total FROM (
      SELECT DISTINCT name, country FROM (
        SELECT importer_name as name, importer_country as country FROM shipments
        UNION
        SELECT exporter_name as name, exporter_country as country FROM shipments
      )
    )
  `);
  const total = countResult[0]?.total ?? 0;

  // Get paginated company list
  const data = await query<CompanyListItem>(`
    WITH importers AS (
      SELECT
        importer_name as name,
        importer_country as country,
        COUNT(*) as shipments,
        CAST(SUM(weight_metric_tonnes * 1000) AS INTEGER) as weight
      FROM shipments
      GROUP BY importer_name, importer_country
    ),
    exporters AS (
      SELECT
        exporter_name as name,
        exporter_country as country,
        COUNT(*) as shipments,
        CAST(SUM(weight_metric_tonnes * 1000) AS INTEGER) as weight
      FROM shipments
      GROUP BY exporter_name, exporter_country
    )
    SELECT
      name,
      country,
      CAST(SUM(shipments) AS INTEGER) as totalShipments,
      CAST(SUM(weight) AS INTEGER) as totalWeight
    FROM (
      SELECT * FROM importers
      UNION ALL
      SELECT * FROM exporters
    ) combined
    GROUP BY name, country
    ORDER BY totalShipments DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return { data, total };
}

/**
 * Returns detailed information for a specific company by name.
 *
 * Uses 3 optimized queries instead of N+1 pattern:
 * 1. **Company stats** - UNION of importer and exporter roles to get totals
 * 2. **Trading partners** - Top 5 companies this company trades with (both directions)
 * 3. **Top commodities** - Top 5 commodities by weight for this company
 *
 * The `role` field is derived at runtime from query results:
 * - 'importer' if only appears as importer
 * - 'exporter' if only appears as exporter
 * - 'both' if appears in both roles
 *
 * SQL injection is prevented by escaping single quotes in the company name.
 *
 * @param companyName - The exact company name to look up
 * @returns CompanyDetail object, or null if company not found
 */
export async function getCompanyDetail(
  companyName: string
): Promise<CompanyDetail | null> {
  const escapedName = companyName.replace(/'/g, "''");

  // Query 1: Get company stats as both importer and exporter in one query
  const companyStats = await query<{
    role: string;
    country: string;
    website: string;
    shipments: number;
    weight: number;
  }>(`
    SELECT
      role,
      country,
      website,
      CAST(shipments AS INTEGER) as shipments,
      CAST(weight AS INTEGER) as weight
    FROM (
      SELECT
        'importer' as role,
        importer_country as country,
        importer_website as website,
        COUNT(*) as shipments,
        SUM(weight_metric_tonnes * 1000) as weight
      FROM shipments
      WHERE importer_name = '${escapedName}'
      GROUP BY importer_country, importer_website
      UNION ALL
      SELECT
        'exporter' as role,
        exporter_country as country,
        exporter_website as website,
        COUNT(*) as shipments,
        SUM(weight_metric_tonnes * 1000) as weight
      FROM shipments
      WHERE exporter_name = '${escapedName}'
      GROUP BY exporter_country, exporter_website
    )
  `);

  if (companyStats.length === 0) {
    return null;
  }

  // Aggregate stats from the combined results
  const isImporter = companyStats.some(s => s.role === 'importer');
  const isExporter = companyStats.some(s => s.role === 'exporter');
  const role =
    isImporter && isExporter ? 'both' : isImporter ? 'importer' : 'exporter';

  const totalShipments = companyStats.reduce((sum, s) => sum + s.shipments, 0);
  const totalWeight = companyStats.reduce((sum, s) => sum + s.weight, 0);
  const country = companyStats[0]?.country ?? '';
  const website = companyStats.find(s => s.website)?.website;

  // Query 2: Get all trading partners in one query (both import and export partners)
  const allPartners = await query<TradingPartner>(`
    SELECT name, country, CAST(SUM(shipments) AS INTEGER) as shipments
    FROM (
      SELECT
        exporter_name as name,
        exporter_country as country,
        COUNT(*) as shipments
      FROM shipments
      WHERE importer_name = '${escapedName}'
      GROUP BY exporter_name, exporter_country
      UNION ALL
      SELECT
        importer_name as name,
        importer_country as country,
        COUNT(*) as shipments
      FROM shipments
      WHERE exporter_name = '${escapedName}'
      GROUP BY importer_name, importer_country
    )
    GROUP BY name, country
    ORDER BY shipments DESC
    LIMIT 5
  `);

  // Query 3: Get top commodities for this company
  const topCommodities = await query<Commodity>(`
    SELECT
      commodity_name as name,
      CAST(SUM(weight_metric_tonnes * 1000) AS INTEGER) as kg
    FROM shipments
    WHERE importer_name = '${escapedName}'
       OR exporter_name = '${escapedName}'
    GROUP BY commodity_name
    ORDER BY kg DESC
    LIMIT 5
  `);

  return {
    name: companyName,
    country,
    website: website || undefined,
    role,
    totalShipments,
    totalWeight,
    topTradingPartners: allPartners,
    topCommodities,
  };
}

/**
 * Initializes the DuckDB `shipments` table from the JSON data file.
 *
 * Called automatically before each query—you don't need to call this directly.
 * Uses DuckDB's `read_json_auto()` for zero-config JSON ingestion.
 *
 * Also creates indexes on frequently-filtered columns for query performance:
 * - `idx_importer_name` - Used by company detail and aggregation queries
 * - `idx_exporter_name` - Used by company detail and aggregation queries
 * - `idx_shipment_date` - Used by date ordering and monthly aggregation
 *
 * Initialization is idempotent—subsequent calls are no-ops.
 */
async function ensureTableInitialized(): Promise<void> {
  if (tableInitialized) return;

  const db = await getInstance();
  const connection = await db.connect();
  const filePath = path.join(process.cwd(), 'data', 'shipments.json');

  await connection.run(`
    CREATE TABLE IF NOT EXISTS shipments AS
    SELECT * FROM read_json_auto('${filePath}')
  `);

  // Add indexes for frequently queried columns
  await connection.run(`
    CREATE INDEX IF NOT EXISTS idx_importer_name ON shipments(importer_name)
  `);
  await connection.run(`
    CREATE INDEX IF NOT EXISTS idx_exporter_name ON shipments(exporter_name)
  `);
  await connection.run(`
    CREATE INDEX IF NOT EXISTS idx_shipment_date ON shipments(shipment_date)
  `);

  connection.closeSync();
  tableInitialized = true;
}

/**
 * Execute a SQL query and return the results as an array of objects.
 * The `shipments` table is automatically available — no need for read_json_auto.
 *
 * Example usage:
 * ```ts
 * const results = await query<{ name: string; total: number }>(`
 *   SELECT importer_name as name, COUNT(*) as total
 *   FROM shipments
 *   GROUP BY importer_name
 * `);
 * ```
 */
export async function query<T>(sql: string): Promise<T[]> {
  await ensureTableInitialized();

  const db = await getInstance();
  const connection = await db.connect();

  const reader = await connection.runAndReadAll(sql);
  const rows = reader.getRowObjectsJson();
  connection.closeSync();

  return rows as unknown as T[];
}
