import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { auditorCases, runAuditorBenchmark } from './golden-evals/auditor.js';

try {
  const { callTool } = await import('../dist/esm/builder/tools/registry.js');
  const { reviewCollection } = await import('../dist/esm/core/review.js');
  const report = await runAuditorBenchmark(async (tool, input) => {
    const output = await callTool(tool, input);
    if (output.isError) throw new Error(output.text);
    return output.result;
  }, reviewCollection);
  const provenance = {
    sdkVersion: JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version,
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    caseSetSha256: createHash('sha256').update(JSON.stringify(auditorCases)).digest('hex')
  };
  process.stdout.write(JSON.stringify({ ...report, provenance }, null, 2) + '\n');
  process.exitCode = report.passed ? 0 : 1;
} catch (error) {
  process.stdout.write(JSON.stringify({ version: 1, passed: false, error: error instanceof Error ? error.message : String(error) }) + '\n');
  process.exitCode = 2;
}
