import Link from 'next/link';
import { ArtImage } from '../components/site.js';
import { LaunchButton } from '../components/launch-button.js';
import { byTokenId } from '../lib/cast.js';

export default function HomePage() {
  const hero = byTokenId('777');
  return <main className="section landing">
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow">YOUR CHOG. YOUR PLAN. YOUR FIGHT.</div>
        <h1 className="display">TRAITS SET<br />THE <span style={{ color: 'var(--gold)' }}>TERMS.</span></h1>
        <p className="lead">A real Chog NFT enters the arena with its own traits. Choose a plan, read the replay, and see how the fight unfolds.</p>
        <div className="hero-actions"><Link className="btn primary" href="/pick">PICK YOUR CHOG</Link><LaunchButton className="btn secondary">RUN TONIGHT&apos;S FIGHTS NOW</LaunchButton></div>
        <div className="proof-row" aria-label="Trait to effect example"><span>Thug eyes</span><span className="proof-arrow">→</span><strong>PUNCH +10</strong><span className="proof-arrow">→</span><strong>Stare Down</strong></div>
      </div>
      <div className="hero-art"><div className="hero-art-frame"><ArtImage tokenId={hero.tokenId} name={hero.metadata.name} /><div className="hero-art-label"><span className="tag gold">REAL CHOG NFT</span><strong>{hero.metadata.name}</strong><span className="caption">{hero.metadata.attributes.filter((a) => ['Body', 'Eyes'].includes(a.trait_type)).map((a) => a.value).join(' / ')}</span></div></div><div className="orbit orbit-one" /><div className="orbit orbit-two" /></div>
    </section>
    <section className="steps surface"><div className="eyebrow">THE SYSTEM</div><div className="step-line">
      {[['01','DISCOVER','Pick a Chog from the cast.'],['02','UNDERSTAND','See the trait sources behind its stats.'],['03','STRATEGIZE','Choose temperament, move, and risk.'],['04','CHECK','Review the event log and each effect.'],['05','RISK','Every plan has trade-offs.']].map(([n, title, copy]) => <article key={n}><span>{n}</span><h2 className="display">{title}</h2><p>{copy}</p></article>)}
    </div></section>
    <section className="cta-row"><div><div className="eyebrow">THE NEXT NIGHT STARTS WITH A PLAN</div><h2 className="display">READY TO COACH?</h2></div><Link className="btn primary" href="/coach">OPEN THE COACH</Link></section>
  </main>;
}
