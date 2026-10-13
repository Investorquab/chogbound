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
| `/api/art/[tokenId]` | Serve local art if present, otherwise resolve the metadata image URL with a 7-second timeout and rotating IPFS gateways, then return a neutral SVG placeholder | Root metadata plus optional `web/public/art/` files |

The UI displays metadata names, not a separate on-chain token ID field. The image API uses token IDs internally to find metadata and files. `web/public/art/` is ignored by Git, and no art files are included in this patch.

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

`web/tests/app.spec.ts` contains seven checks:

1. Every page loads without console errors.
2. `document.documentElement.scrollWidth` is exactly 390 at a 390px viewport on every page.
3. Lock Plan persists through refresh and Edit Plan unlocks it.
4. Run tonight's fights reaches a finished replay in under 60 seconds without a wallet.
5. Compare renders two real simulation results against the same rival with the same plan.
6. Skip to result sets the replay to its final summary.
7. No route renders a standalone token ID field or label.

## Validation log for this ZIP

These are the actual checks performed in the isolated build environment. A **not run** status means the required test runner or build prerequisite was unavailable; it is not a pass.

| Gate | Status | Actual output / reason |
|---|---|---|
| `npm install --ignore-scripts --no-audit --no-fund` | **not run to completion** | The command timed out after 30 seconds without installing dependencies: `Command failed because it timed out.` |
| `npm test --workspace=chogbound-sim` | **not run** | `sh: 1: vitest: not found` followed by `npm error code 127` and `npm error command sh -c vitest run`. |
| `npm run build` | **not run to completion** | The prebuild font-copy step stopped before Next.js compilation because this isolated working directory did not contain the repository's root `/fonts` folder: `Error: ENOENT: no such file or directory, scandir '/mnt/data/chogbound-web-work/repo/fonts'`. The full repository has that folder; the prebuild script copies its font files. |
| `npm run test:e2e --workspace=chogbound-web` | **not run** | The Playwright package was not installed. The command resolved to the environment's unrelated CLI and returned `error: unknown command 'test'`. |
| TypeScript/TSX syntax transpilation | **PASS** | `PASS: TypeScript/TSX syntax transpilation for 16 files` using the globally installed TypeScript compiler API. This is syntax validation only, not full type checking. |
| Static workspace/source checks | **PASS** | `PASS: workspace, six pages, art route, gitignore, engine integration, narration, round log, and CI source checks` |
| Relative TypeScript imports | **PASS** | `PASS: all relative TypeScript imports resolve` |
| CSS syntax parse | **PASS** | `PASS: CSS parse (313 top-level rules)` |

The required engine test suite, Next.js production build, and Playwright tests have **not been verified in this environment**. The GitHub Actions workflow runs those gates after dependencies are available. No GitHub changes were pushed.

## Open questions and environment limitations

- Current metadata image fields include relative paths such as `art/1.webp`, while art is intentionally not committed. Those paths will fall back to the neutral placeholder unless matching files are placed in the ignored `web/public/art/` folder or metadata points to a reachable image URL or IPFS CID.
- The font binaries are already committed in the repository's root `/fonts` folder. They were not available in the isolated work directory used to create this ZIP, so the ZIP includes the prebuild copy script rather than duplicate font binaries. The script copies the exact files when applied to a full checkout.
- The root lockfile was not regenerated because npm installation timed out in this environment. Run `npm install` after applying the patch to refresh the lockfile for the new workspaces.
- The demo uses a deterministic cast-wide pairing pass for the ladder and feed. It is a local guest simulation, not a persistent global leaderboard or a live on-chain state source.
