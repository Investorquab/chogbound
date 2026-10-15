# ChogBound simulation spec v1.3

Status: v1.3. Complete trait coverage for all 1,969 Chogs (see TRAIT_MAPPING.md and trait-mapping-v2.json), effect strengths rebalanced against the full collection, Legendary 1/1 kits, and full-collection balance targets (section 10.8). Sections 5 to 6.1 keep the v1.2 rulings.

Companion to `docs/TRAIT_MAPPING.md`, which defines stats, traits, and effect classes.

## 1. Principles

1. Traits decide outcomes. Level is cosmetic only.
2. Deterministic: the same inputs and seed produce a byte-identical fight, on any machine.
3. The event log is the single source of truth. HP bars, round list, animation, and narration are all rendered from it.
4. Narration is generated from event templates keyed by the Mouth voice class. It is never free-written, so text can never contradict numbers.

## 2. Inputs

Fighter: `tokenId`, display name (metadata `name`), four stats from TRAIT_MAPPING (GRIT, PUNCH, SWIFT, NERVE), voice class (from Mouth), aura, accessory, signature (nullable), tier.

Plan: `temperament` (Feisty, Cool, Wild), `move` (Headbutt, Quick Feet, Iron Hide, or the Eyes Signature), `risk` (Safe, Even, Gamble).
First-night default: Feisty, Headbutt, Even. Afterward the last locked plan carries over.

Seed: a uint64 taken from the hash of (night number, lower tokenId, higher tokenId). The PRNG algorithm is fixed in code (use one well-known generator such as xoshiro128**) and draws happen in the order this spec lists them.

## 3. Fight structure

- Each fighter starts at 100 HP. Maximum 8 rounds.
- Each round both fighters act once. The faster acts first: higher SWIFT (Gust adds +8 in round 1). Tie: higher NERVE. Tie: seed coin flip.
- Burn damage (Scorch) is applied at the end of the round.
- HP reaching 0 is a KO and ends the fight immediately.
- After round 8 the higher HP wins. Tie: higher NERVE. Tie: seed coin flip.

## 4. Choosing an action

- Core moves: Headbutt (attack stat PUNCH), Quick Feet (SWIFT), Iron Hide (GRIT).
- The plan move is used with 60% probability each action. Otherwise one of the other core moves is chosen uniformly.
- Wild temperament ignores the plan move and picks uniformly among core moves each action.
- If the Eyes Signature is selected as the plan move, the signature is active for this fight and the go-to attack becomes Headbutt. If it is not selected, the signature is inactive. That is the trade-off.

## 5. Resolving one attack

1. Hit chance = clamp(0.85 + 0.0016 x (attacker SWIFT - defender SWIFT), 0.60, 0.95).
   Modifiers: Stare Down lowers the rival's first attack by 0.15. Vanish makes the first incoming hit a dodge. Laser Stare ignores dodge and always hits. Lucky Flip re-rolls one miss per fight.
2. Damage = attack stat x 0.204 x move multiplier x (1 + variance) x (1 - guard) x crit.
   - Move multiplier: Headbutt 1.32, Quick Feet 0.68, Iron Hide 0.85 (and the next incoming hit deals 20% less), Laser Stare 1.30.
   - guard = clamp(0.0036 x (defender GRIT - 40), -0.10, 0.28).
   - variance is uniform in plus or minus v: Safe 5%, Even 15%, Gamble 30%.
   - crit chance = 0.05 + 0.0161 x (attacker NERVE - 40), plus 0.10 for Gamble, plus 0.15 for Wild. Crit multiplier 1.75.
3. Round to the nearest integer, minimum 1 on a hit.

Temperament modifiers: Feisty gives +10% damage dealt in rounds 1 to 3 and -10% in rounds 6 to 8. Cool gives -10% damage taken in rounds 1 to 3, then +10% damage dealt on the first action after being hit. Wild is described in section 4.

## 6. Trait effects in the simulation

Eyes signatures (active only when selected as the plan move):
- Laser Stare: the first action of the fight, once, auto-hit, move multiplier 1.15. After that first action it is spent: the go-to attack becomes Headbutt, exactly as for Scan, Charm, and Stare Down. It must never appear twice in one fight.
- Scan: before round 1 the rival's plan is revealed, and your first counter (first action after being hit) deals +35%.
- Charm: the rival's NERVE is -30 in rounds 1 to 3.
- Stare Down: the rival's first attack has -0.20 hit chance.
- Chaos Gaze: replaces the go-to attack. Each use is a coin flip between 2.5x damage and a miss.

Mouth: Underdog Pride (Sad or Flat): +6 PUNCH while behind on HP. All other Mouth classes affect narration voice only.

Auras (one trigger per fight):
- Scorch: after your first landed hit, the target loses 2 HP at the end of each of the next 2 rounds.
- Gust: act first in round 1, +8 SWIFT in round 1 only, and your round-1 attacks deal +30% damage.
- Vanish: the first incoming hit is dodged with 50% probability. Whether or not the dodge succeeds, the effect is spent on that first incoming hit.
- Calm Glow: the first time your HP drops below 40, heal 6.

Accessories:
- Pump: after your first landed hit, +4 PUNCH for the rest of the fight.
- Lucky Flip: re-roll one miss, and the re-roll hits with half the normal hit chance.
- Sidekick: each round, 12% chance of an extra 3 damage hit that cannot miss.
- Trinket (SB and unmapped values): +4 to your lowest base stat, applied at stat calculation.

### 6.1 Rulings on ambiguities

- Laser Stare ignores dodge and consumes the defender's Vanish dodge if one is available (Laser Stare beats Vanish).
- Lucky Flip re-rolls only a normal hit-chance miss. It never re-rolls a Chaos Gaze coin-flip miss.
- A selected Laser Stare opening action happens on the owner's first action even under Wild temperament. After that, Wild resumes picking core moves uniformly.

## 7. Event log format

Each event:

```json
{
  "n": 7,
  "round": 4,
  "actor": "a",
  "action": "attack",
  "move": "Headbutt",
  "outcome": "hit",
  "damage": 11,
  "heal": 0,
  "hp_after": { "a": 62, "b": 48 },
  "procs": ["pump"],
  "narration_key": "hit.headbutt",
  "vars": { "damage": 11, "target_hp": 48 }
}
```

`action` is one of `opening`, `attack`, `burn`, `heal`. `outcome` is one of `hit`, `crit`, `miss`, `dodge`.

Fight summary:

```json
{
  "seed": "0x...",
  "winner": "a",
  "ko": false,
  "rounds": 8,
  "totals": { "a": 192, "b": 198 },
  "final_hp": { "a": 34, "b": 28 },
  "upset": true
}
```

Upset: the winner's four-stat base total is lower than the loser's AND the winner trailed on HP at the end of at least one round before finishing ahead.

Invariants (each must have a unit test):
- hp_after always equals the previous hp_after minus damage plus heal, never below 0 or above 100.
- Once-per-fight procs appear at most once per fight.
- Replaying the same inputs and seed gives an identical log.
- Every number inside narration text equals the number in the same event.

## 8. Progression

- XP: win +3, loss +1, upset win +2 extra.
- Level thresholds (cumulative XP): L1 0, L2 3, L3 7, L4 12, L5 18, L6 25, L7 33, L8 42.
- Level is cosmetic: L1 to L3 plain, L4 to L7 aura halo, L8 and above framed. No effect on stats.
- Seasons last 7 nights. Leaderboard order: wins, then upsets, then XP. Records persist across seasons.

## 9. Nightly cycle

- Plans lock at 21:00 UTC. The tick runs at 00:00 UTC.
- Pairing: group by level band, sort by four-stat total inside each band, pair adjacent Chogs. Mutual rematch requests take priority. An odd Chog fights a flagged house Chog ("Night Watch", drawn from the sample cast).
- Ownership is checked at lock and again at the tick via `ownerOf` on Chog Genesis. If a Chog moved wallets, its plan resets to the default. Its record stays with the token.
- Settlement is operator-run, and the README says so plainly. For each fight, record on-chain: night, both token IDs, winner, and a hash of the event log. The full log lives off-chain, and anyone can re-simulate from the seed and inputs to verify the hash.
- Demo mode: "Run tonight's fights now" runs the same pipeline on demand for a guest Chog against a house Chog. A judge must reach a finished replay within 60 seconds and no wallet.

## 10. Balance and honesty tests (run before UI polish)

1. Determinism: 1,000 reruns of the same input and seed produce byte-identical logs.
2. Invariants from section 7 hold across 10,000 random fights.
3. Win rates: simulate every pair of sampled Chogs with random plans over 100 seeds each. No Chog should win above 65% or below 35% overall. The lower-total fighter should win between 35% and 45% of fights. KO rate between 5% and 25%.
4. Swap test: with the same plan against the same rival, two different Chogs must produce different event logs. Show this in the demo video.
5. Plans matter: for a fixed pair over 1,000 seeds, switching temperament must move win probability by at least 2 points. Otherwise coaching is fake and the pitch breaks.
6. Transfer test: after a token changes wallets, its record is unchanged and its plan resets.

If a test fails, tune numbers, not rules.

## 10.7 Recorded tuning results (v1.1, 24-token sample, 100 seeds per pair, 27,600 fights)

Why numbers had to change: with the v1 numbers, +10 in one stat won 78% (SWIFT), 69% (GRIT), 62% (PUNCH), and 57% (NERVE) against an all-40 baseline. SWIFT was overpowered and NERVE nearly worthless, so Chogs built on Light bodies won and Showy-body Chogs lost. The v1.1 numbers bring those four values to 60% to 64.5%.

| Check | v1 | v1.1 |
|---|---:|---:|
| Tokens outside 35 to 65% win rate | 7 | 1 (token 1969 at 67.5%) |
| Lowest and highest token win rate | 19.1% / 71.5% | 37.3% / 67.5% |
| Spread (standard deviation of win rates) | 14.5 | 8.7 |
| KO rate (target 5 to 25%) | 0.9% | 18.4% |
| Lower-total fighter wins (target 35 to 45%) | 41.8% | 43.7% |

Token 1969 (Heavy body, Vanish aura, Lucky Flip, Charm) is 2.5 points above target and is accepted for now. Re-check it after the full 1,969-token scan. Two independent implementations reached these results from the same constants. Random draw order differs between implementations, so exact reproduction is not required. A conforming engine run (100 seeds, all 24 sample pairs) must land within: every token win rate within 2.5 points of the table's extremes (lowest 37.3 plus or minus 2.5, highest 67.5 plus or minus 2.5), standard deviation within 1.0 of 8.7, KO rate within 1.5 points of 18.4%, lower-total win rate within 2.0 points of 43.7%, and at most 1 token outside 35 to 65%.

Engine v1.1 as delivered measured: lowest 37.17%, highest 67.04%, standard deviation 8.82, one token outside (1969), KO rate 18.69%, lower-total wins 43.47%, and +10 in one stat winning 63.52% (GRIT), 59.75% (PUNCH), 63.85% (SWIFT), 64.40% (NERVE). All within tolerance.

## 10.8 Full-collection balance (v1.3, all 1,969 Chogs)

The 24-token sample in 10.7 was not representative: 91% of real Chogs had at least one trait value the v1 mapping did not know, and effects (aura, accessory, signature) dominated stats. v1.3 maps every value and rebalances.

Method: random pairs of distinct tokens with random plans. v1.3 uses 400,000 pairs (about 406 fights per token, standard error about 2.5 points per token). The v1 column used 600,000 pairs (about 609 fights per token). Both are the same engine and harness apart from the changes listed.

| Check | v1 numbers, partial mapping | v1.3 |
|---|---:|---:|
| Lowest and highest token win rate | 26.9% / 86.2% | 31.8% / 69.6% |
| Standard deviation of token win rates | 10.2 | 6.4 |
| Tokens outside 35 to 65% | 271 | 25 (1.3%) |
| Tokens outside 30 to 70% | 78 | 0 |
| KO rate | 10.9% | 19.1% |
| Tier win rates, Common to Legendary | 45.2%, 59.6%, 56.1%, 54.3%, 42.5% (not monotonic) | 48.0%, 52.4%, 59.6%, 60.8%, 64.6% |

Isolated value of one effect against a plain all-40 fighter (same Headbutt go-to plan on both sides): auras 56.5 to 59.8, accessories 55.8 to 56.5, signatures 54.0 to 55.8. Before rebalancing they ranged from 42 to 69.

Targets for any conforming engine on the full collection (400,000 pairs): no token outside 30 to 70%, at most 3% outside 35 to 65%, standard deviation at most 7.5, KO rate 5 to 25%, tier win rates strictly increasing from Common to Legendary, every Body, Eyes, Head, and voice class within 45 to 56%, and every aura, accessory, and signature class within 45 to 60%.

Required coverage gate: running the coverage script on the full scan must report 0 unmapped values in Body, Eyes, Head, Mouth, Aura, Accessory, and Tier.

## 11. Open items

- Multipliers and thresholds are tuned values, not final: rerun section 10.8 after any change.
- Wind's +8 SWIFT is a round-1 effect only and is never part of base stats.
- Unmapped trait values use the Unknown rows in TRAIT_MAPPING. Before launch, scan metadata for all 1,969 Chogs and list every value the mapping does not cover.
- The `RETARD` Mouth, Eyes, or Head values display through the alias table in TRAIT_MAPPING in UI text. Printed text inside the art cannot be changed.
