import { describe, it, expect, beforeAll } from 'vitest';
import {
  getCompanyStats,
  getCompanies,
  getCompanyDetail,
  transformShipmentsToCompanies,
  loadShipments,
} from './shipments';

// Note: DuckDB returns numbers as strings in JSON format.
// The API layer uses Zod coercion to convert them to numbers.
// These tests verify the raw data layer output.

describe('Data Layer - Shipments', () => {
  describe('loadShipments', () => {
    it('should return paginated shipments with total count', async () => {
      const result = await loadShipments({ limit: 10, offset: 0 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(10);
      // DuckDB returns total as string, coerced to number at API level
      expect(Number(result.total)).toBeGreaterThan(0);
    });

    it('should respect pagination parameters', async () => {
      const page1 = await loadShipments({ limit: 5, offset: 0 });
      const page2 = await loadShipments({ limit: 5, offset: 5 });

      expect(page1.data.length).toBe(5);
      expect(page2.data.length).toBe(5);
      // Both pages should report the same total
      expect(page1.total).toBe(page2.total);
      // Pages should return data (pagination is working)
      expect(page1.data).toBeDefined();
      expect(page2.data).toBeDefined();
    });

    it('should return shipments with required fields', async () => {
      const result = await loadShipments({ limit: 1 });
      const shipment = result.data[0];

      expect(shipment).toHaveProperty('id');
      expect(shipment).toHaveProperty('importer_name');
      expect(shipment).toHaveProperty('exporter_name');
      expect(shipment).toHaveProperty('commodity_name');
      expect(shipment).toHaveProperty('weight_metric_tonnes');
      expect(shipment).toHaveProperty('shipment_date');
    });
  });
});

describe('Data Layer - Companies', () => {
  describe('getCompanyStats', () => {
    it('should return company counts', async () => {
      const stats = await getCompanyStats();

      expect(stats).toHaveProperty('totalImporters');
      expect(stats).toHaveProperty('totalExporters');
      // Values may be strings from DuckDB, coerced at API level
      expect(Number(stats.totalImporters)).toBeGreaterThan(0);
      expect(Number(stats.totalExporters)).toBeGreaterThan(0);
    });

    it('should return top 5 commodities', async () => {
      const stats = await getCompanyStats();

      expect(stats).toHaveProperty('topCommodities');
      expect(Array.isArray(stats.topCommodities)).toBe(true);
      expect(stats.topCommodities.length).toBe(5);

      // Each commodity should have name and weight
      stats.topCommodities.forEach(commodity => {
        expect(commodity).toHaveProperty('commodity');
        expect(commodity).toHaveProperty('kg');
        expect(typeof commodity.commodity).toBe('string');
        expect(typeof commodity.kg).toBe('number');
      });

      // Should be sorted by weight descending
      for (let i = 0; i < stats.topCommodities.length - 1; i++) {
        expect(stats.topCommodities[i].kg).toBeGreaterThanOrEqual(
          stats.topCommodities[i + 1].kg
        );
      }
    });

    it('should return monthly volume data', async () => {
      const stats = await getCompanyStats();

      expect(stats).toHaveProperty('monthlyVolume');
      expect(Array.isArray(stats.monthlyVolume)).toBe(true);
      expect(stats.monthlyVolume.length).toBeGreaterThan(0);

      // Each month should have month string and kg
      stats.monthlyVolume.forEach(month => {
        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('kg');
        expect(typeof month.month).toBe('string');
        expect(typeof month.kg).toBe('number');
        // Month format should be "MMM YYYY"
        expect(month.month).toMatch(/^[A-Z][a-z]{2} \d{4}$/);
      });
    });
  });

  describe('getCompanies', () => {
    it('should return paginated company list with total', async () => {
      const result = await getCompanies({ limit: 10, offset: 0 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(10);
      // DuckDB returns total as string, coerced at API level
      expect(Number(result.total)).toBeGreaterThan(0);
    });

    it('should return companies with required fields', async () => {
      const result = await getCompanies({ limit: 1 });
      const company = result.data[0];

      expect(company).toHaveProperty('name');
      expect(company).toHaveProperty('country');
      expect(company).toHaveProperty('totalShipments');
      expect(company).toHaveProperty('totalWeight');
      expect(typeof company.name).toBe('string');
      expect(typeof company.country).toBe('string');
      expect(typeof company.totalShipments).toBe('number');
      expect(typeof company.totalWeight).toBe('number');
    });

    it('should be sorted by totalShipments descending', async () => {
      const result = await getCompanies({ limit: 10 });

      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].totalShipments).toBeGreaterThanOrEqual(
          result.data[i + 1].totalShipments
        );
      }
    });

    it('should respect pagination offset', async () => {
      const page1 = await getCompanies({ limit: 5, offset: 0 });
      const page2 = await getCompanies({ limit: 5, offset: 5 });

      // Companies should be different between pages
      const page1Names = page1.data.map(c => c.name);
      const page2Names = page2.data.map(c => c.name);

      page2Names.forEach(name => {
        expect(page1Names).not.toContain(name);
      });
    });
  });

  describe('getCompanyDetail', () => {
    let existingCompanyName: string;

    beforeAll(async () => {
      // Get a real company name to test with
      const companies = await getCompanies({ limit: 1 });
      existingCompanyName = companies.data[0].name;
    });

    it('should return null for non-existent company', async () => {
      const result = await getCompanyDetail('NonExistentCompany12345');
      expect(result).toBeNull();
    });

    it('should return company detail for existing company', async () => {
      const detail = await getCompanyDetail(existingCompanyName);

      expect(detail).not.toBeNull();
      expect(detail).toHaveProperty('name', existingCompanyName);
      expect(detail).toHaveProperty('country');
      expect(detail).toHaveProperty('role');
      expect(detail).toHaveProperty('totalShipments');
      expect(detail).toHaveProperty('totalWeight');
      expect(detail).toHaveProperty('topTradingPartners');
      expect(detail).toHaveProperty('topCommodities');
    });

    it('should have valid role value', async () => {
      const detail = await getCompanyDetail(existingCompanyName);

      expect(detail).not.toBeNull();
      expect(['importer', 'exporter', 'both']).toContain(detail!.role);
    });

    it('should return top trading partners with required fields', async () => {
      const detail = await getCompanyDetail(existingCompanyName);

      expect(detail).not.toBeNull();
      expect(Array.isArray(detail!.topTradingPartners)).toBe(true);

      detail!.topTradingPartners.forEach(partner => {
        expect(partner).toHaveProperty('name');
        expect(partner).toHaveProperty('country');
        expect(partner).toHaveProperty('shipments');
        expect(typeof partner.shipments).toBe('number');
      });
    });

    it('should return top commodities with required fields', async () => {
      const detail = await getCompanyDetail(existingCompanyName);

      expect(detail).not.toBeNull();
      expect(Array.isArray(detail!.topCommodities)).toBe(true);

      detail!.topCommodities.forEach(commodity => {
        expect(commodity).toHaveProperty('name');
        expect(commodity).toHaveProperty('kg');
        expect(typeof commodity.kg).toBe('number');
      });
    });

    it('should handle company names with special characters', async () => {
      // Test SQL injection protection
      const result = await getCompanyDetail("'; DROP TABLE shipments; --");
      expect(result).toBeNull();
    });
  });

  describe('transformShipmentsToCompanies', () => {
    it('should return array of companies', async () => {
      const companies = await transformShipmentsToCompanies();

      expect(Array.isArray(companies)).toBe(true);
      expect(companies.length).toBeGreaterThan(0);
    });

    it('should merge companies by (name, country) combination', async () => {
      const companies = await transformShipmentsToCompanies();

      // Check that (name, country) pairs are unique
      const nameCountryPairs = companies.map(c => `${c.name}|${c.country}`);
      const uniquePairs = new Set(nameCountryPairs);
      expect(nameCountryPairs.length).toBe(uniquePairs.size);
    });

    it('should have correct aggregate totals', async () => {
      const companies = await transformShipmentsToCompanies();

      companies.forEach(company => {
        // Values may be strings from DuckDB
        expect(Number(company.totalShipments)).toBeGreaterThan(0);
        expect(Number(company.totalWeight)).toBeGreaterThan(0);
      });
    });
  });
});
