'use client';
import { useRouter } from 'next/navigation';
import { runFight } from '../lib/fight-store.js';
import { getSelectedTokenId } from '../lib/fight-store.js';

export function LaunchButton({ className = 'btn primary', children = "RUN TONIGHT'S FIGHTS NOW" }: { className?: string; children?: React.ReactNode }) {
  const router = useRouter();
  return <button className={className} type="button" onClick={() => {
    runFight(getSelectedTokenId());
    router.push('/replay?autoplay=1');
  }}>{children}</button>;
}
