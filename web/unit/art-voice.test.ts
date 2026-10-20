import { describe, expect, it } from 'vitest';
import { resolveFirstLoadable, artUrls } from '../src/lib/art-url';

describe('resolveFirstLoadable', () => {
  it('returns the first URL that loads and stops trying after it', async () => {
    const tried: string[] = [];
    const urls = artUrls('CHOG #1462');
    const hit = await resolveFirstLoadable(urls, async (u) => { tried.push(u); return u === urls[2]; });
    expect(hit).toBe(urls[2]); expect(tried).toEqual(urls.slice(0, 3));
  });
  it('returns null when every gateway fails, so the placeholder stays', async () => {
    expect(await resolveFirstLoadable(artUrls('CHOG #1'), async () => false)).toBeNull();
    expect(await resolveFirstLoadable([], async () => true)).toBeNull();
  });
});
