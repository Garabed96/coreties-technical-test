import { describe, it, expect } from 'vitest';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/companies/stats';
import { StatsResponseSchema } from '@/types/company';

describe('API /api/companies/stats', () => {
  it('should return 200 with stats data for GET request', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('totalImporters');
    expect(data).toHaveProperty('totalExporters');
    expect(data).toHaveProperty('topCommodities');
    expect(data).toHaveProperty('monthlyVolume');
  });

  it('should return valid data that passes Zod validation', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());

    // Should not throw
    const validated = StatsResponseSchema.parse(data);
    expect(validated.totalImporters).toBeGreaterThan(0);
    expect(validated.totalExporters).toBeGreaterThan(0);
    expect(validated.topCommodities.length).toBe(5);
    expect(validated.monthlyVolume.length).toBeGreaterThan(0);
  });

  it('should return 405 for non-GET requests', async () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    for (const method of methods) {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: method as never,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    }
  });

  it('should return top commodities sorted by weight descending', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());

    for (let i = 0; i < data.topCommodities.length - 1; i++) {
      expect(data.topCommodities[i].kg).toBeGreaterThanOrEqual(
        data.topCommodities[i + 1].kg
      );
    }
  });

  it('should return monthly volume with correct date format', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());

    data.monthlyVolume.forEach((item: { month: string; kg: number }) => {
      // Format should be "MMM YYYY" like "Jan 2024"
      expect(item.month).toMatch(/^[A-Z][a-z]{2} \d{4}$/);
    });
  });
});
