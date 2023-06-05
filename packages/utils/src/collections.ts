import { b_IdRange } from "bitbadgesjs-proto";
import { b_MsgMintAndDistributeBadges, b_MsgNewCollection, b_MsgUpdateAllowedTransfers, b_MsgUpdateUris } from "bitbadgesjs-transactions";
import { addBalancesForIdRanges } from "./balances";
import { getBalancesAfterTransfers } from "./distribution";
import { GetPermissionNumberValue, GetPermissions } from "./permissions";
import { b_Metadata } from "./types/metadata";
import { b_MetadataMap } from "./types/types";
import { b_ClaimDetails } from "./types/db";
import { b_TransferWithIncrements } from "./types/transfers";
import { b_BitBadgesCollection } from "./types/collections";
import { b_BitBadgesUserInfo } from "./types/users";

/**
 * Returns an b_IdRange[] of length 1 that covers all badgeIds in the collection.
 *
 * { start: 1, end: nextBadgeId - 1 }
 */
export function getIdRangesForAllBadgeIdsInCollection(collection: b_BitBadgesCollection) {
  const range: b_IdRange = {
    start: 1n,
    end: collection.nextBadgeId - 1n,
  }
  return [range];
}

/**
 * Extends the base b_MsgNewCollection to include the distribution details for the new badges (transfers / claims)
 *
 * @typedef {Object} MsgNewCollectionWithClaimDetails
 * @property {b_ClaimDetails[]} claims - The claims that will be added to the collection, extended to be ClaimDetails
 * @property {b_TransferWithIncrements[]} transfers - The transfers that will be added to the collection, extended to be TransferWithIncrements
 */
export interface MsgNewCollectionWithClaimDetails extends b_MsgNewCollection {
  details: b_ClaimDetails[];
  transfers: b_TransferWithIncrements[];
}

/**
 * Simulate what the collection will look like after the new Msg is to be processed.
 *
 * @param {MsgNewCollectionWithClaimDetails} msg - The b_MsgNewCollection to simulate
 * @param {b_Metadata} newCollectionMetadata - The metadata for the new collection
 * @param {b_MetadataMap} newBadgeMetadata - The metadata for the new badges
 * @param {b_BitBadgesUserInfo} txSender - The user who is sending the b_MsgNewCollection
 * @param {b_BitBadgesCollection} existingCollection - The existing collection, if it exists
 */
export function simulateCollectionAfterMsgNewCollection(
  msg: MsgNewCollectionWithClaimDetails,
  newCollectionMetadata: b_Metadata,
  newBadgeMetadata: b_MetadataMap,
  txSender: b_BitBadgesUserInfo,
  existingCollection?: b_BitBadgesCollection,
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
  const badgeCollection: b_BitBadgesCollection = {
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
 * Extends the base b_MsgMintAndDistributeBadges to include the distribution details for the new badges (transfers / claims)
 *
 * @typedef {Object} MsgMintAndDistributeBadgesWithClaimDetails
 * @property {b_ClaimDetails[]} claims - The claims that will be added to the collection, extended to be ClaimDetails
 * @property {b_TransferWithIncrements[]} transfers - The transfers that will be added to the collection, extended to be TransferWithIncrements
 */
export interface MsgMintAndDistributeBadgesWithClaimDetails extends b_MsgMintAndDistributeBadges {
  details: b_ClaimDetails[];
  transfers: b_TransferWithIncrements[];
}


/**
 * Simulate what the collection will look like after the new Msg is to be processed.
 *
 * @param {MsgMintAndDistributeBadgesWithClaimDetails} msg - The b_MsgMintAndDistributeBadges to simulate
 * @param {b_Metadata} newCollectionMetadata - The metadata for the new collection
 * @param {b_MetadataMap} newBadgeMetadata - The metadata for the new badges
 * @param {b_BitBadgesUserInfo} txSender - The user who is sending the b_MsgMintAndDistributeBadges
 * @param {b_BitBadgesCollection} existingCollection - The existing collection, if it exists
 */
export function simulateCollectionAfterMsgMintAndDistributeBadges(
  msg: MsgMintAndDistributeBadgesWithClaimDetails,
  newCollectionMetadata: b_Metadata,
  newBadgeMetadata: b_MetadataMap,
  txSender: b_BitBadgesUserInfo,
  existingCollection?: b_BitBadgesCollection
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
 * @param {b_MsgUpdateUris} msg - The b_MsgUpdateUris to simulate
 * @param {b_Metadata} newCollectionMetadata - The metadata for the new collection
 * @param {b_MetadataMap} newBadgeMetadata - The metadata for the new badges
 * @param {b_BitBadgesUserInfo} txSender - The user who is sending the b_MsgUpdateUris
 * @param {b_BitBadgesCollection} existingCollection - The existing collection, if it exists
 */
export function simulateCollectionAfterMsgUpdateUris(
  msg: b_MsgUpdateUris,
  newCollectionMetadata: b_Metadata,
  newBadgeMetadata: b_MetadataMap,
  txSender: b_BitBadgesUserInfo,
  existingCollection?: b_BitBadgesCollection
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
 * @param {b_MsgUpdateAllowedTransfers} msg - The b_MsgUpdateAllowedTransfers to simulate
 * @param {b_Metadata} newCollectionMetadata - The metadata for the new collection
 * @param {b_MetadataMap} newBadgeMetadata - The metadata for the new badges
 * @param {b_BitBadgesUserInfo} txSender - The user who is sending the b_MsgUpdateAllowedTransfers
 * @param {b_BitBadgesCollection} existingCollection - The existing collection, if it exists
 */
export function simulateCollectionAfterMsgUpdateAllowedTransfers(
  msg: b_MsgUpdateAllowedTransfers,
  newCollectionMetadata: b_Metadata,
  newBadgeMetadata: b_MetadataMap,
  txSender: b_BitBadgesUserInfo,
  existingCollection?: b_BitBadgesCollection
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
