export const MAX_LIMIT = 1000;
export const DEFAULT_LIMIT = 100;

/**
 * Safely parses query string values into positive integers for pagination.
 *
 * Next.js query params come as `string | string[] | undefined`. This function
 * handles all edge cases: non-numeric input, negative values, and values
 * exceeding a maximum limit—returning sensible defaults instead of NaN or errors.
 *
 * @param value - Raw query parameter (typically `req.query.limit` or `req.query.offset`)
 * @param defaultValue - Fallback when value is missing, non-numeric, or negative
 * @param max - Optional ceiling to prevent excessive values (e.g., limit=999999)
 */
export function parsePositiveInt(
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