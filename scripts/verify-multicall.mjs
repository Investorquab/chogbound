// Read-only: can one Multicall3 request return many ownerOf answers on Monad? No wallet or gas needed.
// Usage: node scripts/verify-multicall.mjs
import { createPublicClient, http, parseAbi, defineChain } from 'viem';

export const NFT = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763';
export const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';
const abi = parseAbi(['function ownerOf(uint256) view returns (address)']);
export const monad = defineChain({ id: 143, name: 'Monad', nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.monad.xyz'] } }, contracts: { multicall3: { address: MULTICALL3 } } });

/** Owner of every token id, in `chunk`-sized Multicall3 requests (one eth_call per chunk). */
export async function scanOwners(client, ids, chunk = 400) {
  const owners = new Map(); let failed = 0;
  for (let i = 0; i < ids.length; i += chunk) {
    const part = ids.slice(i, i + chunk);
    const results = await client.multicall({ allowFailure: true, batchSize: 1_000_000, multicallAddress: MULTICALL3, contracts: part.map((id) => ({ address: NFT, abi, functionName: 'ownerOf', args: [BigInt(id)] })) });
    results.forEach((r, k) => { if (r.status === 'success') owners.set(part[k], r.result.toLowerCase()); else failed++; });
  }
  return { owners, failed };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  let requests = 0;
  const base = http('https://rpc.monad.xyz');
  const counting = (opts) => { const t = base(opts); const orig = t.request; return { ...t, request: async (args) => { requests++; return orig(args); } }; };
  const client = createPublicClient({ chain: monad, transport: counting });
  const code = await client.getCode({ address: MULTICALL3 });
  console.log('Multicall3 deployed at canonical address:', !!code && code !== '0x');
  if (code && code !== '0x') {
    for (const chunk of [100, 400, 1000]) {
      requests = 0; const t = Date.now();
      try {
        const ids = Array.from({ length: Math.min(chunk, 1969) }, (_, i) => i + 1);
        const { owners, failed } = await scanOwners(client, ids, chunk);
        console.log(`chunk ${chunk}: ${owners.size} answered, ${failed} failed, ${requests} request(s), ${Date.now() - t} ms`);
      } catch (e) { console.log(`chunk ${chunk}: FAILED ${String(e.shortMessage ?? e.message).slice(0, 200)}`); }
      await new Promise((r) => setTimeout(r, 1500));
    }
    requests = 0; const t0 = Date.now();
    const { owners, failed } = await scanOwners(client, Array.from({ length: 1969 }, (_, i) => i + 1), 400);
    const wallet = '0x3d38fee3e1a4c43d8fcf715aa6c9ff025074e7e0';
    console.log(`\nFULL SCAN: ${owners.size} of 1969 owners found, ${failed} failed, ${requests} request(s), ${(Date.now() - t0) / 1000}s`);
    console.log('Tokens for test wallet:', JSON.stringify([...owners].filter(([, o]) => o === wallet).map(([id]) => id)), '(expected [1])');
    console.log('Distinct holders:', new Set(owners.values()).size);
  }
}
