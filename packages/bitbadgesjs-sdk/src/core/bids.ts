import { iCollectionApproval } from '@/interfaces/types/approvals.js';
import { UintRangeArray } from './uintRanges.js';

export const isOrderbookBidOrListingApproval = (approval: iCollectionApproval<bigint>, approvalLevel: 'incoming' | 'outgoing') => {
  return isBidOrListingApproval(approval, approvalLevel, { isFungibleCheck: true, fungibleOrNonFungibleAllowed: true });
};

export const isBidOrListingApproval = (
  approval: iCollectionApproval<bigint>,
  approvalLevel: 'incoming' | 'outgoing',
  options?: { isFungibleCheck?: boolean; fungibleOrNonFungibleAllowed?: boolean; isCollectionBid?: boolean }
) => {
  const approvalCriteria = approval.approvalCriteria;
  if (approvalCriteria?.coinTransfers?.length !== 1) {
    return false;
  }

  if (approval.transferTimes.length !== 1) {
    return false;
  }

  const coinTransfer = approvalCriteria.coinTransfers[0];
  if (coinTransfer.coins.length !== 1) {
    return false;
  }

  //Make sure the to / from is correct
  if (approvalLevel === 'incoming' && !coinTransfer.overrideFromWithApproverAddress) {
    return false;
  }

  if (approvalLevel === 'incoming' && !coinTransfer.overrideToWithInitiator) {
    return false;
  }

  if (approvalLevel === 'outgoing' && coinTransfer.overrideFromWithApproverAddress) {
    return false;
  }

  if (approvalLevel === 'outgoing' && coinTransfer.overrideToWithInitiator) {
    return false;
  }

  // Recipient must be the approving user
  const to = coinTransfer.to;
  if (approvalLevel === 'outgoing' && to !== approval.fromListId) {
    return false;
  }

  const incrementedBalances = approvalCriteria.predeterminedBalances?.incrementedBalances;
  if (!incrementedBalances) {
    return false;
  }

  if (incrementedBalances.allowAmountScaling) {
    return false;
  }

  if (incrementedBalances.startBalances.length !== 1) {
    return false;
  }

  if (options?.isCollectionBid) {
    if (!incrementedBalances.allowOverrideWithAnyValidToken) {
      return false;
    }
  } else {
    const allTokenIds = UintRangeArray.From(incrementedBalances.startBalances[0].tokenIds).sortAndMerge().convert(BigInt);
    if (allTokenIds.length !== 1 || allTokenIds.size() !== 1n) {
      return false;
    }

    if (incrementedBalances.allowOverrideWithAnyValidToken) {
      return false;
    }
  }

  const amount = incrementedBalances.startBalances[0].amount;
  const toCheckAmountOne = !options || (!options.isFungibleCheck && !options.fungibleOrNonFungibleAllowed);
  if (toCheckAmountOne) {
    if (amount !== 1n) {
      return false;
    }
  }

  if (!UintRangeArray.From(incrementedBalances.startBalances[0].ownershipTimes).isFull()) {
    return false;
  }

  if (incrementedBalances.incrementTokenIdsBy !== 0n) {
    return false;
  }

  if (incrementedBalances.incrementOwnershipTimesBy !== 0n) {
    return false;
  }

  if (incrementedBalances.durationFromTimestamp !== 0n) {
    return false;
  }

  //Needs this to be true for the subscription faucet to work
  if (incrementedBalances.allowOverrideTimestamp) {
    return false;
  }

  if (incrementedBalances.recurringOwnershipTimes.startTime !== 0n) {
    return false;
  }

  if (incrementedBalances.recurringOwnershipTimes.intervalLength !== 0n) {
    return false;
  }

  if (incrementedBalances.recurringOwnershipTimes.chargePeriodLength !== 0n) {
    return false;
  }

  if (approvalCriteria.requireFromEqualsInitiatedBy) {
    return false;
  }

  if (approvalCriteria.requireToEqualsInitiatedBy) {
    return false;
  }

  if (approvalCriteria.overridesToIncomingApprovals) {
    return false;
  }

  if (approvalCriteria.merkleChallenges?.length) {
    return false;
  }

  if (approvalCriteria.mustOwnTokens?.length) {
    return false;
  }

  if ((approvalCriteria.maxNumTransfers?.overallMaxNumTransfers ?? 0n) === 0n) {
    return false;
  }

  return true;
};

export const isCollectionBid = (approval: iCollectionApproval<bigint>) => {
  return isBidOrListingApproval(approval, 'incoming', { isCollectionBid: true });
};

// ──────────────────────────────────────────────────────────────────────────
// End-user helpers — bid/listing approval factories + fill msgs.
// Lifted from FE UserIncoming/OutgoingApprovalRegistry + OrderbookTab.
// ──────────────────────────────────────────────────────────────────────────

const ORDERBOOK_MAX_UINT64 = '18446744073709551615';

export interface OrderbookOrderArgs {
  /** Order owner address. */
  address: string;
  /** Token id (single token bid/listing) — or undefined for collection-wide bid. */
  tokenId?: bigint;
  /** Coin amount in base units (bigint). */
  paymentAmount: bigint;
  /** Coin denom (e.g. 'ubadge', 'ibc/...'). */
  paymentDenom: string;
  /** Token quantity (almost always 1n for NFTs). */
  tokenAmount?: bigint;
  /** Validity window for the order. */
  transferTimes: UintRangeArray<bigint>;
  /** Approval id — caller picks. */
  approvalId: string;
  /** Optional cap on partial fills (default 1n — fill-once). */
  maxNumTransfers?: bigint;
}

/** Build a buyer-side bid approval (incoming). For a collection-wide bid, omit `tokenId`. */
export function buildOrderbookBidApproval(args: OrderbookOrderArgs): Record<string, unknown> {
  const tokenIds = args.tokenId !== undefined
    ? [{ start: args.tokenId, end: args.tokenId }]
    : UintRangeArray.FullRanges();
  const isCollectionWide = args.tokenId === undefined;

  return {
    fromListId: 'All',
    initiatedByListId: 'All',
    transferTimes: args.transferTimes,
    tokenIds,
    ownershipTimes: UintRangeArray.FullRanges(),
    approvalId: args.approvalId,
    version: 0n,
    approvalCriteria: {
      autoDeletionOptions: {
        afterOneUse: !isCollectionWide,
        afterOverallMaxNumTransfers: !isCollectionWide,
        allowCounterpartyPurge: false,
        allowPurgeIfExpired: true
      },
      coinTransfers: [
        {
          to: '',
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true,
          coins: [{ amount: args.paymentAmount, denom: args.paymentDenom }]
        }
      ],
      predeterminedBalances: {
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
          startBalances: [{ amount: args.tokenAmount ?? 1n, tokenIds, ownershipTimes: UintRangeArray.FullRanges() }],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n,
          allowOverrideTimestamp: false,
          allowOverrideWithAnyValidToken: isCollectionWide,
          allowAmountScaling: false,
          maxScalingMultiplier: 0n,
          recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
        }
      },
      maxNumTransfers: {
        overallMaxNumTransfers: args.maxNumTransfers ?? 1n,
        perToAddressMaxNumTransfers: 0n,
        perFromAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: 0n,
        amountTrackerId: args.approvalId,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      approvalAmounts: {
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 0n,
        amountTrackerId: args.approvalId,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      merkleChallenges: [],
      mustOwnTokens: [],
      dynamicStoreChallenges: [],
      ethSignatureChallenges: [],
      votingChallenges: [],
      evmQueryChallenges: [],
      requireFromEqualsInitiatedBy: false
    }
  };
}

/** Build a seller-side listing approval (outgoing). */
export function buildOrderbookListingApproval(args: OrderbookOrderArgs): Record<string, unknown> {
  if (args.tokenId === undefined) {
    throw new Error('buildOrderbookListingApproval: tokenId is required (no collection-wide listing).');
  }
  const tokenIds = [{ start: args.tokenId, end: args.tokenId }];
  return {
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: args.transferTimes,
    tokenIds,
    ownershipTimes: UintRangeArray.FullRanges(),
    approvalId: args.approvalId,
    version: 0n,
    approvalCriteria: {
      autoDeletionOptions: {
        afterOneUse: (args.maxNumTransfers ?? 1n) === 1n,
        afterOverallMaxNumTransfers: true,
        allowCounterpartyPurge: false,
        allowPurgeIfExpired: true
      },
      requireToDoesNotEqualInitiatedBy: false,
      coinTransfers: [
        {
          to: args.address,
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false,
          coins: [{ amount: args.paymentAmount, denom: args.paymentDenom }]
        }
      ],
      predeterminedBalances: {
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
          startBalances: [{ amount: args.tokenAmount ?? 1n, tokenIds, ownershipTimes: UintRangeArray.FullRanges() }],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n,
          allowOverrideTimestamp: false,
          allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: 0n,
          recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
        }
      },
      maxNumTransfers: {
        overallMaxNumTransfers: args.maxNumTransfers ?? 1n,
        perToAddressMaxNumTransfers: 0n,
        perFromAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: 0n,
        amountTrackerId: args.approvalId,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      approvalAmounts: {
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 0n,
        amountTrackerId: args.approvalId,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      merkleChallenges: [],
      mustOwnTokens: [],
      dynamicStoreChallenges: [],
      ethSignatureChallenges: [],
      votingChallenges: [],
      evmQueryChallenges: []
    }
  };
}

// ── Fill msgs ─────────────────────────────────────────────────────────────

export interface OrderbookFillTarget {
  /** The approval id (bid or listing) to consume. */
  approvalId: string;
  /** The approval owner's address. */
  approverAddress: string;
  /** Token id to transfer. */
  tokenId: bigint;
  /** Quantity (almost always 1n). */
  tokenAmount?: bigint;
}

export interface OrderbookFillMsg {
  typeUrl: '/tokenization.MsgTransferTokens';
  value: Record<string, unknown>;
}

/** Buyer fills a listing: seller's outgoing approval fires; seller's tokens → buyer; buyer's coins → seller. */
export function buildFillListingMsg(
  buyer: string,
  collectionId: string,
  listing: OrderbookFillTarget
): OrderbookFillMsg {
  const tokenAmount = listing.tokenAmount ?? 1n;
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator: buyer,
      collectionId: String(collectionId),
      transfers: [
        {
          from: listing.approverAddress,
          toAddresses: [buyer],
          balances: [
            {
              amount: tokenAmount.toString(),
              tokenIds: [{ start: listing.tokenId.toString(), end: listing.tokenId.toString() }],
              ownershipTimes: [{ start: '1', end: ORDERBOOK_MAX_UINT64 }]
            }
          ],
          prioritizedApprovals: [
            {
              approvalId: listing.approvalId,
              approvalLevel: 'outgoing',
              approverAddress: listing.approverAddress,
              version: '0'
            }
          ],
          onlyCheckPrioritizedCollectionApprovals: false,
          onlyCheckPrioritizedOutgoingApprovals: true,
          onlyCheckPrioritizedIncomingApprovals: false,
          memo: ''
        }
      ]
    }
  };
}

/** Seller fills a bid: buyer's incoming approval fires; seller's tokens → buyer; buyer's coins → seller. */
export function buildFillBidMsg(
  seller: string,
  collectionId: string,
  bid: OrderbookFillTarget
): OrderbookFillMsg {
  const tokenAmount = bid.tokenAmount ?? 1n;
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator: seller,
      collectionId: String(collectionId),
      transfers: [
        {
          from: seller,
          toAddresses: [bid.approverAddress],
          balances: [
            {
              amount: tokenAmount.toString(),
              tokenIds: [{ start: bid.tokenId.toString(), end: bid.tokenId.toString() }],
              ownershipTimes: [{ start: '1', end: ORDERBOOK_MAX_UINT64 }]
            }
          ],
          prioritizedApprovals: [
            {
              approvalId: bid.approvalId,
              approvalLevel: 'incoming',
              approverAddress: bid.approverAddress,
              version: '0'
            }
          ],
          onlyCheckPrioritizedCollectionApprovals: false,
          onlyCheckPrioritizedOutgoingApprovals: false,
          onlyCheckPrioritizedIncomingApprovals: true,
          memo: ''
        }
      ]
    }
  };
}
