import { describe, expect, it } from 'vitest';
import { simulate } from '../src/fight.js';
import { renderNarration } from '../src/narration.js';
import { computeStats } from '../src/stats.js';
import type { Fighter, Plan, TraitAttribute } from '../src/types.js';
const attrs=(values:Record<string,string>):TraitAttribute[]=>Object.entries(values).map(([trait_type,value])=>({trait_type,value}));
function fighter(id:string,values:Record<string,string>={}):Fighter {
 const all:Record<string,string>={Body:'Red Sleeveless',Eyes:'Thug',Head:'Rainbow Wig',Mouth:'Bubblegum',Tier:'Uncommon',...values};
 const s=computeStats(attrs(all)); const sig=({'fire laser':'Laser Stare','Green laser':'Laser Stare','cyan laser':'Laser Stare','Purple laser':'Laser Stare','BTC Glass':'Scan','3D Glass':'Scan','Modern VR':'Scan','Anime Glass':'Scan','Heart':'Charm','Happy':'Charm','Smirk':'Charm','XD':'Charm','Round Tear':'Charm','Thug':'Stare Down','Side Eye':'Stare Down','Dead':'Stare Down','Vertical':'Stare Down','MOG':'Stare Down','Retard':'Chaos Gaze'} as Record<string,Fighter['signature']>)[all.Eyes]??null;
 const aura=({'Fire':'scorch','Burning Aura':'scorch','Wind':'gust','Smoke':'vanish','Aqua Aura':'calm-glow','Mint':'calm-glow','Light Purple':'calm-glow'} as Record<string,Fighter['aura']>)[all.Aura??'']??'none';
 const accessory=({'Green Candle':'pump','Coin':'lucky-flip','Fwog':'sidekick','SB':'trinket'} as Record<string,Fighter['accessory']>)[all.Accessory??'']??(all.Accessory?'trinket':'none');
 return {tokenId:id,name:`Fighter ${id}`,stats:s.stats,voiceClass:s.classes.mouth,aura,accessory,signature:sig,tier:all.Tier};
}
const plan=(over:Partial<Plan>={}):Plan=>({temperament:'Feisty',move:'Headbutt',risk:'Even',...over});
const a=fighter('a'),b=fighter('b',{Body:'Squid Game Guard',Eyes:'Base',Head:'MCGA',Mouth:'Grit'});
describe('fight engine',()=>{
 it('is byte-identical for the same inputs and seed across 1,000 reruns',()=>{
  const initial=simulate(a,b,plan(),plan({temperament:'Cool',move:'Iron Hide'}),'determinism-seed');
  const first=JSON.stringify(initial);
  expect(JSON.stringify(simulate(a,b,plan(),plan({temperament:'Cool',move:'Iron Hide'}),initial.summary.seed))).toBe(first);
  for(let i=0;i<1000;i++) expect(JSON.stringify(simulate(a,b,plan(),plan({temperament:'Cool',move:'Iron Hide'}),'determinism-seed'))).toBe(first);
 });
 it('supports event HP accounting and bounds over 10,000 randomized fights',()=>{
  const temps=['Feisty','Cool','Wild'] as const, core=['Headbutt','Quick Feet','Iron Hide'] as const, risks=['Safe','Even','Gamble'] as const;
  const roster=[a,b,fighter('fire',{Eyes:'fire laser',Aura:'Fire',Accessory:'Green Candle',Mouth:'Sad'}),fighter('wind',{Eyes:'Retard',Aura:'Wind',Accessory:'Fwog',Mouth:'Grit'}),fighter('smoke',{Eyes:'Heart',Aura:'Smoke',Accessory:'Coin',Mouth:'Smile'}),fighter('glow',{Eyes:'BTC Glass',Aura:'Light Purple',Accessory:'SB',Mouth:'Flat'})];
  const randomPlan=(index:number,f:Fighter):Plan=>{ const moves:Plan['move'][]=[...core,...(f.signature?[f.signature]:[])]; return plan({temperament:temps[index%3],move:moves[(index*5)%moves.length],risk:risks[(index*7)%3]}); };
  for(let i=0;i<10000;i++) {
   const fa=roster[i%roster.length], fb=roster[(i*3+1)%roster.length];
   const pa=randomPlan(i,fa); const pb=randomPlan(i+1,fb);
   const result=simulate(fa,fb,pa,pb,`fuzz-${i}`); let hp={a:100,b:100}; const once=new Set<string>();
   for(const e of result.events){
    const expected={...hp};
    if(e.action==='heal'){ expected[e.actor]+=e.heal; }
    else if(e.damage>0){ const target=e.actor==='a'?'b':'a'; expected[target]-=e.damage; }
    expect(e.hp_after).toEqual(expected);
    expect(e.hp_after.a).toBeGreaterThanOrEqual(0); expect(e.hp_after.a).toBeLessThanOrEqual(100);
    expect(e.hp_after.b).toBeGreaterThanOrEqual(0); expect(e.hp_after.b).toBeLessThanOrEqual(100);
    hp={...e.hp_after};
    for(const p of e.procs) if(['pump','lucky-flip','vanish','laser-auto-hit','calm-glow','scorch-armed','scan-reveal'].includes(p)){ expect(once.has(`${e.actor}:${p}`)).toBe(false); once.add(`${e.actor}:${p}`); }
    expect(e.n).toBe(result.events.indexOf(e)+1);
   }
   expect(result.summary.final_hp).toEqual(hp); expect(result.summary.rounds).toBeLessThanOrEqual(8);
  }
 });
 it('uses source event variables for every narrated number',()=>{
  const result=simulate(fighter('scan',{Eyes:'BTC Glass',Aura:'Fire',Accessory:'Green Candle'}),fighter('glow',{Aura:'Light Purple'}),plan({move:'Scan'}),plan(),44);
  for(const e of result.events){
   const text=renderNarration(e,e.actor==='a'?fighter('scan',{Eyes:'BTC Glass',Aura:'Fire',Accessory:'Green Candle'}).voiceClass:fighter('glow',{Aura:'Light Purple'}).voiceClass);
   const numbers=[...text.matchAll(/\b\d+(?:\.\d+)?\b/g)].map(m=>Number(m[0]));
   const allowed=Object.values(e.vars).filter(v=>typeof v==='number') as number[];
   for(const n of numbers) expect(allowed).toContain(n);
  }
 });
 it('changes the log when the fighter is swapped for a different Chog against the same rival',()=>{
  const first=JSON.stringify(simulate(a,b,plan(),plan(),777));
  const other=fighter('other',{Body:'Cream Tuxedo',Eyes:'fire laser',Mouth:'Grit',Tier:'Common'});
  expect(JSON.stringify(simulate(other,b,plan(),plan(),777))).not.toBe(first);
 });
 it('rejects a signature plan that does not belong to the fighter',()=>{
  expect(()=>simulate(a,b,plan({move:'Laser Stare'}),plan(),13)).toThrow();
 });
 it('has a move-independent signature effect when a signature is selected',()=>{
  const scan=fighter('scan',{Eyes:'BTC Glass'}); const result=simulate(scan,b,plan({move:'Scan'}),plan(),13);
  expect(result.events.some(e=>e.action==='opening'&&e.narration_key==='signature.scan')).toBe(true);
 });
 it('records Calm Glow healing as a separate event after HP falls below 40',()=>{
  const glow=fighter('glow',{Aura:'Light Purple'}); let found=false;
  for(let seed=0;seed<500&&!found;seed++) { const r=simulate(glow,fighter('heavy',{Body:'Squid Game Guard',Eyes:'fire laser',Mouth:'Grit'}),plan({risk:'Gamble'}),plan({move:'Laser Stare',risk:'Gamble'}),seed); found=r.events.some(e=>e.action==='heal'&&e.move==='Calm Glow'&&e.heal===10); }
  expect(found).toBe(true);
 });
 it('measures temperament impact across 1,000 fixed seeds (section 10.5)',()=>{
  const left=fighter('plan-left',{Body:'Cream Tuxedo',Eyes:'fire laser',Mouth:'Grit',Aura:'Wind'}); const right=fighter('plan-right',{Body:'Squid Game Guard',Eyes:'Base',Mouth:'Sad',Aura:'Smoke'});
  const rates:Record<string,number>={};
  for(const temperament of ['Feisty','Cool','Wild'] as const){ let wins=0; for(let seed=0;seed<1000;seed++){ const r=simulate(left,right,plan({temperament,move:'Headbutt',risk:'Even'}),plan({temperament:'Cool',move:'Iron Hide',risk:'Even'}),seed); if(r.summary.winner==='a') wins++; } rates[temperament]=wins/1000; }
  const spread=Math.max(...Object.values(rates))-Math.min(...Object.values(rates));
  expect(spread).toBeGreaterThanOrEqual(0.02);
 });
});
