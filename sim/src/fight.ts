import { createRng, normalizeSeed } from './rng.js';
import type { AccessoryClass, CoreMove, FightEvent, Fighter, Move, Plan, Side, SimResult, SignatureMove, Stats } from './types.js';

const CORE: CoreMove[] = ['Headbutt', 'Quick Feet', 'Iron Hide'];
const MOVE_STAT: Record<CoreMove, keyof Stats> = { Headbutt: 'PUNCH', 'Quick Feet': 'SWIFT', 'Iron Hide': 'GRIT' };
const MULTIPLIER: Record<CoreMove | SignatureMove, number> = { Headbutt: 1.15, 'Quick Feet': 0.95, 'Iron Hide': 0.85, 'Laser Stare': 1.3, Scan: 1, Charm: 1, 'Stare Down': 1, 'Chaos Gaze': 1.8 };
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const roundDamage = (n: number) => Math.max(1, Math.round(n));
type State = { fighter: Fighter; plan: Plan; hp: number; baseTotal: number; activeSignature: SignatureMove | null; stats: Stats; firstIncomingDodged: boolean; luckyFlipUsed: boolean; laserAutoUsed: boolean; pumpUsed: boolean; scorchTriggered: boolean; scorchRounds: number[]; glowUsed: boolean; ironGuard: number; hitTaken: boolean; coolBonusPending: boolean; coolBonusUsed: boolean; firstAttackDone: boolean; firstCounterDone: boolean; laserDodgeIgnoreUsed: boolean; sidekickUsedRound: number; }; 
function sideState(a: State, b: State, side: Side): { self: State; rival: State; selfSide: Side; rivalSide: Side } { return side === 'a' ? { self: a, rival: b, selfSide: 'a', rivalSide: 'b' } : { self: b, rival: a, selfSide: 'b', rivalSide: 'a' }; }
export function simulate(fighterA: Fighter, fighterB: Fighter, planA: Plan, planB: Plan, seed: string | number | bigint): SimResult {
  const signatures: SignatureMove[] = ['Laser Stare', 'Scan', 'Charm', 'Stare Down', 'Chaos Gaze'];
  if (signatures.includes(planA.move as SignatureMove) && fighterA.signature !== planA.move) throw new Error(`Plan A signature ${planA.move} does not match fighter A signature`);
  if (signatures.includes(planB.move as SignatureMove) && fighterB.signature !== planB.move) throw new Error(`Plan B signature ${planB.move} does not match fighter B signature`);
  const rng = createRng(seed); const seedText = normalizeSeed(seed);
  const makeState = (fighter: Fighter, plan: Plan): State => ({ fighter, plan, hp: 100, baseTotal: fighter.stats.GRIT + fighter.stats.PUNCH + fighter.stats.SWIFT + fighter.stats.NERVE, activeSignature: fighter.signature && plan.move === fighter.signature ? fighter.signature : null, stats: { ...fighter.stats }, firstIncomingDodged: false, luckyFlipUsed: false, laserAutoUsed: false, pumpUsed: false, scorchTriggered: false, scorchRounds: [], glowUsed: false, ironGuard: 0, hitTaken: false, coolBonusPending: false, coolBonusUsed: false, firstAttackDone: false, firstCounterDone: false, laserDodgeIgnoreUsed: false, sidekickUsedRound: 0 });
  const a = makeState(fighterA, planA), b = makeState(fighterB, planB); const events: FightEvent[] = []; let n = 0; let finished = false; let rounds = 0; let ko = false;
  const event = (round: number, actor: Side, action: FightEvent['action'], move: FightEvent['move'], outcome: FightEvent['outcome'], damage: number, heal: number, procs: string[], narration_key: string, vars: FightEvent['vars']) => {
    events.push({ n: ++n, round, actor, action, move, outcome, damage, heal, hp_after: { a: a.hp, b: b.hp }, procs, narration_key, vars });
  };
  const afterHpChange = (target: State, targetSide: Side, round: number) => {
    if (target.hp > 0 && !target.glowUsed && target.fighter.aura === 'calm-glow' && target.hp < 40) {
      target.glowUsed = true; const heal = Math.min(10, 100 - target.hp); target.hp += heal;
      event(round, targetSide, 'heal', 'Calm Glow', 'hit', 0, heal, ['calm-glow'], 'heal.calm-glow', { heal, hp: target.hp });
    }
  };
  const activeStats = (state: State, round: number) => ({ ...state.stats, SWIFT: state.stats.SWIFT + (state.fighter.aura === 'gust' && round === 1 ? 8 : 0), NERVE: state.stats.NERVE - (state === a && b.activeSignature === 'Charm' || state === b && a.activeSignature === 'Charm' ? (round <= 3 ? 8 : 0) : 0), PUNCH: state.stats.PUNCH + (state.fighter.voiceClass === 'gloom' && state.hp < (state === a ? b.hp : a.hp) ? 6 : 0) });
  const chooseMove = (state: State): CoreMove | SignatureMove => {
    if (state.plan.temperament === 'Wild') return CORE[rng.int(CORE.length)];
    if (state.activeSignature) {
      if (rng.chance(0.6)) return state.activeSignature === 'Laser Stare' || state.activeSignature === 'Chaos Gaze' ? state.activeSignature : 'Headbutt';
      const choices = state.activeSignature === 'Laser Stare' || state.activeSignature === 'Chaos Gaze' ? CORE : CORE.filter(m => m !== 'Headbutt');
      return choices[rng.int(choices.length)];
    }
    if (CORE.includes(state.plan.move as CoreMove) && rng.chance(0.6)) return state.plan.move as CoreMove;
    const choices = CORE.filter(m => m !== state.plan.move);
    return choices[rng.int(choices.length)];
  };
  const attack = (attacker: State, defender: State, actor: Side, targetSide: Side, round: number, move: CoreMove | SignatureMove, isSidekick = false) => {
    if (finished) return;
    const procs: string[] = []; const attackerStats = activeStats(attacker, round); const defenderStats = activeStats(defender, round);
    if (attacker.fighter.voiceClass === 'gloom' && attacker.hp < defender.hp) procs.push('underdog-pride');
    let hitChance = clamp(0.85 + 0.004 * (attackerStats.SWIFT - defenderStats.SWIFT), 0.60, 0.95);
    if (defender.activeSignature === 'Stare Down' && !attacker.firstAttackDone) { hitChance -= 0.15; procs.push('stare-down'); }
    if (attacker.plan.temperament === 'Feisty' && round <= 3) procs.push('feisty');
    if (attacker.plan.temperament === 'Feisty' && round >= 6) procs.push('feisty-fatigue');
    let actualMove: FightEvent['move'] = isSidekick ? 'Headbutt' : move; let multiplier = isSidekick ? 1 : MULTIPLIER[move];
    const coolCounter = !isSidekick && attacker.plan.temperament === 'Cool' && attacker.coolBonusPending && !attacker.coolBonusUsed;
    if (coolCounter) { attacker.coolBonusPending = false; attacker.coolBonusUsed = true; procs.push('cool-counter'); }
    const scanCounter = !isSidekick && attacker.activeSignature === 'Scan' && attacker.hitTaken && !attacker.firstCounterDone;
    if (scanCounter) { attacker.firstCounterDone = true; procs.push('scan-counter'); }
    if (move === 'Iron Hide' && !isSidekick) { attacker.ironGuard = Math.max(attacker.ironGuard, 1); procs.push('iron-hide-guard'); }
    let hit = isSidekick || (move === 'Laser Stare' && !attacker.laserAutoUsed) || rng.chance(clamp(hitChance, 0.45, 0.95));
    if (move === 'Laser Stare' && !attacker.laserAutoUsed) { attacker.laserAutoUsed = true; procs.push('laser-auto-hit'); hit = true; }
    if (!isSidekick && defender.fighter.aura === 'vanish' && !defender.firstIncomingDodged) {
      if (move === 'Laser Stare' && !attacker.laserDodgeIgnoreUsed) { defender.firstIncomingDodged = true; attacker.laserDodgeIgnoreUsed = true; procs.push('laser-ignores-vanish'); }
      else { defender.firstIncomingDodged = true; hit = false; procs.push('vanish'); event(round, actor, 'attack', actualMove, 'dodge', 0, 0, procs, 'attack.dodge', {}); attacker.firstAttackDone = true; return; }
    }
    if (!hit && attacker.fighter.accessory === 'lucky-flip' && !attacker.luckyFlipUsed) { attacker.luckyFlipUsed = true; procs.push('lucky-flip'); hit = rng.chance(clamp(hitChance, 0.45, 0.95)); }
    if (move === 'Chaos Gaze') { const chaosHit = rng.chance(0.5); hit = chaosHit; multiplier = 1.8; procs.push(chaosHit ? 'chaos-gaze-boost' : 'chaos-gaze-miss'); }
    attacker.firstAttackDone = true;
    if (!hit) { event(round, actor, 'attack', actualMove, 'miss', 0, 0, procs, 'attack.miss', { attacker: attacker.fighter.name, target: defender.fighter.name }); return; }
    const statName = isSidekick ? 'PUNCH' : MOVE_STAT[move as CoreMove] ?? 'PUNCH'; let attackStat = attackerStats[statName];
    if (move === 'Scan' && attacker.activeSignature === 'Scan') { /* Scan is an opening reveal, not an attack. */ attackStat = attackerStats.PUNCH; }
    if (coolCounter) attackStat *= 1.1;
    let variance = (rng.next() * 2 - 1) * ({ Safe: 0.05, Even: 0.15, Gamble: 0.30 } as const)[attacker.plan.risk];
    let critChance = 0.05 + 0.004 * (attackerStats.NERVE - 40) + (attacker.plan.risk === 'Gamble' ? 0.10 : 0) + (attacker.plan.temperament === 'Wild' ? 0.15 : 0);
    const crit = rng.chance(clamp(critChance, 0, 0.95));
    let guard = clamp(0.006 * (defenderStats.GRIT - 40), -0.10, 0.20); if (defender.ironGuard > 0) { guard = 1 - (1 - guard) * 0.8; defender.ironGuard--; procs.push('iron-hide'); }
    let damageFactor = 1; if (attacker.plan.temperament === 'Feisty') damageFactor *= round <= 3 ? 1.1 : round >= 6 ? 0.9 : 1;
    if (defender.plan.temperament === 'Cool' && round <= 3) damageFactor *= 0.9;
    if (scanCounter) damageFactor *= 1.25;
    const raw = attackStat * 0.18 * multiplier * (1 + variance) * (1 - guard) * (crit ? 1.5 : 1) * damageFactor;
    const damage = roundDamage(raw); if (crit) procs.push('crit');
    const dealt = Math.min(defender.hp, damage); defender.hp -= dealt;
    event(round, actor, 'attack', actualMove, crit ? 'crit' : 'hit', dealt, 0, procs, crit ? 'attack.crit' : `hit.${String(actualMove).toLowerCase().replaceAll(' ','-')}`, { damage: dealt, target_hp: defender.hp, attacker: attacker.fighter.name, target: defender.fighter.name });
    if (dealt > 0) { defender.hitTaken = true; if (defender.plan.temperament === 'Cool' && !defender.coolBonusUsed) defender.coolBonusPending = true; }
    if (!attacker.pumpUsed && attacker.fighter.accessory === 'pump' && dealt > 0) { attacker.pumpUsed = true; attacker.stats.PUNCH += 8; procs.push('pump'); }
    if (!attacker.scorchTriggered && attacker.fighter.aura === 'scorch' && dealt > 0) { attacker.scorchTriggered = true; attacker.scorchRounds = [round + 1, round + 2]; procs.push('scorch-armed'); }
    afterHpChange(defender, targetSide, round);
    if (defender.hp <= 0) { finished = true; ko = true; }
  };
  // Signature effects which are informational or modify the rival are emitted as explicit events before combat.
  for (const [state, side, rival] of [[a,'a',b],[b,'b',a]] as const) {
    if (state.activeSignature === 'Scan') event(0, side, 'opening', 'Scan', 'hit', 0, 0, ['scan-reveal'], 'signature.scan', { rival_plan: `${rival.plan.temperament}/${rival.plan.move}/${rival.plan.risk}` });
  }
  for (let round = 1; round <= 8 && !finished; round++) {
    rounds = round;
    const aStats = activeStats(a, round), bStats = activeStats(b, round);
    let first: Side;
    const gustA = a.fighter.aura === 'gust' && round === 1, gustB = b.fighter.aura === 'gust' && round === 1;
    if (gustA !== gustB) first = gustA ? 'a' : 'b';
    else if (aStats.SWIFT !== bStats.SWIFT) first = aStats.SWIFT > bStats.SWIFT ? 'a' : 'b';
    else if (aStats.NERVE !== bStats.NERVE) first = aStats.NERVE > bStats.NERVE ? 'a' : 'b';
    else first = rng.chance(0.5) ? 'a' : 'b';
    for (const side of [first, first === 'a' ? 'b' : 'a'] as Side[]) {
      if (finished) break; const { self, rival, selfSide, rivalSide } = sideState(a,b,side);
      const move = chooseMove(self); attack(self, rival, selfSide, rivalSide, round, move);
      if (finished) break;
      if (self.fighter.accessory === 'sidekick' && self.sidekickUsedRound !== round) {
        self.sidekickUsedRound = round;
        if (rng.chance(0.20)) { const amount = Math.min(rival.hp, 4); rival.hp -= amount; const sidekickProcs = ['sidekick']; event(round, selfSide, 'attack', 'Headbutt', 'hit', amount, 0, sidekickProcs, 'accessory.sidekick', { damage: amount, target_hp: rival.hp }); rival.hitTaken = true; if (rival.plan.temperament === 'Cool' && !rival.coolBonusUsed) rival.coolBonusPending = true; if (!self.scorchTriggered && self.fighter.aura === 'scorch' && amount > 0) { self.scorchTriggered = true; self.scorchRounds = [round + 1, round + 2]; sidekickProcs.push('scorch-armed'); } afterHpChange(rival, rivalSide, round); if (rival.hp <= 0) { finished = true; ko = true; } }
      }
    }
    if (finished) break;
    // Scorch damage resolves after both fighters act, and starts on the two rounds after the trigger hit.
    for (const [source, sourceSide, target, targetSide] of [[a,'a',b,'b'],[b,'b',a,'a']] as const) {
      if (source.scorchRounds.includes(round) && target.hp > 0) { const amount = Math.min(3, target.hp); target.hp -= amount; event(round, sourceSide, 'burn', 'Scorch', 'hit', amount, 0, ['scorch'], 'aura.scorch', { damage: amount, target_hp: target.hp }); afterHpChange(target, targetSide, round); if (target.hp <= 0) { finished = true; ko = true; break; } }
    }
  }
  const winner: Side = a.hp === b.hp ? (a.stats.NERVE === b.stats.NERVE ? (rng.chance(0.5) ? 'a' : 'b') : a.stats.NERVE > b.stats.NERVE ? 'a' : 'b') : a.hp > b.hp ? 'a' : 'b';
  const winnerState = winner === 'a' ? a : b, loserState = winner === 'a' ? b : a;
  let trailed = false;
  for (let r = 1; r < rounds; r++) {
    const last = [...events].reverse().find(e => e.round === r);
    if (last) { const own = winner === 'a' ? last.hp_after.a : last.hp_after.b; const other = winner === 'a' ? last.hp_after.b : last.hp_after.a; if (own < other) trailed = true; }
  }
  const upset = winnerState.baseTotal < loserState.baseTotal && trailed && winnerState.hp > loserState.hp;
  return { events, summary: { seed: seedText, winner, ko, rounds, totals: { a: a.baseTotal, b: b.baseTotal }, final_hp: { a: a.hp, b: b.hp }, upset } };
}
