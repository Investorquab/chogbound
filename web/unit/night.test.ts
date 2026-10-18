import { describe, expect, it } from 'vitest';
import { simulate } from 'chogbound-sim/src/fight.js';
import { fighterFromToken } from 'chogbound-sim/src/stats.js';
import { MS_PER_NIGHT, TOTAL_CHOGS, autopilotPlan, msUntilNextNight, nightNumber, nightSeed, rivalIdFor } from '../src/lib/night';
import { chogSource } from '../src/lib/chog-ids';
import { nightFights, seasonStandings } from '../src/lib/standings';

describe('night clock', () => {
  it('starts Night 1 on 9 October 2026 UTC and ticks at 00:00 UTC', () => {
    expect(nightNumber(new Date('2026-10-09T00:00:00Z'))).toBe(1);
    expect(nightNumber(new Date('2026-10-09T23:59:59Z'))).toBe(1);
    expect(nightNumber(new Date('2026-10-10T00:00:00Z'))).toBe(2);
    expect(nightNumber(new Date('2026-10-17T12:00:00Z'))).toBe(9);
    expect(nightNumber(new Date('2026-10-23T15:00:00Z'))).toBe(15);
    expect(nightNumber(new Date('2026-01-01T00:00:00Z'))).toBe(1);
  });
  it('counts down to the next night', () => {
    expect(msUntilNextNight(new Date('2026-10-17T23:00:00Z'))).toBe(3_600_000);
    expect(msUntilNextNight(new Date('2026-10-17T00:00:00Z'))).toBe(MS_PER_NIGHT);
  });
});
describe('rivals', () => {
  it('are deterministic, in range, and never the Chog itself', () => {
    for (let id = 1; id <= TOTAL_CHOGS; id++) { const r = rivalIdFor(9, id); expect(r).toBeGreaterThanOrEqual(1); expect(r).toBeLessThanOrEqual(TOTAL_CHOGS); expect(r).not.toBe(id); expect(rivalIdFor(9, id)).toBe(r); }
  });
  it('are drawn from across the whole collection and change from night to night', () => {
    const night9 = new Set(Array.from({ length: TOTAL_CHOGS }, (_, i) => rivalIdFor(9, i + 1)));
    expect(night9.size).toBeGreaterThan(1100);
    let same = 0; for (let id = 1; id <= TOTAL_CHOGS; id++) if (rivalIdFor(9, id) === rivalIdFor(10, id)) same++;
    expect(same).toBeLessThan(20);
  });
});
describe('standings', () => {
  const rows = seasonStandings(4);
  it('rank every Chog once, ordered by wins, with four fights each', () => {
    expect(rows).toHaveLength(TOTAL_CHOGS);
    expect(rows.map((r) => r.rank)).toEqual(Array.from({ length: TOTAL_CHOGS }, (_, i) => i + 1));
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].wins).toBeGreaterThanOrEqual(rows[i].wins);
    for (const r of rows) expect(r.wins + r.losses).toBe(4);
  });
  it('are reproducible: the same night gives identical standings', () => { expect(seasonStandings(4)).toEqual(rows); });
  it('match a direct simulation with the same seed the game uses for a player', () => {
    for (const id of [1, 308, 1798]) {
      const rival = rivalIdFor(3, id); const you = fighterFromToken(String(id), chogSource[String(id)]); const them = fighterFromToken(String(rival), chogSource[String(rival)]);
      const r = simulate(you, them, autopilotPlan(you), autopilotPlan(them), nightSeed(3, id, rival));
      expect(nightFights(3)[id - 1].won, `token ${id}`).toBe(r.summary.winner === 'a');
    }
  });
  it('give a believable spread rather than one dominant Chog', () => {
    expect(rows[0].wins).toBeLessThanOrEqual(4); expect(rows.filter((r) => r.wins === 4).length).toBeGreaterThan(20); expect(rows.filter((r) => r.wins === 0).length).toBeGreaterThan(20);
  });
});
