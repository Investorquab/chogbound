'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArtImage } from '../../components/site.js';
import { byTokenId, safeStorageGet } from '../../lib/cast.js';
import { getStoredFight, runFight, type StoredFight } from '../../lib/fight-store.js';
import { renderNarration } from 'chogbound-sim/src/narration.js';
import type { FightEvent, Side } from 'chogbound-sim/src/types.js';

function isKnockout(event: FightEvent) {
  const target: Side = event.actor === 'a' ? 'b' : 'a';
  return event.damage > 0 && event.hp_after[target] === 0;
}
function effectLabel(event: FightEvent | null, signatureMove?: string | null) {
  if (!event) return 'FIGHT LOG READY';
  if (isKnockout(event)) return 'KNOCKOUT';
  if (event.procs.length) return event.procs.join(' / ').toUpperCase();
  if (signatureMove && event.move === signatureMove) return `${String(event.move).toUpperCase()} SIGNATURE`;
  if (event.action === 'burn' || event.action === 'heal' || /^(aura|accessory|signature)\./.test(event.narration_key)) return String(event.move).toUpperCase();
  return '';
}

export default function ReplayPage() {
  const [fight, setFight] = useState<StoredFight | null>(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const stored = getStoredFight() ?? runFight(safeStorageGet('chogbound.selected-token') ?? '640');
    setFight(stored);
    if (new URLSearchParams(window.location.search).get('autoplay') === '1') setPlaying(true);
  }, []);
  const events = fight?.result.events ?? [];
  const you = fight ? byTokenId(fight.youId) : null;
  const rival = fight ? byTokenId(fight.rivalId) : null;
  const shownEvent = cursor > 0 ? events[cursor - 1] ?? null : null;
  const hp = shownEvent?.hp_after ?? { a: 100, b: 100 };
  const finished = Boolean(fight && cursor >= events.length && events.length > 0);
  const activeNarration = useMemo(() => {
    if (!fight || !shownEvent) return 'The first event is ready. Play to step through the event log.';
    const actor = shownEvent.actor === 'a' ? you : rival;
    return actor ? renderNarration(shownEvent, actor.fighter.voiceClass) : '';
  }, [fight, shownEvent, you, rival]);

  useEffect(() => {
    if (!playing || events.length === 0) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interval = window.setInterval(() => setCursor((current) => Math.min(events.length, current + 1)), reduced ? 1400 : 850);
    return () => window.clearInterval(interval);
  }, [playing, events.length]);
  useEffect(() => { if (finished) setPlaying(false); }, [finished]);

  function restart() { setPlaying(false); setCursor(0); }
  function next() { setPlaying(false); setCursor((current) => Math.min(events.length, current + 1)); }
  function skip() { setPlaying(false); setCursor(events.length); }

  if (!fight || !you || !rival) return <main className="section"><div className="surface panel">Preparing a real simulator fight...</div></main>;
  const summary = fight.result.summary;
  const winner = summary.winner === 'a' ? you : rival;
  const currentTarget: Side | null = shownEvent ? (shownEvent.actor === 'a' ? 'b' : 'a') : null;
  const bannerActor = shownEvent ? (shownEvent.actor === 'a' ? you : rival) : null;
  const banner = finished ? 'FIGHT COMPLETE' : effectLabel(shownEvent, bannerActor?.fighter.signature);
  return <main className="replay-main">
    <div className="replay-top"><div><div className="eyebrow">NIGHT {String(fight.night).padStart(2, '0')} / GUEST REPLAY</div><h1 className="display">THE LAST STAND</h1></div><span className="pill">REAL SIMULATOR LOG</span></div>
    <section aria-label="Fight replay stage" className={`replay-stage surface ${finished ? 'finished' : ''}`}>
      <div className="stage-fighters">
        <article className={`fighter fighter-a ${currentTarget === 'a' && shownEvent && shownEvent.damage > 0 ? 'hit-flash' : ''} ${hp.a === 0 ? 'ko-flash' : ''}`}>
          <div className="fighter-name"><strong>{you.metadata.name}</strong><span>You</span></div>
          <div className="fighter-art art-a"><ArtImage tokenId={you.tokenId} name={you.metadata.name} className="chog-art" /></div>
          <div className="hp-meta"><span className="hp-label">{you.metadata.name}</span><strong>{hp.a}</strong><span className="hp-unit">HP</span></div>
          <div className="hp-track"><span style={{ width: `${hp.a}%` }} /></div>
          <div className="fighter-tags"><span className="tag">{you.fighter.voiceClass}</span><span className="tag">{you.fighter.signature ?? 'Core moves'}</span><span className="tag">{you.fighter.aura}</span></div>
        </article>
        <div className="vs-badge">VS</div>
        <article className={`fighter fighter-b ${currentTarget === 'b' && shownEvent && shownEvent.damage > 0 ? 'hit-flash' : ''} ${hp.b === 0 ? 'ko-flash' : ''}`}>
          <div className="fighter-name"><strong>{rival.metadata.name}</strong><span>Rival</span></div>
          <div className="fighter-art art-b"><ArtImage tokenId={rival.tokenId} name={rival.metadata.name} className="chog-art" /></div>
          <div className="hp-meta"><span className="hp-label">{rival.metadata.name}</span><strong>{hp.b}</strong><span className="hp-unit">HP</span></div>
          <div className="hp-track b"><span style={{ width: `${hp.b}%` }} /></div>
          <div className="fighter-tags"><span className="tag">{rival.fighter.voiceClass}</span><span className="tag">{rival.fighter.signature ?? 'Core moves'}</span><span className="tag">{rival.fighter.aura}</span></div>
        </article>
      </div>
      <div className={`effect-banner ${banner ? 'visible' : ''} ${finished || (shownEvent && isKnockout(shownEvent)) ? 'ko-banner' : ''}`} aria-live="polite">{banner}</div>
      <div className="narration" aria-live="polite"><span className="eyebrow">{shownEvent ? `${(shownEvent.actor === 'a' ? you : rival).fighter.voiceClass.toUpperCase()} VOICE` : 'SIMULATOR NARRATION'}</span><p>{activeNarration}</p></div>
      <div className="play-controls"><button className="btn primary" type="button" onClick={() => { if (finished) setCursor(0); setPlaying(true); }}>PLAY</button><button className="btn secondary" type="button" onClick={() => setPlaying(false)}>PAUSE</button><button className="btn secondary" type="button" onClick={next}>NEXT EVENT</button><button className="btn secondary" type="button" onClick={skip}>SKIP TO RESULT</button><button className="btn secondary" type="button" onClick={restart}>RESTART</button><span className="event-counter">{cursor} / {events.length}</span></div>
    </section>
    <section className="replay-lower"><div className="surface event-panel"><div className="eyebrow">EVENT LOG</div><div className="event-list">{events.slice(0, cursor).map((event) => {
      const actor = event.actor === 'a' ? you : rival;
      const ko = isKnockout(event);
      const outcome = ko ? 'KO' : event.outcome.toUpperCase();
      const amount = event.damage > 0 ? `-${event.damage} HP` : event.heal > 0 ? `+${event.heal} HP` : '0 DAMAGE';
      return <div className={`event-item ${event.n === cursor ? 'active' : ''}`} key={`${event.n}-${event.round}`}><span className="event-number">{String(event.n).padStart(2, '0')}</span><span className="event-round">R{event.round}</span><span className={`event-outcome ${outcome.toLowerCase()}`}>{outcome}</span><div className="event-copy"><div className="event-headline"><strong>{actor.metadata.name}</strong><span>{event.move}</span></div><div className="event-detail"><span>{amount}</span>{event.procs.map((proc) => <span className="tag gold" key={proc}>{proc}</span>)}</div><p>{renderNarration(event, actor.fighter.voiceClass)}</p></div></div>;
    })}</div></div>
      <aside className="surface summary-panel" data-testid="final-summary" data-finished={String(finished)}><div className="eyebrow">FIGHT SUMMARY</div><div className="summary-score"><div><span>STAT TOTAL</span><strong>{you.fighter.stats.GRIT + you.fighter.stats.PUNCH + you.fighter.stats.SWIFT + you.fighter.stats.NERVE}</strong><small>You</small></div><div className="summary-vs">VS</div><div><span>STAT TOTAL</span><strong>{rival.fighter.stats.GRIT + rival.fighter.stats.PUNCH + rival.fighter.stats.SWIFT + rival.fighter.stats.NERVE}</strong><small>Rival</small></div></div><div className="summary-lines"><div><span>Winner</span><strong>{winner.metadata.name}</strong></div><div><span>Final HP</span><strong>{summary.final_hp.a} / {summary.final_hp.b}</strong></div><div><span>Upset</span><strong>{summary.upset ? 'Yes' : 'No'}</strong></div><div><span>Result source</span><strong>Live simulator output</strong></div><div><span>Rounds</span><strong>{summary.rounds}</strong></div><div><span>Progress</span><strong>{finished ? 'Final result' : `${cursor} of ${events.length} events`}</strong></div></div></aside>
    </section>
  </main>;
}
