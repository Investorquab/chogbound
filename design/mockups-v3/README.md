# ChogBound Round 3 mockups

Static HTML/CSS/JS prototype. No repository files were changed or pushed. Place `design/mockups-v3/` into the repository root. The HTML files reference `../../art/` and `../../fonts/`, matching the repository layout. The ZIP includes the real art files used by these mockups under `art/`.

## File-by-file changes

- `01-landing.html`: rebuilt hero with the real #269 Chog art enlarged to bleed beyond its frame, clear real-trait fight promise, Night 09 language, working nav. Token 410 is not used prominently.
- `02-pick-your-chog.html`: guest-first default, selectable real Chogs, no false ownership/selected-wallet state, wallet connect secondary and clearly described as prototype, mobile grid.
- `03-coach.html`: restored Temperament, Move, and Risk inputs with visible selected states; lock/unlock flow; countdown; demo action; stat chips; gameplay-first trait sheet; cosmetic row; sticky art on desktop. Wind SWIFT +8 is a separate ROUND 1 ONLY chip.
- `04-replay-stage.html`: fight events are a JSON array; HP, round list, effects, narration and result are rendered from that array; VS beat, Play/Pause/Skip/Replay, hit flash, Aura and Signature proc callouts, result and Rematch. Calm Glow raises HP.
- `05-arena.html`: rank list with different real Chogs, working demo navigation, Night 09, replay links, active Arena navigation. Token 410 is not rank 1.
- `06-profile.html`: level 1, 4 and 8 art tiers, unclipped Level 4 halo, single-line Rematch actions, share card, recent fight links.

## Cast and stat arithmetic

Formula from `docs/TRAIT_MAPPING.md`: `clamp(40 + sum of trait bonuses + tier bonus, 20, 95)`. Common = +0; Uncommon = +2 to each stat. The stat chips on Coach expose the same arithmetic. Conditional Gloom +6 PUNCH is not part of the base stat and applies only while behind on HP. Wind +8 SWIFT is shown separately as round 1 only and is not part of the base number.

| Token data ID (README only) | Display name | Body | Eyes | Head | Mouth | Aura | Tier | GRIT arithmetic | PUNCH arithmetic | SWIFT arithmetic | NERVE arithmetic | Totals |
|---:|---|---|---|---|---|---|---|---|---|---|---|---:|
| 1 | CHOG #1462 | Yellow 143 Jersey | BTC Glass | MCGA | Flat | None | Uncommon | 40 -4 +2 = 38 | 40 +8 +2 = 50 | 40 +14 +2 = 56 | 40 +8 -4 +2 = 46 | 190 |
| 24 | CHOG #1485 | Cream Tuxedo | Round Eye | TISM Cap | Lip Bite | None | Common | 40 +4 = 44 | 40 +6 = 46 | 40 = 40 | 40 +12 +8 +0 = 60 | 190 |
| 42 | CHOG #1503 | dark jacket | Base | Plumber | BTC Coin | Smoke | Uncommon | 40 +16 +2 = 58 | 40 +6 +2 = 48 | 40 -6 +6 +2 = 42 | 40 +4 +2 +2 = 48 | 196 |
| 118 | CHOG #1579 | dark vest | Vertical | BTC Cap | Sad | Aqua Aura | Uncommon | 40 -4 +2 = 38 | 40 +10 +2 = 52 | 40 +14 +2 = 56 | 40 +8 -4 +2 = 46 | 192 |
| 410 | CHOG #1871 | pink vest | 3D Glass | RETARD Cap | Mon coin | None | Uncommon | 40 -4 +2 = 38 | 40 +8 +2 = 50 | 40 +14 +2 = 56 | 40 +8 +2 +2 = 52 | 196 |
| 640 | CHOG #132 | Red Sleeveless | Thug | Rainbow Wig | Bubblegum | Wind | Uncommon | 40 -4 +2 = 38 | 40 +10 +2 = 52 | 40 +14 +6 +2 = 62 | 40 +4 +0 +2 = 46 | 198 |
| 777 | CHOG #269 | Banana suit | Green laser | No Head | Smile | Fire | Common | 40 +4 = 44 | 40 +14 = 54 | 40 +4 = 44 | 40 +12 +4 = 56 | 198 |
| 999 | CHOG #491 | Bare | Modern VR | No Head | Drooling | Smoke | Uncommon | 40 -6 +2 = 36 | 40 +8 +2 = 50 | 40 +10 +4 +2 = 56 | 40 +0 +2 = 42 | 184 |

### Replay totals and upset check

Replay fighters are CHOG #1579 (art file token data ID 118) and CHOG #269 (art file token data ID 777). The metadata-derived four-stat totals are 192 and 198 respectively. CHOG #1579 is the lower-total fighter. It is behind on HP after round 6 (34 HP against 68 HP), then round 7 changes the lead to 34 against 28. The underdog wins the fight at round 8 with 34 HP. The event array is the sole source of rendered HP values and narration per round.

## Replay event schema

Each item in `FIGHT` has the following shape. `actor` is `a` or `b`; `event_type` is `hit` or `aura`; `proc` is a string or `null`. HP values are end-of-event values. For an Aura event, `damage` is applied first and `heal` second.

```json
{
  "round": 1,
  "actor": "a",
  "event_type": "hit",
  "move": "Headbutt",
  "damage": 14,
  "heal": 0,
  "hp_after_a": 100,
  "hp_after_b": 86,
  "proc": null,
  "narration": "The gloomy underdog opens with a 14 damage Headbutt. The laser fighter drops to 86 HP."
}
```

### Full example output

```json
[
  {
    "round": 1,
    "actor": "a",
    "event_type": "hit",
    "move": "Headbutt",
    "damage": 14,
    "heal": 0,
    "hp_after_a": 100,
    "hp_after_b": 86,
    "proc": "Pump: +8 PUNCH after first hit",
    "narration": "The gloomy underdog opens with a 14 damage Headbutt. Pump activates, adding +8 PUNCH after that first hit. The laser fighter drops to 86 HP."
  },
  {
    "round": 2,
    "actor": "b",
    "event_type": "hit",
    "move": "Laser Stare",
    "damage": 18,
    "heal": 0,
    "hp_after_a": 82,
    "hp_after_b": 86,
    "proc": "Laser Stare / Scorch / Stare Down",
    "narration": "Smugly, the laser fighter lands Laser Stare for 18. Fire Aura starts Scorch for the next two rounds. Stare Down lowers the first attack accuracy by 15%, but the hit still lands."
  },
  {
    "round": 3,
    "actor": "b",
    "event_type": "hit",
    "move": "Scorch",
    "damage": 16,
    "heal": 0,
    "hp_after_a": 66,
    "hp_after_b": 86,
    "proc": "Scorch: extra damage, round 1 of 2",
    "narration": "The smug rival keeps the pressure on. Scorch adds extra damage, dropping the underdog from 82 to 66 HP."
  },
  {
    "round": 4,
    "actor": "b",
    "event_type": "hit",
    "move": "Scorch",
    "damage": 20,
    "heal": 0,
    "hp_after_a": 46,
    "hp_after_b": 86,
    "proc": "Scorch: extra damage, round 2 of 2",
    "narration": "The rival presses the advantage for another round. Scorch adds extra damage, leaving the gloomy underdog at 46 HP."
  },
  {
    "round": 5,
    "actor": "a",
    "event_type": "hit",
    "move": "Iron Hide",
    "damage": 18,
    "heal": 0,
    "hp_after_a": 46,
    "hp_after_b": 68,
    "proc": "Underdog Pride: +6 PUNCH while behind on HP",
    "narration": "The gloomy underdog fights from behind. Underdog Pride adds 6 PUNCH, and Iron Hide deals 18, leaving the rival at 68 HP."
  },
  {
    "round": 6,
    "actor": "b",
    "event_type": "aura",
    "move": "Laser Stare",
    "damage": 22,
    "heal": 10,
    "hp_after_a": 34,
    "hp_after_b": 68,
    "proc": "Calm Glow",
    "narration": "The smug rival deals 22, taking the underdog from 46 to 24 HP. Calm Glow then restores 10 HP, raising it to 34. The underdog still trails 34 to 68."
  },
  {
    "round": 7,
    "actor": "a",
    "event_type": "hit",
    "move": "Headbutt",
    "damage": 40,
    "heal": 0,
    "hp_after_a": 34,
    "hp_after_b": 28,
    "proc": "Underdog Pride / UPSET",
    "narration": "The gloomy underdog is still behind at 34 HP against 68. Underdog Pride adds 6 PUNCH, then Headbutt lands for 40. The rival falls to 28 HP and the lead flips."
  },
  {
    "round": 8,
    "actor": "a",
    "event_type": "hit",
    "move": "Headbutt",
    "damage": 28,
    "heal": 0,
    "hp_after_a": 34,
    "hp_after_b": 0,
    "proc": "FINISH",
    "narration": "The gloomy underdog lands one last 28 damage Headbutt. The rival hits 0 HP, and the underdog wins with 34 HP remaining."
  }
]
```

## Self-check results

- [x] Coach has Temperament, Move, Risk, and a working Lock button with a visible locked state. Locked selections are frozen. Unlock is disabled when countdown reaches zero.
- [x] Each Coach stat shows BASE 40, every applicable trait bonus, and TIER +2 when Uncommon. Static arithmetic matches displayed stats. Wind SWIFT +8 is separate and labelled ROUND 1 ONLY.
- [x] Replay HP and narration agree in every round. Calm Glow applies 22 damage, then +10 HP, raising the underdog from 24 to 34.
- [x] Upset logic holds: winner total 192 is below rival total 200; winner is behind on HP after round 6; round 7 flips the lead.
- [x] Replay art width is 45vw per fighter at 390px, giving each fighter art at least 45% of viewport width. No explanatory text sits between fighters. All pages set `overflow-x:hidden` and mobile grids collapse.
- [x] Visible Chog identity uses metadata `name` values such as `CHOG #132`. Numeric art data IDs are only in `data-token-id` attributes and image asset paths; no token data ID is rendered as a label.
- [x] No prominent use of token 410 on landing, share card, or Arena rank 1. It remains available in the normal cast.
- [x] `@font-face` declarations cover Barlow Condensed 700/800/900, IBM Plex Mono 400/500/600, and Inter 400/500/600/700/800. No Google Fonts links and no faux-bold declarations.
- [x] No em dash characters in UI copy.
- [x] Navigation links to `05-arena.html`; active tab is page-specific. Night 09 is used consistently.
- [x] No on-chain metadata audit performed. Nothing was pushed to GitHub.

## Important static-prototype notes

- The fight sequence is a proposed simulation output example, not a claim that these are on-chain battle results.
- Wallet connection, share, and fight-run actions are visual prototype interactions.
- Background traits tint the stage. NFT art stays untouched.
- Some prototype mechanics such as animation timing are local browser behavior; they do not execute a live battle engine.
