import { describe, expect, it } from 'vitest';
import { computeStats } from '../src/stats.js';
import type { TraitAttribute } from '../src/types.js';
const attrs=(values:Record<string,string>):TraitAttribute[]=>Object.entries(values).map(([trait_type,value])=>({trait_type,value}));
describe('trait stat mapping',()=>{
  it('matches the worked example in TRAIT_MAPPING.md',()=>{
    const r=computeStats(attrs({Body:'Dragon suit',Eyes:'fire laser',Head:'Plumber',Mouth:'Grit',Aura:'Fire',Accessory:'Green Candle',Tier:'Uncommon'}));
    expect(r.stats).toEqual({GRIT:57,PUNCH:52,SWIFT:41,NERVE:49});
  });
  it('uses Unknown fallback rows for unmapped Body, Head, Mouth, Eyes and Accessory',()=>{
    const r=computeStats(attrs({Body:'new jacket',Eyes:'new eyes',Head:'new hat',Mouth:'new mouth',Accessory:'new item',Tier:'Common'}));
    expect(r.stats).toEqual({GRIT:48,PUNCH:49,SWIFT:44,NERVE:46});
    expect(r.classes.body).toBe('Unknown'); expect(r.classes.head).toBe('Unknown');
    expect(r.classes.eyes).toBe('Neutral'); expect(r.classes.mouth).toBe('neutral'); expect(r.classes.accessory).toBe('trinket');
    expect(r.bonuses.some(b=>b.trait==='Body'&&b.amount===4)).toBe(true);
    expect(r.bonuses.some(b=>b.trait==='Head'&&b.amount===4)).toBe(true);
    expect(r.bonuses.some(b=>b.trait==='Accessory'&&b.amount===4)).toBe(true);
  });
  it('treats Naked Yes and missing Body as Bare and keeps Background cosmetic',()=>{
    const a=computeStats(attrs({Body:'Dragon suit',Naked:'Yes',Eyes:'Base',Tier:'Common',Background:'red'}));
    const b=computeStats(attrs({Eyes:'Base',Tier:'Common',Background:'blue'}));
    expect(a.classes.body).toBe('Bare'); expect(a.stats.GRIT).toBe(38); expect(a.stats.SWIFT).toBe(56);
    expect(a.stats.NERVE).toBe(48);
    expect(b.classes.body).toBe('Bare'); expect(b.stats).toEqual({GRIT:38,PUNCH:49,SWIFT:56,NERVE:48});
  });
  it('exports source-trait bonus chips for each non-zero contribution',()=>{
    const r=computeStats(attrs({Body:'Red Sleeveless',Eyes:'Thug',Head:'Rainbow Wig',Mouth:'Bubblegum',Tier:'Uncommon'}));
    expect(r.bonuses).toContainEqual({stat:'SWIFT',amount:14,trait:'Body',value:'Red Sleeveless',reason:'Light body'});
    expect(r.bonuses.some(b=>b.trait==='Eyes'&&b.stat==='PUNCH'&&b.amount===10)).toBe(true);
    expect(r.bonuses.some(b=>b.trait==='Tier'&&b.amount===1)).toBe(true);
  });
  it('clamps all stats to the documented 20–95 range',()=>{
    const r=computeStats(attrs({Body:'Squid Game Guard',Eyes:'fire laser',Head:'Rainbow Wig',Mouth:'Grit',Tier:'Uncommon'}));
    for(const value of Object.values(r.stats)) { expect(value).toBeGreaterThanOrEqual(20); expect(value).toBeLessThanOrEqual(95); }
  });
});
