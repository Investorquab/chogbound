/** Balance constants from docs/SIM_SPEC.md sections 5 and 6 (v1.3). Rerun `npm run balance:full` after any change. */
export const DAMAGE_COEFFICIENT = 0.204;

export const HIT_CHANCE_BASE = 0.85;
export const HIT_CHANCE_SLOPE = 0.0016;
export const HIT_CHANCE_MIN = 0.60;
export const HIT_CHANCE_MAX = 0.95;

export const GUARD_SLOPE = 0.0036;
export const GUARD_MIN = -0.10;
export const GUARD_MAX = 0.28;

export const CRIT_CHANCE_BASE = 0.05;
export const CRIT_CHANCE_SLOPE = 0.0161;
export const CRIT_MULTIPLIER = 1.75;

export const MOVE_MULTIPLIERS = {
  Headbutt: 1.32,
  'Quick Feet': 0.68,
  'Iron Hide': 0.85,
  'Laser Stare': 1.15,
  'Chaos Gaze': 2.5,
} as const;

/** Effect strengths, SIM_SPEC section 6 (v1.3). */
export const EFFECTS = {
  scorchDamage: 2,
  scorchRounds: 2,
  vanishDodgeChance: 0.5,
  calmGlowHeal: 6,
  calmGlowThreshold: 40,
  gustSwift: 8,
  gustRound1Damage: 1.3,
  pumpPunch: 4,
  luckyFlipHitFactor: 0.5,
  sidekickChance: 0.12,
  sidekickDamage: 3,
  scanCounterMultiplier: 1.35,
  charmNervePenalty: 30,
  charmRounds: 3,
  stareDownHitPenalty: 0.20,
  chaosGazeHitChance: 0.5,
} as const;
