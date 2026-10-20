import type { FightEvent, Side, VoiceClass } from 'chogbound-sim/src/types.js';
import { eventKind } from './event-kind.js';
import { MUSIC_STEPS, STEP_SECONDS, scheduleMusicStep, type MusicLevel } from './music.js';
import { createMixer, duckMusic, scheduleSfx, type Mixer, type SfxKind, type SfxOptions } from './sfx.js';
import { VOICE_PITCH, scheduleVocal, type VocalKind } from './vocals.js';

export type Voices = { a: VoiceClass; b: VoiceClass };
export type AudioSwitches = { sfx: boolean; voice: boolean };
const BOTH: AudioSwitches = { sfx: true, voice: true };

/** Every move has its own wind-up sound, so you can tell what is coming before it lands. */
export function windupFor(move: string): SfxKind {
  switch (move) {
    case 'Headbutt': return 'swoosh';
    case 'Quick Feet': return 'whip';
    case 'Iron Hide': return 'clang';
    case 'Laser Stare': return 'laser';
    case 'Scan': return 'scan';
    case 'Charm': return 'charm';
    case 'Stare Down': return 'stare';
    case 'Chaos Gaze': return 'chaos';
    default: return 'whoosh';
  }
}
/** Small, repeatable change per event (about 6 percent) so no two grunts or whooshes are identical. */
const wobble = (n: number, salt: number) => 1 + (((n * 13 + salt * 7) % 7) - 3) * 0.02;

/**
 * The sound of one fight event, laid out the way fighting games do it: the attacker shouts first, the move winds up, the
 * impact lands (crack, slap and thud) and the target reacts. A miss is only the wind-up and a whiff. The music ducks
 * under big impacts. All times are relative to `at`.
 */
export function scheduleEventAudio(ctx: BaseAudioContext, mixer: Mixer, event: FightEvent, voices: Voices, at: number, on: AudioSwitches = BOTH): void {
  const kind = eventKind(event); const attacker = event.actor; const target: Side = attacker === 'a' ? 'b' : 'a';
  const sound = (k: SfxKind, dt: number, options: SfxOptions = {}) => { if (on.sfx) scheduleSfx(ctx, mixer.sfx, k, at + dt, { variant: event.n, pitch: wobble(event.n, 3), ...options }); };
  const voice = (k: VocalKind, side: Side, dt: number) => { if (on.voice) scheduleVocal(ctx, mixer.voice, k, at + dt, VOICE_PITCH[voices[side]] * wobble(event.n, side === 'a' ? 1 : 2)); };
  switch (kind) {
    case 'hit': case 'crit': case 'ko':
      voice(kind === 'hit' ? 'attack' : 'heavy', attacker, 0);
      sound(windupFor(event.move), 0.04);
      sound(kind, 0.22);
      voice(kind === 'crit' ? 'bigHurt' : kind === 'ko' ? 'ko' : 'hurt', target, kind === 'ko' ? 0.3 : 0.26);
      if (on.sfx) duckMusic(mixer, at + 0.2, kind === 'hit' ? 0.5 : 0.25, kind === 'hit' ? 0.3 : 0.7);
      break;
    case 'miss': voice('attack', attacker, 0); sound(windupFor(event.move), 0.04); sound('miss', 0.12); break;
    case 'dodge': voice('attack', attacker, 0); sound(windupFor(event.move), 0.04); sound('dodge', 0.16); voice('dodge', target, 0.18); break;
    case 'heal': sound('heal', 0); break;
    case 'burn': sound('burn', 0); voice('hurt', target, 0.12); break;
  }
}
/** The "round one, fight" moment: the start stinger, then both fighters shout. */
export function scheduleStartAudio(ctx: BaseAudioContext, mixer: Mixer, voices: Voices, at: number, on: AudioSwitches = BOTH): void {
  if (on.sfx) scheduleSfx(ctx, mixer.sfx, 'start', at);
  if (on.voice) { scheduleVocal(ctx, mixer.voice, 'attack', at + 0.36, VOICE_PITCH[voices.a]); scheduleVocal(ctx, mixer.voice, 'attack', at + 0.52, VOICE_PITCH[voices.b] * 1.04); }
}
/** The result: the jingle for the player's outcome and a cheer from whoever won. */
export function scheduleResultAudio(ctx: BaseAudioContext, mixer: Mixer, youWon: boolean, voices: Voices, at: number, on: AudioSwitches = BOTH): void {
  if (on.sfx) scheduleSfx(ctx, mixer.sfx, youWon ? 'win' : 'lose', at);
  if (on.voice) scheduleVocal(ctx, mixer.voice, 'cheer', at + 0.3, VOICE_PITCH[youWon ? voices.a : voices.b]);
}

export type AudioFlags = { master: boolean; sfx: boolean; voice: boolean; music: boolean };
export const AUDIO_KEYS = { master: 'chogbound.sfx', voice: 'chogbound.voice', music: 'chogbound.music' } as const;

/** Plays all of the above on a real audio context, created on first use (browsers only allow audio after a tap or click). */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private mixer: Mixer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0; private next = 0; private level: MusicLevel = 1; private running = false;
  flags: AudioFlags = { master: true, sfx: true, voice: true, music: true };
  isSupported(): boolean { return typeof window !== 'undefined' && Boolean(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext); }
  /** Create and resume the audio context. Call it from a click or tap handler. */
  unlock(): void {
    if (!this.isSupported()) return;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor(); this.mixer = createMixer(this.ctx);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  private ready(): { ctx: AudioContext; mixer: Mixer } | null {
    if (!this.flags.master) return null;
    this.unlock();
    return this.ctx && this.mixer ? { ctx: this.ctx, mixer: this.mixer } : null;
  }
  private switches(): AudioSwitches { return { sfx: this.flags.sfx, voice: this.flags.voice }; }
  click(): void { const r = this.ready(); if (r && this.flags.sfx) scheduleSfx(r.ctx, r.mixer.sfx, 'click', r.ctx.currentTime + 0.01); }
  playEvent(event: FightEvent, voices: Voices): void { const r = this.ready(); if (r) scheduleEventAudio(r.ctx, r.mixer, event, voices, r.ctx.currentTime + 0.02, this.switches()); }
  playStart(voices: Voices): void { const r = this.ready(); if (r) scheduleStartAudio(r.ctx, r.mixer, voices, r.ctx.currentTime + 0.02, this.switches()); }
  playResult(youWon: boolean, voices: Voices, delaySeconds = 0): void { const r = this.ready(); if (r) scheduleResultAudio(r.ctx, r.mixer, youWon, voices, r.ctx.currentTime + 0.02 + delaySeconds, this.switches()); }
  startMusic(level: MusicLevel = 1): void {
    this.level = level;
    if (this.running || !this.flags.music) return;
    const r = this.ready(); if (!r) return;
    this.running = true; this.step = 0; this.next = r.ctx.currentTime + 0.05;
    const volume = r.mixer.musicVolume.gain; volume.cancelScheduledValues(r.ctx.currentTime); volume.setTargetAtTime(0.5, r.ctx.currentTime, 0.05);
    this.timer = setInterval(() => this.pump(), 30);
  }
  setMusicLevel(level: MusicLevel): void { this.level = level; }
  stopMusic(fadeSeconds = 0.4): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.running && this.ctx && this.mixer) this.mixer.musicVolume.gain.setTargetAtTime(0, this.ctx.currentTime, fadeSeconds / 3);
    this.running = false;
  }
  /** Apply new switches. Turning music or everything off silences the loop immediately. */
  setFlags(flags: Partial<AudioFlags>): void {
    this.flags = { ...this.flags, ...flags };
    if (!this.flags.master || !this.flags.music) this.stopMusic(0.1);
    if (!this.flags.master && this.ctx?.state === 'running') void this.ctx.suspend();
  }
  private pump(): void {
    if (!this.ctx || !this.mixer) return;
    if (this.next < this.ctx.currentTime - 0.1) this.next = this.ctx.currentTime + 0.05;
    while (this.next < this.ctx.currentTime + 0.15) {
      scheduleMusicStep(this.ctx, this.mixer.musicVolume, this.step, this.next, this.level);
      this.next += STEP_SECONDS; this.step = (this.step + 1) % MUSIC_STEPS;
    }
  }
}
export const audio = new AudioEngine();
