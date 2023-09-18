import * as balances from '../../../../proto/badges/balances';
import * as metadata from '../../../../proto/badges/metadata';
import * as permissions from '../../../../proto/badges/permissions';
import * as timelines from '../../../../proto/badges/timelines';
import * as transfers from '../../../../proto/badges/transfers';
import { NumberType } from '../string-numbers';
import { CollectionApprovedTransfer, UserApprovedIncomingTransfer, UserApprovedOutgoingTransfer } from "./approvedTransfers";
import { BalancesActionPermission, CollectionApprovedTransferPermission, CollectionPermissions, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UserPermissions } from "./permissions";
import { BadgeMetadata, BadgeMetadataTimeline, Balance, CollectionMetadataTimeline, ContractAddressTimeline, CustomDataTimeline, InheritedBalancesTimeline, IsArchivedTimeline, ManagerTimeline, MerkleProof, OffChainBalancesMetadataTimeline, StandardsTimeline, Transfer, UintRange } from "./typeUtils";


export function getWrappedBadgeIds<T extends NumberType>(badgeIds: UintRange<T>[]) {
  const wrappedBadgeIds: balances.bitbadges.bitbadgeschain.badges.UintRange[] = []
  for (const range of badgeIds) {
    wrappedBadgeIds.push(
      new balances.bitbadges.bitbadgeschain.badges.UintRange({
        start: range.start.toString(),
        end: range.end.toString(),
      }),
    )
  }

  return wrappedBadgeIds
}

export function getWrappedBadgeMetadata<T extends NumberType>(badgeUris: BadgeMetadata<T>[]) {
  const wrappedBadgeMetadatas: metadata.bitbadges.bitbadgeschain.badges.BadgeMetadata[] = [];
  for (const badgeUri of badgeUris) {
    wrappedBadgeMetadatas.push(
      new metadata.bitbadges.bitbadgeschain.badges.BadgeMetadata({
        uri: badgeUri.uri,
        customData: badgeUri.customData,
        badgeIds: getWrappedBadgeIds(badgeUri.badgeIds),
      }),
    )
  }

  return wrappedBadgeMetadatas
}


export function getWrappedBalances<T extends NumberType>(balanceArr: Balance<T>[]) {
  const formattedBalances: balances.bitbadges.bitbadgeschain.badges.Balance[] =
    []

  for (const balance of balanceArr) {
    const wrappedBadgeIds = getWrappedBadgeIds(balance.badgeIds)
    const wrappedOwnershipTimes = getWrappedBadgeIds(balance.ownershipTimes)

    formattedBalances.push(
      new balances.bitbadges.bitbadgeschain.badges.Balance({
        badgeIds: wrappedBadgeIds,
        amount: balance.amount.toString(),
        ownershipTimes: wrappedOwnershipTimes,
      }),
    )
  }
  return formattedBalances
}

export function getWrappedProof(proof: MerkleProof) {
  const wrappedAunts: transfers.bitbadges.bitbadgeschain.badges.MerklePathItem[] = []
  for (const aunt of proof.aunts) {
    wrappedAunts.push(
      new transfers.bitbadges.bitbadgeschain.badges.MerklePathItem({
        aunt: aunt.aunt,
        onRight: aunt.onRight,
      }),
    )
  }

  const wrappedProof: transfers.bitbadges.bitbadgeschain.badges.MerkleProof =
    new transfers.bitbadges.bitbadgeschain.badges.MerkleProof({
      aunts: wrappedAunts,
      leaf: proof.leaf,
    })
  return wrappedProof
}

export function getWrappedTransfers<T extends NumberType>(transfersArr: Transfer<T>[]) {
  const wrappedTransfers: transfers.bitbadges.bitbadgeschain.badges.Transfer[] = []
  for (const transfer of transfersArr) {
    const formattedBalances = getWrappedBalances(transfer.balances)

    wrappedTransfers.push(
      new transfers.bitbadges.bitbadgeschain.badges.Transfer({
        ...transfer,
        balances: formattedBalances,
        merkleProofs: transfer.merkleProofs.map(getWrappedProof),
        precalculationDetails: new transfers.bitbadges.bitbadgeschain.badges.PrecalulationDetails({ ...transfer.precalculationDetails }),
      }),
    )
  }
  return wrappedTransfers
}

export function getWrappedTimedUpdatePermission<T extends NumberType>(permissionsArr: TimedUpdatePermission<T>[]) {
  return permissionsArr.map((canArchiveCollection) => {
    return new permissions.bitbadges.bitbadgeschain.badges.TimedUpdatePermission({
      ...canArchiveCollection,
      defaultValues: new permissions.bitbadges.bitbadgeschain.badges.TimedUpdateDefaultValues({
        ...canArchiveCollection.defaultValues,
        timelineTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.timelineTimes),
        permittedTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.permittedTimes),
        forbiddenTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.forbiddenTimes),
      }),
      combinations: canArchiveCollection.combinations.map((combination) => {
        return new permissions.bitbadges.bitbadgeschain.badges.TimedUpdateCombination({
          ...combination,
          timelineTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.timelineTimesOptions }),
          permittedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.permittedTimesOptions }),
          forbiddenTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.forbiddenTimesOptions }),
        })
      }),
    })
  })
}

export function getWrappedTimedUpdateWithBadgeIdsPermission<T extends NumberType>(permissionsArr: TimedUpdateWithBadgeIdsPermission<T>[]) {
  return permissionsArr.map((canArchiveCollection) => {
    return new permissions.bitbadges.bitbadgeschain.badges.TimedUpdateWithBadgeIdsPermission({
      ...canArchiveCollection,
      defaultValues: new permissions.bitbadges.bitbadgeschain.badges.TimedUpdateWithBadgeIdsDefaultValues({
        ...canArchiveCollection.defaultValues,
        timelineTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.timelineTimes),
        badgeIds: getWrappedBadgeIds(canArchiveCollection.defaultValues.badgeIds),
        permittedTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.permittedTimes),
        forbiddenTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.forbiddenTimes),
      }),
      combinations: canArchiveCollection.combinations.map((combination) => {
        return new permissions.bitbadges.bitbadgeschain.badges.TimedUpdateWithBadgeIdsCombination({
          ...combination,
          timelineTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.timelineTimesOptions }),
          badgeIdsOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.badgeIdsOptions }),
          permittedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.permittedTimesOptions }),
          forbiddenTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.forbiddenTimesOptions }),
        })
      }),
    })
  })
}

export function getWrappedBalancesActionPermission<T extends NumberType>(permissionsArr: BalancesActionPermission<T>[]) {
  return permissionsArr.map((canArchiveCollection) => {
    return new permissions.bitbadges.bitbadgeschain.badges.BalancesActionPermission({
      ...canArchiveCollection,
      defaultValues: new permissions.bitbadges.bitbadgeschain.badges.BalancesActionDefaultValues({
        ...canArchiveCollection.defaultValues,
        ownershipTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.ownershipTimes),
        badgeIds: getWrappedBadgeIds(canArchiveCollection.defaultValues.badgeIds),
        permittedTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.permittedTimes),
        forbiddenTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.forbiddenTimes),
      }),
      combinations: canArchiveCollection.combinations.map((combination) => {
        return new permissions.bitbadges.bitbadgeschain.badges.BalancesActionCombination({
          ...combination,
          ownershipTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.ownershipTimesOptions }),
          badgeIdsOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.badgeIdsOptions }),
          permittedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.permittedTimesOptions }),
          forbiddenTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.forbiddenTimesOptions }),
        })
      }),
    })
  })
}

export function getWrappedCollectionApprovedTransferPermission<T extends NumberType>(permissionsArr: CollectionApprovedTransferPermission<T>[]) {
  return permissionsArr.map((canArchiveCollection) => {
    return new permissions.bitbadges.bitbadgeschain.badges.CollectionApprovedTransferPermission({
      ...canArchiveCollection,
      defaultValues: new permissions.bitbadges.bitbadgeschain.badges.CollectionApprovedTransferDefaultValues({
        ...canArchiveCollection.defaultValues,
        transferTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.transferTimes),
        badgeIds: getWrappedBadgeIds(canArchiveCollection.defaultValues.badgeIds),
        ownershipTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.ownershipTimes),
        permittedTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.permittedTimes),
        forbiddenTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.forbiddenTimes),
      }),
      combinations: canArchiveCollection.combinations.map((combination) => {
        return new permissions.bitbadges.bitbadgeschain.badges.CollectionApprovedTransferCombination({
          ...combination,
          toMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.toMappingOptions }),
          fromMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.fromMappingOptions }),
          initiatedByMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.initiatedByMappingOptions }),
          transferTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.transferTimesOptions }),
          badgeIdsOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.badgeIdsOptions }),
          ownershipTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.ownershipTimesOptions }),
          permittedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.permittedTimesOptions }),
          forbiddenTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.forbiddenTimesOptions }),
        })
      }),
    })
  })
}



export function getWrappedCollectionPermissions<T extends NumberType>(collectionPermissions: CollectionPermissions<T>) {
  return new permissions.bitbadges.bitbadgeschain.badges.CollectionPermissions({
    ...collectionPermissions,
    canDeleteCollection: collectionPermissions.canDeleteCollection.map((canDeleteCollection) => {
      return new permissions.bitbadges.bitbadgeschain.badges.ActionPermission({
        ...canDeleteCollection,
        defaultValues: new permissions.bitbadges.bitbadgeschain.badges.ActionDefaultValues({
          ...canDeleteCollection.defaultValues,
          permittedTimes: getWrappedBadgeIds(canDeleteCollection.defaultValues.permittedTimes),
          forbiddenTimes: getWrappedBadgeIds(canDeleteCollection.defaultValues.forbiddenTimes),
        }),
        combinations: canDeleteCollection.combinations.map(combination => {
          return new permissions.bitbadges.bitbadgeschain.badges.ActionCombination({
            ...combination,
            permittedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.permittedTimesOptions }),
            forbiddenTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.forbiddenTimesOptions }),
          })
        }),
      })
    }),
    canArchiveCollection: getWrappedTimedUpdatePermission(collectionPermissions.canArchiveCollection),
    canCreateMoreBadges: getWrappedBalancesActionPermission(collectionPermissions.canCreateMoreBadges),
    canUpdateBadgeMetadata: getWrappedTimedUpdateWithBadgeIdsPermission(collectionPermissions.canUpdateBadgeMetadata),
    canUpdateCollectionApprovedTransfers: getWrappedCollectionApprovedTransferPermission(collectionPermissions.canUpdateCollectionApprovedTransfers),
    canUpdateCollectionMetadata: getWrappedTimedUpdatePermission(collectionPermissions.canUpdateCollectionMetadata),
    canUpdateContractAddress: getWrappedTimedUpdatePermission(collectionPermissions.canUpdateContractAddress),
    canUpdateCustomData: getWrappedTimedUpdatePermission(collectionPermissions.canUpdateCustomData),
    canUpdateManager: getWrappedTimedUpdatePermission(collectionPermissions.canUpdateManager),
    canUpdateOffChainBalancesMetadata: getWrappedTimedUpdatePermission(collectionPermissions.canUpdateOffChainBalancesMetadata),
    canUpdateStandards: getWrappedTimedUpdatePermission(collectionPermissions.canUpdateStandards),
  })
}


export function getWrappedUserPermissions<T extends NumberType>(userPermissions: UserPermissions<T>) {
  return new permissions.bitbadges.bitbadgeschain.badges.UserPermissions({
    ...userPermissions,
    canUpdateApprovedIncomingTransfers: userPermissions.canUpdateApprovedIncomingTransfers.map((canUpdateApprovedIncomingTransfer) => {
      return new permissions.bitbadges.bitbadgeschain.badges.UserApprovedIncomingTransferPermission({
        ...canUpdateApprovedIncomingTransfer,
        defaultValues: new permissions.bitbadges.bitbadgeschain.badges.UserApprovedIncomingTransferDefaultValues({
          ...canUpdateApprovedIncomingTransfer.defaultValues,
          transferTimes: getWrappedBadgeIds(canUpdateApprovedIncomingTransfer.defaultValues.transferTimes),
          badgeIds: getWrappedBadgeIds(canUpdateApprovedIncomingTransfer.defaultValues.badgeIds),
          ownershipTimes: getWrappedBadgeIds(canUpdateApprovedIncomingTransfer.defaultValues.ownershipTimes),
          permittedTimes: getWrappedBadgeIds(canUpdateApprovedIncomingTransfer.defaultValues.permittedTimes),
          forbiddenTimes: getWrappedBadgeIds(canUpdateApprovedIncomingTransfer.defaultValues.forbiddenTimes),
        }),
        combinations: canUpdateApprovedIncomingTransfer.combinations.map((combination) => {
          return new permissions.bitbadges.bitbadgeschain.badges.UserApprovedIncomingTransferCombination({
            ...combination,
            fromMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.fromMappingOptions }),
            initiatedByMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.initiatedByMappingOptions }),
            transferTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.transferTimesOptions }),
            badgeIdsOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.badgeIdsOptions }),
            ownershipTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.ownershipTimesOptions }),
            permittedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.permittedTimesOptions }),
            forbiddenTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.forbiddenTimesOptions }),
          })
        }),
      })
    }),
    canUpdateApprovedOutgoingTransfers: userPermissions.canUpdateApprovedOutgoingTransfers.map((canUpdateApprovedOutgoingTransfer) => {
      return new permissions.bitbadges.bitbadgeschain.badges.UserApprovedOutgoingTransferPermission({
        ...canUpdateApprovedOutgoingTransfer,
        defaultValues: new permissions.bitbadges.bitbadgeschain.badges.UserApprovedOutgoingTransferDefaultValues({
          ...canUpdateApprovedOutgoingTransfer.defaultValues,
          transferTimes: getWrappedBadgeIds(canUpdateApprovedOutgoingTransfer.defaultValues.transferTimes),
          badgeIds: getWrappedBadgeIds(canUpdateApprovedOutgoingTransfer.defaultValues.badgeIds),
          ownershipTimes: getWrappedBadgeIds(canUpdateApprovedOutgoingTransfer.defaultValues.ownershipTimes),
          permittedTimes: getWrappedBadgeIds(canUpdateApprovedOutgoingTransfer.defaultValues.permittedTimes),
          forbiddenTimes: getWrappedBadgeIds(canUpdateApprovedOutgoingTransfer.defaultValues.forbiddenTimes),
        }),
        combinations: canUpdateApprovedOutgoingTransfer.combinations.map((combination) => {
          return new permissions.bitbadges.bitbadgeschain.badges.UserApprovedOutgoingTransferCombination({
            ...combination,
            toMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.toMappingOptions }),
            initiatedByMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.initiatedByMappingOptions }),
            transferTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.transferTimesOptions }),
            badgeIdsOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.badgeIdsOptions }),
            ownershipTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.ownershipTimesOptions }),
            permittedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.permittedTimesOptions }),
            forbiddenTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.forbiddenTimesOptions }),
          })
        }),
      })
    }),
  })
}

export function getWrappedOutgoingTransfers<T extends NumberType>(approvedOutgoingTransfers: UserApprovedOutgoingTransfer<T>[]) {
  return approvedOutgoingTransfers.map((outgoingTransfer) => new transfers.bitbadges.bitbadgeschain.badges.UserApprovedOutgoingTransfer({
    ...outgoingTransfer,
    transferTimes: getWrappedBadgeIds(outgoingTransfer.transferTimes),
    badgeIds: getWrappedBadgeIds(outgoingTransfer.badgeIds),
    ownershipTimes: getWrappedBadgeIds(outgoingTransfer.ownershipTimes),
    allowedCombinations: outgoingTransfer.allowedCombinations.map((allowedCombination) => {
      return new transfers.bitbadges.bitbadgeschain.badges.IsUserOutgoingTransferAllowed({
        ...allowedCombination,
        toMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.toMappingOptions }),
        initiatedByMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.initiatedByMappingOptions }),
        transferTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.transferTimesOptions }),
        badgeIdsOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.badgeIdsOptions }),
        ownershipTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.ownershipTimesOptions }),
      })
    }),
    approvalDetails: outgoingTransfer.approvalDetails.map((approvalDetail) => {
      return new transfers.bitbadges.bitbadgeschain.badges.OutgoingApprovalDetails({
        ...approvalDetail,
        mustOwnBadges: approvalDetail.mustOwnBadges.map((mustOwnBadge) => {
          return new balances.bitbadges.bitbadgeschain.badges.MustOwnBadges({
            ...mustOwnBadge,
            collectionId: mustOwnBadge.collectionId.toString(),
            badgeIds: getWrappedBadgeIds(mustOwnBadge.badgeIds),
            ownershipTimes: getWrappedBadgeIds(mustOwnBadge.ownershipTimes),
            amountRange: getWrappedBadgeIds([mustOwnBadge.amountRange])[0],
          })
        }),
        merkleChallenges: approvalDetail.merkleChallenges.map((merkleChallenge) => {
          return new transfers.bitbadges.bitbadgeschain.badges.MerkleChallenge({
            ...merkleChallenge,
            expectedProofLength: merkleChallenge.expectedProofLength.toString(),
          })
        }),
        predeterminedBalances: new transfers.bitbadges.bitbadgeschain.badges.PredeterminedBalances({
          ...approvalDetail.predeterminedBalances,
          incrementedBalances: new transfers.bitbadges.bitbadgeschain.badges.IncrementedBalances({
            ...approvalDetail.predeterminedBalances.incrementedBalances,
            startBalances: getWrappedBalances(approvalDetail.predeterminedBalances.incrementedBalances.startBalances),
            incrementBadgeIdsBy: approvalDetail.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy.toString(),
            incrementOwnershipTimesBy: approvalDetail.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy.toString(),
          }),
          orderCalculationMethod: new transfers.bitbadges.bitbadgeschain.badges.PredeterminedOrderCalculationMethod({
            ...approvalDetail.predeterminedBalances.orderCalculationMethod,
          }),
          manualBalances: approvalDetail.predeterminedBalances.manualBalances.map((manualBalance) => {
            return new transfers.bitbadges.bitbadgeschain.badges.ManualBalances({
              ...manualBalance,
              balances: getWrappedBalances(manualBalance.balances),
            })
          }),
        }),
        approvalAmounts: new transfers.bitbadges.bitbadgeschain.badges.ApprovalAmounts({
          ...approvalDetail.approvalAmounts,
          overallApprovalAmount: approvalDetail.approvalAmounts.overallApprovalAmount.toString(),
          perToAddressApprovalAmount: approvalDetail.approvalAmounts.perToAddressApprovalAmount.toString(),
          perFromAddressApprovalAmount: approvalDetail.approvalAmounts.perFromAddressApprovalAmount.toString(),
          perInitiatedByAddressApprovalAmount: approvalDetail.approvalAmounts.perInitiatedByAddressApprovalAmount.toString(),
        }),
        maxNumTransfers: new transfers.bitbadges.bitbadgeschain.badges.MaxNumTransfers({
          ...approvalDetail.maxNumTransfers,
          overallMaxNumTransfers: approvalDetail.maxNumTransfers.overallMaxNumTransfers.toString(),
          perToAddressMaxNumTransfers: approvalDetail.maxNumTransfers.perToAddressMaxNumTransfers.toString(),
          perFromAddressMaxNumTransfers: approvalDetail.maxNumTransfers.perFromAddressMaxNumTransfers.toString(),
          perInitiatedByAddressMaxNumTransfers: approvalDetail.maxNumTransfers.perInitiatedByAddressMaxNumTransfers.toString(),
        }),
      })
    }),
  }))
}

export function getWrappedIncomingTransfers<T extends NumberType>(approvedIncomingTransfers: UserApprovedIncomingTransfer<T>[]) {
  return approvedIncomingTransfers.map((outgoingTransfer) => new transfers.bitbadges.bitbadgeschain.badges.UserApprovedIncomingTransfer({
    ...outgoingTransfer,
    transferTimes: getWrappedBadgeIds(outgoingTransfer.transferTimes),
    badgeIds: getWrappedBadgeIds(outgoingTransfer.badgeIds),
    ownershipTimes: getWrappedBadgeIds(outgoingTransfer.ownershipTimes),
    allowedCombinations: outgoingTransfer.allowedCombinations.map((allowedCombination) => {
      return new transfers.bitbadges.bitbadgeschain.badges.IsUserIncomingTransferAllowed({
        ...allowedCombination,
        fromMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.fromMappingOptions }),
        initiatedByMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.initiatedByMappingOptions }),
        transferTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.transferTimesOptions }),
        badgeIdsOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.badgeIdsOptions }),
        ownershipTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.ownershipTimesOptions }),
      })
    }),
    approvalDetails: outgoingTransfer.approvalDetails.map((approvalDetail) => {
      return new transfers.bitbadges.bitbadgeschain.badges.IncomingApprovalDetails({
        ...approvalDetail,
        mustOwnBadges: approvalDetail.mustOwnBadges.map((mustOwnBadge) => {
          return new balances.bitbadges.bitbadgeschain.badges.MustOwnBadges({
            ...mustOwnBadge,
            collectionId: mustOwnBadge.collectionId.toString(),
            badgeIds: getWrappedBadgeIds(mustOwnBadge.badgeIds),
            ownershipTimes: getWrappedBadgeIds(mustOwnBadge.ownershipTimes),
            amountRange: getWrappedBadgeIds([mustOwnBadge.amountRange])[0],
          })
        }),
        merkleChallenges: approvalDetail.merkleChallenges.map((merkleChallenge) => {
          return new transfers.bitbadges.bitbadgeschain.badges.MerkleChallenge({
            ...merkleChallenge,
            expectedProofLength: merkleChallenge.expectedProofLength.toString(),
          })
        }),
        predeterminedBalances: new transfers.bitbadges.bitbadgeschain.badges.PredeterminedBalances({
          ...approvalDetail.predeterminedBalances,
          incrementedBalances: new transfers.bitbadges.bitbadgeschain.badges.IncrementedBalances({
            ...approvalDetail.predeterminedBalances.incrementedBalances,
            startBalances: getWrappedBalances(approvalDetail.predeterminedBalances.incrementedBalances.startBalances),
            incrementBadgeIdsBy: approvalDetail.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy.toString(),
            incrementOwnershipTimesBy: approvalDetail.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy.toString(),
          }),
          orderCalculationMethod: new transfers.bitbadges.bitbadgeschain.badges.PredeterminedOrderCalculationMethod({
            ...approvalDetail.predeterminedBalances.orderCalculationMethod,
          }),
          manualBalances: approvalDetail.predeterminedBalances.manualBalances.map((manualBalance) => {
            return new transfers.bitbadges.bitbadgeschain.badges.ManualBalances({
              ...manualBalance,
              balances: getWrappedBalances(manualBalance.balances),
            })
          }),
        }),
        approvalAmounts: new transfers.bitbadges.bitbadgeschain.badges.ApprovalAmounts({
          ...approvalDetail.approvalAmounts,
          overallApprovalAmount: approvalDetail.approvalAmounts.overallApprovalAmount.toString(),
          perToAddressApprovalAmount: approvalDetail.approvalAmounts.perToAddressApprovalAmount.toString(),
          perFromAddressApprovalAmount: approvalDetail.approvalAmounts.perFromAddressApprovalAmount.toString(),
          perInitiatedByAddressApprovalAmount: approvalDetail.approvalAmounts.perInitiatedByAddressApprovalAmount.toString(),
        }),
        maxNumTransfers: new transfers.bitbadges.bitbadgeschain.badges.MaxNumTransfers({
          ...approvalDetail.maxNumTransfers,
          overallMaxNumTransfers: approvalDetail.maxNumTransfers.overallMaxNumTransfers.toString(),
          perToAddressMaxNumTransfers: approvalDetail.maxNumTransfers.perToAddressMaxNumTransfers.toString(),
          perFromAddressMaxNumTransfers: approvalDetail.maxNumTransfers.perFromAddressMaxNumTransfers.toString(),
          perInitiatedByAddressMaxNumTransfers: approvalDetail.maxNumTransfers.perInitiatedByAddressMaxNumTransfers.toString(),
        }),
      })
    }),
  }))
}



export function getWrappedCollectionApprovedTransfers<T extends NumberType>(collectionApprovedTransfers: CollectionApprovedTransfer<T>[]) {
  return collectionApprovedTransfers.map((outgoingTransfer) => new transfers.bitbadges.bitbadgeschain.badges.CollectionApprovedTransfer({
    ...outgoingTransfer,
    transferTimes: getWrappedBadgeIds(outgoingTransfer.transferTimes),
    badgeIds: getWrappedBadgeIds(outgoingTransfer.badgeIds),
    ownershipTimes: getWrappedBadgeIds(outgoingTransfer.ownershipTimes),
    allowedCombinations: outgoingTransfer.allowedCombinations.map((allowedCombination) => {
      return new transfers.bitbadges.bitbadgeschain.badges.IsCollectionTransferAllowed({
        ...allowedCombination,
        fromMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.fromMappingOptions }),
        toMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.toMappingOptions }),
        initiatedByMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.initiatedByMappingOptions }),
        transferTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.transferTimesOptions }),
        badgeIdsOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.badgeIdsOptions }),
        ownershipTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...allowedCombination.ownershipTimesOptions }),
      })
    }),
    approvalDetails: outgoingTransfer.approvalDetails.map((approvalDetail) => {
      return new transfers.bitbadges.bitbadgeschain.badges.ApprovalDetails({
        ...approvalDetail,
        mustOwnBadges: approvalDetail.mustOwnBadges.map((mustOwnBadge) => {
          return new balances.bitbadges.bitbadgeschain.badges.MustOwnBadges({
            ...mustOwnBadge,
            collectionId: mustOwnBadge.collectionId.toString(),
            badgeIds: getWrappedBadgeIds(mustOwnBadge.badgeIds),
            ownershipTimes: getWrappedBadgeIds(mustOwnBadge.ownershipTimes),
            amountRange: getWrappedBadgeIds([mustOwnBadge.amountRange])[0],
          })
        }),
        merkleChallenges: approvalDetail.merkleChallenges.map((merkleChallenge) => {
          return new transfers.bitbadges.bitbadgeschain.badges.MerkleChallenge({
            ...merkleChallenge,
            expectedProofLength: merkleChallenge.expectedProofLength.toString(),
          })
        }),
        predeterminedBalances: new transfers.bitbadges.bitbadgeschain.badges.PredeterminedBalances({
          ...approvalDetail.predeterminedBalances,
          incrementedBalances: new transfers.bitbadges.bitbadgeschain.badges.IncrementedBalances({
            ...approvalDetail.predeterminedBalances.incrementedBalances,
            startBalances: getWrappedBalances(approvalDetail.predeterminedBalances.incrementedBalances.startBalances),
            incrementBadgeIdsBy: approvalDetail.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy.toString(),
            incrementOwnershipTimesBy: approvalDetail.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy.toString(),
          }),
          orderCalculationMethod: new transfers.bitbadges.bitbadgeschain.badges.PredeterminedOrderCalculationMethod({
            ...approvalDetail.predeterminedBalances.orderCalculationMethod,
          }),
          manualBalances: approvalDetail.predeterminedBalances.manualBalances.map((manualBalance) => {
            return new transfers.bitbadges.bitbadgeschain.badges.ManualBalances({
              ...manualBalance,
              balances: getWrappedBalances(manualBalance.balances),
            })
          }),
        }),
        approvalAmounts: new transfers.bitbadges.bitbadgeschain.badges.ApprovalAmounts({
          ...approvalDetail.approvalAmounts,
          overallApprovalAmount: approvalDetail.approvalAmounts.overallApprovalAmount.toString(),
          perToAddressApprovalAmount: approvalDetail.approvalAmounts.perToAddressApprovalAmount.toString(),
          perFromAddressApprovalAmount: approvalDetail.approvalAmounts.perFromAddressApprovalAmount.toString(),
          perInitiatedByAddressApprovalAmount: approvalDetail.approvalAmounts.perInitiatedByAddressApprovalAmount.toString(),
        }),
        maxNumTransfers: new transfers.bitbadges.bitbadgeschain.badges.MaxNumTransfers({
          ...approvalDetail.maxNumTransfers,
          overallMaxNumTransfers: approvalDetail.maxNumTransfers.overallMaxNumTransfers.toString(),
          perToAddressMaxNumTransfers: approvalDetail.maxNumTransfers.perToAddressMaxNumTransfers.toString(),
          perFromAddressMaxNumTransfers: approvalDetail.maxNumTransfers.perFromAddressMaxNumTransfers.toString(),
          perInitiatedByAddressMaxNumTransfers: approvalDetail.maxNumTransfers.perInitiatedByAddressMaxNumTransfers.toString(),
        }),
      })
    }),
  }))
}


export function getWrappedManagerTimeline(managerTimeline: ManagerTimeline<NumberType>[]) {
  return managerTimeline.map((managerTimeline) => new timelines.bitbadges.bitbadgeschain.badges.ManagerTimeline({
    ...managerTimeline,
    timelineTimes: getWrappedBadgeIds(managerTimeline.timelineTimes),
  }))
}

export function getWrappedCollectionMetadataTimeline(collectionMetadataTimeline: CollectionMetadataTimeline<NumberType>[]) {
  return collectionMetadataTimeline.map((collectionMetadataTimeline) => new timelines.bitbadges.bitbadgeschain.badges.CollectionMetadataTimeline({
    ...collectionMetadataTimeline,
    timelineTimes: getWrappedBadgeIds(collectionMetadataTimeline.timelineTimes),
    collectionMetadata: new metadata.bitbadges.bitbadgeschain.badges.CollectionMetadata({ ...collectionMetadataTimeline.collectionMetadata }),
  }))
}

export const getWrappedBadgeMetadataTimeline = (badgeMetadataTimeline: BadgeMetadataTimeline<NumberType>[]) => badgeMetadataTimeline.map((badgeMetadataTimeline) => new timelines.bitbadges.bitbadgeschain.badges.BadgeMetadataTimeline({
  ...badgeMetadataTimeline,
  timelineTimes: getWrappedBadgeIds(badgeMetadataTimeline.timelineTimes),
  badgeMetadata: badgeMetadataTimeline.badgeMetadata.map((badgeMetadata) => new metadata.bitbadges.bitbadgeschain.badges.BadgeMetadata({
    ...badgeMetadata,
    badgeIds: getWrappedBadgeIds(badgeMetadata.badgeIds),
  })),
}))

export function getWrappedOffChainBalancesMetadataTimeline(offChainBalancesMetadataTimeline: OffChainBalancesMetadataTimeline<NumberType>[]) {
  return offChainBalancesMetadataTimeline.map((offChainBalancesMetadataTimeline) => new timelines.bitbadges.bitbadgeschain.badges.OffChainBalancesMetadataTimeline({
    ...offChainBalancesMetadataTimeline,
    timelineTimes: getWrappedBadgeIds(offChainBalancesMetadataTimeline.timelineTimes),
    offChainBalancesMetadata: new metadata.bitbadges.bitbadgeschain.badges.OffChainBalancesMetadata({ ...offChainBalancesMetadataTimeline.offChainBalancesMetadata }),
  }))
}

export function getWrappedCustomDataTimeline(customDataTimeline: CustomDataTimeline<NumberType>[]) {
  return customDataTimeline.map((customDataTimeline) => new timelines.bitbadges.bitbadgeschain.badges.CustomDataTimeline({
    ...customDataTimeline,
    timelineTimes: getWrappedBadgeIds(customDataTimeline.timelineTimes),
  }))
}

export function getWrappedInheritedBalancesTimeline(inheritedBalancesTimeline: InheritedBalancesTimeline<NumberType>[]) {
  return inheritedBalancesTimeline.map((inheritedBalancesTimeline) => new timelines.bitbadges.bitbadgeschain.badges.InheritedBalancesTimeline({
    ...inheritedBalancesTimeline,
    timelineTimes: getWrappedBadgeIds(inheritedBalancesTimeline.timelineTimes),
    inheritedBalances: inheritedBalancesTimeline.inheritedBalances.map((inheritedBalance) => new balances.bitbadges.bitbadgeschain.badges.InheritedBalance({
      ...inheritedBalance,
      badgeIds: getWrappedBadgeIds(inheritedBalance.badgeIds),
      parentBadgeIds: getWrappedBadgeIds(inheritedBalance.parentBadgeIds),
      parentCollectionId: inheritedBalance.parentCollectionId.toString(),
    })),
  }))
}

export function getWrappedStandardsTimeline(standardsTimeline: StandardsTimeline<NumberType>[]) {
  return standardsTimeline.map((standardsTimeline) => new timelines.bitbadges.bitbadgeschain.badges.StandardsTimeline({
    ...standardsTimeline,
    timelineTimes: getWrappedBadgeIds(standardsTimeline.timelineTimes),
  }))
}

export function getWrappedContractAddressTimeline(contractAddressTimeline: ContractAddressTimeline<NumberType>[]) {
  return contractAddressTimeline.map((contractAddressTimeline) => new timelines.bitbadges.bitbadgeschain.badges.ContractAddressTimeline({
    ...contractAddressTimeline,
    timelineTimes: getWrappedBadgeIds(contractAddressTimeline.timelineTimes),
  }))
}

export function getWrappedIsArchivedTimeline(isArchivedTimeline: IsArchivedTimeline<NumberType>[]) {
  return isArchivedTimeline.map((isArchivedTimeline) => new timelines.bitbadges.bitbadgeschain.badges.IsArchivedTimeline({
    ...isArchivedTimeline,
    timelineTimes: getWrappedBadgeIds(isArchivedTimeline.timelineTimes),
  }))
}
