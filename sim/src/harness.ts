import { simulate } from './fight.js';
import { createRng } from './rng.js';
import { computeStats, fighterFromToken } from './stats.js';
import type { Fighter, Move, Plan, TraitToken } from './types.js';

/** Random-pair balance harness shared by the balance scripts and the full-collection test (SIM_SPEC section 10.8). */
export type Classes = { body: string; eyes: string; head: string; voice: string; aura: string; accessory: string; signature: string; tier: string };
export type HarnessEntry = { fighter: Fighter; classes: Classes };
export type TokenRate = { id: string; name: string; wins: number; played: number; rate: number };
export type ClassRate = { group: keyof Classes; cls: string; wins: number; played: number; rate: number };
export type BalanceReport = {
  pairs: number; tokens: number; koRate: number; lowerTotalWinRate: number;
  minRate: number; maxRate: number; stdDev: number; expectedNoiseStdDev: number; noiseCorrectedStdDev: number;
  outside35to65: number; outside30to70: number; tokenRates: TokenRate[]; classRates: ClassRate[]; tierRates: ClassRate[];
};
const CORE: Move[] = ['Headbutt', 'Quick Feet', 'Iron Hide'];
const TEMPERAMENTS = ['Feisty', 'Cool', 'Wild'] as const;
const RISKS = ['Safe', 'Even', 'Gamble'] as const;
export const TIER_ORDER = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

export function buildEntries(dataset: Record<string, TraitToken>): HarnessEntry[] {
  return Object.entries(dataset).map(([id, token]) => {
    const fighter = fighterFromToken(id, token); const c = computeStats(token).classes;
    return { fighter, classes: { body: c.body, eyes: c.eyes, head: c.head, voice: c.mouth, aura: c.aura, accessory: c.accessory, signature: fighter.signature ?? 'none', tier: fighter.tier } };
  });
}

export function runBalance(entries: HarnessEntry[], pairs: number, seedPrefix = 'balance-full'): BalanceReport {
  if (entries.length < 2) throw new Error('At least two tokens are required for random-pair balance');
  const wins = new Array<number>(entries.length).fill(0), played = new Array<number>(entries.length).fill(0);
  let kos = 0, lowerTotalFights = 0, lowerTotalWins = 0;
  for (let i = 0; i < pairs; i++) {
    const rng = createRng(`${seedPrefix}:${i}`);
    const li = rng.int(entries.length); let ri = rng.int(entries.length - 1); if (ri >= li) ri++;
    const left = entries[li].fighter, right = entries[ri].fighter;
    const planFor = (f: Fighter): Plan => {
      const moves: Move[] = [...CORE, ...(f.signature ? [f.signature] : [])];
      return { temperament: TEMPERAMENTS[rng.int(3)], move: moves[rng.int(moves.length)], risk: RISKS[rng.int(3)] };
    };
    const planL = planFor(left), planR = planFor(right);
    const r = simulate(left, right, planL, planR, `${seedPrefix}-fight:${i}`);
    played[li]++; played[ri]++;
    const winnerIndex = r.summary.winner === 'a' ? li : ri; wins[winnerIndex]++;
    if (r.summary.ko) kos++;
    const [ta, tb] = [r.summary.totals.a, r.summary.totals.b];
    if (ta !== tb) { lowerTotalFights++; if ((ta < tb) === (r.summary.winner === 'a')) lowerTotalWins++; }
  }
  const tokenRates: TokenRate[] = entries.map((e, k) => ({ id: e.fighter.tokenId, name: e.fighter.name, wins: wins[k], played: played[k], rate: played[k] ? wins[k] / played[k] * 100 : NaN })).filter(t => t.played > 0);
  const rates = tokenRates.map(t => t.rate);
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance = rates.reduce((a, b) => a + (b - mean) ** 2, 0) / rates.length;
  const noiseVar = tokenRates.reduce((a, t) => a + (100 * 100 * 0.25) / t.played, 0) / tokenRates.length;
  const groups: (keyof Classes)[] = ['body', 'eyes', 'head', 'voice', 'aura', 'accessory', 'signature', 'tier'];
  const bucket = new Map<string, { group: keyof Classes; cls: string; wins: number; played: number }>();
  entries.forEach((e, k) => { for (const g of groups) { const key = `${g}\u0000${e.classes[g]}`; const b = bucket.get(key) ?? { group: g, cls: e.classes[g], wins: 0, played: 0 }; b.wins += wins[k]; b.played += played[k]; bucket.set(key, b); } });
  const all: ClassRate[] = [...bucket.values()].filter(b => b.played > 0).map(b => ({ ...b, rate: b.wins / b.played * 100 }));
  return {
    pairs, tokens: tokenRates.length, koRate: kos / pairs * 100, lowerTotalWinRate: lowerTotalFights ? lowerTotalWins / lowerTotalFights * 100 : NaN,
    minRate: Math.min(...rates), maxRate: Math.max(...rates), stdDev: Math.sqrt(variance), expectedNoiseStdDev: Math.sqrt(noiseVar), noiseCorrectedStdDev: Math.sqrt(Math.max(0, variance - noiseVar)),
    outside35to65: rates.filter(r => r < 35 || r > 65).length, outside30to70: rates.filter(r => r < 30 || r > 70).length,
    tokenRates, classRates: all.filter(c => c.group !== 'tier'),
    tierRates: TIER_ORDER.map(t => all.find(c => c.group === 'tier' && c.cls === t)).filter((c): c is ClassRate => !!c),
  };
}
