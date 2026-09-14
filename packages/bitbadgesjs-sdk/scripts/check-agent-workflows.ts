import assert from 'node:assert/strict';
import http from 'node:http';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../dist/esm/builder/server.js';
import { callTool } from '../dist/esm/builder/tools/registry.js';
import { executeInstalledCli } from '../dist/esm/builder/tools/standardActions.js';
import { listStandardBuilders } from '../dist/esm/core/builders/input-schemas.js';
import { BitBadgesCollection } from '../dist/esm/api-indexer/BitBadgesCollection.js';
import { AddressList } from '../dist/esm/core/addressLists.js';
import { PAYMENT_REQUEST_EXAMPLES, paymentRequestExample } from '../dist/esm/cli/utils/payment-request-examples.js';
import { saveSigningRequest } from '../dist/esm/cli/utils/signing-requests.js';

const sandbox = mkdtempSync(path.join(tmpdir(), 'bb-agent-workflows-'));
const entry = path.resolve('dist/cjs/cli/index.js');
const clock = path.join(sandbox, 'clock.cjs');
const launcher = path.join(sandbox, 'bitbadges-cli');
const quote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;
writeFileSync(clock, 'Date.now = () => 1893456000000;\n');
writeFileSync(launcher, `#!/bin/sh\nexec ${quote(process.execPath)} --require ${quote(clock)} ${quote(entry)} "$@"\n`);
chmodSync(launcher, 0o755);
const keys = ['BITBADGES_CLI_PATH', 'BITBADGES_CONFIG_DIR', 'BITBADGES_API_URL', 'BITBADGES_API_KEY'] as const;
const prior = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
process.env.BITBADGES_CLI_PATH = launcher;
process.env.BITBADGES_CONFIG_DIR = sandbox;
process.env.BITBADGES_API_KEY = 'local-fixture-key';
const originalNow = Date.now;
Date.now = () => 1893456000000;
const collections = new Map<string, any>();
const unexpected: string[] = [];
let failBalances = false;
let incomingApprovals: any[] = [];
const api = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  const match = url.pathname.match(/^\/api\/v0\/collection\/([^/]+)(.*)$/);
  res.setHeader('Content-Type', 'application/json');
  if (match && collections.has(match[1])) {
    if (match[2].startsWith('/balance/')) {
      if (failBalances) {
        res.statusCode = 503;
        res.end(JSON.stringify({ errorMessage: 'Fixture balance lookup unavailable' }));
        return;
      }
      res.end(JSON.stringify({ incomingApprovals, balances: [] }));
      return;
    }
    if (match[2] === '/owners') {
      res.end(JSON.stringify({ owners: [], pagination: { hasMore: false } }));
      return;
    }
    if (!match[2]) {
      res.end(JSON.stringify({ collection: collections.get(match[1]) }));
      return;
    }
  }
  unexpected.push(`${req.method} ${url.pathname}`);
  res.statusCode = 404;
  res.end('{}');
});
await new Promise<void>((resolve) => api.listen(0, '127.0.0.1', resolve));
process.env.BITBADGES_API_URL = `http://127.0.0.1:${(api.address() as { port: number }).port}/api/v0`;
const server = createServer();
const client = new Client({ name: 'agent-workflow-test', version: '1.0.0' });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
await server.connect(serverTransport);
await client.connect(clientTransport);
let actions = 0;
const creator = 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm';
function collectionFixture(value: any, collectionId: string) {
  function details(value: any): any {
    if (Array.isArray(value)) return value.map(details);
    if (!value || typeof value !== 'object') return value;
    const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, details(item)]));
    for (const key of ['fromList', 'toList', 'initiatedByList']) {
      if (typeof value[`${key}Id`] === 'string') result[key] = AddressList.getReservedAddressList(value[`${key}Id`]);
    }
    return result;
  }
  return new BitBadgesCollection(
    details({
      cosmosCoinWrapperPaths: [],
      aliasPaths: [],
      invariants: {},
      ...value,
      collectionId,
      _docId: collectionId,
      createdBy: creator,
      createdBlock: '1',
      createdTimestamp: '1',
      updateHistory: [],
      activity: [],
      owners: [],
      challengeTrackers: [],
      approvalTrackers: [],
      listings: [],
      claims: [],
      views: {}
    })
  ).convert(String);
}
async function action(name: string, input: Record<string, unknown>, nativeArgs: string[]) {
  const result = await client.callTool({ name, arguments: input });
  assert.ok(!result.isError, `${name}: ${JSON.stringify(result)}`);
  const native = await executeInstalledCli(nativeArgs);
  assert.equal(native.ok, true, JSON.stringify(native));
  assert.deepEqual(result.structuredContent, native, `${name} CLI/MCP parity`);
  actions++;
  return native.data;
}

try {
  const families = [
    ['payment-request', 'pay-requests', 'pay', {}],
    ['subscription', 'subscriptions', 'claim', {}],
    ['smart-token', 'smart-tokens', 'deposit', { amount: '1', baseUnits: true }],
    ['credit-token', 'credit-tokens', 'purchase', { units: '1' }],
    ['product-catalog', 'products', 'purchase', { tokenId: '1' }],
    ['auction', 'auctions', 'cancel-bid', { approvalId: 'example-bid' }],
    ['crowdfund', 'crowdfunds', 'contribute', { amount: '1', baseUnits: true }],
    ['bounty', 'bounties', 'accept', {}],
    ['prediction-market', 'prediction-markets', 'cancel', { approvalId: 'example-order', side: 'buy' }]
  ] as const;
  let subscriptionId = '';
  for (const [builder, family, verb, extra] of families) {
    const definition = listStandardBuilders().find((item) => item.id === builder)!;
    const proposal = await callTool(`build_${builder.replace(/-/g, '_')}`, definition.example);
    assert.ok(!proposal.isError, proposal.text);
    const collectionId = String(collections.size + 1);
    collections.set(collectionId, collectionFixture(proposal.result.value, collectionId));
    if (builder === 'subscription') subscriptionId = collectionId;
    const input = { collectionId, creator, ...extra };
    const native = [family, verb, '--creator', creator];
    for (const [key, value] of Object.entries(extra)) {
      if (key === 'approvalId') continue;
      const flag = '--' + key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());
      native.push(value === true ? flag : `${flag}=${value}`);
    }
    native.push('--', collectionId);
    if ('approvalId' in extra) native.push(extra.approvalId);
    await action(`standard_${family}_${verb}`.replace(/-/g, '_'), input, native);
    if (builder === 'smart-token') {
      const inspected = await action('standard_standards_inspect', { collectionId, family: 'smart-token' }, [
        'standards',
        'inspect',
        collectionId,
        '--family',
        'smart-token'
      ]);
      assert.equal(inspected.configurationSupported, true);
      assert.equal(inspected.eligibility, 'not-checked');
      const shown = await action('standard_smart_tokens_show', {collectionId}, ['smart-tokens','show',collectionId]);
      assert.equal(shown.depositApprovalId, 'smart-token-deposit');
      assert.equal(typeof shown.tradable, 'boolean');
      assert.equal(shown.status, undefined);

      const c = collections.get(collectionId);
      c.collectionApprovals.push({ ...c.collectionApprovals[0], approvalId: 'alternate-deposit', version: '7' });
      const ambiguous = await executeInstalledCli(['smart-tokens', 'deposit', collectionId, '--creator', creator, '--amount', '1', '--base-units']);
      assert.equal(ambiguous.ok, false);
      assert.match(ambiguous.error.message, /approval-id/);
      const exact = await action(
        'standard_smart_tokens_deposit',
        { collectionId, creator, amount: '9007199.254740993', approvalId: 'alternate-deposit' },
        ['smart-tokens', 'deposit', collectionId, '--creator', creator, '--amount', '9007199.254740993', '--approval-id', 'alternate-deposit']
      );
      assert.equal(exact.value.transfers[0].balances[0].amount, '9007199254740993');
      assert.equal(exact.value.transfers[0].prioritizedApprovals[0].version, '7');
      for (const amount of ['0', '-1', '1e3', '1.0000000001']) {
        const invalid = await executeInstalledCli([
          'smart-tokens',
          'deposit',
          collectionId,
          '--creator',
          creator,
          '--amount',
          amount,
          '--approval-id',
          'alternate-deposit'
        ]);
        assert.equal(invalid.ok, false, amount);
      }
      c.invariants.cosmosCoinBackedPath.conversion.sideA.amount = '2';
      const unsupported = await action('standard_standards_inspect', { collectionId, family: 'smart-token' }, [
        'standards',
        'inspect',
        collectionId,
        '--family',
        'smart-token'
      ]);
      assert.equal(unsupported.recognized, true);
      assert.equal(unsupported.configurationSupported, false);
    }
    if (builder === 'credit-token') {
      const units = '9007199254740993';
      const quote = await action('standard_credit_tokens_quote', { collectionId, units }, ['credit-tokens', 'quote', collectionId, '--units', units]);
      assert.equal(quote.requestedMultiplier, units);
      assert.equal(quote.actualMultiplier, units);
      assert.equal(quote.payment.baseAmount, units);
      assert.equal(quote.remainingCredits, null);
      const approval = collections.get(collectionId).collectionApprovals[0];
      approval.approvalCriteria.predeterminedBalances.incrementedBalances.maxScalingMultiplier = '2';
      const rejected = await client.callTool({ name: 'standard_credit_tokens_purchase', arguments: { collectionId, creator, units: '3' } });
      assert.equal(rejected.isError, true, 'over-limit purchase must fail rather than shrink');
      const cliRejected = await executeInstalledCli(['credit-tokens', 'purchase', collectionId, '--creator', creator, '--units', '3']);
      assert.equal(cliRejected.ok, false);
      assert.match(cliRejected.error.message, /maximum 2/);
    }
  }
  for (const verb of ['enable-renewal', 'subscribe']) {
    await action(`standard_subscriptions_${verb.replace(/-/g, '_')}`, { collectionId: subscriptionId, creator, approvalId: 'fixture-renewal' }, [
      'subscriptions',
      verb,
      subscriptionId,
      '--creator',
      creator,
      '--approval-id',
      'fixture-renewal'
    ]);
  }
  for (const example of PAYMENT_REQUEST_EXAMPLES) {
    const params = paymentRequestExample(example.id);
    const built = await callTool('build_payment_request_v2', params);
    assert.ok(!built.isError, built.text);
    const collectionId = String(collections.size + 1);
    collections.set(collectionId, collectionFixture(built.result.value, collectionId));
    for (const obligation of params.obligations) {
      const payer = obligation.payer.kind === 'addresses' ? obligation.payer.addresses[0] : 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d';
      await action('standard_pay_requests_pay', { collectionId, creator: payer, obligation: obligation.id }, [
        'pay-requests',
        'pay',
        collectionId,
        '--creator',
        payer,
        '--obligation',
        obligation.id
      ]);
    }
  }
  const unrelated = {
    approvalId: 'unrelated-consent',
    fromListId: 'All',
    initiatedByListId: creator,
    tokenIds: [{ start: '9', end: '9' }],
    transferTimes: [{ start: '1', end: '18446744073709551615' }],
    ownershipTimes: [{ start: '1', end: '18446744073709551615' }]
  };
  incomingApprovals = [unrelated];
  const renewal = await action('standard_subscriptions_enable_renewal', { collectionId: subscriptionId, creator, approvalId: 'fixture-renewal' }, [
    'subscriptions',
    'enable-renewal',
    subscriptionId,
    '--creator',
    creator,
    '--approval-id',
    'fixture-renewal'
  ]);
  assert.ok(renewal.value.incomingApprovals.some((approval: any) => approval.approvalId === 'unrelated-consent'));
  failBalances = true;
  const failed = await client.callTool({ name: 'standard_subscriptions_enable_renewal', arguments: { collectionId: subscriptionId, creator } });
  assert.equal(failed.isError, true);
  const unsafe = await client.callTool({ name: 'standard_pay_requests_pay', arguments: { collectionId: '1', creator, browser: true } });
  assert.equal(unsafe.isError, true);
  const requestId = 'a'.repeat(32);
  saveSigningRequest({
    version: 2,
    requestId,
    expectedAddress: creator,
    network: 'mainnet',
    chain: 'cosmos',
    chainId: 'bitbadges-1',
    evmChainId: '50024',
    expiresAt: Date.now() + 60000,
    signOnly: false,
    txsInfo: [{ type: 'MsgSend', msg: {} }]
  });
  assert.deepEqual((await executeInstalledCli(['dev', 'requests', 'list'])).data.requestIds, [requestId]);
  for (const verb of ['status', 'resume']) {
    const result = await executeInstalledCli(['dev', 'requests', verb, requestId]);
    assert.equal(result.ok, true);
    assert.equal(result.data.outcome, 'unknown');
    assert.equal(result.data.retrySafe, false);
    assert.equal(result.data.canResume, false);
    assert.equal(result.data.signUrl, undefined);
  }
  const recovered = await client.callTool({ name: 'signing_request_status', arguments: { requestId, resume: true } });
  assert.equal(recovered.isError, undefined);
  assert.equal((recovered.structuredContent as any).outcome, 'unknown');
  assert.deepEqual(unexpected, []);
  console.log(
    `Agent workflows passed: ${actions} CLI/MCP proposal comparisons across nine standard families and all nine payment examples; approval preservation, failure propagation, and lost-listener recovery verified. Local HTTP fixtures only, no signing or broadcast.`
  );
} finally {
  await client.close();
  await server.close();
  await new Promise<void>((resolve) => api.close(() => resolve()));
  Date.now = originalNow;
  for (const key of keys) {
    if (prior[key] === undefined) delete process.env[key];
    else process.env[key] = prior[key];
  }
  rmSync(sandbox, { recursive: true, force: true });
}
