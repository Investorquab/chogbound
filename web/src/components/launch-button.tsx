'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Plan } from 'chogbound-sim/src/types.js';
import { audio } from '../lib/audio.js';
import { getSelectedTokenId, startTonight } from '../lib/fight-store.js';

/** Starts tonight's fight for the selected Chog and opens the replay. `plan` overrides the locked plan (used by the coach). */
export function LaunchButton({ className = 'btn primary', children = "RUN TONIGHT'S FIGHTS NOW", plan, beforeLaunch }: { className?: string; children?: React.ReactNode; plan?: Plan; beforeLaunch?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button className={className} type="button" disabled={busy} onClick={async () => {
    audio.unlock();
    beforeLaunch?.();
    setBusy(true);
    try { await startTonight(getSelectedTokenId(), plan); } finally { setBusy(false); }
    router.push('/replay?autoplay=1');
  }}>{busy ? 'PREPARING THE FIGHT' : children}</button>;
}
