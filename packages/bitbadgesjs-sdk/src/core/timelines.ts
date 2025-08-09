import type {
  TokenMetadataTimeline,
  CollectionMetadataTimeline,
  CustomDataTimeline,
  IsArchivedTimeline,
  ManagerTimeline,
  OffChainBalancesMetadataTimeline,
  StandardsTimeline,
  TimelineItem
} from './misc.js';
import type { NumberType } from '../common/string-numbers.js';
import { UintRangeArray } from './uintRanges.js';
import { GO_MAX_UINT_64 } from '@/common/math.js';
import { Metadata } from '@/api-indexer/metadata/metadata.js';
import { getConverterFunction } from '@/common/base.js';

/**
 * @category Timelines
 */
export function getCurrentValueForTimeline<U extends NumberType, T extends TimelineItem<U>>(timeline: T[]): T | undefined {
  return getValueAtTimeForTimeline(timeline, BigInt(Date.now()));
}

/**
 * @category Timelines
 */
export function getCurrentIdxForTimeline<U extends NumberType, T extends TimelineItem<U>>(timeline: T[]): number {
  return getIdxAtTimeForTimeline(timeline, BigInt(Date.now()));
}

/**
 * Gets a value for a timeline-based field at a specific time (Date.now() by default).
 *
 * @category Timelines
 */
export function getValueAtTimeForTimeline<U extends NumberType, T extends TimelineItem<U>>(timeline: T[], time?: NumberType): T | undefined {
  if (timeline.length === 0 || timeline[0].timelineTimes.length === 0) {
    return undefined;
  }

  const converterFunction = getConverterFunction(timeline[0].timelineTimes[0].start);

  const timeToCheck = time ?? BigInt(Date.now());

  for (const timelineItem of timeline) {
    const timelineTimes = timelineItem.timelineTimes;
    const [, found] = timelineTimes.search(converterFunction(timeToCheck));
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
export function getIdxAtTimeForTimeline<U extends NumberType, T extends TimelineItem<U>>(timeline: T[], time?: NumberType): number {
  if (timeline.length === 0) {
    return -1;
  }

  const converterFunction = getConverterFunction(timeline[0].timelineTimes[0].start);

  const timeToCheck = time ?? BigInt(Date.now());

  for (const timelineItem of timeline) {
    const timelineTimes = timelineItem.timelineTimes;
    const [idx, found] = timelineTimes.search(converterFunction(timeToCheck));
    if (found) {
      return Number(idx);
    }
  }

  return Number(-1);
}

/**
 * Given a timeline-based field, return a new timeline with all possible times handled with the emptyValue.
 *
 * @category Timelines
 */
function getFullTimeline<U extends bigint, T extends TimelineItem<U>>(timeline: T[], fieldName: string, emptyValue: any, maxTime?: U): T[] {
  const unhandledTimes = UintRangeArray.From([{ start: BigInt(1n), end: maxTime ?? GO_MAX_UINT_64 }]);
  for (const timelineVal of timeline) {
    unhandledTimes.remove(timelineVal.timelineTimes);
  }

  const newTimeline = timeline.map((x) => x.clone()) as T[];

  if (unhandledTimes.length === 0) {
    return newTimeline;
  }

  newTimeline.push({
    [fieldName]: emptyValue,
    timelineTimes: unhandledTimes
  } as T);

  return timeline;
}

/**
 * @category Timelines
 */
export function getFullManagerTimeline<U extends bigint>(timeline: ManagerTimeline<U>[]): ManagerTimeline<U>[] {
  return getFullTimeline(timeline, 'manager', '');
}

/**
 * @category Timelines
 */
export function getFullCollectionMetadataTimeline<U extends bigint>(timeline: CollectionMetadataTimeline<U>[]): CollectionMetadataTimeline<U>[] {
  return getFullTimeline(timeline, 'collectionMetadata', Metadata.DefaultPlaceholderMetadata() as Metadata<U>);
}

/**
 * @category Timelines
 */
export function getFullTokenMetadataTimeline<U extends bigint>(timeline: TokenMetadataTimeline<U>[]): TokenMetadataTimeline<U>[] {
  return getFullTimeline(timeline, 'tokenMetadata', []);
}

/**
 * @category Timelines
 */
export function getOffChainBalancesMetadataTimeline<U extends bigint>(
  timeline: OffChainBalancesMetadataTimeline<U>[]
): OffChainBalancesMetadataTimeline<U>[] {
  return getFullTimeline(timeline, 'offChainBalancesMetadata', {
    uri: '',
    customData: ''
  });
}

/**
 * @category Timelines
 */
export function getFullCustomDataTimeline<U extends bigint>(timeline: CustomDataTimeline<U>[]): CustomDataTimeline<U>[] {
  return getFullTimeline(timeline, 'customData', '');
}

/**
 * @category Timelines
 */
export function getFullStandardsTimeline<U extends bigint>(timeline: StandardsTimeline<U>[]): StandardsTimeline<U>[] {
  return getFullTimeline(timeline, 'standards', []);
}

/**
 * @category Timelines
 */
export function getFullIsArchivedTimeline<U extends bigint>(timeline: IsArchivedTimeline<U>[]): IsArchivedTimeline<U>[] {
  return getFullTimeline(timeline, 'isArchived', false);
}
