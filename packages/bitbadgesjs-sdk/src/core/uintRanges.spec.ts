import { GO_MAX_UINT_64 } from '.';
import { UintRange, UintRangeArray } from './uintRanges';

describe('UintRange and UintRangeArray', () => {
  // Singular range functions
  test('UintRange', () => {
    const range = new UintRange<bigint>({ start: 1n, end: 10n });
    expect(range.size() === 10n).toBe(true);

    const fullRange = UintRange.FullRange();
    expect(fullRange.isFull()).toBe(true);

    const inverted = range.invert();
    expect(inverted[0].start === 11n).toBe(true);
    expect(inverted[0].end === GO_MAX_UINT_64).toBe(true);

    const overlaps = range.overlaps(inverted);
    expect(overlaps).toBe(false);

    const doesFiveExist = range.search(5n);
    expect(doesFiveExist).toBe(true);

    const overlapDetails = range.getOverlapDetails(inverted);
    const remaining = overlapDetails[0];
    const overlapsArr = overlapDetails[1];

    expect(remaining[0].start === 1n).toBe(true);
    expect(remaining[0].end === 10n).toBe(true);
    expect(overlapsArr.length === 0).toBe(true);

    // // const overlapDetails = range.getOverlapDetails(fullRange);
    // // expect(overlapDetails).toEqual([[], [{ start: 1n, end: 10n }], [{ start: 11n, end: GO_MAX_UINT_64 }]]);

    const overlappingRanges = range.getOverlaps(fullRange);
    expect(overlappingRanges[0].start === 1n).toBe(true);
    expect(overlappingRanges[0].end === 10n).toBe(true);
  });

  test('UintRangeArray', () => {
    const rangeArr = UintRangeArray.From<bigint>([
      { start: 1n, end: 10n },
      { start: 11n, end: 20n }
    ]);
    expect(rangeArr.size() === 20n).toBe(true);

    const rangeArrFull = UintRangeArray.FullRanges();
    expect(rangeArrFull.isFull()).toBe(true);

    const rangeArrInverted = rangeArr.toInverted({ start: 1n, end: GO_MAX_UINT_64 });
    expect(rangeArrInverted[0].start === 21n).toBe(true);
    expect(rangeArrInverted[0].end === GO_MAX_UINT_64).toBe(true);

    const unsortedArr = UintRangeArray.From<bigint>([
      { start: 11n, end: 20n },
      { start: 1n, end: 15n }
    ]);
    expect(unsortedArr.hasOverlaps()).toBe(true);

    unsortedArr.sortAndMerge();
    expect(unsortedArr).toEqual([{ start: 1n, end: 20n }]);

    const sortedArr = unsortedArr.clone();
    const [inCurrButNotOther, overlaps, inOtherButNotCurr] = sortedArr.getOverlapDetails(unsortedArr);
    expect(inCurrButNotOther.length === 0).toBe(true);
    expect(overlaps.length === 1).toBe(true);
    expect(inOtherButNotCurr.length === 0).toBe(true);

    sortedArr.remove({ start: 1n, end: 10n });
    expect(sortedArr.size() === 10n).toBe(true);
    expect(sortedArr[0].start === 11n).toBe(true);
    expect(sortedArr[0].end === 20n).toBe(true);

    const [idx, found] = sortedArr.search(11n);
    expect(found).toBe(true);

    const exists = sortedArr.searchIfExists(11n);
    expect(exists).toBe(true);

    const index = sortedArr.searchIndex(11n);
    expect(index === 0n).toBe(true);
  });
});
