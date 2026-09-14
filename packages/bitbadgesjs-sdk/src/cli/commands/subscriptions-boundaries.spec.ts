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
  async function run(now: number, ownershipTimes: { start: bigint; end: bigint }[], consentCase?: 'expired-first' | 'expired-only' | 'future-first', action = 'charge-due') {
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
    const expired = { ...incoming, approvalId: 'expired', transferTimes: UintRangeArray.From([{ start: 1n, end: 999n }]) };
    const future = userRecurringApproval({ subscriptionApproval: faucet, firstIntervalStartTime: 5000n, ubadgeTipAmount: 0n, transferTimes: UintRangeArray.FullRanges(), approvalId: 'future', tokenIds: incoming.tokenIds, denom: 'ubadge' });
    const incomingApprovals = consentCase === 'expired-only' ? [expired] : consentCase === 'expired-first' ? [expired, incoming] : consentCase === 'future-first' ? [future, incoming] : [incoming];
    (indexer.callIndexer as jest.Mock).mockImplementation(async (_method, path) =>
      path.includes('/balance/') ? { balances: [], incomingApprovals } : path.endsWith('/owners')
        ? {
            owners: [
              {
                bitbadgesAddress: address,
                incomingApprovals,
                balances: ownershipTimes.length ? [{ amount: 1n, tokenIds: [{ start: 1n, end: 1n }], ownershipTimes }] : []
              }
            ]
          }
        : collection
    );
    await subscriptionsCommand.parseAsync([action, '1', action === 'status' ? '--address' : '--creator', address], { from: 'user' });
    expect(indexer.emitIndexerError).not.toHaveBeenCalled();
    return (indexer.emitIndexerResult as jest.Mock).mock.calls[0][0];
  }
  it('reports recorded live consent even when an expired approval appears first', async () => {
    const result = await run(1000, [], 'expired-first', 'status');
    expect(result.tiers[0].renewalConsentStatus).toBe('recorded');
    expect(result.tiers[0].nextChargeTime).toBe('1000');
  });
  it('does not prepare expired consent for renewal', async () => {
    expect((await run(1000, [], 'expired-only')).messages).toEqual([]);
  });
  it.each(['expired-first', 'future-first'] as const)('selects a due live consent past an unusable first match: %s', async consentCase => {
    const result = await run(1000, [], consentCase);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].value.transfers[0].prioritizedApprovals[1].approvalId).toBe('renew');
  });
  it('includes the first charge millisecond and emits the exact upcoming ownership start', async () => {
    const result = await run(1000, []);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].value.transfers[0].precalculateBalancesFromApproval.precalculationOptions.overrideTimestamp).toBe('2000');
  });
  it('requires the selected collection and subscriber consent approvals for a renewal proposal', async () => {
    const result = await run(1000, []);
    const transfer = result.messages[0].value.transfers[0];
    expect(transfer.onlyCheckPrioritizedCollectionApprovals).toBe(true);
    expect(transfer.onlyCheckPrioritizedIncomingApprovals).toBe(true);
    expect(transfer.prioritizedApprovals).toEqual([
      { approvalId: 'subscription-tier-1', approvalLevel: 'collection', approverAddress: '', version: '0' },
      { approvalId: 'renew', approvalLevel: 'incoming', approverAddress: address, version: '0' }
    ]);
  });
  it('does not mistake the current interval for an already fulfilled next interval', async () => {
    const result = await run(1999, [{ start: 1000n, end: 1999n }]);
    expect(result.messages).toHaveLength(1);
  });
  it('skips a subscriber whose upcoming interval is already fulfilled', async () => {
    const result = await run(1999, [{ start: 2000n, end: 2999n }]);
    expect(result.messages).toEqual([]);
  });
  it.each(['enable-renewal', 'subscribe'])('refuses %s when existing approvals cannot be read', async action => {
    const collection = normalizeForReview(buildSubscription({ interval: 'daily', price: 1, denom: 'BADGE', recipient: address, uri: 'https://example.com/sub.json' }));
    (indexer.callIndexer as jest.Mock).mockImplementation(async (_method, path) => {
      if (path.includes('/balance/')) throw new Error('Indexer unavailable');
      return collection;
    });
    await subscriptionsCommand.parseAsync([action, '1', '--creator', address], { from: 'user' });
    expect(indexer.emitIndexerResult).not.toHaveBeenCalled();
    expect(indexer.emitIndexerError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Indexer unavailable/) }));
  });
  it('does not report unsubscribed when status lookup fails', async () => {
    const collection = normalizeForReview(buildSubscription({ interval: 'daily', price: 1, denom: 'BADGE', recipient: address, uri: 'https://example.com/sub.json' }));
    (indexer.callIndexer as jest.Mock).mockImplementation(async (_method, path) => {
      if (path.includes('/balance/')) throw new Error('Indexer unavailable');
      return collection;
    });
    await subscriptionsCommand.parseAsync(['status', '1', '--address', address], { from: 'user' });
    expect(indexer.emitIndexerResult).not.toHaveBeenCalled();
    expect(indexer.emitIndexerError).toHaveBeenCalled();
  });
  it('reports all confirmed access ranges separately from renewal consent', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(100);
    const collection = normalizeForReview(buildSubscription({ interval: 'daily', price: 1, denom: 'BADGE', recipient: address, uri: 'https://example.com/sub.json' }));
    (indexer.callIndexer as jest.Mock).mockImplementation(async (_method, path) => path.includes('/balance/')
      ? { balances: [
        { amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: [{ start: '1', end: '20' }] },
        { amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: [{ start: '90', end: '120' }, { start: '200', end: '299' }] }
      ], incomingApprovals: [] }
      : collection);
    await subscriptionsCommand.parseAsync(['status', '1', '--address', address], { from: 'user' });
    expect(indexer.emitIndexerError).not.toHaveBeenCalled();
    expect((indexer.emitIndexerResult as jest.Mock).mock.calls[0][0].tiers[0]).toMatchObject({
      isSubscribed: true, hasFutureApproval: false, currentAccessEndsAt: '120', nextAccessStartsAt: '200',
      futureAccessTimes: [{ start: '101', end: '120' }, { start: '200', end: '299' }]
    });
  });
  it.each([{ balances: [] }, { incomingApprovals: [] }])('rejects incomplete status state: %j', async state => {
    const collection = normalizeForReview(buildSubscription({ interval: 'daily', price: 1, denom: 'BADGE', recipient: address, uri: 'https://example.com/sub.json' }));
    (indexer.callIndexer as jest.Mock).mockImplementation(async (_method, path) => path.includes('/balance/') ? state : collection);
    await subscriptionsCommand.parseAsync(['status', '1', '--address', address], { from: 'user' });
    expect(indexer.emitIndexerResult).not.toHaveBeenCalled();
    expect(indexer.emitIndexerError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/status is unavailable/) }));
  });
  it.each(['enable-renewal', 'subscribe', 'cancel'])('refuses %s when the balance response omits approval state', async action => {
    const collection = normalizeForReview(buildSubscription({ interval: 'daily', price: 1, denom: 'BADGE', recipient: address, uri: 'https://example.com/sub.json' }));
    (indexer.callIndexer as jest.Mock).mockImplementation(async (_method, path) => path.includes('/balance/') ? {} : collection);
    await subscriptionsCommand.parseAsync([action, '1', '--creator', address], { from: 'user' });
    expect(indexer.emitIndexerResult).not.toHaveBeenCalled();
    expect(indexer.emitIndexerError).toHaveBeenCalled();
  });
  it.each(['missing-cursor', 'page-limit'])('does not report a complete charge batch for incomplete pagination: %s', async failure => {
    const collection = normalizeForReview(buildSubscription({ interval: 'daily', price: 1, denom: 'BADGE', recipient: address, uri: 'https://example.com/sub.json' }));
    let page = 0;
    (indexer.callIndexer as jest.Mock).mockImplementation(async (_method, path) => path.includes('/owners')
      ? { owners: [], pagination: { hasMore: true, bookmark: failure === 'page-limit' ? String(++page) : undefined } }
      : collection);
    await subscriptionsCommand.parseAsync(['charge-due', '1', '--creator', address], { from: 'user' });
    expect(indexer.emitIndexerResult).not.toHaveBeenCalled();
    expect(indexer.emitIndexerError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/pagination|page limit/i) }));
  });
});
