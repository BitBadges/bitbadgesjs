import { browserBroadcast, executeDeploy } from './deploy-options.js';
import { bridgeSign } from '../auth/browser-bridge.js';

jest.mock('../auth/browser-bridge.js', () => ({
  bridgeSign: jest.fn(), resolveFrontendUrl: () => 'https://example.invalid'
}));
const signer = 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d';
const messages = [{ typeUrl: '/cosmos.bank.v1beta1.MsgSend', value: { fromAddress: signer, toAddress: signer, amount: [{ denom: 'ubadge', amount: '5' }] } }];

describe('browser broadcast contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    (bridgeSign as jest.Mock).mockImplementation(async ({ payload }) => ({ requestId: payload.requestId, address: payload.expectedAddress, network: payload.network, chainId: payload.chainId, chain: payload.chain, outcome: 'submitted', hash: 'A'.repeat(64) }));
  });
  afterEach(() => jest.restoreAllMocks());
  test('pins signer, deployment, chain IDs and finite deadline', async () => {
    const before = Date.now();
    const { payload } = await browserBroadcast(messages, { expectedAddress: signer, local: true } as any);
    const request = (bridgeSign as jest.Mock).mock.calls[0][0].payload;
    expect(request).toMatchObject({ version: 2, expectedAddress: signer, network: 'local', chainId: 'bitbadges-1', evmChainId: '90123' });
    expect(request.requestId).toMatch(/^[a-f0-9]{32}$/);
    expect(request.expiresAt).toBeGreaterThan(before);
    expect(request.expiresAt).toBeLessThanOrEqual(Date.now() + 300000);
    expect(request.txsInfo[0].msg).toEqual(messages[0].value);
    expect(payload).toMatchObject({ success: true, outcome: 'submitted', confirmed: false, verification: 'unverified' });
  });
  test('rejects absent signer rather than choosing the active browser wallet', async () => {
    await expect(browserBroadcast(messages, {})).rejects.toThrow(/expected-address|signer/i);
    expect(bridgeSign).not.toHaveBeenCalled();
  });
  test.each(['bad', 'Infinity', '-5', '0'])('rejects invalid timeout %s before handoff', async timeout => {
    await expect(browserBroadcast(messages, { expectedAddress: signer, timeout })).rejects.toThrow(/timeout/i);
    expect(bridgeSign).not.toHaveBeenCalled();
  });
  test('refuses malformed callback results even if bridge implementation changes', async () => {
    (bridgeSign as jest.Mock).mockResolvedValue({ hash: 'A'.repeat(64) });
    await expect(browserBroadcast(messages, { expectedAddress: signer })).rejects.toThrow();
  });
  test('states that browser fee review determines fees rather than silently applying flags', async () => {
    await browserBroadcast(messages, { expectedAddress: signer, fee: '123', gas: '123' });
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringMatching(/fees.*gas.*review/i));
  });
  test('emits unknown as explicitly unsafe to retry, including inline failure stdout', async () => {
    (bridgeSign as jest.Mock).mockImplementation(async ({ payload }) => ({ requestId: payload.requestId, outcome: 'unknown', error: 'Check wallet activity' }));
    const { payload } = await browserBroadcast(messages, { expectedAddress: signer });
    expect(payload).toMatchObject({ success: false, outcome: 'unknown', confirmed: false, verification: 'unverified', retrySafe: false });
    const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await executeDeploy(messages[0], { browser: true, expectedAddress: signer });
    expect(stdout).toHaveBeenCalledWith(expect.stringContaining('"retrySafe": false'));
    expect(exit).toHaveBeenCalledWith(1);
  });
});
