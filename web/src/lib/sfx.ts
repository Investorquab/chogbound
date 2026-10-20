/**
 * Game sound effects, generated with the Web Audio API. No audio files are shipped, so there is nothing to license.
 * Every function takes any audio context (including an offline one), so the exact code that plays in the game can be
 * rendered to a file for review and unit tested without a browser.
 */
export type SfxKind = 'start' | 'whoosh' | 'whip' | 'swoosh' | 'clang' | 'laser' | 'scan' | 'charm' | 'stare' | 'chaos' | 'hit' | 'crit' | 'miss' | 'dodge' | 'heal' | 'burn' | 'ko' | 'win' | 'lose' | 'click';
/** Upper bound in seconds of each sound, used to size offline renders and to check nothing runs long. */
export const SFX_DURATION: Record<SfxKind, number> = { start: 0.8, whoosh: 0.22, whip: 0.16, swoosh: 0.34, clang: 0.42, laser: 0.36, scan: 0.32, charm: 0.55, stare: 0.45, chaos: 0.42, hit: 0.3, crit: 0.62, miss: 0.35, dodge: 0.4, heal: 0.65, burn: 0.5, ko: 1.0, win: 1.2, lose: 1.5, click: 0.08 };
export type SfxOptions = { pitch?: number; variant?: number };

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
const MAX_HZ = 18000;
const hz = (f: number) => Math.max(20, Math.min(MAX_HZ, f));
export type Tone = { at: number; dur: number; f0: number; f1?: number; type?: OscillatorType; gain?: number; attack?: number };
export function playTone(ctx: BaseAudioContext, out: AudioNode, t: Tone) {
  const osc = ctx.createOscillator(); const gain = ctx.createGain(); const attack = t.attack ?? 0.004;
  osc.type = t.type ?? 'sine';
  osc.frequency.setValueAtTime(hz(t.f0), t.at);
  if (t.f1 && t.f1 !== t.f0) osc.frequency.exponentialRampToValueAtTime(hz(t.f1), t.at + t.dur);
  gain.gain.setValueAtTime(0.0001, t.at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, t.gain ?? 0.3), t.at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t.at + t.dur);
  osc.connect(gain).connect(out); osc.start(t.at); osc.stop(t.at + t.dur + 0.02);
}
export type Noise = { at: number; dur: number; filter: BiquadFilterType; f0: number; f1: number; q?: number; gain?: number; attack?: number };
export function playNoise(ctx: BaseAudioContext, out: AudioNode, n: Noise) {
  const src = ctx.createBufferSource(); const filter = ctx.createBiquadFilter(); const gain = ctx.createGain(); const attack = n.attack ?? 0.003;
  src.buffer = noiseBuffer(ctx);
  filter.type = n.filter; filter.Q.value = n.q ?? 1;
  filter.frequency.setValueAtTime(hz(n.f0), n.at); filter.frequency.exponentialRampToValueAtTime(hz(n.f1), n.at + n.dur);
  gain.gain.setValueAtTime(0.0001, n.at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, n.gain ?? 0.3), n.at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, n.at + n.dur);
  src.connect(filter).connect(gain).connect(out); src.start(n.at, 0, n.dur + 0.02);
}

/** Queue one sound on `ctx`, starting at audio-clock time `at`, into `out`. `pitch` and `variant` make repeats differ slightly. */
export function scheduleSfx(ctx: BaseAudioContext, out: AudioNode, kind: SfxKind, at: number, options: SfxOptions = {}): void {
  const p = options.pitch ?? 1; const v = Math.abs(Math.floor(options.variant ?? 0)) % 4;
  const T = (t: Tone) => playTone(ctx, out, { ...t, f0: t.f0 * p, f1: t.f1 === undefined ? undefined : t.f1 * p });
  const N = (n: Noise) => playNoise(ctx, out, { ...n, f0: n.f0 * p, f1: n.f1 * p });
  /** A landed hit is a layered composite: a sharp crack on top, a slap in the middle and a low thud underneath. */
  const impact = (power: number) => {
    N({ at, dur: 0.04, filter: 'highpass', f0: 3500 + v * 400, f1: 7000, q: 0.7, gain: 2.6 * power, attack: 0.001 });
    N({ at, dur: 0.09, filter: 'bandpass', f0: 1200 + v * 220, f1: 700, q: 1.1, gain: 3.2 * power });
    T({ at, dur: 0.2, f0: 150 + v * 20, f1: 48, gain: 0.75 * power });
    T({ at, dur: 0.05, f0: 300, f1: 120, type: 'square', gain: 0.1 * power });
  };
  switch (kind) {
    case 'click': T({ at, dur: 0.05, f0: 1100, f1: 700, type: 'square', gain: 0.3 }); break;
    case 'start':
      T({ at, dur: 0.09, f0: 440, type: 'square', gain: 0.2 });
      T({ at: at + 0.18, dur: 0.09, f0: 440, type: 'square', gain: 0.2 });
      T({ at: at + 0.36, dur: 0.4, f0: 880, type: 'square', gain: 0.24 });
      T({ at: at + 0.36, dur: 0.42, f0: 110, f1: 70, gain: 0.5 });
      N({ at: at + 0.36, dur: 0.38, filter: 'bandpass', f0: 300, f1: 3200, q: 0.8, gain: 1.0 });
      break;
    case 'whoosh': N({ at, dur: 0.18, filter: 'bandpass', f0: 300, f1: 1900, q: 1.2, gain: 1.1, attack: 0.07 }); break;
    case 'whip': N({ at, dur: 0.1, filter: 'bandpass', f0: 1200, f1: 4200, q: 1.5, gain: 1.3, attack: 0.03 }); break;
    case 'swoosh':
      N({ at, dur: 0.26, filter: 'bandpass', f0: 200, f1: 1400, q: 1, gain: 1.5, attack: 0.1 });
      T({ at, dur: 0.26, f0: 80, f1: 150, gain: 0.18, attack: 0.1 });
      break;
    case 'clang':
      [820, 1330, 2100].forEach((f, i) => T({ at, dur: 0.34 - i * 0.05, f0: f, type: i === 0 ? 'square' : 'triangle', gain: 0.14 }));
      N({ at, dur: 0.05, filter: 'highpass', f0: 5000, f1: 8000, q: 0.7, gain: 0.6, attack: 0.001 });
      break;
    case 'laser':
      T({ at, dur: 0.3, f0: 2000, f1: 180, type: 'sawtooth', gain: 0.16 });
      T({ at, dur: 0.3, f0: 1000, f1: 90, type: 'square', gain: 0.09 });
      N({ at, dur: 0.12, filter: 'highpass', f0: 4000, f1: 9000, q: 0.7, gain: 0.5, attack: 0.002 });
      break;
    case 'scan': [1200, 1600, 2000].forEach((f, i) => T({ at: at + i * 0.07, dur: 0.06, f0: f, type: 'square', gain: 0.16 })); T({ at, dur: 0.28, f0: 400, f1: 2400, type: 'triangle', gain: 0.07 }); break;
    case 'charm': [1319, 1568, 1976, 2637].forEach((f, i) => T({ at: at + i * 0.08, dur: 0.18, f0: f, type: 'triangle', gain: 0.17 })); N({ at: at + 0.05, dur: 0.4, filter: 'highpass', f0: 6000, f1: 10000, q: 0.7, gain: 0.3, attack: 0.05 }); break;
    case 'stare':
      T({ at, dur: 0.4, f0: 70, f1: 160, gain: 0.4, attack: 0.18 });
      N({ at, dur: 0.4, filter: 'lowpass', f0: 300, f1: 700, q: 0.8, gain: 0.9, attack: 0.2 });
      break;
    case 'chaos': [440, 1320, 660, 1760, 550, 1480].forEach((f, i) => T({ at: at + i * 0.05, dur: 0.045, f0: f, type: 'square', gain: 0.15 })); N({ at, dur: 0.3, filter: 'bandpass', f0: 800, f1: 3000, q: 2, gain: 0.8, attack: 0.05 }); break;
    case 'hit': impact(1); break;
    case 'crit':
      impact(1.25);
      T({ at, dur: 0.3, f0: 120, f1: 36, gain: 0.5 });
      T({ at, dur: 0.09, f0: 660, f1: 1320, type: 'square', gain: 0.2 });
      T({ at: at + 0.04, dur: 0.38, f0: 1320, type: 'triangle', gain: 0.18 });
      T({ at: at + 0.04, dur: 0.3, f0: 2210, type: 'triangle', gain: 0.12 });
      T({ at: at + 0.1, dur: 0.3, f0: 2093, type: 'triangle', gain: 0.12 });
      N({ at: at + 0.02, dur: 0.22, filter: 'highpass', f0: 4000, f1: 9000, q: 0.7, gain: 0.14 });
      break;
    case 'miss': N({ at, dur: 0.28, filter: 'bandpass', f0: 500, f1: 2600, q: 1.5, gain: 1.3, attack: 0.1 }); break;
    case 'dodge':
      N({ at, dur: 0.22, filter: 'bandpass', f0: 2400, f1: 600, q: 2, gain: 1.4, attack: 0.06 });
      T({ at: at + 0.1, dur: 0.14, f0: 700, f1: 1200, type: 'triangle', gain: 0.26 });
      break;
    case 'heal': [523, 659, 784, 1047].forEach((f, i) => T({ at: at + i * 0.09, dur: i === 3 ? 0.34 : 0.16, f0: f, type: 'triangle', gain: 0.3 })); break;
    case 'burn':
      [0, 0.05, 0.11, 0.15, 0.22, 0.27, 0.33].forEach((o, i) => T({ at: at + o, dur: 0.035, f0: 2600 + i * 350, f1: 1500, type: 'square', gain: 0.16 }));
      T({ at, dur: 0.38, f0: 200, f1: 90, type: 'sawtooth', gain: 0.14 });
      N({ at, dur: 0.36, filter: 'highpass', f0: 3500, f1: 2000, q: 0.7, gain: 0.12, attack: 0.05 });
      break;
    case 'ko':
      impact(1.3);
      T({ at, dur: 0.8, f0: 140, f1: 28, gain: 0.85 });
      T({ at, dur: 0.6, f0: 420, f1: 60, type: 'sawtooth', gain: 0.22 });
      N({ at, dur: 0.7, filter: 'lowpass', f0: 3500, f1: 80, q: 0.6, gain: 0.55 });
      break;
    case 'win':
      [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.7]].forEach(([f, o, d]) => { T({ at: at + o, dur: d, f0: f, type: 'square', gain: 0.22 }); T({ at: at + o, dur: d, f0: f / 2, type: 'triangle', gain: 0.27 }); });
      N({ at: at + 0.36, dur: 0.6, filter: 'highpass', f0: 5000, f1: 9000, q: 0.7, gain: 0.07 });
      break;
    case 'lose': [[392, 0, 0.2], [330, 0.22, 0.2], [262, 0.44, 0.2], [196, 0.66, 0.8]].forEach(([f, o, d]) => T({ at: at + o, dur: d, f0: f, f1: f * 0.96, type: 'triangle', gain: 0.32 })); break;
  }
}

/** Separate volume controls for effects, fighter voices and music, then one limiter so overlapping sounds never clip. */
export type Mixer = { master: GainNode; sfx: GainNode; voice: GainNode; musicVolume: GainNode; musicDuck: GainNode };
export function createMixer(ctx: BaseAudioContext): Mixer {
  const master = ctx.createGain(); master.gain.value = 0.6;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -8; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.1;
  master.connect(limiter); limiter.connect(ctx.destination);
  const bus = (gain: number) => { const g = ctx.createGain(); g.gain.value = gain; g.connect(master); return g; };
  const musicVolume = ctx.createGain(); musicVolume.gain.value = 0.5;
  const musicDuck = ctx.createGain(); musicDuck.gain.value = 1;
  musicVolume.connect(musicDuck); musicDuck.connect(master);
  return { master, sfx: bus(1), voice: bus(0.5), musicVolume, musicDuck };
}
/** Dip the music for an instant so a big impact is the loudest thing in the mix, then bring it back. */
export function duckMusic(mixer: Mixer, at: number, depth: number, seconds: number): void {
  const g = mixer.musicDuck.gain;
  g.cancelScheduledValues(at);
  g.setTargetAtTime(depth, at, 0.01);
  g.setTargetAtTime(1, at + seconds, 0.15);
}
