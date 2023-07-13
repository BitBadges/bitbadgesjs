import * as balances from '../../../../proto/badges/balances';
import * as metadata from '../../../../proto/badges/metadata';
import * as permissions from '../../../../proto/badges/permissions';
import * as timelines from '../../../../proto/badges/timelines';
import * as transfers from '../../../../proto/badges/transfers';
import { UserApprovedIncomingTransferTimeline, UserApprovedOutgoingTransferTimeline } from "./approvedTransfers";
import { BalancesActionPermission, CollectionApprovedTransferPermission, CollectionPermissions, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UserPermissions } from "./permissions";
import { BadgeMetadata, Balance, CollectionApprovedTransferTimeline, MerkleProof, Transfer, UintRange } from "./typeUtils";


export function getWrappedBadgeIds(badgeIds: UintRange[]) {
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

export function getWrappedBadgeMetadata(badgeUris: BadgeMetadata[]) {
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


export function getWrappedBalances(balanceArr: Balance[]) {
  const formattedBalances: balances.bitbadges.bitbadgeschain.badges.Balance[] =
    []

  for (const balance of balanceArr) {
    const wrappedBadgeIds = getWrappedBadgeIds(balance.badgeIds)
    const wrappedOwnedTimes = getWrappedBadgeIds(balance.ownedTimes)

    formattedBalances.push(
      new balances.bitbadges.bitbadgeschain.badges.Balance({
        badgeIds: wrappedBadgeIds,
        amount: balance.amount.toString(),
        ownedTimes: wrappedOwnedTimes,
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

export function getWrappedTransfers(transfersArr: Transfer[]) {
  const wrappedTransfers: transfers.bitbadges.bitbadgeschain.badges.Transfer[] = []
  for (const transfer of transfersArr) {
    const formattedBalances = getWrappedBalances(transfer.balances)

    wrappedTransfers.push(
      new transfers.bitbadges.bitbadgeschain.badges.Transfer({
        ...transfer,
        balances: formattedBalances,
        merkleProofs: transfer.merkleProofs.map(getWrappedProof),
        precalculateFromApproval: new transfers.bitbadges.bitbadgeschain.badges.ApprovalIdDetails({ ...transfer.precalculateFromApproval }),
      }),
    )
  }
  return wrappedTransfers
}

const getWrappedTimedUpdatePermission = (permissionsArr: TimedUpdatePermission[]) => {
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

export const getWrappedTimedUpdateWithBadgeIdsPermission = (permissionsArr: TimedUpdateWithBadgeIdsPermission[]) => {
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

export const getWrappedBalancesActionPermission = (permissionsArr: BalancesActionPermission[]) => {
  return permissionsArr.map((canArchiveCollection) => {
    return new permissions.bitbadges.bitbadgeschain.badges.BalancesActionPermission({
      ...canArchiveCollection,
      defaultValues: new permissions.bitbadges.bitbadgeschain.badges.BalancesActionDefaultValues({
        ...canArchiveCollection.defaultValues,
        ownedTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.ownedTimes),
        badgeIds: getWrappedBadgeIds(canArchiveCollection.defaultValues.badgeIds),
        permittedTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.permittedTimes),
        forbiddenTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.forbiddenTimes),
      }),
      combinations: canArchiveCollection.combinations.map((combination) => {
        return new permissions.bitbadges.bitbadgeschain.badges.BalancesActionCombination({
          ...combination,
          ownedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.ownedTimesOptions }),
          badgeIdsOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.badgeIdsOptions }),
          permittedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.permittedTimesOptions }),
          forbiddenTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.forbiddenTimesOptions }),
        })
      }),
    })
  })
}

export const getWrappedCollectionApprovedTransferPermission = (permissionsArr: CollectionApprovedTransferPermission[]) => {
  return permissionsArr.map((canArchiveCollection) => {
    return new permissions.bitbadges.bitbadgeschain.badges.CollectionApprovedTransferPermission({
      ...canArchiveCollection,
      defaultValues: new permissions.bitbadges.bitbadgeschain.badges.CollectionApprovedTransferDefaultValues({
        ...canArchiveCollection.defaultValues,
        timelineTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.timelineTimes),
        transferTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.transferTimes),
        badgeIds: getWrappedBadgeIds(canArchiveCollection.defaultValues.badgeIds),
        ownedTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.ownedTimes),
        permittedTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.permittedTimes),
        forbiddenTimes: getWrappedBadgeIds(canArchiveCollection.defaultValues.forbiddenTimes),
      }),
      combinations: canArchiveCollection.combinations.map((combination) => {
        return new permissions.bitbadges.bitbadgeschain.badges.CollectionApprovedTransferCombination({
          ...combination,
          toMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.toMappingOptions }),
          fromMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.fromMappingOptions }),
          initiatedByMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.initiatedByMappingOptions }),
          timelineTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.timelineTimesOptions }),
          transferTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.transferTimesOptions }),
          badgeIdsOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.badgeIdsOptions }),
          ownedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.ownedTimesOptions }),
          permittedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.permittedTimesOptions }),
          forbiddenTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.forbiddenTimesOptions }),
        })
      }),
    })
  })
}



export const getWrappedCollectionPermissions = (collectionPermissions: CollectionPermissions) => {
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
    canUpdateInheritedBalances: getWrappedTimedUpdateWithBadgeIdsPermission(collectionPermissions.canUpdateInheritedBalances),
    canUpdateCollectionApprovedTransfers: getWrappedCollectionApprovedTransferPermission(collectionPermissions.canUpdateCollectionApprovedTransfers),
    canUpdateCollectionMetadata: getWrappedTimedUpdatePermission(collectionPermissions.canUpdateCollectionMetadata),
    canUpdateContractAddress: getWrappedTimedUpdatePermission(collectionPermissions.canUpdateContractAddress),
    canUpdateCustomData: getWrappedTimedUpdatePermission(collectionPermissions.canUpdateCustomData),
    canUpdateManager: getWrappedTimedUpdatePermission(collectionPermissions.canUpdateManager),
    canUpdateOffChainBalancesMetadata: getWrappedTimedUpdatePermission(collectionPermissions.canUpdateOffChainBalancesMetadata),
    canUpdateStandards: getWrappedTimedUpdatePermission(collectionPermissions.canUpdateStandards),
  })
}


export const getWrappedUserPermissions = (userPermissions: UserPermissions) => {
  return new permissions.bitbadges.bitbadgeschain.badges.UserPermissions({
    ...userPermissions,
    canUpdateApprovedIncomingTransfers: userPermissions.canUpdateApprovedIncomingTransfers.map((canUpdateApprovedIncomingTransfer) => {
      return new permissions.bitbadges.bitbadgeschain.badges.UserApprovedIncomingTransferPermission({
        ...canUpdateApprovedIncomingTransfer,
        defaultValues: new permissions.bitbadges.bitbadgeschain.badges.UserApprovedIncomingTransferDefaultValues({
          ...canUpdateApprovedIncomingTransfer.defaultValues,
          timelineTimes: getWrappedBadgeIds(canUpdateApprovedIncomingTransfer.defaultValues.timelineTimes),
          transferTimes: getWrappedBadgeIds(canUpdateApprovedIncomingTransfer.defaultValues.transferTimes),
          badgeIds: getWrappedBadgeIds(canUpdateApprovedIncomingTransfer.defaultValues.badgeIds),
          ownedTimes: getWrappedBadgeIds(canUpdateApprovedIncomingTransfer.defaultValues.ownedTimes),
          permittedTimes: getWrappedBadgeIds(canUpdateApprovedIncomingTransfer.defaultValues.permittedTimes),
          forbiddenTimes: getWrappedBadgeIds(canUpdateApprovedIncomingTransfer.defaultValues.forbiddenTimes),
        }),
        combinations: canUpdateApprovedIncomingTransfer.combinations.map((combination) => {
          return new permissions.bitbadges.bitbadgeschain.badges.UserApprovedIncomingTransferCombination({
            ...combination,
            timelineTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.timelineTimesOptions }),
            fromMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.fromMappingOptions }),
            initiatedByMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.initiatedByMappingOptions }),
            transferTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.transferTimesOptions }),
            badgeIdsOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.badgeIdsOptions }),
            ownedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.ownedTimesOptions }),
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
          timelineTimes: getWrappedBadgeIds(canUpdateApprovedOutgoingTransfer.defaultValues.timelineTimes),
          transferTimes: getWrappedBadgeIds(canUpdateApprovedOutgoingTransfer.defaultValues.transferTimes),
          badgeIds: getWrappedBadgeIds(canUpdateApprovedOutgoingTransfer.defaultValues.badgeIds),
          ownedTimes: getWrappedBadgeIds(canUpdateApprovedOutgoingTransfer.defaultValues.ownedTimes),
          permittedTimes: getWrappedBadgeIds(canUpdateApprovedOutgoingTransfer.defaultValues.permittedTimes),
          forbiddenTimes: getWrappedBadgeIds(canUpdateApprovedOutgoingTransfer.defaultValues.forbiddenTimes),
        }),
        combinations: canUpdateApprovedOutgoingTransfer.combinations.map((combination) => {
          return new permissions.bitbadges.bitbadgeschain.badges.UserApprovedOutgoingTransferCombination({
            ...combination,
            timelineTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.timelineTimesOptions }),
            toMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.toMappingOptions }),
            initiatedByMappingOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.initiatedByMappingOptions }),
            transferTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.transferTimesOptions }),
            badgeIdsOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.badgeIdsOptions }),
            ownedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.ownedTimesOptions }),
            permittedTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.permittedTimesOptions }),
            forbiddenTimesOptions: new permissions.bitbadges.bitbadgeschain.badges.ValueOptions({ ...combination.forbiddenTimesOptions }),
          })
        }),
      })
    }),
  })
}

export const getWrappedOutgoingTransfersTimeline = (approvedOutgoingTransfersTimeline: UserApprovedOutgoingTransferTimeline[]) => {
  return approvedOutgoingTransfersTimeline.map((transfer) => new transfers.bitbadges.bitbadgeschain.badges.UserApprovedOutgoingTransferTimeline({
    timelineTimes: getWrappedBadgeIds(transfer.timelineTimes),
    approvedOutgoingTransfers: transfer.approvedOutgoingTransfers.map((outgoingTransfer) => new transfers.bitbadges.bitbadgeschain.badges.UserApprovedOutgoingTransfer({
      ...outgoingTransfer,
      transferTimes: getWrappedBadgeIds(outgoingTransfer.transferTimes),
      badgeIds: getWrappedBadgeIds(outgoingTransfer.badgeIds),
      ownedTimes: getWrappedBadgeIds(outgoingTransfer.ownedTimes),
      allowedCombinations: outgoingTransfer.allowedCombinations.map((allowedCombination) => {
        return new transfers.bitbadges.bitbadgeschain.badges.IsUserOutgoingTransferAllowed({ ...allowedCombination })
      }),
      approvalDetails: outgoingTransfer.approvalDetails.map((approvalDetail) => {
        return new transfers.bitbadges.bitbadgeschain.badges.OutgoingApprovalDetails({
          ...approvalDetail,
          mustOwnBadges: approvalDetail.mustOwnBadges.map((mustOwnBadge) => {
            return new balances.bitbadges.bitbadgeschain.badges.MustOwnBadges({
              ...mustOwnBadge,
              collectionId: mustOwnBadge.collectionId.toString(),
              badgeIds: getWrappedBadgeIds(mustOwnBadge.badgeIds),
              ownedTimes: getWrappedBadgeIds(mustOwnBadge.ownedTimes),
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
              incrementOwnedTimesBy: approvalDetail.predeterminedBalances.incrementedBalances.incrementOwnedTimesBy.toString(),
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
    })),
  }))
}

export const getWrappedIncomingTransfersTimeline = (approvedIncomingTransfersTimeline: UserApprovedIncomingTransferTimeline[]) => {
  return approvedIncomingTransfersTimeline.map((transfer) => new transfers.bitbadges.bitbadgeschain.badges.UserApprovedIncomingTransferTimeline({
    timelineTimes: getWrappedBadgeIds(transfer.timelineTimes),
    approvedIncomingTransfers: transfer.approvedIncomingTransfers.map((outgoingTransfer) => new transfers.bitbadges.bitbadgeschain.badges.UserApprovedIncomingTransfer({
      ...outgoingTransfer,
      transferTimes: getWrappedBadgeIds(outgoingTransfer.transferTimes),
      badgeIds: getWrappedBadgeIds(outgoingTransfer.badgeIds),
      ownedTimes: getWrappedBadgeIds(outgoingTransfer.ownedTimes),
      allowedCombinations: outgoingTransfer.allowedCombinations.map((allowedCombination) => {
        return new transfers.bitbadges.bitbadgeschain.badges.IsUserIncomingTransferAllowed({ ...allowedCombination })
      }),
      approvalDetails: outgoingTransfer.approvalDetails.map((approvalDetail) => {
        return new transfers.bitbadges.bitbadgeschain.badges.IncomingApprovalDetails({
          ...approvalDetail,
          mustOwnBadges: approvalDetail.mustOwnBadges.map((mustOwnBadge) => {
            return new balances.bitbadges.bitbadgeschain.badges.MustOwnBadges({
              ...mustOwnBadge,
              collectionId: mustOwnBadge.collectionId.toString(),
              badgeIds: getWrappedBadgeIds(mustOwnBadge.badgeIds),
              ownedTimes: getWrappedBadgeIds(mustOwnBadge.ownedTimes),
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
              incrementOwnedTimesBy: approvalDetail.predeterminedBalances.incrementedBalances.incrementOwnedTimesBy.toString(),
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
    })),
  }))
}



export const getWrappedCollectionApprovedTransfersTimeline = (collectionApprovedTransfersTimeline: CollectionApprovedTransferTimeline[]) => {
  return collectionApprovedTransfersTimeline.map((transfer) => new timelines.bitbadges.bitbadgeschain.badges.CollectionApprovedTransferTimeline({
    timelineTimes: getWrappedBadgeIds(transfer.timelineTimes),
    collectionApprovedTransfers: transfer.collectionApprovedTransfers.map((outgoingTransfer) => new transfers.bitbadges.bitbadgeschain.badges.CollectionApprovedTransfer({
      ...outgoingTransfer,
      transferTimes: getWrappedBadgeIds(outgoingTransfer.transferTimes),
      badgeIds: getWrappedBadgeIds(outgoingTransfer.badgeIds),
      ownedTimes: getWrappedBadgeIds(outgoingTransfer.ownedTimes),
      allowedCombinations: outgoingTransfer.allowedCombinations.map((allowedCombination) => {
        return new transfers.bitbadges.bitbadgeschain.badges.IsCollectionTransferAllowed({ ...allowedCombination })
      }),
      approvalDetails: outgoingTransfer.approvalDetails.map((approvalDetail) => {
        return new transfers.bitbadges.bitbadgeschain.badges.ApprovalDetails({
          ...approvalDetail,
          mustOwnBadges: approvalDetail.mustOwnBadges.map((mustOwnBadge) => {
            return new balances.bitbadges.bitbadgeschain.badges.MustOwnBadges({
              ...mustOwnBadge,
              collectionId: mustOwnBadge.collectionId.toString(),
              badgeIds: getWrappedBadgeIds(mustOwnBadge.badgeIds),
              ownedTimes: getWrappedBadgeIds(mustOwnBadge.ownedTimes),
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
              incrementOwnedTimesBy: approvalDetail.predeterminedBalances.incrementedBalances.incrementOwnedTimesBy.toString(),
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
    })),
  }))
}
