/**
 * Game sound effects, generated with the Web Audio API. No audio files are shipped, so there is nothing to license.
 * `scheduleSfx` works on any audio context, including an offline one, so the exact same code can be rendered to a file
 * for review and unit tested without a browser.
 */
export type SfxKind = 'start' | 'whoosh' | 'hit' | 'crit' | 'miss' | 'dodge' | 'heal' | 'burn' | 'ko' | 'win' | 'lose' | 'click';
/** Upper bound in seconds of each sound, used to size offline renders and to check nothing runs long. */
export const SFX_DURATION: Record<SfxKind, number> = { start: 0.8, whoosh: 0.22, hit: 0.3, crit: 0.55, miss: 0.35, dodge: 0.4, heal: 0.65, burn: 0.5, ko: 1.0, win: 1.2, lose: 1.5, click: 0.08 };

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();
function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 1.2), ctx.sampleRate);
    const data = buffer.getChannelData(0); let seed = 12345;
    for (let i = 0; i < data.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = (seed / 0xffffffff) * 2 - 1; }
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}
type Tone = { at: number; dur: number; f0: number; f1?: number; type?: OscillatorType; gain?: number; attack?: number };
function tone(ctx: BaseAudioContext, out: AudioNode, t: Tone) {
  const osc = ctx.createOscillator(); const gain = ctx.createGain(); const attack = t.attack ?? 0.004;
  osc.type = t.type ?? 'sine';
  osc.frequency.setValueAtTime(t.f0, t.at);
  if (t.f1 && t.f1 !== t.f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, t.f1), t.at + t.dur);
  gain.gain.setValueAtTime(0.0001, t.at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, t.gain ?? 0.3), t.at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t.at + t.dur);
  osc.connect(gain).connect(out); osc.start(t.at); osc.stop(t.at + t.dur + 0.02);
}
type Noise = { at: number; dur: number; filter: BiquadFilterType; f0: number; f1: number; q?: number; gain?: number; attack?: number };
function noise(ctx: BaseAudioContext, out: AudioNode, n: Noise) {
  const src = ctx.createBufferSource(); const filter = ctx.createBiquadFilter(); const gain = ctx.createGain(); const attack = n.attack ?? 0.003;
  src.buffer = noiseBuffer(ctx);
  filter.type = n.filter; filter.Q.value = n.q ?? 1;
  filter.frequency.setValueAtTime(n.f0, n.at); filter.frequency.exponentialRampToValueAtTime(Math.max(20, n.f1), n.at + n.dur);
  gain.gain.setValueAtTime(0.0001, n.at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, n.gain ?? 0.3), n.at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, n.at + n.dur);
  src.connect(filter).connect(gain).connect(out); src.start(n.at, 0, n.dur + 0.02);
}
const thud = (c: BaseAudioContext, o: AudioNode, at: number, power = 1) => {
  noise(c, o, { at, dur: 0.14, filter: 'lowpass', f0: 2400, f1: 180, q: 0.7, gain: 0.85 * power });
  tone(c, o, { at, dur: 0.18, f0: 190, f1: 52, gain: 1.1 * power });
  tone(c, o, { at, dur: 0.05, f0: 320, f1: 120, type: 'square', gain: 0.12 * power });
};

/** Queue one sound on `ctx`, starting at audio-clock time `at`, into `out`. */
export function scheduleSfx(ctx: BaseAudioContext, out: AudioNode, kind: SfxKind, at: number): void {
  switch (kind) {
    case 'click': tone(ctx, out, { at, dur: 0.05, f0: 1100, f1: 700, type: 'square', gain: 0.3 }); break;
    case 'start':
      tone(ctx, out, { at, dur: 0.09, f0: 440, type: 'square', gain: 0.2 });
      tone(ctx, out, { at: at + 0.18, dur: 0.09, f0: 440, type: 'square', gain: 0.2 });
      tone(ctx, out, { at: at + 0.36, dur: 0.4, f0: 880, type: 'square', gain: 0.24 });
      tone(ctx, out, { at: at + 0.36, dur: 0.42, f0: 110, f1: 70, gain: 0.5 });
      noise(ctx, out, { at: at + 0.36, dur: 0.38, filter: 'bandpass', f0: 300, f1: 3200, q: 0.8, gain: 0.2 });
      break;
    case 'whoosh': noise(ctx, out, { at, dur: 0.18, filter: 'bandpass', f0: 300, f1: 1900, q: 1.2, gain: 1.1, attack: 0.07 }); break;
    case 'hit': thud(ctx, out, at); break;
    case 'crit':
      thud(ctx, out, at, 1.25);
      tone(ctx, out, { at, dur: 0.3, f0: 120, f1: 36, gain: 0.8 });
      tone(ctx, out, { at, dur: 0.09, f0: 660, f1: 1320, type: 'square', gain: 0.2 });
      tone(ctx, out, { at: at + 0.06, dur: 0.28, f0: 1568, type: 'triangle', gain: 0.22 });
      tone(ctx, out, { at: at + 0.13, dur: 0.3, f0: 2093, type: 'triangle', gain: 0.15 });
      noise(ctx, out, { at: at + 0.02, dur: 0.22, filter: 'highpass', f0: 4000, f1: 9000, q: 0.7, gain: 0.14 });
      break;
    case 'miss': noise(ctx, out, { at, dur: 0.28, filter: 'bandpass', f0: 500, f1: 2600, q: 1.5, gain: 1.3, attack: 0.1 }); break;
    case 'dodge':
      noise(ctx, out, { at, dur: 0.22, filter: 'bandpass', f0: 2400, f1: 600, q: 2, gain: 1.4, attack: 0.06 });
      tone(ctx, out, { at: at + 0.1, dur: 0.14, f0: 700, f1: 1200, type: 'triangle', gain: 0.26 });
      break;
    case 'heal':
      [523, 659, 784, 1047].forEach((f, i) => tone(ctx, out, { at: at + i * 0.09, dur: i === 3 ? 0.34 : 0.16, f0: f, type: 'triangle', gain: 0.3 }));
      break;
    case 'burn':
      [0, 0.05, 0.11, 0.15, 0.22, 0.27, 0.33].forEach((o, i) => tone(ctx, out, { at: at + o, dur: 0.035, f0: 2600 + i * 350, f1: 1500, type: 'square', gain: 0.16 }));
      tone(ctx, out, { at, dur: 0.38, f0: 200, f1: 90, type: 'sawtooth', gain: 0.14 });
      noise(ctx, out, { at, dur: 0.36, filter: 'highpass', f0: 3500, f1: 2000, q: 0.7, gain: 0.12, attack: 0.05 });
      break;
    case 'ko':
      thud(ctx, out, at, 1.3);
      tone(ctx, out, { at, dur: 0.8, f0: 140, f1: 28, gain: 0.85 });
      tone(ctx, out, { at, dur: 0.6, f0: 420, f1: 60, type: 'sawtooth', gain: 0.22 });
      noise(ctx, out, { at, dur: 0.7, filter: 'lowpass', f0: 3500, f1: 80, q: 0.6, gain: 0.55 });
      break;
    case 'win':
      [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.7]].forEach(([f, o, d]) => { tone(ctx, out, { at: at + o, dur: d, f0: f, type: 'square', gain: 0.22 }); tone(ctx, out, { at: at + o, dur: d, f0: f / 2, type: 'triangle', gain: 0.27 }); });
      noise(ctx, out, { at: at + 0.36, dur: 0.6, filter: 'highpass', f0: 5000, f1: 9000, q: 0.7, gain: 0.07 });
      break;
    case 'lose':
      [[392, 0, 0.2], [330, 0.22, 0.2], [262, 0.44, 0.2], [196, 0.66, 0.8]].forEach(([f, o, d]) => { tone(ctx, out, { at: at + o, dur: d, f0: f, f1: f * 0.96, type: 'triangle', gain: 0.32 }); });
      break;
  }
}

/**
 * Master gain followed by a limiter, so overlapping sounds (a KO landing on top of a whoosh) never clip.
 * Returns the node every sound should be connected to.
 */
export function createSfxChain(ctx: BaseAudioContext): GainNode {
  const master = ctx.createGain(); master.gain.value = 0.6;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -8; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.1;
  master.connect(limiter); limiter.connect(ctx.destination);
  return master;
}
export const SFX_STORAGE_KEY = 'chogbound.sfx';
/** Plays sounds on a real audio context created on first use (browsers only allow audio after a tap or click). */
class SfxPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;
  isSupported(): boolean { return typeof window !== 'undefined' && Boolean(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext); }
  /** Create and resume the audio context. Call it from a click or tap handler. */
  unlock(): void {
    if (!this.isSupported()) return;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = createSfxChain(this.ctx);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  play(kind: SfxKind, delaySeconds = 0): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.master) return;
    scheduleSfx(this.ctx, this.master, kind, this.ctx.currentTime + 0.01 + delaySeconds);
  }
}
export const sfx = new SfxPlayer();
