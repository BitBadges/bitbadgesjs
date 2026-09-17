import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { buildPredictionMarket } from '../src/core/builders/prediction-market.js';
import { createStandardActionTools } from '../src/builder/tools/standardActions.js';

const collection = buildPredictionMarket({ verifier: 'bb1verifier', denom: 'BADGE', uri: 'ipfs://fixture' }).value;
const config = mkdtempSync(join(tmpdir(), 'bb-prediction-cli-'));
const server = createServer((req, res) => {
  if (req.method !== 'GET' || req.url !== '/collection/1') {
    res.writeHead(404).end();
    return;
  }
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ collection }));
});
await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
const run = promisify(execFile);
async function execute(argv: string[]) {
  let stdout: string;
  try {
    ({ stdout } = await run(process.execPath, [resolve('dist/cjs/cli/index.js'), ...argv], {
      timeout: 30000,
      encoding: 'utf8',
      env: {
        PATH: '/usr/bin:/bin',
        BITBADGES_CONFIG_DIR: config,
        BITBADGES_API_URL: `http://127.0.0.1:${(server.address() as any).port}`,
        BITBADGES_API_KEY: 'local-fixture-only',
        BB_QUIET: '1'
      }
    }));
  } catch (error) {
    stdout = String((error as any).stdout);
  }
  return JSON.parse(stdout);
}
try {
  const catalog = await execute(['dev', 'capabilities']);
  assert.equal(catalog.ok, true);
  const tools = createStandardActionTools(execute, () => catalog.data.catalogHash);
  const cli = await execute(['prediction-markets', 'quote', '1', '--state', 'push', '--yes-balance', '5', '--no-balance', '3']);
  assert.equal(cli.ok, true);
  assert.equal(cli.data.payout.baseAmount, '3');
  assert.deepEqual(cli.data.remaining, { yes: '1', no: '1' });
  const mcp = await tools.standard_prediction_markets_quote.run({ collectionId: '1', state: 'push', yesBalance: '5', noBalance: '3' });
  assert.deepEqual(mcp.data, cli.data);
  const odd = await tools.standard_prediction_markets_quote.run({ collectionId: '1', state: 'push', yesAmount: '5' });
  assert.equal(odd.ok, false);
  const creator = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
  const tx = await tools.standard_prediction_markets_redeem.run({ collectionId: '1', creator, state: 'yes-wins', yesAmount: '2', noBalance: '7' });
  assert.equal(tx.ok, true);
  assert.equal(tx.data.value.transfers[0].balances[0].amount, '2');
  assert.equal(tx.data.value.transfers[0].balances[0].tokenIds[0].start, '1');
  assert.equal(tx.data.value.transfers.length, 1);
  console.log('Prediction CLI/MCP fixture: exact quote, parity, odd-unit rejection and consuming unsigned proposal passed.');
} finally {
  await new Promise<void>((done) => server.close(() => done()));
  rmSync(config, { recursive: true, force: true });
}
