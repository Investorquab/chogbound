'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { displayName } from 'chogbound-sim/src/stats.js';
import { ArtImage, NightLabel } from '../../components/site.js';
import { LaunchButton } from '../../components/launch-button.js';
import { byTokenId, safeStorageGet, type CastEntry } from '../../lib/cast.js';
import { fetchChogEntries } from '../../lib/holder.js';
import { msUntilNextNight, nightNumber, rivalIdFor } from '../../lib/night.js';
import './arena.css';

type Row = { id: number; name: string; tier: string; wins: number; losses: number; upsets: number; xp: number; rank: number };
type Standings = { night: number; total: number; top: Row[]; you: Row | null };
const clock = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':'); };

export default function ArenaPage() {
  const [selectedId, setSelectedId] = useState('640');
  const [data, setData] = useState<Standings | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [rival, setRival] = useState<CastEntry | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => { setSelectedId(safeStorageGet('chogbound.selected-token') ?? '640'); }, []);
  useEffect(() => {
    let off = false; setFailed(false); setData(null);
    fetch(`/api/standings?limit=10&token=${selectedId}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))).then((body: Standings) => { if (!off) setData(body); }).catch(() => { if (!off) setFailed(true); });
    return () => { off = true; };
  }, [selectedId, attempt]);
  useEffect(() => {
    const rivalId = String(rivalIdFor(nightNumber(), selectedId));
    const known = byTokenId(rivalId);
    if (known.tokenId === rivalId) { setRival(known); return; }
    let off = false;
    fetchChogEntries([Number(rivalId)]).then((entries) => { if (!off) setRival(entries[0] ?? null); }).catch(() => { if (!off) setRival(null); });
    return () => { off = true; };
  }, [selectedId]);
  useEffect(() => { const tick = () => setLeft(msUntilNextNight()); tick(); const t = window.setInterval(tick, 1000); return () => window.clearInterval(t); }, []);
  const you = data?.you ?? null;

  return <main className="section">
    <div className="section-head"><div><div className="eyebrow"><NightLabel /> / SEASON STANDINGS</div><h1 className="display">THE ARENA</h1><p className="caption">Every Chog fights one rival each night, drawn from all 1,969. Standings use autopilot plans for everyone, so anyone can recompute them. Your coached fight is in your replay.</p></div><LaunchButton className="btn primary">RUN TONIGHT&apos;S FIGHTS</LaunchButton></div>
    <div className="arena-layout">
      <section className="surface arena-board" aria-label="Season standings">
        <div className="eyebrow">TOP 10 OF {data ? data.total.toLocaleString('en-US') : '1,969'}</div>
        {failed && <div className="arena-note" role="status">The standings could not load. <button type="button" className="btn secondary" onClick={() => setAttempt((n) => n + 1)}>TRY AGAIN</button></div>}
        {!failed && !data && <div className="arena-note" role="status">Counting every fight...</div>}
        {data && <ol className="board" data-testid="standings-top">{data.top.map((row) => <li key={row.id} className={String(row.id) === selectedId ? 'mine' : ''}>
          <span className="rank">{row.rank}</span>
          <ArtImage tokenId={String(row.id)} name={row.name} className="board-art" />
          <span className="who"><strong>{displayName(row.name)}</strong><small>{row.tier}</small></span>
          <span className="rec">{row.wins}W {row.losses}L</span>
        </li>)}</ol>}
      </section>
      <aside className="arena-side">
        <section className="surface side-panel" data-testid="your-standing"><div className="eyebrow">YOUR CHOG</div>
          <div className="display big-record">{you ? `${you.wins}W / ${you.losses}L` : '--'}</div>
          <p className="caption">{you ? `${displayName(you.name)} is ranked ${you.rank.toLocaleString('en-US')} of ${data!.total.toLocaleString('en-US')} with ${you.xp} XP from autopilot fights.` : 'Loading your rank.'}</p>
          <Link className="btn secondary" href="/profile">OPEN YOUR PROFILE</Link></section>
        <section className="surface side-panel" data-testid="tonight-rival"><div className="eyebrow">TONIGHT&apos;S RIVAL</div>
          {rival ? <div className="rival"><ArtImage tokenId={rival.tokenId} name={rival.metadata.name} className="rival-avatar" /><div><strong>{displayName(rival.metadata.name)}</strong><p className="caption">{rival.fighter.tier} / drawn by the night&apos;s seed</p></div></div> : <p className="caption">Drawing tonight&apos;s rival.</p>}
          <p className="caption">Next night starts in <strong className="mono" data-testid="night-clock">{left === null ? '--:--:--' : clock(left)}</strong></p></section>
      </aside>
    </div>
  </main>;
}
