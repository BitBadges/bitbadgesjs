import { Wallet, JsonRpcProvider } from 'ethers';
import { convertToBitBadgesAddress } from '../src/address-converter/converter.js';
import { MsgTransferTokens } from '../src/transactions/messages/bitbadges/tokenization/msgTransferTokens.js';
import { convertMessageToPrecompileCall, convertMessagesToExecuteMultiple } from '../src/transactions/precompile/utils.js';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Database } from 'bun:sqlite';
import { createProviderHandler } from '../examples/spendable-credit-provider/server.js';
import { buildSpendableCredit } from '../src/core/builders/spendable-credit.js';
import {
  buildPurchaseSpendableCreditsMsg,
  buildConsumeSpendableCreditsMsg,
  inspectSpendableCredit,
  verifySpendableCreditReceipt
} from '../src/core/spendable-credits.js';

const binary = process.argv[2];
assert(binary && binary.startsWith('/'), 'Pass the absolute path to a binary built from the accepted public/chain pin.');
const chainHome = mkdtempSync(join(tmpdir(), 'bb-spendable-chain-'));
const chainId = 'bitbadges-1';
const logPath = join(chainHome, 'chain.log');
const json = (value: unknown) => JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item));
const delay = (ms: number) => new Promise((done) => setTimeout(done, ms));

function cli(args: string[]): string {
  try {
    return execFileSync(resolve(binary), [...args, '--home', chainHome], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000 });
  } catch (error) {
    const failure = error as { stderr?: Buffer | string };
    if (args[0] === 'keys') throw new Error('Could not create disposable test key.');
    throw new Error(`Local chain command ${args.slice(0, 3).join(' ')} failed: ${String(failure.stderr ?? '').slice(-4000)}`);
  }
}

async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const port = (server.address() as { port: number }).port;
  await new Promise<void>((done) => server.close(() => done()));
  return port;
}

let chain: ReturnType<typeof spawn> | undefined;
let log: number | undefined;
try {
  cli(['init', 'spendable-smoke', '--chain-id', chainId]);
  const accounts: Record<string, string> = {};
  for (const name of ['operator', 'holder']) {
    cli(['keys', 'add', name, '--keyring-backend', 'test', '--output', 'json']);
    accounts[name] = cli(['keys', 'show', name, '-a', '--keyring-backend', 'test']).trim();
  }

  const evmWallet = Wallet.createRandom();
  accounts.evm = convertToBitBadgesAddress(evmWallet.address);
  const built = buildSpendableCredit({
    provider: accounts.operator,
    serviceId: 'images',
    paymentDenom: 'USDC',
    pricePerPack: '1000000',
    creditsPerPack: '10',
    uri: 'ipfs://local-spendable-smoke'
  });
  const denom = built.value.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins[0].denom;
  for (const address of Object.values(accounts)) {
    cli(['genesis', 'add-genesis-account', address, `100000000000000000ubadge,1000000000000000ustake,1000000000${denom}`]);
  }
  const genesisPath = join(chainHome, 'config/genesis.json');
  const genesis = JSON.parse(readFileSync(genesisPath, 'utf8'));
  genesis.app_state.evm.params.active_static_precompiles = [
    ...new Set([...(genesis.app_state.evm.params.active_static_precompiles ?? []), '0x0000000000000000000000000000000000001001'])
  ];
  genesis.app_state.staking.params.bond_denom = 'ustake';
  genesis.app_state.mint.params.mint_denom = 'ustake';
  genesis.consensus.params.block.max_gas = '40000000';
  writeFileSync(genesisPath, json(genesis));
  cli(['genesis', 'gentx', 'operator', '1000000000000000ustake', '--chain-id', chainId, '--keyring-backend', 'test']);
  cli(['genesis', 'collect-gentxs']);
  cli(['genesis', 'validate']);
  const configPath = join(chainHome, 'config/config.toml');
  writeFileSync(configPath, readFileSync(configPath, 'utf8').replace(/^timeout_commit = .*$/m, 'timeout_commit = "500ms"'));
  const rpc = `http://127.0.0.1:${await freePort()}`;
  const p2p = `tcp://127.0.0.1:${await freePort()}`;
  const grpc = `127.0.0.1:${await freePort()}`;
  const rest = `http://127.0.0.1:${await freePort()}`;
  const evmRpc = `http://127.0.0.1:${await freePort()}`;
  const evmWs = `127.0.0.1:${await freePort()}`;
  const appConfig = join(chainHome, 'config/app.toml');
  writeFileSync(
    appConfig,
    readFileSync(appConfig, 'utf8')
      .replace(/(\[api\][\s\S]*?\naddress = )[^\n]+/, `$1"${rest.replace('http:', 'tcp:')}"`)
      .replace(/(\[json-rpc\][\s\S]*?\naddress = )[^\n]+/, `$1"${evmRpc.replace('http://', '')}"`)
      .replace(/(\[json-rpc\][\s\S]*?\nws-address = )[^\n]+/, `$1"${evmWs}"`)
  );
  log = openSync(logPath, 'a', 0o600);
  chain = spawn(
    resolve(binary),
    [
      'start',
      '--home',
      chainHome,
      '--minimum-gas-prices',
      '0ubadge',
      '--rpc.laddr',
      rpc.replace('http:', 'tcp:'),
      '--p2p.laddr',
      p2p,
      '--rpc.pprof_laddr',
      `127.0.0.1:${await freePort()}`,
      '--grpc.address',
      grpc,
      '--api.enable=true',
      '--grpc-web.enable=false',
      '--json-rpc.enable=true'
    ],
    { stdio: ['ignore', log, log] }
  );
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (chain.exitCode !== null) throw new Error(`Disposable chain exited: ${readFileSync(logPath, 'utf8').slice(-4000)}`);
    try {
      const status = (await (await fetch(`${rpc}/status`, { signal: AbortSignal.timeout(5000) })).json()) as any;
      if (Number(status.result.sync_info.latest_block_height) > 0) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for the isolated RPC listener. */
    }
    await delay(500);
  }
  assert(ready, 'Disposable chain did not become ready.');
  const query = (args: string[]) => JSON.parse(cli(['query', ...args, '--node', rpc, '--output', 'json']));
  async function send(command: string, value: any, signer: string, expectedSuccess = true) {
    const file = join(chainHome, 'message.json');
    writeFileSync(file, json(value));
    const submitted = JSON.parse(
      cli([
        'tx',
        'tokenization',
        command,
        ...(command === 'cast-vote'
          ? [value.collection_id, value.approval_level, value.approver_address || '', value.approval_id, value.proposal_id, value.yes_weight]
          : [file]),
        '--from',
        signer,
        '--keyring-backend',
        'test',
        '--chain-id',
        chainId,
        '--node',
        rpc,
        '--gas',
        '10000000',
        '--fees',
        '1000000ubadge',
        '--yes',
        '--output',
        'json'
      ])
    );
    assert.equal(submitted.code, 0, `CheckTx rejected ${command}`);
    let result: any;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        result = query(['tx', submitted.txhash]);
        break;
      } catch {
        await delay(250);
      }
    }
    assert(result, 'Submitted transaction did not reach a block.');
    if (expectedSuccess) assert.equal(result.code, 0, result.raw_log);
    else assert.notEqual(result.code, 0, 'Invalid consumption unexpectedly succeeded.');
    return result;
  }

  await send('universal-update-collection', { ...built.value, creator: accounts.operator }, 'operator');
  const collection = query(['tokenization', 'collection', '1']).collection;
  inspectSpendableCredit(collection);
  const balance = () =>
    (query(['tokenization', 'balance', '1', accounts.holder]).balance.balances as any[]).reduce((sum, b) => sum + BigInt(b.amount), 0n);
  await send('transfer-tokens', buildPurchaseSpendableCreditsMsg(collection, accounts.holder, '1').value, 'holder');
  assert.equal(balance(), 10n);
  const dbPath = join(chainHome, 'provider.sqlite');
  const db = new Database(dbPath);
  const handlerOptions = {
    db,
    collectionId: '1',
    chainId,
    provider: accounts.operator,
    serviceId: 'images',
    units: '3',
    nodeUrl: rest,
    authenticate: async (r: Request) => (r.headers.get('authorization') === 'Bearer holder-session' ? accounts.holder : accounts.operator)
  };
  let handler = createProviderHandler(handlerOptions);
  const callProvider = (path: string, body: any, session = 'holder-session') =>
    handler(
      new Request(`http://provider${path}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${session}`, 'content-type': 'application/json' },
        body: json(body)
      })
    );
  const issued = (await (await callProvider('/requests', {})).json()) as any;
  const request = { ...issued, wallet: accounts.holder };

  const consume = buildConsumeSpendableCreditsMsg(collection, request);
  const response = await send('transfer-tokens', consume.value, 'holder');
  assert.equal(balance(), 7n);
  const receipt = verifySpendableCreditReceipt(collection, response, request);
  const claim = { requestId: issued.requestId, secret: issued.secret, txHash: response.txhash };
  const fulfillment = await callProvider('/fulfill', claim);
  const entitlement = (await fulfillment.json()) as any;
  assert.equal(fulfillment.status, 200, json(entitlement));
  assert.equal((await callProvider('/fulfill', claim, 'other-customer')).status, 403);
  assert.equal((await callProvider('/fulfill', { ...claim, secret: 'wrong' })).status, 400);
  for (const result of await Promise.all(Array.from({ length: 8 }, () => callProvider('/fulfill', claim))))
    assert.deepEqual(await result.json(), entitlement);
  db.close();
  const reopenedDb = new Database(dbPath);
  handler = createProviderHandler({ ...handlerOptions, db: reopenedDb, nodeUrl: 'http://127.0.0.1:1' });
  assert.deepEqual(await (await callProvider('/fulfill', claim)).json(), entitlement);
  reopenedDb.close();

  const stolen = structuredClone(consume.value);
  stolen.creator = accounts.operator;
  await send('transfer-tokens', stolen, 'operator', false);
  assert.equal(balance(), 7n);
  const peer = structuredClone(consume.value);
  peer.transfers[0].toAddresses = [accounts.operator];
  await send('transfer-tokens', peer, 'holder', false);
  await send(
    'transfer-tokens',
    buildConsumeSpendableCreditsMsg(collection, { ...request, requestId: 'overdraft', units: '8' }).value,
    'holder',
    false
  );
  assert.equal(balance(), 7n);
  await send('transfer-tokens', buildConsumeSpendableCreditsMsg(collection, { ...request, requestId: 'remaining', units: '7' }).value, 'holder');
  assert.equal(balance(), 0n);
  await send('transfer-tokens', buildPurchaseSpendableCreditsMsg(collection, accounts.holder, '1').value, 'holder');
  assert.equal(balance(), 10n);
  const evmProvider = new JsonRpcProvider(evmRpc);
  const evmSigner = evmWallet.connect(evmProvider);
  const evmChainId = String((await evmProvider.getNetwork()).chainId);
  const sendEvm = async (proposal: any, batch = false) => {
    const message = new MsgTransferTokens(proposal.value);
    const call = batch ? convertMessagesToExecuteMultiple([message], evmWallet.address) : convertMessageToPrecompileCall(message, evmWallet.address);
    const tx = await evmSigner.sendTransaction({ to: call.precompileAddress, data: call.data, gasLimit: 10000000 });
    const result = await tx.wait();
    assert.equal(result?.status, 1);
    return tx.hash;
  };
  await sendEvm(buildPurchaseSpendableCreditsMsg(collection, accounts.evm, '1'));
  const evmDb = new Database(join(chainHome, 'evm-provider.sqlite'));
  handler = createProviderHandler({ ...handlerOptions, db: evmDb, evmRpcUrl: evmRpc, evmChainId, authenticate: async () => accounts.evm });
  const evmRequest = (await (await callProvider('/requests', {})).json()) as any;
  const evmHash = await sendEvm(buildConsumeSpendableCreditsMsg(collection, evmRequest), true);
  const evmBalance = () =>
    (query(['tokenization', 'balance', '1', accounts.evm]).balance.balances as any[]).reduce((sum, b) => sum + BigInt(b.amount), 0n);
  const beforeFailedEvm = evmBalance();
  assert.equal(beforeFailedEvm, 7n);
  const invalidEvm = convertMessagesToExecuteMultiple(
    [new MsgTransferTokens(buildConsumeSpendableCreditsMsg(collection, { ...evmRequest, units: '999' }).value)],
    evmWallet.address
  );
  const failedEvm = await evmSigner.sendTransaction({ to: invalidEvm.precompileAddress, data: invalidEvm.data, gasLimit: 10000000 });
  let failedReceipt: any;
  try {
    failedReceipt = await failedEvm.wait();
  } catch (error: any) {
    failedReceipt = error.receipt;
    if (!failedReceipt) throw error;
  }
  assert.equal(failedReceipt.status, 0, json({ status: failedReceipt.status, balance: String(evmBalance()), before: String(beforeFailedEvm) }));
  assert.equal(evmBalance(), beforeFailedEvm);
  const evmClaim = { requestId: evmRequest.requestId, secret: evmRequest.secret, txHash: evmHash };
  const evmResult = await callProvider('/fulfill', evmClaim);
  const evmEntitlement = await evmResult.json();
  assert.equal(evmResult.status, 200, json(evmEntitlement));
  handler = createProviderHandler({
    ...handlerOptions,
    db: evmDb,
    nodeUrl: 'http://127.0.0.1:1',
    evmRpcUrl: 'http://127.0.0.1:1',
    evmChainId,
    authenticate: async () => accounts.evm
  });
  assert.deepEqual(await (await callProvider('/fulfill', evmClaim)).json(), evmEntitlement);
  evmDb.close();
  evmProvider.destroy();
  const expiry = Date.now() + 7000;
  const expiring = buildSpendableCredit({
    provider: accounts.operator,
    serviceId: 'expiring',
    paymentDenom: 'USDC',
    pricePerPack: '1000000',
    creditsPerPack: '10',
    expiresAt: String(expiry),
    uri: 'ipfs://expiry'
  });
  await send('universal-update-collection', { ...expiring.value, creator: accounts.operator }, 'operator');
  const expiredCollection = query(['tokenization', 'collection', '2']).collection;
  await send('transfer-tokens', buildPurchaseSpendableCreditsMsg(expiredCollection, accounts.holder, '1').value, 'holder');
  const expiryBalance = () =>
    (query(['tokenization', 'balance', '2', accounts.holder]).balance.balances as any[]).reduce((sum, b) => sum + BigInt(b.amount), 0n);
  assert.equal(expiryBalance(), 10n);
  await delay(Math.max(0, expiry - Date.now() + 1000));
  await send(
    'transfer-tokens',
    buildConsumeSpendableCreditsMsg(expiredCollection, {
      wallet: accounts.holder,
      provider: accounts.operator,
      serviceId: 'expiring',
      requestId: 'expired',
      units: '1'
    }).value,
    'holder',
    false
  );
  await send('transfer-tokens', buildPurchaseSpendableCreditsMsg(expiredCollection, accounts.holder, '1').value, 'holder', false);
  assert.equal(expiryBalance(), 10n);
  console.log(
    json({
      receipt,
      holderConsumption: true,
      merchantUnauthorized: true,
      peerTransferBlocked: true,
      overdraftBlocked: true,
      refill: true,
      evmConsumptionAndFulfillment: true,
      evmOverdraftRejected: true,
      expiryEnforced: true,
      offlineRetry: true,
      disposableChain: true
    })
  );
} finally {
  if (chain && chain.exitCode === null) {
    chain.kill('SIGTERM');
    await Promise.race([new Promise<void>((done) => chain!.once('exit', () => done())), delay(5000)]);
    if (chain.exitCode === null) chain.kill('SIGKILL');
  }
  if (log !== undefined) closeSync(log);
  rmSync(chainHome, { recursive: true, force: true });
}
