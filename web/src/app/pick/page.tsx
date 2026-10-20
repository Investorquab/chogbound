'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArtImage, StatGrid } from '../../components/site.js';
import { byTokenId, cast, safeStorageRemove, safeStorageSet, traitSummary } from '../../lib/cast.js';
import { LAST_FIGHT_KEY, SELECTED_TOKEN_KEY } from '../../lib/fight-store.js';
import { WalletPanel } from '../../components/wallet-panel.js';
import { LaunchButton } from '../../components/launch-button.js';
import { displayName } from 'chogbound-sim/src/stats.js';
import './play-bar.css';

export default function PickPage() {
  const [selectedId, setSelectedId] = useState('640');
  useEffect(() => {
    try { setSelectedId(window.localStorage.getItem(SELECTED_TOKEN_KEY) ?? '640'); } catch { setSelectedId('640'); }
  }, []);
  const selected = byTokenId(selectedId);
  function choose(tokenId: string) {
    setSelectedId(tokenId);
    safeStorageSet(SELECTED_TOKEN_KEY, tokenId);
    safeStorageRemove(LAST_FIGHT_KEY);
  }
  return <main className="section pick-page">
    <div className="section-head"><div><div className="eyebrow">THE CAST</div><h1 className="display">PICK YOUR CHOG</h1><p className="caption">Choose a Chog to inspect its traits. Guest mode is available for the demo.</p></div><span className="pill">{cast.length} SAMPLE CHOGS</span></div>
    <WalletPanel selectedId={selected.tokenId} onSelect={choose} />
    <div className="pick-layout"><section className="cast-grid" aria-label="Chog cast">{cast.map((entry) => <button type="button" key={entry.tokenId} className="cast-card" aria-pressed={entry.tokenId === selected.tokenId} onClick={() => choose(entry.tokenId)}><ArtImage tokenId={entry.tokenId} name={entry.metadata.name} /><strong>{entry.metadata.name}</strong><span>{traitSummary(entry)}</span></button>)}</section>
      <aside className="surface pick-detail"><div className="art-tile" style={{ '--stage': '#30234f' } as import('react').CSSProperties}><ArtImage tokenId={selected.tokenId} name={selected.metadata.name} /></div><div className="pick-name"><div><div className="eyebrow">SELECTED CHOG</div><h2 className="display">{selected.metadata.name}</h2></div><span className="tag gold">YOUR PICK</span></div><div className="caption">{traitSummary(selected)}</div><div className="rule" /><StatGrid entry={selected} /><div className="rule" /><div className="hero-actions"><Link className="btn primary" href="/coach">COACH THIS CHOG</Link><Link className="btn secondary" href="/coach?guest=1">CONTINUE AS GUEST</Link></div><p className="caption">No wallet connected. Guest mode is available.</p></aside>
    </div>
    <div className="play-bar" role="region" aria-label="Play with the selected Chog" data-testid="play-bar">
      <div className="play-bar-inner">
        <ArtImage tokenId={selected.tokenId} name={selected.metadata.name} className="play-bar-art" />
        <div className="play-bar-who"><small>YOUR CHOG</small><strong>{displayName(selected.metadata.name)}</strong></div>
        <Link className="btn secondary play-bar-coach" href="/coach">COACH FIRST</Link>
        <LaunchButton className="btn primary play-big">PLAY</LaunchButton>
      </div>
    </div>
  </main>;
}
