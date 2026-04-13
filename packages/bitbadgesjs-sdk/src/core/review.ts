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
 * All three are lifted into a single {@link Finding} shape with a stable
 * machine `code` (public API) and a hardcoded English message. Callers that
 * want localization can map `code` → `t(code)` and fall back to `messageEn`.
 *
 * The legacy `auditCollection` and `verifyStandardsCompliance` functions are
 * untouched — they keep working identically for direct callers.
 */

import { auditCollection, type AuditFinding, type AuditSeverity } from './audit.js';
import { verifyStandardsCompliance, type StandardViolation } from './verify-standards.js';
import { runUxChecks } from './review-ux/index.js';
import type { Finding, FindingAudience, FindingSource, ReviewContext, ReviewResult, Severity } from './review-types.js';

// Re-export the types so `reviewCollection` + types are importable from one entry.
export type { Finding, FindingAudience, FindingSource, ReviewContext, ReviewResult, Severity } from './review-types.js';

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
    // Audit findings are consumed by agents via MCP audit_collection /
    // validate / review — the frontend sidebar filters them out by
    // default so humans don't see the same issues the agent already
    // handled during construction.
    audience: 'agent',
    category: f.category,
    // Title and detail kept SEPARATE — the frontend adapter used to
    // render `messageEn` in both the title and detail slots, which
    // produced visible duplicate lines when the legacy joined-format
    // ("title — detail") was returned. Splitting them lets the adapter
    // populate the title and detail slots independently.
    messageEn: f.title,
    detailEn: f.detail,
    recommendationEn: f.recommendation
  };
}

export function fromStandardsFinding(v: StandardViolation): Finding {
  const codeSuffix = snakeCase(v.standard || 'standard') + '.' + snakeCase(v.field || 'field');
  return {
    code: 'review.standards.' + codeSuffix,
    severity: 'critical',
    source: 'standards',
    // Standards violations block broadcast so both agent and human
    // callers need to see them.
    audience: 'both',
    category: 'standards:' + v.standard,
    messageEn: v.message,
    recommendationEn: v.fix
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function reviewCollection(collection: unknown, context?: ReviewContext): ReviewResult {
  const ctx: ReviewContext = context || {};
  const skip = new Set<FindingSource>(ctx.skipSources || []);
  const value = extractCollectionValue(collection);

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
      const std = verifyStandardsCompliance(collection);
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

  // Audience filter — applied after dedup so both sources get a fair
  // chance at winning the first-occurrence race, then we drop what the
  // caller doesn't care about. `'both'` findings always pass.
  // Fill in the default audience per source for any finding that didn't
  // set one explicitly. `audit` → agent, `standards` → both, `ux` → human.
  const withAudience: Finding[] = deduped.map((f) =>
    f.audience
      ? f
      : {
          ...f,
          audience: f.source === 'audit' ? 'agent' : f.source === 'standards' ? 'both' : 'human'
        }
  );

  const audienceFilter = ctx.audienceFilter;
  const filtered = audienceFilter
    ? withAudience.filter((f) => f.audience === audienceFilter || f.audience === 'both')
    : withAudience;

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
