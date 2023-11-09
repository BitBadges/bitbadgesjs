import * as tx from '../../../proto/badges/tx'
import { NumberType, Stringify } from './string-numbers'
import { CollectionApproval, UserIncomingApproval, UserOutgoingApproval, convertCollectionApproval, convertUserIncomingApproval, convertUserOutgoingApproval } from './typeutils/approvals'
import { CollectionPermissions, UserPermissions, convertCollectionPermissions, convertUserPermissions } from './typeutils/permissions'
import { BadgeMetadataTimeline, Balance, CollectionMetadataTimeline, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, OffChainBalancesMetadataTimeline, StandardsTimeline, convertBadgeMetadataTimeline, convertBalance, convertCollectionMetadataTimeline, convertCustomDataTimeline, convertIsArchivedTimeline, convertManagerTimeline, convertOffChainBalancesMetadataTimeline, convertStandardsTimeline } from './typeutils/typeUtils'
import { getWrappedBadgeMetadataTimeline, getWrappedBalances, getWrappedCollectionApprovals, getWrappedCollectionMetadataTimeline, getWrappedCollectionPermissions, getWrappedCustomDataTimeline, getWrappedIncomingTransfers, getWrappedIsArchivedTimeline, getWrappedManagerTimeline, getWrappedOffChainBalancesMetadataTimeline, getWrappedOutgoingTransfers, getWrappedStandardsTimeline, getWrappedUserPermissions } from './typeutils/wrappers'



export function createMsgUpdateCollection<T extends NumberType>(
  creator: string,
  collectionId: T,
  balancesType: string,
  defaultOutgoingApprovals: UserOutgoingApproval<T>[],
  defaultIncomingApprovals: UserIncomingApproval<T>[],
  defaultAutoApproveSelfInitiatedOutgoingTransfers: boolean,
  defaultAutoApproveSelfInitiatedIncomingTransfers: boolean,
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
  updateCollectionApprovals: boolean,
  collectionApprovals: CollectionApproval<T>[],
  updateStandardsTimeline: boolean,
  standardsTimeline: StandardsTimeline<T>[],
  updateIsArchivedTimeline: boolean,
  isArchivedTimeline: IsArchivedTimeline<T>[],
) {
  const message = new tx.badges.MsgUpdateCollection({
    creator,
    collectionId: collectionId.toString(),
    balancesType,
    defaultOutgoingApprovals: getWrappedOutgoingTransfers(defaultOutgoingApprovals.map(x => convertUserOutgoingApproval(x, Stringify, true))),
    defaultIncomingApprovals: getWrappedIncomingTransfers(defaultIncomingApprovals.map(x => convertUserIncomingApproval(x, Stringify, true))),
    defaultAutoApproveSelfInitiatedOutgoingTransfers,
    defaultAutoApproveSelfInitiatedIncomingTransfers,
    defaultUserPermissions: getWrappedUserPermissions(convertUserPermissions(defaultUserPermissions, Stringify, true)),
    badgesToCreate: getWrappedBalances(badgesToCreate.map(x => convertBalance(x, Stringify))),
    updateCollectionPermissions,
    collectionPermissions: getWrappedCollectionPermissions(convertCollectionPermissions(collectionPermissions, Stringify, true)),
    updateManagerTimeline,
    managerTimeline: getWrappedManagerTimeline(managerTimeline.map(x => convertManagerTimeline(x, Stringify))),
    updateCollectionMetadataTimeline,
    collectionMetadataTimeline: getWrappedCollectionMetadataTimeline(collectionMetadataTimeline.map(x => convertCollectionMetadataTimeline(x, Stringify))),
    updateBadgeMetadataTimeline,
    badgeMetadataTimeline: getWrappedBadgeMetadataTimeline(badgeMetadataTimeline.map(x => convertBadgeMetadataTimeline(x, Stringify))),
    updateOffChainBalancesMetadataTimeline,
    offChainBalancesMetadataTimeline: getWrappedOffChainBalancesMetadataTimeline(offChainBalancesMetadataTimeline.map(x => convertOffChainBalancesMetadataTimeline(x, Stringify))),
    updateCustomDataTimeline,
    customDataTimeline: getWrappedCustomDataTimeline(customDataTimeline.map(x => convertCustomDataTimeline(x, Stringify))),
    // inheritedCollectionId: inheritedCollectionId.toString(),
    updateCollectionApprovals,
    collectionApprovals: getWrappedCollectionApprovals(collectionApprovals.map(x => convertCollectionApproval(x, Stringify, true))),
    updateStandardsTimeline,
    standardsTimeline: getWrappedStandardsTimeline(standardsTimeline.map(x => convertStandardsTimeline(x, Stringify))),
    updateIsArchivedTimeline,
    isArchivedTimeline: getWrappedIsArchivedTimeline(isArchivedTimeline.map(x => convertIsArchivedTimeline(x, Stringify))),
  })

  return {
    message,
    path: 'badges.MsgUpdateCollection',
  }
}
