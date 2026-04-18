/**
 * Tests for auctions.ts — Auction standard protocol validator.
 *
 * Covers validateAuctionCollection + doesCollectionFollowAuctionProtocol.
 * A valid Auction has 0-2 approvals (a mint-to-winner + optional burn).
 * Post-settlement state (no mint approval left) is valid — the mint
 * approval auto-deletes afterOneUse. Unbounded transferTimes are rejected.
 */

import { validateAuctionCollection, doesCollectionFollowAuctionProtocol } from './auctions.js';
import { GO_MAX_UINT_64 } from '../common/math.js';

const makeMintApproval = () => ({
  approvalId: 'mint-to-winner',
  fromListId: 'Mint',
  toListId: 'bb1winner',
  initiatedByListId: 'bb1seller',
  transferTimes: [{ start: 1n, end: 1000n }],
  tokenIds: [{ start: 1n, end: 1n }],
  approvalCriteria: {
    maxNumTransfers: { overallMaxNumTransfers: 1n },
    overridesFromOutgoingApprovals: true
  }
});

const makeBurnApproval = () => ({
  approvalId: 'burn',
  fromListId: '!Mint',
  toListId: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
  initiatedByListId: 'All',
  transferTimes: [{ start: 1n, end: 1000n }],
  tokenIds: [{ start: 1n, end: 1n }],
  approvalCriteria: {
    maxNumTransfers: { overallMaxNumTransfers: 1n }
  }
});

const makeValidCollection = (): any => ({
  standards: ['Auction'],
  validTokenIds: [{ start: 1n, end: 1n }],
  collectionApprovals: [makeMintApproval()]
});

// ---- happy path ----------------------------------------------------------

describe('validateAuctionCollection — happy path', () => {
  it('accepts a minimal valid auction with just a mint approval', () => {
    const r = validateAuctionCollection(makeValidCollection());
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('accepts an auction with both mint + burn (2 approvals)', () => {
    const c = makeValidCollection();
    c.collectionApprovals = [makeMintApproval(), makeBurnApproval()];
    const r = validateAuctionCollection(c);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('accepts post-settlement state (no mint approval remaining)', () => {
    // After auto-deletion of the mint-to-winner approval, the collection
    // may be left with just the burn approval, or zero approvals.
    const c = makeValidCollection();
    c.collectionApprovals = [makeBurnApproval()];
    const r = validateAuctionCollection(c);
    expect(r.valid).toBe(true);

    c.collectionApprovals = [];
    const r2 = validateAuctionCollection(c);
    expect(r2.valid).toBe(true);
  });

  it('doesCollectionFollowAuctionProtocol returns true for a valid collection', () => {
    expect(doesCollectionFollowAuctionProtocol(makeValidCollection())).toBe(true);
  });
});

// ---- standard check ------------------------------------------------------

describe('validateAuctionCollection — standards check', () => {
  it('rejects when "Auction" is missing', () => {
    const c = makeValidCollection();
    c.standards = ['Other'];
    const r = validateAuctionCollection(c);
    expect(r.errors).toContain('Missing "Auction" standard');
    expect(r.valid).toBe(false);
  });

  it('rejects when standards is undefined', () => {
    const c = makeValidCollection();
    c.standards = undefined;
    expect(validateAuctionCollection(c).errors).toContain('Missing "Auction" standard');
  });

  it('accepts multi-standard including Auction', () => {
    const c = makeValidCollection();
    c.standards = ['Bounty', 'Auction', 'Other'];
    expect(validateAuctionCollection(c).valid).toBe(true);
  });
});

// ---- validTokenIds -------------------------------------------------------

describe('validateAuctionCollection — validTokenIds', () => {
  it('rejects multiple ranges', () => {
    const c = makeValidCollection();
    c.validTokenIds = [
      { start: 1n, end: 1n },
      { start: 2n, end: 2n }
    ];
    expect(validateAuctionCollection(c).errors).toContain('validTokenIds must be exactly [{start: 1, end: 1}]');
  });

  it('rejects range [1,2]', () => {
    const c = makeValidCollection();
    c.validTokenIds = [{ start: 1n, end: 2n }];
    expect(validateAuctionCollection(c).errors).toContain('validTokenIds must be exactly [{start: 1, end: 1}]');
  });

  it('rejects empty validTokenIds', () => {
    const c = makeValidCollection();
    c.validTokenIds = [];
    expect(validateAuctionCollection(c).errors).toContain('validTokenIds must be exactly [{start: 1, end: 1}]');
  });
});

// ---- approval count ------------------------------------------------------

describe('validateAuctionCollection — approval count cap', () => {
  it('rejects >2 approvals', () => {
    const c = makeValidCollection();
    c.collectionApprovals = [makeMintApproval(), makeBurnApproval(), makeBurnApproval()];
    const r = validateAuctionCollection(c);
    expect(r.errors.some((e: string) => e.includes('Expected 0-2 approvals'))).toBe(true);
  });
});

// ---- mint approval rules -------------------------------------------------

describe('validateAuctionCollection — mint approval rules', () => {
  it('rejects when overallMaxNumTransfers is not 1', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.maxNumTransfers.overallMaxNumTransfers = 2n;
    expect(validateAuctionCollection(c).errors).toContain('Mint-to-winner overallMaxNumTransfers must be 1');
  });

  it('rejects when maxNumTransfers is missing', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.maxNumTransfers = undefined;
    expect(validateAuctionCollection(c).errors).toContain('Mint-to-winner overallMaxNumTransfers must be 1');
  });

  it('rejects when overridesFromOutgoingApprovals is false', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.overridesFromOutgoingApprovals = false;
    expect(validateAuctionCollection(c).errors).toContain(
      'Mint-to-winner must have overridesFromOutgoingApprovals=true'
    );
  });

  it('rejects when initiatedByListId is "All" (seller must be restricted)', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].initiatedByListId = 'All';
    expect(validateAuctionCollection(c).errors).toContain(
      'Mint-to-winner initiatedByListId must restrict to seller (not "All")'
    );
  });

  it('rejects unbounded transferTimes (max uint64)', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].transferTimes = [{ start: 1n, end: GO_MAX_UINT_64 }];
    expect(validateAuctionCollection(c).errors).toContain(
      'Mint-to-winner transferTimes must have a bounded end date (not max uint64)'
    );
  });

  it('rejects transferTimes end strictly greater than max uint64 (>=)', () => {
    // >= GO_MAX_UINT_64 is rejected per the ">=" comparison.
    const c = makeValidCollection();
    c.collectionApprovals[0].transferTimes = [{ start: 1n, end: GO_MAX_UINT_64 + 1n }];
    expect(validateAuctionCollection(c).errors).toContain(
      'Mint-to-winner transferTimes must have a bounded end date (not max uint64)'
    );
  });

  it('accepts transferTimes end just below max uint64', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].transferTimes = [{ start: 1n, end: GO_MAX_UINT_64 - 1n }];
    expect(validateAuctionCollection(c).valid).toBe(true);
  });

  it('does not complain when transferTimes is absent', () => {
    // tt is optional in the check — empty/undefined is not flagged
    const c = makeValidCollection();
    c.collectionApprovals[0].transferTimes = [];
    expect(
      validateAuctionCollection(c).errors.some((e: string) => e.includes('transferTimes'))
    ).toBe(false);
  });
});

// ---- doesCollectionFollowAuctionProtocol ---------------------------------

describe('doesCollectionFollowAuctionProtocol', () => {
  it('returns false for an invalid auction', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].initiatedByListId = 'All';
    expect(doesCollectionFollowAuctionProtocol(c)).toBe(false);
  });

  it('returns true when all rules are met', () => {
    expect(doesCollectionFollowAuctionProtocol(makeValidCollection())).toBe(true);
  });
});
