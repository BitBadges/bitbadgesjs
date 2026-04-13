/**
 * Auction builder — creates a MsgUniversalUpdateCollection for a single-item auction.
 * @module core/builders/auction
 */
import {
  FOREVER,
  BURN_ADDRESS,
  parseDuration,
  durationToTimestamp,
  buildMsg,
  frozenPermissions,
  defaultBalances,
  metadataPlaceholders,
  singleTokenMetadata,
  zeroMaxTransfers
} from './shared.js';

export interface AuctionParams {
  bidDeadline?: string; // duration shorthand, default "7d"
  acceptWindow?: string; // duration shorthand, default "7d"
  name?: string;
  description?: string;
  image?: string;
  /**
   * Seller address — used as `initiatedByListId` on the mint-to-winner
   * approval so only the seller can accept the winning bid. Falls back
   * to the CLI-passed `creator` when not set.
   */
  seller?: string;
  creator?: string;
}

export function buildAuction(params: AuctionParams): any {
  const bidDeadlineTs = durationToTimestamp(params.bidDeadline || '7d');
  const acceptEndTs = String(Number(bidDeadlineTs) + Number(parseDuration(params.acceptWindow || '7d')));
  const sellerAddr = params.seller || params.creator || '';
  const randomId = () => Math.random().toString(16).slice(2, 18);

  // Mint the auction NFT (1x token 1) on settlement. The frontend
  // AuctionRegistry calls this `mintToSellerBalances`, but the actual
  // destination is set by the approval's `toListId` + the transfer
  // recipient — this function just says "create 1 new token 1".
  const mintOneTokenOneBalances = {
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
      startBalances: [
        { amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }
      ],
      incrementTokenIdsBy: '0',
      incrementOwnershipTimesBy: '0',
      durationFromTimestamp: '0',
      allowOverrideTimestamp: false,
      recurringOwnershipTimes: { startTime: '0', intervalLength: '0', chargePeriodLength: '0' },
      allowOverrideWithAnyValidToken: false,
      allowAmountScaling: false,
      maxScalingMultiplier: '0'
    }
  };

  const collectionApprovals = [
    // Mint-to-Winner — seller accepts winning bid during accept window.
    // `initiatedByListId: sellerAddr` locks acceptance to the seller.
    {
      fromListId: 'Mint',
      toListId: 'All',
      initiatedByListId: sellerAddr,
      approvalId: `auction-mint-to-winner-${randomId()}`,
      transferTimes: [{ start: bidDeadlineTs, end: acceptEndTs }],
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        predeterminedBalances: mintOneTokenOneBalances,
        maxNumTransfers: {
          ...zeroMaxTransfers('auction-tracker'),
          overallMaxNumTransfers: '1'
        },
        overridesFromOutgoingApprovals: true,
        // Must be FALSE so the winning bidder's incoming payment intent
        // (their bid approval) still gets matched. Setting this true
        // would bypass the bidder's incoming approvals entirely.
        overridesToIncomingApprovals: false,
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
      approvalId: `auction-burn-${randomId()}`,
      transferTimes: FOREVER,
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: FOREVER,
      version: '0'
    }
  ];

  const { collectionMetadata, placeholders: collectionPlaceholders } = metadataPlaceholders(
    params.name || 'Auction',
    params.description,
    params.image
  );
  const auctionItem = singleTokenMetadata('1', params.name || 'Auction Item', params.description, params.image);

  // Same pattern as crowdfund: drop the default-token placeholder seeded by
  // metadataPlaceholders() since this template defines its own per-token
  // entry below.
  const { 'ipfs://METADATA_TOKEN_DEFAULT': _drop, ...collectionOnlyPlaceholders } = collectionPlaceholders;
  void _drop;

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
    // Auctions are 1-of-1 NFTs — no fractional denom unit needed. The
    // previous version added an alias path with `decimals: 0` which the
    // chain rejected with "denom unit decimals cannot be 0". The auction
    // doesn't need a fungible representation; the NFT itself is the only
    // tradable surface.
    aliasPathsToAdd: [],
    collectionMetadata,
    tokenMetadata: [auctionItem.entry],
    metadataPlaceholders: {
      ...collectionOnlyPlaceholders,
      [auctionItem.placeholder.uri]: auctionItem.placeholder.content
    }
  });
}
