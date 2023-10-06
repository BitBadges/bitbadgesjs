import { Balance, UintRange } from "bitbadgesjs-proto";
import { addBalances, getBlankBalance } from "./balances";
import { BitBadgesCollection } from "./types/collections";
import { BalanceInfoWithDetails } from "./types/db";
import { deepCopy } from "./types/utils";

/**
 * Returns an UintRange[] of length 1 that covers all badgeIds in the collection.
 *
 * { start: 1, end: nextBadgeId - 1 }
 *
 * @category Uint Ranges
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
 *
 * @category Balances
 */
export function incrementMintAndTotalBalances(
  collectionId: bigint,
  owners: BalanceInfoWithDetails<bigint>[],
  badgesToCreate: Balance<bigint>[],
) {
  const totalBalanceStore = owners.find(x => x.cosmosAddress === "Total");
  const mintBalanceStore = owners.find(x => x.cosmosAddress === "Mint");


  //Calculate the amounts and supplys of badges (existing + new)
  let newMaxSupplys = totalBalanceStore ? deepCopy(totalBalanceStore) : getBlankBalance(false);
  let newUnmintedSupplys = mintBalanceStore ? deepCopy(mintBalanceStore) : getBlankBalance(false);

  newMaxSupplys.balances = addBalances(badgesToCreate, newMaxSupplys.balances);
  newUnmintedSupplys.balances = addBalances(badgesToCreate, newUnmintedSupplys.balances);

  //Replace "Mint" and "Total" in owners array with new balances
  const newOwners: BalanceInfoWithDetails<bigint>[] = owners.filter(x => x.cosmosAddress !== "Mint" && x.cosmosAddress !== "Total") ?? [];
  newOwners.push({
    _id: `${collectionId.toString()}:Mint`,
    balances: newUnmintedSupplys.balances,
    cosmosAddress: "Mint",
    collectionId: collectionId,
    onChain: true,
    approvedOutgoingTransfers: [],
    approvedIncomingTransfers: [],
    userPermissions: {
      canUpdateApprovedIncomingTransfers: [],
      canUpdateApprovedOutgoingTransfers: [],
    },
    updateHistory: [],
  });

  newOwners.push({
    _id: `${collectionId.toString()}:Total`,
    balances: newMaxSupplys.balances,
    cosmosAddress: "Total",
    collectionId: collectionId,
    onChain: true,
    approvedOutgoingTransfers: [],
    approvedIncomingTransfers: [],
    userPermissions: {
      canUpdateApprovedIncomingTransfers: [],
      canUpdateApprovedOutgoingTransfers: [],
    },
    updateHistory: [],
  });

  return newOwners;
}
