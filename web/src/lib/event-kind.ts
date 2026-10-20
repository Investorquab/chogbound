import type { FightEvent, Side } from 'chogbound-sim/src/types.js';

export type EventKind = 'crit' | 'hit' | 'miss' | 'dodge' | 'heal' | 'burn' | 'ko';
export function isKnockout(event: FightEvent): boolean {
  const target: Side = event.actor === 'a' ? 'b' : 'a';
  return event.damage > 0 && event.hp_after[target] === 0;
}
/** What happened in one event, for the burst, the ticker and the sound. */
export function eventKind(event: FightEvent): EventKind {
  if (isKnockout(event)) return 'ko';
  if (event.action === 'heal') return 'heal';
  if (event.action === 'burn') return 'burn';
  if (event.outcome === 'crit') return 'crit';
  if (event.outcome === 'hit') return 'hit';
  if (event.outcome === 'dodge') return 'dodge';
  return 'miss';
}
