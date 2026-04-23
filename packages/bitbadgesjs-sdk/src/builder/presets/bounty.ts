/**
 * Bounty presets.
 *
 * Three approvals form the canonical bounty:
 *   - accept  — verifier votes yes → escrow pays recipient
 *   - deny    — verifier votes no  → escrow refunds submitter
 *   - expire  — no vote before deadline → escrow refunds submitter
 *
 * All three mint 1x token ID 1 from Mint → burn address; the token is a
 * vehicle for the coin side-effect. accept/deny carry votingChallenges;
 * expire is gated purely by transferTimes.
 *
 * ApprovalIds use the form "bounty-<kind>_<random8hex>" — the bounty
 * standard allows random suffixes because the frontend indexes by the
 * bounty- prefix, not the exact id. The agent (or caller) should pass
 * a pre-generated id — the preset does NOT randomize inline, because
 * determinism matters for golden-output comparisons.
 */

import { z } from 'zod';
import type { Preset, RenderedApproval } from './types.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER_OWNERSHIP = [{ start: '1', end: MAX_UINT64 }];
const TOKEN_ID_1 = [{ start: '1', end: '1' }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

const BountyAcceptDenyParams = z.object({
  approvalId: z.string().describe('Pre-generated unique id (typically "bounty-accept_<random>" / "bounty-deny_<random>"). Use generate_unique_id for the suffix.'),
  proposalId: z.string().describe('Governance proposalId the verifier votes on (typically matches the approvalId for readability).'),
  payoutTo: z.string().describe('bb1... address that receives the escrowed coins when this approval settles.'),
  verifierAddress: z.string().describe('bb1... address of the sole voter.'),
  denom: z.string().describe('ICS20 denom of the escrowed amount.'),
  amount: z.string().describe('Escrow amount in BASE units of the denom (e.g. 1000 for 0.001 ATOM at 6 decimals).'),
  expirationMs: z.string().describe('Unix millisecond timestamp when the accept/deny window closes. transferTimes runs [1, expirationMs].')
});
type BountyAcceptDenyParams = z.infer<typeof BountyAcceptDenyParams>;

const BountyExpireParams = z.object({
  approvalId: z.string().describe('Pre-generated unique id (typically "bounty-expire_<random>").'),
  refundTo: z.string().describe('bb1... submitter/creator address that receives the refund after expiration.'),
  denom: z.string().describe('ICS20 denom.'),
  amount: z.string().describe('Refund amount in BASE units.'),
  expirationMs: z.string().describe('Unix ms timestamp. transferTimes runs [expirationMs+1, MAX_UINT64] — i.e. only callable after the window closes.')
});
type BountyExpireParams = z.infer<typeof BountyExpireParams>;

function acceptOrDenyCoinTransferApproval(
  p: BountyAcceptDenyParams,
  withVotingChallenge: true
): RenderedApproval {
  return {
    fromListId: 'Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: 'All',
    transferTimes: [{ start: '1', end: p.expirationMs }],
    tokenIds: TOKEN_ID_1,
    ownershipTimes: FOREVER_OWNERSHIP,
    approvalId: p.approvalId,
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: [
            { amount: '1', tokenIds: TOKEN_ID_1, ownershipTimes: FOREVER_OWNERSHIP }
          ],
          incrementTokenIdsBy: '0',
          incrementOwnershipTimesBy: '0',
          durationFromTimestamp: '0',
          allowOverrideTimestamp: false,
          recurringOwnershipTimes: { startTime: '0', intervalLength: '0', chargePeriodLength: '0' },
          allowOverrideWithAnyValidToken: false
        },
        orderCalculationMethod: {
          useOverallNumTransfers: true,
          usePerToAddressNumTransfers: false,
          usePerFromAddressNumTransfers: false,
          usePerInitiatedByAddressNumTransfers: false,
          useMerkleChallengeLeafIndex: false,
          challengeTrackerId: ''
        }
      },
      coinTransfers: [
        {
          to: p.payoutTo,
          coins: [{ amount: p.amount, denom: p.denom }],
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: false
        }
      ],
      maxNumTransfers: {
        overallMaxNumTransfers: '1',
        perToAddressMaxNumTransfers: '0',
        perFromAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: p.approvalId,
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      votingChallenges: [
        {
          proposalId: p.proposalId,
          quorumThreshold: '100',
          voters: [{ address: p.verifierAddress, weight: '1' }]
        }
      ],
      merkleChallenges: [],
      mustOwnTokens: [],
      mustPrioritize: false
    }
  };
}

function renderAccept(p: BountyAcceptDenyParams): RenderedApproval {
  return acceptOrDenyCoinTransferApproval(p, true);
}

function renderDeny(p: BountyAcceptDenyParams): RenderedApproval {
  return acceptOrDenyCoinTransferApproval(p, true);
}

function renderExpire(p: BountyExpireParams): RenderedApproval {
  return {
    fromListId: 'Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: 'All',
    // Expire is ONLY callable AFTER the deadline
    transferTimes: [{ start: (BigInt(p.expirationMs) + 1n).toString(), end: MAX_UINT64 }],
    tokenIds: TOKEN_ID_1,
    ownershipTimes: FOREVER_OWNERSHIP,
    approvalId: p.approvalId,
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: [
            { amount: '1', tokenIds: TOKEN_ID_1, ownershipTimes: FOREVER_OWNERSHIP }
          ],
          incrementTokenIdsBy: '0',
          incrementOwnershipTimesBy: '0',
          durationFromTimestamp: '0',
          allowOverrideTimestamp: false,
          recurringOwnershipTimes: { startTime: '0', intervalLength: '0', chargePeriodLength: '0' },
          allowOverrideWithAnyValidToken: false
        },
        orderCalculationMethod: {
          useOverallNumTransfers: true,
          usePerToAddressNumTransfers: false,
          usePerFromAddressNumTransfers: false,
          usePerInitiatedByAddressNumTransfers: false,
          useMerkleChallengeLeafIndex: false,
          challengeTrackerId: ''
        }
      },
      coinTransfers: [
        {
          to: p.refundTo,
          coins: [{ amount: p.amount, denom: p.denom }],
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: false
        }
      ],
      maxNumTransfers: {
        overallMaxNumTransfers: '1',
        perToAddressMaxNumTransfers: '0',
        perFromAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: p.approvalId,
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      merkleChallenges: [],
      mustOwnTokens: [],
      votingChallenges: [],
      mustPrioritize: false
    }
  };
}

export const BOUNTY_PRESETS: Preset<any>[] = [
  {
    presetId: 'bounty.accept',
    skillId: 'bounty',
    name: 'Bounty — accept approval',
    description:
      'Verifier votes yes → this approval unlocks, mints 1x token ID 1 to burn, pays escrow to recipient. transferTimes [1, expiration]; votingChallenges gates on verifier address. Pair with bounty.deny and bounty.expire.',
    paramsSchema: BountyAcceptDenyParams,
    render: renderAccept
  },
  {
    presetId: 'bounty.deny',
    skillId: 'bounty',
    name: 'Bounty — deny approval',
    description:
      'Verifier votes no → this approval unlocks, refunds escrow to the submitter. Same shape as accept but payoutTo = submitter. Separate proposalId and approvalId so the two vote trackers do not collide.',
    paramsSchema: BountyAcceptDenyParams,
    render: renderDeny
  },
  {
    presetId: 'bounty.expire',
    skillId: 'bounty',
    name: 'Bounty — expire approval',
    description:
      'Refunds escrow to the submitter after the deadline passes. No votingChallenges; gated purely by transferTimes [expirationMs+1, MAX]. Separate approvalId from accept/deny.',
    paramsSchema: BountyExpireParams,
    render: renderExpire
  }
];
