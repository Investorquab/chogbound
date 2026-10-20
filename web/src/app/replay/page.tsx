'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArtImage } from '../../components/site.js';
import { byTokenId, safeStorageGet, safeStorageSet } from '../../lib/cast.js';
import { getStoredFight, startTonight, type StoredFight } from '../../lib/fight-store.js';
import { isHolderToken } from '../../lib/holder.js';
import { renderFightEnding } from 'chogbound-sim/src/narration.js';
import { captionFor } from '../../lib/caption.js';
import { displayName } from 'chogbound-sim/src/stats.js';
import { humanizeProcIds, procLabel } from '../../lib/proc-labels.js';
import { AUDIO_KEYS, audio, type Voices } from '../../lib/audio.js';
import { eventKind, isKnockout } from '../../lib/event-kind.js';
import { musicLevelForHp } from '../../lib/music.js';
import type { FightEvent, Side } from 'chogbound-sim/src/types.js';
import './replay.css';

type Burst = { kind: 'crit' | 'hit' | 'miss' | 'dodge' | 'heal' | 'burn' | 'ko'; top: string; bottom: string };
function burstFor(event: FightEvent): Burst {
  if (isKnockout(event)) return { kind: 'ko', top: 'KO', bottom: `-${event.damage}` };
  if (event.action === 'heal') return { kind: 'heal', top: 'HEAL', bottom: `+${event.heal}` };
  if (event.action === 'burn') return { kind: 'burn', top: 'BURN', bottom: `-${event.damage}` };
  if (event.outcome === 'crit') return { kind: 'crit', top: 'CRIT', bottom: `-${event.damage}` };
  if (event.outcome === 'hit') return { kind: 'hit', top: 'HIT', bottom: `-${event.damage}` };
  if (event.outcome === 'dodge') return { kind: 'dodge', top: 'DODGE', bottom: '' };
  return { kind: 'miss', top: 'MISS', bottom: '' };
}
const tickerOutcome = (event: FightEvent) => { const b = burstFor(event); return b.bottom ? `${b.top} ${b.bottom}` : b.top; };

export default function ReplayPage() {
  const [fight, setFight] = useState<StoredFight | null>(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const previousCursor = useRef(0);
  useEffect(() => {
    void (async () => {
      const stored = getStoredFight() ?? await startTonight(safeStorageGet('chogbound.selected-token') ?? '640');
      setFight(stored);
      const flags = { master: safeStorageGet(AUDIO_KEYS.master) !== 'off', voice: safeStorageGet(AUDIO_KEYS.voice) !== 'off', music: safeStorageGet(AUDIO_KEYS.music) !== 'off' };
      setSoundOn(flags.master); setVoiceOn(flags.voice); setMusicOn(flags.music); audio.setFlags(flags);
      if (new URLSearchParams(window.location.search).get('autoplay') === '1') { setPlaying(true); audio.playStart({ a: byTokenId(stored.youId).fighter.voiceClass, b: byTokenId(stored.rivalId).fighter.voiceClass }); }
    })();
    return () => audio.stopMusic(0.1);
  }, []);
  const events = fight?.result.events ?? [];
  const you = fight ? byTokenId(fight.youId) : null;
  const rival = fight ? byTokenId(fight.rivalId) : null;
  const voices: Voices | null = you && rival ? { a: you.fighter.voiceClass, b: rival.fighter.voiceClass } : null;
  const shownEvent = cursor > 0 ? events[cursor - 1] ?? null : null;
  const hp = shownEvent?.hp_after ?? { a: 100, b: 100 };
  const finished = Boolean(fight && cursor >= events.length && events.length > 0);
  const caption = useMemo(() => {
    if (!fight || !shownEvent) return 'The fight is ready. Press play.';
    const actor = shownEvent.actor === 'a' ? you : rival;
    return actor ? captionFor(shownEvent, actor.fighter.voiceClass, fight.result.summary.seed) : '';
  }, [fight, shownEvent, you, rival]);

  useEffect(() => {
    if (!playing || events.length === 0) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interval = window.setInterval(() => setCursor((current) => Math.min(events.length, current + 1)), reduced ? 1800 : 1400);
    return () => window.clearInterval(interval);
  }, [playing, events.length]);
  useEffect(() => { if (finished) setPlaying(false); }, [finished]);
  // Sound for each event. A jump of more than one event (skip) plays only the result, never a burst of stale sounds.
  useEffect(() => {
    const before = previousCursor.current; previousCursor.current = cursor;
    if (cursor === 0 || cursor <= before || !shownEvent || !voices) return;
    audio.setMusicLevel(musicLevelForHp(Math.min(shownEvent.hp_after.a, shownEvent.hp_after.b)));
    if (cursor - before === 1) audio.playEvent(shownEvent, voices);
  }, [cursor]); // eslint-disable-line react-hooks/exhaustive-deps
  // Music runs while the fight plays and fades when it pauses or ends.
  useEffect(() => { if (playing) audio.startMusic(musicLevelForHp(Math.min(hp.a, hp.b))); else audio.stopMusic(); }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!finished || !fight || !voices) return;
    audio.playResult(fight.result.summary.winner === 'a', voices, 1.0);
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  function restart() { audio.click(); setPlaying(false); setCursor(0); }
  function next() { audio.click(); setPlaying(false); setCursor((current) => Math.min(events.length, current + 1)); }
  function skip() { audio.click(); setPlaying(false); setCursor(events.length); }
  function togglePlay() {
    if (playing) { audio.click(); setPlaying(false); return; }
    if (finished) setCursor(0);
    if ((cursor === 0 || finished) && voices) audio.playStart(voices); else audio.click();
    setPlaying(true);
  }
  function toggle(key: 'master' | 'voice' | 'music', value: boolean, set: (v: boolean) => void) { set(value); audio.setFlags({ [key]: value }); safeStorageSet(AUDIO_KEYS[key], value ? 'on' : 'off'); if (value) audio.click(); }

  if (!fight || !you || !rival) return <main className="rp"><div className="rp-loading">Preparing tonight&apos;s fight...</div></main>;
  const summary = fight.result.summary;
  const winner = summary.winner === 'a' ? you : rival;
  const youName = displayName(you.metadata.name); const rivalName = displayName(rival.metadata.name);
  const burst = shownEvent ? burstFor(shownEvent) : null;
  const actorSide = shownEvent?.actor ?? null;
  const targetSide: Side | null = actorSide ? (actorSide === 'a' ? 'b' : 'a') : null;
  const verdict = summary.winner === 'a' ? 'You won' : 'You lost';
  const margin = summary.ko ? 'by KO' : `on HP (${summary.final_hp.a} to ${summary.final_hp.b})`;
  const endingNarration = humanizeProcIds(renderFightEnding(summary, winner.fighter.voiceClass, summary.winner, events.length + 1, summary.seed));
  const chips = shownEvent ? shownEvent.procs.map(procLabel) : [];
  const ticker = events.slice(Math.max(0, cursor - 3), cursor);
  const stat = (e: typeof you) => e.fighter.stats.GRIT + e.fighter.stats.PUNCH + e.fighter.stats.SWIFT + e.fighter.stats.NERVE;
  const planText = (plan: StoredFight['planYou']) => `${plan.temperament} / ${plan.move}`.toUpperCase();
  const cardClass = (side: Side) => ['rp-fighter', `side-${side}`, actorSide === side && shownEvent?.action === 'attack' ? 'lunge' : '', targetSide === side && shownEvent && shownEvent.damage > 0 ? 'shake' : '', targetSide === side && shownEvent?.outcome === 'dodge' ? 'sidestep' : '', finished && hp[side] === 0 ? 'down' : ''].filter(Boolean).join(' ');

  return <main className="rp">
    <header className="rp-head">
      <div><div className="rp-eyebrow">NIGHT {String(fight.night).padStart(2, '0')} / {isHolderToken(fight.youId) ? 'YOUR CHOG' : 'GUEST REPLAY'}</div><h1 className="rp-title">THE LAST STAND</h1></div>
<div className="rp-tools">
        <button type="button" className={`rp-voice ${soundOn ? 'on' : ''}`} aria-label={soundOn ? 'Sound on' : 'Sound off'} aria-pressed={soundOn} onClick={() => toggle('master', !soundOn, setSoundOn)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" />{soundOn ? <><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19 6a8.5 8.5 0 0 1 0 12" /></> : <path d="M17 9l5 6M22 9l-5 6" />}</svg>
        </button>
        <button type="button" className={`rp-voice ${musicOn ? 'on' : ''}`} aria-label={musicOn ? 'Music on' : 'Music off'} aria-pressed={musicOn} onClick={() => toggle('music', !musicOn, setMusicOn)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" />{!musicOn && <path d="M3 3l18 18" />}</svg>
        </button>
        <button type="button" className={`rp-voice ${voiceOn ? 'on' : ''}`} aria-label={voiceOn ? 'Voice on' : 'Voice off'} aria-pressed={voiceOn} onClick={() => toggle('voice', !voiceOn, setVoiceOn)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5z" />{voiceOn ? <><path d="M8 9h8" /><path d="M8 12h5" /></> : <path d="M3 3l18 18" />}</svg>
        </button>
      </div>
    </header>

    <div className="rp-grid">
      <div className="rp-play">
        <section className="rp-hud" aria-label="Fighter health">
          <div className="rp-hp a"><div className="rp-hp-top"><span className="rp-name">{youName}</span><strong>{hp.a}</strong></div><div className="rp-bar"><span style={{ width: `${hp.a}%` }} /></div></div>
          <div className="rp-round"><small>ROUND</small><strong>{shownEvent?.round ?? 1}<em>/{summary.rounds}</em></strong></div>
          <div className="rp-hp b"><div className="rp-hp-top"><strong>{hp.b}</strong><span className="rp-name">{rivalName}</span></div><div className="rp-bar"><span style={{ width: `${hp.b}%` }} /></div></div>
        </section>

        <section className={`rp-stage ${finished ? 'finished' : ''}`} aria-label={`${youName} fights ${rivalName}`}>
          <div className="rp-moon" aria-hidden="true" />
          <div className="rp-floor" aria-hidden="true" />
          <div className={cardClass('a')} key={`a-${cursor}`}><div className="rp-card"><ArtImage tokenId={you.tokenId} name={you.metadata.name} className="chog-art" priority /></div></div>
          <div className={cardClass('b')} key={`b-${cursor}`}><div className="rp-card"><ArtImage tokenId={rival.tokenId} name={rival.metadata.name} className="chog-art" priority /></div></div>
          {finished
            ? <div className="rp-burst final" key="final" data-testid="stage-result"><svg viewBox="0 0 136 136" aria-hidden="true"><polygon points="68,2 82,40 120,26 98,60 134,74 96,88 110,128 74,106 56,134 48,98 8,108 34,76 4,52 44,48 38,10 62,36" /></svg><div><b>{verdict.toUpperCase()}</b><span>{summary.ko ? 'BY KO' : 'ON HP'}</span></div></div>
            : burst && <div className={`rp-burst ${burst.kind}`} key={`burst-${cursor}`}><svg viewBox="0 0 136 136" aria-hidden="true"><polygon points="68,2 82,40 120,26 98,60 134,74 96,88 110,128 74,106 56,134 48,98 8,108 34,76 4,52 44,48 38,10 62,36" /></svg><div><b>{burst.top}</b>{burst.bottom && <span>{burst.bottom}</span>}</div></div>}
          <div className="rp-plans"><span className="a">{planText(fight.planYou)}</span><span className="b">{planText(fight.planRival)}</span></div>
        </section>

        <div className="rp-chips" aria-label="Effects this event">{chips.map((chip, i) => <span className={i === 0 ? 'chip lead' : 'chip'} key={`${chip}-${i}`}>{chip}</span>)}</div>

        <div className="rp-caption" aria-live="polite">
          <div className="rp-voice-name">{shownEvent ? `${(shownEvent.actor === 'a' ? you : rival).fighter.voiceClass.toUpperCase()} VOICE` : 'TONIGHT'}</div>
          <p>{caption}</p>
        </div>

        <div className="rp-controls">
          <button className="rp-btn primary" type="button" onClick={togglePlay}>{playing ? 'PAUSE' : 'PLAY'}</button>
          <button className="rp-btn" type="button" onClick={next}>NEXT EVENT</button>
          <button className="rp-btn" type="button" onClick={skip}>SKIP TO RESULT</button>
          <button className="rp-btn quiet" type="button" onClick={restart}>RESTART</button>
          <span className="rp-count">{cursor} / {events.length}</span>
        </div>
      </div>

      <div className="rp-side">
        <section className="rp-ticker" aria-label="Last events"><div className="rp-label">LAST EVENTS</div>
          <ol>{ticker.length === 0 ? <li className="empty">Nothing yet.</li> : ticker.map((event) => {
            const actor = event.actor === 'a' ? you : rival; const b = burstFor(event);
            return <li key={event.n}><span className="r">R{event.round}</span><span className="who">{displayName(actor.metadata.name)} {event.move}</span><span className={`out ${b.kind}`}>{tickerOutcome(event)}</span></li>;
          })}</ol>
        </section>

        <aside className="rp-summary" data-testid="final-summary" data-finished={String(finished)} data-upset={String(summary.upset)}>
          <div className="rp-label">FIGHT SUMMARY</div>
          {finished ? <>
            <div className="rp-verdict"><strong data-testid="summary-verdict">{verdict}</strong><span data-testid="summary-margin">{margin}</span>{summary.upset && <span className="rp-upset" data-testid="upset-badge">Upset</span>}</div>
            <div className="rp-ending"><span className="rp-label">{displayName(winner.metadata.name)} says</span><p data-testid="summary-ending-narration">{endingNarration}</p></div>
          </> : <div className="rp-pending" data-testid="summary-pending">The result stays hidden until the fight ends.</div>}
          <div className="rp-score"><div><span>STAT TOTAL</span><strong>{stat(you)}</strong><small>You</small></div><div className="vs">VS</div><div><span>STAT TOTAL</span><strong>{stat(rival)}</strong><small>Rival</small></div></div>
          <dl className="rp-lines">
            {finished && <>
              <div><dt>Winner</dt><dd>{displayName(winner.metadata.name)}</dd></div>
              <div><dt>Final HP</dt><dd>{summary.final_hp.a} / {summary.final_hp.b}</dd></div>
              <div><dt>Upset</dt><dd>{summary.upset ? 'Yes' : 'No'}</dd></div>
              <div><dt>Result source</dt><dd>Live simulator output</dd></div>
            </>}
            <div><dt>Rounds</dt><dd>{summary.rounds}</dd></div>
            <div><dt>Progress</dt><dd>{finished ? 'Final result' : `${cursor} of ${events.length} events`}</dd></div>
          </dl>
        </aside>

        <details className="rp-log"><summary>FULL FIGHT LOG</summary>
          <ol>{events.slice(0, cursor).map((event) => {
            const actor = event.actor === 'a' ? you : rival; const b = burstFor(event);
            return <li key={`${event.n}-${event.round}`}><span className="n">{String(event.n).padStart(2, '0')}</span><span className="r">R{event.round}</span><span className={`out ${b.kind}`}>{tickerOutcome(event)}</span><div><strong>{displayName(actor.metadata.name)}</strong> <em>{event.move}</em>{event.procs.map((proc) => <span className="chip" key={proc}>{procLabel(proc)}</span>)}<p>{captionFor(event, actor.fighter.voiceClass, summary.seed)}</p></div></li>;
          })}</ol>
        </details>
      </div>
    </div>
  </main>;
}
