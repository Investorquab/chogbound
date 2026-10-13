'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArtImage, StatGrid } from '../../components/site.js';
import { byTokenId, cast, safeStorageSet, traitSummary } from '../../lib/cast.js';
import { SELECTED_TOKEN_KEY } from '../../lib/fight-store.js';

export default function PickPage() {
  const [selectedId, setSelectedId] = useState('640');
  useEffect(() => {
    try { setSelectedId(window.localStorage.getItem(SELECTED_TOKEN_KEY) ?? '640'); } catch { setSelectedId('640'); }
  }, []);
  const selected = byTokenId(selectedId);
  function choose(tokenId: string) {
    setSelectedId(tokenId);
    safeStorageSet(SELECTED_TOKEN_KEY, tokenId);
  }
  return <main className="section">
    <div className="section-head"><div><div className="eyebrow">THE CAST</div><h1 className="display">PICK YOUR CHOG</h1><p className="caption">Choose a Chog to inspect its traits. Guest mode is available for the demo.</p></div><span className="pill">{cast.length} SAMPLE CHOGS</span></div>
    <div className="pick-layout"><section className="cast-grid" aria-label="Chog cast">{cast.map((entry) => <button type="button" key={entry.tokenId} className="cast-card" aria-pressed={entry.tokenId === selected.tokenId} onClick={() => choose(entry.tokenId)}><ArtImage tokenId={entry.tokenId} name={entry.metadata.name} /><strong>{entry.metadata.name}</strong><span>{traitSummary(entry)}</span></button>)}</section>
      <aside className="surface pick-detail"><div className="art-tile" style={{ '--stage': '#30234f' } as import('react').CSSProperties}><ArtImage tokenId={selected.tokenId} name={selected.metadata.name} /></div><div className="pick-name"><div><div className="eyebrow">SELECTED CHOG</div><h2 className="display">{selected.metadata.name}</h2></div><span className="tag gold">YOUR PICK</span></div><div className="caption">{traitSummary(selected)}</div><div className="rule" /><StatGrid entry={selected} /><div className="rule" /><div className="hero-actions"><Link className="btn primary" href="/coach">COACH THIS CHOG</Link><Link className="btn secondary" href="/coach?guest=1">CONTINUE AS GUEST</Link></div><p className="caption">No wallet connected. Guest mode is available.</p></aside>
    </div>
  </main>;
}
