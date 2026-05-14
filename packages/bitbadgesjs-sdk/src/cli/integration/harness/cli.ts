/**
 * CLI runner for integration tests — invokes the built `bb` binary as
 * a child process, parses output, surfaces errors crisply.
 *
 * We always invoke the built `dist/cjs/cli/index.js` (the canonical
 * binary entry) rather than ts-jest-running the source — integration
 * tests should exercise what users actually run.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { loadIntegrationEnv } from './preflight.js';

const CLI_ENTRY = path.resolve(__dirname, '../../../../dist/cjs/cli/index.js');

export interface RunCliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  json?: any;
}

export interface RunCliOptions {
  /** Extra env vars to set for this invocation (merged on top of process.env). */
  env?: Record<string, string>;
  /** Stdin to feed (useful for `bb deploy --msg-stdin` pipes). */
  stdin?: string;
  /** Throw if exit code is non-zero. Default true. */
  throwOnError?: boolean;
  /** Parse stdout as JSON. Default true. */
  parseJson?: boolean;
  /** Override the timeout (ms). Default 30000. */
  timeoutMs?: number;
}

/**
 * Run `bb <args...>` and return parsed output. Mostly used like:
 *   const out = runCli(['pay-requests', 'show', '42', '--local']);
 *   expect(out.json.status).toBe('pending');
 */
export function runCli(args: string[], opts: RunCliOptions = {}): RunCliResult {
  const envOverrides = {
    BB_QUIET: '1', // suppress stderr commentary for clean stdout
    ...opts.env
  };
  const res = spawnSync('node', [CLI_ENTRY, ...args], {
    encoding: 'utf-8',
    timeout: opts.timeoutMs ?? 30000,
    input: opts.stdin,
    env: { ...process.env, ...envOverrides }
  });
  const stdout = res.stdout?.toString() ?? '';
  const stderr = res.stderr?.toString() ?? '';
  const exitCode = res.status ?? -1;
  const result: RunCliResult = { stdout, stderr, exitCode };

  if (exitCode !== 0 && opts.throwOnError !== false) {
    throw new Error(
      `bb ${args.join(' ')} exited ${exitCode}\nstderr:\n${stderr.slice(0, 1500)}\nstdout:\n${stdout.slice(0, 500)}`
    );
  }

  if (opts.parseJson !== false && stdout.trim()) {
    try {
      result.json = JSON.parse(stdout);
    } catch {
      // Non-JSON output is OK for some commands (build prints a review block).
    }
  }
  return result;
}

/**
 * Run a chain-binary command directly (e.g. when an integration test
 * needs to bypass the CLI emit-then-deploy pipeline). Returns stdout.
 * Throws on non-zero exit.
 */
export function runChainBinary(args: string[], opts: { timeoutMs?: number } = {}): string {
  const env = loadIntegrationEnv();
  return execFileSync(env.chainBin, args, {
    encoding: 'utf-8',
    timeout: opts.timeoutMs ?? 30000
  }).toString();
}

export function cliEntryPath(): string {
  return CLI_ENTRY;
}
