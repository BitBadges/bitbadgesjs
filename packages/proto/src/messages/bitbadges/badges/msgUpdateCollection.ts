import * as balances from '../../../proto/badges/balances'
import * as metadata from '../../../proto/badges/metadata'
import * as timelines from '../../../proto/badges/timelines'
import * as tx from '../../../proto/badges/tx'
import { UserApprovedIncomingTransferTimeline, UserApprovedOutgoingTransferTimeline } from './typeutils/approvedTransfers'
import { CollectionPermissions, UserPermissions } from './typeutils/permissions'
import { BadgeMetadataTimeline, Balance, CollectionApprovedTransferTimeline, CollectionMetadataTimeline, ContractAddressTimeline, CustomDataTimeline, InheritedBalancesTimeline, IsArchivedTimeline, ManagerTimeline, OffChainBalancesMetadataTimeline, StandardsTimeline } from './typeutils/typeUtils'
import { getWrappedBadgeIds, getWrappedBalances, getWrappedCollectionApprovedTransfersTimeline, getWrappedCollectionPermissions, getWrappedIncomingTransfersTimeline, getWrappedOutgoingTransfersTimeline, getWrappedUserPermissions } from './typeutils/wrappers'


export function createMsgUpdateCollection(
  creator: string,
  collectionId: bigint,
  balancesType: string,
  defaultApprovedOutgoingTransfersTimeline: UserApprovedOutgoingTransferTimeline[],
  defaultApprovedIncomingTransfersTimeline: UserApprovedIncomingTransferTimeline[],
  defaultUserPermissions: UserPermissions,
  badgesToCreate: Balance[],
  updateCollectionPermissions: boolean,
  collectionPermissions: CollectionPermissions,
  updateManagerTimeline: boolean,
  managerTimeline: ManagerTimeline[],
  updateCollectionMetadataTimeline: boolean,
  collectionMetadataTimeline: CollectionMetadataTimeline[],
  updateBadgeMetadataTimeline: boolean,
  badgeMetadataTimeline: BadgeMetadataTimeline[],
  updateOffChainBalancesMetadataTimeline: boolean,
  offChainBalancesMetadataTimeline: OffChainBalancesMetadataTimeline[],
  updateCustomDataTimeline: boolean,
  customDataTimeline: CustomDataTimeline[],
  updateInheritedBalancesTimeline: boolean,
  inheritedBalancesTimeline: InheritedBalancesTimeline[],
  updateCollectionApprovedTransfersTimeline: boolean,
  collectionApprovedTransfersTimeline: CollectionApprovedTransferTimeline[],
  updateStandardsTimeline: boolean,
  standardsTimeline: StandardsTimeline[],
  updateContractAddressTimeline: boolean,
  contractAddressTimeline: ContractAddressTimeline[],
  updateIsArchivedTimeline: boolean,
  isArchivedTimeline: IsArchivedTimeline[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdateCollection({
    creator,
    collectionId: collectionId.toString(),
    balancesType,
    defaultApprovedOutgoingTransfersTimeline: getWrappedOutgoingTransfersTimeline(defaultApprovedOutgoingTransfersTimeline),
    defaultApprovedIncomingTransfersTimeline: getWrappedIncomingTransfersTimeline(defaultApprovedIncomingTransfersTimeline),
    defaultUserPermissions: getWrappedUserPermissions(defaultUserPermissions),
    badgesToCreate: getWrappedBalances(badgesToCreate),
    updateCollectionPermissions,
    collectionPermissions: getWrappedCollectionPermissions(collectionPermissions),
    updateManagerTimeline,
    managerTimeline: managerTimeline.map((managerTimeline) => new timelines.bitbadges.bitbadgeschain.badges.ManagerTimeline({
      ...managerTimeline,
      timelineTimes: getWrappedBadgeIds(managerTimeline.timelineTimes),
    })),
    updateCollectionMetadataTimeline,
    collectionMetadataTimeline: collectionMetadataTimeline.map((collectionMetadataTimeline) => new timelines.bitbadges.bitbadgeschain.badges.CollectionMetadataTimeline({
      ...collectionMetadataTimeline,
      timelineTimes: getWrappedBadgeIds(collectionMetadataTimeline.timelineTimes),
      collectionMetadata: new metadata.bitbadges.bitbadgeschain.badges.CollectionMetadata({ ...collectionMetadataTimeline.collectionMetadata }),
    })),
    updateBadgeMetadataTimeline,
    badgeMetadataTimeline: badgeMetadataTimeline.map((badgeMetadataTimeline) => new timelines.bitbadges.bitbadgeschain.badges.BadgeMetadataTimeline({
      ...badgeMetadataTimeline,
      timelineTimes: getWrappedBadgeIds(badgeMetadataTimeline.timelineTimes),
      badgeMetadata: badgeMetadataTimeline.badgeMetadata.map((badgeMetadata) => new metadata.bitbadges.bitbadgeschain.badges.BadgeMetadata({
        ...badgeMetadata,
        badgeIds: getWrappedBadgeIds(badgeMetadata.badgeIds),
      })),
    })),
    updateOffChainBalancesMetadataTimeline,
    offChainBalancesMetadataTimeline: offChainBalancesMetadataTimeline.map((offChainBalancesMetadataTimeline) => new timelines.bitbadges.bitbadgeschain.badges.OffChainBalancesMetadataTimeline({
      ...offChainBalancesMetadataTimeline,
      timelineTimes: getWrappedBadgeIds(offChainBalancesMetadataTimeline.timelineTimes),
      offChainBalancesMetadata: new metadata.bitbadges.bitbadgeschain.badges.OffChainBalancesMetadata({ ...offChainBalancesMetadataTimeline.offChainBalancesMetadata }),
    })),
    updateCustomDataTimeline,
    customDataTimeline: customDataTimeline.map((customDataTimeline) => new timelines.bitbadges.bitbadgeschain.badges.CustomDataTimeline({
      ...customDataTimeline,
      timelineTimes: getWrappedBadgeIds(customDataTimeline.timelineTimes),
    })),
    updateInheritedBalancesTimeline,
    inheritedBalancesTimeline: inheritedBalancesTimeline.map((inheritedBalancesTimeline) => new timelines.bitbadges.bitbadgeschain.badges.InheritedBalancesTimeline({
      ...inheritedBalancesTimeline,
      timelineTimes: getWrappedBadgeIds(inheritedBalancesTimeline.timelineTimes),
      inheritedBalances: inheritedBalancesTimeline.inheritedBalances.map((inheritedBalance) => new balances.bitbadges.bitbadgeschain.badges.InheritedBalance({
        ...inheritedBalance,
        badgeIds: getWrappedBadgeIds(inheritedBalance.badgeIds),
        parentBadgeIds: getWrappedBadgeIds(inheritedBalance.parentBadgeIds),
        parentCollectionId: inheritedBalance.parentCollectionId.toString(),
      })),
    })),
    updateCollectionApprovedTransfersTimeline,
    collectionApprovedTransfersTimeline: getWrappedCollectionApprovedTransfersTimeline(collectionApprovedTransfersTimeline),
    updateStandardsTimeline,
    standardsTimeline: standardsTimeline.map((standardsTimeline) => new timelines.bitbadges.bitbadgeschain.badges.StandardsTimeline({
      ...standardsTimeline,
      timelineTimes: getWrappedBadgeIds(standardsTimeline.timelineTimes),
    })),
    updateContractAddressTimeline,
    contractAddressTimeline: contractAddressTimeline.map((contractAddressTimeline) => new timelines.bitbadges.bitbadgeschain.badges.ContractAddressTimeline({
      ...contractAddressTimeline,
      timelineTimes: getWrappedBadgeIds(contractAddressTimeline.timelineTimes),
    })),
    updateIsArchivedTimeline,
    isArchivedTimeline: isArchivedTimeline.map((isArchivedTimeline) => new timelines.bitbadges.bitbadgeschain.badges.IsArchivedTimeline({
      ...isArchivedTimeline,
      timelineTimes: getWrappedBadgeIds(isArchivedTimeline.timelineTimes),
    })),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateCollection',
  }
}
