import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { strict as assert } from 'node:assert';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const isolated = mkdtempSync(join(tmpdir(), 'bb-browser-handoff-'));
const cli = resolve(import.meta.dir, '../dist/cjs/cli/index.js');
function run(args: string[]) {
  const child = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 20_000, maxBuffer: 512 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, BITBADGES_CONFIG_DIR: isolated, BITBADGES_CLI_PATH: cli, NODE_ENV: 'test' } });
  assert.equal(child.status, 0, child.stderr + child.stdout);
  const envelope = JSON.parse(child.stdout); assert.equal(envelope.ok, true); return envelope.data;
}
const callbacks: URL[] = [];
const client = new Client({ name: 'browser-handoff-smoke', version: '1.0' });
try {
  const address = 'bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7';
  const input = { expectedAddress: address, network: 'local', timeoutSeconds: 60,
    artifact: { messages: [{ typeUrl: '/cosmos.bank.v1beta1.MsgSend', value: { fromAddress: address, toAddress: address, amount: [{ denom: 'ubadge', amount: '1' }] } }] } };
  const start = () => run(['dev', 'tools', 'call', 'request_browser_review', '--args', JSON.stringify(input)]);
  const pending = start();
  assert.equal(pending.outcome, 'pending'); assert.equal(pending.confirmed, false);
  function cancellation(request: { signUrl: string; requestId: string }) {
    const link = new URL(request.signUrl);
    const callback = new URL(link.searchParams.get('return')!);
    callback.searchParams.set('state', link.searchParams.get('state')!);
    callback.searchParams.set('requestId', request.requestId);
    callback.searchParams.set('outcome', 'cancelled');
    callbacks.push(callback);
    return callback;
  }
  const callback = cancellation(pending);
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [resolve(import.meta.dir, '../dist/esm/builder/index.js')],
    env: { PATH: process.env.PATH!, HOME: process.env.HOME!, BITBADGES_CONFIG_DIR: isolated, BITBADGES_CLI_PATH: cli, NODE_ENV: 'test' }, stderr: 'pipe' }));
  const response = await client.callTool({ name: 'request_browser_review', arguments: input });
  assert.notEqual(response.isError, true);
  const content = response.content as { type: string; text?: string }[];
  const other = JSON.parse(content.find(item => item.type === 'text')!.text!);
  const otherCallback = cancellation(other);
  await client.close();
  assert.equal(other.outcome, 'pending'); assert.equal(other.confirmed, false);
  assert.notEqual(pending.requestId, other.requestId);
  for (const [field, value, status] of [
    ['state', 'wrong-state', 403],
    ['requestId', other.requestId, 400],
    ['outcome', 'confirmed', 400]
  ] as const) {
    const invalid = new URL(callback);
    invalid.searchParams.set(field, value);
    assert.equal((await fetch(invalid)).status, status);
    assert.equal(run(['dev', 'requests', 'status', pending.requestId]).outcome, 'pending');
  }
  const duplicate = new URL(callback);
  duplicate.searchParams.append('outcome', 'cancelled');
  assert.equal((await fetch(duplicate)).status, 400);
  const resumed = run(['dev', 'requests', 'resume', pending.requestId]);
  assert.equal(resumed.canResume, true); assert.equal(resumed.signUrl, pending.signUrl);
  const reply = await fetch(callback); assert.equal(reply.status, 200);
  const result = run(['dev', 'requests', 'status', pending.requestId]);
  assert.equal(result.outcome, 'cancelled'); assert.equal(result.confirmed, false); assert.equal(result.canResume, false);
  assert.equal(run(['dev', 'requests', 'status', other.requestId]).outcome, 'pending');
  assert.equal((await fetch(otherCallback)).status, 200);
  assert.equal(run(['dev', 'requests', 'status', other.requestId]).outcome, 'cancelled');
  console.log('Detached listeners survived CLI and MCP exits, rejected wrong state/request/outcome and duplicate fields, resumed the identical request, and isolated concurrent cancellations. No wallet, signature or broadcast used.');
} finally {
  await client.close();
  await Promise.all(callbacks.map((callback) => fetch(callback).catch(() => undefined)));
  rmSync(isolated, { recursive: true, force: true });
}
