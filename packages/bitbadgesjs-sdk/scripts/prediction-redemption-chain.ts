import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { PREDICTION_MARKET_PRESETS } from '../src/builder/presets/prediction-market.js';
import { buildPredictionMarket } from '../src/core/builders/prediction-market.js';
import {
  buildPredictionMarketDepositMsg,
  buildPredictionMarketRedeemTx,
  buildPredictionMarketResolveTx,
  quotePredictionMarketRedemption,
  classifySettlementApproval
} from '../src/core/prediction-markets.js';

const binary = process.argv[2];
assert(binary && binary.startsWith('/'), 'Pass the absolute path to a binary built from the accepted public/chain pin.');
const chainHome = mkdtempSync(join(tmpdir(), 'bb-prediction-chain-'));
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
  cli(['init', 'prediction-smoke', '--chain-id', chainId]);
  const accounts: Record<string, string> = {};
  for (const name of ['operator', 'holder']) {
    cli(['keys', 'add', name, '--keyring-backend', 'test', '--output', 'json']);
    accounts[name] = cli(['keys', 'show', name, '-a', '--keyring-backend', 'test']).trim();
  }

  const built = buildPredictionMarket({ verifier: accounts.operator, denom: 'USDC', uri: 'ipfs://local-prediction-smoke' });
  const denom = built.value.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins[0].denom;
  if (process.argv[3] === '--presets')
    built.value.collectionApprovals = PREDICTION_MARKET_PRESETS.map((p) =>
      p.render(p.paramsSchema.parse({ usdcDenom: denom, verifierAddress: accounts.operator }))
    );
  for (const address of Object.values(accounts)) {
    cli(['genesis', 'add-genesis-account', address, `100000000000000000ubadge,1000000000000000ustake,1000000000${denom}`]);
  }
  const genesisPath = join(chainHome, 'config/genesis.json');
  const genesis = JSON.parse(readFileSync(genesisPath, 'utf8'));
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
      '--grpc.address',
      grpc,
      '--api.enable=false',
      '--grpc-web.enable=false',
      '--json-rpc.enable=false'
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
    else assert.notEqual(result.code, 0, 'Duplicate renewal unexpectedly succeeded.');
    return result;
  }

  const receipts: any[] = [];
  for (const [index, outcome] of (['yes', 'no', 'push'] as const).entries()) {
    await send('universal-update-collection', { ...built.value, creator: accounts.operator }, 'operator');
    const collectionId = String(index + 1);
    const collection = query(['tokenization', 'collection', collectionId]).collection;
    const mint = collection.collectionApprovals.find((a: any) => a.fromListId === 'Mint');
    const approvals: any = {};
    for (const a of collection.collectionApprovals) {
      const cls = classifySettlementApproval(a);
      if (cls === 'wins-yes') approvals.yesWinsApprovalId = a.approvalId;
      if (cls === 'wins-no') approvals.noWinsApprovalId = a.approvalId;
      if (cls === 'push') approvals[a.tokenIds[0].start === '1' ? 'pushYesApprovalId' : 'pushNoApprovalId'] = a.approvalId;
    }
    const money = (address: string) => BigInt((query(['bank', 'balances', address]).balances as any[]).find((c) => c.denom === denom)?.amount ?? '0');
    const position = (id: bigint) =>
      (query(['tokenization', 'balance', collectionId, accounts.holder]).balance.balances as any[]).reduce(
        (sum, b) => sum + (b.tokenIds.some((r: any) => BigInt(r.start) <= id && BigInt(r.end) >= id) ? BigInt(b.amount) : 0n),
        0n
      );
    const transfer = async (message: any) => send('transfer-tokens', message.value, 'holder');
    const redeem = async (args: any) => {
      const quote = quotePredictionMarketRedemption(collection, args);
      const before = money(accounts.holder);
      const escrowBefore = money(collection.mintEscrowAddress);
      const tx = buildPredictionMarketRedeemTx({ creator: accounts.holder, collectionId, collection, ...args });
      for (const message of tx.messages) await transfer(message);
      assert.equal(money(accounts.holder) - before, BigInt(quote.payout.baseAmount));
      assert.equal(escrowBefore - money(collection.mintEscrowAddress), BigInt(quote.payout.baseAmount));
      return quote;
    };
    await transfer(buildPredictionMarketDepositMsg(accounts.holder, collectionId, 10n, mint.approvalId));
    assert.equal(position(1n), 10n);
    assert.equal(position(2n), 10n);
    await redeem({ state: 'active', pairAmount: 3n });
    await redeem({ state: 'active', pairAmount: 2n });
    assert.equal(position(1n), 5n);
    assert.equal(position(2n), 5n);
    const votes = buildPredictionMarketResolveTx(accounts.operator, collectionId, outcome, approvals);
    for (const vote of votes.messages) await send('cast-vote', vote.value, 'operator');
    if (outcome === 'push') {
      await redeem({ state: 'push', yesAmount: 2n, noAmount: 2n });
      await redeem({ state: 'push', yesAmount: 2n, noAmount: 2n });
      assert.equal(position(1n), 1n);
      assert.equal(position(2n), 1n);
      assert.equal(money(collection.mintEscrowAddress), 1n);
      await redeem({ state: 'active', pairAmount: 1n });
      assert.equal(position(1n), 0n);
      assert.equal(position(2n), 0n);
    } else {
      const side = outcome === 'yes' ? 'yesAmount' : 'noAmount';
      await redeem({ state: `${outcome}-wins`, [side]: 2n });
      await redeem({ state: `${outcome}-wins`, [side]: 3n });
      assert.equal(position(outcome === 'yes' ? 1n : 2n), 0n);
      assert.equal(position(outcome === 'yes' ? 2n : 1n), 5n);
      // Newly minted positions after an earlier claim still redeem.
      await transfer(buildPredictionMarketDepositMsg(accounts.holder, collectionId, 2n, mint.approvalId));
      await redeem({ state: `${outcome}-wins`, [side]: 2n });
      assert.equal(position(outcome === 'yes' ? 1n : 2n), 0n);
    }
    assert.equal(money(collection.mintEscrowAddress), 0n);
    receipts.push({ outcome, repeatedRedemption: true, collateralRemaining: '0', finality: 'verifier-controlled; not certified' });
  }
  console.log(json({ markets: receipts, recipe: process.argv[3] === '--presets' ? 'presets' : 'canonical', disposableChain: true }));
} finally {
  if (chain && chain.exitCode === null) {
    chain.kill('SIGTERM');
    await Promise.race([new Promise<void>((done) => chain!.once('exit', () => done())), delay(5000)]);
    if (chain.exitCode === null) chain.kill('SIGKILL');
  }
  if (log !== undefined) closeSync(log);
  rmSync(chainHome, { recursive: true, force: true });
}
