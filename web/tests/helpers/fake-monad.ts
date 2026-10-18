import type { Page } from '@playwright/test';
import { decodeFunctionData, encodeFunctionResult, getAddress, hexToString, parseAbi, type Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const MULTICALL3 = '0xca11bde05977b3631167028862be2a173976ca11';
const mcAbi = parseAbi(['struct Call3 { address target; bool allowFailure; bytes callData; }', 'struct Result { bool success; bytes returnData; }', 'function aggregate3(Call3[] calls) payable returns (Result[] returnData)']);
const nftAbi = parseAbi(['function ownerOf(uint256) view returns (address)', 'function balanceOf(address) view returns (uint256)']);
export const TINY_WEBP = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64');
const NOBODY = getAddress('0x000000000000000000000000000000000000dEaD');

export type WalletOptions = { owns: number[]; chain?: string; rejectConnect?: boolean; rejectSign?: boolean; noWallet?: boolean };
/**
 * Installs a pretend wallet (window.ethereum that signs for real with a throwaway key) and a pretend Monad node
 * (answers Multicall3 ownerOf and balanceOf for the chosen token ids). Nothing here touches the network.
 */
export async function installFakeWallet(page: Page, options: WalletOptions) {
  const account = privateKeyToAccount(generatePrivateKey());
  await page.route(/\/ipfs\//, (route) => route.fulfill({ status: 200, contentType: 'image/webp', body: TINY_WEBP }));
  await page.route('https://rpc.monad.xyz/**', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}');
    const answer = (req: { id: number; method: string; params: { to: string; data: Hex }[] }) => {
      if (req.method !== 'eth_call') return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: 'unsupported ' + req.method } };
      const { to, data } = req.params[0];
      if (to.toLowerCase() === MULTICALL3) {
        const { args } = decodeFunctionData({ abi: mcAbi, data });
        const result = args[0].map((c) => { const { args: [id] } = decodeFunctionData({ abi: nftAbi, data: c.callData }); return { success: true, returnData: encodeFunctionResult({ abi: nftAbi, functionName: 'ownerOf', result: options.owns.includes(Number(id)) ? account.address : NOBODY }) }; });
        return { jsonrpc: '2.0', id: req.id, result: encodeFunctionResult({ abi: mcAbi, functionName: 'aggregate3', result }) };
      }
      return { jsonrpc: '2.0', id: req.id, result: encodeFunctionResult({ abi: nftAbi, functionName: 'balanceOf', result: BigInt(options.owns.length) }) };
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Array.isArray(body) ? body.map(answer) : answer(body)) });
  });
  await page.exposeFunction('__signMessage', (hex: Hex) => account.signMessage({ message: hexToString(hex) }));
  if (options.noWallet) return account;
  await page.addInitScript((o) => {
    let chain = o.chain ?? '0x8f';
    (window as unknown as { ethereum: unknown }).ethereum = { request: async ({ method, params }: { method: string; params?: unknown[] }) => {
      if (method === 'eth_requestAccounts') { if (o.rejectConnect) throw { code: 4001 }; return [o.address.toLowerCase()]; }
      if (method === 'eth_chainId') return chain;
      if (method === 'wallet_switchEthereumChain') { chain = '0x8f'; return null; }
      if (method === 'personal_sign') { if (o.rejectSign) throw { code: 4001 }; return (window as unknown as { __signMessage: (h: string) => Promise<string> }).__signMessage((params as string[])[0]); }
      throw new Error('unexpected ' + method);
    } };
  }, { address: account.address, chain: options.chain, rejectConnect: options.rejectConnect, rejectSign: options.rejectSign });
  return account;
}
