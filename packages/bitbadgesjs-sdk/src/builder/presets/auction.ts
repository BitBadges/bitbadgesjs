/**
 * Auction presets — 2 approvals:
 *   - mint-to-winner: seller mints 1x token ID 1 to winning bidder
 *     during [bidDeadline, bidDeadline + acceptWindow].
 *   - burn: cleanup — anyone can burn the token. No override flags
 *     because the invariant noForcefulPostMintTransfers: true rejects
 *     them on non-Mint approvals.
 */

import { z } from 'zod';
import type { Preset, RenderedApproval } from './types.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];
const TOKEN_ID_1 = [{ start: '1', end: '1' }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

const MintToWinnerParams = z.object({
  sellerAddress: z.string().describe('bb1... seller address — only the seller can accept bids (initiatedByListId = seller).'),
  bidDeadlineMs: z.string().describe('Unix ms timestamp — bids close at this time. transferTimes starts here.'),
  acceptWindowEndMs: z.string().describe('Unix ms timestamp — accept window ends at this time. transferTimes ends here.')
});
type MintToWinnerParams = z.infer<typeof MintToWinnerParams>;

function renderMintToWinner(p: MintToWinnerParams): RenderedApproval {
  return {
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: p.sellerAddress,
    transferTimes: [{ start: p.bidDeadlineMs, end: p.acceptWindowEndMs }],
    tokenIds: TOKEN_ID_1,
    ownershipTimes: FOREVER,
    approvalId: 'auction-mint-to-winner',
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: false,
      coinTransfers: [],
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: [{ amount: '1', tokenIds: TOKEN_ID_1, ownershipTimes: FOREVER }],
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
      maxNumTransfers: {
        overallMaxNumTransfers: '1',
        perFromAddressMaxNumTransfers: '0',
        perToAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: 'auction-mint-to-winner',
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      autoDeletionOptions: { afterOneUse: true, afterOverallMaxNumTransfers: true },
      merkleChallenges: [],
      mustOwnTokens: [],
      votingChallenges: []
    }
  };
}

function renderBurn(_: Record<string, never>): RenderedApproval {
  return {
    fromListId: '!Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    tokenIds: TOKEN_ID_1,
    ownershipTimes: FOREVER,
    approvalId: 'auction-burn',
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {}
  };
}

export const AUCTION_PRESETS: Preset<any>[] = [
  {
    presetId: 'auction.mint-to-winner',
    skillId: 'auction',
    name: 'Auction — mint-to-winner approval',
    description:
      'Mints 1x token ID 1 to a winning bidder during the accept window. initiatedByListId = seller (only seller can accept). transferTimes bounded to [bidDeadlineMs, acceptWindowEndMs]. autoDeletionOptions.afterOneUse removes the approval after settlement.',
    paramsSchema: MintToWinnerParams,
    render: renderMintToWinner
  },
  {
    presetId: 'auction.burn',
    skillId: 'auction',
    name: 'Auction — burn approval (cleanup)',
    description:
      'Anyone can burn token ID 1 to the burn address. No override flags — the auction invariants lock noForcefulPostMintTransfers, so this relies on defaultBalances auto-approve flags.',
    paramsSchema: z.object({}),
    render: renderBurn
  }
];
