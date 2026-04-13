/**
 * Auction builder — creates a MsgUniversalUpdateCollection for a single-item auction.
 * @module core/builders/auction
 */
import {
  MAX_UINT64,
  FOREVER,
  BURN_ADDRESS,
  parseDuration,
  durationToTimestamp,
  buildMsg,
  buildAliasPath,
  frozenPermissions,
  defaultBalances,
  metadataPlaceholders,
  singleTokenMetadata,
  mintToBurnBalances,
  zeroAmounts,
  zeroMaxTransfers
} from './shared.js';

export interface AuctionParams {
  bidDeadline?: string; // duration shorthand, default "7d"
  acceptWindow?: string; // duration shorthand, default "7d"
  name?: string;
  description?: string;
  image?: string;
}

export function buildAuction(params: AuctionParams): any {
  const bidDeadlineTs = durationToTimestamp(params.bidDeadline || '7d');
  const acceptEndTs = String(Number(bidDeadlineTs) + Number(parseDuration(params.acceptWindow || '7d')));

  const collectionApprovals = [
    // Mint-to-Winner — seller accepts winning bid during accept window
    {
      fromListId: 'Mint',
      toListId: 'All',
      // 'All' — the auction contract / manager will accept the winning bid.
      // Template users who want to lock this down to a specific bidder list
      // should pass --initiated-by or patch the approval post-build.
      initiatedByListId: 'All',
      approvalId: 'mint-to-winner',
      transferTimes: [{ start: bidDeadlineTs, end: acceptEndTs }],
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        predeterminedBalances: mintToBurnBalances(),
        maxNumTransfers: {
          ...zeroMaxTransfers('auction-tracker'),
          overallMaxNumTransfers: '1'
        },
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        autoDeletionOptions: {
          afterOneUse: true,
          afterOverallMaxNumTransfers: true,
          allowCounterpartyPurge: false,
          allowPurgeIfExpired: false
        }
      }
    },
    // Burn — anyone can burn, always allowed
    {
      fromListId: '!Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: 'All',
      approvalId: 'burn',
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0'
    }
  ];

  const { collectionMetadata } = metadataPlaceholders(params.name || 'Auction');

  return buildMsg({
    collectionApprovals,
    standards: ['Auction'],
    collectionPermissions: frozenPermissions(),
    defaultBalances: defaultBalances(),
    invariants: {
      noCustomOwnershipTimes: true,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: true
    },
    aliasPathsToAdd: [buildAliasPath('uauction', 'AUCTION', 0)],
    collectionMetadata,
    tokenMetadata: [singleTokenMetadata('1', params.name || 'Auction Item', params.description, params.image)]
  });
}
