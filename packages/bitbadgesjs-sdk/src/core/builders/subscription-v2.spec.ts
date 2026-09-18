import { buildSubscription } from './subscription.js';
import { inspectSubscriptionUpgradeCollection } from '../subscriptionUpgradeNative.js';
const operator = 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm';
it('builds operator subscriptions through the existing standard input schema', () => {
  const result = buildSubscription({
    version: '2',
    uri: 'ipfs://membership',
    operatorProfile: {
      operator,
      escrowStoreId: '1',
      denom: 'ubadge',
      duration: '86400000',
      tiers: [
        { tokenId: '1', price: '1000' },
        { tokenId: '2', price: '2000' }
      ],
      payouts: [{ recipient: operator, weightBps: '10000' }]
    }
  });
  expect(inspectSubscriptionUpgradeCollection(result.value)?.version).toBe(2);
});
it('rejects mixing legacy transferable controls with the operator profile', () => {
  expect(() => buildSubscription({ version: '2', transferable: true, uri: 'ipfs://membership' })).toThrow();
});
