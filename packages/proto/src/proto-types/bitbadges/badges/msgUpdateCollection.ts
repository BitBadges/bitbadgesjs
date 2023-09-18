import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'
import { CollectionApprovedTransfer, UserApprovedIncomingTransfer, UserApprovedOutgoingTransfer } from './typeutils/approvedTransfers'
import { CollectionPermissions, UserPermissions } from './typeutils/permissions'
import { BadgeMetadataTimeline, Balance, CollectionMetadataTimeline, ContractAddressTimeline, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, OffChainBalancesMetadataTimeline, StandardsTimeline } from './typeutils/typeUtils'
import { getWrappedBadgeMetadataTimeline, getWrappedBalances, getWrappedCollectionApprovedTransfers, getWrappedCollectionMetadataTimeline, getWrappedCollectionPermissions, getWrappedContractAddressTimeline, getWrappedCustomDataTimeline, getWrappedIncomingTransfers, getWrappedIsArchivedTimeline, getWrappedManagerTimeline, getWrappedOffChainBalancesMetadataTimeline, getWrappedOutgoingTransfers, getWrappedStandardsTimeline, getWrappedUserPermissions } from './typeutils/wrappers'



export function createMsgUpdateCollection<T extends NumberType>(
  creator: string,
  collectionId: T,
  balancesType: string,
  defaultApprovedOutgoingTransfers: UserApprovedOutgoingTransfer<T>[],
  defaultApprovedIncomingTransfers: UserApprovedIncomingTransfer<T>[],
  defaultUserPermissions: UserPermissions<T>,
  badgesToCreate: Balance<T>[],
  updateCollectionPermissions: boolean,
  collectionPermissions: CollectionPermissions<T>,
  updateManagerTimeline: boolean,
  managerTimeline: ManagerTimeline<T>[],
  updateCollectionMetadataTimeline: boolean,
  collectionMetadataTimeline: CollectionMetadataTimeline<T>[],
  updateBadgeMetadataTimeline: boolean,
  badgeMetadataTimeline: BadgeMetadataTimeline<T>[],
  updateOffChainBalancesMetadataTimeline: boolean,
  offChainBalancesMetadataTimeline: OffChainBalancesMetadataTimeline<T>[],
  updateCustomDataTimeline: boolean,
  customDataTimeline: CustomDataTimeline<T>[],
  // inheritedCollectionId: T,
  updateCollectionApprovedTransfers: boolean,
  collectionApprovedTransfers: CollectionApprovedTransfer<T>[],
  updateStandardsTimeline: boolean,
  standardsTimeline: StandardsTimeline<T>[],
  updateContractAddressTimeline: boolean,
  contractAddressTimeline: ContractAddressTimeline<T>[],
  updateIsArchivedTimeline: boolean,
  isArchivedTimeline: IsArchivedTimeline<T>[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdateCollection({
    creator,
    collectionId: collectionId.toString(),
    balancesType,
    defaultApprovedOutgoingTransfers: getWrappedOutgoingTransfers(defaultApprovedOutgoingTransfers),
    defaultApprovedIncomingTransfers: getWrappedIncomingTransfers(defaultApprovedIncomingTransfers),
    defaultUserPermissions: getWrappedUserPermissions(defaultUserPermissions),
    badgesToCreate: getWrappedBalances(badgesToCreate),
    updateCollectionPermissions,
    collectionPermissions: getWrappedCollectionPermissions(collectionPermissions),
    updateManagerTimeline,
    managerTimeline: getWrappedManagerTimeline(managerTimeline),
    updateCollectionMetadataTimeline,
    collectionMetadataTimeline: getWrappedCollectionMetadataTimeline(collectionMetadataTimeline),
    updateBadgeMetadataTimeline,
    badgeMetadataTimeline: getWrappedBadgeMetadataTimeline(badgeMetadataTimeline),
    updateOffChainBalancesMetadataTimeline,
    offChainBalancesMetadataTimeline: getWrappedOffChainBalancesMetadataTimeline(offChainBalancesMetadataTimeline),
    updateCustomDataTimeline,
    customDataTimeline: getWrappedCustomDataTimeline(customDataTimeline),
    // inheritedCollectionId: inheritedCollectionId.toString(),
    updateCollectionApprovedTransfers,
    collectionApprovedTransfers: getWrappedCollectionApprovedTransfers(collectionApprovedTransfers),
    updateStandardsTimeline,
    standardsTimeline: getWrappedStandardsTimeline(standardsTimeline),
    updateContractAddressTimeline,
    contractAddressTimeline: getWrappedContractAddressTimeline(contractAddressTimeline),
    updateIsArchivedTimeline,
    isArchivedTimeline: getWrappedIsArchivedTimeline(isArchivedTimeline),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateCollection',
  }
}
