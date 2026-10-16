# ChogBound roadmap

What exists today is the simulator, the trait mapping for all 1,969 Chogs, the guest demo, and the wallet ownership core. Everything below is planned work and is not built. It was left out of the Chogathon submission on purpose so the core game could be finished and tested properly.

## Planned, not built

### On-chain record contract
A small contract on Monad, keyed by Chog token ID, that stores a Chog's nightly results (wins, losses, streak). Writing a result would check `ownerOf` on Chog Genesis so only the current owner can record. Nightly fights are already deterministic from a seed, so results can be recomputed and checked by anyone.

### ERC-4906 on the record contract
ERC-4906 adds a standard "metadata updated" event to ERC-721 so marketplaces and indexers refresh a token's metadata. Chog Genesis is not our contract and cannot emit it, so this would apply to our own record contract or a companion token, not to the original Chog.

### ERC-6551 token-bound accounts
ERC-6551 gives every NFT its own account address, controlled by whoever owns the NFT. A Chog could hold its own trophies or rewards, and they would move with the Chog when it is sold. It works with any existing ERC-721 without changing it. Whether the standard registry is deployed on Monad has not been checked.

### Farcaster Mini App
A thin wrapper so the game can be played inside Farcaster, reusing the same web app.

### Nightly settlement
A scheduled job that publishes each night's results on chain once the record contract exists.

## Done and verified
- Simulation engine v1.3 with data-driven trait mapping and full-collection balance checks (see `docs/SIM_SPEC.md`).
- Chog Genesis contract facts confirmed on Monad mainnet: chain 143, 1,969 tokens, plain ERC-721.
- Wallet ownership scan through Multicall3: the whole collection in 5 requests.
