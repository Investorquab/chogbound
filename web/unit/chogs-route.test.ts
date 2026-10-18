import { describe, expect, it } from 'vitest';
import { GET } from '../src/app/api/chogs/route';
import { MAX_IDS, parseIds } from '../src/lib/chog-ids';

describe('parseIds', () => {
  it('accepts a clean list and removes duplicates', () => { expect(parseIds('1,308,1798,308')).toEqual([1, 308, 1798]); });
  it('rejects empty, malformed, out of range, oversized and unknown input', () => {
    for (const bad of [null, '', 'abc', '1,,2', '0', '1970', '-1', '1.5', '1;2', '99999']) expect(parseIds(bad), String(bad)).toBeNull();
    expect(parseIds(Array.from({ length: MAX_IDS + 1 }, (_, i) => i + 1).join(','))).toBeNull();
    expect(parseIds(Array.from({ length: MAX_IDS }, (_, i) => i + 1).join(','))).toHaveLength(MAX_IDS);
  });
});
describe('GET /api/chogs', () => {
  const call = (query: string) => GET(new Request(`http://localhost/api/chogs${query}`));
  it('returns the real name and traits for owned token ids, and never any art', async () => {
    const res = await call('?ids=308,1'); expect(res.status).toBe(200);
    const body = await res.json() as { chogs: { id: number; metadata: { name: string; attributes: { trait_type: string; value: string }[] } }[] };
    expect(body.chogs.map((c) => [c.id, c.metadata.name])).toEqual([[308, 'CHOG #1769'], [1, 'CHOG #1462']]);
    expect(body.chogs[0].metadata.attributes.find((a) => a.trait_type === 'Mouth')?.value).toBe('Bubblegum');
    expect(JSON.stringify(body)).not.toMatch(/ipfs|\.webp|image/i);
  });
  it('answers 400 with a plain message for bad input', async () => {
    for (const q of ['', '?ids=', '?ids=abc', '?ids=5000']) { const res = await call(q); expect(res.status, q).toBe(400); expect((await res.json() as { error: string }).error).toMatch(/comma separated/); }
  });
});
