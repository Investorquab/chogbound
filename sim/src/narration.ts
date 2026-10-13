import type { FightEvent, FightSummary, VoiceClass } from './types.js';

export type NarrationKind = 'hit' | 'crit' | 'miss' | 'dodge' | 'proc' | 'ko' | 'win';
type Template = (event: FightEvent) => string;

const voiceStyle: Record<VoiceClass, readonly [string, string, string, string]> = {
  fierce: ['No mercy.', 'Steel resolve.', 'Brutal truth.', 'War drums.'],
  smug: ['As expected.', 'A flawless flex.', 'Naturally.', 'Do admire this.'],
  hustler: ['The hustle speaks.', 'Cash the moment.', 'Read the play.', 'Another deal.'],
  hungry: ['Still hungry.', 'A tasty turn.', 'Feed the fire.', 'One more bite.'],
  gloom: ['A dim omen.', 'The clouds gather.', 'A bleak chapter.', 'No bright side.'],
  neutral: ['The bout turns.', 'The record shows.', 'The moment lands.', 'The exchange speaks.'],
};

const moveName = (event: FightEvent) => String(event.move);
const numeric = (event: FightEvent, key: string, fallback: number) => {
  const value = event.vars[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};
const targetHp = (event: FightEvent) => {
  const fromVars = event.vars.target_hp;
  if (typeof fromVars === 'number') return fromVars;
  return event.hp_after[event.actor === 'a' ? 'b' : 'a'];
};
const damage = (event: FightEvent) => numeric(event, 'damage', event.damage);

// Each category has four distinct, event-driven templates. The voice prefix makes
// the same category sound different for every Mouth class without adding facts.
const templates: Record<NarrationKind, readonly [Template, Template, Template, Template]> = {
  hit: [
    e => `${moveName(e)} lands for ${damage(e)} damage; ${targetHp(e)} HP remain.`,
    e => `${moveName(e)} connects, dealing ${damage(e)} damage and leaving ${targetHp(e)} HP.`,
    e => `The ${moveName(e)} strike takes ${damage(e)} HP; the target stands at ${targetHp(e)} HP.`,
    e => `${moveName(e)} finds its mark for ${damage(e)} damage; ${targetHp(e)} HP are left.`,
  ],
  crit: [
    e => `${moveName(e)} scores a critical for ${damage(e)} damage; ${targetHp(e)} HP remain.`,
    e => `Critical impact: ${moveName(e)} deals ${damage(e)} damage, leaving ${targetHp(e)} HP.`,
    e => `${moveName(e)} erupts into a critical hit for ${damage(e)}; the target has ${targetHp(e)} HP.`,
    e => `A critical ${moveName(e)} takes ${damage(e)} HP; ${targetHp(e)} HP remain.`,
  ],
  miss: [
    e => `${moveName(e)} misses cleanly.`,
    e => `The ${moveName(e)} attack cuts through empty space.`,
    e => `${moveName(e)} fails to find its mark.`,
    e => `No contact: ${moveName(e)} misses the target.`,
  ],
  dodge: [
    e => `The target slips past ${moveName(e)}.`,
    e => `${moveName(e)} is evaded at the last moment.`,
    e => `A clean dodge defeats ${moveName(e)}.`,
    e => `The incoming ${moveName(e)} finds only air.`,
  ],
  proc: [
    e => `${moveName(e)} triggers a special effect${e.procs.length ? `: ${e.procs.join(', ')}` : ''}.`,
    e => `A trait effect answers ${moveName(e)}${e.procs.length ? ` (${e.procs.join(', ')})` : ''}.`,
    e => `${moveName(e)} shifts the exchange${e.procs.length ? ` with ${e.procs.join(', ')}` : ''}.`,
    e => `The special effect resolves around ${moveName(e)}${e.procs.length ? `: ${e.procs.join(', ')}` : ''}.`,
  ],
  ko: [
    e => `${moveName(e)} ends the fight with a knockout.`,
    e => `The bout is over: ${moveName(e)} delivers the finishing blow.`,
    e => `${moveName(e)} leaves the opponent unable to continue.`,
    e => `A knockout closes the exchange after ${moveName(e)}.`,
  ],
  win: [
    _e => `Victory belongs to this Chog.`,
    _e => `The final call goes to this fighter.`,
    _e => `This Chog claims the bout.`,
    _e => `The winner stands tall.`,
  ],
};

function seedOffset(seed: string | number | bigint): number {
  const text = String(seed);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
  return hash % 4;
}
function pickIndex(eventIndex: number, seed: string | number | bigint): number {
  return ((Math.max(1, Math.trunc(eventIndex)) - 1 + seedOffset(seed)) % 4 + 4) % 4;
}

export function renderNarrationKind(event: FightEvent, voiceClass: VoiceClass, kind: NarrationKind, seed: string | number | bigint = ''): string {
  const index = pickIndex(event.n, seed);
  return `${voiceStyle[voiceClass][index]} ${templates[kind][index](event)}`;
}

export function classifyNarration(event: FightEvent): NarrationKind {
  const targetSide = event.actor === 'a' ? 'b' : 'a';
  if (event.damage > 0 && event.hp_after[targetSide] === 0) return 'ko';
  if (event.outcome === 'dodge') return 'dodge';
  if (event.outcome === 'miss') return 'miss';
  if (event.outcome === 'crit') return 'crit';
  if (event.action === 'heal' || /^(aura|accessory|signature)\./.test(event.narration_key)) return 'proc';
  return 'hit';
}

/** Render one event using only facts recorded in that event and deterministic seed/index selection. */
export function renderNarration(event: FightEvent, voiceClass: VoiceClass, seed: string | number | bigint = ''): string {
  const kind = classifyNarration(event);
  // Preserve informational Scan events as a proc narration; all content comes from the event.
  if (event.narration_key === 'signature.scan') {
    const index = pickIndex(event.n, seed);
    const plan = String(event.vars.rival_plan ?? '');
    const scanLines = [
      `Scan reveals the rival plan: ${plan}.`,
      `The rival's plan is exposed: ${plan}.`,
      `Readout complete; the rival plans ${plan}.`,
      `Intel secured on the rival plan: ${plan}.`,
    ] as const;
    return `${voiceStyle[voiceClass][index]} ${scanLines[index]}`;
  }
  return renderNarrationKind(event, voiceClass, kind, seed);
}

/** A deterministic end-of-fight line. No numeric claims are added outside the event log. */
export function renderFightEnding(summary: FightSummary, voiceClass: VoiceClass, side: 'a' | 'b', eventIndex: number, seed: string | number | bigint = summary.seed): string {
  const pseudoEvent: FightEvent = {
    n: eventIndex, round: summary.rounds, actor: side, action: 'opening', move: 'Headbutt', outcome: 'hit',
    damage: 0, heal: 0, hp_after: { ...summary.final_hp }, procs: [], narration_key: 'fight.ending', vars: {},
  };
  const won = summary.winner === side;
  const kind: NarrationKind = won ? 'win' : summary.ko ? 'ko' : 'proc';
  return renderNarrationKind(pseudoEvent, voiceClass, kind, seed);
}
