# ChogBound guest demo

This patch adds a Next.js App Router demo to the existing ChogBound repository. It uses the existing `sim/` workspace as the only combat engine. No engine source is copied into `web/`. There is no wallet connection, contract integration, or database in this phase. Fight state and the guest history are kept in browser `localStorage`, with guarded fallbacks when storage is unavailable.

## Routes

| Route | Purpose | Data source |
|---|---|---|
| `/` | Landing page matching mockup v3.2, with a guest fight launch | Repository metadata and real engine launch |
| `/pick` | Browse the 24-token cast, select a Chog, inspect engine-derived stats | Root `traits.json`, `computeStats`, `fighterFromToken` |
| `/coach` | Edit and lock Temperament, Move, and Risk; inspect traits and stat sources; run a two-result comparison | Engine stats and two real `simulate` runs |
| `/replay` | Play, pause, step, skip to result, or restart a real fight log | Stored `simulate` event log and engine narration module |
| `/arena` | Cast ladder and fight feed | Deterministic real engine runs across the cast |
| `/profile` | Wins, losses, win rate, XP, cosmetic level, recent fights | Real cast simulations and saved guest fights |
| `/api/art/[tokenId]` | Serve local art if present, otherwise resolve `imageUrl` through rotating IPFS gateways (7-second timeout per gateway), then return a neutral SVG placeholder | Root metadata plus optional `web/public/art/` files |

The UI displays metadata names, not a separate on-chain token ID field. The image API uses token IDs internally to find metadata and files. `web/public/art/` is ignored by Git, and no art files are included in this patch. `node web/scripts/warm-art.mjs https://your-deployment.example` requests every cast token's art endpoint and prints each HTTP status and response size for CDN warming.

## Workspace and engine integration

The root npm workspace is `sim` plus `web`. The web app imports `simulate`, `computeStats`, `fighterFromToken`, and `renderNarration` from `chogbound-sim` package subpaths. `next.config.ts` configures the workspace package for transpilation. Stat values and source bonuses are computed by the existing engine functions, not reimplemented in the UI.

The demo uses Night 09 to match the v3.2 design. A fight seed is derived from the night number and both fighter token IDs. A locked plan is stored locally and used for the player's fight. The rival is selected from the cast and gets a deterministic plan based on its signature. When storage is unavailable, the app falls back to the default plan and can still run a guest fight.

The font-copy script runs before development and production builds. In a full checkout it copies the committed root `/fonts/*.woff2` files to `web/public/fonts/`, where the v3.2 CSS loads them as self-hosted fonts.

## Progression

Progression follows `docs/SIM_SPEC.md` section 8: a win awards 3 XP, a loss awards 1 XP, and an upset win awards 2 extra XP. Cumulative level thresholds are L1 0, L2 3, L3 7, L4 12, L5 18, L6 25, L7 33, and L8 42. Levels are cosmetic and do not change stats. The arena ranks simulated cast records by wins, upset wins, XP, and then stat total.

## Run locally

From the repository root:

```sh
npm install
npm run build
npm run test:engine
npx playwright install chromium
npm run test:e2e
```

For development, run `npm run dev --workspace=chogbound-web`. The app is served on `http://localhost:3000`.

## Playwright gates

`web/tests/app.spec.ts` keeps the seven existing checks and adds two replay checks (nine total):

1. Every page loads without console errors.
2. `document.documentElement.scrollWidth` is exactly 390 at a 390px viewport on every page.
3. Lock Plan persists through refresh and Edit Plan unlocks it.
4. Run tonight's fights reaches a finished replay in under 60 seconds without a wallet.
5. Compare renders two real simulation results against the same rival with the same plan.
6. Skip to result sets the replay to its final summary.
7. No route renders a standalone token ID field or label.
8. `/replay` shows human-readable proc labels and no raw lowercase hyphenated proc IDs.
9. Fight Summary shows the player verdict, KO/HP margin, engine ending narration, and an Upset badge only when `summary.upset` is true.

## Validation log for this patch

The required gates were invoked in the isolated working environment. The repository could not install dependencies because registry DNS resolution failed, so test/build failures below are reported verbatim rather than treated as passes.

| Gate | Result | Actual output |
|---|---|---|
| `npm install` | **NOT COMPLETED** | The initial `npm install` timed out after 120 seconds. A verbose retry timed out after 25 seconds with `npm http fetch GET https://registry.npmjs.org/@fontsource%2fbarlow-condensed attempt 1 failed with EAI_AGAIN`, then `attempt 2 failed with EAI_AGAIN` (exit code `124`). |
| `npm run test:engine` | **NOT RUN TO COMPLETION** | `sh: 1: vitest: not found`; npm reported `npm error code 127` and `npm error command sh -c vitest run` (exit code `127`). |
| `npm run build` | **FAILED BEFORE NEXT BUILD** | `Error: ENOENT: no such file or directory, scandir '/mnt/data/chogbound-ui-work/fonts'` from `web/scripts/copy-fonts.mjs` (exit code `1`). The isolated worktree does not include the root font binaries committed in the GitHub repository. |
| `npm run test:e2e` | **NOT RUN TO COMPLETION** | `error: unknown command 'test'`; Playwright dependencies were not installed, and the command resolved to an unrelated environment CLI (exit code `1`). |
| TypeScript/TSX syntax transpilation | **PASS** | `TS/TSX syntax transpilation: PASS (15 files)` using the globally installed TypeScript compiler API. This is syntax-only validation, not a full type check. |
| CSS parse | **PASS** | `CSS parse: PASS (340 top-level nodes)` using PostCSS. |
| Proc-label coverage | **PASS** | `Engine proc labels: PASS (21 ids) missing=[]`. |
| Minimum text size static check | **PASS** | `Text declarations >=12px: PASS below12=[]`. |
| Relative import resolution | **PASS** | `Relative import resolution: PASS (28 imports checked)`. |
| Art gateway policy | **PASS** | `Art gateway policy: PASS` (all five requested gateways present; Cloudflare IPFS and raw GitHub fallback absent). |
| Warm-art script syntax | **PASS** | `node --check web/scripts/warm-art.mjs` completed with exit code `0`. |

No gate above is claimed as passing. `web/next.config.ts` and `web/src/app/icon.svg` were not changed. No engine files or combat rules were changed. No GitHub changes were pushed.

## Open questions and environment limitations

- Verification of the current `main` branch found that `traits.json` has `image` values such as `art/1.webp` but **does not currently contain any `imageUrl` fields**. The art route is ready to use `imageUrl` values when supplied, but with the current metadata and no matching local art file it will return the neutral placeholder. The patch deliberately does not invent IPFS URLs or modify `traits.json`.
- The font binaries are already committed in the repository's root `/fonts` folder. They were not available in the isolated work directory used to create this ZIP, so the ZIP includes the prebuild copy script rather than duplicate font binaries. The script copies the exact files when applied to a full checkout.
- The root lockfile was not regenerated because npm installation timed out in this environment. Retry `npm install` where npm registry DNS/network access is available.
- The demo uses a deterministic cast-wide pairing pass for the ladder and feed. It is a local guest simulation, not a persistent global leaderboard or a live on-chain state source.
