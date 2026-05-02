/**
 * Tests for payment-requests.ts — PaymentRequest standard protocol validator.
 *
 * Covers validatePaymentRequestCollection +
 * doesCollectionFollowPaymentRequestProtocol. A valid PaymentRequest has
 * 3 approvals (pay, deny, expire) where pay and deny share the payer's
 * initiatedByListId and the active window, expire starts after that
 * window, and only pay carries a coinTransfer (with
 * overrideFromWithApproverAddress=false so the chain debits the payer).
 */

import {
  validatePaymentRequestCollection,
  doesCollectionFollowPaymentRequestProtocol
} from './payment-requests.js';

const BURN = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const PAYER = 'bb1payer';
const RECIPIENT = 'bb1recipient';

const makePayApproval = () => ({
  approvalId: 'payment-request-pay',
  fromListId: 'Mint',
  toListId: BURN,
  initiatedByListId: PAYER,
  transferTimes: [{ start: 1n, end: 1000n }],
  tokenIds: [{ start: 1n, end: 1n }],
  approvalCriteria: {
    overridesFromOutgoingApprovals: true,
    overridesToIncomingApprovals: true,
    maxNumTransfers: { overallMaxNumTransfers: 1n },
    coinTransfers: [
      {
        to: RECIPIENT,
        overrideFromWithApproverAddress: false,
        overrideToWithInitiator: false,
        coins: [{ denom: 'uusdc', amount: 10000000n }]
      }
    ]
  }
});

const makeDenyApproval = () => ({
  approvalId: 'payment-request-deny',
  fromListId: 'Mint',
  toListId: BURN,
  initiatedByListId: PAYER,
  transferTimes: [{ start: 1n, end: 1000n }],
  tokenIds: [{ start: 1n, end: 1n }],
  approvalCriteria: {
    overridesFromOutgoingApprovals: true,
    overridesToIncomingApprovals: true,
    maxNumTransfers: { overallMaxNumTransfers: 1n }
  }
});

const makeValidCollection = (): any => ({
  standards: ['PaymentRequest'],
  validTokenIds: [{ start: 1n, end: 1n }],
  collectionApprovals: [makePayApproval(), makeDenyApproval()],
  collectionPermissions: {}
});

// JSON-based clone loses bigints; build fresh fixtures and override
// individual fields directly instead.
const fresh = makeValidCollection;

describe('validatePaymentRequestCollection — happy path', () => {
  it('accepts a minimal valid PaymentRequest collection', () => {
    const result = validatePaymentRequestCollection(makeValidCollection());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('doesCollectionFollowPaymentRequestProtocol returns true for a valid collection', () => {
    expect(doesCollectionFollowPaymentRequestProtocol(makeValidCollection())).toBe(true);
  });
});

describe('validatePaymentRequestCollection — standards check', () => {
  it('rejects when "PaymentRequest" standard is missing', () => {
    const c = fresh();
    c.standards = ['Other'];
    expect(validatePaymentRequestCollection(c).errors).toContain('Missing "PaymentRequest" standard');
  });

  it('accepts multi-standard collection that includes "PaymentRequest"', () => {
    const c = makeValidCollection();
    c.standards = ['Other', 'PaymentRequest'];
    expect(validatePaymentRequestCollection(c).valid).toBe(true);
  });
});

describe('validatePaymentRequestCollection — no-escrow inversion invariants', () => {
  it('rejects pay approval with overrideFromWithApproverAddress=true (would attempt escrow debit)', () => {
    const c = fresh();
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress = true;
    const r = validatePaymentRequestCollection(c);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes('overrideFromWithApproverAddress=false'))).toBe(true);
  });

  it('rejects more than one approval carrying a coinTransfer', () => {
    const c = fresh();
    c.collectionApprovals[1].approvalCriteria.coinTransfers = [
      {
        to: RECIPIENT,
        overrideFromWithApproverAddress: false,
        coins: [{ denom: 'uusdc', amount: 10000000n }]
      }
    ];
    const r = validatePaymentRequestCollection(c);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes('Expected exactly 1 approval with a coinTransfer'))).toBe(true);
  });

  it('rejects votingChallenges (gating must be via initiatedByListId, not voting)', () => {
    const c = fresh();
    c.collectionApprovals[0].approvalCriteria.votingChallenges = [{ voters: [{ address: PAYER }] }];
    const r = validatePaymentRequestCollection(c);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes('PaymentRequest must not use votingChallenges'))).toBe(true);
  });

  it('rejects mismatched initiatedByListId between pay and deny', () => {
    const c = fresh();
    c.collectionApprovals[1].initiatedByListId = 'bb1someoneelse';
    const r = validatePaymentRequestCollection(c);
    expect(r.errors.some((e: string) => e.includes('Pay and deny approvals must share the same initiatedByListId'))).toBe(true);
  });

  it('rejects payer == recipient (self-payment is a no-op)', () => {
    const c = fresh();
    // Force the pay approval's recipient to equal the payer.
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].to = PAYER;
    const r = validatePaymentRequestCollection(c);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes('recipient must not equal the payer'))).toBe(true);
  });
});

describe('validatePaymentRequestCollection — approval shape', () => {
  it('rejects when fewer than 2 approvals', () => {
    const c = fresh();
    c.collectionApprovals = [makePayApproval()];
    expect(validatePaymentRequestCollection(c).valid).toBe(false);
  });

  it('rejects more than 2 approvals (e.g. an expire branch is forbidden)', () => {
    const c = fresh();
    c.collectionApprovals.push({
      approvalId: 'payment-request-expire',
      fromListId: 'Mint',
      toListId: BURN,
      initiatedByListId: 'All',
      transferTimes: [{ start: 1001n, end: 2000n }],
      tokenIds: [{ start: 1n, end: 1n }],
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        maxNumTransfers: { overallMaxNumTransfers: 1n }
      }
    });
    expect(validatePaymentRequestCollection(c).valid).toBe(false);
  });

  it('rejects validTokenIds != [{1,1}]', () => {
    const c = fresh();
    c.validTokenIds = [{ start: 1n, end: 2n }];
    expect(validatePaymentRequestCollection(c).errors).toContain('validTokenIds must be exactly [{start: 1, end: 1}]');
  });

  it('rejects when fromListId is not "Mint"', () => {
    const c = fresh();
    c.collectionApprovals[0].fromListId = 'All';
    expect(validatePaymentRequestCollection(c).errors.some((e: string) => e.includes('fromListId must be "Mint"'))).toBe(true);
  });

  it('rejects when toListId is not the burn address', () => {
    const c = fresh();
    c.collectionApprovals[0].toListId = 'bb1other';
    expect(validatePaymentRequestCollection(c).errors.some((e: string) => e.includes('toListId must be burn address'))).toBe(true);
  });
});
