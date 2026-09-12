import { buildCommand } from './build.js';
import { emit } from '../utils/envelope.js';
import { executeDeploy } from '../utils/deploy-options.js';
import { getPaymentRequestV2Type, extractPaymentRequestV2Details } from '../../core/payment-requests-v2.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

jest.mock('../utils/envelope.js', () => ({ ...jest.requireActual('../utils/envelope.js'), emit: jest.fn() }));
jest.mock('../utils/deploy-options.js', () => ({ ...jest.requireActual('../utils/deploy-options.js'), executeDeploy: jest.fn() }));

const command = buildCommand.commands.find((c) => c.name() === 'payment-request-v2')!;
command.exitOverride();
command.configureOutput({ writeErr: () => undefined });
const run = (...args: string[]) => command.parseAsync(args, { from: 'user' });
const emitted = () => (emit as jest.Mock).mock.calls.at(-1)![0];
beforeEach(() => jest.clearAllMocks());

it('lists nine examples and exposes a structural schema with semantic validation caveats', async () => {
  await run('--list-examples');
  expect(emitted().examples.map((e: any) => e.id)).toEqual([
    'specific',
    'anyone',
    'one',
    'all',
    'threshold',
    'installments',
    'partial',
    'target',
    'link'
  ]);
  await run('--schema');
  expect(emitted().schema.properties.obligations.items.properties.payer.oneOf).toHaveLength(2);
  expect(emitted().limitations).toMatch(/cross-field/i);
  expect(executeDeploy).not.toHaveBeenCalled();
});

it.each(['specific', 'anyone', 'one', 'all', 'threshold', 'installments', 'partial', 'target', 'link'])(
  'round-trips the %s example through the actual CLI builder',
  async (mode) => {
    const started = Date.now();
    await run('--example', mode);
    const params = emitted();
    expect(params.obligations.every((o: any) => BigInt(o.endTime) > BigInt(started))).toBe(true);
    await run('--json', JSON.stringify(params), '--json-only');
    const built = emitted();
    const terms = extractPaymentRequestV2Details(built.value)!;
    expect(terms).not.toBeNull();
    expect(getPaymentRequestV2Type(terms)).toBe(mode);
    expect(executeDeploy).not.toHaveBeenCalled();
  }
);

it('reads editable example parameters from files and stdin with exact large amounts', async () => {
  await run('--example', 'specific');
  const params = emitted();
  params.obligations[0].payouts[0].amount = '900719925474099312345';
  const text = JSON.stringify(params);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'payment-cli-'));
  const file = path.join(dir, 'params.json');
  fs.writeFileSync(file, text);
  try {
    await run('--json', file, '--json-only');
    expect(extractPaymentRequestV2Details(emitted().value)!.obligations[0].payouts[0].amount).toBe('900719925474099312345');
    const read = fs.readFileSync;
    const stdin = jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation(((input: any, options: any) => (input === 0 ? text : read(input, options))) as any);
    try {
      await run('--json', '-', '--json-only');
      expect(extractPaymentRequestV2Details(emitted().value)!.obligations[0].payouts[0].amount).toBe('900719925474099312345');
    } finally {
      stdin.mockRestore();
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

it('switches metadata modes explicitly and preserves compatible inline fields', async () => {
  await run('--example', 'specific');
  const params = emitted();
  await run('--json', JSON.stringify(params), '--name', 'Custom name', '--json-only');
  expect(JSON.parse(emitted().value.collectionMetadata.customData).name).toBe('Custom name');
  await run('--json', JSON.stringify(params), '--uri', 'ipfs://provided', '--json-only');
  expect(emitted().value.collectionMetadata.uri).toBe('ipfs://provided');
  expect(emitted().value.collectionMetadata.customData).toBe('');
  const hosted = { ...params, uri: 'ipfs://old', name: undefined, image: undefined, description: undefined };
  await expect(run('--json', JSON.stringify(hosted), '--name', 'Incomplete')).rejects.toThrow(/metadata/i);
  await expect(run('--json', JSON.stringify(params), '--uri', 'ipfs://x', '--name', 'Conflict')).rejects.toThrow(/either/i);
});

it.each([
  ['--schema', '--burner'],
  ['--example', 'specific', '--simulate'],
  ['--schema', '--json', '{}'],
  ['--schema', '--list-examples'],
  ['--example', 'unknown'],
  ['--list-examples', '--creator', 'bb1demo']
])('rejects ambiguous discovery or effectful flags: %s', async (...args) => {
  await expect(run(...args)).rejects.toThrow();
  expect(emit).not.toHaveBeenCalled();
  expect(executeDeploy).not.toHaveBeenCalled();
});
