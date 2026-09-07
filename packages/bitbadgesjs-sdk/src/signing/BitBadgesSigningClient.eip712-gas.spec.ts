import axios from 'axios';
import { Wallet } from 'ethers';
import { BitBadgesSigningClient } from './BitBadgesSigningClient.js';
import { MsgSend } from '../proto/cosmos/bank/v1beta1/tx_pb.js';
import { hashTypedData } from '../eip712/hash.js';
import { convertToBitBadgesAddress } from '../address-converter/converter.js';
jest.mock('axios', () => ({ create: jest.fn() }));
function setup() {
  const wallet = new Wallet('0x' + '1'.padStart(64, '0'));
  const address = convertToBitBadgesAddress(wallet.address);
  const post = jest.fn(async (url: string) => ({
    data: url.endsWith('/simulate') ? { gas_info: { gas_used: '100001' } } : { tx_response: { code: 0, txhash: 'hash' } }
  }));
  (axios.create as jest.Mock).mockReturnValue({ post, get: jest.fn(async () => ({ data: { account: { account_number: '1', sequence: '0' } } })) });
  const signTypedData = jest.fn(async (typed: any) => wallet.signingKey.sign(hashTypedData(typed)).serialized);
  const adapter: any = {
    chainType: 'evm',
    address: wallet.address,
    supportsSignTypedData: () => true,
    signTypedData,
    estimateEvmGas: jest.fn(() => {
      throw Error('wrong simulation route');
    })
  };
  const client = new BitBadgesSigningClient({ adapter });
  return { client, adapter, post, messages: [new MsgSend({ fromAddress: address, toAddress: address, amount: [] })] };
}
it('simulates the EIP-712 Cosmos envelope without prompting for a public key and buffers once', async () => {
  const { client, adapter, post, messages } = setup();
  await client.signAndBroadcast(messages, { mode: 'eip712', gasMultiplier: 1.5 });
  expect(post.mock.calls[0][0]).toMatch(/\/simulate$/);
  expect(adapter.estimateEvmGas).not.toHaveBeenCalled();
  expect(adapter.signTypedData.mock.calls[0][0].message.fee).toEqual({ amount: [{ denom: 'ubadge', amount: '1500020' }], gas: '150002' });
});
it('does not sign or broadcast after simulation failure', async () => {
  const { client, adapter, post, messages } = setup();
  post.mockRejectedValue(Error('simulation unavailable'));
  await expect(client.signAndBroadcast(messages, { mode: 'eip712' })).rejects.toThrow('simulation unavailable');
  expect(adapter.signTypedData).not.toHaveBeenCalled();
  expect(post).toHaveBeenCalledTimes(1);
});
it.each([
  { gas: '100000001', amount: '0', denom: 'stake' },
  { gas: '300000', amount: '1', denom: 'ubadge' },
  { gas: '0', amount: '0', denom: 'ubadge' }
])('rejects invalid explicit fee before signing', async (fee) => {
  const { client, adapter, messages } = setup();
  await expect(client.signAndBroadcast(messages, { mode: 'eip712', fee })).rejects.toThrow();
  expect(adapter.signTypedData).not.toHaveBeenCalled();
});
it.each([0, -1, NaN, Infinity])('rejects invalid multiplier %s before signing', async (gasMultiplier) => {
  const { client, adapter, messages } = setup();
  await expect(client.signAndBroadcast(messages, { mode: 'eip712', gasMultiplier })).rejects.toThrow();
  expect(adapter.signTypedData).not.toHaveBeenCalled();
});
