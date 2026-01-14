import { describe, it, expect, beforeAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/companies/[name]';
import { CompanyDetailSchema } from '@/types/company';
import { getCompanies } from '@/lib/data/shipments';

describe('API /api/companies/[name]', () => {
  let existingCompanyName: string;

  beforeAll(async () => {
    // Get a real company name to test with
    const companies = await getCompanies({ limit: 1 });
    existingCompanyName = companies.data[0].name;
  });

  it('should return 200 with company detail for valid company', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { name: existingCompanyName },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('name', existingCompanyName);
  });

  it('should return valid data that passes Zod validation', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { name: existingCompanyName },
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());

    // Should not throw
    const validated = CompanyDetailSchema.parse(data);
    expect(validated.name).toBe(existingCompanyName);
    expect(['importer', 'exporter', 'both']).toContain(validated.role);
  });

  it('should return 404 for non-existent company', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { name: 'NonExistentCompanyXYZ123' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
  });

  it('should return 400 when name parameter is missing', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
  });

  it('should return 405 for non-GET requests', async () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    for (const method of methods) {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: method as never,
        query: { name: existingCompanyName },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    }
  });

  it('should return company with required detail fields', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { name: existingCompanyName },
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());

    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('country');
    expect(data).toHaveProperty('role');
    expect(data).toHaveProperty('totalShipments');
    expect(data).toHaveProperty('totalWeight');
    expect(data).toHaveProperty('topTradingPartners');
    expect(data).toHaveProperty('topCommodities');
  });

  it('should return top trading partners as array', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { name: existingCompanyName },
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());

    expect(Array.isArray(data.topTradingPartners)).toBe(true);

    if (data.topTradingPartners.length > 0) {
      const partner = data.topTradingPartners[0];
      expect(partner).toHaveProperty('name');
      expect(partner).toHaveProperty('country');
      expect(partner).toHaveProperty('shipments');
    }
  });

  it('should return top commodities as array', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { name: existingCompanyName },
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());

    expect(Array.isArray(data.topCommodities)).toBe(true);

    if (data.topCommodities.length > 0) {
      const commodity = data.topCommodities[0];
      expect(commodity).toHaveProperty('name');
      expect(commodity).toHaveProperty('kg');
    }
  });

  it('should handle URL-encoded company names', async () => {
    // Company names with spaces should work when URL encoded
    const encodedName = encodeURIComponent(existingCompanyName);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { name: encodedName },
    });

    await handler(req, res);

    // Should either return 200 (found) or 404 (not found due to encoding)
    // but should not error
    expect([200, 404]).toContain(res._getStatusCode());
  });

  it('should be safe against SQL injection attempts', async () => {
    const maliciousNames = [
      "'; DROP TABLE shipments; --",
      '1 OR 1=1',
      "company' OR '1'='1",
    ];

    for (const name of maliciousNames) {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { name },
      });

      await handler(req, res);

      // Should return 404 (not found) without crashing
      expect(res._getStatusCode()).toBe(404);
    }
  });
});
