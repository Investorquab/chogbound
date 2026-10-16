// Read-only: how can a wallet find its Chogs on Monad? No wallet or gas needed.
// Usage: node scripts/verify-capabilities.mjs
import { pad, decodeAddress } from './verify-contract.mjs';

const CONTRACT = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763';
const ENDPOINTS = ['https://rpc.monad.xyz', 'https://rpc1.monad.xyz', 'https://rpc2.monad.xyz', 'https://rpc3.monad.xyz', 'https://rpc-mainnet.monadinfra.com'];
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const short = (v) => JSON.stringify(v).slice(0, 200);
async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { nonJson: text.slice(0, 200) }; }
  return { status: res.status, json };
}
const one = async (url, method, params) => (await post(url, { jsonrpc: '2.0', id: 1, method, params })).json;
const ownerCall = (id) => ({ to: CONTRACT, data: '0x6352211e' + pad(id) });

console.log('== 1. Block number and logs, per endpoint ==');
const usable = [];
for (const url of ENDPOINTS) {
  const bn = await one(url, 'eth_blockNumber', []).catch((e) => ({ fetchError: e.message }));
  const latest = bn.result ? parseInt(bn.result, 16) : null;
  console.log(`${url}\n  eth_blockNumber: ${latest ?? 'FAILED ' + short(bn)}`);
  if (!latest) continue;
  const logs = await one(url, 'eth_getLogs', [{ address: CONTRACT, fromBlock: '0x' + (latest - 100).toString(16), toBlock: 'latest' }]).catch((e) => ({ fetchError: e.message }));
  console.log(`  eth_getLogs last 100 blocks: ${logs.result ? logs.result.length + ' log(s)' : 'FAILED ' + short(logs)}`);
  const wide = await one(url, 'eth_getLogs', [{ address: CONTRACT, fromBlock: '0x0', toBlock: 'latest', topics: [TRANSFER, null, '0x' + '3d38fee3e1a4c43d8fcf715aa6c9ff025074e7e0'.padStart(64, '0')] }]).catch((e) => ({ fetchError: e.message }));
  console.log(`  eth_getLogs from block 0 (Transfer to test wallet): ${wide.result ? wide.result.length + ' log(s)' : 'FAILED ' + short(wide)}`);
  usable.push(url);
}

console.log('\n== 2. Batch size limits on rpc.monad.xyz ==');
for (const size of [10, 25, 50, 100]) {
  const body = Array.from({ length: size }, (_, i) => ({ jsonrpc: '2.0', id: i + 1, method: 'eth_call', params: [ownerCall(i + 1), 'latest'] }));
  const t = Date.now(); const { status, json } = await post(ENDPOINTS[0], body).catch((e) => ({ status: 'fetch error', json: { e: e.message } }));
  if (!Array.isArray(json)) { console.log(`batch ${size}: HTTP ${status} not an array: ${short(json)}`); continue; }
  const good = json.filter((r) => r.result).length; const firstBad = json.find((r) => !r.result);
  console.log(`batch ${size}: ${good} of ${size} answered (${Date.now() - t} ms)${firstBad ? ' first failure: ' + short(firstBad) : ''}`);
}

console.log('\n== 3. Full-collection scan: ownerOf for tokens 1 to 1969, batches of 25, sequential ==');
const wallet = '0x3d38fee3e1a4c43d8fcf715aa6c9ff025074e7e0';
const t0 = Date.now(); let answered = 0, failed = 0; const mine = []; const failures = [];
for (let start = 1; start <= 1969; start += 25) {
  const ids = Array.from({ length: Math.min(25, 1970 - start) }, (_, i) => start + i);
  const body = ids.map((id) => ({ jsonrpc: '2.0', id, method: 'eth_call', params: [ownerCall(id), 'latest'] }));
  const { json } = await post(ENDPOINTS[0], body).catch((e) => ({ json: { e: e.message } }));
  if (!Array.isArray(json)) { failed += ids.length; failures.push(short(json)); continue; }
  for (const r of json) { if (r.result) { answered++; if (decodeAddress(r.result).toLowerCase() === wallet) mine.push(r.id); } else { failed++; if (failures.length < 3) failures.push(short(r)); } }
}
console.log(`answered ${answered}, failed ${failed}, total ${(Date.now() - t0) / 1000}s, tokens found for test wallet: ${JSON.stringify(mine)} (expected [1])`);
if (failures.length) console.log('sample failures:', failures);
