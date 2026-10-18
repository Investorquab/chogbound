# ChogBound web app

Next.js 15 (App Router). The only combat engine is the `sim/` workspace, imported as `chogbound-sim`. Nothing from the engine is copied into `web/`.

## Routes

| Route | What it does |
|---|---|
| `/` | Landing page and "run tonight" launch |
| `/pick` | Wallet panel for holders, then the 24 demo Chogs for guests |
| `/coach` | Edit and lock temperament, move and risk; inspect trait sources; compare two Chogs with the same plan |
| `/replay` | Fighting-game replay of a real simulator log: play, pause, step, skip, optional voice |
| `/arena` | Season standings for all 1,969 Chogs, your rank, tonight's rival, countdown to the next night |
| `/profile` | Record, XP and cosmetic level from the season standings, plus your own saved fights |
| `/api/chogs?ids=1,308` | Names and traits for up to 50 Chogs (no art) |
| `/api/standings?night=&limit=&token=` | Season standings through a night, recomputed from the simulator |

## Nightly system

`src/lib/night.ts` is a set of pure functions. Night 1 is 9 October 2026 (UTC), and a new night starts every 24 hours at 00:00 UTC. A Chog's rival for a night is drawn from all 1,969 by a seeded random draw, and the fight seed is `night:youId:rivalId`. Standings give every Chog an autopilot plan (Cool, its signature move or Headbutt, Even) so the table can be reproduced by anyone; the player's own coached fight uses their locked plan.

If the rival's traits cannot be fetched, a guest still plays against a demo rival.

## Holder flow

1. `CONNECT WALLET` uses the injected EIP-1193 provider (`window.ethereum`) and switches or adds the Monad network.
2. The wallet signs a short message (no transaction, no gas). The signature is verified in the browser.
3. `src/lib/chog-chain.ts` reads every owner through Multicall3 (400 `ownerOf` calls per request, 5 requests for the collection) and returns the ids this address owns. The result is marked complete only if every lookup answered and the count matches `balanceOf`.
4. `/api/chogs` returns the traits for those ids. The chosen Chog fights with its real stats and effects.

The check runs in the player's browser. It is not a server-side proof of ownership, so nothing here should be used to gate anything of value.

## Art

No art is committed or served by this app. `ArtImage` tries the public IPFS gateways in order (Pinata first) with a 6 second timeout each, and shows a drawn placeholder until one answers.

## Tests

```sh
npm run test:unit            # unit tests (wallet, chain reads, nightly clock, standings, captions)
npm run test:e2e             # Playwright browser tests
```

The browser tests use a simulated wallet and a simulated Monad node, and they answer every IPFS gateway request locally, so they never touch the network.
