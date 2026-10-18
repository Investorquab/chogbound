import { simulate } from 'chogbound-sim/src/fight.js';
import { fighterFromToken } from 'chogbound-sim/src/stats.js';
import type { Fighter } from 'chogbound-sim/src/types.js';
import { chogSource } from './chog-ids';
import { TOTAL_CHOGS, autopilotPlan, nightSeed, rivalIdFor } from './night';

/** Server only. Standings are recomputed from the simulator, never stored: anyone can reproduce them. */
let fighters: Fighter[] | null = null;
const fighterList = (): Fighter[] => (fighters ??= Array.from({ length: TOTAL_CHOGS }, (_, i) => fighterFromToken(String(i + 1), chogSource[String(i + 1)])));
export type NightFight = { won: boolean; upset: boolean; margin: number };
const nightCache = new Map<number, NightFight[]>();

/** Every Chog fights one rival each night with autopilot plans. Index 0 is token 1. */
export function nightFights(night: number): NightFight[] {
  const cached = nightCache.get(night);
  if (cached) return cached;
  const list = fighterList();
  const out = list.map((you, i) => {
    const id = i + 1; const rival = list[rivalIdFor(night, id) - 1];
    const r = simulate(you, rival, autopilotPlan(you), autopilotPlan(rival), nightSeed(night, id, rivalIdFor(night, id)));
    return { won: r.summary.winner === 'a', upset: r.summary.upset && r.summary.winner === 'a', margin: r.summary.final_hp.a - r.summary.final_hp.b };
  });
  nightCache.set(night, out);
  return out;
}
export type Row = { id: number; name: string; tier: string; wins: number; losses: number; upsets: number; xp: number; margin: number; rank: number };

/** Season standings through `throughNight`: wins, then upsets, then total HP margin, then token id. */
export function seasonStandings(throughNight: number): Row[] {
  const list = fighterList();
  const rows: Row[] = list.map((f, i) => ({ id: i + 1, name: chogSource[String(i + 1)].name, tier: f.tier, wins: 0, losses: 0, upsets: 0, xp: 0, margin: 0, rank: 0 }));
  for (let night = 1; night <= throughNight; night++) {
    nightFights(night).forEach((fight, i) => {
      const row = rows[i];
      if (fight.won) { row.wins++; row.xp += 3 + (fight.upset ? 2 : 0); if (fight.upset) row.upsets++; } else { row.losses++; row.xp += 1; }
      row.margin += fight.margin;
    });
  }
  rows.sort((a, b) => b.wins - a.wins || b.upsets - a.upsets || b.margin - a.margin || a.id - b.id);
  rows.forEach((row, i) => { row.rank = i + 1; });
  return rows;
}
