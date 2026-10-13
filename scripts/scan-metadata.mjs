import { createPublicClient, http, parseAbi } from 'viem'
import fs from 'node:fs/promises'

const RPC = 'https://rpc.monad.xyz'
const NFT = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763'
const FIRST = Number(process.argv[2] || 1)
const LAST = Number(process.argv[3] || 1969)
const CONC = 3
const TIMEOUT = 12000
const GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://w3s.link/ipfs/',
  'https://4everland.io/ipfs/',
]

const client = createPublicClient({ transport: http(RPC, { timeout: 15000, retryCount: 1 }) })
const abi = parseAbi(['function tokenURI(uint256) view returns (string)'])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const t0 = Date.now()
const stamp = () => '[' + ((Date.now() - t0) / 1000).toFixed(0) + 's]'

async function getJson(uri, id) {
  if (uri.startsWith('data:')) {
    const i = uri.indexOf(',')
    const head = uri.slice(0, i), body = uri.slice(i + 1)
    return JSON.parse(head.includes('base64') ? Buffer.from(body, 'base64').toString('utf8') : decodeURIComponent(body))
  }
  const path = uri.startsWith('ipfs://') ? uri.slice(7).replace(/^ipfs\//, '') : null
  const urls = path
    ? GATEWAYS.map((_, k) => GATEWAYS[(id + k) % GATEWAYS.length] + path)
    : [uri]
  let last
  for (const u of urls) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(TIMEOUT) })
      if (!r.ok) throw new Error(r.status + ' ' + new URL(u).host)
      return await r.json()
    } catch (e) { last = e }
  }
  throw last
}

const OUT = 'traits.full.json'
let out = {}
try { out = JSON.parse(await fs.readFile(OUT, 'utf8')) } catch {}
const todo = []
for (let id = FIRST; id <= LAST; id++) if (!out[id]) todo.push(id)
// shuffle so stubborn tokens are spread out instead of blocking every worker at once
for (let i = todo.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [todo[i], todo[j]] = [todo[j], todo[i]] }
const total = todo.length
console.log(stamp(), 'range', FIRST, 'to', LAST, '| already saved:', Object.keys(out).length, '| to fetch:', total)

const save = () => fs.writeFile(OUT, JSON.stringify(out))
process.on('SIGINT', async () => {
  await save()
  console.log('\nInterrupted. Saved', Object.keys(out).length, 'tokens. Run again to resume.')
  process.exit(130)
})

if (total > 0) {
  try {
    const probe = await client.readContract({ address: NFT, abi, functionName: 'tokenURI', args: [BigInt(todo[0])] })
    console.log(stamp(), 'probe tokenURI for', todo[0], 'starts with:', probe.slice(0, 60))
  } catch (e) {
    console.log(stamp(), 'PROBE FAILED:', String(e.message || e).split('\n')[0])
    process.exit(1)
  }
}

let done = 0, inflight = 0
const failed = []
const beat = setInterval(async () => {
  console.log(stamp(), `progress: ${Object.keys(out).length}/${LAST - FIRST + 1} saved | queue ${todo.length} | working ${inflight} | failed so far ${failed.length}`)
  await save()
}, 10000)

async function worker() {
  while (todo.length) {
    const id = todo.shift()
    inflight++
    let ok = false, lastErr = ''
    for (let a = 1; a <= 2 && !ok; a++) {
      try {
        const uri = await client.readContract({ address: NFT, abi, functionName: 'tokenURI', args: [BigInt(id)] })
        const m = await getJson(uri, id + a)
        out[id] = { name: m.name, attributes: m.attributes || [] }
        ok = true
      } catch (e) { lastErr = String(e.message || e).split('\n')[0]; await sleep(1000 * a) }
    }
    inflight--
    done++
    if (ok) { if (done <= 3 || done % 25 === 0) console.log(stamp(), 'ok', id, out[id].name, `(${done}/${total})`) }
    else { failed.push(id); if (failed.length <= 5) console.log(stamp(), 'skip', id, lastErr, '(will retry on next run)') }
  }
}
await Promise.all(Array.from({ length: CONC }, worker))
clearInterval(beat)
await save()
console.log(stamp(), 'DONE. total in file:', Object.keys(out).length, '| failed:', failed.length, failed.slice(0, 30))
if (failed.length) console.log('Run the same command again to retry the skipped ones.')
