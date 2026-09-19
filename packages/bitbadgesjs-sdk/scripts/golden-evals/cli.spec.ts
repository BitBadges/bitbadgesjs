import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

describe('golden eval command', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'bb-golden-command-'));
  const cases = path.join(dir, 'cases.json');
  const artifacts = path.join(dir, 'artifacts.json');
  beforeAll(() =>
    writeFileSync(
      cases,
      JSON.stringify([
        {
          version: 1,
          id: 'test',
          prompt: 'Pay five base units',
          tool: 'build_payment_request',
          input: {},
          clarifications: [],
          limitations: ['No execution'],
          assertions: [{ id: 'amount', requirement: 'Exact payment', path: '/amount', operator: 'equals', expected: '5' }],
          mutations: [{ id: 'wrong-amount', path: '/amount', value: '6', mustFail: ['amount'] }]
        }
      ])
    )
  );
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const run = (extra: string[] = []) => {
    const result = spawnSync('bun', ['scripts/check-agent-golden.ts', '--cases', cases, '--artifacts', artifacts, ...extra], { encoding: 'utf8' });
    return { ...result, report: JSON.parse(result.stdout) };
  };
  it('emits JSON evidence and exits zero for matching independent artifacts', () => {
    writeFileSync(artifacts, JSON.stringify({ test: { amount: '5' } }));
    const result = run();
    expect(result.status).toBe(0);
    expect(result.report).toMatchObject({ passed: true, chainExecution: 'not-run', source: 'supplied-artifacts' });
    expect(result.report.provenance.caseSetSha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it('exits nonzero for wrong or omitted artifacts, with no fallback to the builder', () => {
    for (const input of [{ test: { amount: '6' } }, {}]) {
      writeFileSync(artifacts, JSON.stringify(input));
      const result = run();
      expect(result.status).toBe(1);
      expect(result.report.passed).toBe(false);
      expect(result.report.summary.failed).toBe(1);
    }
  });
  it('rejects unknown cases and unknown options instead of silently ignoring them', () => {
    writeFileSync(artifacts, JSON.stringify({ test: { amount: '5' }, unexpected: {} }));
    expect(run().status).toBe(2);
    expect(run(['--typo']).status).toBe(2);
  });
});
