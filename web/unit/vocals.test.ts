import { describe, expect, it } from 'vitest';
import { VOCAL_DURATION, VOICE_PITCH, scheduleVocal, type VocalKind } from '../src/lib/vocals';
import { FakeCtx } from './helpers/fake-audio';

const KINDS = Object.keys(VOCAL_DURATION) as VocalKind[];
describe('fighter voices', () => {
  for (const kind of KINDS) {
    it(`${kind}: is a buzzing source shaped by three vowel formants, inside its length, with valid parameters`, () => {
      const c = new FakeCtx(); const out = c.createGain();
      scheduleVocal(c.asContext(), out as unknown as AudioNode, kind, 1, 1);
      expect(c.log).toEqual([]);
      expect(c.oscillators.some((o) => o.type === 'sawtooth')).toBe(true);
      expect(c.filters.filter((f) => f.type === 'bandpass')).toHaveLength(3);
      expect(c.into(out)).toBe(1);
      for (const s of c.spans()) { expect(s.at).toBeGreaterThanOrEqual(1); expect(s.end).toBeLessThanOrEqual(1 + VOCAL_DURATION[kind] + 0.05); }
    });
  }
  it('are short: none longer than a second, and ordinary shouts under half a second', () => {
    for (const k of KINDS) expect(VOCAL_DURATION[k]).toBeLessThanOrEqual(1);
    for (const k of ['attack', 'dodge', 'hurt'] as const) expect(VOCAL_DURATION[k]).toBeLessThan(0.5);
  });
  it('give every voice class its own pitch, from a deep growl to a squeak', () => {
    expect(new Set(Object.values(VOICE_PITCH)).size).toBe(6);
    expect(VOICE_PITCH.gloom).toBeLessThan(VOICE_PITCH.fierce); expect(VOICE_PITCH.fierce).toBeLessThan(VOICE_PITCH.neutral); expect(VOICE_PITCH.neutral).toBeLessThan(VOICE_PITCH.smug); expect(VOICE_PITCH.smug).toBeLessThan(VOICE_PITCH.hustler); expect(VOICE_PITCH.hustler).toBeLessThan(VOICE_PITCH.hungry);
  });
  it('scale with pitch, and a deeper voice sits lower', () => {
    const start = (pitch: number) => { const c = new FakeCtx(); scheduleVocal(c.asContext(), c.createGain() as unknown as AudioNode, 'attack', 0, pitch); return c.oscillators.find((o) => o.type === 'sawtooth')!.f0[0]; };
    expect(start(VOICE_PITCH.gloom)).toBeLessThan(start(VOICE_PITCH.hungry)); expect(start(2) / start(1)).toBeCloseTo(2, 5);
  });
});
