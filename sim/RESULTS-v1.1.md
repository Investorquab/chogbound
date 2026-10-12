# ChogBound simulation update — results summary

## Source and safety

- Source repo: `Investorquab/chogbound`, branch `main`, commit `61105985da6c9ae66a0e09cf5d06b117b7bef86d`.
- `docs/SIM_SPEC.md` title verified as `# ChogBound simulation spec v1.1`; section 10.7 table was read before edits.
- No GitHub changes were pushed.
- Shell access to GitHub failed due DNS resolution. For executable 24-token results, the existing checked-in `sim/data/traits.sample.json` was converted into the root object-keyed `traits.json` shape; the prior README described that sample as derived from root `traits.json`. This run was not an independent byte-for-byte materialization of the private repo's root file.
- `traits.full.json` was not searched for or used.

## Changes in the ZIP

- Added `sim/src/balance.config.ts` with the requested v1.1 constants and moved the specified tunables out of `fight.ts`.
- Fixed Laser Stare to occur at most once per fighter per fight, on the selected signature owner's opening action, and to fall back to Headbutt as the go-to move afterward.
- Added `sim/src/traits.ts`; default dataset path is repository-root `traits.json`, with optional path arguments and support for object-keyed `{ name, attributes }` records without an `image` field.
- Removed `sim/data/traits.sample.json` to avoid maintaining a duplicate dataset.
- Reworked `sim/scripts/balance.ts` to read root `traits.json` by default and compare measured results with section 10.7 without tuning.
- Added `sim/scripts/coverage.ts` and `sim/scripts/balance-full.ts`.
- Added 10,000-fight Laser Stare regression, 6,000-seed-per-stat parity test, and dataset shape/default-path tests.
- Updated `sim/README.md` and `sim/TEST_RESULTS.md` with behavior, ambiguities, and actual results.

## Balance run: 100 seeds per unique pair

- Fights: 27,600 across 24 tokens.
- Lowest / highest rate: 37.17% / 67.04%.
- Population standard deviation: 8.82 percentage points.
- Tokens outside 35–65%: 1 (token 1969).
- KO rate: 18.69% (5,159/27,600).
- Lower-total fighter wins: 43.47% (10,781/24,800 unequal-total fights).
- Benchmark: **FAIL / close but not exact**. Target was 37.3%, 67.5%, about 8.7, one token outside, 18.4%, and 43.7% respectively. No tuning was done.

The specified constants match SIM_SPEC v1.1. The remaining difference is not a reason to tune constants. Exact seed derivation and random-plan stream are not specified by the document, so this deterministic run cannot reproduce the recorded aggregate table exactly from the information provided. The script reports the discrepancy plainly.

## Other checks

- Stat parity custom run, 6,000 seeds each: GRIT +10 **63.52%**; PUNCH +10 **59.75%**; SWIFT +10 **63.85%**; NERVE +10 **64.40%**. All in 58–67%.
- Laser Stare custom regression: 10,000 random-plan fights, 1,676 Laser Stare events, **0 repeated uses by the same fighter**.
- HP accounting/bounds custom check: 10,000 random-plan fights, **0 failures**.
- Coverage script: 24 tokens processed, **0 fallback occurrences**.
- `balance-full.ts` smoke test: N=200, KO rate **13.00%**, sampled per-token win-rate range **18.75%–77.78%**, all 24 tokens sampled.
- TypeScript compile-only check using global TypeScript and a temporary ambient declaration: **PASS**.
- Official `npm install && npm test`: **NOT RUN / BLOCKED**. Initial command timed out; retry failed with `EAI_AGAIN` resolving `registry.npmjs.org`. No official Vitest pass is claimed.

## Ambiguities retained, not invented

- Exact seed hash / PRNG seeding and random-plan draw protocol needed to reproduce the historical 10.7 aggregate table.
- Whether Laser Stare's ignored attack consumes Vanish's one-time dodge trigger.
- Whether Lucky Flip can reroll Chaos Gaze's signature coin-flip miss. Current code follows the existing generic attack draw order; the signature coin flip determines the final Chaos Gaze hit/miss.
- Whether Wild's core-only move selection should override an attack signature when Laser Stare is selected; current implementation guarantees the selected Laser Stare opening action, then Wild resumes core-only selection.
- Other previously documented ambiguity items remain in `sim/README.md`.
