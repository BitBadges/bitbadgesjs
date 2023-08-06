import { BadgeMetadataTimeline, CollectionApprovedTransferTimeline, CollectionMetadataTimeline, ContractAddressTimeline, CustomDataTimeline, InheritedBalancesTimeline, IsArchivedTimeline, ManagerTimeline, OffChainBalancesMetadataTimeline, StandardsTimeline, TimelineItem, UserApprovedIncomingTransferTimeline, UserApprovedOutgoingTransferTimeline } from "bitbadgesjs-proto";
import { DefaultPlaceholderMetadata } from "./constants";
import { CollectionApprovedTransferTimelineWithDetails } from "./types/collections";
import { removeUintRangeFromUintRange, searchUintRangesForId } from "./uintRanges";


/**
 * Given a timeline-based field, get the index that corresponds to the value for the current time (Date.now()).
 */
export function getCurrentValueIdxForTimeline(timeline: TimelineItem<bigint>[]): bigint {
  const currentTime = BigInt(Date.now());

  for (const timelineItem of timeline) {
    const timelineTimes = timelineItem.timelineTimes;
    const [idx, found] = searchUintRangesForId(currentTime, timelineTimes);
    if (found) {
      return BigInt(idx);
    }
  }

  return BigInt(-1);
}

/**
 * Given a timeline-based field, return a new timeline with all possible times handled.
 */
function getFullTimeline<T extends TimelineItem<bigint>>(timeline: T[], fieldName: string, emptyValue: any, maxTime = 18446744073709551615n): T[] {
  let unhandledTimes = [{ start: BigInt(1n), end: maxTime }];
  for (const timelineVal of timeline) {
    const [remaining, _removed] = removeUintRangeFromUintRange(timelineVal.timelineTimes, unhandledTimes);
    unhandledTimes = remaining;
  }

  timeline.push({
    [fieldName]: emptyValue,
    timelineTimes: unhandledTimes,
  } as T);

  return timeline;
}

export async function getFullManagerTimeline(timeline: ManagerTimeline<bigint>[]): Promise<ManagerTimeline<bigint>[]> {
  return getFullTimeline(timeline, "manager", "");
}

export async function getFullCollectionMetadataTimeline(timeline: CollectionMetadataTimeline<bigint>[]): Promise<CollectionMetadataTimeline<bigint>[]> {
  return getFullTimeline(timeline, "collectionMetadata", DefaultPlaceholderMetadata);
}

export async function getFullBadgeMetadataTimeline(timeline: BadgeMetadataTimeline<bigint>[]): Promise<BadgeMetadataTimeline<bigint>[]> {
  return getFullTimeline(timeline, "badgeMetadata", []);
}

export async function getOffChainBalancesMetadataTimeline(timeline: OffChainBalancesMetadataTimeline<bigint>[]): Promise<OffChainBalancesMetadataTimeline<bigint>[]> {
  return getFullTimeline(timeline, "offChainBalancesMetadata", {
    uri: '',
    customData: '',
  });
}

export async function getFullCustomDataTimeline(timeline: CustomDataTimeline<bigint>[]): Promise<CustomDataTimeline<bigint>[]> {
  return getFullTimeline(timeline, "customData", "");
}

export async function getFullCollectionApprovedTransfersTimeline(timeline: CollectionApprovedTransferTimeline<bigint>[] | CollectionApprovedTransferTimelineWithDetails<bigint>[]): Promise<CollectionApprovedTransferTimeline<bigint>[] | CollectionApprovedTransferTimelineWithDetails<bigint>[]> {
  return getFullTimeline(timeline, "collectionApprovedTransfers", []);
}

export async function getFullStandardsTimeline(timeline: StandardsTimeline<bigint>[]): Promise<StandardsTimeline<bigint>[]> {
  return getFullTimeline(timeline, "standards", []);
}

export async function getFullIsArchivedTimeline(timeline: IsArchivedTimeline<bigint>[]): Promise<IsArchivedTimeline<bigint>[]> {
  return getFullTimeline(timeline, "isArchived", false);
}

export async function getInheritedBalancesTimeline(timeline: InheritedBalancesTimeline<bigint>[]): Promise<InheritedBalancesTimeline<bigint>[]> {
  return getFullTimeline(timeline, "inheritedBalances", []);
}

export async function getFullContractAddressTimeline(timeline: ContractAddressTimeline<bigint>[]): Promise<ContractAddressTimeline<bigint>[]> {
  return getFullTimeline(timeline, "contractAddress", "");
}

export async function getFullDefaultUserApprovedIncomingTransfersTimeline(timeline: UserApprovedIncomingTransferTimeline<bigint>[]): Promise<UserApprovedIncomingTransferTimeline<bigint>[]> {
  return getFullTimeline(timeline, "approvedIncomingTransfers", []);
}

export async function getFullDefaultUserApprovedOutgoingTransfersTimeline(timeline: UserApprovedOutgoingTransferTimeline<bigint>[]): Promise<UserApprovedOutgoingTransferTimeline<bigint>[]> {
  return getFullTimeline(timeline, "approvedOutgoingTransfers", []);
}
