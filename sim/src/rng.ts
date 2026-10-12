/** Fixed xoshiro128** generator with stable uint64 normalization and splitmix64 state expansion. */
export type RandomSource = { next(): number; int(maxExclusive: number): number; chance(probability: number): boolean };
const MASK64 = 0xffffffffffffffffn;
function hashSeed64(seed: string): bigint {
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < seed.length; i++) {
    h ^= BigInt(seed.charCodeAt(i));
    h = (h * 0x100000001b3n) & MASK64;
  }
  return h;
}
export function normalizeSeed(seed: string | number | bigint): string {
  if (typeof seed === 'bigint') return `0x${BigInt.asUintN(64, seed).toString(16).padStart(16, '0')}`;
  if (typeof seed === 'number' && Number.isFinite(seed)) return `0x${BigInt.asUintN(64, BigInt(Math.trunc(seed))).toString(16).padStart(16, '0')}`;
  const value = String(seed);
  if (/^0x[0-9a-f]{1,16}$/i.test(value)) return `0x${value.slice(2).toLowerCase().padStart(16, '0')}`;
  return `0x${hashSeed64(value).toString(16).padStart(16, '0')}`;
}
const rotl = (x: number, k: number) => ((x << k) | (x >>> (32 - k))) >>> 0;
export function createRng(seed: string | number | bigint): RandomSource {
  let sm = BigInt(normalizeSeed(seed));
  const nextWord = () => {
    sm = (sm + 0x9e3779b97f4a7c15n) & MASK64;
    let z = sm;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
    z ^= z >> 31n;
    return Number(z & 0xffffffffn) >>> 0;
  };
  const state = [nextWord(), nextWord(), nextWord(), nextWord()];
  if (state.join(',') === '0,0,0,0') state[0] = Number(1);
  const next = () => {
    const result = Math.imul(rotl(Math.imul(state[1], 5) >>> 0, 7), 9) >>> 0;
    const t = (state[1] << 9) >>> 0;
    state[2] ^= state[0]; state[3] ^= state[1]; state[1] ^= state[2]; state[0] ^= state[3];
    state[2] ^= t; state[3] = rotl(state[3], 11);
    return result / 0x100000000;
  };
  return { next, int: max => Math.floor(next() * max), chance: p => next() < p };
}
