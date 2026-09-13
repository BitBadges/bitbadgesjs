import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from './harness/cli.js';

const creator = 'bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7';
let directory: string;
let proposal: any;
let proposalFile: string;

it('reports the installed SDK package version', () => {
  const pkg = JSON.parse(readFileSync(join(__dirname, '../../../package.json'), 'utf8'));
  const result = runCli(['--version'], { parseJson: false });
  expect(result.stdout.trim()).toBe(pkg.version);
});

beforeAll(() => {
  directory = mkdtempSync(join(tmpdir(), 'bb-payment-review-'));
  proposalFile = join(directory, 'proposal.json');
  const example = runCli(['build', 'payment-request-v2', '--example', 'all']);
  const built = runCli(['build', 'payment-request-v2', '--json', '-', '--creator', creator, '--mainnet', '--output-file', proposalFile], {
    stdin: JSON.stringify(example.json)
  });
  expect(built.exitCode).toBe(0);
  proposal = JSON.parse(readFileSync(proposalFile, 'utf8'));
  expect(proposal.ok).toBe(true);
  expect(proposal.data.typeUrl).toBe('/tokenization.MsgCreateCollection');
  expect(proposal.data.value.collectionId).toBeUndefined();
});

afterAll(() => rmSync(directory, { recursive: true, force: true }));

it.each(['full', 'review'])('checks the exact saved build output with %s review', (depth) => {
  const result = runCli(['check', proposalFile, '--mainnet', '--depth', depth], { throwOnError: false });
  expect(result.exitCode).toBe(0);
  expect(JSON.parse(result.stdout).ok).toBe(true);
  expect((depth === 'full' ? result.json.review : result.json).summary.critical).toBe(0);
});

it('explains the exact saved build output identically to the bare message', () => {
  const result = runCli(['explain', proposalFile, '--mainnet'], { throwOnError: false });
  expect(result.exitCode).toBe(0);
  const bare = runCli(['explain', '-', '--mainnet'], { stdin: JSON.stringify(proposal.data) });
  expect(JSON.parse(result.stdout).ok).toBe(true);
  expect(result.json).toEqual(bare.json);
  expect(result.json.kind).toBe('msg');
  expect(result.json.fullText).toContain('Payment');
});

it.each(['19', undefined, 'invalid'])('continues to reject immutable payment updates with ID %s', (collectionId) => {
  const msg = {
    typeUrl: '/tokenization.MsgUpdateCollection',
    value: { ...proposal.data.value, collectionId, updateCustomData: true }
  };
  const result = runCli(['check', '-', '--mainnet'], { stdin: JSON.stringify(msg), throwOnError: false });
  expect(result.exitCode).not.toBe(0);
  expect(JSON.parse(result.stdout).ok).toBe(false);
  expect(result.stdout).toContain('Frozen payment terms cannot be updated');
});

it.each([
  { ok: false, data: null, error: { code: 'build_failed', message: 'No transaction' } },
  { ok: true, data: null },
  { ok: true, data: [] },
  { ok: 'true', data: {} },
  { ok: true, data: {}, error: { code: 'inconsistent' } }
])('rejects unsuccessful or malformed explain envelopes: %j', (input) => {
  const result = runCli(['explain', '-', '--mainnet'], { stdin: JSON.stringify(input), throwOnError: false });
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout + result.stderr).toContain('envelope');
});

it('does not describe unsupported messages as collection creation', () => {
  const msg = { typeUrl: '/unsupported.MsgCreateCollection', value: proposal.data.value };
  const result = runCli(['explain', '-', '--mainnet'], { stdin: JSON.stringify({ ok: true, data: msg }), throwOnError: false });
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout + result.stderr).toContain('Unsupported');
});

it.each(['/tokenization.MsgUpdateCollection', '/tokenization.MsgUniversalUpdateCollection'])(
  'explains %s as an update with only the enabled changes',
  (typeUrl) => {
    const msg = {
      typeUrl,
      value: { creator, collectionId: '19', manager: creator, updateManager: true, updateCustomData: false }
    };
    const result = runCli(['explain', '-', '--mainnet'], { stdin: JSON.stringify({ ok: true, data: msg }) });
    expect(result.json.fullText).toContain('Update collection');
    expect(result.json.fullText).toContain('manager address');
    expect(result.json.fullText).not.toContain('Create a new');
    expect(result.json.fullText).not.toContain('custom data');
    expect(result.json.messages[0].summary).toBe(result.json.fullText);
  }
);

it('preserves per-message create and update explanations in a transaction', () => {
  const update = {
    typeUrl: '/tokenization.MsgUpdateCollection',
    value: { creator, collectionId: '19', manager: creator, updateManager: true }
  };
  const result = runCli(['explain', '-', '--mainnet'], {
    stdin: JSON.stringify({ ok: true, data: { messages: [proposal.data, update] } })
  });
  expect(result.json.kind).toBe('tx');
  expect(result.json.messages[0].summary).toContain('Create a new');
  expect(result.json.messages[1].summary).toContain('Update collection');
  expect(result.json.messages[1].summary).toContain('manager address');
});

it.each(['specific', 'anyone', 'one', 'all', 'threshold', 'installments', 'partial', 'target', 'link'])(
  'fully checks and explains the %s preset without credentials',
  (preset) => {
    const example = runCli(['build', 'payment-request-v2', '--example', preset]);
    const built = runCli(['build', 'payment-request-v2', '--json', '-', '--creator', creator, '--mainnet', '--json-only'], {
      stdin: JSON.stringify(example.json)
    });
    const checked = runCli(['check', '-', '--mainnet'], { stdin: built.stdout });
    expect(checked.json.review.summary.critical).toBe(0);
    const explained = runCli(['explain', '-', '--mainnet'], { stdin: built.stdout });
    expect(explained.json.messages[0].typeUrl).toBe('/tokenization.MsgCreateCollection');
    expect(explained.json.fullText.length).toBeGreaterThan(100);
  }
);
