import { buildPaymentRequestV2, validatePaymentRequestV2Collection } from './payment-requests-v2.js';
import { MsgUniversalUpdateCollection } from '../transactions/messages/bitbadges/tokenization/msgUniversalUpdateCollection.js';
import chainFixture from './payment-requests-v2.chain-fixture.json';

function params(): any {
  const terms = JSON.parse(chainFixture.customData).paymentRequest;
  return { ...terms, uri: 'https://example.com/invoice.json', obligations: [{ ...terms.obligations[0], startTime: '100', endTime: '200' }] };
}
describe('invoice timestamp boundaries and schema combinations', () => {
  it.each(['100', '200'])('accepts due date on inclusive window boundary %s', (dueAt) => {
    const p = params();
    p.obligations[0].dueAt = dueAt;
    const c = buildPaymentRequestV2(p).value;
    const roundTrip = MsgUniversalUpdateCollection.fromProto(new MsgUniversalUpdateCollection(c).toProto(), BigInt);
    expect(validatePaymentRequestV2Collection(roundTrip).valid).toBe(true);
  });
  it.each(['99', '201'])('rejects due date outside the window %s', (dueAt) => {
    const p = params();
    p.obligations[0].dueAt = dueAt;
    expect(() => buildPaymentRequestV2(p)).toThrow(/Due date outside/);
  });
  it.each(['startTime', 'endTime', 'dueAt'])('requires positive uint64 integer timestamps for %s', (field) => {
    for (const value of ['0', '-1', '1.5', '1e3', '18446744073709551616']) {
      const p = params();
      p.obligations[0][field] = value;
      expect(() => buildPaymentRequestV2(p)).toThrow();
    }
  });
  it('accepts a single-millisecond window at the uint64 maximum without rounding', () => {
    const p = params();
    Object.assign(p.obligations[0], { startTime: '18446744073709551615', endTime: '18446744073709551615', dueAt: '18446744073709551615' });
    const c = buildPaymentRequestV2(p).value;
    expect(c.collectionApprovals[0].transferTimes).toEqual([{ start: '18446744073709551615', end: '18446744073709551615' }]);
    expect(validatePaymentRequestV2Collection(c).valid).toBe(true);
  });
  it('rejects a reversed payment window', () => {
    const p = params();
    p.obligations[0].startTime = '201';
    expect(() => buildPaymentRequestV2(p)).toThrow(/Invalid payment window/);
  });
  it.each([{ requiredPayments: '1' }, { distinctPayers: true }])('rejects partial payments combined with %o', (extra) => {
    const p = params();
    Object.assign(p.obligations[0], { partial: { targetUnits: '2' }, ...extra });
    expect(() => buildPaymentRequestV2(p)).toThrow(/Partial payments cannot/);
  });
  it.each([{ requiredPayments: '1' }, { distinctPayers: true }, { partial: { targetUnits: '2' } }])(
    'rejects reusable links combined with %o',
    (extra) => {
      const p = params();
      p.kind = 'payment-link';
      Object.assign(p.obligations[0], extra);
      expect(() => buildPaymentRequestV2(p)).toThrow(/Reusable links must/);
    }
  );
  it('allows repeated fixed payments from one payer but rejects an impossible distinct payer count', () => {
    const p = params();
    p.obligations[0].requiredPayments = '2';
    expect(() => buildPaymentRequestV2(p)).not.toThrow();
    p.obligations[0].distinctPayers = true;
    expect(() => buildPaymentRequestV2(p)).toThrow(/Required distinct payers exceed/);
  });
});
