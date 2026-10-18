# ChogBound

Your Chog. Your plan. Your fight.

ChogBound is a daily coaching and battle game for Chog Genesis NFTs on Monad. You coach a Chog (temperament, move, risk), it fights one rival every night, and you watch a voiced replay. The Chog's real traits decide its stats and special effects, so a different Chog plays differently.

Built for Chogathon 2026.

## Two ways to play

- **Holder:** connect a wallet that holds a Chog on Monad mainnet. The game reads which Chogs the wallet owns and you coach one of them with its real traits. Connecting asks for a signature only: no transaction and no gas.
- **Guest:** no wallet needed. Pick one of 24 demo Chogs and play the same game.

## What is real in this repository

- **Fight engine** (`sim/`): a deterministic TypeScript simulator with trait mapping for all 1,969 Chogs. Same seed and plans give the same fight, every time. Rules and measured balance are in `docs/SIM_SPEC.md` and `docs/TRAIT_MAPPING.md`.
- **Nightly system:** the night number comes from the UTC date (Night 1 is 9 October 2026). Each Chog fights one rival per night, drawn by a seeded draw from all 1,969, so anyone can recompute any result. Season standings use autopilot plans for everyone for the same reason. Your coached fight is shown in your replay.
- **Wallet ownership:** all 1,969 owners are read through Multicall3 in 5 requests, then matched against the connected address. A signed message proves the player controls that address.
- **Art:** no Chog art is stored in this repository or on our server. Images load in the player's browser from public IPFS gateways, with a drawn placeholder if none answer.

## What is not built yet

On-chain record contract, ERC-6551 and ERC-4906 integration, Farcaster Mini App, and on-chain nightly settlement. See `docs/ROADMAP.md`. The holder flow has been tested with a simulated wallet and a simulated Monad node; it needs a real holder's test before you rely on it.

## Chain facts (checked against Monad mainnet)

| Item | Value |
|---|---|
| Collection | Chog Genesis, symbol CHOG, 1,969 tokens, plain ERC-721 |
| Contract | `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763` |
| Network | Monad mainnet, chain id 143, RPC `https://rpc.monad.xyz` |
| Token ids | The keys of `traits.full.json` are the on-chain token ids. The number in a Chog's name is different (token 308 is "CHOG #1769") |

## Run it

```sh
npm install
npm test                      # simulation engine tests
npm run build                 # builds the web app
npm run dev --workspace=chogbound-web
```

Checks you can run:

```sh
npm run typecheck --workspace=chogbound-sim
npm run coverage --workspace=chogbound-sim        # every trait value mapped, 0 unmapped
npm run balance:full --workspace=chogbound-sim    # full-collection balance
npm run test:unit --workspace=chogbound-web
npm run test:e2e --workspace=chogbound-web        # browser tests
```

## Layout

| Path | What it is |
|---|---|
| `sim/` | Simulation engine, tests, balance scripts |
| `web/` | Next.js app (see `web/README.md`) |
| `docs/` | Spec, trait mapping, roadmap, deploy notes, submission notes |
| `traits.json` | The 24 demo Chogs |
| `traits.full.json` | Names and traits for all 1,969 Chogs |
| `scripts/` | Metadata scan and read-only chain checks |
| `design/` | Early mockups |
