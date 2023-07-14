import { Balance, UintRange } from "bitbadgesjs-proto";
import { addBalances, getBlankBalance } from "./balances";
import { BitBadgesCollection } from "./types/collections";
import { deepCopy } from "./types/utils";

/**
 * Returns an UintRange[] of length 1 that covers all badgeIds in the collection.
 *
 * { start: 1, end: nextBadgeId - 1 }
 */
export function getUintRangesForAllBadgeIdsInCollection(collection: BitBadgesCollection<bigint>) {
  const totalAddressBalance = getBlankBalance(false);
  for (const ownerBalance of collection.owners) {
    if (ownerBalance.cosmosAddress === "Total") {
      totalAddressBalance.balances = ownerBalance.balances;
      break;
    }
  }

  let maxBadgeId = 1n;
  for (const balance of totalAddressBalance.balances) {
    for (const badgeIdRange of balance.badgeIds) {
      if (BigInt(badgeIdRange.end) > maxBadgeId) {
        maxBadgeId = BigInt(badgeIdRange.end);
      }
    }
  }


  const range: UintRange<bigint> = {
    start: 1n,
    end: maxBadgeId
  }
  return [range];
}

/**
 * Simulate what the collection will look like after a Msg which has the inputted details is processed.
 *
 * @property {BitBadgesCollection<bigint>} existingCollection - The existing collection, if it exists
 * @property {Balance<bigint>} badgesToCreate - The new badges to create. Will be sent to the "Mint" address, and "Total" will be updated.
 */
export function incrementMintAndTotalBalances(
  existingCollection: BitBadgesCollection<bigint>,
  badgesToCreate: Balance<bigint>[],
) {
  const totalBalanceStore = existingCollection?.owners.find(x => x.cosmosAddress === "Total");
  const mintBalanceStore = existingCollection?.owners.find(x => x.cosmosAddress === "Mint");

  //Calculate the amounts and supplys of badges (existing + new)
  let newMaxSupplys = totalBalanceStore ? deepCopy(totalBalanceStore) : getBlankBalance(false);
  let newUnmintedSupplys = mintBalanceStore ? deepCopy(mintBalanceStore) : getBlankBalance(false);

  newMaxSupplys.balances = addBalances(badgesToCreate, newMaxSupplys.balances);
  newUnmintedSupplys.balances = addBalances(badgesToCreate, newUnmintedSupplys.balances);

  //Replace "Mint" and "Total" in owners array with new balances
  const newOwners = existingCollection?.owners.filter(x => x.cosmosAddress !== "Mint" && x.cosmosAddress !== "Total") ?? [];
  newOwners.push({
    _id: `${existingCollection?.collectionId}:Mint`,
    balances: newUnmintedSupplys.balances,
    cosmosAddress: "Mint",
    collectionId: existingCollection.collectionId,
    onChain: true,
    approvedOutgoingTransfersTimeline: [],
    approvedIncomingTransfersTimeline: [],
    userPermissions: {
      canUpdateApprovedIncomingTransfers: [],
      canUpdateApprovedOutgoingTransfers: [],
    }
  });

  newOwners.push({
    _id: `${existingCollection?.collectionId}:Total`,
    balances: newMaxSupplys.balances,
    cosmosAddress: "Total",
    collectionId: existingCollection.collectionId,
    onChain: true,
    approvedOutgoingTransfersTimeline: [],
    approvedIncomingTransfersTimeline: [],
    userPermissions: {
      canUpdateApprovedIncomingTransfers: [],
      canUpdateApprovedOutgoingTransfers: [],
    }
  });


  const badgeCollection: BitBadgesCollection<bigint> = {
    ...existingCollection,
    owners: newOwners,
  }

  return deepCopy(badgeCollection);
}
