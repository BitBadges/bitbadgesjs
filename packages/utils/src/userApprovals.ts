import { AddressMapping } from "bitbadgesjs-proto";
import { getReservedAddressMapping } from "./addressMappings";
import { GetMappingIdWithOptions, GetMappingWithOptions, GetUintRangesWithOptions } from "./overlaps";
import { CollectionApprovalWithDetails } from "./types/collections";
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails } from "./types/users";


/**
 * Expands the collection approvals to include the correct mappings and ranges.
 *
 *  @category Approvals / Transferability
 */
export function expandCollectionApprovals(approvals: CollectionApprovalWithDetails<bigint>[]): CollectionApprovalWithDetails<bigint>[] {
  const newCurrApprovals: CollectionApprovalWithDetails<bigint>[] = [];
  for (const approval of approvals) {
    const badgeIds = GetUintRangesWithOptions(approval.badgeIds, true);
    const ownershipTimes = GetUintRangesWithOptions(approval.ownershipTimes, true);
    const times = GetUintRangesWithOptions(approval.transferTimes, true);
    const toMappingId = GetMappingIdWithOptions(approval.toMappingId, true);
    const fromMappingId = GetMappingIdWithOptions(approval.fromMappingId, true);
    const initiatedByMappingId = GetMappingIdWithOptions(approval.initiatedByMappingId, true);

    const toMapping = GetMappingWithOptions(approval.toMapping, true);
    const fromMapping = GetMappingWithOptions(approval.fromMapping, true);
    const initiatedByMapping = GetMappingWithOptions(approval.initiatedByMapping, true);

    newCurrApprovals.push({
      ...approval,
      toMappingId: toMappingId,
      fromMappingId: fromMappingId,
      initiatedByMappingId: initiatedByMappingId,
      transferTimes: times,
      badgeIds: badgeIds,
      ownershipTimes: ownershipTimes,
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
 *
 *
 * Appends the default approval (self-initiated) to the front of the list.
 * This will have "default-incoming" for IDs.
 *
 *  @category Approvals / Transferability
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
    amountTrackerId: "default-incoming",
    challengeTrackerId: "default-incoming"
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
    amountTrackerId: "default-outgoing",
    challengeTrackerId: "default-outgoing"
  }

  //append to front
  currApprovals = [defaultToAdd].concat(currApprovals);


  return currApprovals;
}
