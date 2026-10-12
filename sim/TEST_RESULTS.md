# ChogBound simulation engine v1.1 — validation report

## Environment

The source repository was read from `main` at commit `61105985da6c9ae66a0e09cf5d06b117b7bef86d`. Shell access to GitHub and npm was blocked by DNS resolution. The local 24-token balance run used the checked-in sample converted into root `traits.json` object shape; see `../results-summary.md` for this limitation.

## Checks that ran

- TypeScript source, tests, and scripts compile-only check: **PASS** with global TypeScript and a temporary ambient declaration for Vitest.
- 10,000 random-plan fights for Laser Stare uniqueness: **0 repeated uses** by any fighter.
- 10,000 random-plan fights for event HP accounting and bounds: **0 failures**.
- Stat parity, 6,000 seeds per stat: GRIT +10 **63.52%**, PUNCH +10 **59.75%**, SWIFT +10 **63.85%**, NERVE +10 **64.40%**. All four are within 58–67%.
- Coverage: **24 tokens processed**, zero values routed to an Unknown/neutral fallback.
- Full-balance smoke test, N=200: KO rate **13.00%**, sampled win-rate range **18.75%–77.78%**.
- 100-seed all-pairs balance: **27,600 fights**, min/max **37.17% / 67.04%**, population standard deviation **8.82**, one token outside 35–65% (1969), KO rate **18.69%**, lower-total wins **43.47%**. This does **not** exactly match the recorded v1.1 aggregate table; constants were not tuned.

## Official Vitest status

**NOT RUN.** `npm install && npm test` timed out. A retry of `npm install` failed with `EAI_AGAIN` while resolving `registry.npmjs.org`. Do not treat compile-only/custom checks as a Vitest pass.
