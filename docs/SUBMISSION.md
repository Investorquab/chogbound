# Chogathon submission draft

Fill the bracketed items, check every claim against the checklist at the end, then paste each section into the submission form.

## Project page

**ChogBound: your Chog. Your plan. Your fight.**

ChogBound is a daily coaching and battle game for Chog Genesis NFTs on Monad. You coach your Chog by choosing its temperament, its move and how much risk to take. It fights one rival every night, and you watch a voiced replay of the real fight. The Chog's own traits decide its stats and special effects.

Holders connect a wallet and play with the Chogs that wallet holds. Anyone can also play as a guest with a demo Chog.

## Why Chog matters here

- **Traits are the rules.** Every trait value of all 1,969 Chogs is mapped to stats and effects: 96 bodies, 58 eyes, 66 heads, 15 mouths, 22 auras, 9 accessories and 10 Legendary kits. Eyes give PUNCH and unlock a signature move, auras and accessories give fight effects, mouths set the voice that narrates the fight, and tier adds a stat bonus. A different Chog plays a different game.
- **Rarity matters, without deciding everything.** Measured over 2,000,000 random fights across all 1,969 Chogs, win rate climbs with tier: about 48%, 52%, 60%, 61% and 64% from Common to Legendary. Token win rates stay between 34.6% and 68.0%, so no Chog is hopeless and none is unbeatable.
- **The wallet decides who you can play.** A connected holder picks from the Chogs the wallet owns, read from the contract on Monad. Guests borrow one of 24 demo Chogs to try the game.
- **Every Chog is in the arena.** Each night every one of the 1,969 Chogs fights a rival drawn by a public seeded draw, so the standings belong to the whole collection.

## Working demo and testing instructions

Live demo: [LIVE URL]
Repository: [GITHUB URL]
Demo video (3 minutes): [VIDEO URL]

**Guest, no wallet (about 2 minutes)**
1. Open the demo and tap Pick, then choose a demo Chog.
2. On Coach, choose temperament, move and risk, and tap Lock Plan.
3. Tap Run Tonight's Fights. Press Play on the replay (turn on the speaker icon for voice). The result stays hidden until the fight ends.
4. Open Arena to see the season standings of all 1,969 Chogs, your rank and tonight's rival.

**Holder (needs a wallet holding a Chog on Monad mainnet)**
1. Open Pick and tap Connect Wallet. Approve the connection and the signature request. It is a signature only: no transaction and no gas.
2. Your Chogs appear. Choose one and continue from step 2 above. The replay says "YOUR CHOG".

**Check the nightly system yourself**
- `[LIVE URL]/api/standings?night=4&limit=5` returns the same table every time.
- Each night's fight for a Chog is reproducible from the simulator: the seed is `night:youId:rivalId`.

**Run the tests**
```sh
npm install
npm test
npm run test:unit --workspace=chogbound-web
npm run test:e2e --workspace=chogbound-web
```

## Repository and stack

- TypeScript, npm workspaces: `sim/` (deterministic fight engine) and `web/` (Next.js 15, App Router).
- viem for Monad reads and signature checks; Multicall3 to read all 1,969 owners in 5 requests.
- Vitest for engine and unit tests, Playwright for browser tests, GitHub Actions for CI.
- Monad mainnet (chain 143). No contract is deployed by this project. Chog art is not stored anywhere: it loads in the player's browser from public IPFS gateways.

## What is built and what is not

Built: the engine and trait mapping for all 1,969 Chogs, the guest game, wallet connection and ownership reading, the replay screen, the nightly system and season standings.

Not built (see `docs/ROADMAP.md`): an on-chain record contract, ERC-6551 token-bound accounts, ERC-4906 metadata updates, a Farcaster Mini App, and on-chain nightly settlement.

The holder flow was tested with a simulated wallet and a simulated Monad node. [Update this line after a real holder has tested it.]

## Feedback and next steps

Feedback from building on Chog Genesis:
- The contract is a plain ERC-721 without enumeration, so finding "my Chogs" needs a full ownership scan. We use Multicall3, which works well, but a published owner index would help every builder.
- The on-chain token id differs from the number in a Chog's name (token 308 is "CHOG #1769"). A short note in the docs would save time.
- Public Monad RPC endpoints cap `eth_getLogs` at about 100 blocks and 50 requests per second, so event-based indexing is not practical for a small project.
- Art lives on IPFS only. A stated policy on using the images in apps, and an official image gateway, would let builders show art reliably.

Next steps: an on-chain record contract keyed by token id with ownership checks, token-bound accounts so a Chog can hold its own trophies, a Farcaster Mini App, and signed player plans so coached fights can enter the public standings.

## Checklist before you submit

- [ ] Live URL works on a phone and in a wallet browser.
- [ ] A real holder has tested the connect flow, and the line above is updated.
- [ ] Video is under 3 minutes and shows only what works.
- [ ] Every number above still matches `npm run balance:full -- ../traits.full.json 2000000` and the standings API.
- [ ] Deadline: 23 October 2026, 15:00 UTC (16:00 in Abuja). Confirm it on the Chogathon page.
