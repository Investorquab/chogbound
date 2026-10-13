import { resolve } from 'node:path';
import { loadTraits } from '../src/traits.js';
import { fighterFromToken } from '../src/stats.js';
import { simulate } from '../src/fight.js';
import { createRng } from '../src/rng.js';
import type { Fighter, Move, Plan } from '../src/types.js';

const traitsPath = process.argv[2] ? resolve(process.argv[2]) : undefined;
const dataset = await loadTraits(traitsPath);
const fighters: Fighter[] = Object.entries(dataset).map(([id, token]) => fighterFromToken(id, token));
const core: Move[] = ['Headbutt', 'Quick Feet', 'Iron Hide'];
const risks = ['Safe', 'Even', 'Gamble'] as const;
const temperaments = ['Feisty', 'Cool', 'Wild'] as const;
function randomPlan(rng: ReturnType<typeof createRng>, fighter: Fighter): Plan {
  const moves: Move[] = [...core, ...(fighter.signature ? [fighter.signature] : [])];
  return { temperament: temperaments[rng.int(temperaments.length)], move: moves[rng.int(moves.length)], risk: risks[rng.int(risks.length)] };
}
const stats = new Map(fighters.map(f => [f.tokenId, f.stats.GRIT + f.stats.PUNCH + f.stats.SWIFT + f.stats.NERVE]));
const wins = new Map(fighters.map(f => [f.tokenId, 0]));
let fights = 0, koCount = 0, lowerWins = 0, lowerTotalFights = 0;
const started = Date.now();
for (let i = 0; i < fighters.length; i++) for (let j = i + 1; j < fighters.length; j++) {
  const left = fighters[i], right = fighters[j];
  for (let seed = 0; seed < 100; seed++) {
    const planRng = createRng(`plans:${left.tokenId}:${right.tokenId}:${seed}`);
    const result = simulate(left, right, randomPlan(planRng, left), randomPlan(planRng, right), `fight:${left.tokenId}:${right.tokenId}:${seed}`);
    fights++;
    if (result.summary.ko) koCount++;
    const winnerId = result.summary.winner === 'a' ? left.tokenId : right.tokenId;
    wins.set(winnerId, (wins.get(winnerId) ?? 0) + 1);
    const leftTotal = stats.get(left.tokenId)!, rightTotal = stats.get(right.tokenId)!;
    if (leftTotal !== rightTotal) {
      lowerTotalFights++;
      if ((leftTotal < rightTotal && result.summary.winner === 'a') || (rightTotal < leftTotal && result.summary.winner === 'b')) lowerWins++;
    }
  }
}
const rows = fighters.map(f => ({
  id: f.tokenId, name: f.name, total: stats.get(f.tokenId)!, wins: wins.get(f.tokenId)!,
  rate: (wins.get(f.tokenId)! / ((fighters.length - 1) * 100)) * 100,
})).sort((a, b) => Number(a.id) - Number(b.id));
const rates = rows.map(r => r.rate);
const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
const stddev = Math.sqrt(rates.reduce((sum, rate) => sum + (rate - mean) ** 2, 0) / rates.length);
const outside = rows.filter(r => r.rate < 35 || r.rate > 65);
console.log(`ChogBound v1.2 balance — ${fights.toLocaleString()} fights, ${fighters.length} tokens, ${Date.now() - started} ms`);
console.log('Token | Name | Base total | Wins | Win rate');
console.log('---|---|---:|---:|---:');
for (const r of rows) console.log(`${r.id} | ${r.name} | ${r.total} | ${r.wins}/${(fighters.length - 1) * 100} | ${r.rate.toFixed(2)}%`);
console.log('');
console.log(`Lowest / highest token rate: ${Math.min(...rates).toFixed(2)}% / ${Math.max(...rates).toFixed(2)}%`);
console.log(`Population standard deviation of token rates: ${stddev.toFixed(2)} percentage points`);
console.log(`Tokens outside 35–65%: ${outside.length}${outside.length ? ` (${outside.map(r => `${r.id} ${r.rate.toFixed(2)}%`).join(', ')})` : ''}`);
console.log(`Overall KO rate: ${(koCount / fights * 100).toFixed(2)}% (${koCount}/${fights})`);
console.log(`Lower-total fighter win rate: ${(lowerWins / lowerTotalFights * 100).toFixed(2)}% (${lowerWins}/${lowerTotalFights}; equal-total pairs excluded)`);
const lowestRate = Math.min(...rates);
const highestRate = Math.max(...rates);
const koRate = fights ? koCount / fights * 100 : 0;
const lowerTotalRate = lowerTotalFights ? lowerWins / lowerTotalFights * 100 : 0;
const checks: Array<{ name: string; pass: boolean; observed: string; target: string }> = [
  { name: 'Lowest token win rate', pass: Math.abs(lowestRate - 37.3) <= 2.5, observed: `${lowestRate.toFixed(2)}%`, target: '37.3% ± 2.5 pp' },
  { name: 'Highest token win rate', pass: Math.abs(highestRate - 67.5) <= 2.5, observed: `${highestRate.toFixed(2)}%`, target: '67.5% ± 2.5 pp' },
  { name: 'Standard deviation', pass: Math.abs(stddev - 8.7) <= 1.0, observed: `${stddev.toFixed(2)} pp`, target: '8.7 ± 1.0 pp' },
  { name: 'KO rate', pass: Math.abs(koRate - 18.4) <= 1.5, observed: `${koRate.toFixed(2)}%`, target: '18.4% ± 1.5 pp' },
  { name: 'Lower-total fighter win rate', pass: Math.abs(lowerTotalRate - 43.7) <= 2.0, observed: `${lowerTotalRate.toFixed(2)}%`, target: '43.7% ± 2.0 pp' },
  { name: 'Tokens outside 35–65%', pass: outside.length <= 1, observed: `${outside.length}${outside.length ? ` (${outside.map(r => `${r.id} ${r.rate.toFixed(2)}%`).join(', ')})` : ''}`, target: 'at most 1 token' },
];
console.log('Section 10.7 tolerance checks (no auto-tuning):');
for (const check of checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} | ${check.name}: ${check.observed} (target ${check.target})`);
console.log(`Overall: ${checks.every(check => check.pass) ? 'PASS' : 'FAIL'}`);
