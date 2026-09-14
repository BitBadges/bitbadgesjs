import { subscriptionsCommand } from './subscriptions.js';
import * as indexer from '../utils/indexer-options.js';
import { buildSubscription } from '../../core/builders/subscription.js';
import { normalizeForReview } from '../../core/review-normalize.js';
import { convertToBitBadgesAddress } from '../../address-converter/converter.js';

jest.mock('../utils/indexer-options.js', () => ({
  ...jest.requireActual('../utils/indexer-options.js'),
  callIndexer: jest.fn(),
  emitIndexerResult: jest.fn(),
  emitIndexerError: jest.fn()
}));
const address = convertToBitBadgesAddress('0x1111111111111111111111111111111111111111');
const collection = () =>
  normalizeForReview(buildSubscription({ interval: 'daily', price: 1, denom: 'BADGE', recipient: address, uri: 'https://example.com/sub.json' }));

describe('subscription approval replacement read safety', () => {
  afterEach(() => jest.clearAllMocks());
  it.each(['enable-renewal', 'subscribe', 'cancel'])('does not prepare %s after a failed state read', async (action) => {
    (indexer.callIndexer as jest.Mock).mockImplementation(async (_method, path) => {
      if (path.includes('/balance/')) throw new Error('State service unavailable');
      return collection();
    });
    await subscriptionsCommand.parseAsync([action, '1', '--creator', address], { from: 'user' });
    expect(indexer.emitIndexerResult).not.toHaveBeenCalled();
    expect(indexer.emitIndexerError).toHaveBeenCalledWith(expect.objectContaining({ message: 'State service unavailable' }));
  });
  it('accepts explicit empty approvals when enabling initial renewal consent', async () => {
    (indexer.callIndexer as jest.Mock).mockImplementation(async (_method, path) =>
      path.includes('/balance/') ? { incomingApprovals: [] } : collection()
    );
    await subscriptionsCommand.parseAsync(['enable-renewal', '1', '--creator', address], { from: 'user' });
    expect(indexer.emitIndexerError).not.toHaveBeenCalled();
    expect((indexer.emitIndexerResult as jest.Mock).mock.calls[0][0].value.incomingApprovals).toHaveLength(1);
  });
  it('re-reads and preserves unrelated approvals added between separate proposals', async () => {
    const unrelated = {
      approvalId: 'receive-from-friend',
      fromListId: address,
      initiatedByListId: 'All',
      tokenIds: [{ start: '1', end: '1' }],
      transferTimes: [{ start: '1', end: '18446744073709551615' }],
      ownershipTimes: [{ start: '1', end: '18446744073709551615' }],
      approvalCriteria: {},
      uri: 'https://example.com/friend',
      customData: 'preserve-me'
    };
    let reads = 0;
    (indexer.callIndexer as jest.Mock).mockImplementation(async (_method, path) =>
      path.includes('/balance/') ? { incomingApprovals: reads++ === 0 ? [] : [unrelated] } : collection()
    );
    await subscriptionsCommand.parseAsync(['enable-renewal', '1', '--creator', address], { from: 'user' });
    await subscriptionsCommand.parseAsync(['enable-renewal', '1', '--creator', address], { from: 'user' });
    expect(indexer.emitIndexerError).not.toHaveBeenCalled();
    expect(reads).toBe(2);
    const messages = (indexer.emitIndexerResult as jest.Mock).mock.calls.map(([message]) => message);
    expect(messages[0].value.incomingApprovals).toHaveLength(1);
    expect(messages[1].value.incomingApprovals).toHaveLength(2);
    expect(messages[1].value.incomingApprovals[0]).toEqual(unrelated);
  });
});
