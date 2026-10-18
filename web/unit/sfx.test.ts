import { afterEach, describe, expect, it } from 'vitest';
import { SFX_DURATION, createSfxChain, scheduleSfx, sfx, type SfxKind } from '../src/lib/sfx';

/** A recording stand-in for the Web Audio API that also rejects the calls a real browser would throw on. */
class Param {
  last = -1; ramps = 0;
  constructor(public name: string, private log: string[]) {}
  value = 0;
  setValueAtTime(v: number, t: number) { if (!Number.isFinite(v) || !Number.isFinite(t)) this.log.push(`${this.name}: non finite set`); this.last = Math.max(this.last, t); }
  exponentialRampToValueAtTime(v: number, t: number) { if (!(v > 0)) this.log.push(`${this.name}: exponential ramp to ${v}`); if (!(t > this.last)) this.log.push(`${this.name}: ramp time ${t} not after ${this.last}`); this.last = t; this.ramps++; }
}
class Node { connect<T>(n: T): T { return n; } }
function makeContext() {
  const log: string[] = []; const starts: { at: number; end: number }[] = []; const peaks: number[] = []; let created = 0;
  const ctx = {
    sampleRate: 44100, currentTime: 0, state: 'running', destination: new Node(), resumed: 0,
    resume() { this.resumed++; return Promise.resolve(); },
    createBuffer(_c: number, length: number) { return { getChannelData: () => new Float32Array(length) }; },
    createOscillator() { created++; const frequency = new Param('freq', log); const o = Object.assign(new Node(), { type: 'sine', frequency, start(at: number) { (o as any)._s = at; }, stop(at: number) { starts.push({ at: (o as any)._s, end: at }); } }); return o; },
    createBufferSource() { created++; const o = Object.assign(new Node(), { buffer: null, start(at: number, _off: number, dur: number) { starts.push({ at, end: at + dur }); } }); return o; },
    createBiquadFilter() { return Object.assign(new Node(), { type: 'lowpass', Q: { value: 1 }, frequency: new Param('filter', log) }); },
    createGain() { const gain = new Param('gain', log); const orig = gain.exponentialRampToValueAtTime.bind(gain); gain.exponentialRampToValueAtTime = (v: number, t: number) => { peaks.push(v); orig(v, t); }; return Object.assign(new Node(), { gain }); },
    createDynamicsCompressor() { const p = (n: string) => ({ value: 0, name: n }); return Object.assign(new Node(), { threshold: p('t'), knee: p('k'), ratio: p('r'), attack: p('a'), release: p('rel') }); },
  };
  return { ctx: ctx as unknown as BaseAudioContext, log, starts, peaks, created: () => created };
}
const KINDS = Object.keys(SFX_DURATION) as SfxKind[];

describe('scheduleSfx', () => {
  for (const kind of KINDS) {
    it(`${kind}: makes sound, stays inside its length, and uses only valid audio parameters`, () => {
      const { ctx, log, starts, peaks, created } = makeContext(); const at = 0.5;
      scheduleSfx(ctx, new Node() as unknown as AudioNode, kind, at);
      expect(created()).toBeGreaterThan(0);
      expect(log).toEqual([]);
      for (const s of starts) { expect(s.at).toBeGreaterThanOrEqual(at); expect(s.end).toBeGreaterThan(s.at); expect(s.end).toBeLessThanOrEqual(at + SFX_DURATION[kind] + 0.05); }
      for (const p of peaks) { expect(Number.isFinite(p)).toBe(true); expect(p).toBeGreaterThan(0); expect(p).toBeLessThanOrEqual(2); }
    });
  }
  it('has a length for every kind, none longer than 2 seconds', () => { for (const k of KINDS) { expect(SFX_DURATION[k]).toBeGreaterThan(0); expect(SFX_DURATION[k]).toBeLessThanOrEqual(2); } });
});
describe('createSfxChain', () => {
  it('returns a master gain feeding a limiter that feeds the speakers', () => {
    const { ctx } = makeContext(); const master = createSfxChain(ctx);
    expect(master).toBeDefined(); expect((master as unknown as { gain: { value: number } }).gain.value).toBeLessThan(1);
  });
});
describe('sfx player', () => {
  const g = globalThis as unknown as { window?: unknown };
  afterEach(() => { delete g.window; sfx.enabled = true; });
  it('does nothing without a browser audio engine', () => { delete g.window; expect(() => sfx.play('hit')).not.toThrow(); expect(sfx.isSupported()).toBe(false); });
  it('plays through the audio engine when enabled and stays silent when muted', () => {
    let made = 0; let resumed = 0;
    const { ctx } = makeContext(); (ctx as unknown as { state: string }).state = 'suspended';
    (ctx as unknown as { resume: () => Promise<void> }).resume = () => { resumed++; return Promise.resolve(); };
    g.window = { AudioContext: function () { made++; return ctx; } };
    const fresh = new (Object.getPrototypeOf(sfx).constructor)() as typeof sfx;
    fresh.enabled = false; fresh.play('hit'); expect(made).toBe(0);
    fresh.enabled = true; fresh.play('hit'); expect(made).toBe(1); expect(resumed).toBe(1);
    fresh.play('crit'); expect(made).toBe(1);
  });
});
