import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulate } from '../src/fight.js';
import { createRng } from '../src/rng.js';
import { computeStats } from '../src/stats.js';
import type { Fighter, Move, Plan, TraitAttribute } from '../src/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const sample = JSON.parse(await readFile(resolve(here, '../data/traits.sample.json'), 'utf8')) as Array<{tokenId:string;name:string;attributes:Record<string,string>}>;
const core: Move[] = ['Headbutt','Quick Feet','Iron Hide'];
const risks = ['Safe','Even','Gamble'] as const;
const temperaments = ['Feisty','Cool','Wild'] as const;
function toFighter(token: typeof sample[number]): Fighter {
  const attrs = Object.entries(token.attributes).map(([trait_type,value]) => ({trait_type,value})) as TraitAttribute[];
  const stat = computeStats(attrs);
  const eye = token.attributes.Eyes;
  const signature = ({'fire laser':'Laser Stare','Green laser':'Laser Stare','cyan laser':'Laser Stare','Purple laser':'Laser Stare','BTC Glass':'Scan','3D Glass':'Scan','Modern VR':'Scan','Anime Glass':'Scan','Heart':'Charm','Happy':'Charm','Smirk':'Charm','XD':'Charm','Round Tear':'Charm','Thug':'Stare Down','Side Eye':'Stare Down','Dead':'Stare Down','Vertical':'Stare Down','MOG':'Stare Down','Retard':'Chaos Gaze'} as Record<string, Fighter['signature']>)[eye] ?? null;
  return {tokenId:token.tokenId,name:token.name,stats:stat.stats,voiceClass:stat.classes.mouth,aura:stat.classes.aura,accessory:stat.classes.accessory,signature,tier:token.attributes.Tier ?? 'Common'};
}
function randomPlan(rng: ReturnType<typeof createRng>, fighter: Fighter): Plan {
  const moves: Move[] = [...core, ...(fighter.signature ? [fighter.signature] : [])];
  return { temperament: temperaments[rng.int(temperaments.length)], move: moves[rng.int(moves.length)], risk: risks[rng.int(risks.length)] };
}
const fighters = sample.map(toFighter);
const stats = new Map(fighters.map(f => [f.tokenId, f.stats.GRIT + f.stats.PUNCH + f.stats.SWIFT + f.stats.NERVE]));
const wins = new Map(fighters.map(f => [f.tokenId, 0]));
let fights = 0, koCount = 0, lowerWins = 0, lowerTotalFights = 0;
const started = Date.now();
for (let i=0;i<fighters.length;i++) for (let j=i+1;j<fighters.length;j++) {
  const left=fighters[i], right=fighters[j];
  for (let seed=0;seed<100;seed++) {
    const planRng=createRng(`plans:${left.tokenId}:${right.tokenId}:${seed}`);
    const result=simulate(left,right,randomPlan(planRng,left),randomPlan(planRng,right),`fight:${left.tokenId}:${right.tokenId}:${seed}`);
    fights++; if(result.summary.ko) koCount++;
    wins.set(result.summary.winner==='a'?left.tokenId:right.tokenId,(wins.get(result.summary.winner==='a'?left.tokenId:right.tokenId)??0)+1);
    const ls=stats.get(left.tokenId)!, rs=stats.get(right.tokenId)!;
    if(ls!==rs){ lowerTotalFights++; if((ls<rs && result.summary.winner==='a')||(rs<ls&&result.summary.winner==='b')) lowerWins++; }
  }
}
const rows=fighters.map(f=>({id:f.tokenId,name:f.name,total:stats.get(f.tokenId)!,wins:wins.get(f.tokenId)!,rate:(wins.get(f.tokenId)!/(fighters.length-1)/100)*100})).sort((x,y)=>x.id.localeCompare(y.id,undefined,{numeric:true}));
console.log(`ChogBound balance simulation — ${fights.toLocaleString()} fights, ${fighters.length} tokens, ${Date.now()-started} ms`);
console.log('Token | Name | Base total | Wins | Win rate');
console.log('---|---|---:|---:|---:');
for(const r of rows) console.log(`${r.id} | ${r.name} | ${r.total} | ${r.wins}/2300 | ${r.rate.toFixed(2)}%`);
console.log('');
console.log(`Overall KO rate: ${(koCount/fights*100).toFixed(2)}% (${koCount}/${fights})`);
console.log(`Lower-total fighter win rate: ${(lowerWins/lowerTotalFights*100).toFixed(2)}% (${lowerWins}/${lowerTotalFights}; excludes equal-total pairs)`);
console.log(`Per-token target (35–65%): ${rows.every(r=>r.rate>=35&&r.rate<=65)?'PASS':'FAIL'}`);
console.log(`Lower-total target (35–45%): ${lowerWins/lowerTotalFights>=.35&&lowerWins/lowerTotalFights<=.45?'PASS':'FAIL'}`);
console.log(`KO target (5–25%): ${koCount/fights>=.05&&koCount/fights<=.25?'PASS':'FAIL'}`);
