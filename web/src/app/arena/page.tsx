'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArtImage } from '../../components/site.js';
import { byTokenId, cast, NIGHT_NUMBER, safeStorageGet, traitSummary } from '../../lib/cast.js';
import { LaunchButton } from '../../components/launch-button.js';
import { simulateCastSeason } from '../../lib/fight-store.js';

export default function ArenaPage() {
  const [selectedId, setSelectedId] = useState('640');
  useEffect(() => { setSelectedId(safeStorageGet('chogbound.selected-token') ?? '640'); }, []);
  const season = useMemo(() => simulateCastSeason(), []);
  const standings = useMemo(() => {
    const records = new Map(cast.map((entry) => [entry.tokenId, { entry, wins: 0, losses: 0, upsets: 0, xp: 0, fights: 0 }]));
    for (const fight of season) {
      const winnerId = fight.result.summary.winner === 'a' ? fight.you.tokenId : fight.rival.tokenId;
      const loserId = winnerId === fight.you.tokenId ? fight.rival.tokenId : fight.you.tokenId;
      const winner = records.get(winnerId)!; const loser = records.get(loserId)!;
      winner.wins += 1; winner.xp += 3 + (fight.result.summary.upset ? 2 : 0); winner.fights += 1;
      loser.losses += 1; loser.xp += 1; loser.fights += 1;
      if (fight.result.summary.upset) winner.upsets += 1;
    }
    return [...records.values()].sort((a, b) => b.wins - a.wins || b.upsets - a.upsets || b.xp - a.xp || total(b.entry) - total(a.entry));
  }, [season]);
  const yourRecord = standings.find((row) => row.entry.tokenId === selectedId) ?? standings[0]!;
  const watch = standings.find((row) => row.entry.tokenId !== selectedId) ?? standings[1]!;
  const recent = season.slice(-5).reverse();
  return <main className="section">
    <div className="section-head"><div><div className="eyebrow">NIGHT 09 / LIVE BOARD</div><h1 className="display">THE ARENA</h1><p className="caption">Last night's fights between the sample Chogs.</p></div><LaunchButton className="btn primary">RUN TONIGHT&apos;S FIGHTS</LaunchButton></div>
    <div className="arena-layout"><section className="surface arena-board"><div className="eyebrow">TOP RECORDS</div><div className="arena-podium">{standings.slice(0, 3).map((row, index) => <article className="arena-podium-card" key={`podium-${row.entry.tokenId}`}><div className="arena-podium-rank">#{index + 1}</div><ArtImage tokenId={row.entry.tokenId} name={row.entry.metadata.name} className="arena-podium-art" /><strong>{row.entry.metadata.name}</strong><span className="arena-podium-record">{row.wins}W / {row.losses}L</span><span className="caption">{row.xp} XP Â· {row.upsets} upsets</span><Link className="btn small secondary" href={`/coach?chog=${encodeURIComponent(row.entry.tokenId)}`}>COACH</Link></article>)}</div><div className="arena-list">{standings.map((row, index) => <div className="arena-row" key={row.entry.tokenId}><span className="rank">{String(index + 1).padStart(2, '0')}</span><ArtImage tokenId={row.entry.tokenId} name={row.entry.metadata.name} className="arena-avatar" /><div className="arena-info"><strong>{row.entry.metadata.name}</strong><span>{traitSummary(row.entry)}</span></div><div className="arena-record"><strong>{row.wins}W / {row.losses}L</strong><span>{row.xp} XP</span></div><Link className="btn small secondary" href={`/coach?chog=${encodeURIComponent(row.entry.tokenId)}`}>COACH</Link></div>)}</div></section>
      <aside className="arena-side"><section className="surface side-panel"><div className="eyebrow">YOUR NIGHT</div><div className="display big-record">{yourRecord.wins}W / {yourRecord.losses}L</div><p className="caption">{yourRecord.xp} XP from simulator results.</p><Link className="btn primary" href="/coach">OPEN COACH</Link></section>
        <section className="surface side-panel"><div className="eyebrow">RIVAL TO WATCH</div><div className="rival"><ArtImage tokenId={watch.entry.tokenId} name={watch.entry.metadata.name} className="rival-avatar" /><div><strong>{watch.entry.metadata.name}</strong><p className="caption">{traitSummary(watch.entry)}</p><Link href="/replay" className="text-link">WATCH REPLAY</Link></div></div></section>
        <section className="surface side-panel"><div className="eyebrow">FIGHT FEED</div><div className="traits">{recent.map((fight) => { const winner = fight.result.summary.winner === 'a' ? fight.you : fight.rival; const loser = winner.tokenId === fight.you.tokenId ? fight.rival : fight.you; return <div className="trait-row" key={`${fight.you.tokenId}-${fight.rival.tokenId}`}><div className="trait-label">{`NIGHT ${String(NIGHT_NUMBER).padStart(2, '0')} / R${fight.result.summary.rounds}`}</div><div className="trait-value"><strong>{winner.metadata.name}</strong> defeated {loser.metadata.name}<div className="caption">{fight.result.events.length} events Â· {fight.result.summary.rounds} rounds</div></div></div>; })}</div></section>
      </aside>
    </div>
  </main>;
}
function total(entry: (typeof cast)[number]) { return entry.fighter.stats.GRIT + entry.fighter.stats.PUNCH + entry.fighter.stats.SWIFT + entry.fighter.stats.NERVE; }
