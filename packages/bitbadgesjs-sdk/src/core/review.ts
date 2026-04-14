/**
 * Unified deterministic review for collections.
 *
 * `reviewCollection(collection, context)` is the one source of truth that
 * composes three existing check families:
 *
 *   1. `auditCollection()` — security/permission audit (src/core/audit.ts)
 *   2. `verifyStandardsCompliance()` — protocol conformance (src/core/verify-standards.ts)
 *   3. `runUxChecks()` — the ported frontend UX checks (src/core/review-ux/*)
 *
 * All three are normalized into a single {@link Finding} shape with a
 * stable machine `code`, a severity, and three required localized strings
 * (`title`, `detail`, `recommendation`). Localization lives inline in the
 * finding — callers never need to look up locale keys externally.
 *
 * The legacy `auditCollection` and `verifyStandardsCompliance` functions are
 * untouched — they keep working identically for direct callers.
 */

import { auditCollection, type AuditFinding, type AuditSeverity } from './audit.js';
import { verifyStandardsCompliance, type StandardViolation } from './verify-standards.js';
import { runUxChecks } from './review-ux/index.js';
import type { Finding, FindingSource, Localized, ReviewContext, ReviewResult, Severity } from './review-types.js';

// Re-export the types so `reviewCollection` + types are importable from one entry.
export type { Finding, FindingSource, Localized, ReviewContext, ReviewResult, Severity } from './review-types.js';

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

/**
 * Unwrap any of: transaction (`{ messages: [...] }`), raw message
 * (`{ typeUrl, value }`), or a bare collection value object. Ported from
 * the frontend `extractValue` helper in `reviewItems.ts`.
 */
export function extractCollectionValue(input: unknown): any {
  if (!input || typeof input !== 'object') return input;
  const obj = input as any;
  const messages = obj.messages || (Array.isArray(obj) ? obj : undefined);
  if (messages && Array.isArray(messages) && messages.length > 0) {
    const msg = messages[0];
    return msg?.value || msg || input;
  }
  if (obj.value && typeof obj.value === 'object') return obj.value;
  return obj;
}

/**
 * Deep-normalize a collection value for the review pipeline. Runs once at
 * the top of reviewCollection() so every downstream check can assume:
 *
 * - Numeric-like fields (bigint, number) are strings. audit / verify-standards
 *   / review-ux internals compare against string literals ('0', '1',
 *   MAX_UINT64) — this converts all three input types to that canonical
 *   form in one pass.
 * - Alias paths are present under BOTH `aliasPaths` and `aliasPathsToAdd`,
 *   so checks can look up either field without tolerating shape mismatch
 *   at every call site. Covers the difference between Msg create shape
 *   (`aliasPathsToAdd`) and frontend WIP / on-chain hydrated shape
 *   (`aliasPaths`).
 *
 * The walk is non-mutating — we return a fresh object tree, leaving the
 * caller's input untouched.
 */
function stringifyNumbers(input: any): any {
  if (input === null || input === undefined) return input;
  const t = typeof input;
  if (t === 'bigint') return input.toString();
  // Numbers are normalized to strings too, for consistency. Booleans and
  // regular strings pass through unchanged.
  if (t === 'number') return Number.isFinite(input) ? String(input) : input;
  if (t !== 'object') return input;
  if (Array.isArray(input)) return input.map(stringifyNumbers);
  const out: Record<string, any> = {};
  for (const k of Object.keys(input)) out[k] = stringifyNumbers(input[k]);
  return out;
}

export function normalizeForReview(input: unknown): any {
  const raw = extractCollectionValue(input);
  if (!raw || typeof raw !== 'object') return raw;
  const value = stringifyNumbers(raw);
  // Alias path field mirroring: whichever one the caller populated, make
  // both available so downstream checks don't need to dual-read.
  if (value.aliasPaths && !value.aliasPathsToAdd) value.aliasPathsToAdd = value.aliasPaths;
  if (value.aliasPathsToAdd && !value.aliasPaths) value.aliasPaths = value.aliasPathsToAdd;
  return value;
}

/**
 * Wrap a plain English string as a `Localized` bag. Used by adapters
 * that inherit legacy single-language content from audit / standards
 * internal shapes.
 */
function en(s: string): Localized {
  return { en: s };
}

// ---------------------------------------------------------------------------
// Adapters from legacy finding shapes to unified Finding
// ---------------------------------------------------------------------------

function snakeCase(s: string): string {
  return s
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function mapAuditSeverity(s: AuditSeverity): Severity {
  return s; // identical set
}

export function fromAuditFinding(f: AuditFinding): Finding {
  const codeSuffix = snakeCase(f.category || 'finding') + '.' + snakeCase(f.title || 'item');
  return {
    code: 'review.audit.' + codeSuffix,
    severity: mapAuditSeverity(f.severity),
    source: 'audit',
    category: f.category,
    title: en(f.title),
    detail: en(f.detail),
    recommendation: en(f.recommendation || 'No action required — surfaced for visibility.'),
    ...(f.agentOnly ? { agentOnly: true } : {})
  };
}

export function fromStandardsFinding(v: StandardViolation): Finding {
  const codeSuffix = snakeCase(v.standard || 'standard') + '.' + snakeCase(v.field || 'field');
  const title = `${v.standard} standard violation: ${v.field}`;
  return {
    code: 'review.standards.' + codeSuffix,
    severity: 'critical',
    source: 'standards',
    category: 'standards:' + v.standard,
    title: en(title),
    detail: en(v.message),
    recommendation: en(v.fix || 'No action required — surfaced for visibility.')
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function reviewCollection(collection: unknown, context?: ReviewContext): ReviewResult {
  const ctx: ReviewContext = context || {};
  const skip = new Set<FindingSource>(ctx.skipSources || []);
  // Single normalization pass: bigint/number → string, alias path mirror.
  // Every downstream check sees a canonical shape.
  const value = normalizeForReview(collection);

  const findings: Finding[] = [];

  if (!skip.has('audit')) {
    try {
      const audit = auditCollection({ collection: value as Record<string, unknown> });
      for (const f of audit.findings || []) findings.push(fromAuditFinding(f));
    } catch {
      // auditCollection is defensive; swallow errors to keep review resilient
    }
  }

  if (!skip.has('standards')) {
    try {
      const std = verifyStandardsCompliance(value);
      for (const v of std.violations || []) findings.push(fromStandardsFinding(v));
    } catch {
      // standards may not apply
    }
  }

  if (!skip.has('ux')) {
    try {
      const ux = runUxChecks(value, ctx);
      for (const f of ux) findings.push(f);
    } catch {
      // UX checks are pure; any throw is a bug, but don't kill the review
    }
  }

  // Dedupe by code (keep the first occurrence — usually the most specific).
  const seen = new Set<string>();
  const deduped: Finding[] = [];
  for (const f of findings) {
    if (seen.has(f.code)) continue;
    seen.add(f.code);
    deduped.push(f);
  }

  // Drop agent-only findings when the caller opted in via hideAgentOnly.
  // Frontend humans set this. CLI / indexer / MCP leave it unset.
  const filtered = ctx.hideAgentOnly ? deduped.filter((f) => !f.agentOnly) : deduped;

  let critical = 0;
  let warning = 0;
  let info = 0;
  for (const f of filtered) {
    if (f.severity === 'critical') critical++;
    else if (f.severity === 'warning') warning++;
    else info++;
  }
  const verdict: 'pass' | 'warn' | 'fail' = critical > 0 ? 'fail' : warning > 0 ? 'warn' : 'pass';

  return {
    findings: filtered,
    summary: { critical, warning, info, verdict }
  };
}
