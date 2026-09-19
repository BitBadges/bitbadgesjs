import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { behavioralCases } from './golden-evals/catalog.js';
import { runAgentTrials, configSchema } from './golden-evals/model-runner.js';
import { lifecycleExecutor } from './golden-evals/execution.js';

const packageDir = fileURLToPath(new URL('..', import.meta.url));
function hashTree(directory: string): string {
  const hash = createHash('sha256');
  function visit(root: string) {
    for (const name of readdirSync(root).sort()) {
      const file = join(root, name);
      if (statSync(file).isDirectory()) visit(file);
      else hash.update(file.slice(directory.length)).update('\0').update(readFileSync(file)).update('\0');
    }
  }
  visit(directory);
  return hash.digest('hex');
}

try {
  const { values } = parseArgs({
    options: {
      config: { type: 'string' },
      partition: { type: 'string', default: 'development' },
      'chain-binary': { type: 'string' },
      'chain-scenarios': { type: 'string' }
    },
    strict: true,
    allowPositionals: false
  });
  if (!values.config || !['development', 'held-out', 'all'].includes(values.partition!))
    throw new Error('Expected --config FILE [--partition development|held-out|all]');
  const raw = JSON.parse(readFileSync(values.config, 'utf8'));
  const credentialEnv: string[] = raw.credentialEnv ?? [];
  if (!Array.isArray(credentialEnv) || credentialEnv.some((key) => !['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'].includes(key)))
    throw new Error('Unsupported credential environment variable');
  delete raw.credentialEnv;
  if (raw.environment && Object.keys(raw.environment).length) throw new Error('Use credentialEnv names, not inline environment secrets');
  const config = configSchema.parse({
    ...raw,
    executable: raw.executable === 'current-runtime' ? process.execPath : raw.executable,
    args: raw.args.map((arg: string) => (arg === 'builtin-worker' ? join(packageDir, 'scripts/agent-eval-worker.ts') : arg)),
    environment: Object.fromEntries(
      credentialEnv.map((key) => {
        const value = process.env[key];
        if (!value) throw new Error('Configured provider credential is unavailable');
        return [key, value];
      })
    )
  });
  const selected = behavioralCases.filter((test) => values.partition === 'all' || test.partition === values.partition);
  if (!!values['chain-binary'] !== !!values['chain-scenarios']) throw new Error('Both chain binary and scenarios are required together');
  const execute = values['chain-binary'] ? lifecycleExecutor(resolve(values['chain-binary']), resolve(values['chain-scenarios']!)) : undefined;
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: packageDir, encoding: 'utf8' }).trim();
  const builtArtifactsSha256 = hashTree(join(packageDir, 'dist/esm'));
  const oracleBefore = hashTree(join(packageDir, 'scripts/golden-evals'));
  const report = await runAgentTrials(selected, config, execute);
  if (hashTree(join(packageDir, 'scripts/golden-evals')) !== oracleBefore) throw new Error('Evaluator files changed during execution');
  const provenance = {
    ...report.provenance,
    sourceCommit,
    sdkVersion: JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')).version,
    sourceDirty:
      execFileSync('git', ['status', '--porcelain', '--untracked-files=normal', '--', '.', ':!.codegraph'], {
        cwd: packageDir,
        encoding: 'utf8'
      }).trim() !== '',
    builtArtifactsSha256,
    evaluatorSha256: oracleBefore,
    skillsDocsSha256: hashTree(join(packageDir, 'src/builder/resources')),
    partition: values.partition,
    chainBinarySha256: values['chain-binary'] ? createHash('sha256').update(readFileSync(values['chain-binary'])).digest('hex') : null
  };
  process.stdout.write(JSON.stringify({ ...report, provenance }, null, 2) + '\n');
  process.exitCode = report.passed ? 0 : 1;
} catch {
  process.stdout.write(
    JSON.stringify({
      version: 1,
      passed: false,
      status: 'infrastructure-error',
      error: 'Evaluation could not run. Check configuration, built artifacts, credentials and unchanged evaluator files.'
    }) + '\n'
  );
  process.exitCode = 2;
}
