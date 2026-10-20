import type { VoiceClass } from 'chogbound-sim/src/types.js';
import { playNoise } from './sfx.js';

/**
 * Chog fighter voices: short grunts and shouts built from a buzzing source shaped by vowel formants, the way a voice is.
 * They replace reading sentences aloud. A shout lands just before the hit so the sound telegraphs the attack.
 */
export type VocalKind = 'attack' | 'heavy' | 'dodge' | 'hurt' | 'bigHurt' | 'ko' | 'cheer';
export const VOCAL_DURATION: Record<VocalKind, number> = { attack: 0.24, heavy: 0.36, dodge: 0.16, hurt: 0.28, bigHurt: 0.52, ko: 0.92, cheer: 0.6 };
/** Each voice class has its own pitch, from a deep growl to a squeak. */
export const VOICE_PITCH: Record<VoiceClass, number> = { fierce: 0.78, smug: 1, hustler: 1.12, hungry: 1.28, gloom: 0.62, neutral: 0.95 };
type Vowel = [number, number, number];
const VOWELS: Record<'a' | 'o' | 'i' | 'u', Vowel> = { a: [800, 1200, 2600], o: [500, 900, 2500], i: [300, 2300, 3000], u: [350, 800, 2400] };
type Voice = { at: number; dur: number; f0: number; f1: number; from: keyof typeof VOWELS; to: keyof typeof VOWELS; gain: number; breath: number; vibrato?: [number, number] };

function formantVoice(ctx: BaseAudioContext, out: AudioNode, v: Voice) {
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, v.at);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, v.gain), v.at + 0.02);
  amp.gain.setValueAtTime(Math.max(0.0002, v.gain), v.at + v.dur * 0.55);
  amp.gain.exponentialRampToValueAtTime(0.0001, v.at + v.dur);
  amp.connect(out);
  const source = ctx.createOscillator(); source.type = 'sawtooth';
  source.frequency.setValueAtTime(v.f0, v.at); source.frequency.exponentialRampToValueAtTime(Math.max(40, v.f1), v.at + v.dur);
  if (v.vibrato) {
    const lfo = ctx.createOscillator(); const depth = ctx.createGain(); lfo.frequency.value = v.vibrato[0]; depth.gain.value = v.vibrato[1];
    lfo.connect(depth); depth.connect(source.frequency); lfo.start(v.at); lfo.stop(v.at + v.dur + 0.02);
  }
  const from = VOWELS[v.from]; const to = VOWELS[v.to]; const weights = [5, 3.2, 1.4];
  from.forEach((f, i) => {
    const band = ctx.createBiquadFilter(); band.type = 'bandpass'; band.Q.value = 7 + i * 3;
    band.frequency.setValueAtTime(f, v.at); band.frequency.exponentialRampToValueAtTime(to[i], v.at + v.dur);
    const level = ctx.createGain(); level.gain.value = weights[i];
    source.connect(band); band.connect(level); level.connect(amp);
  });
  source.start(v.at); source.stop(v.at + v.dur + 0.02);
  if (v.breath > 0) playNoise(ctx, amp, { at: v.at, dur: Math.min(v.dur, 0.2), filter: 'highpass', f0: 1800, f1: 1200, q: 0.6, gain: v.breath, attack: 0.01 });
}
/** Queue one grunt or shout. `pitch` is a multiplier (use VOICE_PITCH, plus a little variation per event). */
export function scheduleVocal(ctx: BaseAudioContext, out: AudioNode, kind: VocalKind, at: number, pitch = 1): void {
  const f = (x: number) => x * pitch;
  switch (kind) {
    case 'attack': formantVoice(ctx, out, { at, dur: 0.22, f0: f(300), f1: f(430), from: 'i', to: 'a', gain: 0.9, breath: 0.4 }); break;
    case 'heavy': formantVoice(ctx, out, { at, dur: 0.34, f0: f(210), f1: f(150), from: 'o', to: 'a', gain: 1.1, breath: 0.7, vibrato: [38, f(8)] }); break;
    case 'dodge': formantVoice(ctx, out, { at, dur: 0.14, f0: f(520), f1: f(700), from: 'u', to: 'i', gain: 0.7, breath: 0.2 }); break;
    case 'hurt': formantVoice(ctx, out, { at, dur: 0.26, f0: f(430), f1: f(240), from: 'o', to: 'a', gain: 0.95, breath: 0.3 }); break;
    case 'bigHurt': formantVoice(ctx, out, { at, dur: 0.5, f0: f(540), f1: f(170), from: 'a', to: 'o', gain: 1.1, breath: 0.4, vibrato: [12, f(18)] }); break;
    case 'ko': formantVoice(ctx, out, { at, dur: 0.9, f0: f(460), f1: f(85), from: 'a', to: 'u', gain: 1.1, breath: 0.5, vibrato: [6, f(14)] }); break;
    case 'cheer': formantVoice(ctx, out, { at, dur: 0.58, f0: f(330), f1: f(720), from: 'a', to: 'i', gain: 1.0, breath: 0.3, vibrato: [8, f(10)] }); break;
  }
}
