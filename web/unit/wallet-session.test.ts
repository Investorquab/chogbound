import { describe, expect, it } from 'vitest';
import { getAddress, hexToString, type Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { WALLET_MESSAGES, WalletError, connectHolder, type Eip1193 } from '../src/lib/wallet-session';
import type { ChainReader } from '../src/lib/chog-chain';

const account = privateKeyToAccount(generatePrivateKey());
type Opts = { chain?: string; switchError?: number; addError?: number; rejectConnect?: boolean; rejectSign?: boolean; wrongSigner?: boolean; noAccounts?: boolean };
function fakeWallet(o: Opts = {}) {
  const calls: string[] = []; let chain = o.chain ?? '0x8f';
  const provider: Eip1193 = { async request({ method, params }) {
    calls.push(method);
    if (method === 'eth_requestAccounts') { if (o.rejectConnect) throw { code: 4001 }; return o.noAccounts ? [] : [account.address.toLowerCase()]; }
    if (method === 'eth_chainId') return chain;
    if (method === 'wallet_switchEthereumChain') { if (o.switchError) throw { code: o.switchError }; chain = '0x8f'; return null; }
    if (method === 'wallet_addEthereumChain') { if (o.addError) throw { code: o.addError }; chain = '0x8f'; return null; }
    if (method === 'personal_sign') { if (o.rejectSign) throw { code: 4001 }; const signer = o.wrongSigner ? privateKeyToAccount(generatePrivateKey()) : account; return signer.signMessage({ message: hexToString((params as Hex[])[0]) }); }
    throw new Error('unexpected ' + method);
  } };
  return { provider, calls };
}
const reader = (ids: number[]): ChainReader => ({
  async multicall({ contracts }: any) { return contracts.map((c: any) => ({ status: 'success', result: ids.includes(Number(c.args[0])) ? account.address : getAddress('0x000000000000000000000000000000000000dEaD') })); },
  async readContract() { return BigInt(ids.length); },
} as unknown as ChainReader);
const code = async (p: Promise<unknown>) => p.then(() => 'resolved', (e) => (e instanceof WalletError ? e.code : 'other'));

describe('connectHolder', () => {
  it('connects, signs and returns the Chogs the wallet owns', async () => {
    const { provider, calls } = fakeWallet();
    const r = await connectHolder(provider, reader([1, 308, 1798]));
    expect(r.address).toBe(account.address); expect(r.chogs).toEqual({ ids: [1, 308, 1798], balance: 3, complete: true });
    expect(calls).toEqual(['eth_requestAccounts', 'eth_chainId', 'personal_sign']);
  });
  it('resolves with an empty list for a wallet that holds no Chogs', async () => {
    expect((await connectHolder(fakeWallet().provider, reader([]))).chogs).toEqual({ ids: [], balance: 0, complete: true });
  });
  it('switches the wallet to Monad when it is on another network', async () => {
    const { provider, calls } = fakeWallet({ chain: '0x1' });
    await connectHolder(provider, reader([5]));
    expect(calls).toContain('wallet_switchEthereumChain'); expect(calls).not.toContain('wallet_addEthereumChain');
  });
  it('adds the Monad network when the wallet does not know it', async () => {
    const { provider, calls } = fakeWallet({ chain: '0x1', switchError: 4902 });
    await connectHolder(provider, reader([5]));
    expect(calls).toContain('wallet_addEthereumChain');
  });
  it('reports plain failures: no wallet, rejected connect, rejected signature, wrong network, bad signature', async () => {
    expect(await code(connectHolder(undefined, reader([])))).toBe('no-wallet');
    expect(await code(connectHolder(fakeWallet({ rejectConnect: true }).provider, reader([])))).toBe('rejected');
    expect(await code(connectHolder(fakeWallet({ rejectSign: true }).provider, reader([])))).toBe('rejected');
    expect(await code(connectHolder(fakeWallet({ chain: '0x1', switchError: 5000 }).provider, reader([])))).toBe('wrong-chain');
    expect(await code(connectHolder(fakeWallet({ chain: '0x1', switchError: 4902, addError: 4001 }).provider, reader([])))).toBe('rejected');
    expect(await code(connectHolder(fakeWallet({ wrongSigner: true }).provider, reader([])))).toBe('bad-signature');
    expect(await code(connectHolder(fakeWallet({ noAccounts: true }).provider, reader([])))).toBe('failed');
  });
  it('never exposes raw errors or em dashes in UI text', () => {
    for (const text of Object.values(WALLET_MESSAGES)) { expect(text).not.toContain('\u2014'); expect(text.length).toBeGreaterThan(20); }
  });
});
