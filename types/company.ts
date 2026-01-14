import { z } from 'zod';
/**
 * TODO: Define your Company interface here.
 *
 * Your SQL query in transformShipmentsToCompanies() should return data
 * matching this interface.
 */
// ============================================
// Company Schemas
// Note: Using z.coerce.number() because DuckDB returns numbers as strings in JSON
// ============================================

/** Company list item (for table display) */
export const CompanyListItemSchema = z.object({
  name: z.string(),
  country: z.string(),
  totalShipments: z.coerce.number(),
  totalWeight: z.coerce.number(), // in kg
});

/** Trading partner in company detail */
export const TradingPartnerSchema = z.object({
  name: z.string(),
  country: z.string(),
  shipments: z.coerce.number(),
});

/** Commodity in company detail */
export const CommoditySchema = z.object({
  name: z.string(),
  kg: z.coerce.number(),
});

/** Full company detail (for detail panel) */
export const CompanyDetailSchema = z.object({
  name: z.string(),
  country: z.string(),
  website: z.string().optional(),
  role: z.enum(['importer', 'exporter', 'both']),
  totalShipments: z.coerce.number(),
  totalWeight: z.coerce.number(), // in kg
  topTradingPartners: z.array(TradingPartnerSchema),
  topCommodities: z.array(CommoditySchema),
});

// ============================================
// Stats Response Schemas (matching UI exactly)
// ============================================

/** Stats for dashboard cards */
export const StatsSchema = z.object({
  totalImporters: z.coerce.number(),
  totalExporters: z.coerce.number(),
});

/** Monthly volume for chart - format: "May 2025" */
export const MonthlyVolumeItemSchema = z.object({
  month: z.string(), // "MMM YYYY" format
  kg: z.coerce.number(),
});

/** Top commodities - note: uses "commodity" not "name" */
export const TopCommoditySchema = z.object({
  commodity: z.string(),
  kg: z.coerce.number(),
});

/** Combined stats response */
export const StatsResponseSchema = z.object({
  totalImporters: z.coerce.number(),
  totalExporters: z.coerce.number(),
  topCommodities: z.array(TopCommoditySchema),
  monthlyVolume: z.array(MonthlyVolumeItemSchema),
});

/** Companies list response */
export const CompaniesResponseSchema = z.object({
  data: z.array(CompanyListItemSchema),
  total: z.coerce.number(),
});

// ============================================
// Type Exports
// ============================================

export type CompanyListItem = z.infer<typeof CompanyListItemSchema>;
export type CompanyDetail = z.infer<typeof CompanyDetailSchema>;
export type TradingPartner = z.infer<typeof TradingPartnerSchema>;
export type Commodity = z.infer<typeof CommoditySchema>;
export type Stats = z.infer<typeof StatsSchema>;
export type MonthlyVolumeItem = z.infer<typeof MonthlyVolumeItemSchema>;
export type TopCommodity = z.infer<typeof TopCommoditySchema>;
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
export type CompaniesResponse = z.infer<typeof CompaniesResponseSchema>;

// Legacy export for compatibility with existing code
export type Company = CompanyListItem;
