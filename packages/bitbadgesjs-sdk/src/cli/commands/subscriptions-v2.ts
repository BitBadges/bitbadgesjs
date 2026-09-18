import type { Command } from 'commander';
import {
  addIndexerOptions,
  emitIndexerResult as emit,
  emitIndexerError,
  resolveIndexerNetwork,
  type IndexerFlags
} from '../utils/indexer-options.js';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';
import { getSession, formatCookieHeader } from '../utils/auth-store.js';
import { requireBb1AddressStrict } from '../utils/address.js';
import { NETWORK_CONFIGS } from '../../signing/types.js';
import { verifySubscriptionQuoteAcceptance } from '../../core/subscriptionUpgradeAcceptance.js';
import { inspectSubscriptionUpgradeCollection } from '../../core/subscriptionUpgradeNative.js';
import { buildSubscriptionV2RenewalChange, inspectSubscriptionV2RenewalApproval } from '../../core/subscriptionUpgradeRenewal.js';
import { UserIncomingApproval } from '../../core/approvals.js';
import { readSubscriptionChainState as readChain, readSubscriptionQuoteChainState } from '../../core/subscriptionUpgradeReader.js';
const readOptions = (opts: Options) => ({
  lcdUrl: opts.lcd ?? NETWORK_CONFIGS[resolveIndexerNetwork(opts)].nodeUrl,
  rpcUrl:
    opts.rpc ??
    { mainnet: 'https://rpc.bitbadges.io:443', testnet: 'https://rpc-testnet.bitbadges.io:443', local: 'http://localhost:26657' }[
      resolveIndexerNetwork(opts)
    ]
});
const readSubscriptionChainState = (id: string, creator: string, opts: Options) => readChain(id, creator, readOptions(opts));
import { assertSubscriptionIdentifier, assertSubscriptionRequestId } from '../../api-indexer/subscriptions.js';
import type { SubscriptionQuoteResponse } from '../../api-indexer/subscriptions.js';
import { GO_MAX_UINT_64 } from '../../common/math.js';

const envelope = (message: any) => ({ typeUrl: `/${message.toProto().getType().typeName}`, value: message.toProto().toJson() });
type Options = IndexerFlags & {
  creator?: string;
  withSession?: boolean;
  lcd?: string;
  rpc?: string;
  kind?: string;
  tokenId?: string;
  requestId?: string;
  approvalId?: string;
  firstStart?: string;
  renewal?: string;
  expiresAt?: string;
};
async function request(method: string, path: string, opts: Options, body?: unknown, authenticated = true) {
  const network = resolveIndexerNetwork(opts);
  const creator = opts.creator ? requireBb1AddressStrict(opts.creator, '--creator') : undefined;
  const session = creator ? getSession(network, creator) : undefined;
  if (authenticated && (!opts.withSession || !session || session.expiresAt <= Date.now()))
    throw new Error('Sign in with bb auth login, then pass --creator and --with-session.');
  return apiRequest({
    method,
    path,
    body,
    apiKey: resolveApiKey(opts.apiKey, network),
    baseUrl: resolveBaseUrl({ local: opts.local, testnet: opts.testnet, baseUrl: opts.url }),
    ...(authenticated ? { cookie: formatCookieHeader(session!), cookieRef: { network, address: creator! } } : {})
  });
}
export async function prepareSubscriptionQuote(quote: SubscriptionQuoteResponse, opts: Options) {
  const creator = requireBb1AddressStrict(opts.creator!, '--creator');
  if (opts.renewal && !['disabled', 'target'].includes(opts.renewal)) throw new Error('Choose disabled or target renewal.');
  const [state, ledger] = await Promise.all([
    readSubscriptionQuoteChainState({ quote, creator, ...readOptions(opts) }),
    request('GET', `/subscriptions/periods?collectionId=${quote.collectionId}`, opts)
  ]);
  const verified = verifySubscriptionQuoteAcceptance({ quote, creator, ...state, periods: ledger.periods });
  const messages: any[] = buildSubscriptionV2RenewalChange({
    creator,
    collectionId: quote.collectionId,
    profile: verified.profile,
    incomingApprovals: (state.subscriberBalance.incomingApprovals ?? []).map((a: any) => new UserIncomingApproval(a).convert(BigInt)),
    target:
      opts.renewal === 'target'
        ? {
            tokenId: verified.offer.targetTokenId,
            firstIntervalStartTime: verified.periods.reduce((end, p) => (p.end > end ? p.end : end), 0n) + 1n,
            approvalId: opts.approvalId ?? '',
            transferTimes: [{ start: state.now, end: BigInt(opts.expiresAt ?? '0') }]
          }
        : undefined
  }).map(envelope);
  messages.push({ typeUrl: '/tokenization.MsgTransferTokens', value: verified.message.toProto().toJson() });
  return {
    messages,
    quoteId: quote.quoteId,
    chainHeight: state.height,
    paymentAmount: verified.paymentAmount,
    denom: verified.profile.denom,
    renewal: opts.renewal === 'target' ? 'target tier at the next billing boundary' : 'disabled'
  };
}
export function registerSubscriptionV2Commands(parent: Command) {
  const command = (name: string, description: string, auth = true) => {
    const cmd = addIndexerOptions(parent.command(name).description(description));
    if (auth) cmd.requiredOption('--creator <address>', 'Subscriber wallet').option('--with-session', 'Attach the selected signed-in session');
    return cmd;
  };
  const run =
    (fn: (...args: any[]) => Promise<unknown>) =>
    async (...args: any[]) => {
      try {
        const result = await fn(...args);
        emit(result, args[args.length - 2]);
      } catch (error) {
        emitIndexerError(error);
      }
    };
  command('config', 'Read the subscription operator configuration', false).action(
    run((opts: Options) => request('GET', '/subscriptions/config', opts, undefined, false))
  );
  command('quote', 'Request an exact purchase or immediate full-period-difference upgrade offer; does not sign')
    .argument('<collection-id>')
    .requiredOption('--kind <kind>', 'purchase or upgrade')
    .requiredOption('--token-id <id>', 'Target tier')
    .requiredOption('--request-id <id>', 'Stable retry identity')
    .action(
      run((id: string, opts: Options) => {
        assertSubscriptionIdentifier(id);
        assertSubscriptionIdentifier(opts.tokenId!);
        assertSubscriptionRequestId(opts.requestId!);
        if (!['purchase', 'upgrade'].includes(opts.kind!)) throw new Error('Choose purchase or upgrade.');
        return request('POST', '/subscriptions/quotes', opts, {
          collectionId: id,
          kind: opts.kind,
          targetTokenId: opts.tokenId,
          requestId: opts.requestId
        });
      })
    );
  command('quote-status', 'Read authenticated quote preparation and confirmation state')
    .argument('<quote-id>')
    .action(
      run((id: string, opts: Options) => {
        assertSubscriptionRequestId(id);
        return request('GET', `/subscriptions/quotes/${encodeURIComponent(id)}`, opts);
      })
    );
  command('periods', 'Read authenticated receipt-backed billing periods')
    .argument('<collection-id>')
    .action(
      run((id: string, opts: Options) => {
        assertSubscriptionIdentifier(id);
        return request('GET', `/subscriptions/periods?collectionId=${id}`, opts);
      })
    );
  command('accept', 'Verify a ready offer against fresh chain state and emit unsigned messages; cancels prior v2 renewal consent')
    .argument('<quote-id>')
    .option('--renewal <mode>', 'disabled or target; target requires a new approval ID and expiration', 'disabled')
    .option('--approval-id <id>', 'New unique subscription-v2-renewal- ID')
    .option('--expires-at <ms>', 'Last permitted future renewal charge time')
    .option('--lcd <url>', 'Chain REST endpoint')
    .option('--rpc <url>', 'CometBFT RPC endpoint for pinned offer tracker')
    .action(
      run(async (id: string, opts: Options) => {
        assertSubscriptionRequestId(id);
        return prepareSubscriptionQuote(await request('GET', `/subscriptions/quotes/${encodeURIComponent(id)}`, opts), opts);
      })
    );
  command('record-submission', 'Ask the operator to verify an already-broadcast transaction; does not broadcast')
    .argument('<quote-id>')
    .argument('<tx-hash>')
    .action(
      run((id: string, hash: string, opts: Options) => {
        assertSubscriptionRequestId(id);
        if (!/^(?:0x)?[a-fA-F0-9]{64}$/.test(hash)) throw new Error('Invalid transaction hash.');
        return request('POST', `/subscriptions/quotes/${encodeURIComponent(id)}/submission`, opts, { txHash: hash });
      })
    );
  command('renewal', 'Emit bounded v2 renewal consent at the next paid billing boundary; replaces prior v2 consent')
    .argument('<collection-id>')
    .requiredOption('--token-id <id>', 'Tier to renew; a lower tier begins after paid access ends')
    .requiredOption('--approval-id <id>', 'New unique subscription-v2-renewal- ID')
    .requiredOption('--expires-at <ms>', 'Last permitted charge time')
    .option('--lcd <url>', 'Chain REST endpoint')
    .action(
      run(async (id: string, opts: Options) => {
        const creator = requireBb1AddressStrict(opts.creator!, '--creator');
        const state = await readSubscriptionChainState(id, creator, opts);
        const profile = inspectSubscriptionUpgradeCollection(state.collection);
        if (!profile) throw new Error('This action requires an operator subscription profile.');
        const ledger = await request('GET', `/subscriptions/periods?collectionId=${id}`, opts);
        const active = ledger.periods.filter((p: any) => BigInt(p.end) >= state.now);
        if (!active.length) throw new Error('Purchase a full billing period before enabling renewal.');
        const firstIntervalStartTime = active.reduce((end: bigint, p: any) => (BigInt(p.end) > end ? BigInt(p.end) : end), 0n) + 1n;
        const expires = BigInt(opts.expiresAt!);
        if (expires < state.now || expires > GO_MAX_UINT_64) throw new Error('Invalid renewal expiration.');
        if (state.subscriberBalance.incomingApprovals.some((a: any) => a.approvalId === opts.approvalId))
          throw new Error('Choose a new renewal approval ID.');
        const messages = buildSubscriptionV2RenewalChange({
          creator,
          collectionId: id,
          profile,
          incomingApprovals: state.subscriberBalance.incomingApprovals.map((a: any) => new UserIncomingApproval(a).convert(BigInt)),
          target: {
            tokenId: BigInt(opts.tokenId!),
            approvalId: opts.approvalId!,
            firstIntervalStartTime,
            transferTimes: [{ start: state.now, end: expires }]
          }
        }).map(envelope);
        return { messages, firstIntervalStartTime, chainHeight: state.height };
      })
    );
  command('cancel-renewal', 'Emit deletion of one current v2 renewal consent; paid access remains')
    .argument('<collection-id>')
    .requiredOption('--approval-id <id>', 'Exact current consent ID')
    .option('--lcd <url>', 'Chain REST endpoint')
    .action(
      run(async (id: string, opts: Options) => {
        const creator = requireBb1AddressStrict(opts.creator!, '--creator');
        const state = await readSubscriptionChainState(id, creator, opts);
        const profile = inspectSubscriptionUpgradeCollection(state.collection);
        const approval = state.subscriberBalance.incomingApprovals.find((a: any) => a.approvalId === opts.approvalId);
        if (!profile || !approval || !inspectSubscriptionV2RenewalApproval(new UserIncomingApproval(approval).convert(BigInt), profile))
          throw new Error('No matching v2 renewal consent.');
        return {
          messages: [{ typeUrl: '/tokenization.MsgDeleteIncomingApproval', value: { creator, collectionId: id, approvalId: opts.approvalId } }]
        };
      })
    );
}
