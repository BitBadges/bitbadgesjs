import { BalanceArray, UintRangeArray, areBalancesEqual } from '../../';

describe('areBalancesEqual', () => {
  const balancesOne = BalanceArray.From([
    {
      amount: 3n,
      badgeIds: [{ start: 1n, end: 10000n }],
      ownershipTimes: UintRangeArray.FullRanges()
    }
  ]);

  const balancesTwo = BalanceArray.From([
    {
      amount: 1n,
      badgeIds: [{ start: 1n, end: 10000n }],
      ownershipTimes: UintRangeArray.FullRanges()
    },
    {
      amount: 2n,
      badgeIds: [{ start: 1n, end: 5000n }],
      ownershipTimes: UintRangeArray.FullRanges()
    },
    {
      amount: 2n,
      badgeIds: [{ start: 5001n, end: 10000n }],
      ownershipTimes: UintRangeArray.FullRanges()
    }
  ]);

  it('should return false when comparing balancesOne and balancesTwo', () => {
    expect(areBalancesEqual(balancesOne, balancesTwo, false)).toBeTruthy();
  });

  it('should return false when comparing balancesTwo and balancesOne', () => {
    expect(areBalancesEqual(balancesTwo, balancesOne, false)).toBeTruthy();
  });
});
