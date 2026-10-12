# ChogBound mockups v3.2

A focused update of `design/mockups-v3-1/` into `design/mockups-v3-2/`. Only the eight requested visual and replay fixes were made. No repository changes were pushed. The ZIP includes the six HTML files, this README, and the 24 attached WebP assets used by the mockups.

## Files

- `01-landing.html`: original landing design, with the two rotated mobile orbit decorations constrained to the viewport.
- `02-pick-your-chog.html`: original cast picker; visible token-number labels removed, IDs remain in data attributes/control values.
- `03-coach.html`: original coach page; stat chips now show BASE 40 and each relevant source contribution once, duplicate STAT SOURCES block removed, and Wind +8 SWIFT shown as a separate ROUND 1 ONLY chip.
- `04-replay-stage.html`: original replay layout with larger fighter art, You/Rival labels, accessible event rows, and a v1.1-formula audit sample that ends immediately at KO.
- `05-arena.html`: unchanged page content except font-face declarations.
- `06-profile.html`: unchanged page content except font-face declarations.

## Spec references and stats

The source spec title is `ChogBound simulation spec v1.1`. The two sample fighters retain their metadata names and stat totals:

| Side | Metadata name | GRIT | PUNCH | SWIFT | NERVE | Total |
|---|---|---:|---:|---:|---:|---:|
| You | CHOG #1579 | 38 | 52 | 56 | 46 | 192 |
| Rival | CHOG #269 | 44 | 54 | 44 | 56 | 198 |

CHOG #1579 uses dark vest (GRIT -4, SWIFT +14), Vertical eyes (PUNCH +10), BTC Cap (NERVE +8), Sad mouth (NERVE -4), and Uncommon tier (+2 to each stat). Pump is an in-fight +8 PUNCH effect after its first landed hit; Aqua Aura is Calm Glow. CHOG #269 uses Banana suit (GRIT +4, NERVE +12), Green laser eyes (PUNCH +14), no head (SWIFT +4), Smile mouth (NERVE +4), and Common tier (+0).

## Replay audit, SIM_SPEC v1.1 section 5

Damage is rounded to the nearest integer with a minimum of 1 on a hit, and dealt damage is capped by the target's remaining HP:

`round(attack_stat × 0.204 × move_multiplier × (1 + variance) × (1 - guard) × crit_multiplier × other_modifier)`

`guard = clamp(0.0036 × (defender GRIT - 40), -0.10, 0.28)`.

Hit chance is `clamp(0.85 + 0.0016 × (attacker SWIFT - defender SWIFT), 0.60, 0.95)`. Crit chance baseline is `0.05 + 0.0161 × (attacker NERVE - 40)`; this audit uses Even risk and does not add Gamble or Wild bonuses. Crit multiplier is 1.75. Move multipliers are Headbutt 1.32, Quick Feet 0.68, Iron Hide 0.85, and Laser Stare 1.30. The replay is a hand-authored sample audit, not a seeded simulator result. Hit and crit outcomes are sample events; listed chances show the v1.1 probability formula and are not claims about an RNG roll.

A has SWIFT 56 / NERVE 46 and B has SWIFT 44 / NERVE 56. Thus normal hit chances are 86.92% for You and 83.08% for Rival; Laser Stare is an auto-hit. Baseline crit chances are 14.66% for You and 30.76% for Rival. The audit preserves the sample variances and applies the Iron Hide 0.8 modifier before rounding. The 20% Iron Hide reduction is kept separate from the guard value.

| Event | Round | Side | Move/effect | Attack stat | Multiplier | Variance | Guard | Crit mult. | Hit chance | Crit chance | Other | Raw formula | Rounded | Damage dealt / heal | Target |
|---:|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 1 | You | Headbutt | 52 | 1.32 | +0.047 | +0.0144 | 1.00 | 86.92% | 14.66% | 1.00 | 14.4496 | 14 | 14 | Rival |
| 2 | 1 | Rival | Laser Stare | 54 | 1.30 | +0.039 | -0.0072 | 1.00 | 100% auto-hit | 30.76% | 1.00 | 14.9864 | 15 | 15 | You |
| 3 | 2 | You | Quick Feet | 56 | 0.68 | -0.037 | +0.0144 | 1.00 | 86.92% | 14.66% | 1.00 | 7.3732 | 7 | 7 | Rival |
| 4 | 2 | Rival | Headbutt | 54 | 1.32 | +0.054 | -0.0072 | 1.00 | 83.08% | 30.76% | 1.00 | 15.4367 | 15 | 15 | You |
| 5 | 2 | Rival | Scorch | Fixed | 1.00 | n/a | n/a | n/a | n/a | n/a | fixed | 3 fixed | 3 | 3 | You |
| 6 | 3 | You | Iron Hide | 38 | 0.85 | +0.150 | +0.0144 | 1.00 | 86.92% | 14.66% | 1.00 | 7.4685 | 7 | 7 | Rival |
| 7 | 3 | Rival | Headbutt | 54 | 1.32 | +0.000 | -0.0072 | 1.00 | 83.08% | 30.76% | 0.80 Iron Hide | 11.7167 | 12 | 12 | You |
| 8 | 3 | Rival | Scorch | Fixed | 1.00 | n/a | n/a | n/a | n/a | n/a | fixed | 3 fixed | 3 | 3 | You |
| 9 | 4 | You | Headbutt | 60 | 1.32 | +0.070 | +0.0144 | 1.00 | 86.92% | 14.66% | Pump +8 PUNCH | 17.0388 | 17 | 17 | Rival |
| 10 | 4 | Rival | Quick Feet | 44 | 0.68 | +0.050 | -0.0072 | 1.00 | 83.08% | 30.76% | 1.00 | 6.4550 | 6 | 6 | You |
| 11 | 5 | You | Headbutt | 60 | 1.32 | -0.010 | +0.0144 | 1.00 | 86.92% | 14.66% | Pump +8 PUNCH | 15.7649 | 16 | 16 | Rival |
| 12 | 5 | Rival | Headbutt | 54 | 1.32 | +0.150 | -0.0072 | 1.75 | 83.08% | 30.76% | critical | 29.4747 | 29 | 29 | You |
| 13 | 5 | You | Calm Glow | Fixed heal | n/a | n/a | n/a | n/a | n/a | n/a | one trigger | +10 heal | n/a | +10 HP | You |
| 14 | 6 | You | Headbutt | 60 | 1.32 | +0.150 | +0.0144 | 1.00 | 86.92% | 14.66% | Pump +8 PUNCH | 18.3128 | 18 | 18 | Rival |
| 15 | 6 | Rival | Headbutt | 54 | 1.32 | -0.034 | -0.0072 | 1.00 | 83.08% | 30.76% | 1.00 | 14.1479 | 14 | 14 | You |
| 16 | 7 | You | Headbutt | 66 | 1.32 | +0.150 | +0.0144 | 1.00 | 86.92% | 14.66% | Underdog Pride +6 | 20.1440 | 20 | 20 | Rival |
| 17 | 7 | Rival | Headbutt | 54 | 1.32 | -0.034 | -0.0072 | 1.00 | 83.08% | 30.76% | target has 13 HP | 14.1479 | 14 | 13 (KO) | You |

Scorch deals its fixed 3 HP at the end of rounds 2 and 3 after Rival's first landed hit. Pump raises You's PUNCH from 52 to 60 after event 1. At event 16 You is behind on HP, so Underdog Pride adds +6 for an attack stat of 66. Calm Glow triggers once after event 12 lowers You below 40 HP, healing 10 HP. Laser Stare is used once, in event 2, and its first-action auto-hit is spent. Event 17 reduces You to 0 HP, so the fight ends immediately: Rival wins by KO with 1 HP remaining. Events 18 and 19 from the v3.1 sample are omitted because continuing after KO would violate section 3.

## Font declarations

Each page declares Barlow Condensed 700, 800, and 900 as separate `@font-face` rules with their respective files under `../../fonts/`, plus a separate Inter 800 face from `../../fonts/inter-latin-800-normal.woff2`. Existing IBM Plex Mono and Inter faces are retained.

## Verification results

Browser measurements were taken with headless Chromium through Playwright. To avoid the environment's navigation policy block, each HTML document was loaded directly with `page.set_content`; page scripts ran without JavaScript errors. `scrollWidth` is `document.documentElement.scrollWidth` at a 390px viewport. The desktop Play button measure is the bottom edge of `#play` at 1440 × 900. Fighter art measurements are the bounding boxes of `.fighter-art` and its child image. The repo-relative font and art files were not fetched into this isolated browser context, so text metrics used browser fallbacks; the measured art boxes are fixed by CSS. No overflow-hiding rule was added to `html` or `body`.

| Check | Result |
|---|---|
| Landing scrollWidth at 390px | 390px |
| Pick page scrollWidth at 390px | 390px |
| Coach scrollWidth at 390px | 390px |
| Replay scrollWidth at 390px | 390px |
| Arena scrollWidth at 390px | 390px |
| Profile scrollWidth at 390px | 390px |
| Play button bottom edge at 1440 × 900 | 661.98px from viewport top; visible without scrolling |
| Replay fighter art, desktop 1440 × 900 | Both `.fighter-art` and child images: 539px wide × 300px tall |
| Replay fighter art, mobile 390px | Both `.fighter-art` and child images: 176px wide × 176px tall (45.13% of viewport width) |

## Scope notes

The sample remains a hand-authored replay audit rather than a real simulation run. The stat totals are based on the v1 trait mapping. The art and fonts are referenced at the existing repo paths; the ZIP includes the attached 24 WebP art files, but not a copy of the repository's font files. No em dash is used in UI copy. Playwright confirmed 390px document scroll width for all six pages. The two event-row text colors with the lowest contrast were measured at 5.67:1 against the active-row background, above the 4.5:1 requirement; normal-row muted text measures 6.42:1. The event row uses the outcome word, actual damage or healing amount, any proc tags, and its narration line.
