import type { NextApiRequest, NextApiResponse } from 'next';
import { loadShipments } from '@/lib/data/shipments';
import { Shipment } from '@/types/shipment';
import { parsePositiveInt, MAX_LIMIT, DEFAULT_LIMIT } from '@/lib/utils/api';

/**
 * GET /api/shipments - Paginated list of raw shipment records.
 *
 * @query limit - Max shipments to return (default: 100, max: 1000)
 * @query offset - Number to skip for pagination (default: 0)
 *
 * @returns - { data: Shipment[], total: number } Success Response
 * @throws 405 - Method not allowed
 * @throws 500 - Server error
 */
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
