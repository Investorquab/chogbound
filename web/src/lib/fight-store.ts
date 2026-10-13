import { simulate } from 'chogbound-sim/src/fight.js';
import type { Plan, SimResult } from 'chogbound-sim/src/types.js';
import { byTokenId, cast, DEFAULT_PLAN, NIGHT_NUMBER, planForRival, rivalFor, safeStorageGet, safeStorageSet } from './cast.js';

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
  const seed = `${NIGHT_NUMBER}:${you.tokenId}:${rival.tokenId}`;
  const result = simulate(you.fighter, rival.fighter, selectedPlan, rivalPlan, seed);
  const stored: StoredFight = { youId: you.tokenId, rivalId: rival.tokenId, planYou: selectedPlan, planRival: rivalPlan, result, night: NIGHT_NUMBER, createdAt: new Date().toISOString() };
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
    const result = simulate(you.fighter, rival.fighter, plan, planForRival(rival), `${NIGHT_NUMBER}:${you.tokenId}:${rival.tokenId}:compare`);
    return { you, rival, result };
  };
  return [run(firstId), run(secondId)] as const;
}

export function simulateCastSeason() {
  return cast.map((you, index) => {
    const rival = cast[(index + 1) % cast.length];
    const planYou = DEFAULT_PLAN;
    const planRival = planForRival(rival);
    const result = simulate(you.fighter, rival.fighter, planYou, planRival, `${NIGHT_NUMBER}:${you.tokenId}:${rival.tokenId}:season`);
    const wins = result.summary.winner === 'a' ? 1 : 0;
    const losses = result.summary.winner === 'b' ? 1 : 0;
    const xp = wins * 3 + losses + (wins && result.summary.upset ? 2 : 0);
    return { you, rival, result, wins, losses, upset: result.summary.upset ? 1 : 0, xp };
  });
}
