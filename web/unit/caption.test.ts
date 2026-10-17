import { describe, expect, it } from 'vitest';
import { simulate } from 'chogbound-sim/src/fight.js';
import { renderNarration } from 'chogbound-sim/src/narration.js';
import { computeStats, fighterFromToken } from 'chogbound-sim/src/stats.js';
import type { Fighter, Plan } from 'chogbound-sim/src/types.js';
import { captionFor } from '../src/lib/caption';

const tok = (v: Record<string, string>) => ({ name: 'CHOG #1', attributes: Object.entries(v).map(([trait_type, value]) => ({ trait_type, value })) });
const make = (id: string, extra: Record<string, string>): Fighter => fighterFromToken(id, tok({ Body: 'Squid Game Guard', Eyes: 'Base', Mouth: 'wo', Head: 'MCGA', Tier: 'Common', ...extra }));
const plan = (p: Partial<Plan> = {}): Plan => ({ temperament: 'Feisty', move: 'Headbutt', risk: 'Even', ...p });
const fighters = [make('a', { Aura: 'Wind', Accessory: 'Green Candle' }), make('b', { Aura: 'Fire' }), make('c', { Mouth: 'Smile', Accessory: 'Cigar' }), make('d', { Aura: 'Smoke', Eyes: 'Thug' })];

describe('captionFor', () => {
  const events: { caption: string; full: string; procs: number; key: string }[] = [];
  for (let i = 0; i < 400; i++) {
    const a = fighters[i % 4], b = fighters[(i + 1 + (i >> 2)) % 4];
    const r = simulate(a, b, plan(), plan({ temperament: 'Cool' }), `caption:${i}`);
    for (const e of r.events) { const voice = (e.actor === 'a' ? a : b).voiceClass; events.push({ caption: captionFor(e, voice, r.summary.seed), full: renderNarration(e, voice, r.summary.seed), procs: e.procs.length, key: e.narration_key }); }
  }
  it('covers enough events with effects to be meaningful', () => { expect(events.length).toBeGreaterThan(3000); expect(events.filter((e) => e.procs > 1).length).toBeGreaterThan(200); });
  it('is never longer than the full narration and never empty', () => { for (const e of events) { expect(e.caption.length).toBeGreaterThan(5); expect(e.caption.length).toBeLessThanOrEqual(e.full.length); } });
  it('keeps ordinary attack events to one short voiced line, even when several effects fired', () => {
    const attacks = events.filter((e) => !/^(aura|accessory|signature)\./.test(e.key));
    for (const e of attacks) expect(e.caption.length, e.caption).toBeLessThanOrEqual(150);
    expect(attacks.filter((e) => e.procs > 1 && e.caption.length < e.full.length).length).toBeGreaterThan(100);
  });
  it('never shows a raw hyphenated effect id or an em dash', () => { for (const e of events) { expect(e.caption).not.toMatch(/\b[a-z]+(?:-[a-z]+)+\b/); expect(e.caption).not.toContain('\u2014'); } });
});
