import { simulate } from 'chogbound-sim/src/fight.js';
import type { Plan, SimResult } from 'chogbound-sim/src/types.js';
import { byTokenId, DEFAULT_PLAN, planForRival, registerEntries, rivalFor, safeStorageGet, safeStorageSet } from './cast.js';
import { fetchChogEntries } from './holder.js';
import { nightNumber, nightSeed, rivalIdFor } from './night.js';

export const SELECTED_TOKEN_KEY = 'chogbound.selected-token';
export const LOCKED_PLAN_KEY = 'chogbound.locked-plan';
export const LAST_FIGHT_KEY = 'chogbound.last-fight';
export const FIGHT_HISTORY_KEY = 'chogbound.fight-history';
export type StoredFight = { youId: string; rivalId: string; planYou: Plan; planRival: Plan; result: SimResult; night: number; createdAt: string };

export function getSelectedTokenId(): string {
  return safeStorageGet(SELECTED_TOKEN_KEY) ?? '640';
}
export function getLockedPlan(): { plan: Plan; locked: boolean } {
  try {
    const raw = safeStorageGet(LOCKED_PLAN_KEY);
    if (!raw) return { plan: DEFAULT_PLAN, locked: false };
    const value = JSON.parse(raw) as { plan?: Plan; locked?: boolean };
    return { plan: value.plan ?? DEFAULT_PLAN, locked: value.locked === true };
  } catch { return { plan: DEFAULT_PLAN, locked: false }; }
}

export function runFight(youId: string, rivalId?: string, plan?: Plan): StoredFight {
  const you = byTokenId(youId);
  const rival = rivalId ? byTokenId(rivalId) : rivalFor(you.tokenId);
  const selectedPlan = plan ?? getLockedPlan().plan;
  const rivalPlan = planForRival(rival);
  const night = nightNumber();
  const seed = nightSeed(night, you.tokenId, rival.tokenId);
  const result = simulate(you.fighter, rival.fighter, selectedPlan, rivalPlan, seed);
  const stored: StoredFight = { youId: you.tokenId, rivalId: rival.tokenId, planYou: selectedPlan, planRival: rivalPlan, result, night, createdAt: new Date().toISOString() };
  safeStorageSet(LAST_FIGHT_KEY, JSON.stringify(stored));
  try {
    const old = JSON.parse(safeStorageGet(FIGHT_HISTORY_KEY) ?? '[]') as StoredFight[];
    safeStorageSet(FIGHT_HISTORY_KEY, JSON.stringify([stored, ...old.filter((f) => !(f.youId === stored.youId && f.rivalId === stored.rivalId && f.night === stored.night))].slice(0, 50)));
  } catch { safeStorageSet(FIGHT_HISTORY_KEY, JSON.stringify([stored])); }
  return stored;
}

export function getStoredFight(): StoredFight | null {
  try {
    const raw = safeStorageGet(LAST_FIGHT_KEY);
    return raw ? JSON.parse(raw) as StoredFight : null;
  } catch { return null; }
}

export function getHistory(): StoredFight[] {
  try { return JSON.parse(safeStorageGet(FIGHT_HISTORY_KEY) ?? '[]') as StoredFight[]; } catch { return []; }
}

export function runComparison(firstId: string, secondId: string, rivalId: string, plan: Plan) {
  const rival = byTokenId(rivalId);
  const run = (youId: string) => {
    const you = byTokenId(youId);
    const result = simulate(you.fighter, rival.fighter, plan, planForRival(rival), `${nightNumber()}:${you.tokenId}:${rival.tokenId}:compare`);
    return { you, rival, result };
  };
  return [run(firstId), run(secondId)] as const;
}

/**
 * Tonight's fight for a Chog: the rival is drawn from all 1,969 Chogs by the night's seed. If the rival's traits cannot be
 * fetched (offline, route down) it falls back to a demo rival so a guest can always play.
 */
export async function startTonight(youId: string, plan?: Plan, fetchImpl: typeof fetch = fetch): Promise<StoredFight> {
  const rivalId = String(rivalIdFor(nightNumber(), youId));
  if (byTokenId(rivalId).tokenId !== rivalId) {
    try { registerEntries(await fetchChogEntries([Number(rivalId)], fetchImpl)); } catch { return runFight(youId, undefined, plan); }
  }
  return runFight(youId, rivalId, plan);
}
