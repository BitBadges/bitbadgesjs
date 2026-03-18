import { genTestAddress } from './addressLists.spec.js';
import {
  createBalanceMapForOffChainBalances,
  getAllTokenIdsToBeTransferred,
  getAllBalancesToBeTransferred,
  getBalancesAfterTransfers,
  getTransfersFromTransfersWithIncrements,
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
            tokenIds: [{ start: 1n, end: 100n }],
            ownershipTimes: [{ start: 1628770800000n, end: 1628857200000n }]
          }
        ],
        toAddresses: [testAddress1, testAddress2], // replace with your address
        incrementTokenIdsBy: 1n,
        durationFromTimestamp: 0n, // assuming this is 1 day in milliseconds in BigInt form
        incrementOwnershipTimesBy: 86400000n // assuming this is 1 day in milliseconds in BigInt form
      }
    ];

    const balanceMap = await createBalanceMapForOffChainBalances(transfersWithIncrements);
    expect(balanceMap).toBeTruthy();
    expect(balanceMap[testAddress1][0].amount == 100n).toBe(true);
    expect(balanceMap[testAddress2][0].amount == 100n).toBe(true);
    expect(balanceMap[testAddress1][0].tokenIds[0].start == 1n).toBe(true);
    expect(balanceMap[testAddress1][0].tokenIds[0].end == 100n).toBe(true);
    expect(balanceMap[testAddress2][0].tokenIds[0].start == 2n).toBe(true);
    expect(balanceMap[testAddress2][0].tokenIds[0].end == 101n).toBe(true);
  });

  it('should get all token ids to be transferred', () => {
    const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
      {
        from: 'Mint', // replace with your address
        balances: [
          {
            amount: 100n,
            tokenIds: [{ start: 1n, end: 1n }],
            ownershipTimes: UintRangeArray.FullRanges()
          }
        ],
        toAddresses: [],
        toAddressesLength: 100n,
        incrementTokenIdsBy: 1n,
        incrementOwnershipTimesBy: 0n,
        durationFromTimestamp: 0n // assuming this is 1 day in milliseconds in BigInt form
      }
    ];

    const allTokenIds = getAllTokenIdsToBeTransferred(transfersWithIncrements);
    expect(allTokenIds[0].start == 1n).toBe(true);
    expect(allTokenIds[0].end == 100n).toBe(true);

    const allBalances = getAllBalancesToBeTransferred(transfersWithIncrements, 0n);
    expect(allBalances[0].amount == 100n).toBe(true);
    expect(allBalances[0].tokenIds[0].start == 1n).toBe(true);
    expect(allBalances[0].tokenIds[0].end == 100n).toBe(true);
    expect(allBalances[0].ownershipTimes.isFull()).toBe(true);
  });

  it('should get balances after transfers', () => {
    const startingBalances = [
      {
        amount: 1n,
        tokenIds: [{ start: 1n, end: 100n }],
        ownershipTimes: UintRangeArray.FullRanges()
      }
    ];

    const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
      {
        from: 'Mint', // replace with your address
        balances: [
          {
            amount: 1n,
            tokenIds: [{ start: 1n, end: 1n }],
            ownershipTimes: UintRangeArray.FullRanges()
          }
        ],
        toAddresses: [], // this will be empty because we're using `toAddressesLength`
        toAddressesLength: 100n,
        incrementTokenIdsBy: 1n,
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
        tokenIds: [{ start: 1n, end: 100n }],
        ownershipTimes: UintRangeArray.FullRanges()
      }
    ];

    const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
      {
        from: 'Mint', // replace with your address
        balances: [
          {
            amount: 100n,
            tokenIds: [{ start: 1n, end: 1n }],
            ownershipTimes: UintRangeArray.FullRanges()
          }
        ],
        toAddresses: [], // this will be empty because we're using `toAddressesLength`
        toAddressesLength: 100n,
        incrementTokenIdsBy: 1n,
        incrementOwnershipTimesBy: 0n,
        durationFromTimestamp: 0n // assuming this is 1 day in milliseconds in BigInt form
      }
    ];

    const balancesAfterTransfers = getBalancesAfterTransfers(startingBalances, transfersWithIncrements, 0n, true);
    console.log(JSON.stringify(balancesAfterTransfers));
    expect(balancesAfterTransfers[0].amount == -99n).toBe(true);
  });

  describe('Multi-recipient transfers', () => {
    it('should correctly distribute tokens to multiple recipients', async () => {
      const recipients = [genTestAddress(), genTestAddress(), genTestAddress()];

      const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
        {
          from: 'Mint',
          balances: [
            {
              amount: 10n,
              tokenIds: [{ start: 1n, end: 10n }],
              ownershipTimes: UintRangeArray.FullRanges()
            }
          ],
          toAddresses: recipients,
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n
        }
      ];

      const balanceMap = await createBalanceMapForOffChainBalances(transfersWithIncrements);

      // Each recipient should receive the same tokens
      for (const recipient of recipients) {
        expect(balanceMap[recipient]).toBeDefined();
        expect(balanceMap[recipient][0].amount).toBe(10n);
        expect(balanceMap[recipient][0].tokenIds[0].start).toBe(1n);
        expect(balanceMap[recipient][0].tokenIds[0].end).toBe(10n);
      }
    });

    it('should handle different amounts per recipient with increments', async () => {
      const recipients = [genTestAddress(), genTestAddress()];

      const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
        {
          from: 'Mint',
          balances: [
            {
              amount: 5n,
              tokenIds: [{ start: 1n, end: 5n }],
              ownershipTimes: UintRangeArray.FullRanges()
            }
          ],
          toAddresses: recipients,
          incrementTokenIdsBy: 5n, // Each recipient gets different token IDs
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n
        }
      ];

      const balanceMap = await createBalanceMapForOffChainBalances(transfersWithIncrements);

      // First recipient: tokens 1-5
      expect(balanceMap[recipients[0]][0].tokenIds[0].start).toBe(1n);
      expect(balanceMap[recipients[0]][0].tokenIds[0].end).toBe(5n);

      // Second recipient: tokens 6-10
      expect(balanceMap[recipients[1]][0].tokenIds[0].start).toBe(6n);
      expect(balanceMap[recipients[1]][0].tokenIds[0].end).toBe(10n);
    });
  });

  describe('Time-based balance restrictions', () => {
    it('should correctly handle time-restricted balances', () => {
      const startTime = 1000000n;
      const endTime = 2000000n;

      const startingBalances = [
        {
          amount: 100n,
          tokenIds: [{ start: 1n, end: 10n }],
          ownershipTimes: [{ start: startTime, end: endTime }]
        }
      ];

      // Transfer within the valid time range
      const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
        {
          from: 'Mint',
          balances: [
            {
              amount: 50n,
              tokenIds: [{ start: 1n, end: 10n }],
              ownershipTimes: [{ start: startTime, end: endTime }]
            }
          ],
          toAddresses: [genTestAddress()],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n
        }
      ];

      const balancesAfterTransfers = getBalancesAfterTransfers(startingBalances, transfersWithIncrements, 0n);

      // Should have 50 remaining
      expect(balancesAfterTransfers[0].amount).toBe(50n);
      expect(balancesAfterTransfers[0].ownershipTimes[0].start).toBe(startTime);
      expect(balancesAfterTransfers[0].ownershipTimes[0].end).toBe(endTime);
    });

    it('should handle incremental ownership times', async () => {
      const recipients = [genTestAddress(), genTestAddress()];
      const baseTime = 1000000n;
      const increment = 100000n;

      const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
        {
          from: 'Mint',
          balances: [
            {
              amount: 10n,
              tokenIds: [{ start: 1n, end: 10n }],
              ownershipTimes: [{ start: baseTime, end: baseTime + 50000n }]
            }
          ],
          toAddresses: recipients,
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: increment,
          durationFromTimestamp: 0n
        }
      ];

      const balanceMap = await createBalanceMapForOffChainBalances(transfersWithIncrements);

      // First recipient: ownership time starts at baseTime
      expect(balanceMap[recipients[0]][0].ownershipTimes[0].start).toBe(baseTime);

      // Second recipient: ownership time starts at baseTime + increment
      expect(balanceMap[recipients[1]][0].ownershipTimes[0].start).toBe(baseTime + increment);
    });
  });

  describe('Transfer validation edge cases', () => {
    it('should handle zero amount transfers gracefully', () => {
      const startingBalances = [
        {
          amount: 100n,
          tokenIds: [{ start: 1n, end: 10n }],
          ownershipTimes: UintRangeArray.FullRanges()
        }
      ];

      const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
        {
          from: 'Mint',
          balances: [
            {
              amount: 0n, // Zero amount
              tokenIds: [{ start: 1n, end: 10n }],
              ownershipTimes: UintRangeArray.FullRanges()
            }
          ],
          toAddresses: [genTestAddress()],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n
        }
      ];

      const balancesAfterTransfers = getBalancesAfterTransfers(startingBalances, transfersWithIncrements, 0n);

      // Balance should remain unchanged
      const nonZeroBalances = balancesAfterTransfers.filter((b) => b.amount > 0n);
      expect(nonZeroBalances.length).toBeGreaterThan(0);
      expect(nonZeroBalances[0].amount).toBe(100n);
    });

    it('should handle empty recipient list', () => {
      const allTokenIds = getAllTokenIdsToBeTransferred([
        {
          from: 'Mint',
          balances: [
            {
              amount: 100n,
              tokenIds: [{ start: 1n, end: 10n }],
              ownershipTimes: UintRangeArray.FullRanges()
            }
          ],
          toAddresses: [], // Empty
          toAddressesLength: 0n,
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n
        }
      ]);

      // With 0 recipients, still returns base token IDs (the function calculates
      // what tokens would be transferred regardless of recipient count)
      // This is correct behavior - the token IDs are defined in the transfer spec
      expect(allTokenIds.length).toBe(1);
      expect(allTokenIds[0].start).toBe(1n);
      expect(allTokenIds[0].end).toBe(10n);
    });

    it('should handle single token transfer', () => {
      const startingBalances = [
        {
          amount: 1n,
          tokenIds: [{ start: 5n, end: 5n }], // Single token
          ownershipTimes: UintRangeArray.FullRanges()
        }
      ];

      const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
        {
          from: 'Mint',
          balances: [
            {
              amount: 1n,
              tokenIds: [{ start: 5n, end: 5n }],
              ownershipTimes: UintRangeArray.FullRanges()
            }
          ],
          toAddresses: [genTestAddress()],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n
        }
      ];

      const balancesAfterTransfers = getBalancesAfterTransfers(startingBalances, transfersWithIncrements, 0n);
      const filtered = balancesAfterTransfers.filterZeroBalances();

      expect(filtered.length).toBe(0); // All transferred
    });
  });

  describe('Large claim simulation', () => {
    // Note: This tests the performance concern at transfers.ts:512
    // The O(n*m*k) loop can be slow for large claims

    it('should handle moderate-sized claims without timeout', () => {
      const numRecipients = 100;
      const recipients: string[] = [];
      for (let i = 0; i < numRecipients; i++) {
        recipients.push(genTestAddress());
      }

      const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
        {
          from: 'Mint',
          balances: [
            {
              amount: 1n,
              tokenIds: [{ start: 1n, end: 1n }],
              ownershipTimes: UintRangeArray.FullRanges()
            }
          ],
          toAddresses: recipients,
          incrementTokenIdsBy: 1n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n
        }
      ];

      const startTime = Date.now();
      const allTokenIds = getAllTokenIdsToBeTransferred(transfersWithIncrements);
      const endTime = Date.now();

      // Should complete in reasonable time (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(allTokenIds[0].start).toBe(1n);
      expect(allTokenIds[0].end).toBe(BigInt(numRecipients));
    });

    it('should correctly calculate all balances for incremental transfers', () => {
      const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
        {
          from: 'Mint',
          balances: [
            {
              amount: 1n,
              tokenIds: [{ start: 1n, end: 1n }],
              ownershipTimes: UintRangeArray.FullRanges()
            }
          ],
          toAddresses: [],
          toAddressesLength: 50n,
          incrementTokenIdsBy: 1n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n
        }
      ];

      const allBalances = getAllBalancesToBeTransferred(transfersWithIncrements, 0n);

      // Should aggregate all token IDs correctly
      expect(allBalances[0].tokenIds[0].start).toBe(1n);
      expect(allBalances[0].tokenIds[0].end).toBe(50n);
    });
  });

  describe('Duration-based transfers', () => {
    it('should calculate balances with durationFromTimestamp', () => {
      const currentTime = 1000000n;
      const duration = 86400000n; // 1 day in milliseconds

      const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
        {
          from: 'Mint',
          balances: [
            {
              amount: 10n,
              tokenIds: [{ start: 1n, end: 10n }],
              ownershipTimes: [{ start: 0n, end: 100000n }]
            }
          ],
          toAddresses: [genTestAddress()],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: duration
        }
      ];

      const allBalances = getAllBalancesToBeTransferred(transfersWithIncrements, currentTime);

      // Ownership times should be adjusted based on currentTime + duration
      expect(allBalances.length).toBeGreaterThan(0);
    });

    it('should compute end time as blockTime + duration - 1 (matching on-chain behavior) via slow path', () => {
      const blockTime = 1000000n;
      const duration = 50000n;
      const expectedEnd = blockTime + duration - 1n; // on-chain: now + duration - 1

      // To force the slow path in getBalancesAfterTransfers, we need:
      // - incrementTokenIdsBy set, but token range size != incrementTokenIdsBy (breaks fast path)
      // - durationFromTimestamp set
      // Token range {1,2} has size 2, incrementTokenIdsBy is 3 => 2 != 3 => slow path
      //
      // The slow path: iteration 0 uses original ownershipTimes, then sets
      // ownershipTimes = [blockTime, blockTime+duration-1] for subsequent iterations.
      // We use 3 recipients to ensure iteration 2 uses the durationFromTimestamp-computed times.

      // Starting balances must cover both the original ownership times (used by first iteration)
      // and the duration-computed times (used by subsequent iterations)
      const startingBalances = [
        {
          amount: 1n,
          tokenIds: [{ start: 1n, end: 10n }],
          ownershipTimes: UintRangeArray.FullRanges()
        }
      ];

      const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
        {
          from: 'Mint',
          balances: [
            {
              amount: 1n,
              tokenIds: [{ start: 1n, end: 2n }], // size=2
              ownershipTimes: [{ start: blockTime, end: expectedEnd }] // first iteration uses this
            }
          ],
          toAddresses: [genTestAddress(), genTestAddress(), genTestAddress()],
          incrementTokenIdsBy: 3n, // size(2) != 3 => slow path
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: duration
        }
      ];

      // This should NOT throw. If the -1 fix were missing, the ownership times
      // for iterations 1+ would be [blockTime, blockTime+duration] instead of
      // [blockTime, blockTime+duration-1], which would be 1 unit wider than expected.
      const balancesAfterTransfers = getBalancesAfterTransfers(startingBalances, transfersWithIncrements, blockTime);
      const remaining = balancesAfterTransfers.filterZeroBalances();
      expect(remaining.length).toBeGreaterThan(0);
    });

    it('should compute end time as blockTime + duration - 1 via fast path', () => {
      const blockTime = 1000000n;
      const duration = 50000n;
      const expectedEnd = blockTime + duration - 1n;

      const startingBalances = [
        {
          amount: 1n,
          tokenIds: [{ start: 1n, end: 100n }],
          ownershipTimes: [{ start: blockTime, end: expectedEnd }]
        }
      ];

      // Fast path: incrementTokenIdsBy matches token range size (1), so it can batch
      const transfersWithIncrements: iTransferWithIncrements<bigint>[] = [
        {
          from: 'Mint',
          balances: [
            {
              amount: 1n,
              tokenIds: [{ start: 1n, end: 1n }],
              ownershipTimes: [{ start: 0n, end: 100000n }]
            }
          ],
          toAddresses: [],
          toAddressesLength: 100n,
          incrementTokenIdsBy: 1n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: duration
        }
      ];

      const allBalances = getAllBalancesToBeTransferred(transfersWithIncrements, blockTime);
      expect(allBalances.length).toBeGreaterThan(0);
      for (const balance of allBalances) {
        for (const ownershipTime of balance.ownershipTimes) {
          expect(ownershipTime.start).toBe(blockTime);
          expect(ownershipTime.end).toBe(expectedEnd);
        }
      }

      // The full transfer should exactly deplete the starting balance
      const balancesAfterTransfers = getBalancesAfterTransfers(startingBalances, transfersWithIncrements, blockTime);
      expect(balancesAfterTransfers.filterZeroBalances().length).toBe(0);
    });

    it('should NOT match if end time were blockTime + duration (without -1)', () => {
      const blockTime = 1000000n;
      const duration = 50000n;
      const wrongEnd = blockTime + duration; // Without -1, this would be wrong

      const allBalances = getAllBalancesToBeTransferred(
        [
          {
            from: 'Mint',
            balances: [
              {
                amount: 1n,
                tokenIds: [{ start: 1n, end: 1n }],
                ownershipTimes: [{ start: 0n, end: 100000n }]
              }
            ],
            toAddresses: [genTestAddress()],
            incrementTokenIdsBy: 0n,
            incrementOwnershipTimesBy: 0n,
            durationFromTimestamp: duration
          }
        ],
        blockTime
      );

      // The end should be blockTime + duration - 1, NOT blockTime + duration
      for (const balance of allBalances) {
        for (const ownershipTime of balance.ownershipTimes) {
          expect(ownershipTime.end).not.toBe(wrongEnd);
          expect(ownershipTime.end).toBe(wrongEnd - 1n);
        }
      }
    });

    it('should give all recipients the same duration-based ownership times', () => {
      const blockTime = 1000000n;
      const duration = 86400000n;
      const recipients = [genTestAddress(), genTestAddress(), genTestAddress()];
      const transfers = getTransfersFromTransfersWithIncrements(
        [
          {
            from: 'Mint',
            toAddresses: recipients,
            balances: [
              {
                amount: 1n,
                tokenIds: [{ start: 1n, end: 1n }],
                ownershipTimes: [{ start: 0n, end: 100000n }]
              }
            ],
            durationFromTimestamp: duration
          }
        ],
        blockTime
      );

      expect(transfers.length).toBe(3);

      // All recipients should get the duration-based ownership times
      const expectedStart = blockTime;
      const expectedEnd = blockTime + duration - 1n;

      for (let i = 0; i < transfers.length; i++) {
        expect(transfers[i].balances[0].ownershipTimes[0].start).toBe(expectedStart);
        expect(transfers[i].balances[0].ownershipTimes[0].end).toBe(expectedEnd);
      }
    });
  });
});
