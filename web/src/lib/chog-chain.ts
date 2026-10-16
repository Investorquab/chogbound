import { defineChain, getAddress, parseAbi, verifyMessage, type Address, type Hex, type PublicClient } from 'viem';

/** Chog Genesis on Monad mainnet. Verified on chain: name "Chog Genesis", symbol CHOG, 1,969 tokens, plain ERC-721 (not enumerable). */
export const CHOG_NFT: Address = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763';
/** Canonical Multicall3, verified deployed on Monad mainnet. */
export const MULTICALL3: Address = '0xcA11bde05977b3631167028862bE2a173976CA11';
export const TOTAL_SUPPLY = 1969;
export const MONAD_RPC = 'https://rpc.monad.xyz';

export const monad = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [MONAD_RPC] } },
  contracts: { multicall3: { address: MULTICALL3 } },
});

const abi = parseAbi(['function ownerOf(uint256) view returns (address)', 'function balanceOf(address) view returns (uint256)']);
export type ChainReader = Pick<PublicClient, 'multicall' | 'readContract'>;
const allIds = () => Array.from({ length: TOTAL_SUPPLY }, (_, i) => i + 1);

/**
 * Owner of every token id. The public RPC allows 50 requests per second and has no token listing, so ownerOf calls are
 * bundled through Multicall3: 400 per request, which is 5 requests for the whole collection (about 2 seconds, measured).
 * Token ids are the keys of traits.full.json, which match the on-chain ids (verified for 1, 308 and 1798).
 */
export async function scanOwners(client: ChainReader, ids: number[] = allIds(), chunk = 400): Promise<{ owners: Map<number, string>; failed: number[] }> {
  const owners = new Map<number, string>(); const failed: number[] = [];
  for (let i = 0; i < ids.length; i += chunk) {
    const part = ids.slice(i, i + chunk);
    const results = await client.multicall({ allowFailure: true, batchSize: 1_000_000, multicallAddress: MULTICALL3, contracts: part.map((id) => ({ address: CHOG_NFT, abi, functionName: 'ownerOf', args: [BigInt(id)] })) });
    results.forEach((r, k) => { if (r.status === 'success') owners.set(part[k], String(r.result).toLowerCase()); else failed.push(part[k]); });
  }
  return { owners, failed };
}

export type OwnedChogs = { ids: number[]; balance: number; complete: boolean };
/**
 * Token ids a wallet owns right now. `complete` is true only when every lookup answered and the count agrees with the
 * contract's own balanceOf, so a partial scan is never presented as the player's full collection.
 */
export async function ownedTokenIds(client: ChainReader, wallet: string): Promise<OwnedChogs> {
  const address = getAddress(wallet);
  const [{ owners, failed }, balance] = await Promise.all([scanOwners(client), client.readContract({ address: CHOG_NFT, abi, functionName: 'balanceOf', args: [address] })]);
  const ids = [...owners].filter(([, owner]) => owner === address.toLowerCase()).map(([id]) => id).sort((a, b) => a - b);
  return { ids, balance: Number(balance), complete: failed.length === 0 && ids.length === Number(balance) };
}

/** Sign-in message the wallet signs to prove it controls the address. No transaction, no gas. */
export function buildSignInMessage(input: { address: string; nonce: string; issuedAt: Date }): string {
  return ['ChogBound sign-in', `Address: ${getAddress(input.address)}`, 'Chain: Monad (143)', `Nonce: ${input.nonce}`, `Issued: ${input.issuedAt.toISOString()}`, 'This signature only proves you own this wallet. It cannot move funds.'].join('\n');
}

export type SignInCheck = { ok: true } | { ok: false; reason: 'address-mismatch' | 'missing-nonce' | 'expired' | 'bad-signature' };
export async function verifySignIn(input: { address: string; message: string; signature: Hex; expectedNonce: string; now?: Date; maxAgeMs?: number }): Promise<SignInCheck> {
  const address = getAddress(input.address);
  const lines = Object.fromEntries(input.message.split('\n').map((l) => { const i = l.indexOf(': '); return i > 0 ? [l.slice(0, i), l.slice(i + 2)] : [l, '']; }));
  if (!input.expectedNonce || lines.Nonce !== input.expectedNonce) return { ok: false, reason: 'missing-nonce' };
  if (lines.Address !== address) return { ok: false, reason: 'address-mismatch' };
  const issued = Date.parse(lines.Issued ?? ''); const now = (input.now ?? new Date()).getTime();
  if (!Number.isFinite(issued) || now - issued > (input.maxAgeMs ?? 10 * 60_000) || issued - now > 60_000) return { ok: false, reason: 'expired' };
  const valid = await verifyMessage({ address, message: input.message, signature: input.signature }).catch(() => false);
  return valid ? { ok: true } : { ok: false, reason: 'bad-signature' };
}
