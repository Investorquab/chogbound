import { renderNarration } from 'chogbound-sim/src/narration.js';
import type { FightEvent, VoiceClass } from 'chogbound-sim/src/types.js';
import { humanizeProcIds } from './proc-labels.js';

/**
 * One voiced line per event. The engine appends an extra sentence for every effect that fired, each repeating the damage and
 * HP numbers, so the caption uses the base line and the effects are shown as chips instead. Events that ARE an effect
 * (Scorch burn, Calm Glow heal, Sidekick strike) keep their full text because the effect is the whole event.
 */
export function captionFor(event: FightEvent, voice: VoiceClass, seed: string): string {
  const isEffectEvent = /^(aura|accessory|signature)\./.test(event.narration_key);
  return humanizeProcIds(renderNarration(isEffectEvent ? event : { ...event, procs: [] }, voice, seed));
}
