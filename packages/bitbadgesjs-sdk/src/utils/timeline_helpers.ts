import { BadgeMetadata, BadgeMetadataTimeline, CollectionMetadata, CollectionMetadataTimeline, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, OffChainBalancesMetadata, OffChainBalancesMetadataTimeline, StandardsTimeline, UintRange } from "..";

/**
 * @category Timelines
 */
export function getIsArchivedTimesAndValues(isArchivedTimeline: IsArchivedTimeline<bigint>[]): { times: UintRange<bigint>[][], values: boolean[] } {
  let times: UintRange<bigint>[][] = [];
  let values: boolean[] = [];

  for (let timelineVal of isArchivedTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.isArchived);
  }

  return { times, values };
}

/**
 * @category Timelines
 */
export function getOffChainBalancesMetadataTimesAndValues(inheritedBalancesMetadata: OffChainBalancesMetadataTimeline<bigint>[]): { times: UintRange<bigint>[][], values: OffChainBalancesMetadata[] } {
  let times: UintRange<bigint>[][] = [];
  let values: OffChainBalancesMetadata[] = [];

  for (let timelineVal of inheritedBalancesMetadata) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.offChainBalancesMetadata);
  }

  return { times, values };
}

/**
 * @category Timelines
 */
export function getCollectionMetadataTimesAndValues(timeline: CollectionMetadataTimeline<bigint>[]): { times: UintRange<bigint>[][], values: CollectionMetadata[] } {
  let times: UintRange<bigint>[][] = [];
  let values: CollectionMetadata[] = [];

  for (let timelineVal of timeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.collectionMetadata);
  }

  return { times, values };
}

/**
 * @category Timelines
 */
export function getBadgeMetadataTimesAndValues(timeline: BadgeMetadataTimeline<bigint>[]): { times: UintRange<bigint>[][], values: BadgeMetadata<bigint>[][] } {
  let times: UintRange<bigint>[][] = [];
  let values: BadgeMetadata<bigint>[][] = [];

  for (let timelineVal of timeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.badgeMetadata);
  }

  return { times, values };
}

/**
 * @category Timelines
 */
export function getManagerTimesAndValues(managerTimeline: ManagerTimeline<bigint>[]): { times: UintRange<bigint>[][], values: string[] } {
  let times: UintRange<bigint>[][] = [];
  let values: string[] = [];

  for (let timelineVal of managerTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.manager);
  }

  return { times, values };
}

/**
 * @category Timelines
 */
export function getCustomDataTimesAndValues(customDataTimeline: CustomDataTimeline<bigint>[]): { times: UintRange<bigint>[][], values: string[] } {
  let times: UintRange<bigint>[][] = [];
  let values: string[] = [];

  for (let timelineVal of customDataTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.customData);
  }

  return { times, values };
}

/**
 * @category Timelines
 */
export function getStandardsTimesAndValues(standardsTimeline: StandardsTimeline<bigint>[]): { times: UintRange<bigint>[][], values: string[][] } {
  let times: UintRange<bigint>[][] = [];
  let values: string[][] = [];

  for (let timelineVal of standardsTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.standards);
  }

  return { times, values };
}