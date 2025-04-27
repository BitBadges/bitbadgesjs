import type { NumberType } from '../common/string-numbers.js';
import { AddressList } from './addressLists.js';
import { CollectionApprovalWithDetails, UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails } from './approvals.js';
import { GetFirstMatchOnly, MergeUniversalPermissionDetails } from './overlaps.js';
import { UintRange } from './uintRanges.js';

const { generateReservedListId, getReservedAddressList } = AddressList;

/**
 * Appends the default approval (all incoming transfers are approved) to the front of the list.
 * This will have "all-incoming-transfers" for IDs.
 *
 * @category Approvals / Transferability
 */
export function appendAllIncomingTransfersApproval(
  currApprovals: UserIncomingApprovalWithDetails<bigint>[]
): UserIncomingApprovalWithDetails<bigint>[] {
  const defaultToAdd = new UserIncomingApprovalWithDetails({
    fromListId: 'All', //everyone
    fromList: AddressList.AllAddresses(),
    initiatedByList: AddressList.AllAddresses(),
    initiatedByListId: 'All',
    transferTimes: [UintRange.FullRange()],
    ownershipTimes: [UintRange.FullRange()],
    badgeIds: [UintRange.FullRange()],
    approvalId: 'all-incoming-transfers',
    version: 0n
  });

  //append to front
  currApprovals = [defaultToAdd].concat(currApprovals);

  return currApprovals;
}

/**
 * Appends the default approval (self-initiated is approved) to the front of the list.
 * This will have "self-initiated-incoming" for IDs.
 *
 * @category Approvals / Transferability
 */
export function appendSelfInitiatedIncomingApproval(
  currApprovals: UserIncomingApprovalWithDetails<bigint>[],
  userAddress: string
): UserIncomingApprovalWithDetails<bigint>[] {
  if (userAddress === 'Mint' || userAddress === 'Total') {
    return currApprovals;
  }

  const defaultToAdd = new UserIncomingApprovalWithDetails({
    fromListId: 'All', //everyone
    fromList: AddressList.AllAddresses(),
    initiatedByList: getReservedAddressList(userAddress) as AddressList,
    initiatedByListId: userAddress,
    transferTimes: [UintRange.FullRange()],
    ownershipTimes: [UintRange.FullRange()],
    badgeIds: [UintRange.FullRange()],
    approvalId: 'self-initiated-incoming',
    version: 0n
  });

  //append to front
  currApprovals = [defaultToAdd].concat(currApprovals);

  return currApprovals;
}

/**
 * Appends the default approval (self-initiated is approved) to the front of the list.
 * This will have "self-initiated-outgoing" for IDs.
 *
 * @category Approvals / Transferability
 */
export function appendSelfInitiatedOutgoingApproval(
  currApprovals: UserOutgoingApprovalWithDetails<bigint>[],
  userAddress: string
): UserOutgoingApprovalWithDetails<bigint>[] {
  if (userAddress === 'Mint' || userAddress === 'Total') {
    return currApprovals;
  }

  const defaultToAdd = new UserOutgoingApprovalWithDetails({
    toListId: 'All', //everyone
    initiatedByListId: userAddress,
    toList: AddressList.AllAddresses(),
    initiatedByList: getReservedAddressList(userAddress) as AddressList,
    transferTimes: [UintRange.FullRange()],
    ownershipTimes: [UintRange.FullRange()],
    badgeIds: [UintRange.FullRange()],
    approvalId: 'self-initiated-outgoing',
    version: 0n
  });

  //append to front
  currApprovals = [defaultToAdd].concat(currApprovals);

  return currApprovals;
}

/**
 * Returns all the approvals that are not handled by the inputted collectionApprovals.
 * All returned approvals will have the ID "__disapproved__".
 *
 * @param ignoreTrackerIds If true, any combination of (from, to, initiatedBy, badgeIds, transferTimes, ownershipTimes) will be considered handled if
 * it has a single match (regardless of the IDs). For example, if we have a transfer ('Bob', 'Alice', 'Bob', 1, 1, 1) with IDs ('A', 'B', 'C'),
 * we won't return that ('Bob', 'Alice', 'Bob', 1, 1, 1) with IDs ('D', 'E', 'F') is unhandled.
 * @param doNotMerge If true, we will not attempt to merge the returned approvals.
 *
 * @category Approvals / Transferability
 */
export function getUnhandledCollectionApprovals(
  collectionApprovals: CollectionApprovalWithDetails<bigint>[],
  ignoreTrackerIds = true,
  doNotMerge = false
) {
  const currTransferability: CollectionApprovalWithDetails<bigint>[] = collectionApprovals.map((x) => x.clone());

  //Startegy here is to create a unique approval, get first matches, and then whatever makes it through the first matches (w/ approvalId "__disapproved__") is unhandled
  currTransferability.push(
    new CollectionApprovalWithDetails<bigint>({
      fromList: AddressList.getReservedAddressList('All'),
      toList: AddressList.getReservedAddressList('All'),
      initiatedByList: AddressList.getReservedAddressList('All'),
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: '__disapproved__',
      transferTimes: [UintRange.FullRange()],
      badgeIds: [UintRange.FullRange()],
      ownershipTimes: [UintRange.FullRange()],
      version: 0n
    })
  );

  const expandedTransferability: CollectionApprovalWithDetails<bigint>[] = currTransferability;
  const firstMatches = GetFirstMatchOnly(
    expandedTransferability
      .map((x) => x.castToUniversalPermission())
      .map((x) => {
        if (ignoreTrackerIds) {
          return {
            ...x,
            usesApprovalIdList: false,
            usesAmountTrackerIdList: false,
            usesChallengeTrackerIdList: false
          };
        } else {
          return x;
        }
      })
  );

  const merged = MergeUniversalPermissionDetails(firstMatches, doNotMerge);

  const newApprovals: CollectionApprovalWithDetails<bigint>[] = [];
  for (const match of merged) {
    newApprovals.push(
      new CollectionApprovalWithDetails({
        fromList: match.fromList,
        fromListId: match.fromList.listId,
        toList: match.toList,
        toListId: match.toList.listId,
        initiatedByList: match.initiatedByList,
        initiatedByListId: match.initiatedByList.listId,
        badgeIds: match.badgeIds,
        transferTimes: match.transferTimes,
        ownershipTimes: match.ownershipTimes,
        version: 0n,

        approvalId: match.arbitraryValue.approvalId,
        approvalCriteria: match.arbitraryValue.approvalCriteriaWithDetails
      })
    );
  }

  return newApprovals.filter((approval) => approval.approvalId == '__disapproved__');
}

/**
 * Wrapper for {@link getUnhandledCollectionApprovals} that returns the unhandled approvals for a user.
 *
 * @category Approvals / Transferability
 */
export function getUnhandledUserOutgoingApprovals(
  approvals: UserOutgoingApprovalWithDetails<bigint>[],
  userAddress: string,
  ignoreTrackerIds: boolean,
  doNotMerge?: boolean
) {
  const castedApprovals = approvals.map((x) => x.castToCollectionTransfer(userAddress));
  const unhandled = getUnhandledCollectionApprovals(castedApprovals, ignoreTrackerIds, doNotMerge);
  const newUnhandled = [];
  for (const unhandledApproval of unhandled) {
    if (unhandledApproval.fromList.checkAddress(userAddress)) {
      unhandledApproval.fromListId = userAddress;
      unhandledApproval.fromList = getReservedAddressList(userAddress) as AddressList;
      newUnhandled.push(unhandledApproval);
    }
  }

  return newUnhandled;
}

/**
 * Wrapper for {@link getUnhandledCollectionApprovals} that returns the unhandled approvals for a user.
 *
 * @category Approvals / Transferability
 */
export function getUnhandledUserIncomingApprovals(
  approvals: UserIncomingApprovalWithDetails<bigint>[],
  userAddress: string,
  ignoreTrackerIds: boolean,
  doNotMerge?: boolean
) {
  const castedApprovals = approvals.map((x) => x.castToCollectionTransfer(userAddress));
  const unhandled = getUnhandledCollectionApprovals(castedApprovals, ignoreTrackerIds, doNotMerge);
  const newUnhandled = [];
  for (const unhandledApproval of unhandled) {
    if (unhandledApproval.toList.checkAddress(userAddress)) {
      unhandledApproval.toListId = userAddress;
      unhandledApproval.toList = getReservedAddressList(userAddress) as AddressList;
      newUnhandled.push(unhandledApproval);
    }
  }

  return newUnhandled;
}

/**
 * Returns the approvals without the "Mint" address in any fromList.
 * For ones with "Mint" and other addresses ABC, for example, it will return just ABC.
 *
 * @category Approvals / Transferability
 */
export const getNonMintApprovals = <T extends NumberType>(collectionApprovals: CollectionApprovalWithDetails<T>[]) => {
  const existingNonMint = collectionApprovals
    .map((x) => {
      if (x.fromList.checkAddress('Mint')) {
        if (x.fromListId === 'All') {
          return {
            ...x,
            fromList: getReservedAddressList('!Mint'),
            fromListId: '!Mint'
          };
        }

        const remaining = x.fromList.clone().remove(AddressList.Reserved('Mint'));
        if (remaining.isEmpty()) {
          return undefined;
        }

        return {
          ...x,
          fromList: remaining,
          fromListId: generateReservedListId(remaining)
        };
      } else {
        return x;
      }
    })
    .filter((x) => x !== undefined) as CollectionApprovalWithDetails<T>[];

  return existingNonMint;
};

/**
 * Returns the approvals with the "Mint" address in any fromList.
 * For ones with "Mint" and addresses ABC, for example, it will return just Mint.
 *
 * @category Approvals / Transferability
 */
export const getMintApprovals = <T extends NumberType>(collectionApprovals: CollectionApprovalWithDetails<T>[]) => {
  const newApprovals = collectionApprovals
    .map((x) => {
      if (x.fromList.checkAddress('Mint')) {
        return {
          ...x,
          fromList: getReservedAddressList('Mint'),
          fromListId: 'Mint'
        };
      } else {
        return undefined;
      }
    })
    .filter((x) => x !== undefined) as CollectionApprovalWithDetails<T>[];

  return newApprovals;
};
