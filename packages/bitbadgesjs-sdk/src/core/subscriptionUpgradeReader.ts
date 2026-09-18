import type { SubscriptionQuoteResponse } from '../api-indexer/subscriptions.js';
import { QueryGetApprovalTrackerRequest, QueryGetApprovalTrackerResponse } from '../proto/tokenization/query_pb.js';
import { assertSubscriptionIdentifier } from '../api-indexer/subscriptions.js';

type ReadOptions = { lcdUrl: string; rpcUrl?: string; fetcher?: typeof fetch };
async function node(path: string, opts: ReadOptions, height?: string) {
  const url = opts.lcdUrl.replace(/\/$/, '');
  const response = await (opts.fetcher ?? fetch)(url + path, {
    headers: height ? { 'x-cosmos-block-height': height } : {},
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Subscription chain read failed (${response.status}).`);
  const returned = response.headers.get('x-cosmos-block-height');
  if (height && returned !== height) throw new Error('Node did not confirm the requested subscription snapshot height.');
  return response.json();
}
export async function readSubscriptionChainState(collectionId: string, creator: string, opts: ReadOptions) {
  assertSubscriptionIdentifier(collectionId);
  const latest = await node('/cosmos/base/tendermint/v1beta1/blocks/latest', opts);
  const header = latest.block?.header ?? latest.sdk_block?.header;
  if (!header?.height || !header.time) throw new Error('Node omitted subscription snapshot header.');
  const now = BigInt(Date.parse(header.time));
  if (Math.abs(Date.now() - Number(now)) > 60000) throw new Error('Subscription node is stale.');
  const prefix = '/bitbadges/bitbadgeschain/tokenization/';
  const readBalance = async (address: string) =>
    (await node(prefix + `get_balance/${collectionId}/${encodeURIComponent(address)}`, opts, header.height)).balance;
  const [result, subscriberBalance] = await Promise.all([node(prefix + `get_collection/${collectionId}`, opts, header.height), readBalance(creator)]);
  return { collection: result.collection, subscriberBalance, now, height: header.height, readBalance };
}
async function tracker(quote: SubscriptionQuoteResponse, opts: ReadOptions, height: string) {
  if (!opts.rpcUrl) throw new Error('Pass --rpc for a fresh offer tracker query.');
  const data = new QueryGetApprovalTrackerRequest({
    collectionId: quote.collectionId,
    approvalLevel: 'outgoing',
    approverAddress: quote.offer.operator,
    approvalId: quote.offer.approvalId,
    amountTrackerId: quote.offer.approvalId,
    trackerType: 'overall',
    approvedAddress: ''
  }).toBinary();
  const response = await (opts.fetcher ?? fetch)(opts.rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'abci_query',
      params: {
        path: '/tokenization.Query/GetApprovalTracker',
        data: Array.from(data, (byte) => byte.toString(16).padStart(2, '0')).join(''),
        height,
        prove: false
      }
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Subscription tracker query failed.');
  const body = await response.json();
  const value = body.result?.response;
  if (!value || String(value.height) !== height) throw new Error('Subscription tracker snapshot is unavailable.');
  if (Number(value.code ?? 0) !== 0) {
    if (Number(value.code) === 18 && value.codespace === 'sdk' && value.log === 'rpc error: code = InvalidArgument desc = invalid request: invalid request') return 0n;
    throw new Error('Subscription tracker lookup failed.');
  }
  const decoded = QueryGetApprovalTrackerResponse.fromBinary(Uint8Array.from(atob(value.value), (c) => c.charCodeAt(0)));
  if (!decoded.tracker) throw new Error('Subscription tracker is missing.');
  return BigInt(decoded.tracker.numTransfers);
}

export async function readSubscriptionQuoteChainState({
  quote,
  creator,
  ...opts
}: ReadOptions & { quote: SubscriptionQuoteResponse; creator: string }) {
  const state = await readSubscriptionChainState(quote.collectionId, creator, opts);
  const [operatorBalance, escrowBalance, outgoingTransfers] = await Promise.all([
    state.readBalance(quote.offer.operator),
    quote.offer.source ? state.readBalance(quote.offer.source.escrow) : undefined,
    tracker(quote, opts, state.height)
  ]);
  return {
    collection: state.collection,
    subscriberBalance: state.subscriberBalance,
    operatorBalance,
    escrowBalance,
    outgoingTransfers,
    now: state.now,
    height: state.height
  };
}

export async function readSubscriptionAccountChainState({ collectionId, creator, ...opts }: ReadOptions & { collectionId: string; creator: string }) {
  const { collection, subscriberBalance, now, height } = await readSubscriptionChainState(collectionId, creator, opts);
  return { collection, subscriberBalance, now, height };
}
