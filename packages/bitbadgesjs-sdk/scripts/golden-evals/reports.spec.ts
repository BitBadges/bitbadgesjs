import { compareReports, summarizeTrials, redactTrace } from './reports.js';

const report = (passed = true) => ({
  version: 1,
  scope: 'artifact-contracts',
  chainExecution: 'not-run',
  source: 'installed-builders',
  passed,
  summary: { total: 1, passed: passed ? 1 : 0, failed: passed ? 0 : 1 },
  provenance: { caseSetSha256: 'a'.repeat(64), fixtureTime: 1893456000000 },
  results: [
    {
      id: 'case-a',
      passed,
      assertions: [
        {
          id: 'recipient',
          passed,
          path: '/value/recipient',
          operator: 'equals',
          expected: 7,
          actual: passed ? 7 : 999,
          found: true,
          requirement: 'Pay recipient 7'
        }
      ],
      mutations: [{ id: 'divert', caught: true }]
    }
  ]
});

describe('evaluation comparison', () => {
  it('rejects forged passing evidence and incompatible assertion contracts', () => {
    const forged = report();
    forged.results[0].assertions[0].actual = 999;
    expect(() => compareReports(report(), forged)).toThrow();
    forged.results[0].assertions[0].expected = 999;
    expect(compareReports(report(), forged).compatible).toBe(false);
    const changed = report();
    changed.results[0].assertions[0].path = '/value/other';
    expect(compareReports(report(), changed).compatible).toBe(false);
  });
  it('rejects silently removed assertion or mutation checks under an unchanged claimed hash', () => {
    const before = report();
    before.results[0].assertions.push({ ...before.results[0].assertions[0], id: 'authority' });
    expect(compareReports(before, report()).compatible).toBe(false);
    const after = report();
    after.results[0].mutations = [];
    expect(compareReports(report(), after).compatible).toBe(false);
  });
  it('finds regressions and improvements on exactly the same suite', () => {
    expect(compareReports(report(), report(false))).toMatchObject({ compatible: true, passed: false, regressions: ['case-a'] });
    expect(compareReports(report(false), report())).toMatchObject({ compatible: true, passed: true, improvements: ['case-a'] });
  });
  it('refuses to compare changed, missing, skipped or duplicated cases as a passing run', () => {
    const changed = report();
    changed.provenance.caseSetSha256 = 'b'.repeat(64);
    expect(compareReports(report(), changed).compatible).toBe(false);
    const missing = report();
    missing.results = [];
    missing.summary = { total: 0, passed: 0, failed: 0 };
    expect(() => compareReports(report(), missing)).toThrow();
    const duplicate = report();
    duplicate.results.push(duplicate.results[0]);
    expect(() => compareReports(report(), duplicate)).toThrow();
    const lying = report();
    lying.results[0].assertions[0].passed = false;
    expect(() => compareReports(report(), lying)).toThrow();
    const ids = report();
    ids.results[0].id = 'replacement';
    expect(compareReports(report(), ids)).toMatchObject({ compatible: false, added: ['replacement'], removed: ['case-a'] });
  });
});

describe('repeated-trial metrics', () => {
  const trial = (patch: Record<string, unknown> = {}) => ({
    caseId: 'case-a',
    trial: 0,
    status: 'pass',
    firstAttemptPassed: true,
    repairs: 0,
    falseAssurance: false,
    latencyMs: 100,
    toolCalls: 2,
    inputTokens: 10,
    outputTokens: 5,
    costUsd: 0.001,
    ...patch
  });
  it('separates product failures and infrastructure errors while retaining all attempts', () => {
    const metrics = summarizeTrials([
      trial(),
      trial({ trial: 1, status: 'fail', firstAttemptPassed: false, falseAssurance: true }),
      trial({ trial: 2, status: 'infrastructure-error', inputTokens: null, outputTokens: null, costUsd: null, toolCalls: null })
    ]);
    expect(metrics).toMatchObject({
      attempts: 3,
      evaluated: 2,
      infrastructureErrors: 1,
      successes: 1,
      successRate: 0.5,
      completionRate: 1 / 3,
      falseAssurances: 1
    });
    expect(metrics.usage.costUsd).toMatchObject({ knownTotal: 0.002, observed: 2, missing: 1 });
    expect(metrics.successInterval95[0]).toBeLessThan(0.5);
    expect(metrics.successInterval95[1]).toBeGreaterThan(0.5);
  });
  it('counts successful repairs among initially failed evaluated trials', () => {
    expect(summarizeTrials([trial({ firstAttemptPassed: false, repairs: 1 })])).toMatchObject({ firstPassRate: 0, repairSuccessRate: 1 });
  });
  it('reports null rates for unavailable denominators and rejects duplicate trials', () => {
    const metrics = summarizeTrials([trial({ status: 'infrastructure-error', costUsd: null })]);
    expect(metrics.successRate).toBeNull();
    expect(metrics.repairSuccessRate).toBeNull();
    expect(metrics.usage.costUsd.knownTotal).toBeNull();
    expect(() => summarizeTrials([trial(), trial()])).toThrow();
    expect(() => summarizeTrials([trial({ inputTokens: -1 })])).toThrow();
  });
  it('redacts configured secrets and sensitive fields without exposing raw messages', () => {
    const result = redactTrace(
      { apiKey: 'token', note: 'Bearer TOKEN_SECRET', nested: { transaction: { creator: 'wallet' }, message: 'TOKEN_SECRET failed' } },
      ['TOKEN_SECRET']
    );
    expect(JSON.stringify(result)).not.toContain('TOKEN_SECRET');
    expect(result).toEqual({ apiKey: '[REDACTED]', note: 'Bearer [REDACTED]', nested: { transaction: '[REDACTED]', message: '[REDACTED] failed' } });
  });
});
