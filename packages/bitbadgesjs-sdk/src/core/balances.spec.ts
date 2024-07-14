import {
  BalanceArray,
  areBalancesEqual,
  addBalances,
  getBalancesForIds,
  doBalancesExceedThreshold,
  addBalancesAndCheckIfExceedsThreshold,
  handleDuplicateBadgeIdsInBalances
} from './balances.js';
import { UserPermissions } from './permissions.js';
import { UintRangeArray } from './uintRanges.js';
import { UserBalanceStore } from './userBalances.js';
import { safeAdd, GO_MAX_UINT_64, safeSubtract } from '../common/math.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

//Note the logic is supposed to be equivalent to the BC .go balances file and we test the logic there as well

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

describe('SafeAdd', () => {
  it('should add two Uint values safely', () => {
    const result = safeAdd(BigInt(0), BigInt(1));
    expect(result).toEqual(BigInt(1));
  });

  it('should handle max Uint64 correctly', () => {
    const result = safeAdd(BigInt(GO_MAX_UINT_64), BigInt(0));
    expect(result).toEqual(BigInt(GO_MAX_UINT_64));
  });
});

describe('SafeSubtract', () => {
  it('should subtract two Uint values safely', () => {
    const result = safeSubtract(BigInt(1), BigInt(0));
    expect(result).toEqual(BigInt(1));
  });

  it('should handle max Uint64 correctly', () => {
    const result = safeSubtract(BigInt(GO_MAX_UINT_64), BigInt(0));
    expect(result).toEqual(BigInt(GO_MAX_UINT_64));
  });

  it('should handle underflow error', () => {
    try {
      safeSubtract(BigInt(0), BigInt(1));

      //fail the test
      expect(false).toBeTruthy();
    } catch (e) {
      expect(e).toBeTruthy();
    }
  });
});

const NUM_RUNS: number = 10; // Define the number of runs
const NUM_IDS: number = 10; // Define the number of IDs
const NUM_OPERATIONS: number = 10; // Define the number of operations

describe('BalancesWithTimesFuzz', () => {
  for (let a = 0; a < NUM_RUNS; a++) {
    it(`Run ${a + 1}`, () => {
      const userBalance = new UserBalanceStore({
        balances: BalanceArray.From([]),
        autoApproveSelfInitiatedIncomingTransfers: true,
        autoApproveSelfInitiatedOutgoingTransfers: true,
        outgoingApprovals: [],
        incomingApprovals: [],
        userPermissions: UserPermissions.InitEmpty()
      });
      const balances = Array.from({ length: NUM_IDS }, () => Array.from({ length: NUM_IDS }, () => 0));

      for (let i = 0; i < NUM_OPERATIONS; i++) {
        const start: number = Math.floor(Math.random() * (NUM_IDS / 2));
        const end: number = Math.floor(NUM_IDS / 2 + Math.random() * (NUM_IDS / 2));
        const startTime: number = Math.floor(Math.random() * (NUM_IDS / 2));
        const endTime: number = Math.floor(NUM_IDS / 2 + Math.random() * (NUM_IDS / 2));
        const amount = Math.floor(Math.random() * 100);

        const result = addBalances(userBalance.balances, [
          {
            amount,
            badgeIds: [{ start: start, end: end }],
            ownershipTimes: [{ start: startTime, end: endTime }]
          }
        ]);

        userBalance.balances = result;

        for (let j = start; j <= end; j++) {
          for (let k = startTime; k <= endTime; k++) {
            balances[j][k] = balances[j][k] + amount;
          }
        }

        // Similar process for subtractBalance
      }

      for (let i = 0; i < NUM_IDS; i++) {
        for (let j = 0; j < NUM_IDS; j++) {
          const fetchedBalances = getBalancesForIds([{ start: i, end: i }], [{ start: j, end: j }], userBalance.balances);

          expect(fetchedBalances.length).toBe(1);
          expect(fetchedBalances[0].amount).toEqual(balances[i][j]);
        }
      }
    });
  }

  it('should applyIncrementsToBalances', () => {
    const startBalances = BalanceArray.From<bigint>([
      {
        amount: 1n,
        badgeIds: [{ start: 1n, end: 1n }],
        ownershipTimes: [{ start: 1n, end: 10000n }]
      }
    ]);

    startBalances.applyIncrements(1n, 0n, 1000n);

    console.log(JSON.stringify(startBalances));
    expect(
      areBalancesEqual(
        startBalances,
        BalanceArray.From<bigint>([
          {
            amount: 1n,
            badgeIds: [{ start: 1001n, end: 1001n }],
            ownershipTimes: [{ start: 1n, end: 10000n }]
          }
        ]),
        false
      )
    ).toBeTruthy();
  });

  it('should filterZeroBalances', () => {
    const balances = BalanceArray.From<bigint>([
      {
        amount: 0n,
        badgeIds: [{ start: 1n, end: 1n }],
        ownershipTimes: [{ start: 1n, end: 10000n }]
      },
      {
        amount: 1n,
        badgeIds: [{ start: 1n, end: 1n }],
        ownershipTimes: [{ start: 1n, end: 10000n }]
      }
    ]);

    balances.filterZeroBalances();

    expect(balances.length).toEqual(1);
  });

  it('should correctly check threhsold', () => {
    const balances = BalanceArray.From<bigint>([
      {
        amount: 5n,
        badgeIds: [{ start: 1n, end: 1n }],
        ownershipTimes: [{ start: 1n, end: 10000n }]
      }
    ]);

    const threshold = BalanceArray.From<bigint>([
      {
        amount: 1n,
        badgeIds: [{ start: 1n, end: 1n }],
        ownershipTimes: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(balances.subsetOf(threshold)).toBeFalsy();
    expect(doBalancesExceedThreshold(balances, threshold)).toBeTruthy();

    expect(addBalancesAndCheckIfExceedsThreshold(balances, threshold, threshold)).toBeTruthy();
  });

  it('should handle duplicate badge ids', () => {
    const balances = BalanceArray.From<bigint>([
      {
        amount: 1n,
        badgeIds: [{ start: 1n, end: 1n }],
        ownershipTimes: [{ start: 1n, end: 10000n }]
      },
      {
        amount: 1n,
        badgeIds: [{ start: 1n, end: 1n }],
        ownershipTimes: [{ start: 1n, end: 10000n }]
      }
    ]);

    const handled = handleDuplicateBadgeIdsInBalances(balances);

    expect(handled.length).toEqual(1);
    expect(handled[0].amount).toEqual(2n);
  });
});
