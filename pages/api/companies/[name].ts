import type { NextApiRequest, NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { getCompanyDetail } from '@/lib/data/shipments';
import { CompanyDetail, CompanyDetailSchema } from '@/types/company';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CompanyDetail | { error: string }>
) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  const { name } = req.query;

  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Company name is required' });
    return;
  }

  try {
    const companyName = decodeURIComponent(name);
    const company = await getCompanyDetail(companyName);

    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    const validated = CompanyDetailSchema.parse(company);
    res.status(200).json(validated);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', error.issues);
      res.status(400).json({ error: 'Invalid response data' });
      return;
    }
    console.error('Error fetching company detail:', error);
    res.status(500).json({ error: 'Failed to fetch company detail' });
  }
}
