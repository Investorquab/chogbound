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
