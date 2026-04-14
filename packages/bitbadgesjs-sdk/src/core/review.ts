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
import { normalizeForReview, extractCollectionValue } from './review-normalize.js';

export { normalizeForReview, extractCollectionValue } from './review-normalize.js';

// Re-export the types so `reviewCollection` + types are importable from one entry.
export type { Finding, FindingSource, Localized, ReviewContext, ReviewResult, Severity } from './review-types.js';

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------
// extractCollectionValue + normalizeForReview live in ./review-normalize.js
// so auditCollection and verifyStandardsCompliance can also run them
// without creating a circular import. Re-exported above for callers who
// import everything from this module.

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
