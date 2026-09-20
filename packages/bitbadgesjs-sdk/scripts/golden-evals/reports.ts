import { z } from 'zod';
import { isDeepStrictEqual } from 'node:util';

const assertionSchema = z
  .object({
    id: z.string(),
    passed: z.boolean(),
    path: z.string(),
    operator: z.enum(['equals', 'length', 'contains']),
    expected: z.unknown(),
    requirement: z.string(),
    found: z.boolean(),
    actual: z.unknown().optional()
  })
  .passthrough();

const resultSchema = z
  .object({
    id: z.string().min(1),
    passed: z.boolean(),
    error: z.string().optional(),
    assertions: z.array(assertionSchema),
    mutations: z.array(z.object({ id: z.string(), caught: z.boolean(), failedAssertions: z.array(z.string()), error: z.string().optional() }).passthrough())
  })
  .passthrough();
const reportSchema = z
  .object({
    version: z.literal(1),
    scope: z.literal('artifact-contracts'),
    chainExecution: z.literal('not-run'),
    source: z.string().min(1),
    passed: z.boolean(),
    summary: z.object({ total: z.number().int(), passed: z.number().int(), failed: z.number().int() }),
    provenance: z.object({ caseSetSha256: z.string().regex(/^[a-f0-9]{64}$/), fixtureTime: z.number().int() }).passthrough(),
    results: z.array(resultSchema).min(1)
  })
  .passthrough();

function parseReport(input: unknown) {
  const report = reportSchema.parse(input);
  if (new Set(report.results.map((row) => row.id)).size !== report.results.length) throw new Error('Duplicate result IDs');
  for (const row of report.results) {
    for (const check of row.assertions) {
      if (!Object.hasOwn(check, 'expected') || (check.found && !Object.hasOwn(check, 'actual'))) throw new Error('Missing assertion evidence');
      const passed =
        check.found &&
        (check.operator === 'equals'
          ? isDeepStrictEqual(check.actual, check.expected)
          : check.operator === 'length'
            ? Array.isArray(check.actual) && check.actual.length === check.expected
            : Array.isArray(check.actual) && check.actual.some((value) => isDeepStrictEqual(value, check.expected)));
      if (passed !== check.passed) throw new Error('Assertion verdict contradicts evidence');
    }
    for (const checks of [row.assertions, row.mutations]) {
      if (new Set(checks.map((check) => check.id)).size !== checks.length) throw new Error('Duplicate check IDs');
    }
    for (const mutation of row.mutations) {
      if (
        mutation.failedAssertions.some((id) => !row.assertions.some((check) => check.id === id)) ||
        (mutation.caught && (mutation.error !== undefined || mutation.failedAssertions.length === 0 || !row.assertions.every((check) => check.passed)))
      ) throw new Error('Mutation verdict contradicts evidence');
    }
    const passed =
      !row.error && row.assertions.length > 0 && row.assertions.every((check) => check.passed) && row.mutations.every((check) => check.caught);
    if (passed !== row.passed) throw new Error('Inconsistent case verdict');
  }
  const successes = report.results.filter((row) => row.passed).length;
  if (
    report.summary.total !== report.results.length ||
    report.summary.passed !== successes ||
    report.summary.failed !== report.results.length - successes ||
    report.passed !== (successes === report.results.length)
  ) {
    throw new Error('Inconsistent report summary');
  }
  return report;
}

export function compareReports(baseline: unknown, candidate: unknown) {
  const before = parseReport(baseline);
  const after = parseReport(candidate);
  const previous = new Map(before.results.map((row) => [row.id, row]));
  const current = new Map(after.results.map((row) => [row.id, row]));
  const added = [...current.keys()].filter((id) => !previous.has(id));
  const removed = [...previous.keys()].filter((id) => !current.has(id));
  const sameChecks = after.results.every((row) => {
    const prior = previous.get(row.id);
    const contracts = (checks: z.infer<typeof assertionSchema>[]) =>
      checks
        .map(({ id, path, operator, expected, requirement }) => ({ id, path, operator, expected, requirement }))
        .sort((a, b) => a.id.localeCompare(b.id));
    return (
      prior &&
      isDeepStrictEqual(contracts(prior.assertions), contracts(row.assertions)) &&
      isDeepStrictEqual(prior.mutations.map((check) => check.id).sort(), row.mutations.map((check) => check.id).sort())
    );
  });
  const compatible =
    sameChecks &&
    added.length === 0 &&
    removed.length === 0 &&
    before.source === after.source &&
    before.provenance.caseSetSha256 === after.provenance.caseSetSha256 &&
    before.provenance.fixtureTime === after.provenance.fixtureTime;
  const regressions = compatible ? after.results.filter((row) => !row.passed && previous.get(row.id)?.passed).map((row) => row.id) : [];
  const improvements = compatible ? after.results.filter((row) => row.passed && !previous.get(row.id)?.passed).map((row) => row.id) : [];
  return { compatible, passed: compatible && after.passed, added, removed, regressions, improvements };
}

const count = z.number().int().nonnegative();
const trialSchema = z
  .object({
    caseId: z.string().min(1),
    trial: count,
    status: z.enum(['pass', 'fail', 'infrastructure-error']),
    firstAttemptPassed: z.boolean(),
    repairs: count,
    falseAssurance: z.boolean(),
    latencyMs: z.number().finite().nonnegative(),
    toolCalls: count.nullable(),
    inputTokens: count.nullable(),
    outputTokens: count.nullable(),
    costUsd: z.number().finite().nonnegative().nullable()
  })
  .strict();
export type Trial = z.infer<typeof trialSchema>;

export function summarizeTrials(input: unknown) {
  const trials = z.array(trialSchema).parse(input);
  if (new Set(trials.map((trial) => JSON.stringify([trial.caseId, trial.trial]))).size !== trials.length) throw new Error('Duplicate trials');
  const evaluated = trials.filter((trial) => trial.status !== 'infrastructure-error');
  const successes = evaluated.filter((trial) => trial.status === 'pass').length;
  const initialFailures = evaluated.filter((trial) => !trial.firstAttemptPassed);
  const rate = (numerator: number, denominator: number) => (denominator ? numerator / denominator : null);
  const usage = (key: 'inputTokens' | 'outputTokens' | 'toolCalls' | 'costUsd') => {
    const known = trials.map((trial) => trial[key]).filter((value): value is number => value !== null);
    return {
      knownTotal: known.length ? known.reduce((sum, value) => sum + value, 0) : null,
      observed: known.length,
      missing: trials.length - known.length
    };
  };
  const n = evaluated.length;
  const p = n ? successes / n : 0;
  const z95 = 1.959963984540054;
  const denominator = 1 + z95 ** 2 / n;
  const center = (p + z95 ** 2 / (2 * n)) / denominator;
  const margin = (z95 * Math.sqrt((p * (1 - p)) / n + z95 ** 2 / (4 * n ** 2))) / denominator;
  return {
    attempts: trials.length,
    evaluated: n,
    infrastructureErrors: trials.length - n,
    successes,
    successRate: rate(successes, n),
    completionRate: rate(successes, trials.length),
    firstPassRate: rate(evaluated.filter((trial) => trial.firstAttemptPassed).length, n),
    repairSuccessRate: rate(initialFailures.filter((trial) => trial.status === 'pass' && trial.repairs > 0).length, initialFailures.length),
    falseAssurances: trials.filter((trial) => trial.falseAssurance).length,
    successInterval95: n ? [Math.max(0, center - margin), Math.min(1, center + margin)] : [null, null],
    latencyMs: {
      total: trials.reduce((sum, trial) => sum + trial.latencyMs, 0),
      mean: rate(
        trials.reduce((sum, trial) => sum + trial.latencyMs, 0),
        trials.length
      )
    },
    usage: { inputTokens: usage('inputTokens'), outputTokens: usage('outputTokens'), toolCalls: usage('toolCalls'), costUsd: usage('costUsd') }
  };
}

export function compareTrialReports(baseline: unknown, candidate: unknown) {
  const schema = z
    .object({
      version: z.literal(1),
      scope: z.literal('fresh-agent-behavior'),
      trials: z.array(trialSchema).min(1),
      metrics: z.unknown(),
      provenance: z
        .object({ caseSetSha256: z.string().regex(/^[a-f0-9]{64}$/), provider: z.string(), model: z.string(), settings: z.record(z.unknown()) })
        .passthrough()
    })
    .passthrough();
  const before = schema.parse(baseline);
  const after = schema.parse(candidate);
  const oldMetrics = summarizeTrials(before.trials);
  const newMetrics = summarizeTrials(after.trials);
  if (!isDeepStrictEqual(before.metrics, oldMetrics) || !isDeepStrictEqual(after.metrics, newMetrics))
    throw new Error('Trial metrics contradict evidence');
  const keys = (trials: Trial[]) => trials.map((trial) => JSON.stringify([trial.caseId, trial.trial])).sort();
  const compatible =
    before.provenance.caseSetSha256 === after.provenance.caseSetSha256 &&
    before.provenance.provider === after.provenance.provider &&
    before.provenance.model === after.provenance.model &&
    isDeepStrictEqual(before.provenance.settings, after.provenance.settings) &&
    isDeepStrictEqual(keys(before.trials), keys(after.trials));
  const successRateDelta =
    compatible && oldMetrics.successRate !== null && newMetrics.successRate !== null ? newMetrics.successRate - oldMetrics.successRate : null;
  return {
    compatible,
    passed: compatible && newMetrics.infrastructureErrors === 0 && newMetrics.falseAssurances === 0 && newMetrics.successRate === 1,
    successRateDelta,
    before: oldMetrics,
    after: newMetrics
  };
}

export function redactTrace(input: unknown, secrets: string[] = []): unknown {
  if (typeof input === 'string') {
    return secrets
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .reduce((text, secret) => text.split(secret).join('[REDACTED]'), input);
  }
  if (Array.isArray(input)) return input.map((value) => redactTrace(value, secrets));
  if (input !== null && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        String(redactTrace(key, secrets)),
        /api.?key|authorization|password|secret|private.?key|mnemonic|transaction|access.?token|refresh.?token/i.test(key)
          ? '[REDACTED]'
          : redactTrace(value, secrets)
      ])
    );
  }
  return input;
}
