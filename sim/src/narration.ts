import type { FightEvent, FightSummary, VoiceClass } from './types.js';

export type NarrationKind = 'hit' | 'crit' | 'miss' | 'dodge' | 'proc' | 'ko' | 'win';
type Line = (event: FightEvent) => string;
type FourLines = readonly [Line, Line, Line, Line];
const voices: readonly VoiceClass[] = ['fierce', 'smug', 'hustler', 'hungry', 'gloom', 'neutral'];

const move = (e: FightEvent) => String(e.move);
const number = (e: FightEvent, key: string, fallback = 0) => {
  const value = e.vars[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};
const damage = (e: FightEvent) => number(e, 'damage', e.damage);
const hp = (e: FightEvent) => number(e, 'target_hp', e.hp_after[e.actor === 'a' ? 'b' : 'a']);
const ownHp = (e: FightEvent) => number(e, 'hp', e.hp_after[e.actor]);
const heal = (e: FightEvent) => number(e, 'heal', e.heal);

// Every voice owns complete sentences, not a shared line with a voice prefix.
const lines: Record<VoiceClass, Record<Exclude<NarrationKind, 'proc'>, FourLines>> = {
  fierce: {
    hit: [e => `${move(e)} lands. ${damage(e)} damage. ${hp(e)} HP left.`, e => `I smash through with ${move(e)} for ${damage(e)}. ${hp(e)} HP remain.`, e => `${move(e)} connects hard for ${damage(e)} damage. ${hp(e)} HP left.`, e => `Clean strike. ${move(e)} deals ${damage(e)} and leaves ${hp(e)} HP. `],
    crit: [e => `Critical hit. ${move(e)} deals ${damage(e)}. ${hp(e)} HP left.`, e => `${move(e)} breaks through for ${damage(e)} critical damage. ${hp(e)} HP remain.`, e => `That critical ${move(e)} hits for ${damage(e)}. ${hp(e)} HP left.`, e => `Devastating shot. ${move(e)} takes ${damage(e)} HP and leaves ${hp(e)}.`],
    miss: [e => `${move(e)} misses. Reset and strike.`, e => `No hit. ${move(e)} cuts air.`, e => `${move(e)} fails. I keep moving.`, e => `The strike misses. ${move(e)} gets no result.`],
    dodge: [e => `Dodged. ${move(e)} gets nothing.`, e => `I slip past ${move(e)}. Try harder.`, e => `${move(e)} misses me. Stay sharp.`, e => `Clean evade. ${move(e)} cannot touch me.`],
    ko: [e => `${move(e)} ends it. Opponent down.`, e => `Knockout. ${move(e)} finishes the fight.`, e => `${move(e)} drops the rival. Done.`, e => `Fight over. ${move(e)} puts them down.`],
    win: [() => `I won. Next challenger.`, () => `Victory secured. Keep them coming.`, () => `The fight is mine. Move on.`, () => `I stand last. That is the result.`],
  },
  smug: {
    hit: [e => `${move(e)} lands for ${damage(e)} damage; ${hp(e)} HP remain, exactly as planned.`, e => `A polished ${move(e)} deals ${damage(e)} damage and leaves ${hp(e)} HP.`, e => `${move(e)} finds its mark for ${damage(e)}; the target has ${hp(e)} HP to admire.`, e => `I make ${move(e)} look effortless: ${damage(e)} damage, ${hp(e)} HP left.`],
    crit: [e => `A perfect critical: ${move(e)} deals ${damage(e)} and leaves ${hp(e)} HP.`, e => `${move(e)} lands a critical for ${damage(e)} damage; ${hp(e)} HP remain. Quite tidy.`, e => `${move(e)} crits for ${damage(e)}. The target keeps ${hp(e)} HP.`, e => `A critical ${move(e)} removes ${damage(e)} HP and leaves ${hp(e)}. I do make this look easy.`],
    miss: [e => `${move(e)} misses. A rare lapse in the opposition's taste.`, e => `The target avoids ${move(e)}; how unexpectedly inconvenient.`, e => `${move(e)} finds nothing but air. The attempt was ambitious.`, e => `No contact from ${move(e)}. We shall call that a rehearsal.`],
    dodge: [e => `The target evades ${move(e)}. A temporary inconvenience.`, e => `${move(e)} is dodged. The rival has learned one trick.`, e => `A neat escape from ${move(e)}. It will not improve their odds.`, e => `The target slips away from ${move(e)}. I remain unimpressed.`],
    ko: [e => `${move(e)} closes the bout with a knockout. The expected finish.`, e => `The rival falls to ${move(e)}. A rather predictable ending.`, e => `${move(e)} delivers the knockout, preserving my excellent record.`, e => `A knockout from ${move(e)} settles the matter with suitable style.`],
    win: [() => `Another win. Excellence remains consistent.`, () => `The result confirms what I already knew.`, () => `Victory suits me rather well.`, () => `The bout is mine. Do try to be surprised.`],
  },
  hustler: {
    hit: [e => `The deal pays: ${move(e)} brings ${damage(e)} damage, with ${hp(e)} HP still on the table.`, e => `Odds were good on ${move(e)}; it deals ${damage(e)} and leaves ${hp(e)} HP.`, e => `${move(e)} cashes in for ${damage(e)} damage. The target has ${hp(e)} HP left to bargain with.`, e => `That ${move(e)} closes a small profit: ${damage(e)} damage and ${hp(e)} HP remaining.`],
    crit: [e => `Big payout: ${move(e)} scores ${damage(e)} critical damage and leaves ${hp(e)} HP.`, e => `The odds swing my way as ${move(e)} deals ${damage(e)}; ${hp(e)} HP remain.`, e => `${move(e)} hits the jackpot for ${damage(e)} critical damage, leaving ${hp(e)} HP.`, e => `A premium deal lands: ${move(e)} deals ${damage(e)} and leaves ${hp(e)} HP.`],
    miss: [e => `${move(e)} misses; that bet did not clear.`, e => `No payout from ${move(e)}. Recalculate the odds.`, e => `${move(e)} comes up empty. The market owes me a better angle.`, e => `That ${move(e)} fails to land. I will not double down on it.`],
    dodge: [e => `The rival dodges ${move(e)}. The contract slips away.`, e => `${move(e)} gets evaded; the odds just shifted.`, e => `A dodge beats ${move(e)}. No deal on that exchange.`, e => `The target ducks ${move(e)}. I mark the risk and move on.`],
    ko: [e => `${move(e)} settles the account with a knockout. Deal closed.`, e => `The knockout lands through ${move(e)}. The payout is final.`, e => `${move(e)} ends the bout; no appeals, no refunds.`, e => `The rival is out after ${move(e)}. That is a clean close.`],
    win: [() => `The odds paid out. I take the win.`, () => `Winning ticket confirmed. The deal is done.`, () => `I close the night in profit with a victory.`, () => `The result clears. Collect the win and move on.`],
  },
  hungry: {
    hit: [e => `${move(e)} serves up ${damage(e)} damage; the target has ${hp(e)} HP left on the plate.`, e => `A tasty ${move(e)} bites for ${damage(e)} damage and leaves ${hp(e)} HP.`, e => `${move(e)} takes a big bite: ${damage(e)} damage, ${hp(e)} HP remaining.`, e => `That ${move(e)} is a full course hit for ${damage(e)}. ${hp(e)} HP are left to chew through.`],
    crit: [e => `Critical feast! ${move(e)} devours ${damage(e)} HP and leaves ${hp(e)}.`, e => `${move(e)} gets extra crispy for ${damage(e)} critical damage; ${hp(e)} HP remain.`, e => `A juicy critical from ${move(e)} deals ${damage(e)} and leaves ${hp(e)} HP.`, e => `${move(e)} serves a giant bite of ${damage(e)} damage. The target has ${hp(e)} HP left.`],
    miss: [e => `${move(e)} misses. Nothing to snack on there.`, e => `That ${move(e)} bites into empty air. I am still hungry.`, e => `${move(e)} comes up empty like a bare lunchbox.`, e => `No damage served by ${move(e)}. Send out the next snack.`],
    dodge: [e => `The target dodges ${move(e)}. My meal keeps running.`, e => `${move(e)} misses the plate because the rival slips away.`, e => `A dodge escapes ${move(e)}. That snack is not ready.`, e => `The rival avoids ${move(e)}. I will find something tastier.`],
    ko: [e => `${move(e)} serves the final bite. Knockout, dinner is ready.`, e => `The rival folds after ${move(e)}. That is a full meal.`, e => `${move(e)} finishes the feast with a knockout.`, e => `Last bite landed: ${move(e)} ends the fight.`],
    win: [() => `Victory tastes better than dessert.`, () => `I win, and now I want a victory snack.`, () => `The bout is finished. Bring me the buffet.`, () => `A win is served. I could eat another fight.`],
  },
  gloom: {
    hit: [e => `${move(e)} deals ${damage(e)} damage. The target has ${hp(e)} HP left, which is unfortunate for them.`, e => `The bleak little ${move(e)} removes ${damage(e)} HP and leaves ${hp(e)}. Nothing improves.`, e => `${move(e)} lands for ${damage(e)} damage; ${hp(e)} HP remain. The end approaches at its usual pace.`, e => `A dull impact from ${move(e)} deals ${damage(e)} and leaves ${hp(e)} HP. How exhausting.`],
    crit: [e => `${move(e)} critically deals ${damage(e)} damage. ${hp(e)} HP remain, briefly.`, e => `Even the bad luck has a critical edge: ${move(e)} deals ${damage(e)}, leaving ${hp(e)} HP.`, e => `${move(e)} lands a critical for ${damage(e)}. The target has ${hp(e)} HP left to regret.`, e => `A critical ${move(e)} takes ${damage(e)} HP. ${hp(e)} remain. Cheerful news, if you dislike them.`],
    miss: [e => `${move(e)} misses. At least the disappointment is familiar.`, e => `The attack ${move(e)} fails. Hope was misplaced again.`, e => `${move(e)} strikes nothing. The universe maintains its standards.`, e => `No hit from ${move(e)}. The silence is almost comforting.`],
    dodge: [e => `The target dodges ${move(e)}. Another delay before the inevitable.`, e => `${move(e)} is avoided. Apparently even failure can fail.`, e => `A dodge escapes ${move(e)}. The evening grows longer.`, e => `The rival slips past ${move(e)}. I had expected very little.`],
    ko: [e => `${move(e)} ends the fight in a knockout. One less problem, briefly.`, e => `The rival falls to ${move(e)}. The silence will not last.`, e => `${move(e)} delivers the knockout. At least this part is over.`, e => `A knockout from ${move(e)} closes the bout. The next problem is waiting.`],
    win: [() => `I won. The disappointment has changed owners.`, () => `Victory arrives, looking almost as tired as I feel.`, () => `The bout is mine. This will not fix the weather.`, () => `A win, somehow. I shall try not to celebrate.`],
  },
  neutral: {
    hit: [e => `${move(e)} hits for ${damage(e)} damage, leaving ${hp(e)} HP.`, e => `${move(e)} connects. Damage is ${damage(e)} and remaining HP is ${hp(e)}.`, e => `The attack ${move(e)} deals ${damage(e)} damage; ${hp(e)} HP remain.`, e => `${move(e)} lands successfully for ${damage(e)}. The target has ${hp(e)} HP.`],
    crit: [e => `${move(e)} is a critical hit for ${damage(e)} damage; ${hp(e)} HP remain.`, e => `Critical outcome: ${move(e)} deals ${damage(e)} and leaves ${hp(e)} HP.`, e => `${move(e)} scores a critical strike, dealing ${damage(e)} damage. Remaining HP: ${hp(e)}.`, e => `The critical ${move(e)} deals ${damage(e)} damage, with ${hp(e)} HP left.`],
    miss: [e => `${move(e)} misses the target.`, e => `The attack ${move(e)} does not connect.`, e => `${move(e)} fails to land a hit.`, e => `No damage is dealt because ${move(e)} misses.`],
    dodge: [e => `The target dodges ${move(e)}.`, e => `${move(e)} is avoided by the target.`, e => `The incoming ${move(e)} is evaded.`, e => `A successful dodge prevents ${move(e)} from connecting.`],
    ko: [e => `${move(e)} causes a knockout and ends the fight.`, e => `The bout ends when ${move(e)} knocks out the rival.`, e => `${move(e)} delivers the final hit. The fight is over.`, e => `Knockout recorded after ${move(e)}. No further actions follow.`],
    win: [() => `The fight is complete, and this fighter wins.`, () => `The final result is a victory for this fighter.`, () => `This fighter finishes the bout as the winner.`, () => `The result is recorded as a win.`],
  },
};

const procText: Record<string, Record<VoiceClass, (e: FightEvent) => string>> = {
  'scorch-armed': { fierce:e=>`The burning mark is set by that ${damage(e)} damage strike; the target has ${hp(e)} HP.`, smug:e=>`The burn is now scheduled after a ${damage(e)} damage hit, with ${hp(e)} HP left to watch.`, hustler:e=>`The burn is booked after ${damage(e)} damage; ${hp(e)} HP remain on the account.`, hungry:e=>`The target is seasoned after ${damage(e)} damage and has ${hp(e)} HP left on the plate.`, gloom:e=>`The burn is queued after ${damage(e)} damage. ${hp(e)} HP remain for the unpleasant part.`, neutral:e=>`A burn is armed after ${damage(e)} damage; the target has ${hp(e)} HP.` },
  scorch: { fierce:e=>`The burn takes ${damage(e)} HP. ${hp(e)} HP remain.`, smug:e=>`The burn neatly removes ${damage(e)} HP and leaves ${hp(e)}.`, hustler:e=>`The burn collects ${damage(e)} HP; the target account stands at ${hp(e)} HP.`, hungry:e=>`The burn crisps ${damage(e)} HP away, leaving ${hp(e)} HP to chew through.`, gloom:e=>`The burn removes ${damage(e)} HP. ${hp(e)} remain. A grim little receipt.`, neutral:e=>`Burn damage is ${damage(e)} and target HP is now ${hp(e)}.` },
  'cool-counter': { fierce:e=>`The counter is ready; this strike deals ${damage(e)} and leaves ${hp(e)} HP.`, smug:e=>`The counter improves this exchange to ${damage(e)} damage, leaving ${hp(e)} HP.`, hustler:e=>`The counter raises the return to ${damage(e)} damage; ${hp(e)} HP remain.`, hungry:e=>`The counter adds flavor to a ${damage(e)} damage hit, leaving ${hp(e)} HP.`, gloom:e=>`The counter helps this hit deal ${damage(e)} damage. ${hp(e)} HP remain, sadly.`, neutral:e=>`The counter is applied to a ${damage(e)} damage hit; ${hp(e)} HP remain.` },
  'laser-auto-hit': { fierce:e=>`Laser Stare cannot miss this opening. It deals ${damage(e)} damage and leaves ${hp(e)} HP.`, smug:e=>`Laser Stare is guaranteed to connect for ${damage(e)} damage; ${hp(e)} HP remain.`, hustler:e=>`Laser Stare is a locked deal for ${damage(e)} damage, leaving ${hp(e)} HP.`, hungry:e=>`Laser Stare lands a guaranteed bite for ${damage(e)} damage; ${hp(e)} HP remain.`, gloom:e=>`Laser Stare connects as promised, dealing ${damage(e)} damage. ${hp(e)} HP remain. How predictable.`, neutral:e=>`Laser Stare hits automatically for ${damage(e)} damage; the target has ${hp(e)} HP.` },
  'calm-glow': { fierce:e=>`The glow restores ${heal(e)} HP. The fighter now has ${ownHp(e)} HP.`, smug:e=>`The glow restores a tidy ${heal(e)} HP, bringing the fighter to ${ownHp(e)} HP.`, hustler:e=>`The healing deal returns ${heal(e)} HP; the fighter balance is now ${ownHp(e)} HP.`, hungry:e=>`The glow serves back ${heal(e)} HP, bringing the fighter to ${ownHp(e)} HP.`, gloom:e=>`The glow restores ${heal(e)} HP. The fighter has ${ownHp(e)} HP now. Temporary relief.`, neutral:e=>`Healing restores ${heal(e)} HP. The fighter's new HP is ${ownHp(e)}.` },
  'underdog-pride': { fierce:e=>`Behind on HP, the fighter hits for ${damage(e)} and leaves ${hp(e)} HP.`, smug:e=>`The underdog answers with ${damage(e)} damage, leaving the target at ${hp(e)} HP.`, hustler:e=>`The underdog finds value in the exchange: ${damage(e)} damage, ${hp(e)} HP left.`, hungry:e=>`The underdog bites back for ${damage(e)} damage and leaves ${hp(e)} HP.`, gloom:e=>`The weaker position produces ${damage(e)} damage. The target has ${hp(e)} HP left. Of course.`, neutral:e=>`The underdog effect accompanies ${damage(e)} damage; target HP is ${hp(e)}.` },
  feisty: { fierce:e=>`The fighter presses the attack and deals ${damage(e)} damage. ${hp(e)} HP remain.`, smug:e=>`An aggressive opening improves this ${damage(e)} damage strike; ${hp(e)} HP remain.`, hustler:e=>`The aggressive opening pays ${damage(e)} damage, leaving ${hp(e)} HP in play.`, hungry:e=>`The early aggression takes a bite for ${damage(e)} damage; ${hp(e)} HP remain.`, gloom:e=>`The early aggression deals ${damage(e)} damage. ${hp(e)} HP remain, and the noise continues.`, neutral:e=>`The aggressive opening deals ${damage(e)} damage; the target has ${hp(e)} HP.` },
  'feisty-fatigue': { fierce:e=>`Fatigue dulls the strike to ${damage(e)} damage. ${hp(e)} HP remain.`, smug:e=>`The late aggression is less efficient: ${damage(e)} damage, with ${hp(e)} HP left.`, hustler:e=>`The late push returns ${damage(e)} damage; ${hp(e)} HP remain on the board.`, hungry:e=>`The tired bite deals ${damage(e)} damage, leaving ${hp(e)} HP for later.`, gloom:e=>`Fatigue limits this hit to ${damage(e)} damage. ${hp(e)} HP remain. The decline was scheduled.`, neutral:e=>`Late fatigue accompanies ${damage(e)} damage; the target has ${hp(e)} HP.` },
  pump: { fierce:e=>`The pump boosts the next push after ${damage(e)} damage, leaving ${hp(e)} HP.`, smug:e=>`The pump is primed after a ${damage(e)} damage hit; ${hp(e)} HP remain.`, hustler:e=>`The pump reinvests after ${damage(e)} damage; the target has ${hp(e)} HP.`, hungry:e=>`The pump adds extra fuel after ${damage(e)} damage; ${hp(e)} HP remain on the plate.`, gloom:e=>`The pump is active after ${damage(e)} damage. ${hp(e)} HP remain. More effort ahead.`, neutral:e=>`The pump effect activates after ${damage(e)} damage; target HP is ${hp(e)}.` },
  'iron-hide': { fierce:e=>`Iron Hide blunts the incoming blow. This strike deals ${damage(e)} damage and leaves ${hp(e)} HP.`, smug:e=>`Iron Hide reduces the impact to ${damage(e)} damage; ${hp(e)} HP remain.`, hustler:e=>`Iron Hide limits the loss to ${damage(e)} damage; ${hp(e)} HP remain in the account.`, hungry:e=>`Iron Hide toughens the shell; the hit deals ${damage(e)} damage and leaves ${hp(e)} HP.`, gloom:e=>`Iron Hide reduces the blow to ${damage(e)} damage. ${hp(e)} HP remain. The armor has one use.`, neutral:e=>`Iron Hide reduces the incoming damage to ${damage(e)}; target HP is ${hp(e)}.` },
  'iron-hide-guard': { fierce:e=>`Iron Hide braces for the next blow. This strike deals ${damage(e)} damage and leaves ${hp(e)} HP.`, smug:e=>`Iron Hide sets the guard before the next exchange; ${damage(e)} damage leaves ${hp(e)} HP.`, hustler:e=>`The guard is set for the next exchange; this deal lands ${damage(e)} damage and leaves ${hp(e)} HP.`, hungry:e=>`Iron Hide puts a tougher crust on the fighter; ${damage(e)} damage lands and ${hp(e)} HP remain.`, gloom:e=>`Iron Hide prepares a guard. This hit deals ${damage(e)} damage; ${hp(e)} HP remain.`, neutral:e=>`Iron Hide activates a guard for a later hit; this event deals ${damage(e)} damage and leaves ${hp(e)} HP.` },
  'lucky-flip': { fierce:e=>`Luck gives the missed strike another chance; it deals ${damage(e)} damage and leaves ${hp(e)} HP.`, smug:e=>`The lucky retry turns the exchange into ${damage(e)} damage, leaving ${hp(e)} HP.`, hustler:e=>`The reroll saves the bet: ${damage(e)} damage, ${hp(e)} HP remain.`, hungry:e=>`The lucky second bite deals ${damage(e)} damage and leaves ${hp(e)} HP.`, gloom:e=>`Luck rescues the attack for ${damage(e)} damage. ${hp(e)} HP remain. Do not expect a repeat.`, neutral:e=>`The lucky retry succeeds for ${damage(e)} damage; target HP is ${hp(e)}.` },
  sidekick: { fierce:e=>`The sidekick clips the rival for ${damage(e)} damage. ${hp(e)} HP remain.`, smug:e=>`The sidekick adds a neat ${damage(e)} damage, leaving ${hp(e)} HP.`, hustler:e=>`The sidekick brings in ${damage(e)} extra damage; ${hp(e)} HP remain.`, hungry:e=>`The sidekick sneaks in a snack sized ${damage(e)} damage; ${hp(e)} HP remain.`, gloom:e=>`The sidekick contributes ${damage(e)} damage. ${hp(e)} HP remain. Even the small help is bleak.`, neutral:e=>`The sidekick deals ${damage(e)} damage; target HP is ${hp(e)}.` },
  vanish: { fierce:e=>`Vanish dodges the attack. No damage lands.`, smug:e=>`Vanish slips away from the incoming strike without taking damage.`, hustler:e=>`Vanish voids the hit; the damage deal is cancelled.`, hungry:e=>`Vanish escapes the bite. Nothing gets eaten this time.`, gloom:e=>`Vanish avoids the attack. The fight is delayed, not improved.`, neutral:e=>`Vanish causes the incoming attack to be dodged.` },
  gust: { fierce:e=>`The gust takes the first move; ${move(e)} is the chosen action.`, smug:e=>`The gust secures the opening turn, with ${move(e)} up first.`, hustler:e=>`The gust wins the opening position; ${move(e)} starts the exchange.`, hungry:e=>`The gust gets the first bite started with ${move(e)}.`, gloom:e=>`The gust grants the opening turn. ${move(e)} goes first. The wind has opinions.`, neutral:e=>`The gust gives this fighter the first action, using ${move(e)}.` },
  'stare-down': { fierce:e=>`Stare Down pressures the opening. The attack deals ${damage(e)} damage and leaves ${hp(e)} HP.`, smug:e=>`Stare Down unsettles the first attack; this exchange deals ${damage(e)} damage, leaving ${hp(e)} HP.`, hustler:e=>`Stare Down shifts the opening odds; the exchange deals ${damage(e)} damage and leaves ${hp(e)} HP.`, hungry:e=>`Stare Down puts the rival off their bite; ${damage(e)} damage lands and ${hp(e)} HP remain.`, gloom:e=>`Stare Down makes the opening harder. This hit deals ${damage(e)} damage; ${hp(e)} HP remain.`, neutral:e=>`Stare Down reduces opening accuracy; this event deals ${damage(e)} damage and leaves ${hp(e)} HP.` },
  'scan-reveal': { fierce:e=>`Scan exposes the rival plan: ${String(e.vars.rival_plan ?? 'unknown')}.`, smug:e=>`The rival's plan is no secret now: ${String(e.vars.rival_plan ?? 'unknown')}.`, hustler:e=>`The intel is in. The rival plans ${String(e.vars.rival_plan ?? 'unknown')}.`, hungry:e=>`Scan reads the menu: the rival plans ${String(e.vars.rival_plan ?? 'unknown')}.`, gloom:e=>`Scan reveals ${String(e.vars.rival_plan ?? 'unknown')}. At least one thing is clear.`, neutral:e=>`Scan reveals the rival plan: ${String(e.vars.rival_plan ?? 'unknown')}.` },
  'scan-counter': { fierce:e=>`Scan turns the counter into a stronger response for ${damage(e)} damage; ${hp(e)} HP remain.`, smug:e=>`The scanned counter deals ${damage(e)} damage and leaves ${hp(e)} HP. Useful information, used well.`, hustler:e=>`The intel improves the counter to ${damage(e)} damage; ${hp(e)} HP remain on the board.`, hungry:e=>`The scanned counter lands a bigger bite for ${damage(e)} damage; ${hp(e)} HP remain.`, gloom:e=>`Scan strengthens the counter to ${damage(e)} damage. ${hp(e)} HP remain. Knowledge is not comfort.`, neutral:e=>`The scan counter modifies this hit to ${damage(e)} damage; target HP is ${hp(e)}.` },
  charm: { fierce:e=>`Charm weakens the rival's nerve. This hit deals ${damage(e)} damage and leaves ${hp(e)} HP.`, smug:e=>`Charm gets inside the rival's head; the exchange deals ${damage(e)} damage and leaves ${hp(e)} HP.`, hustler:e=>`Charm shifts the rival's nerve and the odds; this hit deals ${damage(e)} damage, leaving ${hp(e)} HP.`, hungry:e=>`Charm distracts the rival from the meal; ${damage(e)} damage lands and ${hp(e)} HP remain.`, gloom:e=>`Charm lowers the rival's nerve. This hit deals ${damage(e)} damage; ${hp(e)} HP remain.`, neutral:e=>`Charm lowers the rival's NERVE for early rounds; this hit deals ${damage(e)} damage and leaves ${hp(e)} HP.` },
  'chaos-gaze-boost': { fierce:e=>`Chaos Gaze wins its coin toss and hits for ${damage(e)} damage. ${hp(e)} HP remain.`, smug:e=>`Chaos Gaze lands the favorable toss for ${damage(e)} damage; ${hp(e)} HP remain.`, hustler:e=>`The Chaos Gaze coin toss pays out: ${damage(e)} damage, ${hp(e)} HP left.`, hungry:e=>`Chaos Gaze gets the tasty side of the toss for ${damage(e)} damage; ${hp(e)} HP remain.`, gloom:e=>`Chaos Gaze wins the toss for ${damage(e)} damage. ${hp(e)} HP remain. Randomness has chosen violence.`, neutral:e=>`Chaos Gaze wins its coin toss and deals ${damage(e)} damage; target HP is ${hp(e)}.` },
  'chaos-gaze-miss': { fierce:e=>`Chaos Gaze loses its coin toss. The attack misses.`, smug:e=>`Chaos Gaze loses the toss. Even chance has poor manners.`, hustler:e=>`The Chaos Gaze toss loses; the bet returns no damage.`, hungry:e=>`Chaos Gaze gets the empty side of the toss. No snack today.`, gloom:e=>`Chaos Gaze loses the toss and misses. The odds remain cruel.`, neutral:e=>`Chaos Gaze loses its coin toss and misses.` },
  'laser-ignores-vanish': { fierce:e=>`Laser Stare pierces the dodge and deals ${damage(e)} damage, leaving ${hp(e)} HP.`, smug:e=>`Laser Stare ignores the escape and lands ${damage(e)} damage; ${hp(e)} HP remain.`, hustler:e=>`Laser Stare bypasses the dodge and collects ${damage(e)} damage; ${hp(e)} HP remain.`, hungry:e=>`Laser Stare catches the vanishing rival for ${damage(e)} damage; ${hp(e)} HP remain.`, gloom:e=>`Laser Stare ignores the dodge for ${damage(e)} damage. ${hp(e)} HP remain. Escape was temporary.`, neutral:e=>`Laser Stare ignores the dodge and deals ${damage(e)} damage; target HP is ${hp(e)}.` },
  crit: { fierce:e=>`Critical damage: ${damage(e)}. ${hp(e)} HP left.`, smug:e=>`The critical result delivers ${damage(e)} damage and leaves ${hp(e)} HP.`, hustler:e=>`The critical adds value: ${damage(e)} damage, ${hp(e)} HP remaining.`, hungry:e=>`A critical bite deals ${damage(e)} damage; ${hp(e)} HP remain.`, gloom:e=>`The critical deals ${damage(e)} damage. ${hp(e)} HP remain. A grim statistic.`, neutral:e=>`The critical hit deals ${damage(e)} damage and leaves ${hp(e)} HP.` },
};

const procCategory: Record<VoiceClass, FourLines> = {
  fierce: [e=>`${move(e)} shifts the fight.`,e=>`${move(e)} changes the exchange.`,e=>`${move(e)} alters the next move.`,e=>`${move(e)} changes the pressure.`],
  smug: [e=>`${move(e)} gives me another advantage.`,e=>`${move(e)} makes the exchange more favorable.`,e=>`${move(e)} adds a useful edge.`,e=>`${move(e)} puts the bout in a better position.`],
  hustler: [e=>`${move(e)} changes the terms of the deal.`,e=>`${move(e)} moves the odds.`,e=>`${move(e)} changes the value of this exchange.`,e=>`${move(e)} shifts the risk on the table.`],
  hungry: [e=>`${move(e)} changes the flavor of the fight.`,e=>`${move(e)} adds a new bite to the exchange.`,e=>`${move(e)} changes what is on the menu.`,e=>`${move(e)} spices up the next moment.`],
  gloom: [e=>`${move(e)} makes the exchange worse in a new way.`,e=>`${move(e)} adds another small problem.`,e=>`${move(e)} shifts the bleak balance.`,e=>`${move(e)} gives the bout a darker turn.`],
  neutral: [e=>`${move(e)} changes the state of the exchange.`,e=>`${move(e)} affects the next part of the bout.`,e=>`${move(e)} changes how this exchange proceeds.`,e=>`${move(e)} modifies the current situation.`],
};

function seedOffset(seed: string | number | bigint): number {
  const text = String(seed); let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
  return hash >>> 0;
}
function pickIndex(eventIndex: number, seed: string | number | bigint): number {
  return ((Math.max(1, Math.trunc(eventIndex)) - 1 + seedOffset(seed)) % 4 + 4) % 4;
}
function baseKind(event: FightEvent): NarrationKind {
  const target = event.actor === 'a' ? 'b' : 'a';
  if (event.damage > 0 && event.hp_after[target] === 0) return 'ko';
  if (event.outcome === 'dodge') return 'dodge';
  if (event.outcome === 'miss') return 'miss';
  if (event.outcome === 'crit') return 'crit';
  if (event.action === 'heal' || event.action === 'burn' || event.narration_key === 'signature.scan') return 'proc';
  return 'hit';
}

export const ENGINE_PROC_IDS = [
  'underdog-pride', 'stare-down', 'feisty', 'feisty-fatigue', 'cool-counter', 'scan-counter',
  'iron-hide-guard', 'laser-auto-hit', 'laser-ignores-vanish', 'vanish', 'lucky-flip',
  'chaos-gaze-boost', 'chaos-gaze-miss', 'iron-hide', 'crit', 'pump', 'scorch-armed',
  'calm-glow', 'scan-reveal', 'sidekick', 'scorch',
] as const;

const procAliases: Record<string, string> = {
  'calm-glow':'calm-glow', 'scorch':'scorch', 'scorch-armed':'scorch-armed', 'cool-counter':'cool-counter',
  'laser-auto-hit':'laser-auto-hit', 'underdog-pride':'underdog-pride', 'feisty':'feisty', 'feisty-fatigue':'feisty-fatigue',
  'pump':'pump', 'iron-hide':'iron-hide', 'iron-hide-guard':'iron-hide-guard', 'lucky-flip':'lucky-flip', 'sidekick':'sidekick',
  'vanish':'vanish', 'gust':'gust', 'stare-down':'stare-down', 'scan':'scan-reveal', 'scan-reveal':'scan-reveal', 'scan-counter':'scan-counter',
  'charm':'charm', 'chaos-gaze':'chaos-gaze-boost', 'chaos-gaze-boost':'chaos-gaze-boost', 'chaos-gaze-miss':'chaos-gaze-miss',
  'crit':'crit', 'laser-ignores-vanish':'laser-ignores-vanish',
};
function sentenceForProc(id: string, event: FightEvent, voice: VoiceClass): string {
  const key = id === 'chaos-gaze' ? (event.outcome === 'miss' ? 'chaos-gaze-miss' : 'chaos-gaze-boost') : procAliases[id] ?? id;
  const hasDamage = typeof event.vars.damage === 'number';
  const hasTargetHp = typeof event.vars.target_hp === 'number';
  const hasHeal = typeof event.vars.heal === 'number';
  if (!hasDamage && !hasTargetHp && !hasHeal) {
    const plain: Record<string, Record<VoiceClass, string>> = {
      'scorch-armed': {fierce:'The burn is armed for a later round.',smug:'The burn is scheduled for a later exchange.',hustler:'The burn is booked for a later round.',hungry:'The target is seasoned for a later bite.',gloom:'The burn is queued. The evening gets worse.',neutral:'A burn is armed for later rounds.'},
      'scorch': {fierce:'The burn damages the target.',smug:'The burn takes its scheduled effect.',hustler:'The burn collects its due.',hungry:'The burn takes another bite.',gloom:'The burn lands. A small, predictable misery.',neutral:'Burn damage is applied.'},
      'laser-auto-hit': {fierce:'Laser Stare connects automatically.',smug:'Laser Stare is guaranteed to connect.',hustler:'Laser Stare is a locked deal.',hungry:'Laser Stare lands a guaranteed bite.',gloom:'Laser Stare connects as promised. How predictable.',neutral:'Laser Stare hits automatically.'},
      'calm-glow': {fierce:'The glow restores health.',smug:'The glow restores health with tidy timing.',hustler:'The healing deal returns health.',hungry:'The glow serves up a little recovery.',gloom:'The glow restores health. Temporary relief.',neutral:'The glow restores health.'},
      'pump': {fierce:'The pump powers up the next push.',smug:'The pump is primed for a later strike.',hustler:'The pump reinvests in the next exchange.',hungry:'The pump adds fuel for another bite.',gloom:'The pump is active. More effort ahead.',neutral:'The pump effect activates.'},
      'iron-hide': {fierce:'Iron Hide blunts the incoming blow.',smug:'Iron Hide reduces the impact.',hustler:'Iron Hide limits the loss.',hungry:'Iron Hide toughens the shell.',gloom:'Iron Hide reduces the blow. The armor has one use.',neutral:'Iron Hide reduces incoming damage.'},
      'sidekick': {fierce:'The sidekick clips the rival.',smug:'The sidekick adds a tidy extra hit.',hustler:'The sidekick brings in extra damage.',hungry:'The sidekick sneaks in a snack sized hit.',gloom:'The sidekick contributes a little damage. How bleak.',neutral:'The sidekick deals extra damage.'},
      'chaos-gaze-boost': {fierce:'Chaos Gaze wins its coin toss and hits.',smug:'Chaos Gaze lands the favorable toss.',hustler:'The Chaos Gaze coin toss pays out.',hungry:'Chaos Gaze gets the tasty side of the toss.',gloom:'Chaos Gaze wins the toss. Randomness has chosen violence.',neutral:'Chaos Gaze wins its coin toss and hits.'},
      'crit': {fierce:'The strike is critical.',smug:'The critical result is neatly secured.',hustler:'The critical adds value to the exchange.',hungry:'A critical bite lands.',gloom:'The critical lands. Another grim statistic.',neutral:'The hit is critical.'},
      'gust': {fierce:'The gust takes the opening turn.',smug:'The gust secures the opening turn.',hustler:'The gust wins the opening position.',hungry:'The gust starts the first bite.',gloom:'The gust grants the opening turn. The wind has opinions.',neutral:'The gust gives this fighter the first action.'},
      'charm': {fierce:'Charm weakens the rival’s nerve.',smug:'Charm gets inside the rival’s head.',hustler:'Charm shifts the rival’s nerve and the odds.',hungry:'Charm distracts the rival from the meal.',gloom:'Charm lowers the rival’s nerve. The outlook remains poor.',neutral:'Charm lowers the rival’s NERVE for early rounds.'},
      'scan-counter': {fierce:'Scan prepares a counter response.',smug:'Scan prepares a more informed counter.',hustler:'The scan keeps a counter opportunity open.',hungry:'Scan lines up a counter bite.',gloom:'Scan prepares a counter. The outlook remains grim.',neutral:'Scan prepares a counter response.'},
      'cool-counter': {fierce:'The counter is ready for the next strike.',smug:'The counter is ready, which should improve matters.',hustler:'The counter is set and the odds have shifted.',hungry:'The counter is ready for another bite.',gloom:'The counter is ready. Something else to worry about.',neutral:'The counter is ready for a later exchange.'},
      'iron-hide-guard': {fierce:'Iron Hide braces for the next blow.',smug:'Iron Hide sets a guard for the next exchange.',hustler:'Iron Hide puts protection on the books.',hungry:'Iron Hide puts a tougher crust around the fighter.',gloom:'Iron Hide prepares a guard. It will probably be needed.',neutral:'Iron Hide activates a guard for a later hit.'},
      'feisty': {fierce:'The fighter presses forward aggressively.',smug:'The fighter opens with extra aggression.',hustler:'The fighter takes an aggressive opening position.',hungry:'The fighter starts hungry and aggressive.',gloom:'The fighter starts aggressively. This may end badly.',neutral:'The fighter uses an aggressive opening.'},
      'feisty-fatigue': {fierce:'Fatigue weighs on the late attack.',smug:'Late aggression is starting to lose its shine.',hustler:'The late push carries a higher cost.',hungry:'The late bite comes with tired jaws.',gloom:'Fatigue arrives, right on schedule.',neutral:'Late fatigue affects the fighter.'},
      'underdog-pride': {fierce:'The fighter answers from behind.',smug:'The fighter responds while trailing.',hustler:'The fighter looks for value while behind.',hungry:'The fighter bites back from behind.',gloom:'The fighter answers from behind. There is more to do.',neutral:'The fighter responds while behind on HP.'},
      'stare-down': {fierce:'Stare Down pressures the opening attack.',smug:'Stare Down makes the opening less comfortable.',hustler:'Stare Down shifts the opening odds.',hungry:'Stare Down puts the rival off their bite.',gloom:'Stare Down makes the opening harder.',neutral:'Stare Down reduces opening accuracy.'},
      'lucky-flip': {fierce:'Luck gives the attack another chance.',smug:'Luck grants the attack a second opportunity.',hustler:'The lucky retry keeps the bet alive.',hungry:'Luck offers the attack another bite.',gloom:'Luck intervenes. Do not get used to it.',neutral:'The attack receives a lucky retry.'},
      'vanish': {fierce:'Vanish dodges the incoming attack.',smug:'Vanish slips away from the incoming strike.',hustler:'Vanish cancels the incoming hit.',hungry:'Vanish escapes the bite.',gloom:'Vanish avoids the attack. The fight is delayed.',neutral:'Vanish causes the incoming attack to be dodged.'},
      'scan-reveal': {fierce:`Scan exposes the rival plan: ${String(event.vars.rival_plan ?? 'unknown')}.`,smug:`The rival's plan is no secret: ${String(event.vars.rival_plan ?? 'unknown')}.`,hustler:`The intel is in. The rival plans ${String(event.vars.rival_plan ?? 'unknown')}.`,hungry:`Scan reads the menu: ${String(event.vars.rival_plan ?? 'unknown')}.`,gloom:`Scan reveals ${String(event.vars.rival_plan ?? 'unknown')}. At least one thing is clear.`,neutral:`Scan reveals the rival plan: ${String(event.vars.rival_plan ?? 'unknown')}.`},
      'laser-ignores-vanish': {fierce:'Laser Stare pierces the dodge.',smug:'Laser Stare ignores the escape.',hustler:'Laser Stare bypasses the dodge.',hungry:'Laser Stare catches the vanishing rival.',gloom:'Laser Stare ignores the dodge. Escape was temporary.',neutral:'Laser Stare ignores the dodge.'},
      'chaos-gaze-miss': {fierce:'Chaos Gaze loses its coin toss. The attack misses.',smug:'Chaos Gaze loses the toss. Even chance has poor manners.',hustler:'The Chaos Gaze toss loses; the bet returns no damage.',hungry:'Chaos Gaze gets the empty side of the toss.',gloom:'Chaos Gaze loses the toss and misses.',neutral:'Chaos Gaze loses its coin toss and misses.'},
    };
    if (plain[key]) return plain[key][voice];
  }
  const set = procText[key];
  if (set) return set[voice](event);
  // Unknown future proc IDs are not printed as slugs. Use the event's move and values instead.
  return `${move(event)} changes the exchange, dealing ${damage(event)} damage and leaving ${hp(event)} HP.`;
}

export function classifyNarration(event: FightEvent): NarrationKind { return baseKind(event); }
export function renderNarrationKind(event: FightEvent, voiceClass: VoiceClass, kind: NarrationKind, seed: string | number | bigint = ''): string {
  if (kind === 'proc') return procCategory[voiceClass][pickIndex(event.n, seed)](event);
  return lines[voiceClass][kind][pickIndex(event.n, seed)](event);
}
export function renderNarration(event: FightEvent, voiceClass: VoiceClass, seed: string | number | bigint = ''): string {
  const index = pickIndex(event.n, seed);
  const kind = baseKind(event);
  let main: string;
  if (kind === 'proc') {
    if (event.narration_key === 'signature.scan') {
      const scanLines: Record<VoiceClass, FourLines> = {
        fierce:[e=>`Scan exposes the rival plan: ${String(e.vars.rival_plan ?? 'unknown')}.`,e=>`The rival plan is in view: ${String(e.vars.rival_plan ?? 'unknown')}.`,e=>`Scan reads the rival's next move: ${String(e.vars.rival_plan ?? 'unknown')}.`,e=>`The plan is exposed. The rival chose ${String(e.vars.rival_plan ?? 'unknown')}.`],
        smug:[e=>`Scan reveals the rival plan: ${String(e.vars.rival_plan ?? 'unknown')}. I do appreciate clarity.`,e=>`The rival's plan is exposed as ${String(e.vars.rival_plan ?? 'unknown')}. Predictable.`,e=>`The readout says ${String(e.vars.rival_plan ?? 'unknown')}. I expected no less.`,e=>`Scan confirms the rival intends ${String(e.vars.rival_plan ?? 'unknown')}. How considerate.`],
        hustler:[e=>`The intel says the rival plans ${String(e.vars.rival_plan ?? 'unknown')}. Adjust the odds.`,e=>`Scan brings in the plan ${String(e.vars.rival_plan ?? 'unknown')}. That changes the deal.`,e=>`The rival's plan is ${String(e.vars.rival_plan ?? 'unknown')}. I can price that risk.`,e=>`Readout secured: ${String(e.vars.rival_plan ?? 'unknown')}. Time to work the angle.`],
        hungry:[e=>`Scan reads the menu: the rival plans ${String(e.vars.rival_plan ?? 'unknown')}.`,e=>`The rival plans ${String(e.vars.rival_plan ?? 'unknown')}. Now I know what to bite first.`,e=>`The plan is ${String(e.vars.rival_plan ?? 'unknown')}. A useful recipe for this fight.`,e=>`Scan serves up ${String(e.vars.rival_plan ?? 'unknown')}. I can chew on that.`],
        gloom:[e=>`Scan reveals ${String(e.vars.rival_plan ?? 'unknown')}. At least one thing is clear.`,e=>`The rival plans ${String(e.vars.rival_plan ?? 'unknown')}. The outlook remains poor.`,e=>`Readout: ${String(e.vars.rival_plan ?? 'unknown')}. Knowledge has arrived too late, as usual.`,e=>`Scan exposes ${String(e.vars.rival_plan ?? 'unknown')}. There is now a specific thing to dread.`],
        neutral:[e=>`Scan reveals the rival plan: ${String(e.vars.rival_plan ?? 'unknown')}.`,e=>`The scan reports the rival plan as ${String(e.vars.rival_plan ?? 'unknown')}.`,e=>`The rival's selected plan is ${String(e.vars.rival_plan ?? 'unknown')}, according to the scan.`,e=>`Scan completes with the rival plan ${String(e.vars.rival_plan ?? 'unknown')}.`],
      };
      main = scanLines[voiceClass][index](event);
    } else if (event.action === 'heal') main = procText['calm-glow'][voiceClass](event) + [' Recovery complete.',' The fighter regains composure.',' The recovery takes effect.',' The healing response is complete.'][index];
    else if (event.action === 'burn') main = procText.scorch[voiceClass](event);
    else main = `${move(event)} changes the exchange.`;
  } else main = lines[voiceClass][kind][index](event);
  const extras = [...new Set(event.procs)].filter(id => !(kind === 'proc' && ((id === 'calm-glow' && event.action === 'heal') || (id === 'scorch' && event.action === 'burn') || (id === 'scan-reveal' && event.narration_key === 'signature.scan'))));
  return [main, ...extras.map(id => sentenceForProc(id, event, voiceClass))].join(' ');
}
export function renderFightEnding(summary: FightSummary, voiceClass: VoiceClass, side: 'a' | 'b', eventIndex: number, seed: string | number | bigint = summary.seed): string {
  const pseudoEvent: FightEvent = { n:eventIndex, round:summary.rounds, actor:side, action:'opening', move:'Headbutt', outcome:'hit', damage:0, heal:0, hp_after:{...summary.final_hp}, procs:[], narration_key:'fight.ending', vars:{} };
  return summary.winner === side ? lines[voiceClass].win[pickIndex(eventIndex, seed)](pseudoEvent) : summary.ko ? lines[voiceClass].ko[pickIndex(eventIndex, seed)](pseudoEvent) : `The fight ends with the rival ahead.`;
}
