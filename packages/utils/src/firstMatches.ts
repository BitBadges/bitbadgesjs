/*
  We have some non-permission fields that we only take first matches for such as:
    - canUpdateBadgeMetadata //TODO:
    - canUpdateInheritedBalances //TODO:
    - canUpdateCollectionApprovedTransfers
    - user ones as well //TODO:

  This file has helper functions for those three fields.
*/

import { GetFirstMatchOnly, MergeUniversalPermissionDetails } from "./overlaps";
import { castCollectionApprovedTransferToUniversalPermission } from "./permissions";
import { CollectionApprovedTransferWithDetails } from "./types/collections";

export function getFirstMatchForCollectionApprovedTransfers(
  collectionApprovedTransfers: CollectionApprovedTransferWithDetails<bigint>[],
  handleAllPossibleCombinations?: boolean
) {
  const currTransferability: CollectionApprovedTransferWithDetails<bigint>[] = [
    ...collectionApprovedTransfers,
  ]

  if (handleAllPossibleCombinations) {
    currTransferability.push({
      fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
      toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
      initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
      fromMappingId: 'AllWithMint',
      toMappingId: 'AllWithMint',
      initiatedByMappingId: 'AllWithMint',
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      badgeIds: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
      approvalDetails: [],
      allowedCombinations: [{
        isApproved: false,
        fromMappingOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false,
        },
        toMappingOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false,
        },
        initiatedByMappingOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false,
        },
        transferTimesOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false,
        },
        badgeIdsOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false,
        },
        ownershipTimesOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false,
        },
      }],
    });
  }

  const expandedTransferability: CollectionApprovedTransferWithDetails<bigint>[] = [];
  for (const transferability of currTransferability) {
    for (const combination of transferability.allowedCombinations) {
      expandedTransferability.push({
        ...transferability,
        allowedCombinations: [combination],
      });
    }
  }

  const firstMatches = GetFirstMatchOnly(castCollectionApprovedTransferToUniversalPermission(expandedTransferability));
  const merged = MergeUniversalPermissionDetails(firstMatches);

  const newApprovedTransfers: CollectionApprovedTransferWithDetails<bigint>[] = [];
  for (const match of merged) {
    newApprovedTransfers.push({
      fromMapping: match.fromMapping,
      fromMappingId: match.fromMapping.mappingId,
      toMapping: match.toMapping,
      toMappingId: match.toMapping.mappingId,
      initiatedByMapping: match.initiatedByMapping,
      initiatedByMappingId: match.initiatedByMapping.mappingId,
      badgeIds: match.badgeIds,
      transferTimes: match.transferTimes,
      ownershipTimes: match.ownershipTimes,
      //TODO: if broken down via first match only, the same approval details may be duplicated across multiple matches (so predeterminedBalances, approvalAmounts, etc. may be weird)
      approvalDetails: match.arbitraryValue.approvalDetails,
      allowedCombinations: match.arbitraryValue.allowedCombinations,
    })
  }

  return newApprovedTransfers;
}
