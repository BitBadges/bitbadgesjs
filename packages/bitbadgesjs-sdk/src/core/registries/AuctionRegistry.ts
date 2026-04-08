import { AddressList } from '../addressLists.js';
import { UintRangeArray } from '../uintRanges.js';
import { doesCollectionFollowProtocol } from '../quests.js';
import type { RequiredApprovalProps } from '../approval-utils.js';
import type { iUintRange } from '../../interfaces/types/core.js';
import crypto from 'crypto';

const FOREVER: iUintRange<bigint>[] = [{ start: 1n, end: BigInt('18446744073709551615') }];
const TOKEN_AUCTION: iUintRange<bigint>[] = [{ start: 1n, end: 1n }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

/**
 * Strict validation: does a collection follow the Auction protocol?
 *
 * Checks:
 * - standards includes "Auction"
 * - validTokenIds = exactly [{1,1}]
 * - 1–3 collection approvals (mint may be auto-deleted, burn is optional)
 * - Transfer approval: fromListId="!Mint", maxNumTransfers=1, specific seller, bounded transferTimes
 */
export function doesCollectionFollowAuctionProtocol(collection: any): boolean {
  if (!collection) return false;
  if (!doesCollectionFollowProtocol(collection, 'Auction')) return false;

  // validTokenIds must be exactly [{1,1}]
  const tokenIds = UintRangeArray.From(collection.validTokenIds ?? []).sortAndMerge().convert(BigInt);
  if (tokenIds.length !== 1 || tokenIds[0]?.start !== 1n || tokenIds[0]?.end !== 1n) return false;

  const approvals = collection.collectionApprovals ?? [];
  // 0 (all auto-deleted after completion) up to 2 (mint-to-winner + burn)
  if (approvals.length > 2) return false;

  // If mint-to-winner exists, validate it
  const mintToWinner = approvals.find((a: any) => a.fromListId === 'Mint' && a.toListId === 'All');
  if (mintToWinner) {
    if (!mintToWinner.approvalCriteria) return false;
    const maxTransfers = BigInt(mintToWinner.approvalCriteria.maxNumTransfers?.overallMaxNumTransfers ?? 0);
    if (maxTransfers !== 1n) return false;
    if (!mintToWinner.approvalCriteria.overridesFromOutgoingApprovals) return false;
    if (mintToWinner.initiatedByListId === 'All') return false;
    if (!mintToWinner.initiatedByListId) return false;
    const transferTimes = mintToWinner.transferTimes ?? [];
    if (transferTimes.length === 0) return false;
    const endTime = BigInt(transferTimes[0]?.end ?? 0);
    if (endTime >= BigInt('18446744073709551615')) return false;
  }
  // If mint-to-winner is gone (auto-deleted after acceptance), that's valid — auction is completed

  return true;
}

interface AuctionParams {
  sellerAddress: string;
  bidDeadline: bigint; // ms timestamp — when bid submissions close
  acceptWindow: bigint; // ms — duration after bid deadline for seller to accept
}

const defaultChecks = { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false };
const zeroResetIntervals = { startTime: 0n, intervalLength: 0n };

function defaultApprovalAmounts(trackerId: string) {
  return {
    overallApprovalAmount: 0n,
    perFromAddressApprovalAmount: 0n,
    perToAddressApprovalAmount: 0n,
    perInitiatedByAddressApprovalAmount: 0n,
    amountTrackerId: trackerId,
    resetTimeIntervals: zeroResetIntervals
  };
}

/** Mint 1x token ID 1 to the seller */
function mintToSellerBalances() {
  return {
    manualBalances: [],
    orderCalculationMethod: {
      useOverallNumTransfers: true,
      usePerToAddressNumTransfers: false,
      usePerFromAddressNumTransfers: false,
      usePerInitiatedByAddressNumTransfers: false,
      useMerkleChallengeLeafIndex: false,
      challengeTrackerId: ''
    },
    incrementedBalances: {
      startBalances: [{ amount: 1n, tokenIds: TOKEN_AUCTION, ownershipTimes: UintRangeArray.FullRanges() }],
      incrementTokenIdsBy: 0n,
      incrementOwnershipTimesBy: 0n,
      durationFromTimestamp: 0n,
      allowOverrideTimestamp: false,
      allowOverrideWithAnyValidToken: false,
      allowAmountScaling: false,
      maxScalingMultiplier: 0n,
      recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
    }
  };
}

const mintAutoDeletion = { afterOneUse: true, afterOverallMaxNumTransfers: true, allowCounterpartyPurge: false, allowPurgeIfExpired: false };
const defaultAltTimeChecks = { offlineHours: [], offlineDays: [] };
const defaultRoyalties = { percentage: 0n, payoutAddress: '' };
const emptyArrayFields = {
  merkleChallenges: [] as any[],
  mustOwnTokens: [] as any[],
  dynamicStoreChallenges: [] as any[],
  ethSignatureChallenges: [] as any[],
  evmQueryChallenges: [] as any[]
};

const emptyPredeterminedBalances = {
  manualBalances: [],
  orderCalculationMethod: {
    useOverallNumTransfers: false,
    usePerToAddressNumTransfers: false,
    usePerFromAddressNumTransfers: false,
    usePerInitiatedByAddressNumTransfers: false,
    useMerkleChallengeLeafIndex: false,
    challengeTrackerId: ''
  },
  incrementedBalances: {
    startBalances: [],
    incrementTokenIdsBy: 0n,
    incrementOwnershipTimesBy: 0n,
    durationFromTimestamp: 0n,
    allowOverrideTimestamp: false,
    allowOverrideWithAnyValidToken: false,
    allowAmountScaling: false,
    maxScalingMultiplier: 0n,
    recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
  }
};

function maxOneTransfer(trackerId: string) {
  return {
    overallMaxNumTransfers: 1n,
    perToAddressMaxNumTransfers: 0n,
    perFromAddressMaxNumTransfers: 0n,
    perInitiatedByAddressMaxNumTransfers: 0n,
    amountTrackerId: trackerId,
    resetTimeIntervals: zeroResetIntervals
  };
}

/**
 * Builds the 2 collection-level approvals for an auction.
 *
 * 1. Mint-to-winner: seller mints NFT directly to the winning bidder during the accept window.
 *    The bidder's incoming approval (intent) handles the payment side via intent matching.
 *    This combines mint + accept into a single action.
 * 2. Burn: anyone can burn token 1 to the burn address (permanent, for cleanup)
 */
export class AuctionRegistry {
  /** Mint-to-winner: seller mints NFT directly to winning bidder during accept window */
  static mintToWinnerApproval(params: AuctionParams): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    return {
      details: { name: 'Accept Bid', description: 'Seller mints the NFT directly to the winning bidder during the accept window', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('Mint'),
      fromListId: 'Mint',
      toList: AddressList.AllAddresses(),
      toListId: 'All',
      initiatedByList: AddressList.Reserved(params.sellerAddress),
      initiatedByListId: params.sellerAddress,
      transferTimes: [{ start: params.bidDeadline, end: params.bidDeadline + params.acceptWindow }],
      tokenIds: TOKEN_AUCTION,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `auction-mint-to-winner-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: false,
        senderChecks: defaultChecks,
        recipientChecks: defaultChecks,
        initiatorChecks: defaultChecks,
        coinTransfers: [],
        predeterminedBalances: mintToSellerBalances(),
        maxNumTransfers: maxOneTransfer(id),
        approvalAmounts: defaultApprovalAmounts(id),
        ...emptyArrayFields,
        votingChallenges: [],
        evmQueryChallenges: [],
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        autoDeletionOptions: mintAutoDeletion,
        altTimeChecks: defaultAltTimeChecks,
        userApprovalSettings: { userRoyalties: defaultRoyalties },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };
  }

  /**
   * Burn: anyone can send token 1 to the burn address (permanent, for buyer cleanup).
   *
   * initiatedByListId is 'All' because we cannot dynamically restrict initiation to
   * only the current holder at the collection level. This means anyone could burn the
   * token on behalf of the holder (griefing). This is an accepted trade-off because:
   *   1. The toListId override ensures the token goes to the burn address, not stolen.
   *   2. The token's primary value is in the sale/payment, not the token itself — the
   *      auction NFT is a coordination artifact, and burning it is a cleanup action.
   *   3. overridesFromOutgoingApprovals ensures the burn bypasses outgoing approval checks.
   */
  static burnApproval(): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    return {
      details: { name: 'Burn', description: 'Burn the auction token', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('!Mint'),
      fromListId: '!Mint',
      toList: AddressList.Reserved(BURN_ADDRESS),
      toListId: BURN_ADDRESS,
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: FOREVER,
      tokenIds: TOKEN_AUCTION,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `auction-burn-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: defaultChecks,
        recipientChecks: defaultChecks,
        initiatorChecks: defaultChecks,
        coinTransfers: [],
        predeterminedBalances: emptyPredeterminedBalances,
        maxNumTransfers: maxOneTransfer(id),
        approvalAmounts: defaultApprovalAmounts(id),
        ...emptyArrayFields,
        votingChallenges: [],
        evmQueryChallenges: [],
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        autoDeletionOptions: { afterOneUse: true, afterOverallMaxNumTransfers: true, allowCounterpartyPurge: false, allowPurgeIfExpired: false },
        altTimeChecks: defaultAltTimeChecks,
        userApprovalSettings: { userRoyalties: defaultRoyalties },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };
  }

  /** Build all approvals for an auction */
  static allApprovals(params: AuctionParams): RequiredApprovalProps[] {
    return [this.mintToWinnerApproval(params), this.burnApproval()];
  }

  /** Fully frozen permissions — nothing can change after creation */
  static frozenPermissions() {
    const frozen = [{ permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER }];
    const frozenTokens = [{ tokenIds: FOREVER, permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER }];
    const allList = AddressList.AllAddresses();
    const frozenApprovals = [
      {
        approvalId: 'All',
        fromListId: 'All',
        fromList: allList,
        toListId: 'All',
        toList: allList,
        initiatedByListId: 'All',
        initiatedByList: allList,
        transferTimes: FOREVER,
        tokenIds: FOREVER,
        ownershipTimes: FOREVER,
        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: FOREVER
      }
    ];

    return {
      canDeleteCollection: frozen,
      canArchiveCollection: frozen,
      canUpdateStandards: frozen,
      canUpdateCustomData: frozen,
      canUpdateManager: frozen,
      canUpdateCollectionMetadata: frozen,
      canUpdateValidTokenIds: frozenTokens,
      canUpdateTokenMetadata: frozenTokens,
      canUpdateCollectionApprovals: frozenApprovals,
      canAddMoreAliasPaths: frozen,
      canAddMoreCosmosCoinWrapperPaths: frozen
    };
  }
}

export { BURN_ADDRESS as AUCTION_BURN_ADDRESS };
