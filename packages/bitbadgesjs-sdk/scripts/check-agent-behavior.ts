import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { behavioralCases, fixtureTime, gradeBehavior } from './golden-evals/catalog.js';
import { runCases } from './golden-evals/runner.js';
import { lifecycleExecutor } from './golden-evals/execution.js';
import { callTool } from '../dist/esm/builder/tools/registry.js';

try {
  const { values } = parseArgs({
    options: { 'chain-binary': { type: 'string' }, 'chain-scenarios': { type: 'string' } },
    strict: true,
    allowPositionals: false
  });
  if (!!values['chain-binary'] !== !!values['chain-scenarios']) throw new Error('Provide both chain binary and scenario directory');
  const execute = values['chain-binary'] ? lifecycleExecutor(resolve(values['chain-binary']), resolve(values['chain-scenarios']!)) : undefined;
  const results = [];
  for (const test of behavioralCases) {
    try {
      if ('assertions' in test.oracle) {
        const oracle = test.oracle;
        const originalNow = Date.now;
        let artifact: unknown;
        let contracts;
        try {
          Date.now = () => fixtureTime;
          contracts = await runCases([oracle], async () => {
            if (test.reference)
              artifact = JSON.parse(readFileSync(new URL(`./golden-evals/references/${test.reference}.json`, import.meta.url), 'utf8'));
            else {
              const built = await callTool(oracle.tool, oracle.input);
              if (built.isError) throw new Error(built.text);
              artifact = built.result;
            }
            return artifact;
          });
        } finally {
          Date.now = originalNow;
        }
        const execution = execute && test.lifecycle ? await execute(test, artifact) : undefined;
        results.push({
          id: test.id,
          partition: test.partition,
          passed: contracts.passed && (!execution || execution.passed),
          artifactSha256: artifact ? createHash('sha256').update(JSON.stringify(artifact)).digest('hex') : null,
          contracts,
          execution: execution ?? { status: 'not-run' }
        });
      } else {
        const correct = gradeBehavior(test, { ...test.oracle, explanation: 'Reference response.' });
        const mutation = gradeBehavior(test, { ...test.oracle, disposition: 'propose', artifact: {}, explanation: 'Contradictory proposal.' });
        results.push({
          id: test.id,
          partition: test.partition,
          passed: correct.passed && !mutation.passed,
          contracts: { correct, mutation },
          execution: { status: 'not-applicable' }
        });
      }
    } catch (error) {
      results.push({ id: test.id, passed: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  const report = {
    version: 1,
    scope: 'behavioral-reference-contracts',
    maturity: 'experimental',
    interpretation: 'Diagnostic only; not a source of truth or proof of correctness.',
    modelExecution: 'not-run',
    passed: results.every((result) => result.passed),
    provenance: {
      sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      fixtureTime,
      caseSetSha256: createHash('sha256').update(JSON.stringify(behavioralCases)).digest('hex'),
      chainBinarySha256: values['chain-binary'] ? createHash('sha256').update(readFileSync(values['chain-binary'])).digest('hex') : null
    },
    summary: {
      total: results.length,
      passed: results.filter((result) => result.passed).length,
      failed: results.filter((result) => !result.passed).length
    },
    results
  };
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exitCode = report.passed ? 0 : 1;
} catch (error) {
  process.stdout.write(JSON.stringify({ version: 1, passed: false, error: error instanceof Error ? error.message : String(error) }) + '\n');
  process.exitCode = 2;
}
