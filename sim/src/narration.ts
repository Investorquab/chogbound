import type { FightEvent, VoiceClass } from './types.js';
type Template = (vars: FightEvent['vars']) => string;
const base: Record<string, Template> = {
  'signature.scan': v => `Scan reveals ${String(v.rival_plan)}.`,
  'attack.miss': _v => `The attack misses the rival.`,
  'attack.dodge': _v => `The rival dodges the incoming hit.`,
  'attack.crit': v => `Critical hit for ${Number(v.damage)} damage. ${Number(v.target_hp)} HP remains.`,
  'hit.headbutt': v => `Headbutt lands for ${Number(v.damage)} damage. ${Number(v.target_hp)} HP remains.`,
  'hit.quick-feet': v => `Quick Feet strikes for ${Number(v.damage)} damage. ${Number(v.target_hp)} HP remains.`,
  'hit.iron-hide': v => `Iron Hide lands for ${Number(v.damage)} damage. ${Number(v.target_hp)} HP remains.`,
  'hit.laser-stare': v => `Laser Stare hits for ${Number(v.damage)} damage. ${Number(v.target_hp)} HP remains.`,
  'hit.chaos-gaze': v => `Chaos Gaze hits for ${Number(v.damage)} damage. ${Number(v.target_hp)} HP remains.`,
  'hit.scan': v => `The strike deals ${Number(v.damage)} damage. ${Number(v.target_hp)} HP remains.`,
  'hit.charm': v => `Charm hits for ${Number(v.damage)} damage. ${Number(v.target_hp)} HP remains.`,
  'hit.stare-down': v => `Stare Down hits for ${Number(v.damage)} damage. ${Number(v.target_hp)} HP remains.`,
  'aura.scorch': v => `Scorch deals ${Number(v.damage)} damage. ${Number(v.target_hp)} HP remains.`,
  'accessory.sidekick': v => `Sidekick adds ${Number(v.damage)} damage. ${Number(v.target_hp)} HP remains.`,
  'heal.calm-glow': v => `Calm Glow restores ${Number(v.heal)} HP. The fighter now has ${Number(v.hp)} HP.`,
};
const voiceLead: Record<VoiceClass, Record<string, string>> = {
  fierce: { 'attack.miss': 'No mercy, but the strike misses:', 'attack.crit': 'A brutal critical:', 'aura.scorch': 'The heat bites:' },
  smug: { 'attack.miss': 'A confident whiff:', 'attack.crit': 'A stylish critical:', 'heal.calm-glow': 'Naturally, a recovery:' },
  hustler: { 'attack.miss': 'The gamble misses:', 'attack.crit': 'A profitable critical:', 'aura.scorch': 'The burn collects:' },
  hungry: { 'attack.miss': 'So close, still hungry:', 'attack.crit': 'A tasty critical:', 'heal.calm-glow': 'A little refresh:' },
  gloom: { 'attack.miss': 'Another bleak miss:', 'attack.crit': 'A grim critical:', 'heal.calm-glow': 'A brief glimmer:' },
  neutral: {},
};
export function renderNarration(event: FightEvent, voiceClass: VoiceClass): string {
  const template = base[event.narration_key];
  if (!template) return 'The exchange resolves.';
  const body = template(event.vars); const lead = voiceLead[voiceClass][event.narration_key];
  return lead ? `${lead} ${body}` : body;
}
