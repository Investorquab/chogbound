import { resolve } from 'node:path';
import { loadTraits } from '../src/traits.js';
import { fighterFromToken } from '../src/stats.js';
import { simulate } from '../src/fight.js';
import { createRng } from '../src/rng.js';
import type { Fighter, Move, Plan, TraitAttribute } from '../src/types.js';

const traitsPath = process.argv[2] ? resolve(process.argv[2]) : undefined;
const requestedPairs = Number.parseInt(process.argv[3] ?? '20000', 10);
if (!Number.isSafeInteger(requestedPairs) || requestedPairs < 1) throw new Error('N must be a positive integer');
const dataset = await loadTraits(traitsPath);
const entries = Object.entries(dataset);
if (entries.length < 2) throw new Error('At least two tokens are required for random-pair balance');
const fighters: Fighter[] = entries.map(([id, token]) => fighterFromToken(id, token));
const attrsById = new Map(entries.map(([id, token]) => [id, token.attributes.map((a: TraitAttribute) => `${a.trait_type}=${a.value}`).join('; ')]));
const core: Move[] = ['Headbutt', 'Quick Feet', 'Iron Hide'];
const temperaments = ['Feisty', 'Cool', 'Wild'] as const;
const risks = ['Safe', 'Even', 'Gamble'] as const;
const wins = new Map(fighters.map(f => [f.tokenId, 0]));
const appearances = new Map(fighters.map(f => [f.tokenId, 0]));
let kos = 0;
for (let i = 0; i < requestedPairs; i++) {
  const rng = createRng(`balance-full:${i}`);
  const leftIndex = rng.int(fighters.length);
  let rightIndex = rng.int(fighters.length - 1);
  if (rightIndex >= leftIndex) rightIndex++;
  const left = fighters[leftIndex], right = fighters[rightIndex];
  const planFor = (fighter: Fighter): Plan => {
    const moves: Move[] = [...core, ...(fighter.signature ? [fighter.signature] : [])];
    return { temperament: temperaments[rng.int(temperaments.length)], move: moves[rng.int(moves.length)], risk: risks[rng.int(risks.length)] };
  };
  const result = simulate(left, right, planFor(left), planFor(right), `balance-full-fight:${i}`);
  appearances.set(left.tokenId, appearances.get(left.tokenId)! + 1);
  appearances.set(right.tokenId, appearances.get(right.tokenId)! + 1);
  const winner = result.summary.winner === 'a' ? left : right;
  wins.set(winner.tokenId, wins.get(winner.tokenId)! + 1);
  if (result.summary.ko) kos++;
}
const rows = fighters.map(f => ({
  id: f.tokenId, name: f.name, wins: wins.get(f.tokenId)!, played: appearances.get(f.tokenId)!,
  rate: appearances.get(f.tokenId)! ? wins.get(f.tokenId)! / appearances.get(f.tokenId)! * 100 : null,
  traits: attrsById.get(f.tokenId)!,
})).filter(row => row.rate !== null).sort((a, b) => a.rate! - b.rate! || Number(a.id) - Number(b.id));
const rates = rows.map(row => row.rate!);
console.log(`Full-dataset random-pair balance: ${requestedPairs.toLocaleString()} fights; ${fighters.length} tokens; ${rows.length} tokens sampled`);
console.log(`KO rate: ${(kos / requestedPairs * 100).toFixed(2)}% (${kos}/${requestedPairs})`);
console.log(`Per-token win-rate range among sampled tokens: ${Math.min(...rates).toFixed(2)}%–${Math.max(...rates).toFixed(2)}%`);
console.log(`Tokens not sampled: ${fighters.length - rows.length}`);
for (const [label, list] of [['10 lowest win rates', rows.slice(0, 10)], ['10 highest win rates', [...rows].reverse().slice(0, 10)]] as const) {
  console.log(`\n${label}`);
  console.log('Token | Name | Win rate | Wins / appearances | Traits');
  console.log('---|---|---:|---:|---');
  for (const row of list) console.log(`${row.id} | ${row.name} | ${row.rate!.toFixed(2)}% | ${row.wins}/${row.played} | ${row.traits}`);
}
