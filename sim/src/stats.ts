import type { StatName, Stats, TraitAttribute, TraitBonus, StatResult, TraitToken, VoiceClass, AuraClass, AccessoryClass } from './types.js';
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const BODY: Record<string, { cls: string; bonuses: Partial<Stats> }> = {
  'Squid Game Guard': { cls: 'Heavy', bonuses: { GRIT: 16, SWIFT: -6 } }, 'Dragon suit': { cls: 'Heavy', bonuses: { GRIT: 16, SWIFT: -6 } }, 'Astro Suit': { cls: 'Heavy', bonuses: { GRIT: 16, SWIFT: -6 } }, 'dark jacket': { cls: 'Heavy', bonuses: { GRIT: 16, SWIFT: -6 } }, 'Red jacket': { cls: 'Heavy', bonuses: { GRIT: 16, SWIFT: -6 } },
  'dark tee': { cls: 'Light', bonuses: { SWIFT: 14, GRIT: -4 } }, 'Red Sleeveless': { cls: 'Light', bonuses: { SWIFT: 14, GRIT: -4 } }, 'Hawaiian Polo': { cls: 'Light', bonuses: { SWIFT: 14, GRIT: -4 } }, 'Black Trackset': { cls: 'Light', bonuses: { SWIFT: 14, GRIT: -4 } }, 'Brown Homeless Shirt': { cls: 'Light', bonuses: { SWIFT: 14, GRIT: -4 } }, 'Yellow Yukata': { cls: 'Light', bonuses: { SWIFT: 14, GRIT: -4 } }, 'Yellow 143 Jersey': { cls: 'Light', bonuses: { SWIFT: 14, GRIT: -4 } }, 'Blue 143 Jersey': { cls: 'Light', bonuses: { SWIFT: 14, GRIT: -4 } }, 'dark vest': { cls: 'Light', bonuses: { SWIFT: 14, GRIT: -4 } }, 'pink vest': { cls: 'Light', bonuses: { SWIFT: 14, GRIT: -4 } }, 'purple vest': { cls: 'Light', bonuses: { SWIFT: 14, GRIT: -4 } },
  'Cream Tuxedo': { cls: 'Showy', bonuses: { NERVE: 12, GRIT: 4 } }, 'Pink Tuxedo': { cls: 'Showy', bonuses: { NERVE: 12, GRIT: 4 } }, 'Banana suit': { cls: 'Showy', bonuses: { NERVE: 12, GRIT: 4 } }, Jesus: { cls: 'Showy', bonuses: { NERVE: 12, GRIT: 4 } },
};
const EYES: Record<string, { cls: string; punch: number; signature: StatResult['classes'] extends never ? never : string | null }> = {
  'fire laser': { cls: 'Laser', punch: 14, signature: 'Laser Stare' }, 'Green laser': { cls: 'Laser', punch: 14, signature: 'Laser Stare' }, 'cyan laser': { cls: 'Laser', punch: 14, signature: 'Laser Stare' }, 'Purple laser': { cls: 'Laser', punch: 14, signature: 'Laser Stare' },
  'BTC Glass': { cls: 'Tech', punch: 8, signature: 'Scan' }, '3D Glass': { cls: 'Tech', punch: 8, signature: 'Scan' }, 'Modern VR': { cls: 'Tech', punch: 8, signature: 'Scan' }, 'Anime Glass': { cls: 'Tech', punch: 8, signature: 'Scan' },
  Heart: { cls: 'Charm', punch: 4, signature: 'Charm' }, Happy: { cls: 'Charm', punch: 4, signature: 'Charm' }, Smirk: { cls: 'Charm', punch: 4, signature: 'Charm' }, XD: { cls: 'Charm', punch: 4, signature: 'Charm' }, 'Round Tear': { cls: 'Charm', punch: 4, signature: 'Charm' },
  Thug: { cls: 'Intimidate', punch: 10, signature: 'Stare Down' }, 'Side Eye': { cls: 'Intimidate', punch: 10, signature: 'Stare Down' }, Dead: { cls: 'Intimidate', punch: 10, signature: 'Stare Down' }, Vertical: { cls: 'Intimidate', punch: 10, signature: 'Stare Down' }, MOG: { cls: 'Intimidate', punch: 10, signature: 'Stare Down' },
  Retard: { cls: 'Wild', punch: 12, signature: 'Chaos Gaze' }, Base: { cls: 'Neutral', punch: 6, signature: null }, 'Round Eye': { cls: 'Neutral', punch: 6, signature: null },
};
const HEAD: Record<string, { cls: string; bonuses: Partial<Stats> }> = {};
for (const value of ['MCGA','MCGA Cap','TISM Cap','Blue Bucket Cap','Gray Bucket Cap','BTC Cap','BTC Beanie','Mon Cap','RETARD Cap','Dollar Cap','JEET Cap','Chog Cap']) HEAD[value] = { cls: 'Cap', bonuses: { NERVE: 8 } };
for (const value of ['Plumber','Robber','Red Headband','Durag','Rainbow Wig']) HEAD[value] = { cls: 'Style', bonuses: { SWIFT: 6, NERVE: 4 } };
const MOUTH: Record<string, { voice: VoiceClass; nerve: number }> = { Grit: { voice: 'fierce', nerve: 8 }, Smile: { voice: 'smug', nerve: 4 }, 'normal smile': { voice: 'smug', nerve: 4 }, 'Gold Tooth': { voice: 'smug', nerve: 4 }, 'Clown Mouth': { voice: 'smug', nerve: 4 }, 'BTC Coin': { voice: 'hustler', nerve: 2 }, 'Mon coin': { voice: 'hustler', nerve: 2 }, Drooling: { voice: 'hungry', nerve: 0 }, Bubblegum: { voice: 'hungry', nerve: 0 }, 'Lip Bite': { voice: 'hungry', nerve: 0 }, Sad: { voice: 'gloom', nerve: -4 }, Flat: { voice: 'gloom', nerve: -4 }, wo: { voice: 'neutral', nerve: 2 } };
const AURA: Record<string, AuraClass> = { Fire: 'scorch', 'Burning Aura': 'scorch', Wind: 'gust', Smoke: 'vanish', 'Aqua Aura': 'calm-glow', Mint: 'calm-glow', 'Light Purple': 'calm-glow' };
const ACCESSORY: Record<string, AccessoryClass> = { 'Green Candle': 'pump', Coin: 'lucky-flip', Fwog: 'sidekick', SB: 'trinket' };
function attrsOf(input: TraitToken | TraitAttribute[] | Record<string, string>): Record<string, string> {
  if (Array.isArray(input)) return Object.fromEntries(input.map(a => [a.trait_type, a.value]));
  const tokenAttributes = (input as TraitToken).attributes;
  if (Array.isArray(tokenAttributes)) return Object.fromEntries(tokenAttributes.map((a: TraitAttribute) => [a.trait_type, a.value]));
  return input as Record<string, string>;
}
export function computeStats(input: TraitToken | TraitAttribute[] | Record<string, string>): StatResult {
  const a = attrsOf(input); const sums: Stats = { GRIT: 0, PUNCH: 0, SWIFT: 0, NERVE: 0 }; const bonuses: TraitBonus[] = [];
  const add = (stat: StatName, amount: number, trait: string, value: string, reason: string) => { if (amount) { sums[stat] += amount; bonuses.push({ stat, amount, trait, value, reason }); } };
  const naked = a.Naked === 'Yes'; const bodyValue = a.Body ?? '(missing Body)';
  const body = naked || !a.Body ? { cls: 'Bare', bonuses: { SWIFT: 10, GRIT: -6 } as Partial<Stats> } : BODY[a.Body] ?? { cls: 'Unknown', bonuses: { GRIT: 4, SWIFT: 4 } as Partial<Stats> };
  for (const [stat, amount] of Object.entries(body.bonuses)) add(stat as StatName, amount!, 'Body', bodyValue, `${body.cls} body`);
  const eyeValue = a.Eyes ?? '(missing Eyes)'; const eye = EYES[eyeValue] ?? { cls: 'Neutral', punch: 6, signature: null };
  add('PUNCH', eye.punch, 'Eyes', eyeValue, `${eye.cls} eyes`);
  const headValue = a.Head ?? '(missing Head)'; const head = a.Head ? HEAD[headValue] ?? { cls: 'Unknown', bonuses: { NERVE: 4 } as Partial<Stats> } : { cls: 'No Head', bonuses: { SWIFT: 4 } as Partial<Stats> };
  for (const [stat, amount] of Object.entries(head.bonuses)) add(stat as StatName, amount!, 'Head', headValue, `${head.cls} head`);
  const mouthValue = a.Mouth ?? '(missing Mouth)'; const mouth = MOUTH[mouthValue] ?? { voice: 'neutral' as VoiceClass, nerve: 2 };
  add('NERVE', mouth.nerve, 'Mouth', mouthValue, `${mouth.voice} mouth`);
  const tier = a.Tier ?? 'Common'; const tierBonus = tier === 'Common' ? 0 : tier === 'Uncommon' ? 2 : Math.max(2, (parseInt(tier.match(/\d+/)?.[0] ?? '2', 10) - 1) * 2);
  for (const stat of ['GRIT','PUNCH','SWIFT','NERVE'] as StatName[]) add(stat, tierBonus, 'Tier', tier, 'tier bonus');
  const base: Stats = { GRIT: 40 + sums.GRIT, PUNCH: 40 + sums.PUNCH, SWIFT: 40 + sums.SWIFT, NERVE: 40 + sums.NERVE };
  const accessoryValue = a.Accessory ?? '(missing Accessory)'; const accessory = ACCESSORY[accessoryValue] ?? (a.Accessory ? 'trinket' : 'none');
  if (accessory === 'trinket') {
    const lowest = (['GRIT','PUNCH','SWIFT','NERVE'] as StatName[]).reduce((lo, s) => base[s] < base[lo] ? s : lo, 'GRIT');
    add(lowest, 4, 'Accessory', accessoryValue, 'Trinket +4 to lowest pre-clamp stat'); base[lowest] += 4;
  }
  const stats = { GRIT: clamp(base.GRIT,20,95), PUNCH: clamp(base.PUNCH,20,95), SWIFT: clamp(base.SWIFT,20,95), NERVE: clamp(base.NERVE,20,95) };
  return { stats, bonuses, classes: { body: body.cls, eyes: eye.cls, head: head.cls, mouth: mouth.voice, aura: AURA[a.Aura ?? ''] ?? 'none', accessory } };
}
export function fighterFromToken(tokenId: string | number, token: TraitToken): import('./types.js').Fighter {
  const result = computeStats(token); const a = attrsOf(token); const signature = (EYES[a.Eyes ?? '']?.signature ?? null) as import('./types.js').SignatureMove | null;
  return { tokenId: String(tokenId), name: token.name, stats: result.stats, voiceClass: result.classes.mouth, aura: result.classes.aura, accessory: result.classes.accessory, signature, tier: a.Tier ?? 'Common' };
}
export const traitClasses = { body: BODY, eyes: EYES, head: HEAD, mouth: MOUTH, aura: AURA, accessory: ACCESSORY };
