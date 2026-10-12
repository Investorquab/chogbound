import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_TRAITS_PATH, loadTraits } from '../src/traits.js';

describe('trait dataset loading', () => {
  it('loads repo-root traits.json by default', async () => {
    expect(DEFAULT_TRAITS_PATH).toBe(resolve(process.cwd(), '../traits.json'));
    const loaded = await loadTraits();
    const raw = JSON.parse(await readFile(DEFAULT_TRAITS_PATH, 'utf8')) as Record<string, { name: string; attributes: unknown[] }>;
    expect(Object.keys(loaded)).toEqual(Object.keys(raw));
    for (const [id, token] of Object.entries(raw)) {
      expect(loaded[id].name).toBe(token.name);
      expect(loaded[id].attributes).toEqual(token.attributes);
    }
  });
  it('accepts object-keyed token records without an image field', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'chogbound-traits-'));
    const path = join(dir, 'traits.full-shaped.json');
    try {
      await writeFile(path, JSON.stringify({
        '1969': { name: 'CHOG #1461', attributes: [{ trait_type: 'Eyes', value: 'Smirk' }] },
        '37': { name: 'CHOG #37', attributes: [{ trait_type: 'Body', value: 'dark tee' }] },
      }));
      const loaded = await loadTraits(path);
      expect(Object.keys(loaded)).toEqual(['37', '1969']);
      expect(loaded['1969']).toEqual({ name: 'CHOG #1461', image: undefined, attributes: [{ trait_type: 'Eyes', value: 'Smirk' }] });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
