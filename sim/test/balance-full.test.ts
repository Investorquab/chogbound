import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildEntries, runBalance } from '../src/harness.js';
import type { TraitToken } from '../src/types.js';

const full: Record<string, TraitToken> = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../traits.full.json'), 'utf8'));

// 100,000 pairs is about 100 fights per token, so per-token win rates carry about 5 points of sampling noise.
// This test therefore checks pooled numbers and noise-corrected spread. The strict per-token targets of
// SIM_SPEC 10.8 are checked by `npm run balance:full` (400,000+ pairs).
describe('full-collection balance (100,000 random pairs, all 1,969 Chogs)', () => {
  const report = runBalance(buildEntries(full), 100_000, 'balance-test');
  const se = (r: { rate: number; played: number }) => Math.sqrt(0.25 / r.played) * 100;
  it('simulates every token', () => { expect(report.tokens).toBe(1969); });
  it('keeps the KO rate between 5 and 25%', () => { expect(report.koRate).toBeGreaterThanOrEqual(5); expect(report.koRate).toBeLessThanOrEqual(25); });
  it('keeps the noise-corrected spread of token win rates at or under 7.5 points', () => { expect(report.noiseCorrectedStdDev).toBeLessThanOrEqual(7.5); });
  it('keeps every token inside 20 to 80% even with sampling noise (no broken outliers)', () => { expect(report.minRate).toBeGreaterThan(20); expect(report.maxRate).toBeLessThan(80); });
  it('makes the lower-total fighter win between 35 and 50% of fights', () => { expect(report.lowerTotalWinRate).toBeGreaterThanOrEqual(35); expect(report.lowerTotalWinRate).toBeLessThanOrEqual(50); });
  it('orders tiers Common < Uncommon < Rare, and never lets a higher tier fall below a lower one beyond noise', () => {
    const t = report.tierRates; expect(t.map(x => x.cls)).toEqual(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']);
    for (let i = 1; i < t.length; i++) expect(t[i].rate, `${t[i].cls} vs ${t[i - 1].cls}`).toBeGreaterThan(t[i - 1].rate - 2 * Math.hypot(se(t[i]), se(t[i - 1])));
    expect(t[1].rate).toBeGreaterThan(t[0].rate + 2); expect(t[2].rate).toBeGreaterThan(t[1].rate + 2); expect(t[4].rate).toBeGreaterThan(t[0].rate + 10);
  });
  it('keeps every large Body, Eyes, Head and voice class near 45 to 56% and aura, accessory and signature classes near 45 to 60%', () => {
    const bands: Record<string, [number, number]> = { body: [45, 56], eyes: [45, 56], head: [45, 56], voice: [45, 56], aura: [45, 60], accessory: [45, 60], signature: [45, 60] };
    for (const c of report.classRates) {
      if (c.cls === 'none' || c.cls === 'Legendary' || c.played < 3000) continue;
      const [lo, hi] = bands[c.group]; const slack = 2 * se(c);
      expect(c.rate, `${c.group} ${c.cls}`).toBeGreaterThanOrEqual(lo - slack); expect(c.rate, `${c.group} ${c.cls}`).toBeLessThanOrEqual(hi + slack);
    }
  });
});
