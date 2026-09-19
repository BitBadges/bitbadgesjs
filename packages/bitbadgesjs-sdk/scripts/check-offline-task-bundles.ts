import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { strict as assert } from 'node:assert';

const isolated = mkdtempSync(join(tmpdir(), 'bb-offline-tasks-'));
const cli = resolve(import.meta.dir, '../dist/cjs/cli/index.js');
function run(args: string[]) {
  const child = spawnSync(process.execPath, [cli, ...args], { cwd: isolated, encoding: 'utf8', timeout: 30_000, maxBuffer: 512 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, BITBADGES_CONFIG_DIR: isolated, NODE_ENV: 'test' } });
  assert.equal(child.status, 0, child.stderr + child.stdout);
  const envelope = JSON.parse(child.stdout);
  assert.equal(envelope.ok, true);
  return envelope.data;
}
try {
  const catalog = run(['dev', 'capabilities']);
  assert(catalog.capabilities.some((item: { id: string }) => item.id === 'fetch_docs'));
  for (const id of ['subscription', 'payment-request', 'smart-token', 'credit-token', 'spendable-credit']) {
    const docs = run(['dev', 'tools', 'call', 'fetch_docs', '--args', JSON.stringify({ topic: 'task:' + id })]);
    const bundle = JSON.parse(docs.content);
    assert.equal(bundle.source, 'installed');
    assert(bundle.schema && bundle.contractHash);
    const artifact = run(['dev', 'tools', 'call', bundle.contract.example.tool, '--args', JSON.stringify(bundle.contract.example.input)]);
    artifact.value.creator = 'bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7';
    artifact.value.manager = artifact.value.creator;
    const file = join(isolated, id + '.json');
    writeFileSync(file, JSON.stringify(artifact));
    const checked = run(['check', file, '--depth', 'structural', '--condensed']);
    assert.equal(checked.valid, true);
  }
  console.log('Five installed task bundles discovered, built and structurally checked from isolated settings without API/model credentials. Online simulation/signing not executed.');
} finally { rmSync(isolated, { recursive: true, force: true }); }
