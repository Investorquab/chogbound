import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { simulate } from 'chogbound-sim/src/fight.js';
import { fighterFromToken } from 'chogbound-sim/src/stats.js';
import type { FightEvent, Plan } from 'chogbound-sim/src/types.js';
import { AudioEngine, scheduleEventAudio, scheduleResultAudio, scheduleStartAudio, windupFor } from '../src/lib/audio';
import { eventKind } from '../src/lib/event-kind';
import { createMixer } from '../src/lib/sfx';
import { chogSource } from '../src/lib/chog-ids';
import { FakeCtx } from './helpers/fake-audio';

const plan = (p: Partial<Plan> = {}): Plan => ({ temperament: 'Feisty', move: 'Headbutt', risk: 'Even', ...p });
const vanishId = Number(Object.entries(chogSource).find(([, t]) => t.attributes.some((a) => a.trait_type === 'Aura' && a.value === 'Smoke'))![0]);
const fighters = [308, 1798, 1, 640, 777, vanishId, 24].map((id) => fighterFromToken(String(id), chogSource[String(id)]));
const voices = { a: 'hungry', b: 'fierce' } as const;
const events: FightEvent[] = [];
for (let i = 0; i < 120; i++) { const a = fighters[i % fighters.length], b = fighters[(i + 1 + (i >> 1)) % fighters.length]; if (a === b) continue; events.push(...simulate(a, b, plan(), plan({ temperament: 'Cool', move: b.signature ?? 'Headbutt' }), `audio:${i}`).events); }
const render = (event: FightEvent, on?: { sfx: boolean; voice: boolean }) => { const c = new FakeCtx(); const m = createMixer(c.asContext()); scheduleEventAudio(c.asContext(), m, event, voices, 1, on); return { c, m }; };
const byKind = (k: string) => events.filter((e) => eventKind(e) === k);

describe('event audio', () => {
  it('covers every kind of event in the sample', () => { for (const k of ['hit', 'crit', 'miss', 'dodge', 'heal', 'burn', 'ko']) expect(byKind(k).length, k).toBeGreaterThan(0); });
  it('schedules every event with valid parameters, inside a second and a half', () => {
    for (const e of events) { const { c } = render(e); expect(c.log, `event ${e.n}`).toEqual([]); for (const s of c.spans()) { expect(s.at).toBeGreaterThanOrEqual(1); expect(s.end).toBeLessThanOrEqual(2.6); } }
  });
  it('plays the shout, the wind-up, the impact and the reaction for a landed hit', () => {
    const e = byKind('hit')[0]; const { c, m } = render(e);
    expect(c.into(m.voice)).toBe(2);
    expect(c.into(m.sfx)).toBeGreaterThan(5);
  });
  it('plays only the shout and the whiff for a miss, with no reaction from the target', () => {
    const { c, m } = render(byKind('miss')[0]);
    expect(c.into(m.voice)).toBe(1);
  });
  it('adds a dodge reaction, and gives crits and knockouts a bigger reaction than hits', () => {
    const dodge = render(byKind('dodge')[0]); expect(dodge.c.into(dodge.m.voice)).toBe(2);
    const nodes = (k: string) => { const { c } = render(byKind(k)[0]); return c.oscillators.length + c.sources.length; };
    expect(nodes('crit')).toBeGreaterThan(nodes('hit')); expect(nodes('ko')).toBeGreaterThan(nodes('hit'));
  });
  it('heals with a chime only and reacts to a burn', () => {
    const heal = render(byKind('heal')[0]); expect(heal.c.into(heal.m.voice)).toBe(0); expect(heal.c.into(heal.m.sfx)).toBeGreaterThan(0);
    const burn = render(byKind('burn')[0]); expect(burn.c.into(burn.m.voice)).toBe(1);
  });
  it('ducks the music under impacts, harder for crits and knockouts, and never for a miss', () => {
    const duck = (k: string) => { const { m } = render(byKind(k)[0]); return (m.musicDuck as unknown as { gain: { targets: [number, number][] } }).gain.targets; };
    expect(duck('hit')[0][0]).toBe(0.5); expect(duck('crit')[0][0]).toBe(0.25); expect(duck('ko')[0][0]).toBe(0.25); expect(duck('miss')).toHaveLength(0);
  });
  it('respects the effects and voice switches independently', () => {
    const e = byKind('hit')[0];
    const noSfx = render(e, { sfx: false, voice: true }); expect(noSfx.c.into(noSfx.m.sfx)).toBe(0); expect(noSfx.c.into(noSfx.m.voice)).toBe(2);
    const noVoice = render(e, { sfx: true, voice: false }); expect(noVoice.c.into(noVoice.m.voice)).toBe(0); expect(noVoice.c.into(noVoice.m.sfx)).toBeGreaterThan(0);
    const none = render(e, { sfx: false, voice: false }); expect(none.c.oscillators.length + none.c.sources.length).toBe(0);
  });
  it('varies the voice a little from event to event, so repeats never sound identical', () => {
    const pitches = new Set(events.filter((e) => eventKind(e) === 'hit' && e.actor === 'a').slice(0, 14).map((e) => render(e).c.oscillators.find((o) => o.type === 'sawtooth')!.f0[0].toFixed(3)));
    expect(pitches.size).toBeGreaterThan(3);
  });
  it('is repeatable: the same event always sounds the same', () => {
    const e = byKind('crit')[0]; const sig = () => JSON.stringify(render(e).c.oscillators.map((o) => [o.type, o.f0]));
    expect(sig()).toBe(sig());
  });
});
describe('wind-ups, start and result', () => {
  it('gives every move its own wind-up and falls back to a whoosh', () => {
    const moves = ['Headbutt', 'Quick Feet', 'Iron Hide', 'Laser Stare', 'Scan', 'Charm', 'Stare Down', 'Chaos Gaze'];
    expect(new Set(moves.map(windupFor)).size).toBe(8); expect(windupFor('Something New')).toBe('whoosh');
  });
  it('starts with the stinger and a shout from each fighter', () => {
    const c = new FakeCtx(); const m = createMixer(c.asContext()); scheduleStartAudio(c.asContext(), m, voices, 1);
    expect(c.into(m.voice)).toBe(2); expect(c.into(m.sfx)).toBeGreaterThan(3); expect(c.log).toEqual([]);
  });
  it('ends with a win or lose jingle and a cheer from the winner', () => {
    for (const won of [true, false]) { const c = new FakeCtx(); const m = createMixer(c.asContext()); scheduleResultAudio(c.asContext(), m, won, voices, 1); expect(c.into(m.voice)).toBe(1); expect(c.into(m.sfx)).toBeGreaterThan(3); expect(c.log).toEqual([]); }
  });
});
describe('audio engine', () => {
  const g = globalThis as unknown as { window?: unknown };
  let ctx: FakeCtx; let made: number;
  beforeEach(() => { vi.useFakeTimers(); made = 0; ctx = new FakeCtx(); g.window = { AudioContext: function () { made++; return ctx; } }; });
  afterEach(() => { vi.useRealTimers(); delete g.window; });
  it('does nothing without a browser audio engine', () => { delete g.window; const e = new AudioEngine(); expect(e.isSupported()).toBe(false); expect(() => e.playEvent(events[0], voices)).not.toThrow(); });
  it('stays silent and creates no audio context while the master switch is off', () => {
    const e = new AudioEngine(); e.setFlags({ master: false }); e.playEvent(events[0], voices); e.click(); e.startMusic(1);
    expect(made).toBe(0);
  });
  it('creates the context on first use, resumes it, and plays events', () => {
    ctx.state = 'suspended'; const e = new AudioEngine(); e.playEvent(byKind('hit')[0], voices);
    expect(made).toBe(1); expect(ctx.resumed).toBe(1); expect(ctx.oscillators.length).toBeGreaterThan(5);
  });
  it('runs the music loop while started, never twice, and stops it on request or when switched off', () => {
    const e = new AudioEngine(); e.startMusic(1); e.startMusic(2);
    const steps = () => ctx.oscillators.length + ctx.sources.length;
    ctx.currentTime = 0.2; vi.advanceTimersByTime(100); const afterFirst = steps(); expect(afterFirst).toBeGreaterThan(0);
    ctx.currentTime = 1.0; vi.advanceTimersByTime(100); expect(steps()).toBeGreaterThan(afterFirst);
    e.stopMusic(); const stopped = steps(); ctx.currentTime = 3; vi.advanceTimersByTime(500); expect(steps()).toBe(stopped);
    e.startMusic(1); ctx.currentTime = 4; vi.advanceTimersByTime(100); const running = steps(); expect(running).toBeGreaterThan(stopped);
    e.setFlags({ music: false }); ctx.currentTime = 6; vi.advanceTimersByTime(500); expect(steps()).toBe(running);
  });
  it('suspends the audio and stops everything when the master switch goes off', () => {
    const e = new AudioEngine(); e.startMusic(1); ctx.currentTime = 0.2; vi.advanceTimersByTime(100);
    e.setFlags({ master: false }); expect(ctx.suspended).toBe(1);
    const count = ctx.oscillators.length; e.playEvent(events[0], voices); expect(ctx.oscillators.length).toBe(count);
  });
});
