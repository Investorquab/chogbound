import { describe, expect, it } from 'vitest';
import { displayName, fighterFromToken } from 'chogbound-sim/src/stats.js';
import { chogSource } from '../src/lib/chog-ids';

const total = (id: string) => { const s = fighterFromToken(id, chogSource[id]).stats; return s.GRIT + s.PUNCH + s.SWIFT + s.NERVE; };
describe('holder Chogs fight with their real traits', () => {
  it('token 308 (CHOG #1769) has the stats the wallet e2e test expects', () => {
    expect(fighterFromToken('308', chogSource['308']).stats).toEqual({ GRIT: 36, PUNCH: 49, SWIFT: 54, NERVE: 50 });
    expect(total('308')).toBe(189);
  });
  it('a Legendary uses its fixed kit and shows its name without an em dash', () => {
    const krown = fighterFromToken('1798', chogSource['1798']);
    expect(krown.stats).toEqual({ GRIT: 50, PUNCH: 50, SWIFT: 46, NERVE: 58 });
    expect(krown.signature).toBe('Scan'); expect(krown.aura).toBe('calm-glow'); expect(krown.accessory).toBe('pump');
    expect(displayName(chogSource['1798'].name)).toBe('CHOG #1290 / Krown');
  });
  it('two different Chogs produce different fighters, so the NFT decides the fight', () => {
    expect(fighterFromToken('308', chogSource['308']).stats).not.toEqual(fighterFromToken('1', chogSource['1']).stats);
  });
});
