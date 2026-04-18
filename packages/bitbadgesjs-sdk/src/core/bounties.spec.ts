/**
 * Tests for bounties.ts — Bounty standard protocol validator.
 *
 * Covers validateBountyCollection + doesCollectionFollowBountyProtocol.
 * A valid Bounty has 3 approvals (accept, deny, expire) where accept+deny
 * share a verifier voting challenge and the expire path has no voting and
 * starts after the accept/deny expiration.
 */

import { validateBountyCollection, doesCollectionFollowBountyProtocol } from './bounties.js';

const BURN = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const VERIFIER = 'bb1verifier';

// ---- fixture helpers ------------------------------------------------------

const makeAcceptApproval = () => ({
  approvalId: 'accept',
  fromListId: 'Mint',
  toListId: BURN,
  initiatedByListId: 'All',
  transferTimes: [{ start: 1n, end: 1000n }],
  tokenIds: [{ start: 1n, end: 1n }],
  approvalCriteria: {
    overridesFromOutgoingApprovals: true,
    overridesToIncomingApprovals: true,
    maxNumTransfers: { overallMaxNumTransfers: 1n },
    coinTransfers: [
      {
        to: 'bb1recipient',
        overrideFromWithApproverAddress: true,
        coins: [{ denom: 'ubadge', amount: 100n }]
      }
    ],
    votingChallenges: [{ voters: [{ address: VERIFIER }] }]
  }
});

const makeDenyApproval = () => ({
  approvalId: 'deny',
  fromListId: 'Mint',
  toListId: BURN,
  initiatedByListId: 'All',
  transferTimes: [{ start: 1n, end: 1000n }],
  tokenIds: [{ start: 1n, end: 1n }],
  approvalCriteria: {
    overridesFromOutgoingApprovals: true,
    overridesToIncomingApprovals: true,
    maxNumTransfers: { overallMaxNumTransfers: 1n },
    coinTransfers: [
      {
        to: 'bb1submitter',
        overrideFromWithApproverAddress: true,
        coins: [{ denom: 'ubadge', amount: 100n }]
      }
    ],
    votingChallenges: [{ voters: [{ address: VERIFIER }] }]
  }
});

const makeExpireApproval = () => ({
  approvalId: 'expire',
  fromListId: 'Mint',
  toListId: BURN,
  initiatedByListId: 'All',
  transferTimes: [{ start: 1001n, end: 2000n }],
  tokenIds: [{ start: 1n, end: 1n }],
  approvalCriteria: {
    overridesFromOutgoingApprovals: true,
    overridesToIncomingApprovals: true,
    maxNumTransfers: { overallMaxNumTransfers: 1n },
    coinTransfers: [
      {
        to: 'bb1submitter',
        overrideFromWithApproverAddress: true,
        coins: [{ denom: 'ubadge', amount: 100n }]
      }
    ]
    // no votingChallenges
  }
});

const makeValidCollection = (): any => ({
  standards: ['Bounty'],
  validTokenIds: [{ start: 1n, end: 1n }],
  collectionApprovals: [makeAcceptApproval(), makeDenyApproval(), makeExpireApproval()],
  collectionPermissions: {}
});

const clone = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() + 'n' : v)), (_k, v) => {
    if (typeof v === 'string' && /^\d+n$/.test(v)) return BigInt(v.slice(0, -1));
    return v;
  });

// ---- tests ---------------------------------------------------------------

describe('validateBountyCollection — happy path', () => {
  it('accepts a minimal valid bounty collection', () => {
    const result = validateBountyCollection(makeValidCollection());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('doesCollectionFollowBountyProtocol returns true for a valid collection', () => {
    expect(doesCollectionFollowBountyProtocol(makeValidCollection())).toBe(true);
  });
});

describe('validateBountyCollection — standards check', () => {
  it('rejects when "Bounty" standard is missing', () => {
    const c = clone(makeValidCollection());
    c.standards = ['Other'];
    const r = validateBountyCollection(c);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('Missing "Bounty" standard');
  });

  it('rejects when standards is undefined', () => {
    const c = clone(makeValidCollection());
    c.standards = undefined;
    const r = validateBountyCollection(c);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('Missing "Bounty" standard');
  });

  it('accepts multi-standard collection that includes "Bounty"', () => {
    const c = makeValidCollection();
    c.standards = ['Other', 'Bounty', 'Extra'];
    const r = validateBountyCollection(c);
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });
});

describe('validateBountyCollection — validTokenIds', () => {
  it('rejects validTokenIds != [{1,1}] (wrong range)', () => {
    const c = clone(makeValidCollection());
    c.validTokenIds = [{ start: 1n, end: 2n }];
    const r = validateBountyCollection(c);
    expect(r.errors).toContain('validTokenIds must be exactly [{start: 1, end: 1}]');
  });

  it('rejects empty validTokenIds', () => {
    const c = clone(makeValidCollection());
    c.validTokenIds = [];
    expect(validateBountyCollection(c).errors).toContain('validTokenIds must be exactly [{start: 1, end: 1}]');
  });

  it('rejects multiple validTokenIds ranges', () => {
    const c = clone(makeValidCollection());
    c.validTokenIds = [
      { start: 1n, end: 1n },
      { start: 2n, end: 2n }
    ];
    expect(validateBountyCollection(c).errors).toContain('validTokenIds must be exactly [{start: 1, end: 1}]');
  });

  it('rejects start != 1', () => {
    const c = clone(makeValidCollection());
    c.validTokenIds = [{ start: 2n, end: 2n }];
    expect(validateBountyCollection(c).errors).toContain('validTokenIds must be exactly [{start: 1, end: 1}]');
  });
});

describe('validateBountyCollection — approval count', () => {
  it('rejects when fewer than 3 approvals', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals = [makeAcceptApproval(), makeDenyApproval()];
    const r = validateBountyCollection(c);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes('Expected exactly 3 approvals'))).toBe(true);
  });

  it('rejects when more than 3 approvals', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals = [
      makeAcceptApproval(),
      makeDenyApproval(),
      makeExpireApproval(),
      makeExpireApproval()
    ];
    expect(validateBountyCollection(c).errors.some((e: string) => e.includes('found 4'))).toBe(true);
  });

  it('short-circuits on wrong count — no per-approval errors run', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals = [];
    const r = validateBountyCollection(c);
    // Only the count error is expected (plus possibly standards if applicable)
    expect(r.errors.filter((e: string) => e.includes('Approval'))).toEqual([]);
  });
});

describe('validateBountyCollection — fromListId / toListId', () => {
  it('rejects approval with fromListId != "Mint"', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[0].fromListId = '!Mint';
    const r = validateBountyCollection(c);
    expect(r.errors.some((e: string) => e.includes('fromListId must be "Mint"'))).toBe(true);
  });

  it('rejects approval whose toListId is not the burn address', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[0].toListId = 'bb1someaddr';
    const r = validateBountyCollection(c);
    expect(r.errors.some((e: string) => e.includes('toListId must be burn address'))).toBe(true);
  });
});

describe('validateBountyCollection — maxNumTransfers', () => {
  it('rejects when overallMaxNumTransfers is not 1', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[0].approvalCriteria.maxNumTransfers.overallMaxNumTransfers = 2n;
    const r = validateBountyCollection(c);
    expect(r.errors.some((e: string) => e.includes('overallMaxNumTransfers must be 1'))).toBe(true);
  });

  it('rejects when maxNumTransfers is missing entirely', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[0].approvalCriteria.maxNumTransfers = undefined;
    expect(validateBountyCollection(c).errors.some((e: string) => e.includes('overallMaxNumTransfers must be 1'))).toBe(true);
  });
});

describe('validateBountyCollection — override flags', () => {
  it('rejects when overridesFromOutgoingApprovals is false', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[0].approvalCriteria.overridesFromOutgoingApprovals = false;
    expect(
      validateBountyCollection(c).errors.some((e: string) => e.includes('overridesFromOutgoingApprovals must be true'))
    ).toBe(true);
  });

  it('rejects when overridesToIncomingApprovals is false', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[0].approvalCriteria.overridesToIncomingApprovals = false;
    expect(
      validateBountyCollection(c).errors.some((e: string) => e.includes('overridesToIncomingApprovals must be true'))
    ).toBe(true);
  });
});

describe('validateBountyCollection — coinTransfers', () => {
  it('rejects when coinTransfers length != 1', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[0].approvalCriteria.coinTransfers = [];
    const r = validateBountyCollection(c);
    expect(r.errors.some((e: string) => e.includes('must have exactly 1 coinTransfer'))).toBe(true);
  });

  it('rejects when coinTransfer.overrideFromWithApproverAddress is false', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress = false;
    expect(
      validateBountyCollection(c).errors.some((e: string) =>
        e.includes('coinTransfer must have overrideFromWithApproverAddress=true')
      )
    ).toBe(true);
  });

  it('rejects when denoms do not match across approvals', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins[0].denom = 'uusdc';
    expect(validateBountyCollection(c).errors).toContain('All approvals must use the same coin denom');
  });

  it('rejects when amounts do not match across approvals', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins[0].amount = 999n;
    expect(validateBountyCollection(c).errors).toContain('All approvals must transfer the same amount');
  });
});

describe('validateBountyCollection — voting structure', () => {
  it('rejects when 3 approvals have voting (expected 2)', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[2].approvalCriteria.votingChallenges = [
      { voters: [{ address: VERIFIER }] }
    ];
    expect(validateBountyCollection(c).errors.some((e: string) => e.includes('Expected 2 approvals with votingChallenges'))).toBe(true);
  });

  it('rejects when only 1 approval has voting', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[1].approvalCriteria.votingChallenges = [];
    const r = validateBountyCollection(c);
    expect(r.errors.some((e: string) => e.includes('Expected 2 approvals with votingChallenges'))).toBe(true);
    expect(r.errors.some((e: string) => e.includes('Expected 1 approval without votingChallenges'))).toBe(true);
  });

  it('rejects when accept and deny have different verifier addresses', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[1].approvalCriteria.votingChallenges[0].voters[0].address = 'bb1differentverifier';
    expect(validateBountyCollection(c).errors).toContain('Accept and deny must have the same verifier address');
  });

  it('rejects when accept and deny pay to the same address', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[1].approvalCriteria.coinTransfers[0].to = 'bb1recipient'; // match accept payout
    expect(
      validateBountyCollection(c).errors
    ).toContain('Accept and deny must pay out to different addresses (recipient vs submitter)');
  });

  it('rejects when accept and deny expirations differ', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[1].transferTimes = [{ start: 1n, end: 999n }];
    expect(validateBountyCollection(c).errors).toContain('Accept and deny must have the same expiration time');
  });
});

describe('validateBountyCollection — expire path timing', () => {
  it('rejects when expire starts before or at voting end', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[2].transferTimes = [{ start: 1000n, end: 2000n }]; // equal to voting end
    expect(validateBountyCollection(c).errors).toContain('Expire approval must start after accept/deny expiration');
  });

  it('rejects when expire starts strictly before voting end', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[2].transferTimes = [{ start: 500n, end: 1500n }];
    expect(validateBountyCollection(c).errors).toContain('Expire approval must start after accept/deny expiration');
  });
});

describe('doesCollectionFollowBountyProtocol', () => {
  it('returns false for an invalid collection', () => {
    const c = clone(makeValidCollection());
    c.standards = [];
    expect(doesCollectionFollowBountyProtocol(c)).toBe(false);
  });

  it('returns true for a valid collection', () => {
    expect(doesCollectionFollowBountyProtocol(makeValidCollection())).toBe(true);
  });
});
