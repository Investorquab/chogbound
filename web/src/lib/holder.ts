import { fighterFromToken } from 'chogbound-sim/src/stats.js';
import type { TraitToken } from 'chogbound-sim/src/types.js';
import { safeStorageGet, safeStorageRemove, safeStorageSet, type CastEntry } from './cast.js';

export type StoredHolder = { address: string; ids: number[]; complete: boolean; connectedAt: string };
export const HOLDER_KEY = 'chogbound.holder';

export function getHolder(): StoredHolder | null {
  try { const raw = safeStorageGet(HOLDER_KEY); return raw ? (JSON.parse(raw) as StoredHolder) : null; } catch { return null; }
}
export function saveHolder(holder: Omit<StoredHolder, 'connectedAt'>): StoredHolder {
  const stored = { ...holder, connectedAt: new Date().toISOString() };
  safeStorageSet(HOLDER_KEY, JSON.stringify(stored));
  return stored;
}
export function clearHolder(): void { safeStorageRemove(HOLDER_KEY); }
export function isHolderToken(tokenId: string | number): boolean { return Boolean(getHolder()?.ids.includes(Number(tokenId))); }
export const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

/** Traits and fighters for owned Chog numbers, fetched from our own route in pages of 50. */
export async function fetchChogEntries(ids: number[], fetchImpl: typeof fetch = fetch): Promise<CastEntry[]> {
  const entries: CastEntry[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const res = await fetchImpl(`/api/chogs?ids=${ids.slice(i, i + 50).join(',')}`);
    if (!res.ok) throw new Error(`Chog traits request failed with ${res.status}`);
    const body = (await res.json()) as { chogs: { id: number; metadata: TraitToken }[] };
    for (const chog of body.chogs) entries.push({ tokenId: String(chog.id), metadata: chog.metadata, fighter: fighterFromToken(String(chog.id), chog.metadata) });
  }
  return entries;
}
