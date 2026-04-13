/**
 * Tiny terminal-output helpers for CLI commands.
 *
 * Responsibilities:
 *  - TTY detection (only colorize when the stream is actually a terminal)
 *  - Narrow ANSI colour + style primitives (bold, red, yellow, cyan, green,
 *    dim) — no external dep so we stay compatible with the SDK's existing
 *    commonjs / esm dual build
 *  - A single `renderReview()` function that both `emit()` (templates
 *    auto-review) and `builder review` call, so output formatting stays in
 *    lockstep across the `build → review` flow
 *
 * We deliberately check the *target* stream each time rather than caching,
 * because the caller may pass different streams (review to stderr, JSON to
 * stdout) and redirections can differ per stream. `NO_COLOR` env var
 * (https://no-color.org) force-disables colour.
 */

export type ColorFn = (s: string) => string;

const OPEN: Record<string, string> = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

/**
 * Build a colorizer for the given NodeJS.WritableStream. Returns a function
 * that passes through plain text when colour is disabled.
 */
export function makeColor(stream: NodeJS.WriteStream): { c: (code: keyof typeof OPEN, s: string) => string; enabled: boolean } {
  const enabled =
    !process.env.NO_COLOR &&
    process.env.TERM !== 'dumb' &&
    !!(stream as any).isTTY;
  return {
    enabled,
    c: (code, s) => (enabled ? `${OPEN[code] ?? ''}${s}${OPEN.reset}` : s)
  };
}

/** Build a horizontal rule filled with `ch` up to `width`, with an optional label. */
export function rule(ch: string, width: number, label?: string): string {
  if (!label) return ch.repeat(width);
  const pre = `${ch}${ch}${ch} ${label} `;
  const rem = Math.max(3, width - pre.length);
  return `${pre}${ch.repeat(rem)}`;
}

/**
 * Render a ReviewResult as terminal-friendly text.
 *
 * Parameters are intentionally minimal — the caller decides where to write
 * (stdout vs stderr, file vs stream) and whether to add a boundary separator
 * after the review section.
 *
 * @returns the formatted string (no trailing newline)
 */
export function renderReview(
  result: {
    findings: Array<{
      code: string;
      severity: 'critical' | 'warning' | 'info';
      messageEn: string;
      recommendationEn?: string;
    }>;
    summary: { critical: number; warning: number; info: number; verdict: string };
  },
  opts: { stream: NodeJS.WriteStream; title?: string }
): string {
  const { c, enabled } = makeColor(opts.stream);
  const width = Math.min(80, (opts.stream as any).columns || 80);
  const title = opts.title || 'Review';

  const lines: string[] = [];
  lines.push(c('gray', rule('━', width, title)));

  if (result.findings.length === 0) {
    lines.push('');
    lines.push(`  ${c('green', '✓')} ${c('bold', 'Clean')} — no findings`);
    lines.push('');
  } else {
    const byLevel: Record<'critical' | 'warning' | 'info', typeof result.findings> = {
      critical: [],
      warning: [],
      info: []
    };
    for (const f of result.findings) byLevel[f.severity].push(f);

    const sigil = { critical: '■', warning: '▲', info: '●' } as const;
    const colorFor = { critical: 'red', warning: 'yellow', info: 'cyan' } as const;
    const labelFor = { critical: 'CRITICAL', warning: 'WARNING ', info: 'INFO    ' } as const;

    let first = true;
    for (const level of ['critical', 'warning', 'info'] as const) {
      for (const f of byLevel[level]) {
        if (!first) lines.push('');
        first = false;
        const badge = `${sigil[level]} ${labelFor[level]}`;
        lines.push(`  ${c(colorFor[level], c('bold', badge))}  ${c('dim', f.code)}`);
        for (const textLine of wrap(f.messageEn, width - 6)) {
          lines.push(`      ${textLine}`);
        }
        if (f.recommendationEn) {
          for (const textLine of wrap(f.recommendationEn, width - 8)) {
            lines.push(`      ${c('gray', '→')} ${textLine}`);
          }
        }
      }
    }
  }

  lines.push('');
  lines.push(c('gray', rule('━', width)));

  const { critical, warning, info, verdict } = result.summary;
  const verdictColor: keyof typeof OPEN =
    verdict === 'pass' ? 'green' : verdict === 'warn' ? 'yellow' : 'red';
  const summaryParts = [
    critical > 0 ? c('red', `${critical} critical`) : c('gray', `${critical} critical`),
    warning > 0 ? c('yellow', `${warning} warning`) : c('gray', `${warning} warning`),
    info > 0 ? c('cyan', `${info} info`) : c('gray', `${info} info`),
    `verdict: ${c(verdictColor, c('bold', verdict))}`
  ];
  lines.push(`  ${c('bold', 'Summary')}  ${summaryParts.join('  ·  ')}`);
  lines.push(c('gray', rule('━', width)));

  // Silence unused var warning in strict mode.
  void enabled;

  return lines.join('\n');
}

/**
 * Render a boundary rule announcing that stdout is about to take over with
 * JSON. Used by the auto-review path so the user sees a clear transition
 * between the stderr review section and the stdout transaction payload.
 */
export function renderJsonBoundary(stream: NodeJS.WriteStream): string {
  const { c } = makeColor(stream);
  const width = Math.min(80, (stream as any).columns || 80);
  return c('gray', rule('━', width, 'Transaction JSON (stdout)'));
}

/** Wrap plain text to a column width, preserving word boundaries. */
function wrap(text: string, width: number): string[] {
  if (width <= 10) return [text];
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    if (!line.length) {
      line = w;
      continue;
    }
    if (line.length + 1 + w.length > width) {
      out.push(line);
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.length) out.push(line);
  return out;
}
