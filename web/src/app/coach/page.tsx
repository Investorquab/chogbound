'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArtImage, StatGrid } from '../../components/site.js';
import { byTokenId, cast, CORE_MOVES, DEFAULT_PLAN, rivalFor, safeStorageGet, safeStorageSet, statBreakdown, traitRows, traitSummary } from '../../lib/cast.js';
import { LaunchButton } from '../../components/launch-button.js';
import { LOCKED_PLAN_KEY, SELECTED_TOKEN_KEY, runComparison } from '../../lib/fight-store.js';
import type { Move, Plan, Risk, Temperament } from 'chogbound-sim/src/types.js';

const temperamentInfo: Record<Temperament, string> = {
  Feisty: '+10% damage in rounds 1 to 3, then -10% in rounds 6 to 8.',
  Cool: '-10% damage taken in rounds 1 to 3, then +10% on first action after being hit.',
  Wild: 'Ignores the planned move and picks a core move uniformly.',
};
const moveInfo: Record<string, string> = {
  Headbutt: 'PUNCH based attack.',
  'Quick Feet': 'SWIFT based attack.',
  'Iron Hide': 'GRIT based attack and 20% less damage from the next hit.',
  'Laser Stare': 'Signature from laser eyes. The opening attack auto-hits.',
  Scan: 'Signature that reveals the rival plan.',
  Charm: 'Signature that reduces rival NERVE for early rounds.',
  'Stare Down': 'Signature from intimidating eyes. Rival first attack loses hit chance.',
  'Chaos Gaze': 'Signature with a high-risk coin-flip attack.',
};
const riskInfo: Record<Risk, string> = { Safe: '±5% damage variance.', Even: '±15% damage variance.', Gamble: '±30% variance and +10% crit chance.' };

export default function CoachPage() {
  const [selectedId, setSelectedId] = useState('640');
  const [compareId, setCompareId] = useState('777');
  const [plan, setPlan] = useState<Plan>(DEFAULT_PLAN);
  const [locked, setLocked] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof runComparison> | null>(null);
  useEffect(() => {
    try {
      const requested = new URLSearchParams(window.location.search).get('chog');
      const chosen = requested ?? window.localStorage.getItem(SELECTED_TOKEN_KEY) ?? '640';
      setSelectedId(chosen);
      if (requested) safeStorageSet(SELECTED_TOKEN_KEY, requested);
      const saved = window.localStorage.getItem(LOCKED_PLAN_KEY);
      if (saved) { const parsed = JSON.parse(saved) as { plan?: Plan; locked?: boolean }; setPlan(parsed.plan ?? DEFAULT_PLAN); setLocked(parsed.locked === true); }
    } catch { setPlan(DEFAULT_PLAN); setLocked(false); }
  }, []);
  useEffect(() => { if (compareId === selectedId) setCompareId(rivalFor(selectedId).tokenId); }, [selectedId, compareId]);
  const selected = byTokenId(selectedId);
  const compared = byTokenId(compareId);
  const rival = rivalFor(selectedId, compareId);
  const moveOptions = useMemo(() => [...CORE_MOVES, ...(selected.fighter.signature ? [selected.fighter.signature] : [])] as Move[], [selected.fighter.signature]);
  const breakdown = statBreakdown(selected);
  const rows = traitRows(selected);
  const firstAttrs = Object.fromEntries(selected.metadata.attributes.map((a) => [a.trait_type, a.value]));
  const secondAttrs = Object.fromEntries(compared.metadata.attributes.map((a) => [a.trait_type, a.value]));
  const traitNames = [...new Set([...Object.keys(firstAttrs), ...Object.keys(secondAttrs)])];

  function updatePlan(key: keyof Plan, value: Plan[keyof Plan]) {
    setPlan((old) => ({ ...old, [key]: value } as Plan));
    setResults(null);
  }
  function lockPlan() {
    const saved = safeStorageSet(LOCKED_PLAN_KEY, JSON.stringify({ plan, locked: true }));
    setLocked(true);
    setResults(null);
    if (!saved) setLocked(true);
  }
  function editPlan() {
    setLocked(false);
    safeStorageSet(LOCKED_PLAN_KEY, JSON.stringify({ plan, locked: false }));
  }
  function runBoth() { setResults(runComparison(selectedId, compareId, rival.tokenId, plan)); }

  return <main className="section">
    <div className="section-head"><div><div className="eyebrow">COACHING DESK</div><h1 className="display">KNOW THE TRAITS.<br />LOCK THE PLAN.</h1></div><span className="pill">PLAN PREVIEW</span></div>
    <div className="coach-layout">
      <aside className="coach-art-card surface sticky-art"><div className="art-tile coach-art-tile" style={{ '--stage': '#41305d' } as import('react').CSSProperties}><ArtImage tokenId={selected.tokenId} name={selected.metadata.name} /></div><div className="coach-art-meta"><div><div className="eyebrow">YOUR CHOG</div><h2 className="display">{selected.metadata.name}</h2></div></div><p className="caption">{traitSummary(selected)}</p><StatGrid entry={selected} /></aside>
      <div className="coach-main">
        <section className="surface panel"><div className="eyebrow">TRAIT SHEET</div><h2 className="display panel-title">TRAITS THAT SHAPE THE FIGHT</h2><div className="table-wrap"><table><thead><tr><th>Trait</th><th>Value</th><th>Class</th><th>Effect</th></tr></thead><tbody>{rows.map((row) => <tr key={row.trait}><td>{row.trait}</td><td>{row.value}</td><td>{row.className}</td><td>{row.effect}</td></tr>)}</tbody></table></div><p className="caption">The Cosmetic row has no stat effect.</p>
          <div className="source-chip-list"><div className="eyebrow">STAT SOURCES</div>{breakdown.map(({ stat, total, bonuses }) => <div className="source-stat" key={stat}><strong>{stat} <span>{total}</span></strong><div className="chips"><span className="chip base">BASE 40</span>{bonuses.map((b, i) => <span className={`chip ${b.trait === 'Tier' ? 'tier' : ''}`} key={`${stat}-${b.trait}-${i}`}>{b.trait} {b.amount > 0 ? '+' : ''}{b.amount}</span>)}</div></div>)}</div>
        </section>
        <section className="surface panel"><div className="eyebrow">LOCK YOUR PLAN</div>
          <div className="input-section"><div className="input-title"><h2>TEMPERAMENT</h2></div><div className="choice-group">{(['Feisty', 'Cool', 'Wild'] as const).map((value) => <button key={value} type="button" aria-pressed={plan.temperament === value} disabled={locked} className="choice" onClick={() => updatePlan('temperament', value)}><strong>{value}</strong><span>{temperamentInfo[value]}</span></button>)}</div></div>
          <div className="input-section"><div className="input-title"><h2>MOVE</h2></div><div className="choice-group move-group">{moveOptions.map((value) => <button key={value} type="button" aria-pressed={plan.move === value} disabled={locked} className="choice" onClick={() => updatePlan('move', value)}><strong>{value}</strong><span>{moveInfo[value] ?? 'Signature move.'}</span></button>)}</div></div>
          <div className="input-section"><div className="input-title"><h2>RISK</h2></div><div className="choice-group">{(['Safe', 'Even', 'Gamble'] as const).map((value) => <button key={value} type="button" aria-pressed={plan.risk === value} disabled={locked} className="choice" onClick={() => updatePlan('risk', value)}><strong>{value}</strong><span>{riskInfo[value]}</span></button>)}</div></div>
          <div className="lock-state" aria-live="polite">{locked ? 'Plan locked for tonight.' : 'Plan ready to lock.'}</div><div className="hero-actions"><button className="btn primary" type="button" onClick={lockPlan} disabled={locked}>LOCK PLAN</button><button className="btn secondary" type="button" onClick={editPlan} disabled={!locked}>EDIT PLAN</button></div>
          <LaunchButton className="btn primary play-big play-wide" plan={plan} beforeLaunch={lockPlan}>PLAY TONIGHT&apos;S FIGHT</LaunchButton>
        </section>
        <section className="surface panel compare-panel"><div className="eyebrow">SWAP TEST PROOF</div><h2 className="display panel-title">SAME PLAN. DIFFERENT CHOG.</h2><p className="caption">Choose a second Chog to compare traits and stat sources. Both columns use the same current plan against the same rival.</p><label className="eyebrow" htmlFor="compare-select">SECOND CHOG</label><select id="compare-select" value={compareId} onChange={(event) => { setCompareId(event.target.value); setResults(null); }}>{cast.filter((entry) => entry.tokenId !== selectedId).map((entry) => <option key={entry.tokenId} value={entry.tokenId}>{entry.metadata.name}</option>)}</select>
          <div className="compare-pair"><div className="compare-fighter"><ArtImage tokenId={selected.tokenId} name={selected.metadata.name} /><strong>{selected.metadata.name}</strong><StatGrid entry={selected} /></div><div className="compare-vs">VS</div><div className="compare-fighter"><ArtImage tokenId={compared.tokenId} name={compared.metadata.name} /><strong>{compared.metadata.name}</strong><StatGrid entry={compared} /></div></div>
          <div className="trait-diff"><div className="eyebrow">TRAIT DIFFERENCES</div><div className="table-wrap"><table><thead><tr><th>Trait</th><th>{selected.metadata.name}</th><th>{compared.metadata.name}</th></tr></thead><tbody>{traitNames.map((trait) => <tr key={trait}><td>{trait}</td><td>{firstAttrs[trait] ?? 'None'}</td><td>{secondAttrs[trait] ?? 'None'}</td></tr>)}</tbody></table></div></div>
          <div className="result-row"><div><strong>Result comes from the simulator.</strong><div className="caption">Shared rival: {rival.metadata.name}</div></div><button className="btn primary" type="button" onClick={runBoth}>RUN BOTH</button></div><div aria-live="polite" className="caption" id="compare-status">{results ? 'Two simulator results are ready.' : 'Awaiting simulator output.'}</div>
          {results && <div className="compare-results" data-testid="compare-results">{results.map(({ you, rival: commonRival, result }) => <article className="surface-lite compare-result" key={you.tokenId}><div className="eyebrow">{you.metadata.name} VS {commonRival.metadata.name}</div><strong>{result.summary.winner === 'a' ? you.metadata.name : commonRival.metadata.name} wins</strong><span>{result.summary.rounds} rounds · {result.summary.final_hp.a} / {result.summary.final_hp.b} HP</span><span>{result.events.length} real events</span></article>)}</div>}
        </section>
      </div>
    </div>
  </main>;
}
