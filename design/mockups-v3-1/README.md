# ChogBound mockups v3.1

Clean rewrite of the six static HTML/CSS/JS pages into `design/mockups-v3-1/`. No contracts, backend, or simulator implementation were added. Nothing was pushed to GitHub.

## Files

- `01-landing.html`: responsive landing hero, real Chog art, five connected system steps, and a trait-to-effect proof chain.
- `02-pick-your-chog.html`: selectable sample cast, token art, stat cards, and guest mode.
- `03-coach.html`: sticky art card at about 40% of desktop content width, a four-column trait sheet, plan controls, and a two-Chog compare panel.
- `04-replay-stage.html`: responsive placeholder replay, event list, playback controls, HP state, and formula-auditable sample events.
- `05-arena.html`: sample leaderboard and links into coach/replay.
- `06-profile.html`: profile card, cosmetic level presentation, sample records, and share-card interaction.

The HTML files use the repository's existing `../../art/` and `../../fonts/` paths when placed in `design/mockups-v3-1/`. The ZIP includes all 24 attached WebP images under `art/` so it can be extracted at repository root.

## Source grounding

The trait classes and effects shown in the Coach sheet and landing proof row are taken from `docs/TRAIT_MAPPING.md`. The replay event shape and damage formula follow `docs/SIM_SPEC.md` sections 3 to 7. The replay is a hand-authored placeholder, not a simulation result.

The two replay fighters have these base stats from the mapping:

| Fighter | GRIT | PUNCH | SWIFT | NERVE | Total |
|---|---:|---:|---:|---:|---:|
| Token 118, CHOG #1579 | 38 | 52 | 56 | 46 | 192 |
| Token 777, CHOG #269 | 44 | 54 | 44 | 56 | 198 |

Calculation for token 118: dark vest (Light: GRIT -4, SWIFT +14), Vertical eyes (Intimidate: PUNCH +10), BTC Cap (NERVE +8), Sad mouth (NERVE -4), Uncommon tier (+2 each). The Green Candle Pump is a fight effect, not part of base stats. Aqua Aura is the Glow class. Token 777 uses Banana suit (Showy: GRIT +4, NERVE +12), Green laser eyes (PUNCH +14), no head (SWIFT +4), Smile mouth (NERVE +4), Common tier (+0).

## Replay damage audit

For attack events, the base formula is:

`round(attack_stat × 0.18 × move_multiplier × (1 + variance) × (1 - guard) × crit_multiplier × other specified modifiers)`

`guard = clamp(0.006 × (defender GRIT - 40), -0.10, 0.20)`. Headbutt multiplier is 1.15, Quick Feet 0.95, Iron Hide 0.85, and Laser Stare 1.30. The values in the table show the raw formula result before rounding and then the event damage. The Iron Hide event applies its specified 20% reduction to the next incoming hit. Pump changes token 118's PUNCH from 52 to 60 after its first landed hit. Underdog Pride adds +6 PUNCH while behind on HP, so token 118's PUNCH is 60 after Pump (52 base + 8 Pump). At the start of event 16, token 118 is behind on HP, so Underdog Pride raises that attack stat to 66 (52 base + 8 Pump + 6 Underdog Pride).

| Event | Round | Actor | Move/effect | Attack stat | Multiplier | Variance | Guard | Crit | Other modifier | Raw result | Damage | Target |
|---:|---:|:---:|---|---:|---:|---:|---:|---:|---:|---:|:---:|
| 1 | 1 | A | Headbutt | 52 | 1.15 | +0.047 | +0.024 | 1.0 | 1.00 | 10.99943 | 11 | B |
| 2 | 1 | B | Laser Stare | 54 | 1.30 | +0.039 | -0.012 | 1.0 | 1.00 | 13.28635 | 13 | A |
| 3 | 2 | A | Quick Feet | 56 | 0.95 | -0.037 | +0.024 | 1.0 | 1.00 | 9.000367 | 9 | B |
| 4 | 2 | B | Headbutt | 54 | 1.15 | +0.054 | -0.012 | 1.0 | 1.00 | 11.922991 | 12 | A |
| 5 | 2 | B | Scorch | Fixed | 1.00 | n/a | n/a | 1.0 | n/a | 3 fixed | 3 | A |
| 6 | 3 | A | Iron Hide | 38 | 0.85 | +0.150 | +0.024 | 1.0 | 1.00 | 6.525634 | 7 | B |
| 7 | 3 | B | Headbutt | 54 | 1.15 | +0.000 | -0.012 | 1.0 | 0.80 | 9.049709 | 9 | A |
| 8 | 3 | B | Scorch | Fixed | 1.00 | n/a | n/a | 1.0 | n/a | 3 fixed | 3 | A |
| 9 | 4 | A | Headbutt | 60 | 1.15 | +0.070 | +0.024 | 1.0 | 1.00 | 12.970454 | 13 | B |
| 10 | 4 | B | Quick Feet | 44 | 0.95 | +0.050 | -0.012 | 1.0 | 1.00 | 7.995002 | 8 | A |
| 11 | 5 | A | Headbutt | 60 | 1.15 | -0.010 | +0.024 | 1.0 | 1.00 | 12.000701 | 12 | B |
| 12 | 5 | B | Headbutt | 54 | 1.15 | +0.150 | -0.012 | 1.5 | 1.00 | 19.513435 | 20 | A |
| 13 | 5 | A | Calm Glow | n/a | n/a | n/a | n/a | n/a | n/a | 10 fixed heal | 0 damage, +10 heal | A |
| 14 | 6 | A | Headbutt | 60 | 1.15 | +0.150 | +0.024 | 1.0 | 1.00 | 13.940208 | 14 | B |
| 15 | 6 | B | Headbutt | 54 | 1.15 | -0.034 | -0.012 | 1.0 | 1.00 | 10.927523 | 11 | A |
| 16 | 7 | A | Headbutt | 66 | 1.15 | +0.150 | +0.024 | 1.0 | 1.00 | 15.334229 | 15 | B |
| 17 | 7 | B | Headbutt | 54 | 1.15 | -0.034 | -0.012 | 1.0 | 1.00 | 10.927523 | 11 | A |
| 18 | 8 | A | Headbutt | 60 | 1.15 | +0.150 | +0.024 | 1.0 | 1.00 | 13.940208 | 14 | B |
| 19 | 8 | B | Headbutt | 54 | 1.15 | -0.034 | -0.012 | 1.0 | 1.00 | 10.927523 | 11 | A |

Burn events use the spec's fixed 3 HP per tick and are not attack-formula damage. Calm Glow is a fixed 10 HP heal and does not count as damage. The sample uses Laser Stare once, and Calm Glow once. Scorch applies at the end of the two rounds after the first landed hit. The stage event log is the source for the displayed HP and narration values.

## Self-check results

- [x] Trait sheet is a real table with exactly `Trait`, `Value`, `Class`, `Effect` columns.
- [x] Trait rows do not repeat their labels in stacked `BODY / ...` or `AURA / Wind / Wind` patterns. There is one `Cosmetic` row.
- [x] Replay art height is capped and stage contents/controls are compacted at desktop breakpoints for a 1440 x 900 target. Browser pixel measurement could not be completed in this environment, so this is a CSS/layout audit rather than a screenshot-confirmed measurement.
- [x] Replay HP labels use each fighter's name, not generic A / HP or B / HP. Mobile HP label and number occupy separate grid columns/rows.
- [x] Compare panel displays two Chogs side by side with the same visible plan controls, stat bars/source chips, and trait differences. `Run both` does not invent a result; its result row remains explicitly simulator-owned.
- [x] Landing proof row uses Thug eyes -> PUNCH +10 -> Stare Down, as defined by `TRAIT_MAPPING.md`.
- [x] Coach art card occupies 40% of the desktop content grid and becomes non-sticky on mobile.
- [x] Replay sample has at most one Laser Stare and one Calm Glow proc.
- [x] Every attack's raw damage was checked against the formula and rounded to the listed integer. Fixed Scorch and Calm Glow values are labeled separately.
- [x] Stat totals are 192 for token 118 and 198 for token 777 everywhere in this README.
- [x] Landing hero image is width-bounded by its container for 390px layouts; no `overflow-x:hidden` is used on `body` or `html` to conceal overflow. This was checked from the responsive CSS because browser pixel measurement was unavailable.
- [x] No em dash character is used in the HTML UI copy.

## Open questions

- The spec says Laser Stare is the first action of the fight, once. This sample treats the fighter's first action as the signature action, not the first action globally. The production engine should define this precisely.
- The spec does not explicitly define whether Iron Hide's 20% reduction is applied before or after integer rounding. This sample applies it before rounding.
- The spec says the first action after being hit gets Cool's +10% damage, but it does not specify whether a simultaneous round action counts as after being hit when the fighter acted earlier that round. The mockup does not resolve this ambiguity.
- The compare panel is intentionally a UI-only proof of the swap test. It does not execute fights and shows no outcome until connected to the simulator.
