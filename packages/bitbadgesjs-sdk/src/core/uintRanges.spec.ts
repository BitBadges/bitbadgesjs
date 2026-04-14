import { GO_MAX_UINT_64 } from '../common/math.js';
import { UintRange, UintRangeArray } from './uintRanges.js';

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

  describe('UintRangeArray.From defensive guards', () => {
    it('null/undefined → empty array', () => {
      expect(UintRangeArray.From(null).length).toBe(0);
      expect(UintRangeArray.From(undefined).length).toBe(0);
    });

    it('single-object form accepted', () => {
      const arr = UintRangeArray.From({ start: '1', end: '5' });
      expect(arr.length).toBe(1);
      expect(String(arr[0].start)).toBe('1');
    });

    it('null/undefined elements filtered out (regression: would crash inside new UintRange(null))', () => {
      // Round 4 sweep: subagent caught that From([null]) crashed with
      // "Cannot read properties of null (reading 'start')". The
      // top-level guard wasn't enough — element-level filtering needed.
      const arr = UintRangeArray.From([
        null as any,
        undefined as any,
        { start: '1', end: '5' },
        null as any,
        { start: '7', end: '9' }
      ]);
      expect(arr.length).toBe(2);
      expect(String(arr[0].start)).toBe('1');
      expect(String(arr[1].start)).toBe('7');
    });

    it('non-object elements (numbers, strings) filtered out', () => {
      const arr = UintRangeArray.From([
        123 as any,
        'string' as any,
        { start: '1', end: '5' }
      ]);
      expect(arr.length).toBe(1);
      expect(String(arr[0].start)).toBe('1');
    });
  });
});
