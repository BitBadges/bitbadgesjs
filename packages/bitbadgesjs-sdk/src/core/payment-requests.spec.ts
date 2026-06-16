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
  doesCollectionFollowPaymentRequestProtocol,
  extractPaymentRequestDetails,
  derivePaymentRequestStatusFallback,
  buildPaymentRequestPayMsg,
  buildPaymentRequestDenyMsg
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

describe('validatePaymentRequestCollection — open-ended payer-eligibility gates', () => {
  // The mint form lets creators gate WHO may pay (badge ownership / KYC
  // allowlist) by layering mustOwnTokens / dynamicStoreChallenges onto the
  // PAY approval. The protocol check deliberately ignores those fields —
  // adding them must NOT invalidate the collection (the Create button gates
  // on this). votingChallenges stays the only forbidden gate.
  it('still valid with mustOwnTokens on the pay approval', () => {
    const c = fresh();
    c.collectionApprovals[0].approvalCriteria.mustOwnTokens = [
      {
        collectionId: 1n,
        amountRange: { start: 1n, end: 1n },
        tokenIds: [{ start: 1n, end: 1n }],
        ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
        overrideWithCurrentTime: true,
        mustSatisfyForAllAssets: true,
        ownershipCheckParty: 'initiator'
      }
    ];
    expect(validatePaymentRequestCollection(c).valid).toBe(true);
  });

  it('still valid with dynamicStoreChallenges on the pay approval', () => {
    const c = fresh();
    c.collectionApprovals[0].approvalCriteria.dynamicStoreChallenges = [{ storeId: 9n, ownershipCheckParty: 'initiator' }];
    expect(validatePaymentRequestCollection(c).valid).toBe(true);
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

// ── End-user helper tests ──────────────────────────────────────────────────

describe('extractPaymentRequestDetails', () => {
  it('splits a valid PR collection into pay + deny + metadata', () => {
    const c = makeValidCollection();
    const details = extractPaymentRequestDetails(c.collectionApprovals);
    expect(details).not.toBeNull();
    expect(details!.payApproval.approvalId).toBe('payment-request-pay');
    expect(details!.denyApproval.approvalId).toBe('payment-request-deny');
    expect(details!.payerAddress).toBe(PAYER);
    expect(details!.recipientAddress).toBe(RECIPIENT);
    expect(details!.expirationTime).toBe(1000n);
    expect(details!.paymentCoins).toEqual([{ denom: 'uusdc', amount: 10000000n }]);
  });

  it('returns null when no pay approval (no coinTransfers)', () => {
    expect(extractPaymentRequestDetails([makeDenyApproval(), makeDenyApproval()] as any)).toBeNull();
  });

  it('returns null when deny approval window does not match pay end', () => {
    const pay = makePayApproval();
    const deny = makeDenyApproval();
    deny.transferTimes[0].end = 9999n;
    expect(extractPaymentRequestDetails([pay, deny] as any)).toBeNull();
  });

  it('is order-independent (deny first, pay second)', () => {
    const details = extractPaymentRequestDetails([makeDenyApproval(), makePayApproval()] as any);
    expect(details).not.toBeNull();
    expect(details!.payApproval.approvalId).toBe('payment-request-pay');
  });
});

describe('derivePaymentRequestStatusFallback', () => {
  it('returns "pending" when expiration is in the future', () => {
    const future = BigInt(Date.now() + 60000);
    expect(derivePaymentRequestStatusFallback(future)).toBe('pending');
  });

  it('returns "expired" when expiration is in the past', () => {
    const past = BigInt(Date.now() - 60000);
    expect(derivePaymentRequestStatusFallback(past)).toBe('expired');
  });

  it('returns "pending" for zero expiration (no deadline configured)', () => {
    expect(derivePaymentRequestStatusFallback(0n)).toBe('pending');
  });
});

describe('buildPaymentRequestPayMsg / DenyMsg', () => {
  it('emits a JSON-ready MsgTransferTokens envelope targeting the pay approval', () => {
    const pay = makePayApproval();
    const msg = buildPaymentRequestPayMsg(PAYER, '42', pay as any);
    expect(msg.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect((msg.value as any).creator).toBe(PAYER);
    expect((msg.value as any).collectionId).toBe('42');
    const transfer = (msg.value as any).transfers[0];
    expect(transfer.prioritizedApprovals[0].approvalId).toBe('payment-request-pay');
    expect(transfer.onlyCheckPrioritizedCollectionApprovals).toBe(true);
    expect(transfer.from).toBe('Mint');
    expect(transfer.toAddresses).toEqual([BURN]);
  });

  it('Deny msg points at the deny approval id', () => {
    const deny = makeDenyApproval();
    const msg = buildPaymentRequestDenyMsg(PAYER, '42', deny as any);
    expect((msg.value as any).transfers[0].prioritizedApprovals[0].approvalId).toBe('payment-request-deny');
  });

  it('output is JSON-stringifiable (uint64s are strings, not bigints)', () => {
    const pay = makePayApproval();
    const msg = buildPaymentRequestPayMsg(PAYER, '42', pay as any);
    expect(() => JSON.stringify(msg)).not.toThrow();
    const transfer = (msg.value as any).transfers[0];
    expect(typeof transfer.balances[0].amount).toBe('string');
    expect(typeof transfer.balances[0].tokenIds[0].start).toBe('string');
    expect(typeof transfer.balances[0].ownershipTimes[0].end).toBe('string');
    expect(typeof transfer.prioritizedApprovals[0].version).toBe('string');
  });
});
