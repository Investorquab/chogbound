# ChogBound simulation engine v1.2 — validation report

## Source

- Repository: `Investorquab/chogbound`, branch `main`.
- Spec: `docs/SIM_SPEC.md` v1.2, including rulings in section 6.1 and tolerance criteria in section 10.7.
- Tuning constants were not changed.

## Test execution in this environment

Requested command sequence: `cd sim`, `npm install`, `npm test`.

- `npm install`: **not run to completion**. The command was attempted but timed out after 20 seconds without output; network/DNS access to npm is unavailable in this environment.
- `npm test`: test suite **not run** because dependencies were not installed. Actual output:

```text
> chogbound-sim@0.1.0 test
> vitest run

sh: 1: vitest: not found
```

No PASS result is claimed for the test suite. Run `npm install && npm test` in an environment with npm registry access.

## Changes in this package

- Applied the three SIM_SPEC section 6.1 rulings in the fight engine and added regression tests.
- Replaced exact benchmark equality with individual tolerance-based PASS/FAIL checks for all six section 10.7 criteria. No tuning constants were changed.
- Added deterministic, event-index-and-seed narration templates for all six Mouth voice classes and the hit, crit, miss, dodge, proc, KO, and win categories, plus tests for consecutive-line uniqueness and event-number integrity.
- Added `scripts/run-fight.ts` and documented its token, plan, and seed flags in `README.md`.

The test suite could not be executed here; the test additions and changes are included for verification in a network-enabled environment.

## Additional local checks (not a substitute for `npm test`)

- TypeScript transpilation syntax check: **PASS** for all simulator `.ts` files using the globally installed TypeScript compiler API. Full type checking was blocked because `@types/node` and `vitest/globals` were not installed.
- Manual runtime smoke checks after transpilation: **PASS** for the three section 6.1 rulings, four distinct templates per voice/category, consecutive-line uniqueness, and event-variable number integrity.
- `scripts/run-fight.ts` runtime smoke: **PASS** using sample token IDs `300` and `24`; emitted a 16-event log with narration and a fight summary.
- `scripts/balance.ts` runtime smoke on the retained 24-token sample: **PASS** for all six section 10.7 tolerance criteria. Observed: lowest 37.17%, highest 67.04%, standard deviation 8.82 pp, KO 18.69%, lower-total wins 43.47%, and one token outside the 35–65% band (token 1969 at 67.04%). This was run against the 24-token sample available in the prior snapshot, not by downloading the current root `traits.json` in this network-restricted environment.
