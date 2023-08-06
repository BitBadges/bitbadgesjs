import { BadgeMetadata, BadgeMetadataTimeline, CollectionMetadata, CollectionMetadataTimeline, ContractAddressTimeline, CustomDataTimeline, InheritedBalance, InheritedBalancesTimeline, IsArchivedTimeline, ManagerTimeline, OffChainBalancesMetadata, OffChainBalancesMetadataTimeline, StandardsTimeline, UintRange } from "bitbadgesjs-proto";
import { CollectionApprovedTransferTimelineWithDetails, CollectionApprovedTransferWithDetails } from "./types/collections";

export function getIsArchivedTimesAndValues(isArchivedTimeline: IsArchivedTimeline<bigint>[]): { times: UintRange<bigint>[][], values: boolean[] } {
  let times: UintRange<bigint>[][] = [];
  let values: boolean[] = [];

  for (let timelineVal of isArchivedTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.isArchived);
  }

  return { times, values };
}

export function getCollectionApprovedTransferTimesAndValues(approvedTransfers: CollectionApprovedTransferTimelineWithDetails<bigint>[]): { times: UintRange<bigint>[][], values: CollectionApprovedTransferWithDetails<bigint>[][] } {
  let times: UintRange<bigint>[][] = [];
  let values: CollectionApprovedTransferWithDetails<bigint>[][] = [];

  for (let timelineVal of approvedTransfers) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.collectionApprovedTransfers);
  }

  return { times, values };
}

// export function getUserApprovedOutgoingTransferTimesAndValues(approvedTransfers: UserApprovedOutgoingTransferTimeline<bigint>[]): { times: UintRange<bigint>[][], values: ApprovedTransfer[] } {
//   let times: UintRange<bigint>[][] = [];
//   let values: ApprovedTransfer[] = [];

//   for (let timelineVal of approvedTransfers) {
//     times.push(timelineVal.timelineTimes);
//     values.push(timelineVal.approvedOutgoingTransfers);
//   }

//   return { times, values };
// }

// export function getUserApprovedIncomingTransferTimesAndValues(approvedTransfers: UserApprovedIncomingTransferTimeline<bigint>[]): { times: UintRange<bigint>[][], values: ApprovedTransfer[] } {
//   let times: UintRange<bigint>[][] = [];
//   let values: ApprovedTransfer[] = [];

//   for (let timelineVal of approvedTransfers) {
//     times.push(timelineVal.timelineTimes);
//     values.push(timelineVal.approvedIncomingTransfers);
//   }

//   return { times, values };
// }

export function getInheritedBalancesTimesAndValues(inheritedBalances: InheritedBalancesTimeline<bigint>[]): { times: UintRange<bigint>[][], values: InheritedBalance<bigint>[][] } {
  let times: UintRange<bigint>[][] = [];
  let values: InheritedBalance<bigint>[][] = [];

  for (let timelineVal of inheritedBalances) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.inheritedBalances);
  }

  return { times, values };
}

export function getOffChainBalancesMetadataTimesAndValues(inheritedBalancesMetadata: OffChainBalancesMetadataTimeline<bigint>[]): { times: UintRange<bigint>[][], values: OffChainBalancesMetadata[] } {
  let times: UintRange<bigint>[][] = [];
  let values: OffChainBalancesMetadata[] = [];

  for (let timelineVal of inheritedBalancesMetadata) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.offChainBalancesMetadata);
  }

  return { times, values };
}

export function getCollectionMetadataTimesAndValues(timeline: CollectionMetadataTimeline<bigint>[]): { times: UintRange<bigint>[][], values: CollectionMetadata[] } {
  let times: UintRange<bigint>[][] = [];
  let values: CollectionMetadata[] = [];

  for (let timelineVal of timeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.collectionMetadata);
  }

  return { times, values };
}

export function getBadgeMetadataTimesAndValues(timeline: BadgeMetadataTimeline<bigint>[]): { times: UintRange<bigint>[][], values: BadgeMetadata<bigint>[][] } {
  let times: UintRange<bigint>[][] = [];
  let values: BadgeMetadata<bigint>[][] = [];

  for (let timelineVal of timeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.badgeMetadata);
  }

  return { times, values };
}

export function getManagerTimesAndValues(managerTimeline: ManagerTimeline<bigint>[]): { times: UintRange<bigint>[][], values: string[] } {
  let times: UintRange<bigint>[][] = [];
  let values: string[] = [];

  for (let timelineVal of managerTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.manager);
  }

  return { times, values };
}

export function getContractAddressTimesAndValues(contractAddressTimeline: ContractAddressTimeline<bigint>[]): { times: UintRange<bigint>[][], values: string[] } {
  let times: UintRange<bigint>[][] = [];
  let values: string[] = [];

  for (let timelineVal of contractAddressTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.contractAddress);
  }

  return { times, values };
}

export function getCustomDataTimesAndValues(customDataTimeline: CustomDataTimeline<bigint>[]): { times: UintRange<bigint>[][], values: string[] } {
  let times: UintRange<bigint>[][] = [];
  let values: string[] = [];

  for (let timelineVal of customDataTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.customData);
  }

  return { times, values };
}

export function getStandardsTimesAndValues(standardsTimeline: StandardsTimeline<bigint>[]): { times: UintRange<bigint>[][], values: string[][] } {
  let times: UintRange<bigint>[][] = [];
  let values: string[][] = [];

  for (let timelineVal of standardsTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.standards);
  }

  return { times, values };
}
