import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTraits } from '../src/traits.js';
import { findUnmapped } from '../src/stats.js';

// Usage: npm run coverage -- [traitsPath]   (default: ../traits.full.json, the full 1,969-token scan)
// Gate (SIM_SPEC 10.8): 0 unmapped values in Body, Eyes, Head, Mouth, Aura, Accessory and Tier. Exit code 1 when any value is unmapped.
const here = dirname(fileURLToPath(import.meta.url));
const path = process.argv[2] ? resolve(process.argv[2]) : resolve(here, '../../traits.full.json');
const dataset = await loadTraits(path);
const counts = new Map<string, { trait: string; value: string; count: number }>();
for (const token of Object.values(dataset)) {
  for (const u of findUnmapped(token, token.name)) {
    const key = `${u.trait}\u0000${u.value}`;
    const row = counts.get(key) ?? { trait: u.trait, value: u.value, count: 0 };
    row.count++; counts.set(key, row);
  }
}
const rows = [...counts.values()].sort((a, b) => a.trait.localeCompare(b.trait) || a.value.localeCompare(b.value));
const total = rows.reduce((sum, r) => sum + r.count, 0);
console.log(`Trait mapping coverage: ${Object.keys(dataset).length} tokens processed (${path})`);
if (rows.length === 0) console.log('Unmapped values: 0 (Body, Eyes, Head, Mouth, Aura, Accessory, Tier, Legendary kits all covered)');
else {
  console.log('Trait | Value | Count');
  console.log('---|---|---:');
  for (const row of rows) console.log(`${row.trait} | ${row.value} | ${row.count}`);
}
console.log(`Unmapped trait-value occurrences: ${total}`);
process.exit(total === 0 ? 0 : 1);
