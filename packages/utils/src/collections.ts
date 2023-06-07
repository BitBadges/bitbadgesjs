import { IdRange } from "bitbadgesjs-proto";
import { MsgMintAndDistributeBadges, MsgNewCollection, MsgUpdateAllowedTransfers, MsgUpdateUris } from "bitbadgesjs-transactions";
import { addBalancesForIdRanges } from "./balances";
import { getBalancesAfterTransfers } from "./distribution";
import { GetPermissionNumberValue, GetPermissions } from "./permissions";
import { Metadata } from "./types/metadata";
import { MetadataMap } from "./types/types";
import { ClaimDetails } from "./types/db";
import { TransferWithIncrements } from "./types/transfers";
import { BitBadgesCollection } from "./types/collections";
import { BitBadgesUserInfo } from "./types/users";

/**
 * Returns an IdRange[] of length 1 that covers all badgeIds in the collection.
 *
 * { start: 1, end: nextBadgeId - 1 }
 */
export function getIdRangesForAllBadgeIdsInCollection(collection: BitBadgesCollection<bigint>) {
  const range: IdRange<bigint> = {
    start: 1n,
    end: collection.nextBadgeId - 1n,
  }
  return [range];
}

/**
 * Extends the base MsgNewCollection<bigint> to include the distribution details for the new badges (transfers / claims)
 *
 * @typedef {Object} MsgNewCollectionWithClaimDetails
 * @property {ClaimDetails<bigint>[]} claims - The claims that will be added to the collection, extended to be ClaimDetails<bigint>
 * @property {TransferWithIncrements<bigint>[]} transfers - The transfers that will be added to the collection, extended to be TransferWithIncrements<bigint>
 */
export interface MsgNewCollectionWithClaimDetails extends MsgNewCollection<bigint> {
  details: ClaimDetails<bigint>[];
  transfers: TransferWithIncrements<bigint>[];
}

/**
 * Simulate what the collection will look like after the new Msg is to be processed.
 *
 * @param {MsgNewCollectionWithClaimDetails} msg - The MsgNewCollection<bigint> to simulate
 * @param {Metadata<bigint>} newCollectionMetadata - The metadata for the new collection
 * @param {MetadataMap<bigint>} newBadgeMetadata - The metadata for the new badges
 * @param {BitBadgesUserInfo<bigint>} txSender - The user who is sending the MsgNewCollection<bigint>
 * @param {BitBadgesCollection<bigint>} existingCollection - The existing collection, if it exists
 */
export function simulateCollectionAfterMsgNewCollection(
  msg: MsgNewCollectionWithClaimDetails,
  newCollectionMetadata: Metadata<bigint>,
  newBadgeMetadata: MetadataMap<bigint>,
  txSender: BitBadgesUserInfo<bigint>,
  existingCollection?: BitBadgesCollection<bigint>,
) {
  let nextBadgeId = existingCollection?.nextBadgeId ? existingCollection.nextBadgeId : 1n;

  //Calculate the amounts and supplys of badges (existing + new)
  let newMaxSupplys = existingCollection?.maxSupplys ? JSON.parse(JSON.stringify(existingCollection.maxSupplys)) : [];
  let newUnmintedSupplys = existingCollection?.unmintedSupplys ? JSON.parse(JSON.stringify(existingCollection.unmintedSupplys)) : [];

  for (const supplyObj of msg.badgeSupplys) {
    const amount = BigInt(supplyObj.amount);
    const supply = BigInt(supplyObj.supply);
    nextBadgeId += amount;

    const newMaxBalance = addBalancesForIdRanges({ approvals: [], balances: newMaxSupplys }, [{
      start: nextBadgeId - amount,
      end: nextBadgeId - 1n,
    }], supply);
    newMaxSupplys = newMaxBalance.balances;

    const newUnmintedBalance = addBalancesForIdRanges({ approvals: [], balances: newUnmintedSupplys }, [{
      start: nextBadgeId - amount,
      end: nextBadgeId - 1n,
    }], supply);
    newUnmintedSupplys = newUnmintedBalance.balances;
  }

  newUnmintedSupplys = getBalancesAfterTransfers(newUnmintedSupplys, msg.transfers);

  const claims = msg.claims;
  for (const claim of claims) {
    newUnmintedSupplys = getBalancesAfterTransfers(newUnmintedSupplys, [
      {
        toAddresses: [],
        toAddressesLength: 1n,
        balances: claim.undistributedBalances,
      }
    ]);
  }

  const newClaims = [
    ...existingCollection?.claims ? existingCollection.claims : [],
    ...claims.map((claim, idx) => {
      return {
        ...claim,
        claimId: existingCollection?.nextClaimId ? existingCollection.nextClaimId + BigInt(idx) : BigInt(idx + 1),
        collectionId: existingCollection?.collectionId ? existingCollection.collectionId : 0n,
        totalClaimsProcessed: 0n,
        claimsPerAddressCount: {},
        usedLeafIndices: [...claim.challenges.map(() => [])],
        details: msg.details[idx],
      }
    })
  ];
  const badgeCollection: BitBadgesCollection<bigint> = {
    ...msg,
    collectionId: existingCollection?.collectionId ? existingCollection.collectionId : 0n,
    manager: existingCollection?.manager ? existingCollection.manager : txSender.cosmosAddress,
    managerInfo: existingCollection?.managerInfo ? existingCollection.managerInfo : txSender,
    badgeMetadata: newBadgeMetadata,
    collectionMetadata: newCollectionMetadata,
    permissions: GetPermissions(msg.permissions),
    allowedTransfers: msg?.allowedTransfers ? msg.allowedTransfers : existingCollection?.allowedTransfers ? existingCollection.allowedTransfers : [],
    managerApprovedTransfers: msg?.managerApprovedTransfers ? msg.managerApprovedTransfers : existingCollection?.managerApprovedTransfers ? existingCollection.managerApprovedTransfers : [],
    managerRequests: [],
    nextBadgeId: nextBadgeId,
    claims: newClaims,
    nextClaimId: BigInt(newClaims.length) + 1n,
    unmintedSupplys: newUnmintedSupplys,
    maxSupplys: newMaxSupplys,
    balances: existingCollection?.balances ? existingCollection.balances : [],
    createdBlock: existingCollection?.createdBlock ? existingCollection.createdBlock : -1n,
    standard: existingCollection?.standard ? existingCollection.standard : msg.standard,
    activity: existingCollection?.activity ? existingCollection.activity : [],
    announcements: existingCollection?.announcements ? existingCollection.announcements : [],
    reviews: existingCollection?.reviews ? existingCollection.reviews : [],
    pagination: {
      activity: {
        bookmark: '',
        hasMore: true
      },
      announcements: {
        bookmark: '',
        hasMore: true
      },
      balances: {
        bookmark: '',
        hasMore: true
      },
      reviews: {
        bookmark: '',
        hasMore: true
      },
      claims: {
        bookmark: '',
        hasMore: true
      },
    }
  }

  return badgeCollection;
}

/**
 * Extends the base MsgMintAndDistributeBadges<bigint> to include the distribution details for the new badges (transfers / claims)
 *
 * @typedef {Object} MsgMintAndDistributeBadgesWithClaimDetails
 * @property {ClaimDetails<bigint>[]} claims - The claims that will be added to the collection, extended to be ClaimDetails<bigint>
 * @property {TransferWithIncrements<bigint>[]} transfers - The transfers that will be added to the collection, extended to be TransferWithIncrements<bigint>
 */
export interface MsgMintAndDistributeBadgesWithClaimDetails extends MsgMintAndDistributeBadges<bigint> {
  details: ClaimDetails<bigint>[];
  transfers: TransferWithIncrements<bigint>[];
}


/**
 * Simulate what the collection will look like after the new Msg is to be processed.
 *
 * @param {MsgMintAndDistributeBadgesWithClaimDetails} msg - The MsgMintAndDistributeBadges<bigint> to simulate
 * @param {Metadata<bigint>} newCollectionMetadata - The metadata for the new collection
 * @param {MetadataMap<bigint>} newBadgeMetadata - The metadata for the new badges
 * @param {BitBadgesUserInfo<bigint>} txSender - The user who is sending the MsgMintAndDistributeBadges<bigint>
 * @param {BitBadgesCollection<bigint>} existingCollection - The existing collection, if it exists
 */
export function simulateCollectionAfterMsgMintAndDistributeBadges(
  msg: MsgMintAndDistributeBadgesWithClaimDetails,
  newCollectionMetadata: Metadata<bigint>,
  newBadgeMetadata: MetadataMap<bigint>,
  txSender: BitBadgesUserInfo<bigint>,
  existingCollection?: BitBadgesCollection<bigint>
) {
  const msgNewCollectionWithEmptyValues: MsgNewCollectionWithClaimDetails = {
    ...msg,
    permissions: existingCollection?.permissions ? GetPermissionNumberValue(existingCollection.permissions) : 0n,
    bytes: existingCollection?.bytes ? existingCollection.bytes : '',
    allowedTransfers: existingCollection?.allowedTransfers ? existingCollection.allowedTransfers : [],
    managerApprovedTransfers: existingCollection?.managerApprovedTransfers ? existingCollection.managerApprovedTransfers : [],
    standard: existingCollection?.standard ? existingCollection.standard : 0n,
  }

  return simulateCollectionAfterMsgNewCollection(msgNewCollectionWithEmptyValues, newCollectionMetadata, newBadgeMetadata, txSender, existingCollection);
}

/**
 * Simulate what the collection will look like after the new Msg is to be processed.
 *
 * @param {MsgUpdateUris<bigint>} msg - The MsgUpdateUris<bigint> to simulate
 * @param {Metadata<bigint>} newCollectionMetadata - The metadata for the new collection
 * @param {MetadataMap<bigint>} newBadgeMetadata - The metadata for the new badges
 * @param {BitBadgesUserInfo<bigint>} txSender - The user who is sending the MsgUpdateUris<bigint>
 * @param {BitBadgesCollection<bigint>} existingCollection - The existing collection, if it exists
 */
export function simulateCollectionAfterMsgUpdateUris(
  msg: MsgUpdateUris<bigint>,
  newCollectionMetadata: Metadata<bigint>,
  newBadgeMetadata: MetadataMap<bigint>,
  txSender: BitBadgesUserInfo<bigint>,
  existingCollection?: BitBadgesCollection<bigint>
) {
  const msgNewCollectionWithEmptyValues: MsgNewCollectionWithClaimDetails = {
    ...msg,
    permissions: existingCollection?.permissions ? GetPermissionNumberValue(existingCollection.permissions) : 0n,
    bytes: existingCollection?.bytes ? existingCollection.bytes : '',
    allowedTransfers: existingCollection?.allowedTransfers ? existingCollection.allowedTransfers : [],
    managerApprovedTransfers: existingCollection?.managerApprovedTransfers ? existingCollection.managerApprovedTransfers : [],
    standard: existingCollection?.standard ? existingCollection.standard : 0n,
    badgeSupplys: [],
    transfers: [],
    claims: [],
    details: [],
  }

  return simulateCollectionAfterMsgNewCollection(msgNewCollectionWithEmptyValues, newCollectionMetadata, newBadgeMetadata, txSender, existingCollection);
}


/**
 * Simulate what the collection will look like after the new Msg is to be processed.
 *
 * @param {MsgUpdateAllowedTransfers} msg - The MsgUpdateAllowedTransfers to simulate
 * @param {Metadata<bigint>} newCollectionMetadata - The metadata for the new collection
 * @param {MetadataMap<bigint>} newBadgeMetadata - The metadata for the new badges
 * @param {BitBadgesUserInfo<bigint>} txSender - The user who is sending the MsgUpdateAllowedTransfers
 * @param {BitBadgesCollection<bigint>} existingCollection - The existing collection, if it exists
 */
export function simulateCollectionAfterMsgUpdateAllowedTransfers(
  msg: MsgUpdateAllowedTransfers<bigint>,
  newCollectionMetadata: Metadata<bigint>,
  newBadgeMetadata: MetadataMap<bigint>,
  txSender: BitBadgesUserInfo<bigint>,
  existingCollection?: BitBadgesCollection<bigint>
) {
  const msgNewCollectionWithEmptyValues: MsgNewCollectionWithClaimDetails = {
    ...msg,
    permissions: existingCollection?.permissions ? GetPermissionNumberValue(existingCollection.permissions) : 0n,
    bytes: existingCollection?.bytes ? existingCollection.bytes : '',
    managerApprovedTransfers: existingCollection?.managerApprovedTransfers ? existingCollection.managerApprovedTransfers : [],
    standard: existingCollection?.standard ? existingCollection.standard : 0n,
    badgeSupplys: [],
    transfers: [],
    claims: [],
    collectionUri: existingCollection?.collectionUri ? existingCollection.collectionUri : '',
    badgeUris: existingCollection?.badgeUris ? existingCollection.badgeUris : [],
    balancesUri: existingCollection?.balancesUri ? existingCollection.balancesUri : '',
    details: [],
  }

  return simulateCollectionAfterMsgNewCollection(msgNewCollectionWithEmptyValues, newCollectionMetadata, newBadgeMetadata, txSender, existingCollection);
}
