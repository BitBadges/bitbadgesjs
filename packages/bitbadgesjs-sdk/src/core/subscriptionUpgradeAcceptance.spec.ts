import { convertToBitBadgesAddress } from '../address-converter/converter.js';
import { buildSubscriptionUpgradeCollection, buildSubscriptionUpgradeOffer, buildSubscriptionUpgradeEscrow } from './subscriptionUpgradeNative.js';
import { verifySubscriptionQuoteAcceptance } from './subscriptionUpgradeAcceptance.js';
const operator = convertToBitBadgesAddress('0x' + '1'.repeat(40));
const subscriber = convertToBitBadgesAddress('0x' + '2'.repeat(40));
const profile = {
  version: 2 as const,
  operator,
  escrowStoreId: 1n,
  denom: 'ubadge',
  duration: 1000n,
  tiers: [
    { tokenId: 1n, price: 10n },
    { tokenId: 2n, price: 20n }
  ],
  payouts: [{ recipient: operator, weightBps: 10000n }]
};
const wire = (v: any) => JSON.parse(JSON.stringify(v, (_, x) => (typeof x === 'bigint' ? x.toString() : x)));
function fixture() {
  const offer = {
    collectionId: 1n,
    operator,
    subscriber,
    initiator: subscriber,
    approvalId: 'offer-1',
    createdAt: 100n,
    expiresAt: 150n,
    targetTokenId: 1n,
    tierCount: 2n,
    ownershipTimes: [{ start: 100n, end: 1099n }],
    payments: [{ to: operator, denom: 'ubadge', amount: 10n }]
  };
  const collection = { ...buildSubscriptionUpgradeCollection({ profile, uri: 'ipfs://test' }).value, collectionId: '1' };
  return {
    quote: {
      quoteId: 'quote-1',
      state: 'ready',
      kind: 'purchase',
      collectionId: '1',
      subscriber,
      createdAt: '100',
      expiresAt: '150',
      denom: 'ubadge',
      paymentAmount: '10',
      periods: [{ periodId: 'period-1', tokenId: '1', start: '100', end: '1099', paidAmount: '10' }],
      offer: wire(offer),
      versions: { surrender: '0', delivery: '0', outgoing: '0' }
    },
    creator: subscriber,
    now: 120n,
    collection,
    periods: [],
    operatorBalance: {
      outgoingApprovals: [buildSubscriptionUpgradeOffer(offer).approval],
      balances: [{ amount: '100', tokenIds: [{ start: '1', end: '2' }], ownershipTimes: [{ start: '1', end: '2000' }] }]
    },
    subscriberBalance: { balances: [] },
    outgoingTransfers: 0n
  } as any;
}
it('reconstructs a verified unsigned purchase from current chain terms', () => {
  const value = verifySubscriptionQuoteAcceptance(fixture());
  expect(value.message.creator).toBe(subscriber);
  expect(value.message.transfers[0].balances[0].amount).toBe(1n);
});
it.each([
  ['server price', (x: any) => (x.quote.paymentAmount = '1')],
  ['short service period', (x: any) => (x.quote.periods[0].end = '101')],
  ['stale version', (x: any) => (x.quote.versions.outgoing = '1')],
  ['reused offer', (x: any) => (x.outgoingTransfers = 1n)],
  ['wrong wallet', (x: any) => (x.creator = operator)],
  ['expired quote', (x: any) => (x.now = 151n)],
  ['changed payout', (x: any) => (x.quote.offer.payments[0].to = subscriber)],
  ['overlapping access', (x: any) => (x.subscriberBalance.balances = x.operatorBalance.balances)],
  ['empty inventory', (x: any) => (x.operatorBalance.balances = [])]
])('rejects %s', (_, mutate) => {
  const x = fixture();
  mutate(x);
  expect(() => verifySubscriptionQuoteAcceptance(x)).toThrow();
});

function upgrade() {
  const x = fixture();
  const escrow = convertToBitBadgesAddress('0x' + '3'.repeat(40));
  x.quote.kind = 'upgrade';
  x.quote.offer.targetTokenId = '2';
  x.quote.offer.ownershipTimes = [{ start: '100', end: '1000' }];
  x.quote.offer.source = { tokenId: '1', escrow, ownershipTimes: x.quote.offer.ownershipTimes };
  x.periods = [{ periodId: 'paid-period', tokenId: '1', start: '1', end: '1000', paidAmount: '10' }];
  x.quote.periods = [{ ...x.periods[0], tokenId: '2', paidAmount: '20' }];
  x.quote.versions.intake = '0';
  const o = {
    ...x.quote.offer,
    collectionId: 1n,
    createdAt: 100n,
    expiresAt: 150n,
    targetTokenId: 2n,
    tierCount: 2n,
    ownershipTimes: [{ start: 100n, end: 1000n }],
    payments: [{ to: operator, denom: 'ubadge', amount: 10n }],
    source: { tokenId: 1n, escrow, ownershipTimes: [{ start: 100n, end: 1000n }] }
  };
  x.operatorBalance.outgoingApprovals = [buildSubscriptionUpgradeOffer(o).approval];
  x.subscriberBalance.balances = [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: [{ start: '1', end: '1000' }] }];
  const sink = buildSubscriptionUpgradeEscrow(o);
  x.escrowBalance = {
    balances: [],
    incomingApprovals: sink.incomingApprovals,
    outgoingApprovals: [],
    userPermissions: sink.userPermissions,
    autoApproveAllIncomingTransfers: false,
    autoApproveSelfInitiatedIncomingTransfers: false,
    autoApproveSelfInitiatedOutgoingTransfers: false
  };
  return x;
}
it('preserves paid billing identity and atomically surrenders before upgrade', () => {
  const result = verifySubscriptionQuoteAcceptance(upgrade());
  expect(result.periods[0].periodId).toBe('paid-period');
  expect(result.paymentAmount).toBe(10n);
  expect(result.message.transfers.map((t) => t.from)).toEqual([subscriber, operator]);
});
it.each([
  ['fake paid basis', (x: any) => (x.periods[0].paidAmount = '1')],
  ['new billing identity', (x: any) => (x.quote.periods[0].periodId = 'quota-reset')],
  ['duplicate old access', (x: any) => (x.subscriberBalance.balances[0].amount = '2')],
  ['funded escrow', (x: any) => (x.escrowBalance.balances = x.subscriberBalance.balances)],
  ['escapable escrow', (x: any) => (x.escrowBalance.autoApproveSelfInitiatedOutgoingTransfers = true)],
  ['unlocked escrow', (x: any) => (x.escrowBalance.userPermissions.canUpdateOutgoingApprovals = [])],
  ['stale intake', (x: any) => (x.quote.versions.intake = '1')]
])('rejects upgrade with %s', (_, mutate) => {
  const x = upgrade();
  mutate(x);
  expect(() => verifySubscriptionQuoteAcceptance(x)).toThrow();
});
