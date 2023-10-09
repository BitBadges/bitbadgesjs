import { AddressMapping } from "bitbadgesjs-proto";
import { getReservedAddressMapping } from "./addressMappings";
import { GetMappingIdWithOptions, GetMappingWithOptions, GetUintRangesWithOptions } from "./overlaps";
import { CollectionApprovalWithDetails } from "./types/collections";
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails } from "./types/users";


/**
 * @category Approvals / Transferability
 */
export function expandCollectionApprovals(approvals: CollectionApprovalWithDetails<bigint>[]): CollectionApprovalWithDetails<bigint>[] {
  const newCurrApprovals: CollectionApprovalWithDetails<bigint>[] = [];
  for (const approval of approvals) {
    const badgeIds = GetUintRangesWithOptions(approval.badgeIds, approval.badgeIdsOptions, true);
    const ownershipTimes = GetUintRangesWithOptions(approval.ownershipTimes, approval.ownershipTimesOptions, true);
    const times = GetUintRangesWithOptions(approval.transferTimes, approval.transferTimesOptions, true);
    const toMappingId = GetMappingIdWithOptions(approval.toMappingId, approval.toMappingOptions, true);
    const fromMappingId = GetMappingIdWithOptions(approval.fromMappingId, approval.fromMappingOptions, true);
    const initiatedByMappingId = GetMappingIdWithOptions(approval.initiatedByMappingId, approval.initiatedByMappingOptions, true);

    const toMapping = GetMappingWithOptions(approval.toMapping, approval.toMappingOptions, true);
    const fromMapping = GetMappingWithOptions(approval.fromMapping, approval.fromMappingOptions, true);
    const initiatedByMapping = GetMappingWithOptions(approval.initiatedByMapping, approval.initiatedByMappingOptions, true);

    newCurrApprovals.push({
      ...approval,
      toMappingId: toMappingId,
      fromMappingId: fromMappingId,
      initiatedByMappingId: initiatedByMappingId,
      transferTimes: times,
      badgeIds: badgeIds,
      ownershipTimes: ownershipTimes,
      isApproved: approval.isApproved,
      toMapping: toMapping,
      fromMapping: fromMapping,
      initiatedByMapping: initiatedByMapping,
      approvalCriteria: approval.approvalCriteria,
      approvalId: approval.approvalId,
      amountTrackerId: approval.amountTrackerId,
      challengeTrackerId: approval.challengeTrackerId,
    });

  }

  return newCurrApprovals;
}


/**
 * @category Approvals / Transferability
 */
export function appendDefaultForIncoming(currApprovals: UserIncomingApprovalWithDetails<bigint>[], userAddress: string): UserIncomingApprovalWithDetails<bigint>[] {
  if (userAddress === "Mint" || userAddress === "Total") {
    return currApprovals;
  }

  const defaultToAdd = {
    fromMappingId: "AllWithMint", //everyone
    fromMapping: getReservedAddressMapping("AllWithMint") as AddressMapping,
    initiatedByMapping: getReservedAddressMapping(userAddress) as AddressMapping,
    initiatedByMappingId: userAddress,
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
    approvalId: "default-incoming",
    amountTrackerId: "",
    challengeTrackerId: "",
    isApproved: true,
  }

  //append to front
  currApprovals = [defaultToAdd].concat(currApprovals);

  return currApprovals;
}

/**
 * By default, we approve all transfers if from === initiatedBy
 *
 * @category Approvals / Transferability
 */
export function appendDefaultForOutgoing(currApprovals: UserOutgoingApprovalWithDetails<bigint>[], userAddress: string): UserOutgoingApprovalWithDetails<bigint>[] {
  if (userAddress === "Mint" || userAddress === "Total") {
    return currApprovals;
  }

  const defaultToAdd = {
    toMappingId: "AllWithMint", //everyone
    initiatedByMappingId: userAddress,
    toMapping: getReservedAddressMapping("AllWithMint") as AddressMapping,
    initiatedByMapping: getReservedAddressMapping(userAddress) as AddressMapping,
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
    approvalId: "default-outgoing",
    amountTrackerId: "",
    challengeTrackerId: "",
    isApproved: true,
  }

  //append to front
  currApprovals = [defaultToAdd].concat(currApprovals);


  return currApprovals;
}
