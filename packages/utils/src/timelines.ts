import { BadgeMetadataTimeline, CollectionMetadataTimeline, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, NumberType, OffChainBalancesMetadataTimeline, StandardsTimeline, TimelineItem } from "bitbadgesjs-proto";
import { DefaultPlaceholderMetadata } from "./constants";
import { BitBadgesCollection } from "./types/collections";
import { removeUintRangesFromUintRanges, searchUintRangesForId } from "./uintRanges";


/**
 * @category Timelines
 */
export function getValuesAtTimeForCollection(collection: BitBadgesCollection<bigint>, time?: NumberType) {
  return {
    manager: getValueAtTimeForTimeline(collection.managerTimeline, time)?.manager ?? "",
    collectionMetadata: getValueAtTimeForTimeline(collection.collectionMetadataTimeline, time)?.collectionMetadata ?? {
      uri: '',
      customData: '',
    },
    badgeMetadata: getValueAtTimeForTimeline(collection.badgeMetadataTimeline, time)?.badgeMetadata ?? [],
    offChainBalancesMetadata: getValueAtTimeForTimeline(collection.offChainBalancesMetadataTimeline, time)?.offChainBalancesMetadata ?? {
      uri: '',
      customData: '',
    },
    customData: getValueAtTimeForTimeline(collection.customDataTimeline, time)?.customData ?? "",
    standards: getValueAtTimeForTimeline(collection.standardsTimeline, time)?.standards ?? [],
    isArchived: getValueAtTimeForTimeline(collection.isArchivedTimeline, time)?.isArchived ?? false,
  }
}


/**
 * @category Timelines
 */
export function getCurrentValuesForCollection(collection: BitBadgesCollection<bigint>) {
  return getValuesAtTimeForCollection(collection, BigInt(Date.now()));
}

/**
 * @category Timelines
 */
export function getCurrentValueForTimeline<T extends TimelineItem<bigint>>(timeline: T[]): T | undefined {
  return getValueAtTimeForTimeline(timeline, BigInt(Date.now()));
}

/**
 * @category Timelines
 */
export function getCurrentIdxForTimeline(timeline: TimelineItem<bigint>[]): number {
  return getIdxAtTimeForTimeline(timeline, BigInt(Date.now()));
}

/**
 * Gets a value for a timeline-based field at a specific time (Date.now() by default).
 *
 * @category Timelines
 */
export function getValueAtTimeForTimeline<T extends TimelineItem<bigint>>(timeline: T[], time?: NumberType): T | undefined {
  const timeToCheck = time ?? BigInt(Date.now())

  for (const timelineItem of timeline) {
    const timelineTimes = timelineItem.timelineTimes;
    const [, found] = searchUintRangesForId(BigInt(timeToCheck), timelineTimes);
    if (found) {
      return timelineItem;
    }
  }

  return undefined;
}


/**
 * Given a timeline-based field, get the index that the value is at for a specific time (Date.now() by default).
 *
 * @category Timelines
 */
/**
 * @category Timelines
 */
export function getIdxAtTimeForTimeline(timeline: TimelineItem<bigint>[], time?: NumberType): number {
  const timeToCheck = time ?? BigInt(Date.now());

  for (const timelineItem of timeline) {
    const timelineTimes = timelineItem.timelineTimes;
    const [idx, found] = searchUintRangesForId(BigInt(timeToCheck), timelineTimes);
    if (found) {
      return Number(idx);
    }
  }

  return Number(-1);
}

/**
 * Given a timeline-based field, return a new timeline with all possible times handled.
 */
function getFullTimeline<T extends TimelineItem<bigint>>(timeline: T[], fieldName: string, emptyValue: any, maxTime = 18446744073709551615n): T[] {
  let unhandledTimes = [{ start: BigInt(1n), end: maxTime }];
  for (const timelineVal of timeline) {
    const [remaining, _removed] = removeUintRangesFromUintRanges(timelineVal.timelineTimes, unhandledTimes);
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
export function getFullStandardsTimeline(timeline: StandardsTimeline<bigint>[]): StandardsTimeline<bigint>[] {
  return getFullTimeline(timeline, "standards", []);
}

/**
 * @category Timelines
 */
export function getFullIsArchivedTimeline(timeline: IsArchivedTimeline<bigint>[]): IsArchivedTimeline<bigint>[] {
  return getFullTimeline(timeline, "isArchived", false);
}

// /**
//  * @category Timelines
//  */
// export function getInheritedBalancesTimeline(timeline: InheritedBalancesTimeline<bigint>[]): InheritedBalancesTimeline<bigint>[] {
//   return getFullTimeline(timeline, "inheritedBalances", []);
// }
