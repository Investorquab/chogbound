'use client';
import { usePathname } from 'next/navigation';
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

export function ArtImage({ tokenId, name, className = 'chog-art' }: { tokenId: string; name: string; className?: string }) {
  return <img className={className} src={`/api/art/${encodeURIComponent(tokenId)}`} alt={name} />;
}

export function StatGrid({ entry }: { entry: import('../lib/cast.js').CastEntry }) {
  const stats = entry.fighter.stats;
  return <div className="stat-grid">{(['GRIT', 'PUNCH', 'SWIFT', 'NERVE'] as const).map((stat) => <div className="stat" key={stat}>
    <div className="stat-top"><span className="eyebrow">{stat}</span><strong className="stat-num">{stats[stat]}</strong></div>
    <div className="bar"><span style={{ width: `${stats[stat]}%` }} /></div>
  </div>)}</div>;
}

