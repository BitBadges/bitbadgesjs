import { subscriptionsCommand } from './subscriptions.js';
import * as indexer from '../utils/indexer-options.js';
import { buildSubscription } from '../../core/builders/subscription.js';
import { normalizeForReview } from '../../core/review-normalize.js';
import { userRecurringApproval } from '../../core/subscriptions.js';
import { UintRangeArray } from '../../core/uintRanges.js';
import { convertToBitBadgesAddress } from '../../address-converter/converter.js';

jest.mock('../utils/indexer-options.js', () => ({
  ...jest.requireActual('../utils/indexer-options.js'),
  callIndexer: jest.fn(),
  emitIndexerResult: jest.fn(),
  emitIndexerError: jest.fn()
}));
const address = convertToBitBadgesAddress('0x1111111111111111111111111111111111111111');
describe('subscription charge-due boundaries', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });
  async function run(now: number, ownershipTimes: { start: bigint; end: bigint }[]) {
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const collection = normalizeForReview(
      buildSubscription({ interval: 'daily', price: 1, denom: 'BADGE', recipient: address, uri: 'https://example.com/sub.json' })
    );
    const faucet = collection.collectionApprovals[0];
    faucet.approvalCriteria.predeterminedBalances.incrementedBalances.durationFromTimestamp = 1000n;
    const incoming = userRecurringApproval({
      subscriptionApproval: faucet,
      firstIntervalStartTime: 1000n,
      ubadgeTipAmount: 0n,
      transferTimes: UintRangeArray.FullRanges(),
      approvalId: 'renew',
      tokenIds: [{ start: 1n, end: 1n }],
      denom: 'ubadge'
    });
    (indexer.callIndexer as jest.Mock).mockImplementation(async (_method, path) =>
      path.endsWith('/owners')
        ? {
            owners: [
              {
                bitbadgesAddress: address,
                incomingApprovals: [incoming],
                balances: ownershipTimes.length ? [{ amount: 1n, tokenIds: [{ start: 1n, end: 1n }], ownershipTimes }] : []
              }
            ]
          }
        : collection
    );
    await subscriptionsCommand.parseAsync(['charge-due', '1', '--creator', address], { from: 'user' });
    expect(indexer.emitIndexerError).not.toHaveBeenCalled();
    return (indexer.emitIndexerResult as jest.Mock).mock.calls[0][0];
  }
  it('includes the first charge millisecond and emits the exact upcoming ownership start', async () => {
    const result = await run(1000, []);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].value.transfers[0].precalculateBalancesFromApproval.precalculationOptions.overrideTimestamp).toBe('2000');
  });
  it('does not mistake the current interval for an already fulfilled next interval', async () => {
    const result = await run(1999, [{ start: 1000n, end: 1999n }]);
    expect(result.messages).toHaveLength(1);
  });
  it('skips a subscriber whose upcoming interval is already fulfilled', async () => {
    const result = await run(1999, [{ start: 2000n, end: 2999n }]);
    expect(result.messages).toEqual([]);
  });
});
