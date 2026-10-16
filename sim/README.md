# ChogBound simulation engine v1.3

Deterministic, headless TypeScript combat simulation based on `docs/TRAIT_MAPPING.md`, `docs/SIM_SPEC.md` v1.3, and the repository-root `traits.json` (24-token cast) and `traits.full.json` (all 1,969 Chogs). The package contains no UI, wallet code, or contracts. Node.js 18+ is required; Vitest, TypeScript, and `tsx` are development-only tools.

## Install and run

Run from this `sim/` directory:

```sh
npm install
npm test
npm run typecheck
npm run coverage
npm run balance:full
npm run effect-value
npm run balance
npm run fight -- 1 24 --a-temperament Wild --a-move "Laser Stare" --seed 42
```

- `npm run coverage` is the v1.3 gate: it reads `../traits.full.json` and fails (exit code 1) if any Body, Eyes, Head, Mouth, Aura, Accessory, Tier, or Legendary kit value is not in the mapping.
- `npm run balance:full` simulates 400,000 random pairs over all 1,969 Chogs and prints the SIM_SPEC 10.8 targets as PASS or FAIL. Optional arguments: `-- <traitsPath> <pairs>`. At 400,000 pairs each token has about 406 fights, so a single token can land about 2.5 points away from its true win rate; use 2,000,000 pairs (about 50 seconds) to confirm a borderline token.
- `npm run effect-value` measures each aura, accessory, and signature alone against a plain all-40 fighter. It is a report, not a gate.
- `npm run balance` and `npm run fight` still default to the 24-token `traits.json`.

## Trait mapping data

All trait numbers come from `src/trait-mapping-v2.json`, which must stay byte-identical (ignoring line endings) to `docs/trait-mapping-v2.json`; a test enforces this. To change a number, edit the docs copy, copy it over `src/trait-mapping-v2.json`, and rerun `npm test` and `npm run balance:full`. Effect strengths live in `src/balance.config.ts` (`EFFECTS`) and a test checks they match the JSON `effects` section.

## Balance constants

`src/balance.config.ts` centralizes the tunables from SIM_SPEC sections 5 and 6 (v1.3):

- Damage coefficient: `0.204`.
- Hit chance: base `0.85`, SWIFT slope `0.0016`, clamp `0.60`–`0.95` before signature modifiers.
- Guard: GRIT slope `0.0036`, clamp `-0.10`–`0.28`.
- Crit chance: base `0.05`, NERVE slope `0.0161`; crit multiplier `1.75`.
- Move multipliers: Headbutt `1.32`, Quick Feet `0.68`, Iron Hide `0.85`, Laser Stare `1.15`, Chaos Gaze `2.5`. Effect strengths (Scorch, Vanish, Calm Glow, Gust, Pump, Lucky Flip, Sidekick, Scan, Charm, Stare Down) are in the `EFFECTS` object.

The implementation does not auto-tune constants. A failed benchmark is reported as a mismatch, not “fixed” by changing the requested values.

## Laser Stare

When a plan selects a fighter's Laser Stare signature, that fighter uses Laser Stare on its first action (auto-hit, including against Vanish), even under Wild. Laser Stare consumes the defender's one-time Vanish dodge. The signature attack is then spent; after the opening, Wild resumes selecting core moves uniformly. Lucky Flip only rerolls a normal hit-chance miss and never rerolls a Chaos Gaze coin-flip miss, per SIM_SPEC section 6.1. The random-fight regression test checks that neither fighter logs Laser Stare more than once per fight across 10,000 seeded fights.

## Data shape and defaults

`src/traits.ts` loads `../traits.json` from the repository root by default and accepts an explicit path. It supports the current object keyed by token ID, where each record has `name` and `attributes: [{ trait_type, value }]`; `image` is optional. It also tolerates the earlier sample-array shape for migration compatibility. `sim/data/traits.sample.json` was removed so there is one authoritative dataset rather than a stale duplicate.

`fighterFromToken(tokenId, token)` maps a metadata record to the fight-ready fighter. `computeStats(tokenOrAttributes)` returns the four clamped stats, source-trait bonus records, and resolved trait classes. `simulate(fighterA, fighterB, planA, planB, seed)` returns `{ events, summary }`. `renderNarration(event, voiceClass, seed)` selects voice-specific narration deterministically from the event index and fight seed, with four templates per event category and Mouth voice class. It does not make extra random draws.

## Scripts

- `scripts/balance.ts [traits-file]`: all unique token pairs, 100 deterministic seeds per pair, uniformly sampled plans. Reports per-token rates, min/max, population standard deviation, out-of-band IDs, KO rate, lower-total win rate, and a separate PASS/FAIL for each tolerance in SIM_SPEC section 10.7. It reports results without auto-tuning constants.
- `scripts/run-fight.ts <token-a> <token-b> [options]`: prints fighter and plan details, the full event log with deterministic narration, the summary, and end-of-fight narration. Supported flags: `--a-temperament`, `--a-move`, `--a-risk`, `--b-temperament`, `--b-move`, `--b-risk`, and `--seed`. Values with spaces, such as `Laser Stare` or `Quick Feet`, must be quoted in the shell. Defaults are Feisty, Headbutt, Even, and seed `1`.
- `scripts/coverage.ts [traits-file]`: report-only audit of Body, Eyes, Head, Mouth, and Accessory values routed to an Unknown or neutral fallback, with occurrence counts and total tokens processed. It does not modify the mapping.
- `scripts/balance-full.ts [traits-file] [N]`: runs N random distinct-token pairs (default 20,000) with random plans and reports sampled win-rate range, KO rate, and the ten lowest/highest observed tokens with their trait values. Tokens not sampled are excluded from ranking and counted separately.

## Open / underspecified points retained from the spec

1. **Seed construction:** SIM_SPEC requires a uint64 derived from a hash but does not mandate the hash-to-PRNG expansion. This implementation normalizes a seed to 64 bits and uses FNV-1a plus splitmix64 to initialize xoshiro128**.
2. **Missing Body vs Naked:** the mapping applies Bare when Body is absent or `Naked = Yes`, even if a Body value is present with Naked set to Yes.
3. **Trinket tie-break:** Trinket selects the lowest pre-clamp stat after other trait/tier bonuses; ties follow GRIT, PUNCH, SWIFT, NERVE order.
4. **Tier labels:** Common and Uncommon are explicit; other tier labels are interpreted from a numeric step where present, otherwise as +2. Other metadata tiers need review.
5. **Wild with a selected signature:** Wild chooses core moves uniformly; section 6.1 explicitly guarantees a selected Laser Stare opening on the owner's first action before Wild resumes core-move selection.
6. **Charm scope:** Charm reduces rival NERVE by 8 in rounds 1–3 for round-order ties and crit calculations; stored base totals remain unchanged.
7. **Cool counter:** the +10% damage is consumed on the first action after being hit. Whether it should re-arm after subsequent hits is not specified; this implementation uses one counter bonus per fight.
8. **Scorch timing:** burns are scheduled at the end of the two rounds after the first landed hit. A KO ends the fight immediately and suppresses later actions and burns.
9. **Calm Glow vs lethal damage:** Calm Glow does not revive a fighter reduced to 0 HP by a lethal hit.
10. **Upset definition:** the winner must start with a lower four-stat total, be behind at the end of a logged event in an earlier round, and finish with more HP.
11. **Sidekick interactions:** Sidekick deals fixed 4 damage without the normal guard / Iron Hide damage path, and can arm Scorch. The spec does not define these interactions.
12. **Random-plan distribution:** the spec asks for random plans but does not define a distribution; balance scripts choose uniformly among temperaments, risks, and core moves plus an available signature.
13. **Pair seed / sampling protocol:** section 10.7 records results for 100 seeds per unique pair but does not specify the original PRNG stream or random-plan stream. The script uses stable per-pair/per-seed strings. If results differ, the difference is reported; constants are not tuned to force a match.
14. **Transfer test:** wallet ownership, persisted records, and plan resets belong to the application layer and cannot be validated in this simulation-only package.
## Actual validation results

### Section 10.7 balance run (historical v1.1 snapshot; rerun `npm run balance` for current results)

The balance script executed 27,600 fights across 24 tokens (100 deterministic seeds per unique pair). This run uses the checked-in 24-token sample converted into the root `traits.json` object shape. The shell could not independently fetch GitHub due DNS failure, so this is based on the existing sample copy described by the prior README as derived from root metadata; the root-file loader itself defaults to `../traits.json` in the repository.

| Token ID | Chog name | Base total | Wins / 2,300 | Win rate |
|---:|---|---:|---:|---:|
| 1 | CHOG #1462 | 190 | 1241/2300 | 53.96% |
| 24 | CHOG #1485 | 190 | 855/2300 | 37.17% |
| 42 | CHOG #1503 | 196 | 1359/2300 | 59.09% |
| 71 | CHOG #1532 | 188 | 893/2300 | 38.83% |
| 89 | CHOG #1550 | 186 | 954/2300 | 41.48% |
| 118 | CHOG #1579 | 192 | 1461/2300 | 63.52% |
| 150 | CHOG #1611 | 186 | 1123/2300 | 48.83% |
| 222 | CHOG #1683 | 182 | 1001/2300 | 43.52% |
| 300 | CHOG #1761 | 208 | 1409/2300 | 61.26% |
| 410 | CHOG #1871 | 196 | 1087/2300 | 47.26% |
| 555 | CHOG #47 | 194 | 1044/2300 | 45.39% |
| 640 | CHOG #132 | 198 | 1299/2300 | 56.48% |
| 777 | CHOG #269 | 198 | 1370/2300 | 59.57% |
| 888 | CHOG #380 | 200 | 1399/2300 | 60.83% |
| 999 | CHOG #491 | 184 | 1115/2300 | 48.48% |
| 1111 | CHOG #603 | 190 | 946/2300 | 41.13% |
| 1234 | CHOG #726 | 198 | 1200/2300 | 52.17% |
| 1357 | CHOG #849 | 194 | 1018/2300 | 44.26% |
| 1500 | CHOG #992 | 204 | 1359/2300 | 59.09% |
| 1620 | CHOG #1112 | 190 | 912/2300 | 39.65% |
| 1750 | CHOG #1242 | 184 | 964/2300 | 41.91% |
| 1830 | CHOG #1322 | 190 | 909/2300 | 39.52% |
| 1900 | CHOG #1392 | 190 | 1140/2300 | 49.57% |
| 1969 | CHOG #1461 | 190 | 1542/2300 | 67.04% |

| Section 10.7 check | Target | Measured | Status |
|---|---:|---:|---|
| Lowest token rate | 37.3% | 37.17% | MISMATCH |
| Highest token rate | 67.5% (token 1969) | 67.04% (token 1969) | MISMATCH |
| Population standard deviation | about 8.7 | 8.82 | MISMATCH |
| Tokens outside 35–65% | exactly 1, token 1969 | 1, token 1969 | MATCH |
| KO rate | 18.4% | 18.69% | MISMATCH |
| Lower-total fighter win rate | 43.7% | 43.47% | MISMATCH |

No balance constants were tuned to force a match. The constants now match the values listed in SIM_SPEC v1.1. The remaining small differences are not explained by those constants: SIM_SPEC does not define the exact PRNG seed derivation and random-plan stream used to produce the recorded table. The script uses a deterministic FNV-1a/splitmix64-seeded xoshiro128** generator and stable per-pair/per-seed plan streams, so this mismatch is reported rather than concealed.

### Other executable checks

- **Stat-value parity custom run (6,000 seeds per stat):** GRIT +10 = 63.52% (3,811/6,000); PUNCH +10 = 59.75% (3,585/6,000); SWIFT +10 = 63.85% (3,831/6,000); NERVE +10 = 64.40% (3,864/6,000). All four fall within 58–67%.
- **Laser Stare custom regression:** 10,000 random-plan fights; 1,676 Laser Stare events; zero fighters used it more than once in a fight.
- **Event HP accounting custom check:** 10,000 random-plan fights; zero HP accounting/bounds failures.
- **Coverage script on the 24-token dataset:** 24 tokens processed; zero occurrences routed to Unknown/neutral fallback.
- **Full balance script smoke test:** 200 random pairs; 24 tokens sampled; KO rate 13.00%; observed per-token rate range 18.75%–77.78%. Small-N range is descriptive, not a balance acceptance result.
- **TypeScript source/test/script compile:** PASS using global TypeScript with a temporary ambient declaration for the unavailable Vitest module. This is a compile check only, not a Vitest test pass.
- **Real Vitest:** NOT RUN. `npm install && npm test` timed out; a retry failed with `EAI_AGAIN` resolving `registry.npmjs.org`. The environment could not reach npm, so no official Vitest pass is claimed.

The same detailed environment and benchmark status is recorded in `../results-summary.md`.
