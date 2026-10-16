// Read-only check of the Chog Genesis contract on Monad mainnet. No wallet, no gas, no ownership needed.
// Usage: node scripts/verify-contract.mjs [tokenId ...]   (default tokens: 1 308 1798)
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RPCS = ['https://rpc.monad.xyz', 'https://rpc1.monad.xyz', 'https://rpc-mainnet.monadinfra.com'];
const CONTRACT = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763';
const GATEWAYS = ['https://gateway.pinata.cloud/ipfs/', 'https://w3s.link/ipfs/', 'https://4everland.io/ipfs/', 'https://ipfs.io/ipfs/', 'https://dweb.link/ipfs/'];
const here = dirname(fileURLToPath(import.meta.url));

export async function rpc(method, params, fetchImpl = fetch) {
  let lastError;
  for (const url of RPCS) {
    try {
      const res = await fetchImpl(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.result;
    } catch (e) { lastError = e; }
  }
  throw new Error(`All RPC endpoints failed: ${lastError?.message}`);
}
export const pad = (n) => BigInt(n).toString(16).padStart(64, '0');
export function decodeString(hex) {
  const data = hex.slice(2); const offset = Number(BigInt('0x' + data.slice(0, 64))) * 2;
  const len = Number(BigInt('0x' + data.slice(offset, offset + 64)));
  return Buffer.from(data.slice(offset + 64, offset + 64 + len * 2), 'hex').toString('utf8');
}
export const decodeAddress = (hex) => '0x' + hex.slice(-40);
const call = (data) => rpc('eth_call', [{ to: CONTRACT, data }, 'latest']);

async function metadata(uri) {
  const path = uri.startsWith('ipfs://') ? uri.slice(7) : null;
  const urls = path ? GATEWAYS.map((g) => g + path) : [uri];
  for (const u of urls) { try { const r = await fetch(u, { signal: AbortSignal.timeout(20000) }); if (r.ok) return { json: await r.json(), source: u }; console.log(`  gateway ${new URL(u).host}: HTTP ${r.status}`); } catch (e) { console.log(`  gateway ${new URL(u).host}: ${e.name === 'TimeoutError' ? 'timeout' : e.message}`); } }
  return null;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['1', '308', '1798'];
  const full = JSON.parse(readFileSync(resolve(here, '../traits.full.json'), 'utf8'));
  console.log('Chain id:', parseInt(await rpc('eth_chainId', []), 16), '(expected 143)');
  console.log('Contract code present:', (await rpc('eth_getCode', [CONTRACT, 'latest'])).length > 4);
  console.log('name():', decodeString(await call('0x06fdde03')), '| symbol():', decodeString(await call('0x95d89b41')));
  try { console.log('totalSupply():', BigInt(await call('0x18160ddd')).toString(), '(expected 1969)'); } catch { console.log('totalSupply(): not available'); }
  for (const id of ids) {
    console.log(`\nToken ${id}`);
    try { console.log('  ownerOf:', decodeAddress(await call('0x6352211e' + pad(id)))); } catch (e) { console.log('  ownerOf failed:', e.message); }
    let uri; try { uri = decodeString(await call('0xc87b56dd' + pad(id))); console.log('  tokenURI:', uri); } catch (e) { console.log('  tokenURI failed:', e.message); continue; }
    const m = await metadata(uri);
    if (!m) { console.log('  metadata: could not fetch from any gateway'); continue; }
    const chainTraits = JSON.stringify((m.json.attributes ?? []).map((a) => [a.trait_type, a.value]));
    const local = full[id]; const localTraits = local ? JSON.stringify(local.attributes.map((a) => [a.trait_type, a.value])) : null;
    console.log(`  on-chain name: ${m.json.name} | traits.full.json name: ${local?.name ?? '(missing)'}`);
    console.log('  traits match traits.full.json:', localTraits === chainTraits ? 'YES' : 'NO (token id key does not map to this token)');
    console.log('  image field:', m.json.image);
    console.log('  fetched via:', new URL(m.source).host);
  }
}
