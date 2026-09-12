import { parseLegacyBrowserTxRequest } from './browser-signing.js';
import { convertToBitBadgesAddress } from '../address-converter/converter.js';

const legacy = () => ({ chain: 'cosmos', txsInfo: [{ type: 'gamm/SwapExactAmountIn', msg: { sender: '', tokenIn: { denom: 'ubadge', amount: '9007199254740993' } } }], signOnly: false });

describe('legacy browser transaction envelope', () => {
  test('preserves published CLI shape without inventing identity or deployment', () => {
    const input = legacy();
    const parsed = parseLegacyBrowserTxRequest(input);
    expect(parsed).toEqual(input);
    expect(parsed).not.toHaveProperty('expectedAddress');
    expect(parsed).not.toHaveProperty('network');
    expect(parsed).not.toHaveProperty('expiresAt');
    input.txsInfo[0].msg.tokenIn.amount = '1';
    expect(parsed.chain === 'cosmos' && (parsed.txsInfo[0].msg.tokenIn as any).amount).toBe('9007199254740993');
  });
  test('normalizes an explicitly supplied signer and retains optional legacy hints', () => {
    const eth = '0x1111111111111111111111111111111111111111';
    expect(parseLegacyBrowserTxRequest({ ...legacy(), expectedAddress: eth, chainId: 'bitbadges-1', chainHint: 'cosmos', mode: 'tx' })).toMatchObject({ expectedAddress: convertToBitBadgesAddress(eth), chainId: 'bitbadges-1', chainHint: 'cosmos', mode: 'tx' });
  });
  test.each([{ version: 2 }, { network: 'mainnet' }, { expiresAt: 123 }, { expectedAddress: 'Mint' }, { expectedAddress: '' }, { txsInfo: [] }, { chain: 'other' }, { mode: 'login' }, { tx: {} }, { signOnly: 'false' }, { message: 'hello' }])('rejects ambiguous or invalid legacy input %j', patch => {
    expect(() => parseLegacyBrowserTxRequest({ ...legacy(), ...patch })).toThrow();
  });
  test('accepts direct EVM transactions but rejects unsupported sign-only', () => {
    const input = { chain: 'evm', tx: { to: '0x' + '1'.repeat(40), value: '5', data: '0x' } };
    expect(parseLegacyBrowserTxRequest(input)).toEqual(input);
    expect(() => parseLegacyBrowserTxRequest({ ...input, signOnly: true })).toThrow(/sign-only/i);
  });
});
