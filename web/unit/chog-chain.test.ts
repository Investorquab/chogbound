import { describe, expect, it } from 'vitest';
import { createPublicClient, custom, decodeFunctionData, encodeFunctionResult, parseAbi, getAddress } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { CHOG_NFT, MULTICALL3, buildSignInMessage, monad, ownedTokenIds, scanOwners, verifySignIn } from '../src/lib/chog-chain';
import { IMAGE_CID, IPFS_GATEWAYS, artUrls, chogNumberFromName } from '../src/lib/art-url';

const mcAbi = parseAbi(['struct Call3 { address target; bool allowFailure; bytes callData; }', 'struct Result { bool success; bytes returnData; }', 'function aggregate3(Call3[] calls) payable returns (Result[] returnData)']);
const nftAbi = parseAbi(['function ownerOf(uint256) view returns (address)', 'function balanceOf(address) view returns (uint256)']);
const WALLET = getAddress('0x3d38fee3e1a4c43d8fcf715aa6c9ff025074e7e0');
const other = (id: number) => getAddress('0x' + (id + 1000).toString(16).padStart(40, '0'));
/** A fake Monad node: Multicall3 plus the NFT, with chosen owners and chosen failing token ids. */
function fakeChain(own: Record<number, string>, failing: number[] = [], balance?: number) {
  const log = { requests: 0 };
  const transport = custom({ async request({ method, params }: { method: string; params: any[] }) {
    log.requests++;
    if (method !== 'eth_call') throw new Error('unexpected ' + method);
    const { to, data } = params[0];
    if (to.toLowerCase() === MULTICALL3.toLowerCase()) {
      const { args } = decodeFunctionData({ abi: mcAbi, data });
      return encodeFunctionResult({ abi: mcAbi, functionName: 'aggregate3', result: args[0].map((c) => {
        const { args: [id] } = decodeFunctionData({ abi: nftAbi, data: c.callData }); const n = Number(id);
        return failing.includes(n) ? { success: false, returnData: '0x' as const } : { success: true, returnData: encodeFunctionResult({ abi: nftAbi, functionName: 'ownerOf', result: (own[n] ?? other(n)) as `0x${string}` }) };
      }) });
    }
    if (to.toLowerCase() === CHOG_NFT.toLowerCase()) {
      const { args: [who] } = decodeFunctionData({ abi: nftAbi, data });
      const held = Object.values(own).filter((o) => o.toLowerCase() === String(who).toLowerCase()).length;
      return encodeFunctionResult({ abi: nftAbi, functionName: 'balanceOf', result: BigInt(balance ?? held) });
    }
    throw new Error('unexpected target ' + to);
  } });
  return { client: createPublicClient({ chain: monad, transport }), log };
}

describe('scanOwners', () => {
  it('reads all 1,969 owners in 5 requests', async () => {
    const { client, log } = fakeChain({ 1: WALLET });
    const { owners, failed } = await scanOwners(client);
    expect(owners.size).toBe(1969); expect(failed).toEqual([]); expect(log.requests).toBe(5); expect(owners.get(1)).toBe(WALLET.toLowerCase());
  });
  it('reports failed lookups instead of hiding them', async () => {
    const { client } = fakeChain({}, [7, 1500]);
    const { owners, failed } = await scanOwners(client);
    expect(failed).toEqual([7, 1500]); expect(owners.size).toBe(1967);
  });
});

describe('ownedTokenIds', () => {
  it('returns the wallet ids sorted, matching case-insensitively, and marks the scan complete', async () => {
    const { client } = fakeChain({ 1798: WALLET, 1: WALLET, 308: WALLET });
    const r = await ownedTokenIds(client, WALLET.toLowerCase());
    expect(r).toEqual({ ids: [1, 308, 1798], balance: 3, complete: true });
  });
  it('returns nothing for a wallet with no Chogs', async () => {
    const { client } = fakeChain({ 1: WALLET });
    expect(await ownedTokenIds(client, getAddress('0x000000000000000000000000000000000000dEaD'))).toEqual({ ids: [], balance: 0, complete: true });
  });
  it('is not complete when a lookup failed or the count disagrees with balanceOf', async () => {
    expect((await ownedTokenIds(fakeChain({ 1: WALLET }, [500]).client, WALLET)).complete).toBe(false);
    expect((await ownedTokenIds(fakeChain({ 1: WALLET }, [], 2).client, WALLET)).complete).toBe(false);
  });
});

describe('wallet sign-in', () => {
  const account = privateKeyToAccount(generatePrivateKey());
  const now = new Date('2026-10-16T12:00:00Z');
  const make = (issuedAt = now, nonce = 'abc123') => buildSignInMessage({ address: account.address, nonce, issuedAt });
  it('accepts a fresh signature from the wallet that owns the address', async () => {
    const message = make(); const signature = await account.signMessage({ message });
    expect(await verifySignIn({ address: account.address, message, signature, expectedNonce: 'abc123', now })).toEqual({ ok: true });
  });
  it('rejects a signature from a different wallet', async () => {
    const message = make(); const signature = await privateKeyToAccount(generatePrivateKey()).signMessage({ message });
    expect(await verifySignIn({ address: account.address, message, signature, expectedNonce: 'abc123', now })).toEqual({ ok: false, reason: 'bad-signature' });
  });
  it('rejects a tampered message, a wrong nonce, another address and an old message', async () => {
    const message = make(); const signature = await account.signMessage({ message });
    expect((await verifySignIn({ address: account.address, message: message.replace('Monad', 'Other'), signature, expectedNonce: 'abc123', now })).ok).toBe(false);
    expect(await verifySignIn({ address: account.address, message, signature, expectedNonce: 'different', now })).toEqual({ ok: false, reason: 'missing-nonce' });
    expect(await verifySignIn({ address: WALLET, message, signature, expectedNonce: 'abc123', now })).toEqual({ ok: false, reason: 'address-mismatch' });
    expect(await verifySignIn({ address: account.address, message, signature, expectedNonce: 'abc123', now: new Date(now.getTime() + 11 * 60_000) })).toEqual({ ok: false, reason: 'expired' });
  });
});

describe('art urls', () => {
  it('reads the number from the name, not the token id', () => {
    expect(chogNumberFromName('CHOG #1769')).toBe(1769); expect(chogNumberFromName('CHOG #1290 \u2014 Krown')).toBe(1290); expect(chogNumberFromName('Unnamed')).toBeNull();
  });
  it('builds one URL per gateway, Pinata first, never the repo', () => {
    const urls = artUrls('CHOG #1462');
    expect(urls).toHaveLength(IPFS_GATEWAYS.length); expect(urls[0]).toBe(`https://gateway.pinata.cloud/ipfs/${IMAGE_CID}/1462.webp`); expect(artUrls('nope')).toEqual([]);
  });
});
