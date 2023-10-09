/*
  We have some non-permission fields that we only take first matches for such as:
    - canUpdateBadgeMetadata //TODO:
    - canUpdateInheritedBalances //TODO:
    - collection approved transfers
    - user approved transfers

  This file has helper functions for those three fields.
*/

import { BadgeMetadata } from "bitbadgesjs-proto";
import { GetFirstMatchOnly, MergeUniversalPermissionDetails } from "./overlaps";
import { castCollectionApprovalToUniversalPermission, castUserIncomingApprovalsToUniversalPermission, castUserOutgoingApprovalsToUniversalPermission } from "./permissions";
import { CollectionApprovalWithDetails } from "./types/collections";
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails } from "./types/users";
import { removeUintRangeFromUintRange } from "./uintRanges";

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
      const [remaining,] = removeUintRangeFromUintRange(metadata.badgeIds, otherMetadata.badgeIds);
      otherMetadata.badgeIds = remaining;
    }
  }

  return badgeMetadata
}


/**
 * @category Approvals / Transferability
 */
export function getFirstMatchForCollectionApprovals(
  collectionApprovals: CollectionApprovalWithDetails<bigint>[],
  handleAllPossibleCombinations?: boolean,
  doNotMerge?: boolean
) {
  const currTransferability: CollectionApprovalWithDetails<bigint>[] = [
    ...collectionApprovals,
  ]

  if (handleAllPossibleCombinations) {
    currTransferability.push({
      fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      fromMappingId: 'AllWithMint',
      toMappingId: 'AllWithMint',
      initiatedByMappingId: 'AllWithMint',
      approvalId: "",
      amountTrackerId: "",
      challengeTrackerId: "",
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      badgeIds: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
      isApproved: false,
    });
  }

  const expandedTransferability: CollectionApprovalWithDetails<bigint>[] = currTransferability;

  const firstMatches = GetFirstMatchOnly(castCollectionApprovalToUniversalPermission(expandedTransferability));
  const merged = MergeUniversalPermissionDetails(firstMatches, doNotMerge);

  const newApprovals: CollectionApprovalWithDetails<bigint>[] = [];
  for (const match of merged) {
    newApprovals.push({
      fromMapping: match.fromMapping,
      fromMappingId: match.fromMapping.mappingId,
      toMapping: match.toMapping,
      toMappingId: match.toMapping.mappingId,
      initiatedByMapping: match.initiatedByMapping,
      initiatedByMappingId: match.initiatedByMapping.mappingId,
      badgeIds: match.badgeIds,
      transferTimes: match.transferTimes,
      ownershipTimes: match.ownershipTimes,

      approvalId: match.arbitraryValue.approvalId,
      amountTrackerId: match.arbitraryValue.amountTrackerId,
      challengeTrackerId: match.arbitraryValue.challengeTrackerId,

      //TODO: if broken down via first match only, the same approval details may be duplicated across multiple matches (so predeterminedBalances, approvalAmounts, etc. may be weird)
      approvalCriteria: match.arbitraryValue.approvalCriteria,
      isApproved: match.arbitraryValue.isApproved,
    })
  }

  return newApprovals;
}

/**
 * @category Approvals / Transferability
 */
export function getFirstMatchForUserOutgoingApprovals(
  approvals: UserOutgoingApprovalWithDetails<bigint>[],
  userAddress: string,
  handleAllPossibleCombinations?: boolean
) {
  const currTransferability: UserOutgoingApprovalWithDetails<bigint>[] = [
    ...approvals,
  ]

  if (handleAllPossibleCombinations) {
    currTransferability.push({
      // fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      // fromMappingId: 'AllWithMint',
      toMappingId: 'AllWithMint',
      initiatedByMappingId: 'AllWithMint',
      approvalId: "",
      amountTrackerId: "",
      challengeTrackerId: "",
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      badgeIds: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
      isApproved: false,
    });
  }

  const expandedTransferability: UserOutgoingApprovalWithDetails<bigint>[] = currTransferability;

  const firstMatches = GetFirstMatchOnly(castUserOutgoingApprovalsToUniversalPermission(expandedTransferability, userAddress));
  const merged = MergeUniversalPermissionDetails(firstMatches);

  const newApprovals: UserOutgoingApprovalWithDetails<bigint>[] = [];
  for (const match of merged) {
    newApprovals.push({
      // fromMapping: match.fromMapping,
      // fromMappingId: match.fromMapping.mappingId,
      toMapping: match.toMapping,
      toMappingId: match.toMapping.mappingId,
      initiatedByMapping: match.initiatedByMapping,
      initiatedByMappingId: match.initiatedByMapping.mappingId,
      badgeIds: match.badgeIds,
      transferTimes: match.transferTimes,
      ownershipTimes: match.ownershipTimes,

      approvalId: match.arbitraryValue.approvalId,
      amountTrackerId: match.arbitraryValue.amountTrackerId,
      challengeTrackerId: match.arbitraryValue.challengeTrackerId,

      //TODO: if broken down via first match only, the same approval details may be duplicated across multiple matches (so predeterminedBalances, approvalAmounts, etc. may be weird)
      approvalCriteria: match.arbitraryValue.approvalCriteria,
      isApproved: match.arbitraryValue.isApproved,
    })
  }

  return newApprovals;
}

/**
 * @category Approvals / Transferability
 */
export function getFirstMatchForUserIncomingApprovals(
  approvals: UserIncomingApprovalWithDetails<bigint>[],
  userAddress: string,
  handleAllPossibleCombinations?: boolean
) {
  const currTransferability: UserIncomingApprovalWithDetails<bigint>[] = [
    ...approvals,
  ]

  if (handleAllPossibleCombinations) {
    currTransferability.push({
      fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      // toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      fromMappingId: 'AllWithMint',
      // toMappingId: 'AllWithMint',
      initiatedByMappingId: 'AllWithMint',
      approvalId: "",
      amountTrackerId: "",
      challengeTrackerId: "",
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      badgeIds: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
      isApproved: false,
    });
  }

  const expandedTransferability: UserIncomingApprovalWithDetails<bigint>[] = currTransferability;

  const firstMatches = GetFirstMatchOnly(castUserIncomingApprovalsToUniversalPermission(expandedTransferability, userAddress));
  const merged = MergeUniversalPermissionDetails(firstMatches);

  const newApprovals: UserIncomingApprovalWithDetails<bigint>[] = [];
  for (const match of merged) {
    newApprovals.push({
      fromMapping: match.fromMapping,
      fromMappingId: match.fromMapping.mappingId,
      // toMapping: match.toMapping,
      // toMappingId: match.toMapping.mappingId,
      initiatedByMapping: match.initiatedByMapping,
      initiatedByMappingId: match.initiatedByMapping.mappingId,
      badgeIds: match.badgeIds,
      transferTimes: match.transferTimes,
      ownershipTimes: match.ownershipTimes,

      approvalId: match.arbitraryValue.approvalId,
      amountTrackerId: match.arbitraryValue.amountTrackerId,
      challengeTrackerId: match.arbitraryValue.challengeTrackerId,

      //TODO: if broken down via first match only, the same approval details may be duplicated across multiple matches (so predeterminedBalances, approvalAmounts, etc. may be weird)
      approvalCriteria: match.arbitraryValue.approvalCriteria,
      isApproved: match.arbitraryValue.isApproved,
    })
  }

  return newApprovals;
}
