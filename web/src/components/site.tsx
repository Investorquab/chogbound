'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { artUrls, loadImage, resolveFirstLoadable } from '../lib/art-url.js';
import Link from 'next/link';

const links = [
  ['/', 'HOME'], ['/pick', 'PICK'], ['/coach', 'COACH'], ['/replay', 'REPLAY'], ['/arena', 'ARENA'], ['/profile', 'PROFILE'],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const active = links.find(([href]) => href === pathname)?.[1] ?? '';
  return <header className="topbar">
    <Link className="brand" href="/" aria-label="ChogBound home">CHOG<span>BOUND</span></Link>
    <nav aria-label="Main navigation">{links.map(([href, label]) => <Link key={href} href={href} className={active === label ? 'active' : ''}>{label}</Link>)}</nav>
  </header>;
}

export function SiteFooter() {
  return <footer className="page-foot">
    <span>CHOGBOUND / NIGHT 09</span>
    <div className="footer-links"><Link href="/arena">ARENA</Link><Link href="/profile">PROFILE</Link></div>
    <span>YOUR TRAITS. YOUR FIGHT.</span>
  </footer>;
}

const PLACEHOLDER_ART = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="18" fill="#30234f"/><path d="M43 82 56 42 86 57Q100 51 114 57L144 42 157 82 151 132Q143 160 100 165Q57 160 49 132Z" fill="#8b78c7" stroke="#c9baff" stroke-width="4"/><ellipse cx="77" cy="100" rx="10" ry="13" fill="#ffc24b"/><ellipse cx="123" cy="100" rx="10" ry="13" fill="#ffc24b"/><path d="M78 132Q100 146 122 132" fill="none" stroke="#211507" stroke-width="6" stroke-linecap="round"/></svg>'
)}`;

const artCache = new Map<string, string>();
/**
 * Chog art is never stored here. It loads at runtime from public IPFS gateways, tried in order with a timeout each.
 * Until one answers (or if none do) the drawn placeholder stays on screen, so a player never sees a broken image.
 */
export function ArtImage({ tokenId: _tokenId, name, className = 'chog-art', priority = false }: { tokenId: string; name: string; className?: string; priority?: boolean }) {
  const [src, setSrc] = useState<string>(PLACEHOLDER_ART);
  useEffect(() => {
    const known = artCache.get(name);
    if (known) { setSrc(known); return; }
    let cancelled = false;
    resolveFirstLoadable(artUrls(name), (url) => loadImage(url)).then((url) => { if (url && !cancelled) { artCache.set(name, url); setSrc(url); } });
    return () => { cancelled = true; };
  }, [name]);
  const isPlaceholder = src === PLACEHOLDER_ART;
  return <img className={className} src={src} alt={isPlaceholder ? `${name} (art loading)` : name} data-art={isPlaceholder ? 'placeholder' : 'remote'} loading={priority ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer" />;
}

export function StatGrid({ entry }: { entry: import('../lib/cast.js').CastEntry }) {
  const stats = entry.fighter.stats;
  return <div className="stat-grid">{(['GRIT', 'PUNCH', 'SWIFT', 'NERVE'] as const).map((stat) => <div className="stat" key={stat}>
    <div className="stat-top"><span className="eyebrow">{stat}</span><strong className="stat-num">{stats[stat]}</strong></div>
    <div className="bar"><span style={{ width: `${stats[stat]}%` }} /></div>
  </div>)}</div>;
}


