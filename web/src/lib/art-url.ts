/**
 * Chog art is never stored in this repo. It is loaded at runtime from the public IPFS metadata.
 * Pattern seen on chain for tokens 1462 and 1769: ipfs://<IMAGE_CID>/<number in the name>.webp
 * The number in the name differs from the on-chain token id (for example token 308 is named CHOG #1769).
 */
export const IMAGE_CID = 'bafybeihau2egcccbdxymeckmmbrqytbfor5gkt3en6d5fsbueymdbq7g6e';
/** Pinata answered first from a real machine; the rest are the gateways the metadata scan used. */
export const IPFS_GATEWAYS = ['https://gateway.pinata.cloud/ipfs/', 'https://w3s.link/ipfs/', 'https://4everland.io/ipfs/', 'https://ipfs.io/ipfs/', 'https://dweb.link/ipfs/'];

export function chogNumberFromName(name: string): number | null {
  const match = name.match(/CHOG #(\d+)/i);
  return match ? Number(match[1]) : null;
}
/** Candidate image URLs in the order they should be tried. Empty when the name has no number. */
export function artUrls(name: string): string[] {
  const n = chogNumberFromName(name);
  return n === null ? [] : IPFS_GATEWAYS.map((g) => `${g}${IMAGE_CID}/${n}.webp`);
}

/** First URL that loads, trying them in order. `tryLoad` is injected so this can be tested without a browser. */
export async function resolveFirstLoadable(urls: string[], tryLoad: (url: string) => Promise<boolean>): Promise<string | null> {
  for (const url of urls) { if (await tryLoad(url)) return url; }
  return null;
}
/** Browser image probe with a timeout, so a slow gateway moves on to the next one instead of leaving a blank frame. */
export function loadImage(url: string, timeoutMs = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => { img.onload = null; img.onerror = null; img.src = ''; resolve(false); }, timeoutMs);
    img.onload = () => { clearTimeout(timer); resolve(true); };
    img.onerror = () => { clearTimeout(timer); resolve(false); };
    img.referrerPolicy = 'no-referrer';
    img.src = url;
  });
}
