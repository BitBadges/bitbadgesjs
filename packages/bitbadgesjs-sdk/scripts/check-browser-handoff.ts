import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { strict as assert } from 'node:assert';

const isolated = mkdtempSync(join(tmpdir(), 'bb-browser-handoff-'));
const cli = resolve(import.meta.dir, '../dist/cjs/cli/index.js');
function run(args: string[]) {
  const child = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 20_000, maxBuffer: 512 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, BITBADGES_CONFIG_DIR: isolated, BITBADGES_CLI_PATH: cli, NODE_ENV: 'test' } });
  assert.equal(child.status, 0, child.stderr + child.stdout);
  const envelope = JSON.parse(child.stdout); assert.equal(envelope.ok, true); return envelope.data;
}
let callback: URL | undefined;
try {
  const address = 'bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7';
  const pending = run(['dev', 'tools', 'call', 'request_browser_review', '--args', JSON.stringify({ expectedAddress: address, network: 'local', timeoutSeconds: 60,
    artifact: { messages: [{ typeUrl: '/cosmos.bank.v1beta1.MsgSend', value: { fromAddress: address, toAddress: address, amount: [{ denom: 'ubadge', amount: '1' }] } }] } })]);
  assert.equal(pending.outcome, 'pending'); assert.equal(pending.confirmed, false);
  const link = new URL(pending.signUrl);
  callback = new URL(link.searchParams.get('return')!);
  callback.searchParams.set('state', link.searchParams.get('state')!);
  callback.searchParams.set('requestId', pending.requestId);
  callback.searchParams.set('outcome', 'cancelled');
  const resumed = run(['dev', 'requests', 'resume', pending.requestId]);
  assert.equal(resumed.canResume, true); assert.equal(resumed.signUrl, pending.signUrl);
  const reply = await fetch(callback); assert.equal(reply.status, 200);
  const result = run(['dev', 'requests', 'status', pending.requestId]);
  assert.equal(result.outcome, 'cancelled'); assert.equal(result.confirmed, false); assert.equal(result.canResume, false);
  console.log('Real detached browser listener survived CLI exit, resumed identical request, and recorded a bound cancellation. No wallet, signature or broadcast used.');
} finally {
  if (callback) await fetch(callback).catch(() => undefined);
  rmSync(isolated, { recursive: true, force: true });
}
