# ChogBound simulation engine — validation report

## Automated checks executed in the build environment

- Strict TypeScript compilation of `src/*.ts`: **PASS**.
- Strict type-check of `src`, `test`, and `scripts`: **PASS** using temporary ambient declarations for unavailable Node/Vitest type packages.
- Stats tests: **5 passed**.
- Fight tests: **8 passed**.
- Determinism: same inputs and seed were byte-identical over 1,000 reruns; the normalized summary seed also reproduced the same result.
- Section 7 HP accounting and bounds: **10,000 seeded fights, 0 invariant failures** across a roster with signatures, auras, and accessories.
- Once-only proc checks in those 10,000 fights: **0 duplicate-proc failures** for the tracked one-time effects.
- Narration numeric-source check: **PASS**.
- Section 10.4 swap test: **PASS**.
- Section 10.5 fixed-pair temperament spread: **10.1 percentage points**, exceeding the 2-point target for the selected pair.
- Section 10.3 balance run: **27,600 fights**; see the table and target status in `README.md`.

## Tooling limitation

The environment could not reach the npm registry (`npm install` timed out), so the official Vitest CLI could not be installed or run. The test files were compiled and executed with a temporary local compatibility harness implementing the assertions used by this suite; that harness was not included in the ZIP. Run `npm install && npm test` in a network-enabled Node 18+ environment for the official Vitest run.

## Balance conclusion

Baseline v1 **does not meet all balance targets**: lower-total win rate is in range, but KO rate is too low and six sampled tokens fall outside the 35–65% per-token range. A separate, temporary number-only sensitivity run using damage coefficient 0.22 reached a 10.34% KO rate and 43.39% lower-total win rate, but still had per-token outliers. The checked-in rules remain unchanged at the specified 0.18 damage coefficient.
