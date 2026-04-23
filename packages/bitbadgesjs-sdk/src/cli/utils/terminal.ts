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

import {
  resolveCoinSymbol,
  detectBalanceAliasSymbol,
  formatHumanAmount,
  type SimulateRenderCollection
} from './simulateSymbols.js';

/**
 * Build the `(…)` suffix for an ICS20 coin line. `rawAmount` is the
 * signed stringified integer as it appears in the simulate result
 * (e.g. `"-5000"` or `"+5000"`). Returns an empty string if the
 * denom isn't in the registry so the render stays a no-op.
 */
function coinSuffix(rawAmount: unknown, denom: string, c: (code: any, s: string) => string): string {
  const info = resolveCoinSymbol(denom);
  if (!info) return '';
  let inner = info.symbol;
  if (info.decimals > 0) {
    // rawAmount may carry a leading '+' that BigInt() doesn't accept;
    // strip it first. Any parse failure → plain symbol (no amount).
    const cleaned = String(rawAmount).replace(/^\+/, '');
    try {
      const bi = BigInt(cleaned);
      inner = `${formatHumanAmount(bi, info.decimals)} ${info.symbol}`;
    } catch {
      /* keep inner = symbol */
    }
  }
  return ' ' + c('dim', `(${inner})`);
}

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

/**
 * Colorize the `"amount":"<n>"` field inside a BalanceArray JSON string
 * in-place — red for negative values, green for positive. Leaves the
 * rest of the JSON untouched so the structure stays machine-readable.
 * The regex is deliberately conservative: it only matches a string-
 * quoted integer value right after the literal key `"amount":`.
 */
export function colorizeAmountsInJson(
  json: string,
  c: (code: 'red' | 'green', s: string) => string
): string {
  return json.replace(/"amount":"(-?\d+)"/g, (_match, amt: string) => {
    const colored = amt.startsWith('-') ? c('red', amt) : c('green', '+' + amt);
    return `"amount":"${colored}"`;
  });
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
      title: { en: string };
      detail: { en: string };
      recommendation: { en: string };
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
        for (const textLine of wrap(f.title.en, width - 6)) {
          lines.push(`      ${c('bold', textLine)}`);
        }
        if (f.detail.en) {
          for (const textLine of wrap(f.detail.en, width - 6)) {
            lines.push(`      ${textLine}`);
          }
        }
        if (f.recommendation.en) {
          for (const textLine of wrap(f.recommendation.en, width - 8)) {
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
export function wrap(text: string, width: number): string[] {
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

// ─────────────────────────────────────────────────────────────────────────────
// Validate / Metadata renderers — shared between templates auto-review and
// the standalone `builder verify` command so output formatting stays in
// lockstep across the build → verify flow.
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidationIssueLike {
  severity: 'error' | 'warning';
  path?: string;
  message: string;
}

export interface ValidationResultLike {
  valid: boolean;
  issues: ValidationIssueLike[];
}

/**
 * Render a ValidationResult for stderr/stdout. Title defaults to "Validate"
 * but `emit()` in templates passes "Auto-Validate" to distinguish.
 */
export function renderValidate(
  result: ValidationResultLike,
  opts?: { stream?: NodeJS.WriteStream; title?: string }
): string {
  const stream = opts?.stream || process.stderr;
  const { c } = makeColor(stream);
  const width = Math.min(80, (stream as any).columns || 80);
  const errors = result.issues.filter((i) => i.severity === 'error');
  const warnings = result.issues.filter((i) => i.severity === 'warning');

  const lines: string[] = [];
  lines.push(c('gray', rule('━', width, opts?.title || 'Validate')));

  if (result.issues.length === 0) {
    lines.push('');
    lines.push(`  ${c('green', '✓')} ${c('bold', 'Clean')} — no structural issues`);
  } else {
    lines.push('');
    for (const issue of result.issues) {
      const lc = issue.severity === 'error' ? 'red' : 'yellow';
      const badge = issue.severity === 'error' ? '■ ERROR  ' : '▲ WARNING';
      lines.push(`  ${c(lc, c('bold', badge))}  ${c('dim', issue.path || '(root)')}`);
      for (const t of wrap(issue.message, width - 6)) {
        lines.push(`      ${t}`);
      }
    }
    lines.push('');
    lines.push(
      `  ${c('bold', 'Summary')}  ${
        errors.length > 0 ? c('red', `${errors.length} error`) : c('gray', '0 error')
      }  ·  ${warnings.length > 0 ? c('yellow', `${warnings.length} warning`) : c('gray', '0 warning')}`
    );
  }
  lines.push(c('gray', rule('━', width)));
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Design decisions renderer — the inverse of renderReview. Review items are
// actionable (severity + fix); design decisions are informational (pass/fail/
// n-a). Rendering is grouped by category so readers can scan Standards,
// Metadata, Supply, etc. as coherent blocks.
// ─────────────────────────────────────────────────────────────────────────────

export interface DesignDecisionLike {
  code: string;
  category: string;
  title: { en: string };
  detail: { en: string };
  status: 'pass' | 'fail' | 'n/a';
  evidence?: string;
}

export interface DesignDecisionsResultLike {
  decisions: DesignDecisionLike[];
  summary: { pass: number; fail: number; na: number };
}

export function renderDesignDecisions(
  result: DesignDecisionsResultLike,
  opts?: { stream?: NodeJS.WriteStream; title?: string }
): string {
  const stream = opts?.stream || process.stderr;
  const { c } = makeColor(stream);
  const width = Math.min(80, (stream as any).columns || 80);
  const title = opts?.title || 'Design Decisions';

  const lines: string[] = [];
  lines.push(c('gray', rule('━', width, title)));

  if (result.decisions.length === 0) {
    lines.push('');
    lines.push(`  ${c('gray', '·')} No design decisions emitted`);
    lines.push('');
    lines.push(c('gray', rule('━', width)));
    return lines.join('\n');
  }

  // Group by category while preserving first-seen order.
  const categoryOrder: string[] = [];
  const byCategory: Record<string, DesignDecisionLike[]> = {};
  for (const d of result.decisions) {
    if (!byCategory[d.category]) {
      byCategory[d.category] = [];
      categoryOrder.push(d.category);
    }
    byCategory[d.category].push(d);
  }

  const sigil = { pass: '✓', fail: '✗', 'n/a': '·' } as const;
  const colorFor = { pass: 'green', fail: 'red', 'n/a': 'gray' } as const;

  let firstCat = true;
  for (const cat of categoryOrder) {
    if (!firstCat) lines.push('');
    firstCat = false;
    lines.push(`  ${c('bold', prettyCategory(cat))}`);
    for (const d of byCategory[cat]) {
      const sg = sigil[d.status];
      const co = colorFor[d.status];
      lines.push(`    ${c(co, sg)}  ${c('bold', d.title.en)}  ${c('dim', d.code)}`);
      if (d.evidence) {
        for (const t of wrap(d.evidence, width - 8)) {
          lines.push(`        ${c('dim', t)}`);
        }
      }
    }
  }

  lines.push('');
  lines.push(c('gray', rule('━', width)));
  const { pass, fail, na } = result.summary;
  const summaryParts = [
    pass > 0 ? c('green', `${pass} pass`) : c('gray', `${pass} pass`),
    fail > 0 ? c('red', `${fail} fail`) : c('gray', `${fail} fail`),
    c('gray', `${na} n/a`)
  ];
  lines.push(`  ${c('bold', 'Summary')}  ${summaryParts.join('  ·  ')}`);
  lines.push(c('gray', rule('━', width)));

  return lines.join('\n');
}

function prettyCategory(cat: string): string {
  if (!cat) return 'Other';
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/[_-]/g, ' ');
}

export interface MetadataPlaceholderEntry {
  uri: string;
  kind: string;
  location: string;
  fields: string[];
}

/**
 * Walk a transaction body (or full tx with `messages: [...]`) and collect
 * every `ipfs://METADATA_*` placeholder URI, tagged with what it is and
 * where it lives. Used by both the templates auto-review and the
 * standalone `builder verify` command.
 *
 * Accepts either a single Msg (`{typeUrl, value: {...}}`), the unwrapped
 * `value`, or a tx body with `messages[]` — pulls out the first
 * collection message it finds (MsgCreateCollection, MsgUpdateCollection,
 * or legacy MsgUniversalUpdateCollection).
 */
export function collectMetadataPlaceholders(input: any): MetadataPlaceholderEntry[] {
  const out: MetadataPlaceholderEntry[] = [];
  const seen = new Set<string>();

  // Locate the collection value.
  let value: any = null;
  if (Array.isArray(input?.messages)) {
    const isCollection = (t: unknown) =>
      typeof t === 'string' &&
      (t.endsWith('.MsgCreateCollection') ||
        t.endsWith('.MsgUpdateCollection') ||
        t.endsWith('.MsgUniversalUpdateCollection'));
    const msg = input.messages.find((m: any) => isCollection(m?.typeUrl)) || input.messages[0];
    value = msg?.value || msg;
  } else if (input?.value) {
    value = input.value;
  } else {
    value = input;
  }
  if (!value || typeof value !== 'object') return out;

  const isPlaceholder = (uri: unknown): uri is string =>
    typeof uri === 'string' && /^ipfs:\/\/METADATA_[A-Z]/.test(uri);

  const push = (uri: string, kind: string, location: string, fields: string[]) => {
    if (seen.has(uri)) return;
    seen.add(uri);
    out.push({ uri, kind, location, fields });
  };

  // Collection metadata
  if (isPlaceholder(value?.collectionMetadata?.uri)) {
    push(value.collectionMetadata.uri, 'Collection', 'collectionMetadata.uri', ['name', 'description', 'image']);
  }

  // Per-token metadata
  if (Array.isArray(value.tokenMetadata)) {
    for (let i = 0; i < value.tokenMetadata.length; i++) {
      const tm = value.tokenMetadata[i];
      if (isPlaceholder(tm?.uri)) {
        const ids = Array.isArray(tm.tokenIds) && tm.tokenIds.length > 0
          ? tm.tokenIds.map((r: any) => `${r.start}-${r.end}`).join(', ')
          : 'all';
        push(tm.uri, `Token (ids: ${ids})`, `tokenMetadata[${i}].uri`, ['name', 'description', 'image']);
      }
    }
  }

  // Approval metadata
  if (Array.isArray(value.collectionApprovals)) {
    for (let i = 0; i < value.collectionApprovals.length; i++) {
      const a = value.collectionApprovals[i];
      if (isPlaceholder(a?.uri)) {
        push(a.uri, `Approval "${a.approvalId || i}"`, `collectionApprovals[${i}].uri`, [
          'name',
          'description',
          'image (must be "")'
        ]);
      }
    }
  }

  // Alias path metadata (path level + each denomUnit)
  if (Array.isArray(value.aliasPathsToAdd)) {
    for (let i = 0; i < value.aliasPathsToAdd.length; i++) {
      const ap = value.aliasPathsToAdd[i];
      if (isPlaceholder(ap?.metadata?.uri)) {
        push(ap.metadata.uri, `Alias path "${ap.denom || i}"`, `aliasPathsToAdd[${i}].metadata.uri`, [
          'name',
          'description',
          'image'
        ]);
      }
      if (Array.isArray(ap?.denomUnits)) {
        for (let j = 0; j < ap.denomUnits.length; j++) {
          const du = ap.denomUnits[j];
          if (isPlaceholder(du?.metadata?.uri)) {
            push(
              du.metadata.uri,
              `Denom unit "${du.symbol || j}" of ${ap.denom || i}`,
              `aliasPathsToAdd[${i}].denomUnits[${j}].metadata.uri`,
              ['name', 'description', 'image']
            );
          }
        }
      }
    }
  }

  // Cosmos wrapper path metadata
  if (Array.isArray(value.cosmosCoinWrapperPathsToAdd)) {
    for (let i = 0; i < value.cosmosCoinWrapperPathsToAdd.length; i++) {
      const wp = value.cosmosCoinWrapperPathsToAdd[i];
      if (isPlaceholder(wp?.metadata?.uri)) {
        push(wp.metadata.uri, `Wrapper path "${wp.denom || i}"`, `cosmosCoinWrapperPathsToAdd[${i}].metadata.uri`, [
          'name',
          'description',
          'image'
        ]);
      }
      if (Array.isArray(wp?.denomUnits)) {
        for (let j = 0; j < wp.denomUnits.length; j++) {
          const du = wp.denomUnits[j];
          if (isPlaceholder(du?.metadata?.uri)) {
            push(
              du.metadata.uri,
              `Wrapper denom unit "${du.symbol || j}" of ${wp.denom || i}`,
              `cosmosCoinWrapperPathsToAdd[${i}].denomUnits[${j}].metadata.uri`,
              ['name', 'description', 'image']
            );
          }
        }
      }
    }
  }

  return out;
}

export interface PlaceholderSidecar {
  [uri: string]: { name?: string; description?: string; image?: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulate renderer — shared between templates --simulate auto-section and
// the standalone `builder simulate` command.
// ─────────────────────────────────────────────────────────────────────────────

export interface SimulateResultLike {
  success: boolean;
  valid?: boolean;
  gasUsed?: string;
  parsedEvents?: any;
  netChanges?: any;
  /** Raw Cosmos SDK simulation events. Contains approvalChange entries the
   *  parsedEvents stream doesn't capture — high-value for agents reviewing
   *  which approvals will exist on the collection after the tx executes. */
  events?: any[];
  simulationError?: string;
  error?: string;
}

/**
 * Render a simulation result. Three states:
 *   - hard error (no API key, network failure, etc.) → red error block
 *   - valid: false (chain rejected the tx) → red CHAIN-REJECTED block + reason
 *   - valid: true → green check + gasUsed + per-address net change diff
 *
 * @param opts.events When `'full'` (or true), pretty-prints the entire raw
 *   chain events array under a "Raw events" section. Default `'count'`
 *   only shows the total event count (much shorter — the full dump is
 *   typically 2000+ lines for a Create+Mint).
 */
export function renderSimulate(
  result: SimulateResultLike,
  opts?: {
    stream?: NodeJS.WriteStream;
    title?: string;
    events?: 'count' | 'full' | boolean;
    /**
     * Optional pre-fetched collection metadata keyed by collectionId.
     * Populated by `prefetchSimulateCollections` in the CLI call sites —
     * used to suffix balance lines with their alias/wrapper symbol when
     * the balance shape cleanly maps to a path on the collection. When
     * omitted, balance lines render exactly as before.
     */
    collectionCache?: Map<string, SimulateRenderCollection>;
  }
): string {
  const stream = opts?.stream || process.stderr;
  const { c } = makeColor(stream);
  const eventMode: 'count' | 'full' =
    opts?.events === true || opts?.events === 'full' ? 'full' : 'count';
  const width = Math.min(80, (stream as any).columns || 80);
  const title = opts?.title || 'Simulate';

  const lines: string[] = [];
  lines.push(c('gray', rule('━', width, title)));
  lines.push('');

  if (!result.success) {
    lines.push(`  ${c('red', '■')} ${c('bold', c('red', 'ERROR    '))}  ${result.error || 'Unknown simulation failure'}`);
    lines.push('');
    lines.push(c('gray', rule('━', width)));
    return lines.join('\n');
  }

  if (result.valid === false) {
    lines.push(`  ${c('red', '■')} ${c('bold', c('red', 'REJECTED '))}  ${c('dim', 'chain rejected the tx during simulation')}`);
    if (result.simulationError) {
      for (const t of wrap(result.simulationError, width - 6)) {
        lines.push(`      ${t}`);
      }
    }
    lines.push('');
    lines.push(c('gray', rule('━', width)));
    return lines.join('\n');
  }

  // Valid path — show gas + net changes
  lines.push(
    `  ${c('green', '✓')} ${c('bold', c('green', 'VALID    '))}  ${c('dim', 'gas used:')} ${c('bold', result.gasUsed || 'unknown')}`
  );

  // Net changes summary — coin + badge per address
  const net: any = result.netChanges || {};
  const coinChanges: Record<string, Record<string, string>> = net.coinChanges || {};
  const badgeChanges: Record<string, Record<string, any>> = net.badgeChanges || {};
  const allAddresses = new Set<string>([...Object.keys(coinChanges), ...Object.keys(badgeChanges)]);

  // Known chain-module addresses — surface them with a human label so a
  // reader doesn't have to grep the addr set. Covers the Cosmos fee
  // collector (both bb1 and cosmos prefixes) and our two string-keyed
  // synthetic buckets populated by calculateNetChanges().
  const WELL_KNOWN_ADDR_LABELS: Record<string, string> = {
    bb17xpfvakm2amg962yls6f84z3kell8c5lnytnhv: 'Fee Collector',
    cosmos17xpfvakm2amg962yls6f84z3kell8c5lserqta: 'Fee Collector',
    'Network Fee': 'Network Fee',
    'Protocol Fee': 'Protocol Fee',
    'IBC Transfer': 'IBC Transfer'
  };

  if (allAddresses.size > 0) {
    lines.push('');
    lines.push(`  ${c('bold', 'Net changes')}`);
    for (const addr of Array.from(allAddresses).sort()) {
      const label = WELL_KNOWN_ADDR_LABELS[addr];
      const display = label ? `${label} (${addr})` : addr;
      lines.push(`    ${c('dim', display)}`);
      const coins = coinChanges[addr] || {};
      for (const [denom, amount] of Object.entries(coins)) {
        const sign = String(amount).startsWith('-') ? c('red', String(amount)) : c('green', '+' + amount);
        const suffix = coinSuffix(amount, denom, c);
        lines.push(`      ${c('dim', '·')} ${sign} ${denom}${suffix}`);
      }
      const tokens = badgeChanges[addr] || {};
      for (const [collectionId, balance] of Object.entries(tokens)) {
        // Full BalanceArray JSON — agents consume it directly, no
        // truncation. Colorize the `"amount":"<n>"` field in-place so
        // a reader can spot the sign at a glance without losing the
        // raw JSON structure. Injected color escapes don't get wiped
        // by an outer dim wrapper because we emit the JSON un-dimmed.
        const json = JSON.stringify(balance);
        const colorized = colorizeAmountsInJson(json, c);
        const col = opts?.collectionCache?.get(String(collectionId));
        const alias = detectBalanceAliasSymbol(balance, col);
        let suffix = '';
        if (alias) {
          const human = formatHumanAmount(alias.amount, alias.decimals);
          suffix = ' ' + c('dim', `(${human} ${alias.symbol})`);
        }
        lines.push(
          `      ${c('dim', '·')} collection ${collectionId}: ${colorized}${suffix}`
        );
      }
    }
  } else {
    lines.push('');
    lines.push(`  ${c('dim', 'No net balance changes detected.')}`);
  }

  // ── Approval changes ────────────────────────────────────────────────
  // The chain emits one `approvalChange` event per approval mutation
  // (created / updated / deleted). Most useful piece of an agent-facing
  // simulate output — it tells them exactly which approvals will exist
  // on the collection after the tx executes, BEFORE they broadcast.
  // Walked from raw events instead of parsedEvents because
  // parseSimulationEvents doesn't handle this event type.
  const events: any[] = Array.isArray(result.events) ? result.events : [];
  const approvalEvents = events.filter((e) => e?.type === 'approvalChange');
  if (approvalEvents.length > 0) {
    lines.push('');
    lines.push(`  ${c('bold', 'Approval changes')} ${c('dim', `(${approvalEvents.length})`)}`);
    for (const ev of approvalEvents) {
      const attrs: Record<string, string> = {};
      for (const a of ev.attributes || []) attrs[a.key] = a.value;
      const action = attrs.action || 'changed';
      const id = attrs.approvalId || '?';
      const level = attrs.approvalLevel || '?';
      const collId = attrs.collectionId || '?';
      const approver = attrs.approverAddress ? ` by ${attrs.approverAddress}` : '';
      const actionColor: 'green' | 'yellow' | 'red' =
        action === 'created' ? 'green' : action === 'deleted' ? 'red' : 'yellow';
      lines.push(
        `    ${c(actionColor, '●')} ${c('bold', action)} ${c('dim', `[${level}]`)} ${id} ${c('dim', `on collection ${collId}${approver}`)}`
      );
    }
  }

  // ── Parsed transfer events ──────────────────────────────────────────
  // Individual coin / badge / IBC transfers extracted from raw events.
  // These complement the per-address Net changes summary by showing
  // each leg of a multi-hop transfer, so agents can spot unexpected
  // intermediate hops (e.g. a fee splitter routing through a third
  // address).
  const parsed: any = result.parsedEvents || {};
  const coinXfers: any[] = Array.isArray(parsed.coinTransferEvents) ? parsed.coinTransferEvents : [];
  const badgeXfers: any[] = Array.isArray(parsed.badgeTransferEvents) ? parsed.badgeTransferEvents : [];
  const ibcXfers: any[] = Array.isArray(parsed.ibcTransferEvents) ? parsed.ibcTransferEvents : [];
  const totalXfers = coinXfers.length + badgeXfers.length + ibcXfers.length;
  if (totalXfers > 0) {
    lines.push('');
    lines.push(`  ${c('bold', 'Transfers')} ${c('dim', `(${totalXfers})`)}`);
    for (const t of coinXfers) {
      const from = t.from || '';
      const to = t.to || '';
      const amtStr = String(t.amount);
      const amt = amtStr.startsWith('-') ? c('red', amtStr) : c('green', '+' + amtStr);
      const symSuffix = coinSuffix(amtStr, t.denom, c);
      lines.push(`    ${c('dim', '→')} ICS20 ${c('bold', amt)} ${t.denom}${symSuffix} ${c('dim', `${from} → ${to}`)}`);
    }
    for (const t of badgeXfers) {
      const from = t.from || '';
      const to = t.to || '';
      // Token transfer events carry a `balances` array, NOT a flat
      // `amount`. Render the raw balances JSON so agents get the full
      // (amount, tokenIds, ownershipTimes) tuple without lossy
      // reformatting. Amounts inside the JSON are in-place colorized.
      const json = Array.isArray(t.balances) ? JSON.stringify(t.balances) : '[]';
      const colorized = colorizeAmountsInJson(json, c);
      const col = opts?.collectionCache?.get(String(t.collectionId));
      const alias = detectBalanceAliasSymbol(t.balances, col);
      let aliasSuffix = '';
      if (alias) {
        const human = formatHumanAmount(alias.amount, alias.decimals);
        aliasSuffix = ' ' + c('dim', `(${human} ${alias.symbol})`);
      }
      lines.push(
        `    ${c('dim', '→')} token collection ${t.collectionId} ${colorized}${aliasSuffix} ${c('dim', `${from} → ${to}`)}`
      );
    }
    for (const t of ibcXfers) {
      const amtStr = String(t.amount);
      const amt = amtStr.startsWith('-') ? c('red', amtStr) : c('green', '+' + amtStr);
      const symSuffix = coinSuffix(amtStr, t.denom, c);
      lines.push(`    ${c('dim', '→')} ibc ${c('bold', amt)} ${t.denom}${symSuffix} via ${t.sourceChannel || '?'}`);
    }
  }

  // ── Raw events ──────────────────────────────────────────────────────
  // By default we just print the count (helps sanity-check that the
  // chain actually executed something — a successful tx with 0 events
  // almost always means a no-op). With `--events` (eventMode='full'),
  // pretty-print the entire array. Useful for debugging chain hooks,
  // approval matchers, IBC flows, etc.
  if (events.length > 0) {
    if (eventMode === 'full') {
      lines.push('');
      lines.push(`  ${c('bold', 'Raw events')} ${c('dim', `(${events.length})`)}`);
      // Pretty-print as JSON, indented 4 spaces so it lines up with
      // the rest of the section. Strip terminal-color ANSI from inside
      // the JSON if any.
      const json = JSON.stringify(events, null, 2);
      for (const line of json.split('\n')) {
        lines.push(`    ${line}`);
      }
    } else {
      lines.push('');
      lines.push(`  ${c('dim', `${events.length} chain events emitted total — re-run with --events to dump the full array`)}`);
    }
  }

  lines.push('');
  lines.push(c('gray', rule('━', width)));
  return lines.join('\n');
}

/**
 * Render the Metadata To Upload section. `filled` is a sidecar map (usually
 * `data.value?._meta?.metadataPlaceholders`) keyed by placeholder URI — entries
 * present in the map are rendered as PROVIDED, others as NEEDED.
 */
export function renderMetadataPlaceholders(
  placeholders: MetadataPlaceholderEntry[],
  filled?: PlaceholderSidecar,
  opts?: { stream?: NodeJS.WriteStream; title?: string }
): string {
  const stream = opts?.stream || process.stderr;
  const { c } = makeColor(stream);
  const width = Math.min(80, (stream as any).columns || 80);

  const lines: string[] = [];
  lines.push(c('gray', rule('━', width, opts?.title || 'Metadata To Upload')));
  lines.push('');

  const totalMissing = placeholders.filter((p) => !filled || !filled[p.uri]).length;
  const totalProvided = placeholders.length - totalMissing;

  for (const p of placeholders) {
    const supplied = filled?.[p.uri];
    const badge = supplied
      ? `${c('green', '✓')} ${c('bold', c('green', 'PROVIDED '))}`
      : `${c('yellow', '●')} ${c('bold', c('yellow', 'NEEDED   '))}`;
    lines.push(`  ${badge}  ${c('dim', p.uri)}`);
    lines.push(`      ${c('bold', p.kind)} — referenced by ${c('dim', p.location)}`);
    if (supplied) {
      const supplyBits: string[] = [];
      if (supplied.name) supplyBits.push(`name: "${supplied.name}"`);
      if (supplied.description) supplyBits.push(`description: "${supplied.description}"`);
      if (supplied.image) supplyBits.push(`image: ${supplied.image}`);
      if (supplyBits.length) lines.push(`      ${c('gray', '→')} ${supplyBits.join('  ')}`);
    } else {
      lines.push(`      ${c('gray', '→')} fields: ${p.fields.join(', ')}`);
    }
    lines.push('');
  }

  lines.push(c('gray', rule('━', width)));
  const summaryParts = [
    totalMissing > 0 ? c('yellow', `${totalMissing} needed`) : c('gray', `${totalMissing} needed`),
    totalProvided > 0 ? c('green', `${totalProvided} provided`) : c('gray', `${totalProvided} provided`)
  ];
  lines.push(`  ${c('bold', 'Summary')}  ${summaryParts.join('  ·  ')}`);
  lines.push(
    c(
      'dim',
      '  Upload each Needed entry as off-chain JSON (name, description, image) and\n' +
        '  substitute the placeholder URI with the real upload URI before broadcast.'
    )
  );
  lines.push(c('gray', rule('━', width)));
  return lines.join('\n');
}
