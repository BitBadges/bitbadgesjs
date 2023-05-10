import { IdRange } from "bitbadgesjs-proto";
import { MessageMsgMintAndDistributeBadges, MessageMsgNewCollection, MessageMsgUpdateAllowedTransfers, MessageMsgUpdateUris } from "bitbadgesjs-transactions";
import { addBalancesForIdRanges } from "./balances";
import { getBalancesAfterTransfers } from "./distribution";
import { GetPermissionNumberValue, GetPermissions } from "./permissions";
import { BitBadgeCollection, BitBadgesUserInfo } from "./types/api";
import { Metadata } from "./types/metadata";
import { MetadataMap } from "./types/types";
import { ClaimWithDetails } from "./types/db";
import { TransferWithIncrements } from "./types/transfers";

/**
 * Returns an IdRange[] of length 1 that covers all badgeIds in the collection.
 *
 * { start: 1, end: nextBadgeId - 1 }
 */
export function getIdRangesForAllBadgeIdsInCollection(collection: BitBadgeCollection) {
  const range: IdRange = {
    start: 1n,
    end: collection.nextBadgeId - 1n,
  }
  return [range];
}

/**
 * Extends the base MessageMsgNewCollection to include the distribution details for the new badges (transfers / claims)
 *
 * @typedef {Object} MessageMsgNewCollectionWithClaimDetails
 * @property {ClaimWithDetails[]} claims - The claims that will be added to the collection, extended to be ClaimWithDetails
 * @property {TransferWithIncrements[]} transfers - The transfers that will be added to the collection, extended to be TransferWithIncrements
 */
export interface MessageMsgNewCollectionWithClaimDetails extends MessageMsgNewCollection {
  claims: ClaimWithDetails[];
  transfers: TransferWithIncrements[];
}

/**
 * Simulate what the collection will look like after the new Msg is to be processed.
 *
 * @param {MessageMsgNewCollectionWithClaimDetails} msg - The MsgNewCollection to simulate
 * @param {Metadata} newCollectionMetadata - The metadata for the new collection
 * @param {MetadataMap} newBadgeMetadata - The metadata for the new badges
 * @param {BitBadgesUserInfo} txSender - The user who is sending the MsgNewCollection
 * @param {BitBadgeCollection} existingCollection - The existing collection, if it exists
 */
export function simulateCollectionAfterMsgNewCollection(
  msg: MessageMsgNewCollectionWithClaimDetails,
  newCollectionMetadata: Metadata,
  newBadgeMetadata: MetadataMap,
  txSender: BitBadgesUserInfo,
  existingCollection?: BitBadgeCollection,
) {
  let nextBadgeId = existingCollection?.nextBadgeId ? existingCollection.nextBadgeId : 1n;

  //Calculate the amounts and supplys of badges (existing + new)
  let newMaxSupplys = existingCollection?.maxSupplys ? JSON.parse(JSON.stringify(existingCollection.maxSupplys)) : [];
  let newUnmintedSupplys = existingCollection?.unmintedSupplys ? JSON.parse(JSON.stringify(existingCollection.unmintedSupplys)) : [];

  for (const supplyObj of msg.badgeSupplys) {
    nextBadgeId += supplyObj.amount;

    const newMaxBalance = addBalancesForIdRanges({ approvals: [], balances: newMaxSupplys }, [{
      start: nextBadgeId - supplyObj.amount,
      end: nextBadgeId - 1n,
    }], supplyObj.supply);
    newMaxSupplys = newMaxBalance.balances;

    const newUnmintedBalance = addBalancesForIdRanges({ approvals: [], balances: newUnmintedSupplys }, [{
      start: nextBadgeId - supplyObj.amount,
      end: nextBadgeId - 1n,
    }], supplyObj.supply);
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
        claimsPerAddressCount: {}
      }
    })
  ];
  const badgeCollection: BitBadgeCollection = {
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
  }

  return badgeCollection;
}

/**
 * Extends the base MessageMsgMintAndDistributeBadges to include the distribution details for the new badges (transfers / claims)
 *
 * @typedef {Object} MessageMsgMintAndDistributeBadgesWithClaimDetails
 * @property {ClaimWithDetails[]} claims - The claims that will be added to the collection, extended to be ClaimWithDetails
 * @property {TransferWithIncrements[]} transfers - The transfers that will be added to the collection, extended to be TransferWithIncrements
 */
export interface MessageMsgMintAndDistributeBadgesWithClaimDetails extends MessageMsgMintAndDistributeBadges {
  claims: ClaimWithDetails[];
  transfers: TransferWithIncrements[];
}


/**
 * Simulate what the collection will look like after the new Msg is to be processed.
 *
 * @param {MessageMsgMintAndDistributeBadgesWithClaimDetails} msg - The MsgMintAndDistributeBadges to simulate
 * @param {Metadata} newCollectionMetadata - The metadata for the new collection
 * @param {MetadataMap} newBadgeMetadata - The metadata for the new badges
 * @param {BitBadgesUserInfo} txSender - The user who is sending the MsgMintAndDistributeBadges
 * @param {BitBadgeCollection} existingCollection - The existing collection, if it exists
 */
export function simulateCollectionAfterMsgMintAndDistributeBadges(
  msg: MessageMsgMintAndDistributeBadgesWithClaimDetails,
  newCollectionMetadata: Metadata,
  newBadgeMetadata: MetadataMap,
  txSender: BitBadgesUserInfo,
  existingCollection?: BitBadgeCollection
) {
  const msgNewCollectionWithEmptyValues: MessageMsgNewCollectionWithClaimDetails = {
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
 * @param {MessageMsgUpdateUris} msg - The MsgUpdateUris to simulate
 * @param {Metadata} newCollectionMetadata - The metadata for the new collection
 * @param {MetadataMap} newBadgeMetadata - The metadata for the new badges
 * @param {BitBadgesUserInfo} txSender - The user who is sending the MsgUpdateUris
 * @param {BitBadgeCollection} existingCollection - The existing collection, if it exists
 */
export function simulateCollectionAfterMsgUpdateUris(
  msg: MessageMsgUpdateUris,
  newCollectionMetadata: Metadata,
  newBadgeMetadata: MetadataMap,
  txSender: BitBadgesUserInfo,
  existingCollection?: BitBadgeCollection
) {
  const msgNewCollectionWithEmptyValues: MessageMsgNewCollectionWithClaimDetails = {
    ...msg,
    permissions: existingCollection?.permissions ? GetPermissionNumberValue(existingCollection.permissions) : 0n,
    bytes: existingCollection?.bytes ? existingCollection.bytes : '',
    allowedTransfers: existingCollection?.allowedTransfers ? existingCollection.allowedTransfers : [],
    managerApprovedTransfers: existingCollection?.managerApprovedTransfers ? existingCollection.managerApprovedTransfers : [],
    standard: existingCollection?.standard ? existingCollection.standard : 0n,
    badgeSupplys: [],
    transfers: [],
    claims: [],
  }

  return simulateCollectionAfterMsgNewCollection(msgNewCollectionWithEmptyValues, newCollectionMetadata, newBadgeMetadata, txSender, existingCollection);
}


/**
 * Simulate what the collection will look like after the new Msg is to be processed.
 *
 * @param {MessageMsgUpdateAllowedTransfers} msg - The MsgUpdateAllowedTransfers to simulate
 * @param {Metadata} newCollectionMetadata - The metadata for the new collection
 * @param {MetadataMap} newBadgeMetadata - The metadata for the new badges
 * @param {BitBadgesUserInfo} txSender - The user who is sending the MsgUpdateAllowedTransfers
 * @param {BitBadgeCollection} existingCollection - The existing collection, if it exists
 */
export function simulateCollectionAfterMsgUpdateAllowedTransfers(
  msg: MessageMsgUpdateAllowedTransfers,
  newCollectionMetadata: Metadata,
  newBadgeMetadata: MetadataMap,
  txSender: BitBadgesUserInfo,
  existingCollection?: BitBadgeCollection
) {
  const msgNewCollectionWithEmptyValues: MessageMsgNewCollectionWithClaimDetails = {
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
  }

  return simulateCollectionAfterMsgNewCollection(msgNewCollectionWithEmptyValues, newCollectionMetadata, newBadgeMetadata, txSender, existingCollection);
}
