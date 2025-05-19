import { genTestAddress } from './addressLists.spec.js';
import {
  createBalanceMapForOffChainBalances,
  getAllBadgeIdsToBeTransferred,
  getAllBalancesToBeTransferred,
  getBalancesAfterTransfers,
  iTransferWithIncrements
} from './transfers.js';
import { UintRangeArray } from './uintRanges.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

describe('Transfers', () => {
  it('should create a balance map for off-chain balances', async () => {
    const testAddress1 = genTestAddress();
    const testAddress2 = genTestAddress();
    const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
      {
        from: 'Mint', // replace with your address
        balances: [
          {
            amount: 100n,
            badgeIds: [{ start: 1n, end: 100n }],
            ownershipTimes: [{ start: 1628770800000n, end: 1628857200000n }]
          }
        ],
        toAddresses: [testAddress1, testAddress2], // replace with your address
        incrementBadgeIdsBy: 1n,
        durationFromTimestamp: 0n, // assuming this is 1 day in milliseconds in BigInt form
        incrementOwnershipTimesBy: 86400000n // assuming this is 1 day in milliseconds in BigInt form
      }
    ];

    const balanceMap = await createBalanceMapForOffChainBalances(transfersWithIncrements);
    expect(balanceMap).toBeTruthy();
    expect(balanceMap[testAddress1][0].amount == 100n).toBe(true);
    expect(balanceMap[testAddress2][0].amount == 100n).toBe(true);
    expect(balanceMap[testAddress1][0].badgeIds[0].start == 1n).toBe(true);
    expect(balanceMap[testAddress1][0].badgeIds[0].end == 100n).toBe(true);
    expect(balanceMap[testAddress2][0].badgeIds[0].start == 2n).toBe(true);
    expect(balanceMap[testAddress2][0].badgeIds[0].end == 101n).toBe(true);
  });

  it('should get all badge ids to be transferred', () => {
    const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
      {
        from: 'Mint', // replace with your address
        balances: [
          {
            amount: 100n,
            badgeIds: [{ start: 1n, end: 1n }],
            ownershipTimes: UintRangeArray.FullRanges()
          }
        ],
        toAddresses: [],
        toAddressesLength: 100n,
        incrementBadgeIdsBy: 1n,
        incrementOwnershipTimesBy: 0n,
        durationFromTimestamp: 0n // assuming this is 1 day in milliseconds in BigInt form
      }
    ];

    const allBadgeIds = getAllBadgeIdsToBeTransferred(transfersWithIncrements);
    expect(allBadgeIds[0].start == 1n).toBe(true);
    expect(allBadgeIds[0].end == 100n).toBe(true);

    const allBalances = getAllBalancesToBeTransferred(transfersWithIncrements, 0n);
    expect(allBalances[0].amount == 100n).toBe(true);
    expect(allBalances[0].badgeIds[0].start == 1n).toBe(true);
    expect(allBalances[0].badgeIds[0].end == 100n).toBe(true);
    expect(allBalances[0].ownershipTimes.isFull()).toBe(true);
  });

  it('should get balances after transfers', () => {
    const startingBalances = [
      {
        amount: 1n,
        badgeIds: [{ start: 1n, end: 100n }],
        ownershipTimes: UintRangeArray.FullRanges()
      }
    ];

    const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
      {
        from: 'Mint', // replace with your address
        balances: [
          {
            amount: 1n,
            badgeIds: [{ start: 1n, end: 1n }],
            ownershipTimes: UintRangeArray.FullRanges()
          }
        ],
        toAddresses: [], // this will be empty because we're using `toAddressesLength`
        toAddressesLength: 100n,
        incrementBadgeIdsBy: 1n,
        incrementOwnershipTimesBy: 0n,
        durationFromTimestamp: 0n // assuming this is 1 day in milliseconds in BigInt form
      }
    ];

    const balancesAfterTransfers = getBalancesAfterTransfers(startingBalances, transfersWithIncrements, 0n);
    expect(balancesAfterTransfers.filterZeroBalances().length == 0).toBe(true);
  });

  it('should handle underflows correctly', () => {
    const startingBalances = [
      {
        amount: 1n,
        badgeIds: [{ start: 1n, end: 100n }],
        ownershipTimes: UintRangeArray.FullRanges()
      }
    ];

    const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
      {
        from: 'Mint', // replace with your address
        balances: [
          {
            amount: 100n,
            badgeIds: [{ start: 1n, end: 1n }],
            ownershipTimes: UintRangeArray.FullRanges()
          }
        ],
        toAddresses: [], // this will be empty because we're using `toAddressesLength`
        toAddressesLength: 100n,
        incrementBadgeIdsBy: 1n,
        incrementOwnershipTimesBy: 0n,
        durationFromTimestamp: 0n // assuming this is 1 day in milliseconds in BigInt form
      }
    ];

    const balancesAfterTransfers = getBalancesAfterTransfers(startingBalances, transfersWithIncrements, 0n, true);
    console.log(JSON.stringify(balancesAfterTransfers));
    expect(balancesAfterTransfers[0].amount == -99n).toBe(true);
  });
});
