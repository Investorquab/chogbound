import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { computeStats, displayName, fighterFromToken, findUnmapped, legendaryKitName, traitClasses } from '../src/stats.js';
import { EFFECTS, MOVE_MULTIPLIERS } from '../src/balance.config.js';
import { simulate } from '../src/fight.js';
import type { Plan, TraitToken } from '../src/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const full: Record<string, TraitToken> = JSON.parse(readFileSync(resolve(root, 'traits.full.json'), 'utf8'));
const docsMapping = readFileSync(resolve(root, 'docs/trait-mapping-v2.json'));
const simMapping = readFileSync(resolve(here, '../src/trait-mapping-v2.json'));
const spec = JSON.parse(docsMapping.toString('utf8'));
const tok = (name: string, values: Record<string, string>): TraitToken => ({ name, attributes: Object.entries(values).map(([trait_type, value]) => ({ trait_type, value })) });

describe('trait mapping v2 (SIM_SPEC v1.3)', () => {
  it('keeps src/trait-mapping-v2.json byte-identical to docs/trait-mapping-v2.json', () => {
    // Compared ignoring line endings, so Windows (CRLF) and Linux (LF) checkouts both pass.
    const norm = (b: Buffer) => b.toString('utf8').replace(/\r\n/g, '\n');
    expect(norm(simMapping)).toBe(norm(docsMapping));
  });
  it('covers every trait value in the full 1,969-token scan with 0 unmapped values', () => {
    const ids = Object.keys(full); expect(ids.length).toBe(1969);
    const unmapped = ids.flatMap(id => findUnmapped(full[id], full[id].name).map(u => `${id}: ${u.trait}=${u.value}`));
    expect(unmapped, `unmapped values:\n${unmapped.slice(0, 20).join('\n')}`).toEqual([]);
  });
  it('has the entry counts documented in TRAIT_MAPPING (96 Body, 58 Eyes, 66 Head, 15 Mouth, 22 Aura, 9 Accessory, 10 Legendary kits)', () => {
    expect(Object.keys(traitClasses.body).length).toBe(96); expect(Object.keys(traitClasses.eyes).length).toBe(58);
    expect(Object.keys(traitClasses.head).length).toBe(66); expect(Object.keys(traitClasses.mouth).length).toBe(15);
    expect(Object.keys(traitClasses.aura).length).toBe(22); expect(Object.keys(traitClasses.accessory).length).toBe(9);
    expect(Object.keys(traitClasses.legendaryKits).length).toBe(10);
  });
  it('reports unknown values so the coverage gate can fail on future mints', () => {
    expect(findUnmapped(tok('CHOG #1', { Body: 'Mystery Suit', Eyes: 'Base', Tier: 'Mythic' }))).toEqual([{ trait: 'Tier', value: 'Mythic' }, { trait: 'Body', value: 'Mystery Suit' }]);
  });
  it('applies tier bonuses +0, +1, +2, +3 to every stat', () => {
    const base = { Body: 'dark tee', Eyes: 'Base', Mouth: 'wo', Head: 'MCGA' };
    const stat = (tier: string) => computeStats(tok('CHOG #1', { ...base, Tier: tier })).stats;
    for (const [tier, bonus] of [['Common', 0], ['Uncommon', 1], ['Rare', 2], ['Epic', 3]] as const) {
      const s = stat(tier), c = stat('Common');
      for (const k of ['GRIT', 'PUNCH', 'SWIFT', 'NERVE'] as const) expect(s[k] - c[k]).toBe(bonus);
    }
  });
  it('uses fixed Legendary kits looked up by the name after the em dash, with no tier bonus', () => {
    const token = full['53'] ?? Object.values(full).find(t => t.name.startsWith('CHOG #53 '))!;
    expect(legendaryKitName('CHOG #53 \u2014 Blaze')).toBe('Blaze');
    const kit = spec.legendaryKits.Blaze;
    const f = fighterFromToken('x', tok('CHOG #53 \u2014 Blaze', [{ trait_type: 'Base', value: '1:1' }, { trait_type: 'Tier', value: 'Legendary' }].reduce((o, a) => ({ ...o, [a.trait_type]: a.value }), {})));
    expect(f.stats).toEqual(kit.stats); expect(f.voiceClass).toBe(kit.voice); expect(f.aura).toBe(kit.aura); expect(f.accessory).toBe(kit.accessory); expect(f.signature).toBe(kit.signature);
    expect(token).toBeDefined();
    const legendary = Object.entries(full).filter(([, t]) => t.attributes.some(a => a.trait_type === 'Tier' && a.value === 'Legendary'));
    expect(legendary.length).toBe(10);
    for (const [id, t] of legendary) { const name = legendaryKitName(t.name)!; expect(fighterFromToken(id, t).stats, `${id} ${name}`).toEqual(spec.legendaryKits[name].stats); }
  });
  it('never shows an em dash in display names', () => {
    expect(displayName('CHOG #53 \u2014 Blaze')).toBe('CHOG #53 / Blaze'); expect(displayName('CHOG #12')).toBe('CHOG #12');
    for (const t of Object.values(full)) expect(displayName(t.name)).not.toContain('\u2014');
  });
  it('keeps effect numbers in balance.config.ts equal to trait-mapping-v2.json effects', () => {
    const e = spec.effects;
    expect(EFFECTS.scorchDamage).toBe(e.scorch.burn_hp_per_round); expect(EFFECTS.scorchRounds).toBe(e.scorch.rounds);
    expect(EFFECTS.vanishDodgeChance).toBe(e.vanish.dodge_probability); expect(EFFECTS.calmGlowHeal).toBe(e['calm-glow'].heal_hp);
    expect(EFFECTS.gustSwift).toBe(e.gust.round1_swift); expect(EFFECTS.gustRound1Damage).toBe(e.gust.round1_damage_multiplier);
    expect(EFFECTS.pumpPunch).toBe(e.pump.punch_bonus); expect(EFFECTS.luckyFlipHitFactor).toBe(e['lucky-flip'].reroll_hit_chance_multiplier);
    expect(EFFECTS.sidekickChance).toBe(e.sidekick.chance_per_round); expect(EFFECTS.sidekickDamage).toBe(e.sidekick.damage);
    expect(MOVE_MULTIPLIERS['Laser Stare']).toBe(e.signatures['Laser Stare'].multiplier); expect(EFFECTS.scanCounterMultiplier).toBe(e.signatures.Scan.counter_damage_multiplier);
    expect(EFFECTS.charmNervePenalty).toBe(e.signatures.Charm.rival_nerve_penalty); expect(EFFECTS.stareDownHitPenalty).toBe(e.signatures['Stare Down'].rival_first_attack_hit_penalty);
    expect(EFFECTS.chaosGazeHitChance).toBe(e.signatures['Chaos Gaze'].coin_flip); expect(MOVE_MULTIPLIERS['Chaos Gaze']).toBe(e.signatures['Chaos Gaze'].multiplier);
  });
});

describe('v1.3 effect behaviour', () => {
  const plan = (p: Partial<Plan> = {}): Plan => ({ temperament: 'Cool', move: 'Headbutt', risk: 'Even', ...p });
  const plain = fighterFromToken('plain', tok('plain', { Body: 'Squid Game Guard', Eyes: 'Base', Mouth: 'wo', Head: 'MCGA', Tier: 'Common' }));
  it('Vanish dodges the first incoming attack about half the time, and the effect is spent either way', () => {
    const vanish = fighterFromToken('v', tok('v', { Body: 'Squid Game Guard', Eyes: 'Base', Mouth: 'wo', Head: 'MCGA', Aura: 'Smoke', Tier: 'Common' }));
    let firstDodged = 0, fights = 0, extraDodges = 0;
    for (let seed = 0; seed < 3000; seed++) {
      const r = simulate(plain, vanish, plan(), plan(), `vanish:${seed}`);
      const incoming = r.events.filter(e => e.actor === 'a' && e.action === 'attack' && !e.procs.includes('sidekick'));
      if (!incoming.length) continue; fights++;
      if (incoming[0].outcome === 'dodge') firstDodged++;
      extraDodges += incoming.slice(1).filter(e => e.outcome === 'dodge').length;
    }
    expect(extraDodges).toBe(0);
    expect(firstDodged / fights).toBeGreaterThan(0.45); expect(firstDodged / fights).toBeLessThan(0.55);
  });
  it('Scorch burns exactly 2 HP per round for at most 2 rounds', () => {
    const burner = fighterFromToken('s', tok('s', { Body: 'Squid Game Guard', Eyes: 'Base', Mouth: 'wo', Head: 'MCGA', Aura: 'Fire', Tier: 'Common' }));
    let burns = 0;
    for (let seed = 0; seed < 300; seed++) {
      const r = simulate(burner, plain, plan(), plan(), `scorch:${seed}`);
      const b = r.events.filter(e => e.action === 'burn' && e.actor === 'a'); burns += b.length;
      expect(b.length).toBeLessThanOrEqual(2); for (const e of b) expect(e.damage).toBeLessThanOrEqual(2);
      if (b.length === 2 && !r.summary.ko) expect(b.every(e => e.damage === 2)).toBe(true);
    }
    expect(burns).toBeGreaterThan(0);
  });
  it('Gust adds +30% damage only to round-1 attacks and marks them in the log', () => {
    const gust = fighterFromToken('g', tok('g', { Body: 'Squid Game Guard', Eyes: 'Base', Mouth: 'wo', Head: 'MCGA', Aura: 'Wind', Tier: 'Common' }));
    let marked = 0;
    for (let seed = 0; seed < 300; seed++) {
      const r = simulate(gust, plain, plan(), plan(), `gust:${seed}`);
      for (const e of r.events.filter(x => x.actor === 'a' && x.action === 'attack')) { if (e.procs.includes('gust-surge')) { marked++; expect(e.round).toBe(1); } }
    }
    expect(marked).toBeGreaterThan(0);
  });
});
