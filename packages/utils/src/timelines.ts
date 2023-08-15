import { BadgeMetadataTimeline, CollectionApprovedTransferTimeline, CollectionMetadataTimeline, ContractAddressTimeline, CustomDataTimeline, InheritedBalancesTimeline, IsArchivedTimeline, ManagerTimeline, OffChainBalancesMetadataTimeline, StandardsTimeline, TimelineItem } from "bitbadgesjs-proto";
import { DefaultPlaceholderMetadata } from "./constants";
import { CollectionApprovedTransferTimelineWithDetails } from "./types/collections";
import { UserApprovedIncomingTransferTimelineWithDetails, UserApprovedOutgoingTransferTimelineWithDetails } from "./types/users";
import { removeUintRangeFromUintRange, searchUintRangesForId } from "./uintRanges";


/**
 * Given a timeline-based field, get the index that corresponds to the value for the current time (Date.now()).
 *
 * @category Timelines
 */
/**
 * @category Timelines
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

  if (unhandledTimes.length === 0) {
    return timeline;
  }

  timeline.push({
    [fieldName]: emptyValue,
    timelineTimes: unhandledTimes,
  } as T);

  return timeline;
}

/**
 * @category Timelines
 */
export function getFullManagerTimeline(timeline: ManagerTimeline<bigint>[]): ManagerTimeline<bigint>[] {
  return getFullTimeline(timeline, "manager", "");
}

/**
 * @category Timelines
 */
export function getFullCollectionMetadataTimeline(timeline: CollectionMetadataTimeline<bigint>[]): CollectionMetadataTimeline<bigint>[] {
  return getFullTimeline(timeline, "collectionMetadata", DefaultPlaceholderMetadata);
}

/**
 * @category Timelines
 */
export function getFullBadgeMetadataTimeline(timeline: BadgeMetadataTimeline<bigint>[]): BadgeMetadataTimeline<bigint>[] {
  return getFullTimeline(timeline, "badgeMetadata", []);
}

/**
 * @category Timelines
 */
export function getOffChainBalancesMetadataTimeline(timeline: OffChainBalancesMetadataTimeline<bigint>[]): OffChainBalancesMetadataTimeline<bigint>[] {
  return getFullTimeline(timeline, "offChainBalancesMetadata", {
    uri: '',
    customData: '',
  });
}

/**
 * @category Timelines
 */
export function getFullCustomDataTimeline(timeline: CustomDataTimeline<bigint>[]): CustomDataTimeline<bigint>[] {
  return getFullTimeline(timeline, "customData", "");
}

/**
 * @category Timelines
 */
export function getFullCollectionApprovedTransfersTimeline(timeline: CollectionApprovedTransferTimelineWithDetails<bigint>[]): CollectionApprovedTransferTimeline<bigint>[] {
  return getFullTimeline(timeline, "collectionApprovedTransfers", []);
}

/**
 * @category Timelines
 */
export function getFullStandardsTimeline(timeline: StandardsTimeline<bigint>[]): StandardsTimeline<bigint>[] {
  return getFullTimeline(timeline, "standards", []);
}

/**
 * @category Timelines
 */
export function getFullIsArchivedTimeline(timeline: IsArchivedTimeline<bigint>[]): IsArchivedTimeline<bigint>[] {
  return getFullTimeline(timeline, "isArchived", false);
}

/**
 * @category Timelines
 */
export function getInheritedBalancesTimeline(timeline: InheritedBalancesTimeline<bigint>[]): InheritedBalancesTimeline<bigint>[] {
  return getFullTimeline(timeline, "inheritedBalances", []);
}

/**
 * @category Timelines
 */
export function getFullContractAddressTimeline(timeline: ContractAddressTimeline<bigint>[]): ContractAddressTimeline<bigint>[] {
  return getFullTimeline(timeline, "contractAddress", "");
}

/**
 * @category Timelines
 */
export function getFullDefaultUserApprovedIncomingTransfersTimeline(timeline: UserApprovedIncomingTransferTimelineWithDetails<bigint>[]): UserApprovedIncomingTransferTimelineWithDetails<bigint>[] {
  return getFullTimeline(timeline, "approvedIncomingTransfers", []);
}

/**
 * @category Timelines
 */
export function getFullDefaultUserApprovedOutgoingTransfersTimeline(timeline: UserApprovedOutgoingTransferTimelineWithDetails<bigint>[]): UserApprovedOutgoingTransferTimelineWithDetails<bigint>[] {
  return getFullTimeline(timeline, "approvedOutgoingTransfers", []);
}
