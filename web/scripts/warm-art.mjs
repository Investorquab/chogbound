import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.argv[2];
if (!base) {
  console.error('Usage: node web/scripts/warm-art.mjs <base-url>');
  process.exit(1);
}
const baseUrl = new URL(base.endsWith('/') ? base : `${base}/`);
const traitsPath = fileURLToPath(new URL('../../traits.json', import.meta.url));
const metadata = JSON.parse(await readFile(traitsPath, 'utf8'));
const tokenIds = Object.keys(metadata);
let next = 0;
const worker = async () => {
  while (next < tokenIds.length) {
    const tokenId = tokenIds[next++];
    const url = new URL(`api/art/${encodeURIComponent(tokenId)}`, baseUrl);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
      const bytes = (await response.arrayBuffer()).byteLength;
      console.log(`${tokenId}\t${response.status}\t${bytes} bytes`);
    } catch (error) {
      console.log(`${tokenId}\tERROR\t${error instanceof Error ? error.message : String(error)}`);
    }
  }
};
await Promise.all(Array.from({ length: Math.min(6, tokenIds.length) }, worker));
console.log(`Warmed ${tokenIds.length} cast art endpoints from ${baseUrl.origin}`);
