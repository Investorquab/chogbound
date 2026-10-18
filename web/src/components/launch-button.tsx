'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSelectedTokenId, startTonight } from '../lib/fight-store.js';

export function LaunchButton({ className = 'btn primary', children = "RUN TONIGHT'S FIGHTS NOW" }: { className?: string; children?: React.ReactNode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button className={className} type="button" disabled={busy} onClick={async () => {
    setBusy(true);
    try { await startTonight(getSelectedTokenId()); } finally { setBusy(false); }
    router.push('/replay?autoplay=1');
  }}>{busy ? 'PREPARING THE FIGHT' : children}</button>;
}
