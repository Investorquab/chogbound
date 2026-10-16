import { simulate } from '../src/fight.js';
import type { AccessoryClass, AuraClass, Fighter, Plan, SignatureMove } from '../src/types.js';

// Usage: npm run effect-value -- [fightsPerEffect]   (default 40000)
// Isolated value of one effect: an all-40 fighter that has only that effect, against a plain all-40 fighter.
// Both sides use Feisty / Even and the same Headbutt go-to attack. Sides alternate so position never matters.
const fights = Number.parseInt(process.argv[2] ?? '40000', 10);
if (!Number.isSafeInteger(fights) || fights < 2) throw new Error('fightsPerEffect must be an integer of at least 2');
const plainFighter = (id: string, extra: Partial<Fighter> = {}): Fighter => ({ tokenId: id, name: id, stats: { GRIT: 40, PUNCH: 40, SWIFT: 40, NERVE: 40 }, voiceClass: 'neutral', aura: 'none', accessory: 'none', signature: null, tier: 'Common', ...extra });
const baselinePlan: Plan = { temperament: 'Feisty', move: 'Headbutt', risk: 'Even' };
const baseline = plainFighter('baseline');
function winRate(subject: Fighter, subjectPlan: Plan, label: string): number {
  let wins = 0;
  for (let i = 0; i < fights; i++) {
    const subjectIsA = i % 2 === 0;
    const r = subjectIsA ? simulate(subject, baseline, subjectPlan, baselinePlan, `effect:${label}:${i}`) : simulate(baseline, subject, baselinePlan, subjectPlan, `effect:${label}:${i}`);
    if ((r.summary.winner === 'a') === subjectIsA) wins++;
  }
  return wins / fights * 100;
}
const se = Math.sqrt(0.25 / fights) * 100;
const rows: { group: string; name: string; rate: number }[] = [];
const auras: AuraClass[] = ['scorch', 'gust', 'vanish', 'calm-glow'];
const accessories: AccessoryClass[] = ['pump', 'lucky-flip', 'sidekick'];
const signatures: SignatureMove[] = ['Laser Stare', 'Scan', 'Charm', 'Stare Down', 'Chaos Gaze'];
for (const aura of auras) rows.push({ group: 'aura', name: aura, rate: winRate(plainFighter('x', { aura }), baselinePlan, aura) });
for (const accessory of accessories) rows.push({ group: 'accessory', name: accessory, rate: winRate(plainFighter('x', { accessory }), baselinePlan, accessory) });
// Trinket is a stat effect (+4 to the lowest stat), so on an all-40 fighter it is +4 GRIT.
rows.push({ group: 'accessory', name: 'trinket (+4 lowest stat)', rate: winRate(plainFighter('x', { stats: { GRIT: 44, PUNCH: 40, SWIFT: 40, NERVE: 40 } }), baselinePlan, 'trinket') });
for (const signature of signatures) rows.push({ group: 'signature', name: signature, rate: winRate(plainFighter('x', { signature }), { ...baselinePlan, move: signature }, signature) });
console.log(`Isolated effect value vs a plain all-40 fighter, ${fights.toLocaleString()} fights per effect (standard error about ${se.toFixed(2)} points)`);
console.log('Group | Effect | Win rate');
console.log('---|---|---:');
for (const row of rows) console.log(`${row.group} | ${row.name} | ${row.rate.toFixed(1)}%`);
// SIM_SPEC 10.8 quotes isolated ranges from its own harness: auras 56.5 to 59.8, accessories 55.8 to 56.5, signatures 54.0 to 55.8.
// This script is a report, not a gate: plan details of the original harness are not recorded, so exact agreement is not expected.
// The enforced targets are the full-collection class bands in `npm run balance:full`.
const reference: Record<string, string> = { aura: '56.5 to 59.8', accessory: '55.8 to 56.5', signature: '54.0 to 55.8' };
for (const group of ['aura', 'accessory', 'signature']) { const g = rows.filter(r => r.group === group).map(r => r.rate); console.log(`${group} range: ${Math.min(...g).toFixed(1)} to ${Math.max(...g).toFixed(1)} (SIM_SPEC reference ${reference[group]})`); }
const spread = Math.max(...rows.map(r => r.rate)) - Math.min(...rows.map(r => r.rate));
console.log(`Strongest: ${[...rows].sort((a, b) => b.rate - a.rate)[0].name}; weakest: ${[...rows].sort((a, b) => a.rate - b.rate)[0].name}; spread ${spread.toFixed(1)} points`);
