import { createRng } from 'chogbound-sim/src/rng.js';
import type { Fighter, Plan } from 'chogbound-sim/src/types.js';

/**
 * The nightly clock. Night 1 is 9 October 2026 (UTC) and a new night starts every 24 hours at 00:00 UTC.
 * Everything below is a pure function of the night number and token ids, so any visitor can recompute any night's result.
 */
export const NIGHT_ONE_UTC = Date.UTC(2026, 9, 9);
export const MS_PER_NIGHT = 86_400_000;
export const TOTAL_CHOGS = 1969;

export function nightNumber(now: Date = new Date()): number {
  return Math.max(1, Math.floor((now.getTime() - NIGHT_ONE_UTC) / MS_PER_NIGHT) + 1);
}
export function msUntilNextNight(now: Date = new Date()): number {
  return NIGHT_ONE_UTC + nightNumber(now) * MS_PER_NIGHT - now.getTime();
}
/** The rival a Chog is drawn against on a given night, from all 1,969 Chogs and never itself. */
export function rivalIdFor(night: number, tokenId: string | number): number {
  const you = Number(tokenId);
  const id = createRng(`night-${night}:rival:${you}`).int(TOTAL_CHOGS) + 1;
  return id === you ? (id % TOTAL_CHOGS) + 1 : id;
}
export const nightSeed = (night: number, youId: string | number, rivalId: string | number) => `${night}:${youId}:${rivalId}`;
/** Autopilot plan used for every rival and for everyone in the public standings. */
export function autopilotPlan(fighter: Pick<Fighter, 'signature'>): Plan {
  return { temperament: 'Cool', move: fighter.signature ?? 'Headbutt', risk: 'Even' };
}
