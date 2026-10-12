# ChogBound simulation engine v1

Deterministic, headless TypeScript combat simulation based on the repository's `docs/TRAIT_MAPPING.md`, `docs/SIM_SPEC.md`, and 24-token `traits.json` sample. No UI, wallet code, contracts, or runtime dependencies are included. Node.js 18+ is required; Vitest, TypeScript, and `tsx` are development-only tools.

## Install and run

From this `sim/` directory:

```sh
npm install
npm test
npm run typecheck
npm run balance
```

`balance` runs every unique pair in the 24-token sample across 100 deterministic seeds with random plans (27,600 fights) and prints each token's win rate, overall KO rate, and lower-total-fighter win rate. It reports targets as-is; it does not change rules or auto-tune numbers.

The checked-in `data/traits.sample.json` is a compact, derived copy of the 24 token records in the root `traits.json`, so the balance script still runs when this `sim/` folder is extracted by itself. It preserves the token IDs, names, and trait values used by stat calculation.

## Public API

- `computeStats(tokenOrAttributes)` returns the four clamped stats, source-trait `bonuses` for source chips, and resolved trait classes.
- `fighterFromToken(tokenId, token)` converts full metadata into a fight-ready `Fighter`.
- `simulate(fighterA, fighterB, planA, planB, seed)` returns `{ events, summary }` with the event and summary fields from SIM_SPEC section 7.
- `renderNarration(event, voiceClass)` renders a fixed template from `narration_key` and that event's `vars` only.
- `createRng(seed)` exposes the fixed xoshiro128** PRNG; `normalizeSeed(seed)` formats the summary seed.

## Design notes

- PRNG: xoshiro128** with a stable normalized 64-bit seed and splitmix64 state expansion; the summary seed can be passed back to reproduce the fight. Random draws are consumed in execution order.
- Stats: 40 base, mapped trait contributions, tier contribution, Trinket contribution, then clamp each stat to 20–95. Background, Skin, Side, Base, and Form do not affect stats.
- Gust's +8 SWIFT applies only to round-one ordering/hit calculation and is not added to base stats.
- The fight log is the state source of truth. Damage, healing, burns, scan opening information, and one-time effects are logged as events; Calm Glow uses a separate heal event.
- The event list may include a round-0 `opening` event for Scan. This is deliberate: SIM_SPEC asks that the rival plan is revealed before round 1.
- The sample balance data is 24 records, not a full scan of all 1,969 Chogs.

## Open questions

These items are ambiguous or underspecified in the source specs. The implementation uses the simplest local interpretation and does not claim the choices are canonical:

1. **Seed width:** the spec calls for a uint64 derived from a hash but does not prescribe the hash-to-PRNG expansion. This implementation accepts string, number, or bigint and normalizes to a stable 64-bit summary seed; xoshiro128** is seeded through FNV-1a 64-bit plus splitmix64.
2. **Missing Body vs Naked:** the mapping says Bare applies when there is no Body or `Naked = Yes`. Both cases use Bare even if a Body value is present but Naked is Yes.
3. **Trinket lowest stat:** the lowest stat is selected after Body/Eyes/Head/Mouth/Tier contributions but before the Trinket's own +4 and final clamp. Ties use stat order GRIT, PUNCH, SWIFT, NERVE.
4. **Tier labels:** known Common and Uncommon are explicit. For any other tier label, the tier step is inferred from a number in the label, or treated as +2 if no number exists; metadata should be reviewed before relying on other tier names.
5. **Signature selection:** selecting a signature activates its passive effect. Laser Stare and Chaos Gaze are attack actions; Scan, Charm, and Stare Down use Headbutt as the go-to attack while their signature effects remain active. Wild still chooses among the three core moves as section 4 says.
6. **Laser Stare wording:** the mapping says it ignores dodge once per fight, while SIM_SPEC says its first action of the fight, once, auto-hits. The implementation auto-hits the first Laser Stare action and marks the one-time use then.
7. **Charm scope:** the rival's NERVE is reduced by 8 for rounds 1–3 while Charm is active; this affects round-order ties and crit chance calculations, not the stored base-stat totals.
8. **Cool counter:** the +10% damage bonus is consumed on the first action after that fighter has been hit. The spec does not clarify whether it should re-arm after each later hit; this implementation uses one counter bonus per fight.
9. **Scorch timing:** the first landed hit arms burn at the ends of the following two rounds, not the round of the hit. A KO ends the fight immediately and suppresses later actions and burn.
10. **Calm Glow vs KO:** a lethal hit ends the fight immediately; Calm Glow does not revive a fighter reduced to 0 HP.
11. **Wild and signatures:** Wild ignores the selected move for action selection and picks only among core moves. A selected signature's passive effect remains active; Laser Stare / Chaos Gaze are therefore not selected as attacks by a Wild plan.
12. **Upset:** the winner must have a lower initial four-stat total and be behind on HP at the end of a logged event in an earlier round, then finish with more HP. A same-round momentary lead change alone does not count as trailing at the end of an earlier round.
13. **Transfer test (section 10.6):** wallet ownership, stored records, and plan resets are outside this simulation-only package. No transfer behavior is mocked or claimed here.
14. **Plans-matter target:** section 10.5 gives a 2 percentage-point temperament effect threshold but does not define whether it is an absolute difference, which pair is canonical, or the exact RNG pairing protocol. The test uses one fixed documented pair, 1,000 seeds, and absolute spread across Feisty/Cool/Wild.
15. **Lucky Flip vs Chaos Gaze:** the spec does not state whether Lucky Flip re-rolls the Chaos Gaze coin-flip miss. The implementation applies Lucky Flip to the ordinary hit check before resolving Chaos Gaze's dedicated coin flip.
16. **Sidekick interactions:** Sidekick's fixed 4-damage hit can trigger Scorch if it is the first landed hit. It is treated as fixed damage rather than applying GRIT guard or Iron Hide's 20% reduction; the spec does not define this interaction.
17. **Random plans in balance test:** the spec says random plans without specifying their distribution. This script chooses temperament, risk, and among core moves plus an available signature uniformly, using a deterministic separate PRNG stream per pair and seed.

## Test coverage

The suite covers the worked stat example, Unknown fallbacks, Bare handling, source-trait bonus metadata, stat clamps, deterministic reruns, event HP accounting and bounds across 10,000 fights, once-only proc uniqueness, narration number sourcing, swap test, Scan opening event, Calm Glow healing, and a 1,000-seed temperament comparison. Section 10.6 transfer behavior is not applicable without an ownership/progression layer.

## Section 10.3 balance run (current v1 numbers)

Ran all 276 unique token pairs across 100 deterministic random-plan seeds per pair: **27,600 fights**. Random plans were sampled uniformly across temperament, risk, and core moves plus each token's signature when present. This is a baseline report, not a tuned build.

| Token ID | Chog name | Four-stat total | Wins / 2,300 | Win rate |
|---:|---|---:|---:|---:|
| 1 | CHOG #1462 | 190 | 1,443 | 62.74% |
| 24 | CHOG #1485 | 190 | 439 | 19.09% |
| 42 | CHOG #1503 | 196 | 1,439 | 62.57% |
| 71 | CHOG #1532 | 188 | 447 | 19.43% |
| 89 | CHOG #1550 | 186 | 1,003 | 43.61% |
| 118 | CHOG #1579 | 192 | 1,617 | 70.30% |
| 150 | CHOG #1611 | 186 | 1,299 | 56.48% |
| 222 | CHOG #1683 | 182 | 798 | 34.70% |
| 300 | CHOG #1761 | 208 | 1,344 | 58.43% |
| 410 | CHOG #1871 | 196 | 1,138 | 49.48% |
| 555 | CHOG #47 | 194 | 609 | 26.48% |
| 640 | CHOG #132 | 198 | 1,596 | 69.39% |
| 777 | CHOG #269 | 198 | 1,208 | 52.52% |
| 888 | CHOG #380 | 200 | 1,462 | 63.57% |
| 999 | CHOG #491 | 184 | 1,375 | 59.78% |
| 1111 | CHOG #603 | 190 | 880 | 38.26% |
| 1234 | CHOG #726 | 198 | 1,371 | 59.61% |
| 1357 | CHOG #849 | 194 | 1,105 | 48.04% |
| 1500 | CHOG #992 | 204 | 1,383 | 60.13% |
| 1620 | CHOG #1112 | 190 | 884 | 38.43% |
| 1750 | CHOG #1242 | 184 | 1,040 | 45.22% |
| 1830 | CHOG #1322 | 190 | 1,099 | 47.78% |
| 1900 | CHOG #1392 | 190 | 1,173 | 51.00% |
| 1969 | CHOG #1461 | 190 | 1,448 | 62.96% |

| Balance target | Measured result | Status |
|---|---:|---|
| Every token wins 35–65% | 6 tokens outside the range | **FAIL** |
| Lower-total fighter wins 35–45% | 42.24% (10,475 / 24,800 unequal-total fights) | **PASS** |
| KO rate 5–25% | 0.90% (248 / 27,600) | **FAIL** |

Out-of-range token win rates: IDs **24, 71, 118, 222, 555, and 640**. The rules were not altered to force these results.

### Number-only tuning candidates (not applied)

- First candidate: raise the base damage coefficient in section 5 from **0.18 to 0.22**. A separate temporary sensitivity run (not included in this ZIP's source) produced a **10.34% KO rate** and **43.39% lower-total win rate**, both within their targets. It still left token win-rate outliers (IDs 24, 71, 118, 555, and 640), so this alone is not a complete balance solution.
- Keep the section 10.3 run as the acceptance gate. Investigate small changes to the SWIFT hit-chance coefficient and/or trait bonus magnitudes in separate sensitivity runs before accepting any tuning. Do not combine candidate changes without re-running all 27,600 fights.

No candidate tuning was applied to `src/fight.ts`; its current damage coefficient remains **0.18**, exactly as in SIM_SPEC.
