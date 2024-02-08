import { AddressList } from "bitbadgesjs-proto";
import { getReservedAddressList } from "./addressLists";
import { GetListIdWithOptions, GetListWithOptions, GetUintRangesWithOptions } from "./overlaps";
import { CollectionApprovalWithDetails } from "./types/collections";
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails } from "./types/users";


/**
 * Expands the collection approvals to include the correct lists and ranges.
 *
 *  @category Approvals / Transferability
 */
export function expandCollectionApprovals(approvals: CollectionApprovalWithDetails<bigint>[]): CollectionApprovalWithDetails<bigint>[] {
  const newCurrApprovals: CollectionApprovalWithDetails<bigint>[] = [];
  for (const approval of approvals) {
    const badgeIds = GetUintRangesWithOptions(approval.badgeIds, true);
    const ownershipTimes = GetUintRangesWithOptions(approval.ownershipTimes, true);
    const times = GetUintRangesWithOptions(approval.transferTimes, true);
    const toListId = GetListIdWithOptions(approval.toListId, true);
    const fromListId = GetListIdWithOptions(approval.fromListId, true);
    const initiatedByListId = GetListIdWithOptions(approval.initiatedByListId, true);

    const toList = GetListWithOptions(approval.toList, true);
    const fromList = GetListWithOptions(approval.fromList, true);
    const initiatedByList = GetListWithOptions(approval.initiatedByList, true);

    newCurrApprovals.push({
      ...approval,
      toListId: toListId,
      fromListId: fromListId,
      initiatedByListId: initiatedByListId,
      transferTimes: times,
      badgeIds: badgeIds,
      ownershipTimes: ownershipTimes,
      toList: toList,
      fromList: fromList,
      initiatedByList: initiatedByList,
      approvalCriteria: approval.approvalCriteria,
      approvalId: approval.approvalId,
      amountTrackerId: approval.amountTrackerId,
      challengeTrackerId: approval.challengeTrackerId,
    });

  }

  return newCurrApprovals;
}


/**
 *
 *
 * Appends the default approval (self-initiated) to the front of the list.
 * This will have "default-incoming" for IDs.
 *
 *  @category Approvals / Transferability
 */
export function appendSelfInitiatedIncomingApproval(currApprovals: UserIncomingApprovalWithDetails<bigint>[], userAddress: string): UserIncomingApprovalWithDetails<bigint>[] {
  if (userAddress === "Mint" || userAddress === "Total") {
    return currApprovals;
  }

  const defaultToAdd = {
    fromListId: "AllWithMint", //everyone
    fromList: getReservedAddressList("AllWithMint") as AddressList,
    initiatedByList: getReservedAddressList(userAddress) as AddressList,
    initiatedByListId: userAddress,
    transferTimes: [{
      start: 1n,
      end: 18446744073709551615n,
    }],
    ownershipTimes: [{
      start: 1n,
      end: 18446744073709551615n,
    }],
    badgeIds: [{
      start: 1n,
      end: 18446744073709551615n,
    }],
    approvalId: "self-initiated-incoming",
    amountTrackerId: "self-initiated-incoming",
    challengeTrackerId: "self-initiated-incoming"
  }

  //append to front
  currApprovals = [defaultToAdd].concat(currApprovals);

  return currApprovals;
}

/**
 *
 * Appends the default approval (self-initiated) to the front of the list.
 * This will have "default-outgoing" for IDs.
 *  @category Approvals / Transferability
 */
export function appendSelfInitiatedOutgoingApproval(currApprovals: UserOutgoingApprovalWithDetails<bigint>[], userAddress: string): UserOutgoingApprovalWithDetails<bigint>[] {
  if (userAddress === "Mint" || userAddress === "Total") {
    return currApprovals;
  }

  const defaultToAdd = {
    toListId: "AllWithMint", //everyone
    initiatedByListId: userAddress,
    toList: getReservedAddressList("AllWithMint") as AddressList,
    initiatedByList: getReservedAddressList(userAddress) as AddressList,
    transferTimes: [{
      start: 1n,
      end: 18446744073709551615n,
    }],
    ownershipTimes: [{
      start: 1n,
      end: 18446744073709551615n,
    }],
    badgeIds: [{
      start: 1n,
      end: 18446744073709551615n,
    }],
    approvalId: "self-initiated-outgoing",
    amountTrackerId: "self-initiated-outgoing",
    challengeTrackerId: "self-initiated-outgoing"
  }

  //append to front
  currApprovals = [defaultToAdd].concat(currApprovals);


  return currApprovals;
}
