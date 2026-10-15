# ChogBound trait mapping v2

Source of truth for the numbers is `trait-mapping-v2.json`. This page is the readable version. Every trait value found in the full 1,969-token scan is mapped. Anything not listed (future mints) falls back to the Unknown rows.

Stats: GRIT, PUNCH, SWIFT, NERVE. Formula: stat = clamp(40 + trait bonuses + tier bonus, 20, 95). Legendary 1/1 tokens use a fixed kit instead.

## Tier

| Tier | Bonus to every stat | Tokens |
|---|---|---:|
| Common | +0 | 1,279 |
| Uncommon | +1 | 590 |
| Rare (Skull form) | +2 | 60 |
| Epic (Radioactive base) | +3 | 30 |
| Legendary (1/1) | fixed kit | 10 |

## Body

| Class | Bonus | Values |
|---|---|---|
| Heavy | GRIT +16, SWIFT -6 | Army Vest, Astro Suit, Blue Holed Jacket, Blue jacket, dark jacket, Dragon suit, Electro Hoodie, Glitch Hoodie, Golden Armor, Mon Hoodie, Orange Holed Jacket, Orange Hoodie, Peach Hoodie, Red jacket, Sci Fi, Shark Suit, Sky Hoodie, Squid Game Guard, Yellow Hoodie |
| Light | SWIFT +14, GRIT -4 | BBC, Black Shirt, Black Trackset, Black Vest, Blue 143 Jersey, Blue Homeless Shirt, Blue Sleeveless, blue tee, Boner, Brown Homeless Shirt, Chug Life, CWO, Cyan Shirt, dark tee, dark vest, Farmer Shirt, Fire Shirt, Gojo, Grey Homeless Shirt, Grey Shirt, Guko, Hawaiian Polo, Inmate, MILF Lover, Orange Sleeveless, Pink Shirt, pink vest, Prisoner, Purple Shirt, Purple Tank, purple vest, Red 143 Jersey, Red shirt, Red Sleeveless, red tee, Red Trackset, Six Seven, Squid Game, Stripe Shirt, Stripe shirts, Stripes, Tank Top, Virgin, White Pure Shirt, White Shirt, White Sleeveless, White Tank, white tee, White Yukata, Yellow 143 Jersey, Yellow Shirt, Yellow Yukata, Zero THOTS |
| Showy | NERVE +12, GRIT +4 | Aqua Tuxedo, Banana suit, Blue Chinese, Blue Mafia, Blue tuxedo, CEO Vest, Cream Tuxedo, Cyan tuxedo, Duck Float, Gangster suit, Jesus, Jesus Robe, Kings Robe, Mummy, Pink Tuxedo, Red Chinese, Red Tuxedo, toad blue suit, Toad green Suit, Toad pink suit, Tuxedo, White tuxedo, Wizard, Wizard Cape |
| Bare (no Body, or Naked = Yes) | SWIFT +12, GRIT -2, NERVE +2 | none |

## Eyes (PUNCH and signature move)

| Class | PUNCH | Signature (when selected as the move) | Values |
|---|---:|---|---|
| Laser | +11 | Laser Stare | cyan laser, fire laser, Green laser, Purple laser |
| Tech | +9 | Scan | 3D Glass, Anime Glass, BTC Glass, Classic VR, Gradient visor, Modern VR, Plasma visor, Retro Glass, Sunset visor |
| Charm | +8 | Charm | Blue Happy, Blue Smirk, Closed Eye Crying, Frog, Green Happy, Green Smirk, Happy, Heart, Mixed Happy, Round Crying, Round Tear, Smirk, Teary, Worried, XD |
| Intimidate | +10 | Stare Down | Angry, Chog Viper, Dead, Green Side Eye, Mixed Side Eye, MOG, Side Eye, Thug, Tired, Vertical |
| Wild | +10 | Chaos Gaze | Blue Retard, Clown Eye, Clown Eye Mix, Green Retard, Mixed Retard, Red Retard, Retard |
| Neutral | +9 | none | Base, Blue Flat, Blue Round Eye, Flat, Green Round Eye, Mixed Round Eye, Normal, Normal Eye, Red Flat, Red Round Eye, Round, Round Eye, Up |

## Head

| Class | Bonus | Values |
|---|---|---|
| Cap | NERVE +8 | 10k TPS Cap, 8 Ball Beanie, Balls Cap, Blue Bucket Cap, Boob Cap, BOOB Cap, BTC Beanie, BTC Cap, Buttcoin Cap, Chog Cap, Choggie Beanie, Choggie Cap, Cloud Cap, Crown, Diamond, Dollar Cap, ETH Cap, Gray Bucket Cap, Holy Seal, Horny Cap, JEET Cap, Jeet Cap, MCGA, MCGA Cap, MMGA Cap, Mon Beanie, Mon Cap, Orange Bucket Cap, Peace Cap, Red Peace Cap, RETARD Cap, RH Beanie, Silver wreath, Spartan Helmet, Star Cap, Thunder Cap, TISM Cap, WAGMI Cap, Wizard Beanie |
| Style | SWIFT +6, NERVE +4 | 3rd Eye, Blue Laser, Bob Hair, Clown Nose, Demon Horn, devil horn, Durag, Gold Thorn, Head Wrap, Japan Headband, Mafia Hat, MEGA Chog, NEET, Peace hat, Plumber, Poison Shroom, Purple Horn, Rainbow Wig, Red Bandana, Red Headband, Red Horn, Robber, Russian Hat, Silver Thorn, Taped Banana, Void Horn, Wizard Hat |
| No Head | SWIFT +4, NERVE +4 | none |

## Mouth (NERVE and narration voice)

| Voice | NERVE | Values |
|---|---:|---|
| fierce | +4 | Grit |
| smug | +3 | Clown Mouth, Gold Tooth, normal smile, Smile |
| hustler | +2 | BTC Coin, Mon coin |
| hungry | +2 | Bubblegum, Drooling, Lip Bite, Rainbow Puke |
| gloom | +0 | Flat, Sad, Worried |
| neutral | +2 | wo |

Gloom also grants Underdog Pride: +6 PUNCH while behind on HP.

## Aura (one trigger per fight, none if absent)

| Effect | Rule | Values |
|---|---|---|
| scorch | After your first landed hit, target loses 2 HP at the end of each of the next 2 rounds | Burning Aura, Electric Shock, Fiery Aura, Fire |
| gust | Acts first in round 1, SWIFT +8 and +30% damage in round 1 | Cool Aura, Wind, Yellow Aura |
| vanish | First incoming hit is dodged with 50% probability | Clean, Pink Mist, Smoke, White Aura |
| calm-glow | First time HP drops below 40, heal 6 | Aqua Aura, Green Aura, Light Purple, Mint, Purple, Rose Aura, Rose Scent, Royal Aura, Royal Blue, Royal Blue Aura, Violet |

## Accessory (one effect, none if absent)

| Effect | Rule | Values |
|---|---|---|
| pump | After your first landed hit, +4 PUNCH | Green Candle, Knife |
| lucky-flip | Re-roll one miss, and the re-roll hits at half the normal chance | Cigar, Coin |
| sidekick | Each round 12% chance of an extra 3 damage hit that cannot miss | Fwog, PEPE |
| trinket | +4 to your lowest base stat | Heart, Red Candle, SB |

## Signature moves (only when selected as the plan move)

- Laser Stare: first action only, auto-hit, multiplier 1.15, then the go-to attack becomes Headbutt.
- Scan: reveals the rival's plan before round 1. Your first counter deals +35%.
- Charm: rival NERVE -30 in rounds 1 to 3.
- Stare Down: rival's first attack has -20 points hit chance.
- Chaos Gaze: replaces the go-to attack. Coin flip between 2.5x damage and a miss.

## Legendary 1/1 kits

| Name | GRIT | PUNCH | SWIFT | NERVE | Voice | Aura | Accessory | Signature |
|---|---:|---:|---:|---:|---|---|---|---|
| Blaze | 44 | 56 | 50 | 50 | fierce | scorch | pump | Laser Stare |
| Burning Skully | 50 | 54 | 44 | 52 | gloom | scorch | sidekick | Chaos Gaze |
| Chog Scream | 46 | 52 | 48 | 54 | fierce | gust | lucky-flip | Stare Down |
| Chogbomination | 58 | 54 | 38 | 48 | hungry | calm-glow | sidekick | Chaos Gaze |
| Frogger | 42 | 46 | 60 | 52 | hustler | gust | sidekick | Scan |
| Grim | 52 | 50 | 46 | 52 | gloom | vanish | pump | Stare Down |
| Halo | 48 | 46 | 50 | 56 | smug | calm-glow | lucky-flip | Charm |
| Krown | 50 | 50 | 46 | 58 | smug | calm-glow | pump | Scan |
| Midas | 46 | 48 | 50 | 56 | hustler | gust | lucky-flip | Charm |
| Redd | 46 | 56 | 52 | 48 | fierce | scorch | lucky-flip | Laser Stare |

Kits are v1 designs, tuned only for balance. Edit them to taste.

## Cosmetic only

Background, Skin, Side, Base, Form. Side mirrors the art so fighters face each other. Background tints the stage.

## Display aliases (UI text only)

Retard (eyes, any color) shows as Goofy. RETARD Cap shows as Goof Cap. Legendary names contain an em dash in the metadata (for example `CHOG #53 — Blaze`), so show them as `CHOG #53 / Blaze` and never display the em dash. Printed text inside the art cannot be changed.
