import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { z } from 'zod';

const versionSchema = z.object({ protocolVersion: z.literal(1), name: z.literal('bitbadges-lifecycle'), execution: z.literal('module'), chainCommit: z.string().min(1) });
const assertionSchema = z.object({ kind: z.string(), passed: z.boolean(), expected: z.unknown(), actual: z.unknown() }).passthrough();
const resultSchema = z.object({
  version: z.literal(1), id: z.string(), passed: z.boolean(), execution: z.literal('module'), chainCommit: z.string(), scenarioHash: z.string().regex(/^[a-f0-9]{64}$/),
  steps: z.array(z.object({ id: z.string(), passed: z.boolean(), success: z.boolean(), timeMs: z.string(), assertions: z.array(assertionSchema).min(1) }).passthrough()).min(1),
  coverage: z.object({ excluded: z.array(z.string()) })
}).passthrough();
export type LifecycleResult = z.infer<typeof resultSchema>;
export type RunnerOptions = { executable?: string; timeoutMs?: number; maxOutputBytes?: number };
const executable = (opts: RunnerOptions) => opts.executable || process.env.BITBADGES_LIFECYCLE_RUNNER || 'bitbadges-lifecycle';

async function invoke(args: string[], input: string, opts: RunnerOptions) {
  const timeout = opts.timeoutMs ?? 30_000;
  const limit = opts.maxOutputBytes ?? 2 * 1024 * 1024;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 120_000 || !Number.isInteger(limit) || limit < 1 || limit > 8 * 1024 * 1024) throw new Error('Invalid runner timeout or output bound.');
  return new Promise<{ code: number; stdout: string }>((resolve, reject) => {
    const child = spawn(executable(opts), args, { shell: false, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'], env: { PATH: process.env.PATH, HOME: process.env.HOME, ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}) } });
    let done = false;
    let bytes = 0;
    let stdout = '';
    const stop = (message: string) => {
      if (done) return;
      done = true; clearTimeout(timer);
      try { if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGKILL'); else child.kill('SIGKILL'); } catch { /* Process already exited. */ }
      reject(new Error(message));
    };
    const timer = setTimeout(() => stop('Local lifecycle runner timeout; no production transaction was submitted.'), timeout);
    const collect = (chunk: Buffer, out: boolean) => { bytes += chunk.length; if (bytes > limit) stop('Local lifecycle runner output exceeded its bound.'); else if (out) stdout += chunk.toString('utf8'); };
    child.stdout.on('data', chunk => collect(chunk, true));
    child.stderr.on('data', chunk => collect(chunk, false));
    child.on('error', () => stop('Local lifecycle runner unavailable. Build bitbadges-lifecycle from the chain repository and set BITBADGES_LIFECYCLE_RUNNER to its executable path.'));
    child.stdin.on('error', () => { /* Close reports the runner exit status. */ });
    child.on('close', code => { if (!done) { done = true; clearTimeout(timer); resolve({ code: code ?? 2, stdout }); } });
    child.stdin.end(input);
  });
}

export async function lifecycleDiagnostics(path?: string) {
  try {
    const response = await invoke(['--version'], '', { executable: path, timeoutMs: 2000, maxOutputBytes: 4096 });
    const version = versionSchema.parse(JSON.parse(response.stdout));
    if (response.code !== 0) throw new Error('Runner failed');
    return { available: true, ...version, sourceVerified: version.chainCommit !== 'unknown', localOnly: true };
  } catch { return { available: false, code: 'runner_unavailable', localOnly: true, nextAction: 'Install protocol version 1 bitbadges-lifecycle; set BITBADGES_LIFECYCLE_RUNNER. No API or model key is required.' }; }
}

export async function getLifecycleSchema(opts: RunnerOptions = {}) {
  const response = await invoke(['--schema'], '', opts);
  if (response.code !== 0) throw new Error('Local runner schema unavailable.');
  return JSON.parse(response.stdout);
}

export async function runLifecycle(input: { scenario: unknown; requiredCoverage?: string[] }, opts: RunnerOptions = {}) {
  const payload = JSON.stringify(input.scenario);
  if (!payload || Buffer.byteLength(payload) > 1024 * 1024) throw new Error('Scenario must be JSON no larger than 1 MiB.');
  const versionResult = await invoke(['--version'], '', opts);
  let version: z.infer<typeof versionSchema>;
  try { version = versionSchema.parse(JSON.parse(versionResult.stdout)); } catch { throw new Error('Local runner protocol version mismatch; install bitbadges-lifecycle protocol version 1.'); }
  if (versionResult.code !== 0) throw new Error('Local runner version check failed.');
  const response = await invoke([], payload, opts);
  let result: LifecycleResult;
  try { result = resultSchema.parse(JSON.parse(response.stdout)); } catch { throw new Error('Invalid local lifecycle result. Read the installed lifecycle_schema and correct scenario input.'); }
  const hash = createHash('sha256').update(payload).digest('hex');
  const scenario = input.scenario as { id?: unknown; steps?: { id: string }[] };
  if (result.scenarioHash !== hash || result.id !== scenario.id || result.chainCommit !== version.chainCommit ||
      !Array.isArray(scenario.steps) || scenario.steps.length !== result.steps.length || scenario.steps.some((step, index) => step.id !== result.steps[index].id)) throw new Error('Local lifecycle result is not bound to the requested scenario/version.');
  const executed = result.steps.every(step => step.passed && step.assertions.every(assertion => assertion.passed));
  if (result.passed !== executed || response.code !== (result.passed ? 0 : 1)) throw new Error('Local lifecycle result has inconsistent pass/exit evidence.');
  const supported = new Set(['module']);
  const missing = (input.requiredCoverage ?? ['module']).filter(scope => !supported.has(scope));
  return { ...result, localOnly: true, sourceVerified: version.chainCommit !== 'unknown',
    status: !result.passed ? 'violated' : missing.length > 0 ? 'unverified' : 'satisfied',
    coverage: { version: 1, executed: ['module'], excluded: [...new Set([...result.coverage.excluded, 'claims', 'plugins', 'indexer', 'IBC', 'external services'])], missingRequired: missing },
    invocation: { executable: 'bitbadges-lifecycle', arguments: [], protocolVersion: 1, timeoutMs: opts.timeoutMs ?? 30_000 } };
}
