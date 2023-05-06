import { IdRange, UserBalance } from "bitbadgesjs-proto";
import { MessageMsgMintBadge, MessageMsgNewCollection, MessageMsgUpdateDisallowedTransfers, MessageMsgUpdateUris } from "bitbadgesjs-transactions";
import { getBalanceAfterTransfers } from "./balances";
import { addBalancesForIdRanges } from "./balances-gpt";
import { getClaimsFromDistributionDetails } from "./claims";
import { GetPermissionNumberValue, GetPermissions } from "./permissions";
import { BitBadgeCollection, BitBadgesUserInfo } from "./types/api";
import { Metadata } from "./types/metadata";
import { DistributionDetails, MetadataMap } from "./types/types";

/**
 * Returns an IdRange[] of length 1 that covers all badgeIds in the collection.
 *
 * { start: 1, end: nextBadgeId - 1 }
 */
export function getIdRangesForAllBadgeIdsInCollection(collection: BitBadgeCollection) {
  const range: IdRange = {
    start: 1,
    end: collection.nextBadgeId - 1,
  }
  return [range];
}

/**
 * Simulate what the collection will look like after the new Msg is to be processed.
 *
 * connectedUser is the user that will submit the transaction (i.e. typically the manager)
 * distributionDetails is the distribution details for the new badges (transfers / claims)
 * existingCollection is the current collection, if any
 */
export function simulateCollectionAfterMsgNewCollection(
  msg: MessageMsgNewCollection,
  newCollectionMetadata: Metadata,
  newBadgeMetadata: MetadataMap,
  connectedUser: BitBadgesUserInfo,
  distributionDetails: DistributionDetails[],
  existingCollection?: BitBadgeCollection,
) {
  let nextBadgeId = existingCollection?.nextBadgeId ? existingCollection.nextBadgeId : 1;

  //Calculate the amounts and supplys of badges (existing + new)
  let newMaxSupplys = existingCollection?.maxSupplys ? JSON.parse(JSON.stringify(existingCollection.maxSupplys)) : [];
  let newUnmintedSupplys = existingCollection?.unmintedSupplys ? JSON.parse(JSON.stringify(existingCollection.unmintedSupplys)) : [];

  for (const supplyObj of msg.badgeSupplys) {
    nextBadgeId += supplyObj.amount;

    const newMaxBalance = addBalancesForIdRanges({ approvals: [], balances: newMaxSupplys }, [{
      start: nextBadgeId - supplyObj.amount,
      end: nextBadgeId - 1,
    }], supplyObj.supply);
    newMaxSupplys = newMaxBalance.balances;

    const newUnmintedBalance = addBalancesForIdRanges({ approvals: [], balances: newUnmintedSupplys }, [{
      start: nextBadgeId - supplyObj.amount,
      end: nextBadgeId - 1,
    }], supplyObj.supply);
    newUnmintedSupplys = newUnmintedBalance.balances;
  }

  //Calculate the unmintedBalances
  let unmintedBalances: UserBalance = {
    balances: newUnmintedSupplys,
    approvals: [],
  };

  unmintedBalances = getBalanceAfterTransfers(unmintedBalances, msg.transfers);

  const existingClaimsLength = existingCollection?.claims ? existingCollection.claims.length : 0;
  const claimsRes = getClaimsFromDistributionDetails(unmintedBalances, distributionDetails, existingCollection?.collectionId ? existingCollection.collectionId : 0, existingClaimsLength + 1);
  const newClaims = [...existingCollection?.claims ? existingCollection.claims : [], ...claimsRes.storedClaims];
  unmintedBalances = claimsRes.undistributedBalance;

  const badgeCollection: BitBadgeCollection = {
    ...msg,
    collectionId: existingCollection?.collectionId ? existingCollection.collectionId : 0,
    manager: existingCollection?.manager ? existingCollection.manager : connectedUser.accountNumber,
    managerInfo: existingCollection?.managerInfo ? existingCollection.managerInfo : connectedUser,
    badgeMetadata: newBadgeMetadata,
    collectionMetadata: newCollectionMetadata,
    permissions: GetPermissions(msg.permissions),
    disallowedTransfers: msg?.disallowedTransfers ? msg.disallowedTransfers : existingCollection?.disallowedTransfers ? existingCollection.disallowedTransfers : [],
    managerApprovedTransfers: msg?.managerApprovedTransfers ? msg.managerApprovedTransfers : existingCollection?.managerApprovedTransfers ? existingCollection.managerApprovedTransfers : [],
    managerRequests: [],
    nextBadgeId: nextBadgeId,
    claims: newClaims,
    unmintedSupplys: unmintedBalances.balances,
    maxSupplys: newMaxSupplys,
    balances: existingCollection?.balances ? existingCollection.balances : [],
    createdBlock: existingCollection?.createdBlock ? existingCollection.createdBlock : -1,
    standard: existingCollection?.standard ? existingCollection.standard : msg.standard,
    activity: existingCollection?.activity ? existingCollection.activity : [],
    announcements: existingCollection?.announcements ? existingCollection.announcements : [],
    reviews: existingCollection?.reviews ? existingCollection.reviews : [],
  }

  return badgeCollection;
}

export function simulateCollectionAfterMsgMintBadge(
  msg: MessageMsgMintBadge,
  newCollectionMetadata: Metadata,
  newBadgeMetadata: MetadataMap,
  connectedUser: BitBadgesUserInfo,
  distributionDetails: DistributionDetails[],
  existingCollection?: BitBadgeCollection
) {
  const msgNewCollectionWithEmptyValues: MessageMsgNewCollection = {
    ...msg,
    permissions: existingCollection?.permissions ? GetPermissionNumberValue(existingCollection.permissions) : 0,
    bytes: existingCollection?.bytes ? existingCollection.bytes : '',
    disallowedTransfers: existingCollection?.disallowedTransfers ? existingCollection.disallowedTransfers : [],
    managerApprovedTransfers: existingCollection?.managerApprovedTransfers ? existingCollection.managerApprovedTransfers : [],
    standard: existingCollection?.standard ? existingCollection.standard : 0,
  }

  return simulateCollectionAfterMsgNewCollection(msgNewCollectionWithEmptyValues, newCollectionMetadata, newBadgeMetadata, connectedUser, distributionDetails, existingCollection);
}

export function simulateCollectionAfterMsgUpdateUris(
  msg: MessageMsgUpdateUris,
  newCollectionMetadata: Metadata,
  newBadgeMetadata: MetadataMap,
  connectedUser: BitBadgesUserInfo,
  distributionDetails: DistributionDetails[],
  existingCollection?: BitBadgeCollection
) {
  const msgNewCollectionWithEmptyValues: MessageMsgNewCollection = {
    ...msg,
    permissions: existingCollection?.permissions ? GetPermissionNumberValue(existingCollection.permissions) : 0,
    bytes: existingCollection?.bytes ? existingCollection.bytes : '',
    disallowedTransfers: existingCollection?.disallowedTransfers ? existingCollection.disallowedTransfers : [],
    managerApprovedTransfers: existingCollection?.managerApprovedTransfers ? existingCollection.managerApprovedTransfers : [],
    standard: existingCollection?.standard ? existingCollection.standard : 0,
    badgeSupplys: [],
    transfers: [],
    claims: [],
  }

  return simulateCollectionAfterMsgNewCollection(msgNewCollectionWithEmptyValues, newCollectionMetadata, newBadgeMetadata, connectedUser, distributionDetails, existingCollection);
}


export function simulateCollectionAfterMsgUpdateDisallowedTransfers(
  msg: MessageMsgUpdateDisallowedTransfers,
  newCollectionMetadata: Metadata,
  newBadgeMetadata: MetadataMap,
  connectedUser: BitBadgesUserInfo,
  distributionDetails: DistributionDetails[],
  existingCollection?: BitBadgeCollection
) {
  const msgNewCollectionWithEmptyValues: MessageMsgNewCollection = {
    ...msg,
    permissions: existingCollection?.permissions ? GetPermissionNumberValue(existingCollection.permissions) : 0,
    bytes: existingCollection?.bytes ? existingCollection.bytes : '',
    managerApprovedTransfers: existingCollection?.managerApprovedTransfers ? existingCollection.managerApprovedTransfers : [],
    standard: existingCollection?.standard ? existingCollection.standard : 0,
    badgeSupplys: [],
    transfers: [],
    claims: [],
    collectionUri: existingCollection?.collectionUri ? existingCollection.collectionUri : '',
    badgeUris: existingCollection?.badgeUris ? existingCollection.badgeUris : [],
  }

  return simulateCollectionAfterMsgNewCollection(msgNewCollectionWithEmptyValues, newCollectionMetadata, newBadgeMetadata, connectedUser, distributionDetails, existingCollection);
}
