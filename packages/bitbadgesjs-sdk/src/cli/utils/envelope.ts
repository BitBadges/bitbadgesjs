/**
 * Uniform output envelope for every CLI command.
 *
 * Every command that emits parseable output goes through this module so
 * agents see one shape across the whole surface:
 *
 *   { ok, data, warnings, hint, error }
 *
 * Format selection: `--format json|text`. Default is `text` on a TTY and
 * `json` on a pipe — agents pipe stdout, humans read it. `--json` is kept
 * as a one-release alias.
 *
 * Each command provides its own text rendering; this module owns the JSON
 * shape and the format-resolution rules.
 */
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
  error: EnvelopeError | null;
}

export type Format = 'json' | 'text';

export interface FormatOptions {
  /** Resolved format (`json` | `text`). */
  format?: string;
  /** Legacy `--json` flag — coerces to `format=json`. */
  json?: boolean;
  /** Legacy `--json-only` flag (used by `build`) — coerces to `format=json`. */
  jsonOnly?: boolean;
  /** `--condensed` — JSON without indentation. Only honored when format=json. */
  condensed?: boolean;
}

/**
 * Resolve the effective output format from a mix of new and legacy flags.
 *
 * Priority:
 *   1. `--format <json|text>` — explicit wins.
 *   2. `--json` / `--json-only` — legacy aliases.
 *   3. TTY detection — pipes default to JSON, terminals to text.
 */
export function resolveFormat(opts: FormatOptions, stream: NodeJS.WriteStream = process.stdout): Format {
  if (opts.format === 'json') return 'json';
  if (opts.format === 'text') return 'text';
  if (opts.json || opts.jsonOnly) return 'json';
  return stream.isTTY ? 'text' : 'json';
}

export function successEnvelope<T>(data: T, opts: { warnings?: EnvelopeWarning[]; hint?: string } = {}): Envelope<T> {
  return {
    ok: true,
    data,
    warnings: opts.warnings ?? [],
    ...(opts.hint ? { hint: opts.hint } : {}),
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
 * Write an envelope as JSON. Indented by default; condensed strips
 * whitespace for piping.
 */
export function writeJsonEnvelope(env: Envelope<unknown>, opts: { condensed?: boolean } = {}, stream: NodeJS.WriteStream = process.stdout): void {
  const text = opts.condensed ? JSON.stringify(env) : JSON.stringify(env, null, 2);
  stream.write(text + '\n');
}

/**
 * Add `--format` (and the legacy `--json` alias) to a Command. Use on every
 * command that produces parseable output.
 */
export function addFormatOptions(cmd: Command): Command {
  return cmd
    .option('--format <fmt>', 'Output format: json | text. Default: text on TTY, json on pipe.')
    .option('--json', '(Deprecated) Alias for --format json.');
}
