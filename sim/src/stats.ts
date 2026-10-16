import type { StatName, Stats, TraitAttribute, TraitBonus, StatResult, TraitToken, VoiceClass, AuraClass, AccessoryClass, SignatureMove, Fighter } from './types.js';
import mappingJson from './trait-mapping-v2.json' with { type: 'json' };

/**
 * Data-driven trait mapping (SIM_SPEC v1.3). Every number comes from trait-mapping-v2.json.
 * docs/trait-mapping-v2.json is the readable source of truth; src/trait-mapping-v2.json must stay byte-identical
 * (a test enforces this).
 */
type Bonuses = Partial<Stats>;
type BodyEntry = { cls: string; bonuses: Bonuses };
type EyesEntry = { cls: string; punch: number; signature: SignatureMove | null };
type HeadEntry = { cls: string; bonuses: Bonuses };
type MouthEntry = { voice: VoiceClass; nerve: number };
type LegendaryKit = { stats: Stats; voice: VoiceClass; aura: AuraClass; accessory: AccessoryClass; signature: SignatureMove | null };
type Mapping = {
  version: string;
  tier: Record<string, number | 'kit'>;
  bare: Bonuses;
  noHead: Bonuses;
  body: Record<string, BodyEntry>;
  eyes: Record<string, EyesEntry>;
  head: Record<string, HeadEntry>;
  mouth: Record<string, MouthEntry>;
  aura: Record<string, AuraClass>;
  accessory: Record<string, AccessoryClass>;
  legendaryKits: Record<string, LegendaryKit>;
};
const M = mappingJson as unknown as Mapping;

/** Fallbacks for values that are not in the mapping yet (future mints). The coverage gate reports them. */
const UNKNOWN_BODY: BodyEntry = { cls: 'Unknown', bonuses: { GRIT: 4, SWIFT: 4 } };
const UNKNOWN_EYES: EyesEntry = { cls: 'Neutral', punch: M.eyes.Base?.punch ?? 9, signature: null };
const UNKNOWN_HEAD: HeadEntry = { cls: 'Unknown', bonuses: { NERVE: 4 } };
const UNKNOWN_MOUTH: MouthEntry = { voice: 'neutral', nerve: 2 };
const STATS: StatName[] = ['GRIT', 'PUNCH', 'SWIFT', 'NERVE'];
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const own = <T,>(table: Record<string, T>, key: string | undefined): T | undefined =>
  key !== undefined && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;

export type UnmappedValue = { trait: 'Body' | 'Eyes' | 'Head' | 'Mouth' | 'Aura' | 'Accessory' | 'Tier' | 'Legendary'; value: string };

function attrsOf(input: TraitToken | TraitAttribute[] | Record<string, string>): Record<string, string> {
  if (Array.isArray(input)) return Object.fromEntries(input.map(a => [a.trait_type, a.value]));
  const tokenAttributes = (input as TraitToken).attributes;
  if (Array.isArray(tokenAttributes)) return Object.fromEntries(tokenAttributes.map((a: TraitAttribute) => [a.trait_type, a.value]));
  return input as Record<string, string>;
}

/** Legendary 1/1: Base is "1:1" and Tier is "Legendary". The kit name is the text after the em dash in the metadata name. */
export function legendaryKitName(name: string | undefined): string | null {
  if (!name) return null;
  const match = name.match(/\u2014\s*(.+)$/);
  return match ? match[1].trim() : null;
}
const isLegendary = (a: Record<string, string>) => a.Base === '1:1' && a.Tier === 'Legendary';

/** Every trait value the mapping does not know. The v1.3 coverage gate requires an empty list on the full scan. */
export function findUnmapped(input: TraitToken | TraitAttribute[] | Record<string, string>, name?: string): UnmappedValue[] {
  const a = attrsOf(input);
  const tokenName = name ?? (input as TraitToken).name;
  const out: UnmappedValue[] = [];
  if (a.Tier !== undefined && own(M.tier, a.Tier) === undefined) out.push({ trait: 'Tier', value: a.Tier });
  if (isLegendary(a)) {
    const kit = legendaryKitName(tokenName);
    if (!kit || !own(M.legendaryKits, kit)) out.push({ trait: 'Legendary', value: kit ?? String(tokenName) });
    return out;
  }
  if (a.Body && a.Naked !== 'Yes' && !own(M.body, a.Body)) out.push({ trait: 'Body', value: a.Body });
  if (a.Eyes && !own(M.eyes, a.Eyes)) out.push({ trait: 'Eyes', value: a.Eyes });
  if (a.Head && !own(M.head, a.Head)) out.push({ trait: 'Head', value: a.Head });
  if (a.Mouth && !own(M.mouth, a.Mouth)) out.push({ trait: 'Mouth', value: a.Mouth });
  if (a.Aura && !own(M.aura, a.Aura)) out.push({ trait: 'Aura', value: a.Aura });
  if (a.Accessory && !own(M.accessory, a.Accessory)) out.push({ trait: 'Accessory', value: a.Accessory });
  return out;
}

export function computeStats(input: TraitToken | TraitAttribute[] | Record<string, string>): StatResult {
  const a = attrsOf(input);
  const tokenName = (input as TraitToken).name;
  if (isLegendary(a)) {
    const kitName = legendaryKitName(tokenName);
    const kit = kitName ? own(M.legendaryKits, kitName) : undefined;
    if (kit) {
      return {
        stats: { ...kit.stats },
        bonuses: [],
        classes: { body: 'Legendary', eyes: 'Legendary', head: 'Legendary', mouth: kit.voice, aura: kit.aura, accessory: kit.accessory },
        signature: kit.signature,
        legendaryKit: kitName!,
      };
    }
  }
  const sums: Stats = { GRIT: 0, PUNCH: 0, SWIFT: 0, NERVE: 0 }; const bonuses: TraitBonus[] = [];
  const add = (stat: StatName, amount: number, trait: string, value: string, reason: string) => { if (amount) { sums[stat] += amount; bonuses.push({ stat, amount, trait, value, reason }); } };
  const naked = a.Naked === 'Yes'; const bodyValue = a.Body ?? '(missing Body)';
  const body: BodyEntry = naked || !a.Body ? { cls: 'Bare', bonuses: M.bare } : own(M.body, a.Body) ?? UNKNOWN_BODY;
  for (const [stat, amount] of Object.entries(body.bonuses)) add(stat as StatName, amount!, 'Body', bodyValue, `${body.cls} body`);
  const eyeValue = a.Eyes ?? '(missing Eyes)'; const eye = own(M.eyes, a.Eyes) ?? UNKNOWN_EYES;
  add('PUNCH', eye.punch, 'Eyes', eyeValue, `${eye.cls} eyes`);
  const headValue = a.Head ?? '(missing Head)';
  const head: HeadEntry = a.Head ? own(M.head, a.Head) ?? UNKNOWN_HEAD : { cls: 'No Head', bonuses: M.noHead };
  for (const [stat, amount] of Object.entries(head.bonuses)) add(stat as StatName, amount!, 'Head', headValue, `${head.cls} head`);
  const mouthValue = a.Mouth ?? '(missing Mouth)'; const mouth = own(M.mouth, a.Mouth) ?? UNKNOWN_MOUTH;
  add('NERVE', mouth.nerve, 'Mouth', mouthValue, `${mouth.voice} mouth`);
  const tier = a.Tier ?? 'Common'; const rawTier = own(M.tier, tier); const tierBonus = typeof rawTier === 'number' ? rawTier : 0;
  for (const stat of STATS) add(stat, tierBonus, 'Tier', tier, 'tier bonus');
  const base: Stats = { GRIT: 40 + sums.GRIT, PUNCH: 40 + sums.PUNCH, SWIFT: 40 + sums.SWIFT, NERVE: 40 + sums.NERVE };
  const accessoryValue = a.Accessory ?? '(missing Accessory)';
  const accessory: AccessoryClass = a.Accessory ? own(M.accessory, a.Accessory) ?? 'trinket' : 'none';
  if (accessory === 'trinket') {
    const lowest = STATS.reduce((lo, s) => base[s] < base[lo] ? s : lo, 'GRIT' as StatName);
    add(lowest, 4, 'Accessory', accessoryValue, 'Trinket +4 to lowest pre-clamp stat'); base[lowest] += 4;
  }
  const stats = { GRIT: clamp(base.GRIT, 20, 95), PUNCH: clamp(base.PUNCH, 20, 95), SWIFT: clamp(base.SWIFT, 20, 95), NERVE: clamp(base.NERVE, 20, 95) };
  return {
    stats, bonuses,
    classes: { body: body.cls, eyes: eye.cls, head: head.cls, mouth: mouth.voice, aura: own(M.aura, a.Aura) ?? 'none', accessory },
    signature: eye.signature,
  };
}

export function fighterFromToken(tokenId: string | number, token: TraitToken): Fighter {
  const result = computeStats(token); const a = attrsOf(token);
  return { tokenId: String(tokenId), name: token.name, stats: result.stats, voiceClass: result.classes.mouth, aura: result.classes.aura, accessory: result.classes.accessory, signature: result.signature, tier: a.Tier ?? 'Common' };
}

/** UI text: never show the em dash. "CHOG #53 \u2014 Blaze" becomes "CHOG #53 / Blaze". */
export function displayName(name: string): string { return name.replace(/\s*\u2014\s*/g, ' / '); }

export const traitClasses = { body: M.body, eyes: M.eyes, head: M.head, mouth: M.mouth, aura: M.aura, accessory: M.accessory, tier: M.tier, legendaryKits: M.legendaryKits };
export const TRAIT_MAPPING_VERSION = M.version;
