import * as balances from '../../../../proto/badges/balances';
import * as metadata from '../../../../proto/badges/metadata';
import * as permissions from '../../../../proto/badges/permissions';
import * as timelines from '../../../../proto/badges/timelines';
import * as transfers from '../../../../proto/badges/transfers';
import { NumberType } from '../string-numbers';
import { ApprovalCriteria, CollectionApproval, UserIncomingApproval, UserOutgoingApproval } from "./approvals";
import { BalancesActionPermission, CollectionApprovalPermission, CollectionPermissions, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UserPermissions } from "./permissions";
import { BadgeMetadata, BadgeMetadataTimeline, Balance, CollectionMetadataTimeline, ContractAddressTimeline, CustomDataTimeline, InheritedBalancesTimeline, IsArchivedTimeline, ManagerTimeline, MerkleProof, OffChainBalancesMetadataTimeline, StandardsTimeline, Transfer, UintRange } from "./typeUtils";

const DefaultNullApprovalCriteria: ApprovalCriteria<NumberType> = {
  "mustOwnBadges": [],
  "approvalAmounts": {
    "overallApprovalAmount": "0",
    "perFromAddressApprovalAmount": "0",
    "perToAddressApprovalAmount": "0",
    "perInitiatedByAddressApprovalAmount": "0"
  },
  "maxNumTransfers": {
    "overallMaxNumTransfers": "0",
    "perFromAddressMaxNumTransfers": "0",
    "perToAddressMaxNumTransfers": "0",
    "perInitiatedByAddressMaxNumTransfers": "0"
  },
  "predeterminedBalances": {
    "manualBalances": [],
    "incrementedBalances": {
      "startBalances": [
      ],
      "incrementBadgeIdsBy": "0",
      "incrementOwnershipTimesBy": "0"
    },
    "orderCalculationMethod": {
      "useMerkleChallengeLeafIndex": false,
      "useOverallNumTransfers": false,
      "usePerFromAddressNumTransfers": false,
      "usePerInitiatedByAddressNumTransfers": false,
      "usePerToAddressNumTransfers": false
    }
  },
  "merkleChallenge": {
    "root": "",
    "expectedProofLength": "0",
    "useCreatorAddressAsLeaf": false,
    "maxUsesPerLeaf": "0",
    "uri": "",
    "customData": ""
  },
  "requireToEqualsInitiatedBy": false,
  "requireFromEqualsInitiatedBy": false,
  "requireToDoesNotEqualInitiatedBy": false,
  "requireFromDoesNotEqualInitiatedBy": false,
  "overridesToIncomingApprovals": false,
  "overridesFromOutgoingApprovals": false
}

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
        merkleProofs: transfer.merkleProofs ? transfer.merkleProofs.map(getWrappedProof) : undefined,
        precalculateBalancesFromApproval: transfer.precalculateBalancesFromApproval ? new transfers.bitbadges.bitbadgeschain.badges.ApprovalIdentifierDetails({ ...transfer.precalculateBalancesFromApproval }) : undefined,
        prioritizedApprovals: transfer.prioritizedApprovals ? transfer.prioritizedApprovals.map((prioritizedApproval) => {
          return new transfers.bitbadges.bitbadgeschain.badges.ApprovalIdentifierDetails({
            ...prioritizedApproval,
          })
        }) : undefined,
      }),
    )
  }
  return wrappedTransfers
}

export function getWrappedTimedUpdatePermission<T extends NumberType>(permissionsArr: TimedUpdatePermission<T>[]) {
  return permissionsArr.map((canArchiveCollection) => {
    return new permissions.bitbadges.bitbadgeschain.badges.TimedUpdatePermission({
      ...canArchiveCollection,
      timelineTimes: getWrappedBadgeIds(canArchiveCollection.timelineTimes),
      permittedTimes: getWrappedBadgeIds(canArchiveCollection.permittedTimes),
      forbiddenTimes: getWrappedBadgeIds(canArchiveCollection.forbiddenTimes),


    })
  })
}

export function getWrappedTimedUpdateWithBadgeIdsPermission<T extends NumberType>(permissionsArr: TimedUpdateWithBadgeIdsPermission<T>[]) {
  return permissionsArr.map((canArchiveCollection) => {
    return new permissions.bitbadges.bitbadgeschain.badges.TimedUpdateWithBadgeIdsPermission({
      ...canArchiveCollection,
      timelineTimes: getWrappedBadgeIds(canArchiveCollection.timelineTimes),
      badgeIds: getWrappedBadgeIds(canArchiveCollection.badgeIds),
      permittedTimes: getWrappedBadgeIds(canArchiveCollection.permittedTimes),
      forbiddenTimes: getWrappedBadgeIds(canArchiveCollection.forbiddenTimes),
    })
  })
}

export function getWrappedBalancesActionPermission<T extends NumberType>(permissionsArr: BalancesActionPermission<T>[]) {
  return permissionsArr.map((canArchiveCollection) => {
    return new permissions.bitbadges.bitbadgeschain.badges.BalancesActionPermission({
      ...canArchiveCollection,
      ownershipTimes: getWrappedBadgeIds(canArchiveCollection.ownershipTimes),
      badgeIds: getWrappedBadgeIds(canArchiveCollection.badgeIds),
      permittedTimes: getWrappedBadgeIds(canArchiveCollection.permittedTimes),
      forbiddenTimes: getWrappedBadgeIds(canArchiveCollection.forbiddenTimes),

    })
  })
}

export function getWrappedCollectionApprovalPermission<T extends NumberType>(permissionsArr: CollectionApprovalPermission<T>[]) {
  return permissionsArr.map((canArchiveCollection) => {
    return new permissions.bitbadges.bitbadgeschain.badges.CollectionApprovalPermission({
      ...canArchiveCollection,
      transferTimes: getWrappedBadgeIds(canArchiveCollection.transferTimes),
      badgeIds: getWrappedBadgeIds(canArchiveCollection.badgeIds),
      ownershipTimes: getWrappedBadgeIds(canArchiveCollection.ownershipTimes),
      permittedTimes: getWrappedBadgeIds(canArchiveCollection.permittedTimes),
      forbiddenTimes: getWrappedBadgeIds(canArchiveCollection.forbiddenTimes),

    })
  })
}



export function getWrappedCollectionPermissions<T extends NumberType>(collectionPermissions: CollectionPermissions<T>) {
  return new permissions.bitbadges.bitbadgeschain.badges.CollectionPermissions({
    ...collectionPermissions,
    canDeleteCollection: collectionPermissions.canDeleteCollection.map((canDeleteCollection) => {
      return new permissions.bitbadges.bitbadgeschain.badges.ActionPermission({
        permittedTimes: getWrappedBadgeIds(canDeleteCollection.permittedTimes),
        forbiddenTimes: getWrappedBadgeIds(canDeleteCollection.forbiddenTimes),
      })
    }),
    canArchiveCollection: getWrappedTimedUpdatePermission(collectionPermissions.canArchiveCollection),
    canCreateMoreBadges: getWrappedBalancesActionPermission(collectionPermissions.canCreateMoreBadges),
    canUpdateBadgeMetadata: getWrappedTimedUpdateWithBadgeIdsPermission(collectionPermissions.canUpdateBadgeMetadata),
    canUpdateCollectionApprovals: getWrappedCollectionApprovalPermission(collectionPermissions.canUpdateCollectionApprovals),
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
    canUpdateAutoApproveSelfInitiatedIncomingTransfers: userPermissions.canUpdateAutoApproveSelfInitiatedIncomingTransfers.map((canUpdateAutoApproveSelfInitiatedIncomingTransfer) => {
      return new permissions.bitbadges.bitbadgeschain.badges.ActionPermission({
        ...canUpdateAutoApproveSelfInitiatedIncomingTransfer,
        permittedTimes: getWrappedBadgeIds(canUpdateAutoApproveSelfInitiatedIncomingTransfer.permittedTimes),
        forbiddenTimes: getWrappedBadgeIds(canUpdateAutoApproveSelfInitiatedIncomingTransfer.forbiddenTimes),
      })
    }),
    canUpdateAutoApproveSelfInitiatedOutgoingTransfers: userPermissions.canUpdateAutoApproveSelfInitiatedOutgoingTransfers.map((canUpdateAutoApproveSelfInitiatedOutgoingTransfer) => {
      return new permissions.bitbadges.bitbadgeschain.badges.ActionPermission({
        ...canUpdateAutoApproveSelfInitiatedOutgoingTransfer,
        permittedTimes: getWrappedBadgeIds(canUpdateAutoApproveSelfInitiatedOutgoingTransfer.permittedTimes),
        forbiddenTimes: getWrappedBadgeIds(canUpdateAutoApproveSelfInitiatedOutgoingTransfer.forbiddenTimes),
      })
    }),
    canUpdateIncomingApprovals: userPermissions.canUpdateIncomingApprovals.map((canUpdateIncomingApproval) => {
      return new permissions.bitbadges.bitbadgeschain.badges.UserIncomingApprovalPermission({
        ...canUpdateIncomingApproval,
        transferTimes: getWrappedBadgeIds(canUpdateIncomingApproval.transferTimes),
        badgeIds: getWrappedBadgeIds(canUpdateIncomingApproval.badgeIds),
        ownershipTimes: getWrappedBadgeIds(canUpdateIncomingApproval.ownershipTimes),
        permittedTimes: getWrappedBadgeIds(canUpdateIncomingApproval.permittedTimes),
        forbiddenTimes: getWrappedBadgeIds(canUpdateIncomingApproval.forbiddenTimes),
      })
    }),
    canUpdateOutgoingApprovals: userPermissions.canUpdateOutgoingApprovals.map((canUpdateOutgoingApproval) => {
      return new permissions.bitbadges.bitbadgeschain.badges.UserOutgoingApprovalPermission({
        ...canUpdateOutgoingApproval,
        transferTimes: getWrappedBadgeIds(canUpdateOutgoingApproval.transferTimes),
        badgeIds: getWrappedBadgeIds(canUpdateOutgoingApproval.badgeIds),
        ownershipTimes: getWrappedBadgeIds(canUpdateOutgoingApproval.ownershipTimes),
        permittedTimes: getWrappedBadgeIds(canUpdateOutgoingApproval.permittedTimes),
        forbiddenTimes: getWrappedBadgeIds(canUpdateOutgoingApproval.forbiddenTimes),
      })
    }),
  })
}

export function getWrappedOutgoingTransfers<T extends NumberType>(outgoingApprovals: UserOutgoingApproval<T>[]) {
  return outgoingApprovals.map((outgoingTransfer) => {
    const approvalCriteria = outgoingTransfer.approvalCriteria ?? DefaultNullApprovalCriteria;
    return new transfers.bitbadges.bitbadgeschain.badges.UserOutgoingApproval({
      ...outgoingTransfer,
      transferTimes: getWrappedBadgeIds(outgoingTransfer.transferTimes),
      badgeIds: getWrappedBadgeIds(outgoingTransfer.badgeIds),
      ownershipTimes: getWrappedBadgeIds(outgoingTransfer.ownershipTimes),

      approvalCriteria: approvalCriteria ? new transfers.bitbadges.bitbadgeschain.badges.OutgoingApprovalCriteria({
        ...approvalCriteria,
        mustOwnBadges: approvalCriteria.mustOwnBadges ? approvalCriteria.mustOwnBadges.map((mustOwnBadge) => {
          return new balances.bitbadges.bitbadgeschain.badges.MustOwnBadges({
            ...mustOwnBadge,
            collectionId: mustOwnBadge.collectionId.toString(),
            badgeIds: getWrappedBadgeIds(mustOwnBadge.badgeIds),
            ownershipTimes: getWrappedBadgeIds(mustOwnBadge.ownershipTimes),
            amountRange: getWrappedBadgeIds([mustOwnBadge.amountRange])[0],
          })
        }) : undefined,
        merkleChallenge: approvalCriteria.merkleChallenge ? new transfers.bitbadges.bitbadgeschain.badges.MerkleChallenge({
          ...approvalCriteria.merkleChallenge,
          maxUsesPerLeaf: approvalCriteria.merkleChallenge.maxUsesPerLeaf.toString(),
          expectedProofLength: approvalCriteria.merkleChallenge.expectedProofLength.toString(),
        }) : undefined,

        predeterminedBalances: approvalCriteria.predeterminedBalances ? new transfers.bitbadges.bitbadgeschain.badges.PredeterminedBalances({
          ...approvalCriteria.predeterminedBalances,
          incrementedBalances: new transfers.bitbadges.bitbadgeschain.badges.IncrementedBalances({
            ...approvalCriteria.predeterminedBalances.incrementedBalances,
            startBalances: getWrappedBalances(approvalCriteria.predeterminedBalances.incrementedBalances.startBalances),
            incrementBadgeIdsBy: approvalCriteria.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy.toString(),
            incrementOwnershipTimesBy: approvalCriteria.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy.toString(),
          }),
          orderCalculationMethod: new transfers.bitbadges.bitbadgeschain.badges.PredeterminedOrderCalculationMethod({
            ...approvalCriteria.predeterminedBalances.orderCalculationMethod,
          }),
          manualBalances: approvalCriteria.predeterminedBalances.manualBalances.map((manualBalance) => {
            return new transfers.bitbadges.bitbadgeschain.badges.ManualBalances({
              ...manualBalance,
              balances: getWrappedBalances(manualBalance.balances),
            })
          }),
        }) : undefined,
        approvalAmounts: approvalCriteria.approvalAmounts ? new transfers.bitbadges.bitbadgeschain.badges.ApprovalAmounts({
          ...approvalCriteria.approvalAmounts,
          overallApprovalAmount: approvalCriteria.approvalAmounts.overallApprovalAmount.toString(),
          perToAddressApprovalAmount: approvalCriteria.approvalAmounts.perToAddressApprovalAmount.toString(),
          perFromAddressApprovalAmount: approvalCriteria.approvalAmounts.perFromAddressApprovalAmount.toString(),
          perInitiatedByAddressApprovalAmount: approvalCriteria.approvalAmounts.perInitiatedByAddressApprovalAmount.toString(),
        }) : undefined,
        maxNumTransfers: approvalCriteria.maxNumTransfers ? new transfers.bitbadges.bitbadgeschain.badges.MaxNumTransfers({
          ...approvalCriteria.maxNumTransfers,
          overallMaxNumTransfers: approvalCriteria.maxNumTransfers.overallMaxNumTransfers.toString(),
          perToAddressMaxNumTransfers: approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers.toString(),
          perFromAddressMaxNumTransfers: approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers.toString(),
          perInitiatedByAddressMaxNumTransfers: approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers.toString(),
        }) : undefined
      }) : undefined,
    })
  })
}

export function getWrappedIncomingTransfers<T extends NumberType>(incomingApprovals: UserIncomingApproval<T>[]) {
  return incomingApprovals.map((outgoingTransfer) => {

    const approvalCriteria = outgoingTransfer.approvalCriteria ?? DefaultNullApprovalCriteria;
    return new transfers.bitbadges.bitbadgeschain.badges.UserIncomingApproval({
      ...outgoingTransfer,
      transferTimes: getWrappedBadgeIds(outgoingTransfer.transferTimes),
      badgeIds: getWrappedBadgeIds(outgoingTransfer.badgeIds),
      ownershipTimes: getWrappedBadgeIds(outgoingTransfer.ownershipTimes),

      approvalCriteria: approvalCriteria ? new transfers.bitbadges.bitbadgeschain.badges.IncomingApprovalCriteria({
        ...approvalCriteria,
        mustOwnBadges: approvalCriteria.mustOwnBadges ? approvalCriteria.mustOwnBadges.map((mustOwnBadge) => {
          return new balances.bitbadges.bitbadgeschain.badges.MustOwnBadges({
            ...mustOwnBadge,
            collectionId: mustOwnBadge.collectionId.toString(),
            badgeIds: getWrappedBadgeIds(mustOwnBadge.badgeIds),
            ownershipTimes: getWrappedBadgeIds(mustOwnBadge.ownershipTimes),
            amountRange: getWrappedBadgeIds([mustOwnBadge.amountRange])[0],
          })
        }) : undefined,
        merkleChallenge: approvalCriteria.merkleChallenge ? new transfers.bitbadges.bitbadgeschain.badges.MerkleChallenge({
          ...approvalCriteria.merkleChallenge,
          maxUsesPerLeaf: approvalCriteria.merkleChallenge.maxUsesPerLeaf.toString(),
          expectedProofLength: approvalCriteria.merkleChallenge.expectedProofLength.toString(),
        }) : undefined,

        predeterminedBalances: approvalCriteria.predeterminedBalances ? new transfers.bitbadges.bitbadgeschain.badges.PredeterminedBalances({
          ...approvalCriteria.predeterminedBalances,
          incrementedBalances: new transfers.bitbadges.bitbadgeschain.badges.IncrementedBalances({
            ...approvalCriteria.predeterminedBalances.incrementedBalances,
            startBalances: getWrappedBalances(approvalCriteria.predeterminedBalances.incrementedBalances.startBalances),
            incrementBadgeIdsBy: approvalCriteria.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy.toString(),
            incrementOwnershipTimesBy: approvalCriteria.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy.toString(),
          }),
          orderCalculationMethod: new transfers.bitbadges.bitbadgeschain.badges.PredeterminedOrderCalculationMethod({
            ...approvalCriteria.predeterminedBalances.orderCalculationMethod,
          }),
          manualBalances: approvalCriteria.predeterminedBalances.manualBalances.map((manualBalance) => {
            return new transfers.bitbadges.bitbadgeschain.badges.ManualBalances({
              ...manualBalance,
              balances: getWrappedBalances(manualBalance.balances),
            })
          }),
        }) : undefined,
        approvalAmounts: approvalCriteria.approvalAmounts ? new transfers.bitbadges.bitbadgeschain.badges.ApprovalAmounts({
          ...approvalCriteria.approvalAmounts,
          overallApprovalAmount: approvalCriteria.approvalAmounts.overallApprovalAmount.toString(),
          perToAddressApprovalAmount: approvalCriteria.approvalAmounts.perToAddressApprovalAmount.toString(),
          perFromAddressApprovalAmount: approvalCriteria.approvalAmounts.perFromAddressApprovalAmount.toString(),
          perInitiatedByAddressApprovalAmount: approvalCriteria.approvalAmounts.perInitiatedByAddressApprovalAmount.toString(),
        }) : undefined,
        maxNumTransfers: approvalCriteria.maxNumTransfers ? new transfers.bitbadges.bitbadgeschain.badges.MaxNumTransfers({
          ...approvalCriteria.maxNumTransfers,
          overallMaxNumTransfers: approvalCriteria.maxNumTransfers.overallMaxNumTransfers.toString(),
          perToAddressMaxNumTransfers: approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers.toString(),
          perFromAddressMaxNumTransfers: approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers.toString(),
          perInitiatedByAddressMaxNumTransfers: approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers.toString(),
        }) : undefined
      }) : undefined,
    })
  })
}



export function getWrappedCollectionApprovals<T extends NumberType>(collectionApprovals: CollectionApproval<T>[]) {
  return collectionApprovals.map((outgoingTransfer) => {
    const approvalCriteria = outgoingTransfer.approvalCriteria ?? DefaultNullApprovalCriteria;
    return new transfers.bitbadges.bitbadgeschain.badges.CollectionApproval({
      ...outgoingTransfer,
      transferTimes: getWrappedBadgeIds(outgoingTransfer.transferTimes),
      badgeIds: getWrappedBadgeIds(outgoingTransfer.badgeIds),
      ownershipTimes: getWrappedBadgeIds(outgoingTransfer.ownershipTimes),
      approvalCriteria: approvalCriteria ? new transfers.bitbadges.bitbadgeschain.badges.ApprovalCriteria({
        ...approvalCriteria,
        mustOwnBadges: approvalCriteria.mustOwnBadges ? approvalCriteria.mustOwnBadges.map((mustOwnBadge) => {
          return new balances.bitbadges.bitbadgeschain.badges.MustOwnBadges({
            ...mustOwnBadge,
            collectionId: mustOwnBadge.collectionId.toString(),
            badgeIds: getWrappedBadgeIds(mustOwnBadge.badgeIds),
            ownershipTimes: getWrappedBadgeIds(mustOwnBadge.ownershipTimes),
            amountRange: getWrappedBadgeIds([mustOwnBadge.amountRange])[0],
          })
        }) : undefined,
        merkleChallenge: approvalCriteria.merkleChallenge ? new transfers.bitbadges.bitbadgeschain.badges.MerkleChallenge({
          ...approvalCriteria.merkleChallenge,
          maxUsesPerLeaf: approvalCriteria.merkleChallenge.maxUsesPerLeaf.toString(),
          expectedProofLength: approvalCriteria.merkleChallenge.expectedProofLength.toString(),
        }) : undefined,

        predeterminedBalances: approvalCriteria.predeterminedBalances ? new transfers.bitbadges.bitbadgeschain.badges.PredeterminedBalances({
          ...approvalCriteria.predeterminedBalances,
          incrementedBalances: new transfers.bitbadges.bitbadgeschain.badges.IncrementedBalances({
            ...approvalCriteria.predeterminedBalances.incrementedBalances,
            startBalances: getWrappedBalances(approvalCriteria.predeterminedBalances.incrementedBalances.startBalances),
            incrementBadgeIdsBy: approvalCriteria.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy.toString(),
            incrementOwnershipTimesBy: approvalCriteria.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy.toString(),
          }),
          orderCalculationMethod: new transfers.bitbadges.bitbadgeschain.badges.PredeterminedOrderCalculationMethod({
            ...approvalCriteria.predeterminedBalances.orderCalculationMethod,
          }),
          manualBalances: approvalCriteria.predeterminedBalances.manualBalances.map((manualBalance) => {
            return new transfers.bitbadges.bitbadgeschain.badges.ManualBalances({
              ...manualBalance,
              balances: getWrappedBalances(manualBalance.balances),
            })
          }),
        }) : undefined,
        approvalAmounts: approvalCriteria.approvalAmounts ? new transfers.bitbadges.bitbadgeschain.badges.ApprovalAmounts({
          ...approvalCriteria.approvalAmounts,
          overallApprovalAmount: approvalCriteria.approvalAmounts.overallApprovalAmount.toString(),
          perToAddressApprovalAmount: approvalCriteria.approvalAmounts.perToAddressApprovalAmount.toString(),
          perFromAddressApprovalAmount: approvalCriteria.approvalAmounts.perFromAddressApprovalAmount.toString(),
          perInitiatedByAddressApprovalAmount: approvalCriteria.approvalAmounts.perInitiatedByAddressApprovalAmount.toString(),
        }) : undefined,
        maxNumTransfers: approvalCriteria.maxNumTransfers ? new transfers.bitbadges.bitbadgeschain.badges.MaxNumTransfers({
          ...approvalCriteria.maxNumTransfers,
          overallMaxNumTransfers: approvalCriteria.maxNumTransfers.overallMaxNumTransfers.toString(),
          perToAddressMaxNumTransfers: approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers.toString(),
          perFromAddressMaxNumTransfers: approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers.toString(),
          perInitiatedByAddressMaxNumTransfers: approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers.toString(),
        }) : undefined
      }) : undefined,
    })
  })
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
