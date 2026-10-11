# ChogBound trait mapping v1

Stats: GRIT (toughness), PUNCH (damage), SWIFT (speed and dodge), NERVE (crits, composure).
Formula: stat = clamp(40 + sum of trait bonuses + tier bonus, 20, 95).
Tier bonus: Common +0, Uncommon +2 to every stat, unknown higher tiers +2 per step.
The small spread is deliberate: underdogs must be able to win.
The UI always shows the source trait next to every number.

## Body: GRIT / SWIFT / NERVE
| Class | Bonus | Values |
|---|---|---|
| Heavy | GRIT +16, SWIFT -6 | Squid Game Guard, Dragon suit, Astro Suit, dark jacket, Red jacket |
| Light | SWIFT +14, GRIT -4 | dark tee, Red Sleeveless, Hawaiian Polo, Black Trackset, Brown Homeless Shirt, Yellow Yukata, Yellow 143 Jersey, Blue 143 Jersey, dark vest, pink vest, purple vest |
| Showy | NERVE +12, GRIT +4 | Cream Tuxedo, Pink Tuxedo, Banana suit, Jesus |
| Bare (no Body or Naked = Yes) | SWIFT +10, GRIT -6 | none |
| Unknown | GRIT +4, SWIFT +4 | any unmapped value |

## Eyes: PUNCH and signature move
| Class | PUNCH | Signature move | Values |
|---|---|---|---|
| Laser | +14 | Laser Stare: ranged hit that ignores dodge once per fight | fire laser, Green laser, cyan laser, Purple laser |
| Tech | +8 | Scan: reveals the rival's plan before round 1, first counter deals +25% | BTC Glass, 3D Glass, Modern VR, Anime Glass |
| Charm | +4 | Charm: rival NERVE -8 for rounds 1 to 3 | Heart, Happy, Smirk, XD, Round Tear |
| Intimidate | +10 | Stare Down: rival's first attack is 15% less accurate | Thug, Side Eye, Dead, Vertical, MOG |
| Wild | +12 | Chaos Gaze: each use is a coin flip between 1.8x damage and a miss | Retard |
| Neutral | +6 | none | Base, Round Eye, any unmapped value |

## Head: NERVE / SWIFT
| Class | Bonus | Values |
|---|---|---|
| Cap | NERVE +8 | MCGA, MCGA Cap, TISM Cap, Blue Bucket Cap, Gray Bucket Cap, BTC Cap, BTC Beanie, Mon Cap, RETARD Cap, Dollar Cap, JEET Cap, Chog Cap |
| Style | SWIFT +6, NERVE +4 | Plumber, Robber, Red Headband, Durag, Rainbow Wig |
| No Head | SWIFT +4 | none |
| Unknown | NERVE +4 | any unmapped value |

## Mouth: NERVE and the Chog's voice (narration tone)
| Class | NERVE | Voice | Values |
|---|---|---|---|
| Fierce | +8 | fierce | Grit |
| Smug | +4 | smug | Smile, normal smile, Gold Tooth, Clown Mouth |
| Hustler | +2 | hustler | BTC Coin, Mon coin |
| Hungry | 0 | cheeky and hungry | Drooling, Bubblegum, Lip Bite |
| Gloom | -4 | gloomy, plus Underdog Pride: +6 PUNCH while behind on HP | Sad, Flat |
| Unknown | +2 | neutral | wo, any unmapped value |

## Aura: one special trigger per fight (none if no Aura)
| Class | Effect | Values |
|---|---|---|
| Fire | Scorch: extra damage over 2 rounds after the first hit lands | Fire, Burning Aura |
| Wind | Gust: acts first in round 1, SWIFT +8 | Wind |
| Smoke | Vanish: dodges the first incoming hit | Smoke |
| Glow | Calm Glow: restores 10% HP once when below 40% | Aqua Aura, Mint, Light Purple |

## Accessory: one item effect (none if no Accessory)
| Value | Effect |
|---|---|
| Green Candle | Pump: +8 PUNCH after landing the first hit |
| Coin | Lucky Flip: re-roll one miss per fight |
| Fwog | Sidekick: 20% chance each round of a bonus 4 damage hit |
| SB | Trinket: +4 to the lowest stat (meaning of SB unconfirmed, do not invent lore) |
| Unknown | Trinket |

## Cosmetic only (no stat effect)
Background: tints the stage and share card. Skin, Base, Form: none.
Side: mirrors the art so the two fighters face each other.

## Moves (every Chog)
Headbutt (scales with PUNCH), Quick Feet (scales with SWIFT), Iron Hide (scales with GRIT),
plus one Signature move from Eyes if the class has one.

## Display aliases (UI text only, raw values stay in data)
Retard becomes Goofy. RETARD Cap becomes Goof Cap.

## Worked example
Dragon suit (Heavy), fire laser (Laser), Plumber (Style), Grit mouth (Fierce), Fire aura, Green Candle, Uncommon:
GRIT 40+16+2 = 58. PUNCH 40+14+2 = 56. SWIFT 40-6+6+2 = 42. NERVE 40+4+8+2 = 54.