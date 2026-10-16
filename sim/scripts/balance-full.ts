import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTraits } from '../src/traits.js';
import { buildEntries, runBalance } from '../src/harness.js';
import type { TraitAttribute } from '../src/types.js';

// Usage: npm run balance:full -- [traitsPath] [pairs]   (defaults: ../traits.full.json, 400000)
const here = dirname(fileURLToPath(import.meta.url));
const traitsPath = process.argv[2] ? resolve(process.argv[2]) : resolve(here, '../../traits.full.json');
const pairs = Number.parseInt(process.argv[3] ?? '400000', 10);
if (!Number.isSafeInteger(pairs) || pairs < 1) throw new Error('pairs must be a positive integer');
const dataset = await loadTraits(traitsPath);
const attrsById = new Map(Object.entries(dataset).map(([id, t]) => [id, t.attributes.map((a: TraitAttribute) => `${a.trait_type}=${a.value}`).join('; ')]));
const started = Date.now();
const r = runBalance(buildEntries(dataset), pairs);
const f = (n: number) => n.toFixed(1);
const checks: [string, boolean, string][] = [];
const check = (label: string, ok: boolean, detail: string) => checks.push([label, ok, detail]);
const fightsPerToken = pairs * 2 / r.tokens;
console.log(`Full-collection balance: ${pairs.toLocaleString()} pairs, ${r.tokens} tokens sampled, about ${fightsPerToken.toFixed(0)} fights per token (${((Date.now() - started) / 1000).toFixed(1)}s)`);
console.log(`Token win rates: lowest ${f(r.minRate)}%, highest ${f(r.maxRate)}%, std dev ${f(r.stdDev)} (noise-corrected ${f(r.noiseCorrectedStdDev)}, expected sampling noise ${f(r.expectedNoiseStdDev)})`);
console.log(`Tokens outside 35 to 65%: ${r.outside35to65} (${(r.outside35to65 / r.tokens * 100).toFixed(1)}%); outside 30 to 70%: ${r.outside30to70}`);
console.log(`KO rate: ${f(r.koRate)}%; lower-total fighter wins: ${f(r.lowerTotalWinRate)}%`);
console.log(`Tier win rates (Common to Legendary): ${r.tierRates.map(t => `${t.cls} ${f(t.rate)}%`).join(', ')}`);
check('no token outside 30 to 70%', r.outside30to70 === 0, `${r.outside30to70}`);
check('at most 3% of tokens outside 35 to 65%', r.outside35to65 / r.tokens <= 0.03, `${(r.outside35to65 / r.tokens * 100).toFixed(1)}%`);
check('std dev at most 7.5', r.stdDev <= 7.5, f(r.stdDev));
check('KO rate 5 to 25%', r.koRate >= 5 && r.koRate <= 25, f(r.koRate));
check('tier win rates strictly increasing', r.tierRates.every((t, i) => i === 0 || t.rate > r.tierRates[i - 1].rate), r.tierRates.map(t => f(t.rate)).join(' < '));
const bands: Record<string, [number, number]> = { body: [45, 56], eyes: [45, 56], head: [45, 56], voice: [45, 56], aura: [45, 60], accessory: [45, 60], signature: [45, 60] };
console.log('\nClass win rates');
console.log('Group | Class | Win rate | Fights | Band');
console.log('---|---|---:|---:|---');
for (const c of r.classRates) {
  const band = bands[c.group]; const ok = c.cls === 'none' || c.cls === 'Legendary' || (c.rate >= band[0] && c.rate <= band[1]);
  console.log(`${c.group} | ${c.cls} | ${f(c.rate)}% | ${c.played} | ${band[0]} to ${band[1]}${ok ? '' : ' FAIL'}`);
  if (c.cls !== 'none' && c.cls !== 'Legendary') check(`${c.group} ${c.cls} within ${band[0]} to ${band[1]}%`, ok, f(c.rate));
}
const rows = [...r.tokenRates].sort((a, b) => a.rate - b.rate || Number(a.id) - Number(b.id));
for (const [label, list] of [['10 lowest token win rates', rows.slice(0, 10)], ['10 highest token win rates', [...rows].reverse().slice(0, 10)]] as const) {
  console.log(`\n${label}`);
  console.log('Token | Name | Win rate | Wins / fights | Traits');
  console.log('---|---|---:|---:|---');
  for (const t of list) console.log(`${t.id} | ${t.name} | ${f(t.rate)}% | ${t.wins}/${t.played} | ${attrsById.get(t.id)}`);
}
const outsiders = r.tokenRates.filter(t => t.rate < 30 || t.rate > 70);
if (outsiders.length) {
  const se = Math.sqrt(0.25 / (pairs * 2 / r.tokens)) * 100;
  console.log(`\nTokens outside 30 to 70% (sampling standard error is about ${se.toFixed(1)} points per token at this size; rerun with 2,000,000 pairs to confirm):`);
  for (const t of outsiders) console.log(`${t.id} | ${t.name} | ${f(t.rate)}% | ${t.wins}/${t.played}`);
}
console.log('\nTargets (SIM_SPEC section 10.8)');
for (const [label, ok, detail] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  (${detail})`);
const failed = checks.filter(c => !c[1]).length;
console.log(`\n${failed === 0 ? 'ALL TARGETS PASS' : `${failed} TARGET(S) FAILED`} at ${pairs.toLocaleString()} pairs`);
process.exit(failed === 0 ? 0 : 1);
