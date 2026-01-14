import type { NextApiRequest, NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { getCompanies } from '@/lib/data/shipments';
import { CompaniesResponse, CompaniesResponseSchema } from '@/types/company';

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;

function parsePositiveInt(
  value: unknown,
  defaultValue: number,
  max?: number
): number {
  const parsed = parseInt(value as string, 10);
  if (isNaN(parsed) || parsed < 0) {
    return defaultValue;
  }
  if (max !== undefined && parsed > max) {
    return max;
  }
  return parsed;
}

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

    const result = await getCompanies({ limit, offset });
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
