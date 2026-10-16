import { bytesToHex, getAddress, type Address, type Hex } from 'viem';
import { MONAD_RPC, buildSignInMessage, ownedTokenIds, verifySignIn, type ChainReader, type OwnedChogs } from './chog-chain';

/** Minimal EIP-1193 wallet provider (MetaMask, Rabby, Phantom and in-app wallet browsers inject window.ethereum). */
export type Eip1193 = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
export type WalletFailure = 'no-wallet' | 'rejected' | 'wrong-chain' | 'bad-signature' | 'failed';
export class WalletError extends Error { constructor(public code: WalletFailure, message: string) { super(message); this.name = 'WalletError'; } }

const MONAD_HEX = '0x8f';
/** Plain-language text for the UI. No technical jargon, no em dashes. */
export const WALLET_MESSAGES: Record<WalletFailure, string> = {
  'no-wallet': 'No wallet found. Open this page in a wallet browser or install a wallet extension, or play as a guest.',
  rejected: 'The wallet request was cancelled. Nothing was sent. Try again when you are ready.',
  'wrong-chain': 'Please switch your wallet to the Monad network to continue.',
  'bad-signature': 'We could not confirm that wallet. Try signing in again.',
  failed: 'Something went wrong talking to the wallet. Please try again.',
};
const isRejection = (e: unknown) => typeof e === 'object' && e !== null && (e as { code?: number }).code === 4001;
const fail = (code: WalletFailure) => new WalletError(code, WALLET_MESSAGES[code]);

async function ensureMonad(provider: Eip1193) {
  const current = String(await provider.request({ method: 'eth_chainId' }));
  if (current.toLowerCase() === MONAD_HEX) return;
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: MONAD_HEX }] });
  } catch (e) {
    if (isRejection(e)) throw fail('rejected');
    if ((e as { code?: number })?.code !== 4902) throw fail('wrong-chain');
    try {
      await provider.request({ method: 'wallet_addEthereumChain', params: [{ chainId: MONAD_HEX, chainName: 'Monad', nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 }, rpcUrls: [MONAD_RPC], blockExplorerUrls: ['https://monadvision.com'] }] });
    } catch (e2) { throw fail(isRejection(e2) ? 'rejected' : 'wrong-chain'); }
  }
}

export type Holder = { address: Address; chogs: OwnedChogs };
/**
 * Connect, switch to Monad, prove control of the address with a signed message (no transaction, no gas), then read which
 * Chogs that address owns. Resolves with an empty list for a wallet without Chogs; callers offer guest mode in that case.
 */
export async function connectHolder(provider: Eip1193 | undefined, reader: ChainReader, options: { now?: () => Date; nonce?: () => string } = {}): Promise<Holder> {
  if (!provider) throw fail('no-wallet');
  let address: Address;
  try {
    const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
    if (!accounts?.[0]) throw fail('failed');
    address = getAddress(accounts[0]);
    await ensureMonad(provider);
  } catch (e) {
    if (e instanceof WalletError) throw e;
    throw fail(isRejection(e) ? 'rejected' : 'failed');
  }
  const nonce = (options.nonce ?? (() => crypto.randomUUID().replace(/-/g, '')))();
  const issuedAt = (options.now ?? (() => new Date()))();
  const message = buildSignInMessage({ address, nonce, issuedAt });
  let signature: Hex;
  try {
    signature = (await provider.request({ method: 'personal_sign', params: [bytesToHex(new TextEncoder().encode(message)), address] })) as Hex;
  } catch (e) { throw fail(isRejection(e) ? 'rejected' : 'failed'); }
  const check = await verifySignIn({ address, message, signature, expectedNonce: nonce, now: issuedAt });
  if (!check.ok) throw fail('bad-signature');
  try { return { address, chogs: await ownedTokenIds(reader, address) }; } catch { throw fail('failed'); }
}
