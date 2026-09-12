import { getPaymentRequestV2Type, paymentRequestV2TermsSchema, type PaymentObligation, type PaymentRequestV2Terms } from './payment-requests-v2.js';
import { convertToBitBadgesAddress } from '../address-converter/converter.js';

const alice = convertToBitBadgesAddress('0x1111111111111111111111111111111111111111');
const bob = convertToBitBadgesAddress('0x2222222222222222222222222222222222222222');
const recipient = convertToBitBadgesAddress('0x3333333333333333333333333333333333333333');
const anotherRecipient = convertToBitBadgesAddress('0x4444444444444444444444444444444444444444');
const obligation = (overrides: Partial<PaymentObligation> = {}): PaymentObligation => ({
  id: 'one',
  payer: { kind: 'addresses', addresses: [alice] },
  payouts: [{ recipient, denom: 'ubadge', amount: '10' }],
  startTime: '1',
  endTime: '100',
  ...overrides
});
function terms(obligations: PaymentObligation[], kind: PaymentRequestV2Terms['kind'] = 'invoice') {
  return paymentRequestV2TermsSchema.parse({ version: 2, kind, obligations });
}

describe('canonical payment type inference', () => {
  it.each([
    ['specific', terms([obligation()])],
    ['anyone', terms([obligation({ payer: { kind: 'anyone' } })])],
    ['one', terms([obligation({ payer: { kind: 'addresses', addresses: [alice, bob] } })])],
    ['all', terms([obligation(), obligation({ id: 'two', payer: { kind: 'addresses', addresses: [bob] } })])],
    ['threshold', terms([obligation({ payer: { kind: 'addresses', addresses: [alice, bob] }, requiredPayments: '2', distinctPayers: true })])],
    ['installments', terms([obligation(), obligation({ id: 'two', startTime: '101', endTime: '200' })])],
    ['partial', terms([obligation({ partial: { targetUnits: '10' } })])],
    ['target', terms([obligation({ payer: { kind: 'anyone' }, partial: { targetUnits: '10' } })])],
    ['link', terms([obligation()], 'payment-link')]
  ] as const)('recognizes %s from validated economic terms', (expected, value) => {
    expect(getPaymentRequestV2Type(value)).toBe(expected);
  });

  it('recognizes a public distinct threshold', () => {
    expect(getPaymentRequestV2Type(terms([obligation({ payer: { kind: 'anyone' }, requiredPayments: '3', distinctPayers: true })]))).toBe(
      'threshold'
    );
  });

  it.each([
    [obligation(), obligation({ id: 'two', payer: { kind: 'anyone' } })],
    [obligation({ partial: { targetUnits: '10' }, payer: { kind: 'addresses', addresses: [alice, bob] } })],
    [obligation({ requiredPayments: '2' })],
    [obligation(), obligation({ id: 'two', payer: { kind: 'addresses', addresses: [bob] } }), obligation({ id: 'three' })],
    [obligation(), obligation({ id: 'two', payouts: [{ recipient: anotherRecipient, denom: 'ubadge', amount: '10' }] })],
    [obligation(), obligation({ id: 'two', payouts: [{ recipient, denom: 'uusdc', amount: '10' }] })]
  ])('keeps mixed or incompatible obligation shapes custom', (...obligations) => {
    expect(getPaymentRequestV2Type(terms(obligations))).toBe('custom');
  });

  it('compares recipient/denomination shape independent of order and amount without mutating terms', () => {
    const payouts = [
      { recipient, denom: 'ubadge', amount: '10' },
      { recipient: anotherRecipient, denom: 'uusdc', amount: '20' }
    ];
    const value = terms([obligation({ payouts }), obligation({ id: 'two', payouts: [...payouts].reverse().map((p) => ({ ...p, amount: '99' })) })]);
    const before = JSON.stringify(value);
    expect(getPaymentRequestV2Type(value)).toBe('installments');
    expect(JSON.stringify(value)).toBe(before);
  });
});
