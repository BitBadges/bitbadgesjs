import {
  buildPaymentRequestV2,
  extractPaymentRequestV2Details,
  validatePaymentRequestV2Collection,
  buildPaymentRequestV2PayMsg
} from './payment-requests-v2.js';
import { convertToBitBadgesAddress } from '../address-converter/converter.js';
import { MsgUniversalUpdateCollection } from '../transactions/messages/bitbadges/tokenization/msgUniversalUpdateCollection.js';
import chainFixture from './payment-requests-v2.chain-fixture.json';
import { handleBuildPaymentRequestV2 } from '../builder/tools/builders/buildPaymentRequestV2.js';
import { verifyStandardsCompliance as verifyStandards } from '../api-indexer/verify-standards.js';

const alice = convertToBitBadgesAddress('0x1111111111111111111111111111111111111111');
const bob = convertToBitBadgesAddress('0x2222222222222222222222222222222222222222');
const merchant = convertToBitBadgesAddress('0x3333333333333333333333333333333333333333');
const params = (): any => ({
  version: 2,
  kind: 'invoice',
  uri: 'https://example.com/invoice.json',
  obligations: [
    {
      id: 'share',
      payer: { kind: 'addresses', addresses: [alice, bob] },
      payouts: [{ recipient: merchant, denom: 'ubadge', amount: '2500000000' }],
      startTime: '1',
      endTime: '9999999999999',
      requiredPayments: '2',
      distinctPayers: true
    }
  ]
});

describe('payment obligations v2', () => {
  it.each(['updateCollectionApprovals', 'updateCollectionPermissions', 'updateCustomData', 'updateStandards', 'updateValidTokenIds'])('rejects creation message with ineffective %s', (flag) => {
    const c = buildPaymentRequestV2(params()).value;
    c[flag] = false;
    expect(validatePaymentRequestV2Collection(c).valid).toBe(false);
    expect(verifyStandards(c).valid).toBe(false);
  });
  it('rejects attempts to update frozen payment terms as though creating a new invoice', () => {
    const c = buildPaymentRequestV2(params()).value;
    c.collectionId = '42';
    expect(validatePaymentRequestV2Collection(c).valid).toBe(false);
  });
  it('accepts decorative approval metadata added by the frontend storage flow', () => {
    const c = buildPaymentRequestV2(params()).value;
    c.collectionApprovals[0].uri = 'ipfs://approval-metadata';
    c.collectionApprovals[0].customData = JSON.stringify({ name: 'Payment details' });
    expect(validatePaymentRequestV2Collection(c).valid).toBe(true);
  });
  it('recognizes actual chain-materialized collections including chain-added defaults', () => {
    expect(validatePaymentRequestV2Collection(chainFixture).errors).toEqual([]);
  });
  it('uses the same strict builder through the MCP handler and standards verifier', () => {
    const c = handleBuildPaymentRequestV2(params()).value;
    expect(verifyStandards(c).standardsChecked).toContain('PaymentRequestV2');
    expect(verifyStandards(c).violations.filter((v) => v.standard === 'PaymentRequestV2')).toEqual([]);
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins[0].amount = '1';
    expect(verifyStandards(c).valid).toBe(false);
    expect(() => handleBuildPaymentRequestV2({ ...params(), refund: true })).toThrow();
  });
  it('round trips through protobuf defaults without losing standard recognition', () => {
    const c = buildPaymentRequestV2(params()).value;
    const roundTrip = MsgUniversalUpdateCollection.fromProto(new MsgUniversalUpdateCollection(c).toProto(), BigInt);
    expect(validatePaymentRequestV2Collection(roundTrip).errors).toEqual([]);
  });
  it('emits the explicit priority requirement materialized by the chain for coin transfers', () => {
    expect(buildPaymentRequestV2(params()).value.collectionApprovals[0].approvalCriteria.mustPrioritize).toBe(true);
  });
  it('excludes payout recipients on chain for public payments', () => {
    const p = params();
    p.obligations[0].payer = { kind: 'anyone' };
    expect(buildPaymentRequestV2(p).value.collectionApprovals[0].initiatedByListId).toBe(`!(${merchant})`);
  });
  it('enforces two distinct payers using one shared approval and isolated per-initiator cap', () => {
    const c = buildPaymentRequestV2(params()).value;
    const a = c.collectionApprovals[0];
    expect(a.initiatedByListId).toBe(`${alice}:${bob}`);
    expect(a.approvalCriteria.maxNumTransfers).toMatchObject({ overallMaxNumTransfers: '2', perInitiatedByAddressMaxNumTransfers: '1' });
    expect(extractPaymentRequestV2Details(c)?.obligations[0].requiredPayments).toBe('2');
  });
  it('isolates custom shares and installments by approval and token ID', () => {
    const p = params();
    p.obligations.push({ ...p.obligations[0], id: 'later', startTime: '100', payouts: [{ recipient: merchant, denom: 'ubadge', amount: '7' }] });
    const c = buildPaymentRequestV2(p).value;
    expect(c.collectionApprovals.map((a: any) => a.approvalId)).toEqual(['payment-v2-share', 'payment-v2-later']);
    expect(c.collectionApprovals[1].tokenIds).toEqual([{ start: '2', end: '2' }]);
  });
  it('caps a shared partial target cumulatively as well as per transaction and scales split payouts', () => {
    const p = params();
    p.obligations[0] = {
      id: 'pool',
      payer: { kind: 'anyone' },
      payouts: [
        { recipient: merchant, denom: 'ubadge', amount: '3' },
        { recipient: bob, denom: 'ubadge', amount: '2' }
      ],
      startTime: '1',
      endTime: '1000',
      partial: { targetUnits: '100' }
    };
    const c = buildPaymentRequestV2(p).value;
    const criteria = c.collectionApprovals[0].approvalCriteria;
    expect(criteria.approvalAmounts.overallApprovalAmount).toBe('100');
    expect(criteria.predeterminedBalances.incrementedBalances).toMatchObject({ allowAmountScaling: true, maxScalingMultiplier: '100' });
    expect(buildPaymentRequestV2PayMsg(alice, '42', c, 'pool', '7').value.transfers[0].balances[0].amount).toBe('7');
    expect(() => buildPaymentRequestV2PayMsg(alice, '42', c, 'pool', '101')).toThrow();
  });
  it('keeps reusable links unlimited but records their overall transfer order', () => {
    const p = params();
    p.kind = 'payment-link';
    delete p.obligations[0].requiredPayments;
    delete p.obligations[0].distinctPayers;
    const c = buildPaymentRequestV2(p).value;
    expect(c.standards).toEqual(['PaymentLinkV1']);
    expect(c.collectionApprovals[0].approvalCriteria.maxNumTransfers.overallMaxNumTransfers).toBe('0');
    expect(c.collectionApprovals[0].approvalCriteria.predeterminedBalances.orderCalculationMethod.useOverallNumTransfers).toBe(true);
  });
  it.each(['requiredPayments', 'endTime', 'amount'])('rejects invalid integer %s without floating point coercion', (field) => {
    const p = params();
    if (field === 'amount') p.obligations[0].payouts[0].amount = '1.5';
    else p.obligations[0][field] = '1.5';
    expect(() => buildPaymentRequestV2(p)).toThrow();
  });
  it('rejects duplicates, impossible quorum and unsupported cancellation', () => {
    const p = params();
    p.obligations[0].payer.addresses = [alice, alice];
    expect(() => buildPaymentRequestV2(p)).toThrow();
    const q = params();
    q.obligations[0].requiredPayments = '3';
    expect(() => buildPaymentRequestV2(q)).toThrow();
    expect(() => buildPaymentRequestV2({ ...params(), cancellation: true })).toThrow();
  });
  it.each(['payout', 'cap', 'reset', 'approval', 'permissions', 'extra'])('rejects forged %s despite trusted-looking metadata', (field) => {
    const c = buildPaymentRequestV2(params()).value;
    const a = c.collectionApprovals[0];
    if (field === 'payout') a.approvalCriteria.coinTransfers[0].coins[0].amount = '1';
    if (field === 'cap') a.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers = '0';
    if (field === 'reset') a.approvalCriteria.maxNumTransfers.resetTimeIntervals.intervalLength = '100';
    if (field === 'approval') a.approvalId = 'other';
    if (field === 'permissions') c.collectionPermissions.canUpdateCollectionApprovals = [];
    if (field === 'extra') c.collectionApprovals.push({ ...a, approvalId: 'extra' });
    expect(validatePaymentRequestV2Collection(c).valid).toBe(false);
    expect(extractPaymentRequestV2Details(c)).toBeNull();
  });
  it('rejects unauthorized payer and fractional pay units', () => {
    const c = buildPaymentRequestV2(params()).value;
    expect(() => buildPaymentRequestV2PayMsg(merchant, '42', c, 'share')).toThrow();
    expect(() => buildPaymentRequestV2PayMsg(alice, '42', c, 'share', '1.1')).toThrow();
  });
});
