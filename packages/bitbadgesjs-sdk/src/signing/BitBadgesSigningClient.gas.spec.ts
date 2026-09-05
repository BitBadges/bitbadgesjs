import axios from 'axios';
import { convertToBitBadgesAddress } from '@/address-converter/converter.js';
import { BitBadgesKeplrSuggestMainnetChainInfo, BitBadgesKeplrSuggestTestnetChainInfo } from '@/common/constants.js';
import { MsgSend } from '@/proto/cosmos/bank/v1beta1/tx_pb.js';
import { MsgSetCustomData } from '@/proto/tokenization/tx_pb.js';
import { BitBadgesSigningClient } from './BitBadgesSigningClient.js';
import type { WalletAdapter } from './adapters/WalletAdapter.js';

jest.mock('axios', () => ({ create: jest.fn() }));

const evmAddress = '0x1234567890123456789012345678901234567890';
const address = convertToBitBadgesAddress(evmAddress);
const publicKey = Buffer.from('02' + '11'.repeat(32), 'hex').toString('base64');
const cosmosMessages = [new MsgSend({ fromAddress: address, toAddress: address, amount: [{ denom: 'ubadge', amount: '1' }] })];
const evmMessages = [new MsgSetCustomData({ creator: address, collectionId: '1', customData: 'v35' })];

function setup(chainType: 'cosmos' | 'evm' = 'cosmos', options = {}) {
  const get = jest.fn().mockResolvedValue({ data: { account: { account_number: '1', sequence: '0', pub_key: { key: publicKey } } } });
  const post = jest
    .fn()
    .mockImplementation(async (url: string) =>
      url.endsWith('/simulate') ? { data: { gas_info: { gas_used: '1000001' } } } : { data: { tx_response: { txhash: 'cosmos-hash', code: 0 } } }
    );
  (axios.create as jest.Mock).mockReturnValue({ get, post });
  const adapter = {
    chainType,
    address: chainType === 'evm' ? evmAddress : address,
    getPublicKey: jest.fn().mockResolvedValue(publicKey),
    signDirect: jest.fn().mockResolvedValue({ signature: '0'.repeat(128), publicKey }),
    sendEvmTransaction: jest.fn().mockResolvedValue('0xhash'),
    estimateEvmGas: jest.fn().mockResolvedValue(6_000_001n),
    supportsSignDirect: () => chainType === 'cosmos',
    supportsSignAmino: () => false,
    supportsEvmTransaction: () => chainType === 'evm'
  } satisfies WalletAdapter;
  return { client: new BitBadgesSigningClient({ adapter, ...options }), adapter, post };
}

describe('v35 signing gas', () => {
  it('prices the final buffered Cosmos gas at 10 ubadge/gas', async () => {
    const { client, adapter } = setup();
    const result = await client.signAndBroadcast(cosmosMessages);
    expect(result.success).toBe(true);
    const fee = adapter.signDirect.mock.calls[0][0].signDirect.authInfo.fee;
    expect(fee.gasLimit).toBe(1_300_002n);
    expect(fee.amount[0]).toMatchObject({ denom: 'ubadge', amount: '13000020' });
  });

  it('does not sign or broadcast when Cosmos simulation fails', async () => {
    const { client, adapter, post } = setup();
    post.mockRejectedValue(new Error('simulation unavailable'));
    await expect(client.signAndBroadcast(cosmosMessages)).rejects.toThrow('simulation unavailable');
    expect(adapter.signDirect).not.toHaveBeenCalled();
    expect(post.mock.calls.every(([url]) => url.endsWith('/simulate'))).toBe(true);
  });

  it.each(['0', '-1', '100oops', 'NaN', '100000001', undefined, true, [1000000], '0xF4240', '1e6'])(
    'rejects invalid Cosmos gas %s before signing',
    async (gas) => {
      const { client, adapter, post } = setup();
      post.mockResolvedValue({ data: { gas_info: { gas_used: gas } } });
      await expect(client.signAndBroadcast(cosmosMessages)).rejects.toThrow(/gas/i);
      expect(adapter.signDirect).not.toHaveBeenCalled();
    }
  );

  it('uses explicit non-simulating Cosmos gas with a correctly priced fee', async () => {
    const { client, adapter, post } = setup('cosmos', { defaultGasLimit: 800_000 });
    await client.signAndBroadcast(cosmosMessages, { simulate: false });
    expect(post).toHaveBeenCalledTimes(1);
    const fee = adapter.signDirect.mock.calls[0][0].signDirect.authInfo.fee;
    expect(fee.gasLimit).toBe(800_000n);
    expect(fee.amount[0].amount).toBe('8000000');
  });

  it('uses the actual buffered EVM estimate when broadcasting', async () => {
    const { client, adapter } = setup('evm');
    expect((await client.signAndBroadcast(evmMessages)).success).toBe(true);
    expect(adapter.estimateEvmGas).toHaveBeenCalledTimes(1);
    const sent = adapter.sendEvmTransaction.mock.calls[0][0];
    expect(sent.gasLimit).toBe(7_800_002);
    expect(adapter.estimateEvmGas).toHaveBeenCalledWith({ to: sent.to, data: sent.data, value: sent.value });
  });

  it('applies per-send EVM gas multiplier', async () => {
    const { client, adapter } = setup('evm');
    await client.signAndBroadcast(evmMessages, { gasMultiplier: 1.5 });
    expect(adapter.sendEvmTransaction.mock.calls[0][0].gasLimit).toBe(9_000_002);
  });

  it('does not send EVM transactions when estimation fails', async () => {
    const { client, adapter } = setup('evm');
    adapter.estimateEvmGas.mockRejectedValue(new Error('execution reverted'));
    expect(await client.signAndBroadcast(evmMessages)).toMatchObject({ success: false, error: 'execution reverted' });
    expect(adapter.sendEvmTransaction).not.toHaveBeenCalled();
  });

  it.each([0n, -1n, 100_000_001n, 90_000_000n])('does not send invalid/over-budget EVM gas %s', async (gas) => {
    const { client, adapter } = setup('evm');
    adapter.estimateEvmGas.mockResolvedValue(gas);
    expect((await client.signAndBroadcast(evmMessages)).success).toBe(false);
    expect(adapter.sendEvmTransaction).not.toHaveBeenCalled();
  });

  it('allows an explicit EVM limit only when simulation is disabled', async () => {
    const { client, adapter } = setup('evm', { evmPrecompileGasLimit: 8_000_000 });
    await client.signAndBroadcast(evmMessages, { simulate: false });
    expect(adapter.estimateEvmGas).not.toHaveBeenCalled();
    expect(adapter.sendEvmTransaction.mock.calls[0][0].gasLimit).toBe(8_000_000);
  });

  it('allows a caller-selected multiplier of 1 at the block limit', async () => {
    const { client, adapter } = setup('evm');
    adapter.estimateEvmGas.mockResolvedValue(100_000_000n);
    expect((await client.signAndBroadcast(evmMessages, { gasMultiplier: 1 })).success).toBe(true);
    expect(adapter.sendEvmTransaction.mock.calls[0][0].gasLimit).toBe(100_000_000);
  });

  it('applies a caller-selected Cosmos multiplier before enforcing the cap', async () => {
    const { client, adapter, post } = setup();
    post.mockImplementation(async (url: string) =>
      url.endsWith('/simulate') ? { data: { gas_info: { gas_used: '100000000' } } } : { data: { tx_response: { txhash: 'cosmos-hash', code: 0 } } }
    );
    expect((await client.signAndBroadcast(cosmosMessages, { gasMultiplier: 1 })).success).toBe(true);
    expect(adapter.signDirect.mock.calls[0][0].signDirect.authInfo.fee.gasLimit).toBe(100_000_000n);
  });

  it.each([
    { amount: '0', denom: 'ubadge', gas: '400000' },
    { amount: '4000000', denom: 'stake', gas: '400000' },
    { amount: '4000000', denom: 'ubadge', gas: '0' },
    { amount: '1000000010', denom: 'ubadge', gas: '100000001' },
    { amount: '4000000', denom: 'ubadge', gas: '400000oops' }
  ])('rejects invalid custom Cosmos fees %j', async (fee) => {
    const { client, adapter } = setup();
    await expect(client.signAndBroadcast(cosmosMessages, { fee })).rejects.toThrow(/fee|gas/i);
    expect(adapter.signDirect).not.toHaveBeenCalled();
  });

  it('preserves a valid caller-provided higher Cosmos fee', async () => {
    const { client, adapter, post } = setup();
    await client.signAndBroadcast(cosmosMessages, { fee: { amount: '8000000', denom: 'ubadge', gas: '400000' } });
    expect(post).toHaveBeenCalledTimes(1);
    expect(adapter.signDirect.mock.calls[0][0].signDirect.authInfo.fee.amount[0].amount).toBe('8000000');
  });

  it.each([0, -1, 0.5, NaN, Infinity])('rejects invalid multipliers %s', (gasMultiplier) => {
    expect(() => setup('cosmos', { gasMultiplier })).toThrow(/multiplier/i);
  });

  it.each([0, -1, 1.5, 100_000_001, NaN])('rejects invalid configured limits %s', (limit) => {
    expect(() => setup('cosmos', { defaultGasLimit: limit })).toThrow(/gas/i);
    expect(() => setup('evm', { evmPrecompileGasLimit: limit })).toThrow(/gas/i);
  });

  it('does not suggest wallet gas prices below the v35 floor', () => {
    for (const config of [BitBadgesKeplrSuggestMainnetChainInfo, BitBadgesKeplrSuggestTestnetChainInfo]) {
      expect(Object.values(config.feeCurrencies[0].gasPriceStep).every((price) => price >= 10)).toBe(true);
    }
  });
});
