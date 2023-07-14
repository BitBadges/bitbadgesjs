import { TimelineItem } from "bitbadgesjs-proto";
import { searchUintRangesForId } from "./uintRanges";


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
