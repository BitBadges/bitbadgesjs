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
afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

it('prepares a reviewed renewal change from actual indexed paid ranges', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(1000);
  const collection = normalizeForReview(
    buildSubscription({ interval: 'daily', tiers: 2, price: 1, denom: 'BADGE', recipient: address, uri: 'https://example.com/sub' })
  );
  const source = collection.collectionApprovals[0];
  const target = collection.collectionApprovals[1];
  target.approvalId = 'target';
  (indexer.callIndexer as jest.Mock).mockImplementation(async (_method, path) =>
    path.includes('/balance/')
      ? {
          balances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: [{ start: '1', end: '100000000' }] }],
          incomingApprovals: []
        }
      : collection
  );
  await subscriptionsCommand.parseAsync(
    ['change-renewal', '1', '--creator', address, '--tier', source.approvalId, '--to-tier', 'target', '--approval-id', 'change'],
    { from: 'user' }
  );
  expect(indexer.emitIndexerError).not.toHaveBeenCalled();
  const result = (indexer.emitIndexerResult as jest.Mock).mock.calls[0][0];
  expect(result.renewalChange.effectiveAt).toBe('100000001');
  expect(result.messages[0].typeUrl).toBe('/tokenization.MsgUpdateUserApprovals');
  expect(result.messages[0].value.incomingApprovals[0].approvalId).toBe('change');
});
