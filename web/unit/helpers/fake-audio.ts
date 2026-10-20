/** A recording stand-in for the Web Audio API that also rejects the calls a real browser would throw on. */
export class FakeParam {
  last = -1; value = 0; sets: number[] = []; targets: [number, number][] = []; cancelled = 0;
  constructor(public name: string, private log: string[], private peaks?: number[]) {}
  setValueAtTime(v: number, t: number) { if (!Number.isFinite(v) || !Number.isFinite(t)) this.log.push(`${this.name}: non finite set`); this.sets.push(v); this.last = Math.max(this.last, t); }
  exponentialRampToValueAtTime(v: number, t: number) { if (!(v > 0)) this.log.push(`${this.name}: exponential ramp to ${v}`); if (!(t > this.last)) this.log.push(`${this.name}: ramp time ${t} not after ${this.last}`); this.last = t; if (this.name === 'gain') this.peaks?.push(v); }
  setTargetAtTime(v: number, t: number, tc: number) { if (!(tc > 0) || !Number.isFinite(v) || !Number.isFinite(t)) this.log.push(`${this.name}: bad target`); this.targets.push([v, t]); }
  cancelScheduledValues() { this.cancelled++; }
}
export class FakeNode { id = 0; connect<T>(to: T): T { (this as unknown as { ctx: FakeCtx }).ctx.edges.push([this, to as unknown as FakeNode]); return to; } }
export class FakeCtx {
  sampleRate = 44100; currentTime = 0; state = 'running'; destination: FakeNode; edges: [FakeNode, FakeNode][] = [];
  log: string[] = []; peaks: number[] = []; oscillators: { type: string; f0: number[]; start: number; stop: number }[] = []; sources: { start: number; end: number }[] = []; filters: { type: string; f0: number[] }[] = [];
  resumed = 0; suspended = 0;
  constructor() { this.destination = this.node(new FakeNode()); }
  private node<T extends FakeNode>(n: T): T { (n as unknown as { ctx: FakeCtx }).ctx = this; return n; }
  resume() { this.resumed++; this.state = 'running'; return Promise.resolve(); }
  suspend() { this.suspended++; this.state = 'suspended'; return Promise.resolve(); }
  createBuffer(_c: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
  createOscillator() {
    const frequency = new FakeParam('freq', this.log); const rec = { type: 'sine', f0: frequency.sets, start: -1, stop: -1 }; this.oscillators.push(rec);
    const o = this.node(new FakeNode()) as FakeNode & Record<string, unknown>;
    Object.defineProperty(o, 'type', { set: (v: string) => { rec.type = v; }, get: () => rec.type });
    Object.assign(o, { frequency, start: (at: number) => { rec.start = at; }, stop: (at: number) => { rec.stop = at; } }); return o;
  }
  createBufferSource() { const o = this.node(new FakeNode()) as FakeNode & Record<string, unknown>; Object.assign(o, { buffer: null, start: (at: number, _off: number, dur: number) => { this.sources.push({ start: at, end: at + dur }); } }); return o; }
  createBiquadFilter() { const frequency = new FakeParam('filter', this.log); const rec = { type: 'lowpass', f0: frequency.sets }; this.filters.push(rec); const o = this.node(new FakeNode()) as FakeNode & Record<string, unknown>; Object.defineProperty(o, 'type', { set: (v: string) => { rec.type = v; }, get: () => rec.type }); Object.assign(o, { Q: { value: 1 }, frequency }); return o; }
  createGain() { const o = this.node(new FakeNode()) as FakeNode & { gain: FakeParam }; o.gain = new FakeParam('gain', this.log, this.peaks); return o; }
  createDynamicsCompressor() { const p = () => ({ value: 0 }); const o = this.node(new FakeNode()) as FakeNode & Record<string, unknown>; Object.assign(o, { threshold: p(), knee: p(), ratio: p(), attack: p(), release: p() }); return o; }
  /** How many times something was connected into `target`. */
  into(target: unknown): number { return this.edges.filter(([, to]) => to === target).length; }
  asContext(): BaseAudioContext { return this as unknown as BaseAudioContext; }
  /** Oscillator and noise starts, for measuring time spans. */
  spans(): { at: number; end: number }[] { return [...this.oscillators.filter((o) => o.start >= 0).map((o) => ({ at: o.start, end: o.stop })), ...this.sources.map((s) => ({ at: s.start, end: s.end }))]; }
}
