import type { NextApiRequest, NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { getCompanyStats } from '@/lib/data/shipments';
import { StatsResponse, StatsResponseSchema } from '@/types/company';

/**
 * GET /api/companies/stats - Dashboard statistics.
 *
 * Returns aggregate counts and top commodities for dashboard cards/charts.
 * Separate from /api/companies to avoid refetching stats on pagination.
 *
 * @returns - { StatsResponse (importers, exporters, commodities, monthly volume) } Success Response
 * @throws 405 - Method not allowed
 * @throws 500 - Server error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  try {
    const stats = await getCompanyStats();
    const validated = StatsResponseSchema.parse(stats);
    res.status(200).json(validated);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', error.issues);
      res.status(400).json({ error: 'Invalid response data' });
      return;
    }
    console.error('Error fetching company stats:', error);
    res.status(500).json({ error: 'Failed to fetch company stats' });
  }
}
