# ChogBound narration update validation

## Source and scope

- Repository: `Investorquab/chogbound`, branch `main`, latest source commit inspected: `32fb6fe4d05555bc75480347ecc038cdd2d8ace9`.
- Spec: `docs/SIM_SPEC.md` v1.2.
- Only narration, the fight runner's option parser, narration tests, and this report were changed. `sim/src/fight.ts` and `sim/src/balance.config.ts` were not changed. No combat rule or tuning constant was changed.

## Requested real test commands

`npm install` was attempted from `sim/`, but the command timed out after 60 seconds without stdout or stderr. Dependencies were therefore not installed.

`npm test` was then attempted from `sim/`. The test suite was **not run** because Vitest was unavailable. Actual output:

```text
> chogbound-sim@0.1.0 test
> vitest run

sh: 1: vitest: not found
```

No full-suite pass is claimed. The Vitest suite must be run in an environment that can reach the npm registry.

## Checks that did run

- TypeScript transpilation syntax check: **PASS** for `sim/src/narration.ts`, `sim/scripts/run-fight.ts`, and `sim/test/fight.test.ts` using the globally installed TypeScript compiler API. This is not a full typecheck. A direct `tsc --noEmit` check was also attempted but could not complete because `@types/node` was missing (`process` and `node:*` declarations were unavailable).
- Manual runtime smoke: **PASS** across 775 valid seeded fights and 13,255 events. Across all six voices: 0 lowercase hyphenated slugs in output, 0 rendered numbers absent from the event's numeric vars, and 0 identical consecutive event narration lines.
- Proc coverage smoke: **PASS** for all 21 engine proc IDs across all six voices (126 proc/voice combinations): 0 missing human sentences, 0 slug matches, and 0 invalid numbers.
- Required alias smoke: **PASS** for `gust`, `charm`, `scan`, and both hit/miss handling for `chaos-gaze`; 0 slug matches.
- Template smoke: **PASS**; all four selected templates were distinct for every voice and narration category, including hit, crit, miss, dodge, proc, KO, and win.

## Implementation notes

- Narration is deterministic from event index and fight seed. It does not call the combat RNG.
- Every event proc is rendered as a human sentence; proc identifiers are never printed from the raw event array.
- Each Mouth voice has its own full sentence templates for hit, critical hit, miss, dodge, knockout, and win.
- `--a-move signature` and `--b-move signature` resolve to the selected fighter's own signature move. Selecting `signature` for a fighter without one reports an error.
