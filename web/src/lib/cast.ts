import metadata from '../../../traits.json';
import { computeStats, fighterFromToken } from 'chogbound-sim/src/stats.js';
import { autopilotPlan } from './night.js';
import type { Fighter, Plan, TraitToken, StatName } from 'chogbound-sim/src/types.js';

export type TokenMetadata = TraitToken & { image?: string };
export type CastEntry = { tokenId: string; metadata: TokenMetadata; fighter: Fighter };
const source = metadata as Record<string, TokenMetadata>;
export const cast: CastEntry[] = Object.entries(source).map(([tokenId, token]) => ({
  tokenId,
  metadata: token,
  fighter: fighterFromToken(tokenId, token),
}));
export const STAT_NAMES: StatName[] = ['GRIT', 'PUNCH', 'SWIFT', 'NERVE'];
export const CORE_MOVES = ['Headbutt', 'Quick Feet', 'Iron Hide'] as const;
export const TEMPERAMENTS = ['Feisty', 'Cool', 'Wild'] as const;
export const RISKS = ['Safe', 'Even', 'Gamble'] as const;
export const DEFAULT_PLAN: Plan = { temperament: 'Feisty', move: 'Headbutt', risk: 'Even' };

/** Chogs a connected wallet owns that are not in the 24 demo cast. Kept in memory and mirrored to storage across pages. */
const registry = new Map<string, CastEntry>();
const REGISTRY_KEY = 'chogbound.holder-chogs';
let hydrated = false;
function hydrateRegistry() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try { for (const entry of Object.values(JSON.parse(safeStorageGet(REGISTRY_KEY) ?? '{}') as Record<string, CastEntry>)) registry.set(entry.tokenId, entry); } catch { /* Empty-registry fallback. */ }
}
export function registerEntries(entries: CastEntry[]): void {
  hydrateRegistry();
  for (const entry of entries) registry.set(entry.tokenId, entry);
  safeStorageSet(REGISTRY_KEY, JSON.stringify(Object.fromEntries(registry)));
}
export function clearRegistry(): void { registry.clear(); safeStorageRemove(REGISTRY_KEY); }
export function byTokenId(tokenId: string | number | null | undefined): CastEntry {
  const id = String(tokenId);
  const demo = cast.find((entry) => entry.tokenId === id);
  if (demo) return demo;
  hydrateRegistry();
  return registry.get(id) ?? cast[0];
}

export function attributesOf(entry: CastEntry): Record<string, string> {
  return Object.fromEntries(entry.metadata.attributes.map(({ trait_type, value }) => [trait_type, value]));
}

export function traitSummary(entry: CastEntry): string {
  const a = attributesOf(entry);
  return [a.Body, a.Eyes, a.Aura].filter(Boolean).join(' / ') || 'Original traits';
}

export function statBreakdown(entry: CastEntry) {
  const result = computeStats(entry.metadata);
  return STAT_NAMES.map((stat) => ({
    stat,
    total: result.stats[stat],
    bonuses: result.bonuses.filter((bonus) => bonus.stat === stat),
  }));
}

export function traitRows(entry: CastEntry) {
  const a = attributesOf(entry);
  const result = computeStats(entry.metadata);
  const classes: Record<string, string> = {
    Body: result.classes.body,
    Eyes: result.classes.eyes,
    Head: result.classes.head,
    Mouth: result.classes.mouth,
    Aura: result.classes.aura,
    Accessory: result.classes.accessory,
    Tier: entry.fighter.tier,
  };
  const effects: Record<string, string> = {
    Body: 'Stat source', Eyes: entry.fighter.signature ?? 'PUNCH source', Head: 'Stat source',
    Mouth: 'Voice and NERVE source', Aura: result.classes.aura === 'none' ? 'No Aura effect' : 'Fight effect',
    Accessory: result.classes.accessory === 'none' ? 'No Accessory effect' : 'Fight effect', Tier: 'Stat source',
  };
  return Object.entries(a).map(([trait, value]) => ({ trait, value, className: classes[trait] ?? 'Cosmetic', effect: effects[trait] ?? 'Cosmetic' }));
}

export function rivalFor(...excluded: string[]): CastEntry {
  const start = cast.findIndex((entry) => entry.tokenId === excluded[0]);
  for (let offset = 1; offset <= cast.length; offset++) {
    const candidate = cast[(Math.max(start, 0) + offset) % cast.length];
    if (!excluded.includes(candidate.tokenId)) return candidate;
  }
  return cast[0];
}

export function planForRival(entry: CastEntry): Plan {
  return autopilotPlan(entry.fighter);
}

export function safeStorageGet(key: string): string | null {
  try { return typeof window === 'undefined' ? null : window.localStorage.getItem(key); } catch { return null; }
}
export function safeStorageSet(key: string, value: string): boolean {
  try { if (typeof window === 'undefined') return false; window.localStorage.setItem(key, value); return true; } catch { return false; }
}
export function safeStorageRemove(key: string): void {
  try { if (typeof window !== 'undefined') window.localStorage.removeItem(key); } catch { /* Empty-storage fallback. */ }
}
