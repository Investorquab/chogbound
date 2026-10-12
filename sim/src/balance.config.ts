/** v1.1 balance constants from docs/SIM_SPEC.md section 5. */
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
  'Laser Stare': 1.30,
  'Chaos Gaze': 1.8,
} as const;
