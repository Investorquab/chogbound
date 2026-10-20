import { playNoise, playTone } from './sfx.js';

/** A short arcade loop that builds in intensity. Steps are sixteenth notes; two bars repeat. */
export const MUSIC_BPM = 128;
export const STEP_SECONDS = 60 / MUSIC_BPM / 4;
export const MUSIC_STEPS = 32;
const BASS = [55, 0, 55, 0, 65.41, 0, 55, 0, 82.41, 0, 73.42, 0, 65.41, 0, 55, 0, 55, 0, 55, 0, 73.42, 0, 65.41, 0, 98, 0, 82.41, 0, 73.42, 0, 65.41, 0];
const ARP = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63];
export type MusicLevel = 1 | 2 | 3;
/** Intensity from the lowest health on the stage: calm at the start, tense when someone is close to going down. */
export function musicLevelForHp(lowestHp: number): MusicLevel { return lowestHp <= 25 ? 3 : lowestHp <= 50 ? 2 : 1; }

/** Queue one sixteenth step of the loop. Level 1 is kick, snare, bass and hats; 2 adds arpeggio and busier drums; 3 adds stabs. */
export function scheduleMusicStep(ctx: BaseAudioContext, out: AudioNode, step: number, at: number, level: MusicLevel): void {
  const s = step % MUSIC_STEPS;
  if (s % 4 === 0 || (level >= 2 && s % 8 === 6)) playTone(ctx, out, { at, dur: 0.13, f0: 125, f1: 45, gain: 0.55 });
  if (s % 8 === 4) { playNoise(ctx, out, { at, dur: 0.1, filter: 'bandpass', f0: 1900, f1: 1300, q: 0.9, gain: 0.8 }); playTone(ctx, out, { at, dur: 0.09, f0: 200, f1: 130, gain: 0.25 }); }
  if (level >= 3 && s >= 24 && s % 2 === 1) playNoise(ctx, out, { at, dur: 0.06, filter: 'bandpass', f0: 1900, f1: 1500, q: 0.9, gain: 0.5 });
  if (level >= 2 || s % 2 === 0) playNoise(ctx, out, { at, dur: 0.035, filter: 'highpass', f0: 6500, f1: 8000, q: 0.7, gain: s % 4 === 2 ? 0.35 : 0.2, attack: 0.001 });
  const bass = BASS[s];
  if (bass) playTone(ctx, out, { at, dur: STEP_SECONDS * 1.7, f0: bass, type: 'square', gain: 0.2 });
  if (level >= 2) playTone(ctx, out, { at, dur: STEP_SECONDS * 0.9, f0: ARP[(s * 3) % ARP.length], type: 'triangle', gain: 0.1 });
  if (level >= 3 && s % 4 === 2) playTone(ctx, out, { at, dur: STEP_SECONDS * 1.2, f0: ARP[(s / 2) % ARP.length] * 4, type: 'square', gain: 0.05 });
}
