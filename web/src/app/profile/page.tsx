'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArtImage } from '../../components/site.js';
import { byTokenId, cast, safeStorageGet, traitSummary } from '../../lib/cast.js';
import { FIGHT_HISTORY_KEY, simulateCastSeason, type StoredFight } from '../../lib/fight-store.js';

const thresholds = [0, 3, 7, 12, 18, 25, 33, 42];
function levelForXp(xp: number) { let level = 1; for (let i = 0; i < thresholds.length; i++) if (xp >= thresholds[i]) level = i + 1; return level; }
function total(entry: (typeof cast)[number]) { return entry.fighter.stats.GRIT + entry.fighter.stats.PUNCH + entry.fighter.stats.SWIFT + entry.fighter.stats.NERVE; }

export default function ProfilePage() {
  const [selectedId, setSelectedId] = useState('640');
  const [savedHistory, setSavedHistory] = useState<StoredFight[]>([]);
  const season = useMemo(() => simulateCastSeason(), []);
  useEffect(() => {
    setSelectedId(safeStorageGet('chogbound.selected-token') ?? '640');
    try { setSavedHistory(JSON.parse(safeStorageGet(FIGHT_HISTORY_KEY) ?? '[]') as StoredFight[]); } catch { setSavedHistory([]); }
  }, []);
  const selected = byTokenId(selectedId);
  const matches = season.filter((fight) => fight.you.tokenId === selectedId || fight.rival.tokenId === selectedId);
  let wins = 0; let losses = 0; let upsets = 0; let xp = 0;
  for (const fight of matches) {
    const winnerId = fight.result.summary.winner === 'a' ? fight.you.tokenId : fight.rival.tokenId;
    if (winnerId === selectedId) { wins++; xp += 3; if (fight.result.summary.upset) { upsets++; xp += 2; } }
    else { losses++; xp += 1; }
  }
  const level = levelForXp(xp);
  const nextThreshold = thresholds[level] ?? thresholds[thresholds.length - 1];
  const previousThreshold = thresholds[level - 1] ?? 0;
  const progress = level >= 8 ? 100 : Math.max(0, Math.min(100, ((xp - previousThreshold) / Math.max(1, nextThreshold - previousThreshold)) * 100));
  const recentSeason = season.filter((fight) => fight.you.tokenId === selectedId || fight.rival.tokenId === selectedId).slice(-3).reverse();
  const recentSaved = savedHistory.filter((fight) => fight.youId === selectedId || fight.rivalId === selectedId).slice(0, 3);
  const recent = recentSaved.length ? recentSaved.map((fight) => ({
    key: `${fight.youId}-${fight.rivalId}-${fight.createdAt}`,
    opponent: byTokenId(fight.youId === selectedId ? fight.rivalId : fight.youId),
    won: (fight.result.summary.winner === 'a' ? fight.youId : fight.rivalId) === selectedId,
    hp: fight.youId === selectedId ? fight.result.summary.final_hp.a : fight.result.summary.final_hp.b,
    events: fight.result.events.length,
  })) : recentSeason.map((fight) => {
    const youSide = fight.you.tokenId === selectedId;
    const winnerId = fight.result.summary.winner === 'a' ? fight.you.tokenId : fight.rival.tokenId;
    return { key: `${fight.you.tokenId}-${fight.rival.tokenId}`, opponent: youSide ? fight.rival : fight.you, won: winnerId === selectedId, hp: youSide ? fight.result.summary.final_hp.a : fight.result.summary.final_hp.b, events: fight.result.events.length };
  });
  return <main className="section">
    <div className="section-head"><div><div className="eyebrow">YOUR FIGHTER CARD</div><h1 className="display">THE RECORD KEEPS GROWING</h1></div><span className="pill">NIGHT 09</span></div>
    <div className="profile-layout"><section className="surface profile-card"><div className={`level-art ${level >= 8 ? 'level-8' : level >= 4 ? 'level-4' : ''}`}><div className="halo" /><ArtImage tokenId={selected.tokenId} name={selected.metadata.name} /></div><div className="profile-name"><div><div className="eyebrow">YOUR CHOG</div><h2 className="display">{selected.metadata.name}</h2></div><span className="tag gold">LEVEL {level}</span></div><div className="caption">{traitSummary(selected)}</div><div className="rule" /><div className="level-progress"><div className="level-progress-top"><span>EXPERIENCE</span><strong>{xp} XP</strong></div><div className="hp-track"><span style={{ width: `${progress}%` }} /></div><p className="caption">{level >= 8 ? 'Maximum cosmetic level reached.' : `${nextThreshold - xp} XP to Level ${level + 1}.`}</p></div><div className="caption level-copy">Level is cosmetic only. Stats do not change.</div></section>
      <section className="profile-main"><div className="surface panel"><div className="eyebrow">CAREER RECORD</div><div className="profile-record"><div><strong>{String(wins).padStart(2, '0')}</strong><span>WINS</span></div><div><strong>{String(losses).padStart(2, '0')}</strong><span>LOSSES</span></div><div><strong>{wins + losses ? Math.round(wins / (wins + losses) * 100) : 0}%</strong><span>WIN RATE</span></div></div><div className="caption">{upsets} upset wins from real simulator fights.</div><div className="rule" /><div className="eyebrow">RECENT FIGHTS</div><div className="traits recent">{recent.map((fight) => <div className="trait-row" key={fight.key}><div className="trait-label">NIGHT 09</div><div className="trait-value"><strong>{fight.won ? 'Win' : 'Loss'} vs {fight.opponent.metadata.name}</strong><div className="caption">{fight.hp} HP left / {fight.events} events</div><div className="row-actions"><a className="btn small secondary" href="/replay">WATCH REPLAY</a><a className="btn small primary" href="/arena">REMATCH</a></div></div></div>)}</div></div>
        <div className="surface panel share-panel"><div className="eyebrow">SHARE CARD</div><div className="share-card"><ArtImage tokenId={selected.tokenId} name={selected.metadata.name} /><div><div className="eyebrow">CHOGBOUND / NIGHT 09</div><h2 className="display">THE PLAN WAS YOURS.</h2><div className="mono">{wins}W / {losses}L / LEVEL {level}</div></div></div><button className="btn primary" type="button" onClick={async () => { const text = `${selected.metadata.name} | ChogBound | ${wins}W / ${losses}L | Level ${level}`; try { await navigator.clipboard.writeText(text); } catch { /* Clipboard can be unavailable in guest mode. */ } }}>SHARE PROFILE</button></div>
      </section></div>
  </main>;
}
