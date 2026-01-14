import type { NextApiRequest, NextApiResponse } from 'next';
import { loadShipments } from '@/lib/data/shipments';
import { Shipment } from '@/types/shipment';

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
  res: NextApiResponse<{ data: Shipment[]; total: number } | { error: string }>
) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  try {
    const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);
    const offset = parsePositiveInt(req.query.offset, 0);

    const result = await loadShipments({ limit, offset });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
}
