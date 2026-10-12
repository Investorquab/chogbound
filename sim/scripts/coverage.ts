import { resolve } from 'node:path';
import { loadTraits } from '../src/traits.js';
import { traitClasses } from '../src/stats.js';

const path = process.argv[2] ? resolve(process.argv[2]) : undefined;
const dataset = await loadTraits(path);
const counts = new Map<string, number>();
const display = new Map<string, { trait: string; value: string; fallback: string }>();
const increment = (trait: string, value: string, fallback: string) => {
  const key = `${trait}\u0000${value}\u0000${fallback}`;
  counts.set(key, (counts.get(key) ?? 0) + 1);
  display.set(key, { trait, value, fallback });
};
for (const token of Object.values(dataset)) {
  const attrs = Object.fromEntries(token.attributes.map(a => [a.trait_type, a.value]));
  if (attrs.Body && attrs.Naked !== 'Yes' && !(attrs.Body in traitClasses.body)) increment('Body', attrs.Body, 'Unknown -> GRIT +4, SWIFT +4');
  if (attrs.Eyes && !(attrs.Eyes in traitClasses.eyes)) increment('Eyes', attrs.Eyes, 'Neutral fallback -> PUNCH +6, no signature');
  if (attrs.Head && !(attrs.Head in traitClasses.head)) increment('Head', attrs.Head, 'Unknown -> NERVE +4');
  if (attrs.Mouth && !(attrs.Mouth in traitClasses.mouth)) increment('Mouth', attrs.Mouth, 'Unknown -> neutral voice, NERVE +2');
  if (attrs.Accessory && !(attrs.Accessory in traitClasses.accessory)) increment('Accessory', attrs.Accessory, 'Unknown -> Trinket (+4 lowest stat)');
}
const rows = [...counts.keys()].map(key => ({ ...display.get(key)!, count: counts.get(key)! }))
  .sort((a, b) => a.trait.localeCompare(b.trait) || a.value.localeCompare(b.value));
console.log(`Trait mapping fallback coverage: ${Object.keys(dataset).length} tokens processed`);
if (rows.length === 0) console.log('No trait values hit an Unknown/neutral fallback in the supplied dataset.');
else {
  console.log('Trait | Value | Fallback | Count');
  console.log('---|---|---|---:');
  for (const row of rows) console.log(`${row.trait} | ${row.value} | ${row.fallback} | ${row.count}`);
}
console.log(`Fallback trait-value occurrences: ${rows.reduce((sum, row) => sum + row.count, 0)}`);
