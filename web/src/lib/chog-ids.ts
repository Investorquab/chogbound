import full from '../../../traits.full.json';

export type ChogEntry = { name: string; attributes: { trait_type: string; value: string }[] };
/** Server-side only: the full 1,969-token scan is large and must not be imported by client code. */
export const chogSource = full as unknown as Record<string, ChogEntry>;
export const MAX_IDS = 50;

/** Parse "1,308,1798" into unique token ids, or null when anything is missing, malformed or out of range. */
export function parseIds(raw: string | null): number[] | null {
  if (!raw) return null;
  const parts = raw.split(',').map((p) => p.trim());
  if (parts.length === 0 || parts.length > MAX_IDS || parts.some((p) => !/^\d{1,4}$/.test(p))) return null;
  const ids = [...new Set(parts.map(Number))];
  return ids.every((id) => id >= 1 && id <= 1969 && chogSource[String(id)]) ? ids : null;
}
