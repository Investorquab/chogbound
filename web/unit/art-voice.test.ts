import { describe, expect, it } from 'vitest';
import { resolveFirstLoadable, artUrls } from '../src/lib/art-url';
import { VOICE_PROFILES } from '../src/lib/voice';

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
describe('voice profiles', () => {
  it('has distinct, sane speech settings for every voice class', () => {
    const classes = ['fierce', 'smug', 'hustler', 'hungry', 'gloom', 'neutral'] as const;
    for (const c of classes) { expect(VOICE_PROFILES[c].pitch).toBeGreaterThan(0.1); expect(VOICE_PROFILES[c].pitch).toBeLessThanOrEqual(2); expect(VOICE_PROFILES[c].rate).toBeGreaterThan(0.5); expect(VOICE_PROFILES[c].rate).toBeLessThanOrEqual(2); }
    expect(new Set(classes.filter((c) => c !== 'neutral').map((c) => `${VOICE_PROFILES[c].pitch}/${VOICE_PROFILES[c].rate}`)).size).toBe(5);
  });
});
