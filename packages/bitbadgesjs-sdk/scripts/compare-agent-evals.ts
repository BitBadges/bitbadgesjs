import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { compareReports, compareTrialReports } from './golden-evals/reports.js';

try {
  const { values } = parseArgs({
    options: { baseline: { type: 'string' }, candidate: { type: 'string' }, format: { type: 'string', default: 'json' } },
    strict: true,
    allowPositionals: false
  });
  if (!values.baseline || !values.candidate || !['json', 'text'].includes(values.format!))
    throw new Error('Expected --baseline FILE --candidate FILE [--format json|text]');
  const baseline = JSON.parse(readFileSync(values.baseline, 'utf8'));
  const candidate = JSON.parse(readFileSync(values.candidate, 'utf8'));
  if (baseline.scope === 'fresh-agent-behavior') {
    const report = compareTrialReports(baseline, candidate);
    process.stdout.write(
      values.format === 'text'
        ? `${report.compatible ? 'Compatible' : 'INCOMPATIBLE'} trials; ${report.passed ? 'PASS' : 'FAIL'}\nSuccess-rate delta: ${report.successRateDelta ?? 'unavailable'}\nCandidate infrastructure errors: ${report.after.infrastructureErrors}; false assurances: ${report.after.falseAssurances}\n`
        : JSON.stringify(report, null, 2) + '\n'
    );
    process.exitCode = report.passed ? 0 : 1;
  } else {
    const report = compareReports(baseline, candidate);
    process.stdout.write(
      values.format === 'text'
        ? `${report.compatible ? 'Compatible' : 'INCOMPATIBLE'} case sets; ${report.passed ? 'PASS' : 'FAIL'}\nRegressions: ${report.regressions.join(', ') || 'none'}\nImprovements: ${report.improvements.join(', ') || 'none'}\nAdded: ${report.added.join(', ') || 'none'}\nRemoved: ${report.removed.join(', ') || 'none'}\n`
        : JSON.stringify(report, null, 2) + '\n'
    );
    process.exitCode = report.passed ? 0 : 1;
  }
} catch (error) {
  process.stdout.write(JSON.stringify({ passed: false, error: error instanceof Error ? error.message : String(error) }) + '\n');
  process.exitCode = 2;
}
