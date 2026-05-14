/**
 * Uniform output envelope for every CLI command.
 *
 * Every command that emits parseable output goes through this module so
 * agents see one shape across the whole surface:
 *
 *   { ok, data, warnings, hint, error }
 *
 * As of #0398's rollout there is no `--format text` switch — every
 * data-emitting command always writes JSON. The dual-mode design from
 * the pilot didn't survive contact with 40 commands: a single shape is
 * far cheaper for agents than a TTY-aware format-resolver and a parallel
 * text renderer per verb. Humans can pipe through `jq -r` when they need
 * a plain value.
 *
 * Universal flags every data-emitting command should accept:
 *   --condensed       single-line JSON (smaller pipe payload)
 *   --output-file     write to file instead of stdout
 *
 * Shell-integration verbs (`completion`, parts of `docs`) and pure
 * interactive flows (`auth login` prompts) are intentional exceptions —
 * their stdout isn't agent-parseable data.
 */
import * as fs from 'node:fs';
import type { Command } from 'commander';

export interface EnvelopeWarning {
  code: string;
  message: string;
  details?: unknown;
}

export interface EnvelopeError {
  code: string;
  message: string;
  details?: unknown;
}

export interface Envelope<T = unknown> {
  ok: boolean;
  data: T | null;
  warnings: EnvelopeWarning[];
  hint?: string;
  /**
   * Structured sidecar metadata. Use when a command has additional
   * payload-adjacent context that doesn't belong inside `data` (so pipe
   * consumers reading `data` see the unpolluted primary payload) and
   * isn't a warning either. Example: `bb build` puts the review /
   * validation / simulate / resolved-metadata reports here, alongside
   * the raw msg that lives in `data`.
   */
  meta?: Record<string, unknown>;
  error: EnvelopeError | null;
}

export interface EmitOptions {
  /** Emit single-line JSON (no whitespace). */
  condensed?: boolean;
  /** Write to file instead of stdout. */
  outputFile?: string;
  /** Optional warnings to surface alongside the data. */
  warnings?: EnvelopeWarning[];
  /** Optional hint string (machine-readable next-step). */
  hint?: string;
  /** Optional structured sidecar metadata — see {@link Envelope.meta}. */
  meta?: Record<string, unknown>;
}

export function successEnvelope<T>(
  data: T,
  opts: { warnings?: EnvelopeWarning[]; hint?: string; meta?: Record<string, unknown> } = {}
): Envelope<T> {
  return {
    ok: true,
    data,
    warnings: opts.warnings ?? [],
    ...(opts.hint ? { hint: opts.hint } : {}),
    ...(opts.meta && Object.keys(opts.meta).length > 0 ? { meta: opts.meta } : {}),
    error: null
  };
}

export function errorEnvelope(code: string, message: string, details?: unknown, hint?: string): Envelope<null> {
  return {
    ok: false,
    data: null,
    warnings: [],
    ...(hint ? { hint } : {}),
    error: { code, message, ...(details !== undefined ? { details } : {}) }
  };
}

/** JSON.stringify replacer that turns BigInt into its string form. SDK
 * payloads converted through BigIntify carry bigints in many fields;
 * without this, JSON.stringify throws "Do not know how to serialize a
 * BigInt". Centralizing here so every emitter benefits. */
function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

/**
 * The single entry point for command output. Wraps `data` in a success
 * envelope, JSON-stringifies (with BigInt support), honors --condensed /
 * --output-file, and writes to stdout (or the named file).
 *
 * Use this from every data-emitting command — including indexer wrappers
 * (via `emitIndexerResult`, which now delegates here). The only callers
 * that should NOT use this are shell-integration scripts (`completion`),
 * interactive prompts (`auth login`'s input phase), and the doc-tree
 * renderer (`docs`) — those are UX surfaces, not data.
 */
export function emit(data: unknown, opts: EmitOptions = {}): void {
  const env = successEnvelope(data, { warnings: opts.warnings, hint: opts.hint, meta: opts.meta });
  const text = opts.condensed
    ? JSON.stringify(env, bigIntReplacer)
    : JSON.stringify(env, bigIntReplacer, 2);
  if (opts.outputFile) {
    fs.writeFileSync(opts.outputFile, text + '\n', 'utf-8');
    process.stderr.write(`Written to ${opts.outputFile}\n`);
  } else {
    process.stdout.write(text + '\n');
  }
}

interface ApiErrorShape {
  message?: string;
  response?: unknown;
  hint?: string;
  code?: string;
}

/**
 * Emit an error envelope and exit non-zero. Mirrors `emit()`'s output
 * contract — stdout JSON, never plaintext — so agents that pipe `bb foo |
 * jq` see a valid envelope on both success AND failure paths.
 *
 * The error envelope's `code` defaults to the HTTP-style status if the
 * thrown error carries `.response.errorMessage`; otherwise falls back to
 * a generic `cli_error`. Callers passing a domain code should construct
 * the envelope directly via `errorEnvelope()` and write it themselves.
 */
export function emitError(err: unknown, opts: EmitOptions & { exitCode?: number; code?: string } = {}): never {
  const e = err as ApiErrorShape;
  const message = (() => {
    if (e?.response !== undefined) {
      if (typeof e.response === 'string') return e.response;
      try {
        return JSON.stringify(e.response);
      } catch {
        return String(e.response);
      }
    }
    return e?.message ?? String(err);
  })();
  const code = opts.code ?? e?.code ?? 'cli_error';
  const env = errorEnvelope(code, message, e?.response, e?.hint);
  const text = opts.condensed
    ? JSON.stringify(env, bigIntReplacer)
    : JSON.stringify(env, bigIntReplacer, 2);
  process.stdout.write(text + '\n');
  process.exit(opts.exitCode ?? 1);
}

/**
 * `--quiet` resolution. Honors the flag, the `BB_QUIET` env var, or a
 * non-TTY stderr (so default piping doesn't get noisy). Use to gate
 * commentary output (auto-review banners, "Written to ..." notices, etc) —
 * NEVER use this to suppress actual errors.
 */
export function isQuiet(opts: { quiet?: boolean } = {}): boolean {
  if (opts.quiet) return true;
  if (process.env.BB_QUIET === '1' || process.env.BB_QUIET === 'true') return true;
  return false;
}

/**
 * Print an informational commentary line to stderr unless quiet mode is
 * active. Use this for auto-review banners, "Written to ..." notices,
 * and other human-targeted commentary that agents want to silence.
 */
export function commentary(message: string, opts: { quiet?: boolean } = {}, stream: NodeJS.WriteStream = process.stderr): void {
  if (isQuiet(opts)) return;
  stream.write(message + (message.endsWith('\n') ? '' : '\n'));
}

/**
 * Write an envelope directly. Used by callers (like `tx`) that build
 * their own envelope to attach domain-specific warnings. Honors
 * --condensed; respects --output-file via the optional path.
 */
export function writeJsonEnvelope(
  env: Envelope<unknown>,
  opts: { condensed?: boolean; outputFile?: string } = {},
  stream: NodeJS.WriteStream = process.stdout
): void {
  const text = opts.condensed
    ? JSON.stringify(env, bigIntReplacer)
    : JSON.stringify(env, bigIntReplacer, 2);
  if (opts.outputFile) {
    fs.writeFileSync(opts.outputFile, text + '\n', 'utf-8');
    process.stderr.write(`Written to ${opts.outputFile}\n`);
    return;
  }
  stream.write(text + '\n');
}

/**
 * Add the two universal output flags every data-emitting command should
 * accept: `--condensed` and `--output-file`. Replaces the previous
 * `addFormatOptions` (which exposed --format / --json) — those flags are
 * gone now that there's only one output mode.
 */
export function addOutputOptions(cmd: Command): Command {
  return cmd
    .option('--condensed', 'Single-line JSON (smaller pipe payload)', false)
    .option('--output-file <path>', 'Write the envelope to file instead of stdout');
}
