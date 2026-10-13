import { describe, expect, it } from 'vitest';
import { simulate } from '../src/fight.js';
import { classifyNarration, renderNarration, renderNarrationKind } from '../src/narration.js';
import { computeStats } from '../src/stats.js';
import { createRng } from '../src/rng.js';
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
   const allowed=Object.values(e.vars).filter(v=>typeof v==='number') as number[];
   for(const voice of ['fierce','smug','hustler','hungry','gloom','neutral'] as const){
    const text=renderNarration(e,voice,result.summary.seed);
    const numbers=[...text.matchAll(/\b\d+(?:\.\d+)?\b/g)].map(m=>Number(m[0]));
    for(const n of numbers) expect(allowed,`${voice}: narration number ${n} in event ${e.n}`).toContain(n);
   }
  }
 });
 it('changes the log when the fighter is swapped for a different Chog against the same rival',()=>{
  const first=JSON.stringify(simulate(a,b,plan(),plan(),777));
  const other=fighter('other',{Body:'Cream Tuxedo',Eyes:'fire laser',Mouth:'Grit',Tier:'Common'});
  expect(JSON.stringify(simulate(other,b,plan(),plan(),777))).not.toBe(first);
 });

 it('never performs Laser Stare more than once in any of 10,000 random-plan fights',()=>{
  const roster=[
   fighter('laser-a',{Eyes:'fire laser'}), fighter('laser-b',{Eyes:'Green laser'}),
   fighter('scan',{Eyes:'BTC Glass'}), fighter('plain',{Eyes:'Base'}),
   fighter('charm',{Eyes:'Heart'}), fighter('chaos',{Eyes:'Retard'}),
  ];
  const temps=['Feisty','Cool','Wild'] as const, risks=['Safe','Even','Gamble'] as const;
  for(let i=0;i<10000;i++){
   const rng=createRng(`laser-once:${i}`);
   const fa=roster[rng.int(roster.length)], fb=roster[rng.int(roster.length)];
   const randomPlan=(f:Fighter):Plan=>{
    const moves:Plan['move'][]=[...(['Headbutt','Quick Feet','Iron Hide'] as const),...(f.signature?[f.signature]:[])];
    return {temperament:temps[rng.int(temps.length)],move:moves[rng.int(moves.length)],risk:risks[rng.int(risks.length)]};
   };
   const result=simulate(fa,fb,randomPlan(fa),randomPlan(fb),`laser-fight:${i}`);
   for(const side of ['a','b'] as const){
    expect(result.events.filter(e=>e.actor===side&&e.move==='Laser Stare').length).toBeLessThanOrEqual(1);
   }
  }
 });
 it('keeps +10 in each individual stat within the v1.1 parity band over 6,000 random-plan seeds',()=>{
  const baseline:Fighter={tokenId:'baseline',name:'All 40',stats:{GRIT:40,PUNCH:40,SWIFT:40,NERVE:40},voiceClass:'neutral',aura:'none',accessory:'none',signature:null,tier:'Common'};
  const stats=['GRIT','PUNCH','SWIFT','NERVE'] as const;
  const temps=['Feisty','Cool','Wild'] as const, risks=['Safe','Even','Gamble'] as const;
  const randomPlan=(seed:string):Plan=>{const rng=createRng(seed);const moves=['Headbutt','Quick Feet','Iron Hide'] as const;return {temperament:temps[rng.int(temps.length)],move:moves[rng.int(moves.length)],risk:risks[rng.int(risks.length)]};};
  for(const stat of stats){
   const boosted:Fighter={...baseline,tokenId:`plus-${stat}`,name:`+10 ${stat}`,stats:{...baseline.stats,[stat]:50}};
   let wins=0;
   for(let seed=0;seed<6000;seed++){
    const result=simulate(boosted,baseline,randomPlan(`parity:${stat}:a:${seed}`),randomPlan(`parity:${stat}:b:${seed}`),`parity-fight:${stat}:${seed}`);
    if(result.summary.winner==='a')wins++;
   }
   const rate=wins/6000;
   expect(rate,`${stat} +10 win rate ${(rate*100).toFixed(2)}%`).toBeGreaterThanOrEqual(0.58);
   expect(rate,`${stat} +10 win rate ${(rate*100).toFixed(2)}%`).toBeLessThanOrEqual(0.67);
  }
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

 it('Laser Stare ignores and consumes Vanish dodge',()=>{
  const laser={...fighter('laser',{Eyes:'fire laser'}),stats:{...fighter('laser',{Eyes:'fire laser'}).stats,SWIFT:95}};
  const vanish=fighter('vanish',{Eyes:'Base',Aura:'Smoke',Body:'Squid Game Guard'});
  const result=simulate(laser,vanish,plan({temperament:'Wild',move:'Laser Stare'}),plan({temperament:'Wild'}),'laser-vanish-ruling');
  const laserEvent=result.events.find(e=>e.actor==='a'&&e.move==='Laser Stare');
  expect(laserEvent).toBeDefined();
  expect(laserEvent?.procs).toContain('laser-ignores-vanish');
  expect(laserEvent?.outcome).not.toBe('dodge');
  expect(result.events.some(e=>e.actor==='a'&&e.outcome==='dodge'&&e.procs.includes('vanish'))).toBe(false);
 });
 it('Lucky Flip never rerolls a Chaos Gaze coin-flip miss',()=>{
  const chaos=fighter('chaos',{Eyes:'Retard',Accessory:'Coin'});
  const rival=fighter('rival',{Eyes:'Base'});
  let witnessed=false;
  for(let seed=0;seed<500&&!witnessed;seed++){
   const result=simulate(chaos,rival,plan({move:'Chaos Gaze'}),plan(),`chaos-lucky-ruling:${seed}`);
   const miss=result.events.find(e=>e.actor==='a'&&e.move==='Chaos Gaze'&&e.procs.includes('chaos-gaze-miss'));
   if(miss){
    expect(miss.outcome).toBe('miss');
    expect(miss.procs).not.toContain('lucky-flip');
    witnessed=true;
   }
  }
  expect(witnessed).toBe(true);
 });
 it('selected Laser Stare opens on the owner first action under Wild',()=>{
  const base=fighter('wild-laser',{Eyes:'fire laser'});
  const laser={...base,stats:{...base.stats,SWIFT:95}};
  const rival=fighter('wild-rival',{Eyes:'Base',Body:'Squid Game Guard'});
  const result=simulate(laser,rival,plan({temperament:'Wild',move:'Laser Stare'}),plan({temperament:'Wild'}),'wild-laser-opening');
  const firstAction=result.events.find(e=>e.actor==='a'&&['opening','attack'].includes(e.action));
  expect(firstAction?.move).toBe('Laser Stare');
  expect(firstAction?.procs).toContain('laser-auto-hit');
 });
 it('has four distinct deterministic templates for every voice and narration kind',()=>{
  const voices=['fierce','smug','hustler','hungry','gloom','neutral'] as const;
  const kinds=['hit','crit','miss','dodge','proc','ko','win'] as const;
  const event={n:1,round:1,actor:'a' as const,action:'attack' as const,move:'Headbutt' as const,outcome:'hit' as const,damage:12,heal:0,hp_after:{a:88,b:0},procs:['test-proc'],narration_key:'hit.headbutt',vars:{damage:12,target_hp:0}};
  for(const voice of voices) for(const kind of kinds){
   const lines=new Set([0,1,2,3].map(n=>renderNarrationKind({...event,n:n+1},voice,kind,'template-seed')));
   expect(lines.size,`${voice} ${kind}`).toBe(4);
  }
 });
 it('never repeats consecutive narration lines for a voice and seed',()=>{
  const result=simulate(fighter('a',{Eyes:'fire laser',Aura:'Fire',Accessory:'Green Candle'}),fighter('b',{Aura:'Light Purple',Accessory:'Coin'}),plan({move:'Laser Stare',risk:'Gamble'}),plan({risk:'Gamble'}),'narration-consecutive-seed');
  for(const voice of ['fierce','smug','hustler','hungry','gloom','neutral'] as const){
   const lines=result.events.map(e=>renderNarration(e,voice,result.summary.seed));
   for(let i=1;i<lines.length;i++) expect(lines[i],`${voice} event ${i+1}`).not.toBe(lines[i-1]);
  }
 });
 it('narration category is derived from event outcomes and knockout HP',()=>{
  const result=simulate(a,b,plan(),plan(),'category-seed');
  for(const event of result.events){
   expect(['hit','crit','miss','dodge','proc','ko']).toContain(classifyNarration(event));
  }
 });

});
