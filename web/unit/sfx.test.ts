import { describe, expect, it } from 'vitest';
import { SFX_DURATION, createMixer, duckMusic, scheduleSfx, type SfxKind } from '../src/lib/sfx';
import { FakeCtx, FakeNode } from './helpers/fake-audio';

const KINDS = Object.keys(SFX_DURATION) as SfxKind[];
const render = (kind: SfxKind, at = 0.5, options = {}) => { const c = new FakeCtx(); const out = c.createGain(); scheduleSfx(c.asContext(), out as unknown as AudioNode, kind, at, options); return c; };

describe('scheduleSfx', () => {
  for (const kind of KINDS) {
    it(`${kind}: makes sound, stays inside its length, and uses only valid audio parameters`, () => {
      const c = render(kind, 0.5);
      expect(c.oscillators.length + c.sources.length).toBeGreaterThan(0);
      expect(c.log).toEqual([]);
      for (const s of c.spans()) { expect(s.at).toBeGreaterThanOrEqual(0.5); expect(s.end).toBeGreaterThan(s.at); expect(s.end).toBeLessThanOrEqual(0.5 + SFX_DURATION[kind] + 0.05); }
      for (const p of c.peaks) { expect(Number.isFinite(p)).toBe(true); expect(p).toBeGreaterThan(0); expect(p).toBeLessThanOrEqual(5); }
      for (const f of [...c.oscillators.flatMap((o) => o.f0), ...c.filters.flatMap((f) => f.f0)]) { expect(f).toBeGreaterThanOrEqual(20); expect(f).toBeLessThanOrEqual(18000); }
    });
  }
  it('has a length for every kind, none longer than 2 seconds', () => { for (const k of KINDS) { expect(SFX_DURATION[k]).toBeGreaterThan(0); expect(SFX_DURATION[k]).toBeLessThanOrEqual(2); } });
  it('layers a landed hit: a bright crack, a mid slap and a low thud', () => {
    const c = render('hit');
    const filterTypes = c.filters.map((f) => f.type);
    expect(filterTypes).toContain('highpass'); expect(filterTypes).toContain('bandpass');
    expect(c.oscillators.some((o) => o.f0[0] < 400)).toBe(true);
  });
  it('lets the pitch option scale sounds and keeps everything inside the audible range', () => {
    const low = Math.max(...render('hit', 0.5, { pitch: 1 }).oscillators.map((o) => o.f0[0]));
    const high = Math.max(...render('hit', 0.5, { pitch: 1.5 }).oscillators.map((o) => o.f0[0]));
    expect(high / low).toBeCloseTo(1.5, 1);
    for (const k of KINDS) for (const f of render(k, 0.5, { pitch: 2 }).oscillators.flatMap((o) => o.f0)) expect(f).toBeLessThanOrEqual(18000);
  });
  it('makes repeated hits differ through the variant option', () => {
    const crack = (variant: number) => render('hit', 0.5, { variant }).filters.find((f) => f.type === 'highpass')!.f0[0];
    expect(new Set([0, 1, 2, 3].map(crack)).size).toBe(4); expect(crack(4)).toBe(crack(0));
  });
  it('gives each wind-up its own character', () => {
    const sig = (k: SfxKind) => JSON.stringify([render(k).oscillators.map((o) => [o.type, o.f0[0]]), render(k).filters.map((f) => [f.type, f.f0[0]])]);
    expect(new Set(['swoosh', 'whip', 'clang', 'laser', 'scan', 'charm', 'stare', 'chaos', 'whoosh'].map((k) => sig(k as SfxKind))).size).toBe(9);
  });
});
describe('mixer and ducking', () => {
  it('routes effects, voices and music into one master with a limiter, and keeps voices under the effects', () => {
    const c = new FakeCtx(); const m = createMixer(c.asContext());
    expect(c.into(m.master)).toBe(3);
    expect((m.master as unknown as { gain: { value: number } }).gain.value).toBeLessThan(1);
    expect((m.voice as unknown as { gain: { value: number } }).gain.value).toBeLessThan((m.sfx as unknown as { gain: { value: number } }).gain.value);
    expect(c.into(m.musicDuck)).toBe(1);
  });
  it('dips the music for an impact and brings it back', () => {
    const c = new FakeCtx(); const m = createMixer(c.asContext());
    duckMusic(m, 2, 0.25, 0.7);
    const g = (m.musicDuck as unknown as { gain: { targets: [number, number][]; cancelled: number } }).gain;
    expect(g.cancelled).toBe(1); expect(g.targets[0][0]).toBe(0.25); expect(g.targets[1][0]).toBe(1); expect(g.targets[1][1]).toBeCloseTo(2.7, 5);
    expect(new FakeNode()).toBeDefined();
  });
});
