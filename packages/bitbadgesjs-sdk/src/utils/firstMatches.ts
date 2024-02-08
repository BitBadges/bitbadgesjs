/*
  We have some non-permission fields that we only take first matches for

  This file has helper functions for those three fields.
*/
import { AddressList, BadgeMetadata, deepCopy } from "..";
import { generateReservedListId, getReservedAddressList, isAddressListEmpty, isInAddressList, removeAddressListFromAddressList } from "./addressLists";
import { castIncomingTransfersToCollectionTransfers, castOutgoingTransfersToCollectionTransfers } from "./approved_transfers_casts";
import { GetFirstMatchOnly, MergeUniversalPermissionDetails } from "./overlaps";
import { castCollectionApprovalToUniversalPermission } from "./permissions";
import { CollectionApprovalWithDetails } from "./types/collections";
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails } from "./types/users";
import { removeUintRangesFromUintRanges } from "./uintRanges";

/**
 * @catgeory Metadata
 */
export function getFirstMatchForBadgeMetadata(
  badgeMetadata: BadgeMetadata<bigint>[]
) {
  for (let i = 0; i < badgeMetadata.length; i++) {
    const metadata = badgeMetadata[i];
    for (let j = i + 1; j < badgeMetadata.length; j++) {
      const otherMetadata = badgeMetadata[j];
      const [remaining,] = removeUintRangesFromUintRanges(metadata.badgeIds, otherMetadata.badgeIds);
      otherMetadata.badgeIds = remaining;
    }
  }

  return badgeMetadata
}


/**
 * For all (from, to, initiatedBy, badgeIds, transferTimes, ownershipTimes) that are not handled by the first matches, return them as unhandled / disapproved
 *
 * @category Approvals / Transferability
 */
export function getUnhandledCollectionApprovals(
  collectionApprovals: CollectionApprovalWithDetails<bigint>[],
  ignoreTrackerIds: boolean,
  doNotMerge?: boolean
) {
  const currTransferability: CollectionApprovalWithDetails<bigint>[] = deepCopy(collectionApprovals);

  //Startegy here is to create a unique approval, get first matches, and then whatever makes it through the first matches (w/ approvalId "__disapproved__") is unhandled
  currTransferability.push({
    fromList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
    toList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
    initiatedByList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
    fromListId: 'AllWithMint',
    toListId: 'AllWithMint',
    initiatedByListId: 'AllWithMint',
    approvalId: "__disapproved__",
    amountTrackerId: "All",
    challengeTrackerId: "All",
    transferTimes: [{ start: 1n, end: 18446744073709551615n }],
    badgeIds: [{ start: 1n, end: 18446744073709551615n }],
    ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
  });


  const expandedTransferability: CollectionApprovalWithDetails<bigint>[] = currTransferability;
  const firstMatches = GetFirstMatchOnly(castCollectionApprovalToUniversalPermission(expandedTransferability).map(x => {
    if (ignoreTrackerIds) {
      return {
        ...x,
        usesApprovalIdList: false,
        usesAmountTrackerIdList: false,
        usesChallengeTrackerIdList: false,
      }
    } else {
      return x;
    }
  }
  ));

  const merged = MergeUniversalPermissionDetails(firstMatches, doNotMerge);

  const newApprovals: CollectionApprovalWithDetails<bigint>[] = [];
  for (const match of merged) {
    newApprovals.push({
      fromList: match.fromList,
      fromListId: match.fromList.listId,
      toList: match.toList,
      toListId: match.toList.listId,
      initiatedByList: match.initiatedByList,
      initiatedByListId: match.initiatedByList.listId,
      badgeIds: match.badgeIds,
      transferTimes: match.transferTimes,
      ownershipTimes: match.ownershipTimes,

      //TODO: Is this right?
      approvalId: match.arbitraryValue.approvalId,
      amountTrackerId: match.arbitraryValue.amountTrackerId,
      challengeTrackerId: match.arbitraryValue.challengeTrackerId,

      approvalCriteria: match.arbitraryValue.approvalCriteria,
    })
  }

  return newApprovals.filter((approval) => approval.approvalId == "__disapproved__");
}


/**
 * @category Approvals / Transferability
 */
export function getUnhandledUserOutgoingApprovals(
  approvals: UserOutgoingApprovalWithDetails<bigint>[],
  userAddress: string,
  ignoreTrackerIds: boolean,
  doNotMerge?: boolean
) {
  const castedApprovals = castOutgoingTransfersToCollectionTransfers(approvals, userAddress);
  const unhandled = getUnhandledCollectionApprovals(castedApprovals, ignoreTrackerIds, doNotMerge);
  const newUnhandled = [];
  for (const unhandledApproval of unhandled) {
    if (isInAddressList(unhandledApproval.fromList, userAddress)) {
      unhandledApproval.fromListId = userAddress;
      unhandledApproval.fromList = getReservedAddressList(userAddress) as AddressList;
      newUnhandled.push(unhandledApproval);
    }
  }

  return newUnhandled;
}

/**
 * @category Approvals / Transferability
 */
export function getUnhandledUserIncomingApprovals(
  approvals: UserIncomingApprovalWithDetails<bigint>[],
  userAddress: string,
  ignoreTrackerIds: boolean,
  doNotMerge?: boolean
) {
  const castedApprovals = castIncomingTransfersToCollectionTransfers(approvals, userAddress);
  const unhandled = getUnhandledCollectionApprovals(castedApprovals, ignoreTrackerIds, doNotMerge);
  const newUnhandled = [];
  for (const unhandledApproval of unhandled) {
    if (isInAddressList(unhandledApproval.toList, userAddress)) {
      unhandledApproval.toListId = userAddress;
      unhandledApproval.toList = getReservedAddressList(userAddress) as AddressList;
      newUnhandled.push(unhandledApproval);
    }
  }

  return newUnhandled;
}

/**
 * Returns the approvals without the "Mint" address in any fromList.
 * For ones with "Mint" and addresses ABC, for example, it will return just ABC.
 *
 * @category Approvals / Transferability
 */
export const getNonMintApprovals = (collectionApprovals: CollectionApprovalWithDetails<bigint>[]) => {
  const existingNonMint = collectionApprovals.map(x => {
    if (isInAddressList(x.fromList, "Mint")) {
      if (x.fromListId === 'AllWithMint') {
        return {
          ...x,
          fromList: getReservedAddressList('!Mint'),
          fromListId: '!Mint'
        }
      }


      const [remaining] = removeAddressListFromAddressList(getReservedAddressList('Mint'), x.fromList);

      if (isAddressListEmpty(remaining)) {
        return undefined;
      }

      return {
        ...x,
        fromList: remaining,
        fromListId: generateReservedListId(remaining)
      }
    } else {
      return x;
    }
  }).filter(x => x !== undefined) as CollectionApprovalWithDetails<bigint>[];

  return existingNonMint;
}

/**
 *
 * Returns the approvals with the "Mint" address in any fromList.
 * For ones with "Mint" and addresses ABC, for example, it will return just Mint.
 *
 * @category Approvals / Transferability
 */
export const getMintApprovals = (collectionApprovals: CollectionApprovalWithDetails<bigint>[]) => {
  const newApprovals = collectionApprovals.map(x => {
    if (isInAddressList(x.fromList, "Mint")) {
      return {
        ...x,
        fromList: getReservedAddressList('Mint'),
        fromListId: 'Mint',
      }
    } else {
      return undefined;
    }
  }).filter(x => x !== undefined) as CollectionApprovalWithDetails<bigint>[];

  return newApprovals;
}
