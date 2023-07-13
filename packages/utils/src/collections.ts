import { BadgeSupplyAndAmount, IdRange } from "bitbadgesjs-proto";
import { addBalancesForIdRanges } from "./balances";
import { getBalancesAfterTransfers } from "./distribution";
import { BitBadgesCollection } from "./types/collections";
import { ClaimInfoWithDetails } from "./types/db";
import { TransferWithIncrements } from "./types/transfers";
import { deepCopy } from "./types/utils";

/**
 * Returns an UintRange[] of length 1 that covers all badgeIds in the collection.
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
 * Simulate what the collection will look like after a Msg which has the inputted details is processed.
 *
 * @property {BitBadgesCollection<bigint>} existingCollection - The existing collection, if it exists
 * @property {ClaimInfoWithDetails<bigint>[]} claims - The claims that will be added to the collection, extended to be ClaimDetails<bigint>
 * @property {TransferWithIncrements<bigint>[]} transfers - The transfers that will be added to the collection, extended to be TransferWithIncrements<bigint>
 * @property {BadgeSupplyAndAmount<bigint>[]} badgeSupplys - The badgeSupplys that will be added to the collection
 */
export function simulateCollectionAfterMsg(
  existingCollection: BitBadgesCollection<bigint>,
  claims: ClaimInfoWithDetails<bigint>[],
  transfers: TransferWithIncrements<bigint>[],
  badgeSupplys: BadgeSupplyAndAmount<bigint>[],
) {
  let nextBadgeId = existingCollection?.nextBadgeId ? existingCollection.nextBadgeId : 1n;

  //Calculate the amounts and supplys of badges (existing + new)
  let newMaxSupplys = existingCollection?.maxSupplys ? deepCopy(existingCollection.maxSupplys) : [];
  let newUnmintedSupplys = existingCollection?.unmintedSupplys ? deepCopy(existingCollection.unmintedSupplys) : [];

  for (const supplyObj of badgeSupplys) {
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

  newUnmintedSupplys = getBalancesAfterTransfers(newUnmintedSupplys, transfers);

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
        usedLeaves: [...claim.challenges.map(() => [])],
        details: claim.details ? claim.details : undefined,
        _id: `${existingCollection?.collectionId ? existingCollection.collectionId : 0n}:${existingCollection?.nextClaimId ? existingCollection.nextClaimId + BigInt(idx) : BigInt(idx + 1)}`
      }
    })
  ];

  const badgeCollection: BitBadgesCollection<bigint> = {
    ...existingCollection,
    nextBadgeId: nextBadgeId,
    claims: newClaims,
    nextClaimId: BigInt(newClaims.length) + 1n,
    unmintedSupplys: newUnmintedSupplys,
    maxSupplys: newMaxSupplys,
  }

  return badgeCollection;
}
