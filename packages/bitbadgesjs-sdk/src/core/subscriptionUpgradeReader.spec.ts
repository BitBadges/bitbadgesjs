import { buildSubscriptionUpgradeCollection } from './subscriptionUpgradeNative.js';
import { buildSubscriptionV2RenewalApproval, inspectSubscriptionV2RenewalApproval } from './subscriptionUpgradeRenewal.js';
import { convertToBitBadgesAddress } from '../address-converter/converter.js';
import { createServer, type Server } from 'node:http';
import { readSubscriptionQuoteChainState } from './subscriptionUpgradeReader.js';
import { QueryGetApprovalTrackerRequest, QueryGetApprovalTrackerResponse } from '../proto/tokenization/query_pb.js';
const operator = convertToBitBadgesAddress('0x' + '1'.repeat(40));
const profile = {
  version: 2 as const,
  operator,
  escrowStoreId: 1n,
  denom: 'ubadge',
  duration: 1000n,
  tiers: [{ tokenId: 1n, price: 10n }],
  payouts: [{ recipient: operator, weightBps: 10000n }]
};
const collection = { ...buildSubscriptionUpgradeCollection({ profile, uri: 'ipfs://test' }).value, collectionId: '1' };
const consent = buildSubscriptionV2RenewalApproval({
  profile,
  tokenId: 1n,
  firstIntervalStartTime: 1000n,
  approvalId: 'subscription-v2-renewal-test',
  transferTimes: [{ start: 1n, end: 10000n }]
});
const balance = { ...collection.defaultBalances, balances: [], incomingApprovals: [consent] };
const wire = (value: unknown) => JSON.stringify(value, (_, x) => (typeof x === 'bigint' ? x.toString() : x));
let server: Server;
let url: string;
let wrongHeight = false;
let expired = false;
let requests: any[] = [];
let trackerError: any;
beforeEach(async () => {
  wrongHeight = false;
  expired = false;
  trackerError = undefined;
  requests = [];
  server = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    res.setHeader('content-type', 'application/json');
    if (req.method === 'POST') {
      const body = JSON.parse(raw);
      requests.push(body);
      const query = QueryGetApprovalTrackerRequest.fromBinary(Buffer.from(body.params.data, 'hex'));
      expect(query.approvedAddress).toBe('');
      expect(query.approvalId).toBe('offer');
      expect(body.params.height).toBe('123');
      if (trackerError) {
        res.end(JSON.stringify({ result: { response: { height: '123', ...trackerError } } }));
        return;
      }
      const value = new QueryGetApprovalTrackerResponse({ tracker: { numTransfers: '0' } }).toBinary();
      res.end(JSON.stringify({ result: { response: { height: '123', code: 0, value: Buffer.from(value).toString('base64') } } }));
      return;
    }
    if (req.url?.endsWith('blocks/latest')) {
      res.end(JSON.stringify({ block: { header: { height: '123', time: new Date(Date.now() - (expired ? 120000 : 0)).toISOString() } } }));
      return;
    }
    expect(req.headers['x-cosmos-block-height']).toBe('123');
    res.setHeader('x-cosmos-block-height', wrongHeight ? '124' : '123');
    res.end(wire({ collection, balance }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
const quote = { collectionId: '1', offer: { operator: 'operator', approvalId: 'offer' } } as any;
it('uses the same pinned height for LCD and protobuf tracker transport', async () => {
  const state = await readSubscriptionQuoteChainState({ quote, creator: 'subscriber', lcdUrl: url, rpcUrl: url });
  expect(state.height).toBe('123');
  expect(state.outgoingTransfers).toBe(0n);
  expect(inspectSubscriptionV2RenewalApproval(state.subscriberBalance.incomingApprovals[0], profile)?.tokenId).toBe(1n);
  expect(requests).toHaveLength(1);
});
it('rejects an endpoint that ignores the pinned height', async () => {
  wrongHeight = true;
  await expect(readSubscriptionQuoteChainState({ quote, creator: 'subscriber', lcdUrl: url, rpcUrl: url })).rejects.toThrow('snapshot height');
});
it('rejects a stale node before constructing a proposal', async () => {
  expired = true;
  await expect(readSubscriptionQuoteChainState({ quote, creator: 'subscriber', lcdUrl: url, rpcUrl: url })).rejects.toThrow('stale');
});

it('recognizes the exact native absent tracker response observed on the disposable chain', async () => {
  trackerError = { code: 18, codespace: 'sdk', log: 'rpc error: code = InvalidArgument desc = invalid request: invalid request' };
  expect((await readSubscriptionQuoteChainState({ quote, creator: 'subscriber', lcdUrl: url, rpcUrl: url })).outgoingTransfers).toBe(0n);
});
it('does not turn other tracker failures into an unused allowance', async () => {
  trackerError = { code: 18, codespace: 'sdk', log: 'query failed: unavailable' };
  await expect(readSubscriptionQuoteChainState({ quote, creator: 'subscriber', lcdUrl: url, rpcUrl: url })).rejects.toThrow('lookup failed');
});
