import { fighterFromToken } from '../src/stats.js';
import { loadTraits } from '../src/traits.js';
import { renderFightEnding, renderNarration } from '../src/narration.js';
import { simulate } from '../src/fight.js';
import type { Fighter, Move, Plan, Risk, Temperament } from '../src/types.js';

const usage = `Usage: npm run fight -- <token-a> <token-b> [options]
Options:
  --a-temperament <Feisty|Cool|Wild>   --b-temperament <Feisty|Cool|Wild>
  --a-move <Headbutt|Quick Feet|Iron Hide|signature>   --b-move <...>
  --a-risk <Safe|Even|Gamble>          --b-risk <Safe|Even|Gamble>
  --seed <seed>                        (default: 1)
Example: npm run fight -- 1 24 --a-temperament Wild --a-move "Laser Stare" --seed 42`;

const args = process.argv.slice(2);
if (args.length < 2 || args[0].startsWith('--') || args[1].startsWith('--')) {
  console.error(usage);
  process.exit(2);
}
const [tokenAId, tokenBId] = args;
const values = new Map<string, string>();
for (let i = 2; i < args.length; i++) {
  const key = args[i];
  if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}\n${usage}`);
  const value = args[++i];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}\n${usage}`);
  if (values.has(key)) throw new Error(`Option repeated: ${key}`);
  values.set(key, value);
}
const allowedOptions = new Set(['--a-temperament','--b-temperament','--a-move','--b-move','--a-risk','--b-risk','--seed']);
for (const key of values.keys()) if (!allowedOptions.has(key)) throw new Error(`Unknown option: ${key}\n${usage}`);
const oneOf = <T extends string>(key: string, fallback: T, choices: readonly T[]): T => {
  const value = values.get(key) ?? fallback;
  if (!choices.includes(value as T)) throw new Error(`Invalid ${key}: ${value}. Allowed: ${choices.join(', ')}`);
  return value as T;
};
const moves = ['Headbutt','Quick Feet','Iron Hide','Laser Stare','Scan','Charm','Stare Down','Chaos Gaze'] as const;
const makePlan = (side: 'a' | 'b'): Plan => ({
  temperament: oneOf<Temperament>(`--${side}-temperament`, 'Feisty', ['Feisty','Cool','Wild']),
  move: oneOf<Move>(`--${side}-move`, 'Headbutt', moves),
  risk: oneOf<Risk>(`--${side}-risk`, 'Even', ['Safe','Even','Gamble']),
});
const planA = makePlan('a'), planB = makePlan('b');
const seed = values.get('--seed') ?? '1';
const dataset = await loadTraits();
const tokenA = dataset[tokenAId], tokenB = dataset[tokenBId];
if (!tokenA) throw new Error(`Token ID ${tokenAId} not found in root traits.json`);
if (!tokenB) throw new Error(`Token ID ${tokenBId} not found in root traits.json`);
const fighterA: Fighter = fighterFromToken(tokenAId, tokenA);
const fighterB: Fighter = fighterFromToken(tokenBId, tokenB);
const result = simulate(fighterA, fighterB, planA, planB, seed);
const fighters = { a: fighterA, b: fighterB };
const eventLog = result.events.map(event => ({
  ...event,
  tokenId: fighters[event.actor].tokenId,
  fighter: fighters[event.actor].name,
  narration: renderNarration(event, fighters[event.actor].voiceClass, result.summary.seed),
}));
console.log(JSON.stringify({
  fighters: { a: { tokenId: fighterA.tokenId, name: fighterA.name }, b: { tokenId: fighterB.tokenId, name: fighterB.name } },
  plans: { a: planA, b: planB },
  summary: result.summary,
  eventLog,
  endingNarration: {
    a: renderFightEnding(result.summary, fighterA.voiceClass, 'a', result.events.length + 1, result.summary.seed),
    b: renderFightEnding(result.summary, fighterB.voiceClass, 'b', result.events.length + 2, result.summary.seed),
  },
}, null, 2));
