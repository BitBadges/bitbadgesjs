import { searchIdRangesForId } from "./idRanges";
import { TransferActivityItem } from "./types/activity";

/**
 * Given a collection's activity, filter out all activity that does not involve the given badgeId.
 *
 * Note it is recommended to fetch the activity from the DB with the badgeId filter applied
 * instead of filtering the collection's activity here. This is because the collection activity
 * is fetched from the DB dynamically and paginated, so it is not guaranteed to be complete.
 */
export function filterActivityByBadgeId(badgeId: number, activity: TransferActivityItem[]) {
  return activity.filter((x) => {
    for (const balance of x.balances) {
      const [_idx, found] = searchIdRangesForId(badgeId, balance.badgeIds);
      if (found) return found;
    }
    return false;
  });
}
