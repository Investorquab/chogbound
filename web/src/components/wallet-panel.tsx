'use client';
import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { displayName } from 'chogbound-sim/src/stats.js';
import { MONAD_RPC, monad } from '../lib/chog-chain.js';
import { WALLET_MESSAGES, WalletError, connectHolder, type Eip1193 } from '../lib/wallet-session.js';
import { clearHolder, fetchChogEntries, getHolder, saveHolder, shortAddress, type StoredHolder } from '../lib/holder.js';
import { byTokenId, cast, clearRegistry, registerEntries, safeStorageRemove, traitSummary, type CastEntry } from '../lib/cast.js';
import { LAST_FIGHT_KEY, SELECTED_TOKEN_KEY } from '../lib/fight-store.js';
import { ArtImage } from './site.js';
import './wallet-panel.css';

type Status = 'idle' | 'connecting' | 'loading' | 'ready' | 'error';
const total = (e: CastEntry) => e.fighter.stats.GRIT + e.fighter.stats.PUNCH + e.fighter.stats.SWIFT + e.fighter.stats.NERVE;

export function WalletPanel({ selectedId, onSelect }: { selectedId: string; onSelect: (tokenId: string) => void }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [holder, setHolder] = useState<StoredHolder | null>(null);
  const [owned, setOwned] = useState<CastEntry[]>([]);

  async function load(h: StoredHolder) {
    setStatus('loading');
    try {
      const known = h.ids.map((id) => byTokenId(id)).filter((e, i) => e.tokenId === String(h.ids[i]));
      const entries = known.length === h.ids.length ? known : await fetchChogEntries(h.ids);
      registerEntries(entries); setOwned(entries); setHolder(h); setStatus('ready');
    } catch { setMessage(WALLET_MESSAGES.failed); setStatus('error'); }
  }
  useEffect(() => { const stored = getHolder(); if (stored) void load(stored); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function connect() {
    setMessage(''); setStatus('connecting');
    try {
      const provider = (window as unknown as { ethereum?: Eip1193 }).ethereum;
      const result = await connectHolder(provider, createPublicClient({ chain: monad, transport: http(MONAD_RPC) }));
      await load(saveHolder({ address: result.address, ids: result.chogs.ids, complete: result.chogs.complete }));
    } catch (e) { setMessage(e instanceof WalletError ? e.message : WALLET_MESSAGES.failed); setStatus('error'); }
  }
  function disconnect() { clearHolder(); clearRegistry(); safeStorageRemove(SELECTED_TOKEN_KEY); safeStorageRemove(LAST_FIGHT_KEY); setHolder(null); setOwned([]); setStatus('idle'); setMessage(''); }

  const busy = status === 'connecting' || status === 'loading';
  return <section className="surface panel wallet-panel" aria-label="Play with your own Chog" data-testid="wallet-panel">
    <div className="eyebrow">FOR HOLDERS</div>
    <h2 className="display">PLAY WITH YOUR OWN CHOG</h2>
    <p className="caption">Connect a wallet that holds a Chog. We read which Chogs you own and fight with their real traits. Connecting asks for a signature only, so there is no transaction and no gas.</p>
    {!holder && <button type="button" className="btn primary" disabled={busy} onClick={connect}>{status === 'connecting' ? 'WAITING FOR WALLET' : status === 'loading' ? 'LOADING YOUR CHOGS' : 'CONNECT WALLET'}</button>}
    {status === 'error' && <p role="alert" className="wallet-error">{message}</p>}
    {holder && <div data-testid="wallet-connected">
      <div className="wallet-bar"><span className="tag gold">CONNECTED {shortAddress(holder.address)}</span><button type="button" className="btn secondary" onClick={disconnect}>DISCONNECT</button></div>
      {owned.length === 0 ? <p className="caption" data-testid="wallet-empty">This wallet holds no Chogs. Pick a demo Chog below to play as a guest.</p> : <>
        {!holder.complete && <p className="caption" role="status">We could not read every Chog right now, so this list may be missing some. Disconnect and connect again to retry.</p>}
        <p className="caption">{owned.length === 1 ? 'You own 1 Chog.' : `You own ${owned.length} Chogs.`} Tap one, then press PLAY below.</p>
        <div className="cast-grid" data-testid="owned-chogs">{owned.map((entry) => <button type="button" key={entry.tokenId} className="cast-card" aria-pressed={entry.tokenId === selectedId} onClick={() => onSelect(entry.tokenId)} aria-label={`Choose ${displayName(entry.metadata.name)}`}><ArtImage tokenId={entry.tokenId} name={entry.metadata.name} /><strong>{displayName(entry.metadata.name)}</strong><span>{entry.fighter.tier} / {total(entry)} total / {traitSummary(entry)}</span></button>)}</div>
      </>}
    </div>}
    <p className="caption">No Chog? Play as a guest with one of the {cast.length} demo Chogs below.</p>
  </section>;
}
