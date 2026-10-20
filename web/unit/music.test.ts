import { describe, expect, it } from 'vitest';
import { MUSIC_STEPS, STEP_SECONDS, musicLevelForHp, scheduleMusicStep, type MusicLevel } from '../src/lib/music';
import { FakeCtx } from './helpers/fake-audio';

const loop = (level: MusicLevel) => { const c = new FakeCtx(); const out = c.createGain(); for (let i = 0; i < MUSIC_STEPS; i++) scheduleMusicStep(c.asContext(), out as unknown as AudioNode, i, 1 + i * STEP_SECONDS, level); return c; };
describe('adaptive music', () => {
  it('is a two bar loop of sixteenth notes at 128 bpm', () => { expect(MUSIC_STEPS).toBe(32); expect(STEP_SECONDS).toBeCloseTo(0.1171875, 6); });
  for (const level of [1, 2, 3] as const) {
    it(`level ${level}: every step is valid and short`, () => {
      const c = loop(level);
      expect(c.log).toEqual([]);
      expect(c.oscillators.length + c.sources.length).toBeGreaterThan(MUSIC_STEPS);
      for (const s of c.spans()) { expect(s.end - s.at).toBeLessThan(0.35); }
      for (const p of c.peaks) expect(p).toBeLessThanOrEqual(2);
    });
  }
  it('gets busier as the level rises', () => {
    const count = (l: MusicLevel) => { const c = loop(l); return c.oscillators.length + c.sources.length; };
    expect(count(2)).toBeGreaterThan(count(1)); expect(count(3)).toBeGreaterThan(count(2));
  });
  it('has a kick on every beat of the bar', () => {
    const c = loop(1); const kicks = c.oscillators.filter((o) => o.type === 'sine' && o.f0[0] === 125);
    expect(kicks).toHaveLength(MUSIC_STEPS / 4);
  });
  it('picks the level from the lowest health on the stage', () => {
    expect([100, 80, 51].map(musicLevelForHp)).toEqual([1, 1, 1]); expect([50, 40, 26].map(musicLevelForHp)).toEqual([2, 2, 2]); expect([25, 10, 0].map(musicLevelForHp)).toEqual([3, 3, 3]);
  });
});
