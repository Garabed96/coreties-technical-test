import type { NextApiRequest, NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { getCompanies } from '@/lib/data/shipments';
import { CompaniesResponse, CompaniesResponseSchema } from '@/types/company';
import { parsePositiveInt, MAX_LIMIT, DEFAULT_LIMIT } from '@/lib/utils/api';

/**
 * GET /api/companies - Paginated list of companies with aggregated stats.
 *
 * @query limit - Max companies to return (default: 100, max: 1000)
 * @query offset - Number to skip for pagination (default: 0)
 * @query search - Optional search string to filter companies by name (case-insensitive)
 *
 * @returns - { data: CompanyListItem[], total: number } Success Response
 * @throws 405 - Method not allowed (non-GET requests)
 * @throws 500 - Server error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CompaniesResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  try {
    const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);
    const offset = parsePositiveInt(req.query.offset, 0);
    const search =
      typeof req.query.search === 'string' ? req.query.search : undefined;

    const result = await getCompanies({ limit, offset, search });
    const validated = CompaniesResponseSchema.parse(result);
    res.status(200).json(validated);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', error.issues);
      res.status(400).json({ error: 'Invalid response data' });
      return;
    }
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
}
