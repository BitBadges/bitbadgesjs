import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parseCases, runCases } from './golden-evals/index.js';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const fixtureTime = 1893456000000;

function distHash(): string {
  const root = path.join(packageDir, 'dist/esm');
  const digest = createHash('sha256');
  function visit(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith('.js') || entry.name.endsWith('.json')) {
        digest.update(path.relative(root, file)).update('\0').update(readFileSync(file)).update('\0');
      }
    }
  }
  visit(root);
  return digest.digest('hex');
}

try {
  const { values } = parseArgs({ options: { cases: { type: 'string' }, artifacts: { type: 'string' } }, strict: true, allowPositionals: false });
  const casesText = readFileSync(values.cases ?? path.join(packageDir, 'scripts/golden-evals/cases.json'), 'utf8');
  const cases = parseCases(JSON.parse(casesText));
  let supplied: Record<string, unknown> | undefined;
  let artifactsText: string | undefined;
  if (values.artifacts) {
    artifactsText = readFileSync(values.artifacts, 'utf8');
    const parsed = JSON.parse(artifactsText);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Artifacts must be an object keyed by case ID');
    const ids = new Set(cases.map((item) => item.id));
    for (const key of Object.keys(parsed)) if (!ids.has(key)) throw new Error('Unknown artifact case ID: ' + key);
    supplied = parsed;
  }
  const originalNow = Date.now;
  let report: Awaited<ReturnType<typeof runCases>>;
  try {
    Date.now = () => fixtureTime;
    if (supplied) {
      const artifacts = supplied;
      report = await runCases(cases, async (testCase) => {
        if (!Object.prototype.hasOwnProperty.call(artifacts, testCase.id)) throw new Error('Missing supplied artifact: ' + testCase.id);
        return artifacts[testCase.id];
      });
    } else {
      const { callTool } = await import('../dist/esm/builder/tools/registry.js');
      report = await runCases(cases, async (testCase) => {
        const output = await callTool(testCase.tool, testCase.input);
        if (output.isError) throw new Error(output.text);
        return output.result;
      });
    }
  } finally {
    Date.now = originalNow;
  }
  const git = (args: string[]) => execFileSync('git', args, { cwd: packageDir, encoding: 'utf8' }).trim();
  const provenance = {
    sdkVersion: JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8')).version,
    sourceCommit: git(['rev-parse', 'HEAD']),
    sourceDirty: git(['status', '--porcelain', '--untracked-files=normal', '--', '.', ':!.codegraph']) !== '',
    caseSetSha256: hash(casesText),
    fixtureTime,
    ...(artifactsText !== undefined ? { suppliedArtifactsSha256: hash(artifactsText) } : { builtArtifactsSha256: distHash() })
  };
  process.stdout.write(JSON.stringify({ ...report, source: supplied ? 'supplied-artifacts' : 'installed-builders', provenance }, null, 2) + '\n');
  process.exitCode = report.passed ? 0 : 1;
} catch (error) {
  process.stdout.write(JSON.stringify({ version: 1, passed: false, error: error instanceof Error ? error.message : String(error) }) + '\n');
  process.exitCode = 2;
}
