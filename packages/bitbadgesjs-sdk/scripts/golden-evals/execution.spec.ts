import { verifyExecutionReport } from './execution.js';
import { createHash } from 'node:crypto';

it('rejects mismatched execution evidence, missing checks and forged pass flags', () => {
  const scenario = { steps: [{ id: 'create', expect: { success: true }, assertions: [{ kind: 'manager' }] }] };
  const bytes = JSON.stringify(scenario);
  const report = {
    version: 1,
    id: 'test',
    passed: true,
    execution: 'module',
    chainCommit: 'a'.repeat(40),
    scenarioHash: createHash('sha256').update(bytes).digest('hex'),
    coverage: { excluded: ['signatures'] },
    steps: [{ id: 'create', passed: true, success: true, assertions: [{ kind: 'manager', passed: true }] }]
  };
  expect(verifyExecutionReport(scenario, report).passed).toBe(true);
  expect(() => verifyExecutionReport(scenario, { ...report, steps: [] })).toThrow();
  expect(() => verifyExecutionReport(scenario, { ...report, scenarioHash: 'b'.repeat(64) })).toThrow();
  const missing = structuredClone(report);
  missing.steps[0].assertions = [];
  expect(() => verifyExecutionReport(scenario, missing)).toThrow();
  const failed = structuredClone(report);
  failed.steps[0].assertions[0].passed = false;
  expect(() => verifyExecutionReport(scenario, failed)).toThrow();
});
