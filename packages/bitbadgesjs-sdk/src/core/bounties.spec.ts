/**
 * Tests for bounties.ts — Bounty standard protocol validator.
 *
 * Covers validateBountyCollection + doesCollectionFollowBountyProtocol.
 * A valid Bounty has 3 approvals (accept, deny, expire) where accept+deny
 * share a verifier voting challenge and the expire path has no voting and
 * starts after the accept/deny expiration.
 */

import {
  validateBountyCollection,
  doesCollectionFollowBountyProtocol,
  extractBountyDetails,
  deriveBountyStatusFallback,
  isExpireApprovalExecuted,
  buildBountyAcceptTx,
  buildBountyDenyTx,
  buildBountyRefundMsg
} from './bounties.js';
import { frozenPermissions } from './builders/shared.js';
import { buildBounty } from './builders/bounty.js';
import { verifyStandardsCompliance } from '../api-indexer/verify-standards.js';

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
    maxNumTransfers: { overallMaxNumTransfers: 1n, amountTrackerId: 'bounty-shared-tracker' },
    coinTransfers: [
      {
        to: 'bb1recipient',
        overrideFromWithApproverAddress: true,
        overrideToWithInitiator: false,
        coins: [{ denom: 'ubadge', amount: 100n }]
      }
    ],
    votingChallenges: [{ proposalId: 'accept-proposal', quorumThreshold: 100n, voters: [{ address: VERIFIER, weight: 1n }] }]
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
    maxNumTransfers: { overallMaxNumTransfers: 1n, amountTrackerId: 'bounty-shared-tracker' },
    coinTransfers: [
      {
        to: 'bb1submitter',
        overrideFromWithApproverAddress: true,
        overrideToWithInitiator: false,
        coins: [{ denom: 'ubadge', amount: 100n }]
      }
    ],
    votingChallenges: [{ proposalId: 'deny-proposal', quorumThreshold: 100n, voters: [{ address: VERIFIER, weight: 1n }] }]
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
    maxNumTransfers: { overallMaxNumTransfers: 1n, amountTrackerId: 'bounty-shared-tracker' },
    coinTransfers: [
      {
        to: 'bb1submitter',
        overrideFromWithApproverAddress: true,
        overrideToWithInitiator: false,
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
  collectionPermissions: frozenPermissions(),
  invariants: { maxSupplyPerId: 1n }
});

const clone = (obj: any) =>
  JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() + 'n' : v)),
    (_k, v) => {
      if (typeof v === 'string' && /^\d+n$/.test(v)) return BigInt(v.slice(0, -1));
      return v;
    }
  );

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

describe('validateBountyCollection — effective payout routing', () => {
  it('rejects recipient redirection on every payout branch', () => {
    const c = makeValidCollection();
    for (const approval of c.collectionApprovals) {
      approval.approvalCriteria.coinTransfers[0].overrideToWithInitiator = true;
    }
    const result = validateBountyCollection(c);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error: string) => error.includes('overrideToWithInitiator=false'))).toBe(true);
    expect(extractBountyDetails(c.collectionApprovals)).toBeNull();
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
    c.collectionApprovals = [makeAcceptApproval(), makeDenyApproval(), makeExpireApproval(), makeExpireApproval()];
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
    expect(validateBountyCollection(c).errors.some((e: string) => e.includes('overridesFromOutgoingApprovals must be true'))).toBe(true);
  });

  it('rejects when overridesToIncomingApprovals is false', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[0].approvalCriteria.overridesToIncomingApprovals = false;
    expect(validateBountyCollection(c).errors.some((e: string) => e.includes('overridesToIncomingApprovals must be true'))).toBe(true);
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
    expect(validateBountyCollection(c).errors.some((e: string) => e.includes('coinTransfer must have overrideFromWithApproverAddress=true'))).toBe(
      true
    );
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
    c.collectionApprovals[2].approvalCriteria.votingChallenges = [{ voters: [{ address: VERIFIER }] }];
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
    expect(validateBountyCollection(c).errors).toContain('Accept and deny must pay out to different addresses (recipient vs submitter)');
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

// ── End-user helper tests ──────────────────────────────────────────────────

describe('extractBountyDetails', () => {
  it('splits a valid Bounty collection into accept/deny/expire + metadata', () => {
    const c = makeValidCollection();
    const details = extractBountyDetails(c.collectionApprovals);
    expect(details).not.toBeNull();
    expect(details!.acceptApproval.approvalId).toBe('accept');
    expect(details!.denyApproval.approvalId).toBe('deny');
    expect(details!.expireApproval.approvalId).toBe('expire');
    expect(details!.verifierAddress).toBe(VERIFIER);
    expect(details!.recipientAddress).toBe('bb1recipient');
    expect(details!.submitterAddress).toBe('bb1submitter');
    expect(details!.expirationTime).toBe(1000n);
    expect(details!.depositCoins).toEqual([{ denom: 'ubadge', amount: 100n }]);
  });

  it('returns null when there are not exactly 2 voting approvals + 1 non-voting', () => {
    expect(extractBountyDetails([makeAcceptApproval()] as any)).toBeNull();
    expect(extractBountyDetails([makeAcceptApproval(), makeDenyApproval()] as any)).toBeNull();
  });

  it('is order-independent (shuffled input)', () => {
    const details = extractBountyDetails([makeExpireApproval(), makeDenyApproval(), makeAcceptApproval()] as any);
    expect(details).not.toBeNull();
    expect(details!.acceptApproval.approvalId).toBe('accept');
  });
});

describe('deriveBountyStatusFallback', () => {
  it('returns "pending" before deadline', () => {
    expect(deriveBountyStatusFallback(BigInt(Date.now() + 60000))).toBe('pending');
  });
  it('returns "expired" after deadline', () => {
    expect(deriveBountyStatusFallback(BigInt(Date.now() - 60000))).toBe('expired');
  });
  it('returns "pending" for zero', () => {
    expect(deriveBountyStatusFallback(0n)).toBe('pending');
  });
});

describe('isExpireApprovalExecuted', () => {
  it('returns true when the matching tracker has numTransfers > 0', () => {
    const expire = makeExpireApproval();
    const collection: any = {
      approvalTrackers: [{ approvalId: 'expire', trackerType: 'overall', numTransfers: 1n }]
    };
    expect(isExpireApprovalExecuted(expire as any, collection)).toBe(true);
  });

  it('returns false when no tracker is present', () => {
    const expire = makeExpireApproval();
    expect(isExpireApprovalExecuted(expire as any, { approvalTrackers: [] } as any)).toBe(false);
  });

  it('ignores trackers for other approval ids or other tracker types', () => {
    const expire = makeExpireApproval();
    const collection: any = {
      approvalTrackers: [
        { approvalId: 'accept', trackerType: 'overall', numTransfers: 5n },
        { approvalId: 'expire', trackerType: 'per-from', numTransfers: 5n }
      ]
    };
    expect(isExpireApprovalExecuted(expire as any, collection)).toBe(false);
  });
});

describe('buildBountyAcceptTx / DenyTx / RefundMsg', () => {
  it('Accept produces a 2-msg tx wrapper (vote, transfer) targeting the accept approval', () => {
    const c = makeValidCollection();
    const details = extractBountyDetails(c.collectionApprovals)!;
    const tx = buildBountyAcceptTx(VERIFIER, '7', details.acceptApproval);
    expect(tx.messages).toHaveLength(2);
    expect(tx.messages[0].typeUrl).toBe('/tokenization.MsgCastVote');
    expect((tx.messages[0].value as any).approval_id).toBe('accept');
    expect((tx.messages[0].value as any).yes_weight).toBe('100');
    expect(tx.messages[1].typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect((tx.messages[1].value as any).transfers[0].prioritizedApprovals[0].approvalId).toBe('accept');
  });

  it('Deny targets the deny approval id in both msgs', () => {
    const c = makeValidCollection();
    const details = extractBountyDetails(c.collectionApprovals)!;
    const tx = buildBountyDenyTx(VERIFIER, '7', details.denyApproval);
    expect((tx.messages[0].value as any).approval_id).toBe('deny');
    expect((tx.messages[1].value as any).transfers[0].prioritizedApprovals[0].approvalId).toBe('deny');
  });

  it('Refund is a single MsgTransferTokens (no vote step)', () => {
    const c = makeValidCollection();
    const details = extractBountyDetails(c.collectionApprovals)!;
    const msg = buildBountyRefundMsg('bb1submitter', '7', details.expireApproval);
    expect(msg.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect((msg.value as any).transfers[0].prioritizedApprovals[0].approvalId).toBe('expire');
  });

  it('output is JSON-stringifiable (no raw bigints)', () => {
    const c = makeValidCollection();
    const details = extractBountyDetails(c.collectionApprovals)!;
    const tx = buildBountyAcceptTx(VERIFIER, '7', details.acceptApproval);
    expect(() => JSON.stringify(tx)).not.toThrow();
  });
});

describe('validateBountyCollection — terminal-state, permissions, and voting integrity', () => {
  it('rejects unfrozen collection permissions', () => {
    const c = clone(makeValidCollection());
    c.collectionPermissions = {};
    expect(validateBountyCollection(c).errors).toContain('Collection permissions must be frozen');
  });

  it('requires maxSupplyPerId=1 or a shared amountTrackerId across branches', () => {
    const c = clone(makeValidCollection());
    c.invariants = { maxSupplyPerId: 0n };
    c.collectionApprovals[0].approvalCriteria.maxNumTransfers.amountTrackerId = 't1';
    c.collectionApprovals[1].approvalCriteria.maxNumTransfers.amountTrackerId = 't2';
    c.collectionApprovals[2].approvalCriteria.maxNumTransfers.amountTrackerId = 't3';
    expect(validateBountyCollection(c).valid).toBe(false);

    // Passing maxSupplyPerId=1 satisfies mutual exclusion even with distinct trackers
    c.invariants = { maxSupplyPerId: 1n };
    expect(validateBountyCollection(c).valid).toBe(true);

    // Sharing a single non-empty amountTrackerId also satisfies mutual exclusion
    c.invariants = { maxSupplyPerId: 0n };
    for (const a of c.collectionApprovals) {
      a.approvalCriteria.maxNumTransfers.amountTrackerId = 'shared-bounty';
    }
    expect(validateBountyCollection(c).valid).toBe(true);
  });

  it('rejects periodic resets on maxNumTransfers', () => {
    const c = clone(makeValidCollection());
    c.collectionApprovals[0].approvalCriteria.maxNumTransfers.resetTimeIntervals = { startTime: 1n, intervalLength: 1000n };
    expect(validateBountyCollection(c).valid).toBe(false);
  });

  it('rejects extra voters, extra votingChallenges, zero quorum, or duplicate proposalIds', () => {
    const extraVoter = clone(makeValidCollection());
    extraVoter.collectionApprovals[0].approvalCriteria.votingChallenges[0].voters.push({ address: 'bb1extra', weight: 1n });
    expect(validateBountyCollection(extraVoter).valid).toBe(false);
    expect(extractBountyDetails(extraVoter.collectionApprovals)).toBeNull();

    const extraChallenge = clone(makeValidCollection());
    extraChallenge.collectionApprovals[0].approvalCriteria.votingChallenges.push({
      proposalId: 'p-extra',
      quorumThreshold: 100n,
      voters: [{ address: VERIFIER, weight: 1n }]
    });
    expect(validateBountyCollection(extraChallenge).valid).toBe(false);

    const zeroQuorum = clone(makeValidCollection());
    zeroQuorum.collectionApprovals[0].approvalCriteria.votingChallenges[0].quorumThreshold = 0n;
    expect(validateBountyCollection(zeroQuorum).valid).toBe(false);

    const sameProposal = clone(makeValidCollection());
    sameProposal.collectionApprovals[1].approvalCriteria.votingChallenges[0].proposalId = 'accept-proposal';
    expect(validateBountyCollection(sameProposal).valid).toBe(false);
  });

  it('rejects empty/invalid payout addresses and deny/expire submitter mismatch', () => {
    const emptyTo = clone(makeValidCollection());
    emptyTo.collectionApprovals[0].approvalCriteria.coinTransfers[0].to = '';
    expect(validateBountyCollection(emptyTo).valid).toBe(false);

    const mismatch = clone(makeValidCollection());
    mismatch.collectionApprovals[2].approvalCriteria.coinTransfers[0].to = 'bb1othersubmitter';
    expect(validateBountyCollection(mismatch).valid).toBe(false);
    expect(extractBountyDetails(mismatch.collectionApprovals)).toBeNull();
  });

  it('buildBounty sets maxSupplyPerId=1, shared tracker, and verifyStandardsCompliance delegates to validateBountyCollection', () => {
    const built = buildBounty({
      amount: 100,
      denom: 'USDC',
      verifier: 'bb1verifier',
      recipient: 'bb1recipient',
      submitter: 'bb1submitter',
      uri: 'https://example.com/bounty.json'
    });
    expect(built.value.invariants.maxSupplyPerId).toBe('1');
    const trackerIds = built.value.collectionApprovals.map((a: any) => a.approvalCriteria.maxNumTransfers.amountTrackerId);
    expect(new Set(trackerIds).size).toBe(1);
    expect(verifyStandardsCompliance(built).valid).toBe(true);

    // Mutating a bounty to omit maxNumTransfers or unlock permissions fails verifyStandardsCompliance
    const broken = structuredClone(built);
    delete broken.value.collectionApprovals[0].approvalCriteria.maxNumTransfers;
    expect(verifyStandardsCompliance(broken).valid).toBe(false);

    const unlocked = structuredClone(built);
    unlocked.value.collectionPermissions.canUpdateCollectionApprovals = [];
    expect(verifyStandardsCompliance(unlocked).valid).toBe(false);
  });
});
