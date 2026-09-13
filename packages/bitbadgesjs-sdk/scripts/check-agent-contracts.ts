import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const entry = path.resolve('dist/cjs/cli/index.js');
const sandbox = mkdtempSync(path.join(tmpdir(), 'bb-agent-contracts-'));
const { callTool } = await import('../dist/esm/builder/tools/registry.js');
let checks = 0;

function cli(args: string[], expectedStatus = 0) {
  const response = spawnSync(process.execPath, [entry, ...args], {
    cwd: sandbox,
    env: { PATH: process.env.PATH, HOME: sandbox, NODE_ENV: 'test' },
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 8 * 1024 * 1024
  });
  assert.ifError(response.error);
  assert.equal(response.status, expectedStatus, `${args.slice(0, 3).join(' ')}: ${response.stderr}`);
  const envelope = JSON.parse(response.stdout);
  assert.equal(envelope.ok, expectedStatus === 0);
  checks++;
  return envelope;
}

try {
  for (const args of [
    ['build', 'subscription'],
    ['build', 'subscription', '--json', '{broken'],
    ['build', 'subscription', '--not-a-real-option'],
    ['not-a-real-command']
  ]) {
    const failure = cli(args, 1);
    assert.equal(failure.data, null);
    assert.ok(failure.error.code);
    assert.ok(failure.error.message);
  }
  const skills = cli(['dev', 'skills']).data;
  assert.ok(skills.length > 0);
  const mcpSkills = await callTool('list_skills', {});
  assert.deepEqual(mcpSkills.result, skills);
  for (const skill of skills) {
    const installed = cli(['dev', 'skills', skill.id]).data;
    const mcp = await callTool('get_skill_instructions', { skillId: skill.id });
    assert.ok(!mcp.isError);
    assert.deepEqual(installed, mcp.result);
  }
  assert.equal(cli(['dev', 'skills', 'not-a-real-skill'], 1).error.code, 'invalid_input');

  const examples = cli(['build', 'payment-request-v2', '--list-examples']).data.examples;
  assert.ok(Array.isArray(examples) && examples.length > 0);
  for (const example of examples) {
    const input = cli(['build', 'payment-request-v2', '--example', example.id]).data;
    const proposal = cli(['build', 'payment-request-v2', '--json', JSON.stringify(input), '--json-only']);
    assert.equal(proposal.data.typeUrl, '/tokenization.MsgCreateCollection');
    assert.ok(proposal.data.value.collectionApprovals.length > 0);
    const mcp = await callTool('build_payment_request_v2', input);
    assert.ok(!mcp.isError);
    assert.deepEqual(proposal.data.value.collectionApprovals, mcp.result.value.collectionApprovals);
    const unsupported = await callTool('build_payment_request_v2', { ...input, refunds: true });
    assert.equal(unsupported.isError, true);
  }

  const subscription = {
    interval: 'monthly',
    price: 5,
    denom: 'BADGE',
    recipient: 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm',
    uri: 'https://example.com/metadata.json'
  };
  for (const command of [
    ['build', 'subscription'],
    ['subscriptions', 'build']
  ]) {
    const proposal = cli([...command, '--json', JSON.stringify(subscription), '--json-only']);
    assert.equal(proposal.data.typeUrl, '/tokenization.MsgCreateCollection');
    assert.ok(proposal.data.value.collectionApprovals.length > 0);
  }
  console.log(
    `Agent artifact contracts passed: ${checks} CLI invocations, ${skills.length} skills, ${examples.length} payment examples. No signing or broadcast.`
  );
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
