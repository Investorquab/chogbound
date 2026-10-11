import { createPublicClient, http, parseAbi } from 'viem'
import fs from 'node:fs/promises'

const RPC = 'https://rpc.monad.xyz'
const NFT = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763'
const IDS = [1,24,42,71,89,118,150,222,300,410,555,640,777,888,999,1111,1234,1357,1500,1620,1750,1830,1900,1969]
const GATEWAYS = ['https://ipfs.io/ipfs/', 'https://dweb.link/ipfs/', 'https://gateway.pinata.cloud/ipfs/']

const client = createPublicClient({ transport: http(RPC) })
const abi = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256) view returns (string)',
])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(uri) {
  if (uri.startsWith('data:')) {
    const i = uri.indexOf(',')
    const head = uri.slice(0, i)
    const body = uri.slice(i + 1)
    const buf = head.includes('base64') ? Buffer.from(body, 'base64') : Buffer.from(decodeURIComponent(body))
    return { buf, type: head.slice(5).split(';')[0] || 'application/json' }
  }
  const urls = uri.startsWith('ipfs://')
    ? GATEWAYS.map((g) => g + uri.slice(7).replace(/^ipfs\//, ''))
    : [uri]
  let lastErr
  for (const u of urls) {
    try {
      const res = await fetch(u)
      if (!res.ok) throw new Error(`${res.status} ${u}`)
      return { buf: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') || '' }
    } catch (e) { lastErr = e }
  }
  throw lastErr
}

const ext = (t) => t.includes('png') ? 'png' : (t.includes('jpeg') || t.includes('jpg')) ? 'jpg' : t.includes('webp') ? 'webp' : t.includes('gif') ? 'gif' : t.includes('svg') ? 'svg' : 'bin'

const name = await client.readContract({ address: NFT, abi, functionName: 'name' })
const symbol = await client.readContract({ address: NFT, abi, functionName: 'symbol' })
console.log('CONTRACT CHECK:', name, '/', symbol)

await fs.mkdir('art', { recursive: true })
const out = {}
const summary = {}
for (const id of IDS) {
  try {
    const uri = await client.readContract({ address: NFT, abi, functionName: 'tokenURI', args: [BigInt(id)] })
    const meta = JSON.parse((await get(uri)).buf.toString('utf8'))
    const img = await get(meta.image)
    const file = `art/${id}.${ext(img.type)}`
    await fs.writeFile(file, img.buf)
    out[id] = { name: meta.name, image: file, attributes: meta.attributes || [] }
    for (const a of meta.attributes || []) {
      summary[a.trait_type] ??= {}
      summary[a.trait_type][a.value] = (summary[a.trait_type][a.value] || 0) + 1
    }
    console.log('ok', id, meta.name)
  } catch (e) { console.log('FAIL', id, e.message) }
  await sleep(300)
}
await fs.writeFile('traits.json', JSON.stringify(out, null, 2))
await fs.writeFile('trait-summary.json', JSON.stringify(summary, null, 2))