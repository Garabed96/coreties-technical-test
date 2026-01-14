import { describe, it, expect } from 'vitest';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/companies';
import { CompaniesResponseSchema } from '@/types/company';

describe('API /api/companies', () => {
  it('should return 200 with companies data for GET request', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should return valid data that passes Zod validation', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());

    // Should not throw
    const validated = CompaniesResponseSchema.parse(data);
    expect(validated.total).toBeGreaterThan(0);
    expect(validated.data.length).toBeGreaterThan(0);
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

  it('should respect limit query parameter', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { limit: '5' },
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());
    expect(data.data.length).toBe(5);
  });

  it('should respect offset query parameter', async () => {
    const { req: req1, res: res1 } = createMocks<
      NextApiRequest,
      NextApiResponse
    >({
      method: 'GET',
      query: { limit: '5', offset: '0' },
    });

    const { req: req2, res: res2 } = createMocks<
      NextApiRequest,
      NextApiResponse
    >({
      method: 'GET',
      query: { limit: '5', offset: '5' },
    });

    await handler(req1, res1);
    await handler(req2, res2);

    const data1 = JSON.parse(res1._getData());
    const data2 = JSON.parse(res2._getData());

    // First company in page 2 should not be in page 1
    const page1Names = data1.data.map((c: { name: string }) => c.name);
    expect(page1Names).not.toContain(data2.data[0].name);
  });

  it('should return companies sorted by totalShipments descending', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { limit: '10' },
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());

    for (let i = 0; i < data.data.length - 1; i++) {
      expect(data.data[i].totalShipments).toBeGreaterThanOrEqual(
        data.data[i + 1].totalShipments
      );
    }
  });

  it('should return companies with required fields', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { limit: '1' },
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());
    const company = data.data[0];

    expect(company).toHaveProperty('name');
    expect(company).toHaveProperty('country');
    expect(company).toHaveProperty('totalShipments');
    expect(company).toHaveProperty('totalWeight');
    expect(typeof company.name).toBe('string');
    expect(typeof company.country).toBe('string');
    expect(typeof company.totalShipments).toBe('number');
    expect(typeof company.totalWeight).toBe('number');
  });

  it('should use default pagination when no params provided', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());
    // Default limit is 100
    expect(data.data.length).toBeLessThanOrEqual(100);
  });

  // Edge case tests for input validation
  it('should use default limit for negative limit values', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { limit: '-5' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    // Should use default limit (100) instead of negative value
    expect(data.data.length).toBeLessThanOrEqual(100);
  });

  it('should use default limit for non-numeric limit values', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { limit: 'abc' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    // Should use default limit (100) instead of invalid value
    expect(data.data.length).toBeLessThanOrEqual(100);
  });

  it('should cap limit at maximum value (1000)', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { limit: '999999' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    // Should cap at 1000 instead of allowing unlimited
    expect(data.data.length).toBeLessThanOrEqual(1000);
  });

  it('should use default offset for negative offset values', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { offset: '-10', limit: '5' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    // Should return first page (offset 0) instead of negative offset
    expect(data.data.length).toBe(5);
  });
});
