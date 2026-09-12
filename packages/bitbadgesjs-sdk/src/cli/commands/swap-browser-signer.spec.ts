import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

jest.mock('../utils/indexer-options.js', () => ({
  ...jest.requireActual('../utils/indexer-options.js'),
  callIndexer: jest.fn(), emitIndexerResult: jest.fn(), emitIndexerError: (error: unknown) => { throw error; }
}));
jest.mock('../auth/browser-bridge.js', () => ({ bridgeSign: jest.fn(), resolveFrontendUrl: () => 'https://example.invalid' }));

const sender = 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d';
const other = 'bb1py4mfpg6uf59qkyzg0nmau322c5873eeysp5ue';
const estimate = (address: unknown = sender) => ({ estimate: { skipGoMsgs: [{ multi_chain_msg: {
  chain_id: 'bitbadges-1', msg_type_url: '/gamm.v1beta1.MsgSwapExactAmountIn',
  msg: JSON.stringify({ sender: address, routes: [{ poolId: '1', tokenOutDenom: 'uusdc' }], tokenIn: { denom: 'ubadge', amount: '5' }, tokenOutMinAmount: '1', affiliates: [] })
} }] } });

describe('swap browser signer', () => {
  let command: any;
  let bridge: jest.Mock;
  let api: jest.Mock;
  beforeEach(() => {
    jest.resetModules();
    command = require('./swap.js').swapCommand;
    bridge = require('../auth/browser-bridge.js').bridgeSign;
    api = require('../utils/indexer-options.js').callIndexer;
    jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    bridge.mockImplementation(async ({ payload }) => ({ requestId: payload.requestId, address: payload.expectedAddress, network: payload.network, chain: payload.chain, chainId: payload.chainId, outcome: 'submitted', hash: 'A'.repeat(64) }));
  });
  afterEach(() => jest.restoreAllMocks());

  test('saved estimate binds the actual native message sender', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'swap-signer-'));
    const file = join(directory, 'estimate.json');
    writeFileSync(file, JSON.stringify(estimate()));
    try {
      await command.parseAsync(['execute', '@' + file, '--browser'], { from: 'user' });
      expect(bridge.mock.calls[0][0].payload).toMatchObject({ expectedAddress: sender, txsInfo: [{ msg: { sender } }] });
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
  test('inline estimate uses returned message sender rather than an arbitrary address-map entry', async () => {
    api.mockResolvedValue(estimate());
    await command.parseAsync(['estimate', 'ubadge', 'uusdc', '5', '--addresses', JSON.stringify({ 'bitbadges-1': sender, '1': other }), '--execute', '--browser'], { from: 'user' });
    expect(bridge.mock.calls[0][0].payload.expectedAddress).toBe(sender);
  });
  test('explicit signer override remains explicit without rewriting message sender', async () => {
    await command.parseAsync(['execute', JSON.stringify(estimate()), '--browser', '--expected-address', other], { from: 'user' });
    expect(bridge.mock.calls[0][0].payload).toMatchObject({ expectedAddress: other, txsInfo: [{ msg: { sender } }] });
  });
  test.each([undefined, '', 'Mint', 'invalid'])('refuses missing or invalid inferred signer %s before opening browser', async address => {
    const input = estimate(address === undefined ? null : address);
    if (address === undefined) {
      const message = JSON.parse(input.estimate.skipGoMsgs[0].multi_chain_msg.msg);
      delete message.sender;
      input.estimate.skipGoMsgs[0].multi_chain_msg.msg = JSON.stringify(message);
    }
    await expect(command.parseAsync(['execute', JSON.stringify(input), '--browser'], { from: 'user' })).rejects.toThrow();
    expect(bridge).not.toHaveBeenCalled();
  });
});
