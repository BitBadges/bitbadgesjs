/**
 * Tool: review_collection
 * Unified deterministic review — combines audit + standards + UX checks into a
 * single ReviewResult. Prefer this over audit_collection / verify_standards.
 *
 * Logic delegated to bitbadgesjs-sdk's reviewCollection().
 */

import { reviewCollection, type ReviewResult, type ReviewContext, type FindingSource } from '../../../core/review.js';

export const reviewCollectionTool = {
  name: 'review_collection',
  description:
    'Run the unified deterministic review on a collection transaction or on-chain collection. Returns audit + standards + UX findings merged into one ReviewResult with a single verdict. Accepts an optional context (selectedSkills, appliedStandards, onChainCollection, skipSources).',
  inputSchema: {
    type: 'object' as const,
    properties: {
      collection: {
        type: 'object',
        description:
          'The collection to review. Accepts a MsgUniversalUpdateCollection message, its value field, a transaction { messages: [...] }, or a raw on-chain collection object.'
      },
      context: {
        type: 'object',
        description:
          'Optional review context. Fields: selectedSkills (string[]), appliedStandards (string[]), onChainCollection (object, for diff checks), skipSources (array of "audit" | "standards" | "ux").'
      }
    },
    required: ['collection']
  }
};

export function handleReviewCollection(input: {
  collection: Record<string, unknown>;
  context?: ReviewContext;
}): ReviewResult {
  return reviewCollection(input.collection, input.context);
}

// ---------------------------------------------------------------------------
// Deprecated shims — existing audit_collection / verify_standards builder tools
// are kept working by routing through reviewCollection with skipSources.
// These helpers are exposed for the registry to mark the tool descriptions
// deprecated while preserving return shapes for one release.
// ---------------------------------------------------------------------------

export function auditOnly(collection: any, context?: string) {
  const result = reviewCollection(collection, { skipSources: ['standards', 'ux'] as FindingSource[] });
  return {
    success: result.summary.verdict !== 'fail',
    findings: result.findings.map((f) => ({
      severity: f.severity,
      category: f.category,
      title: f.messageEn,
      detail: f.messageEn,
      recommendation: f.recommendationEn || ''
    })),
    summary: result.summary,
    permissionSummary: {},
    approvalSummary: [],
    _deprecated: 'Use review_collection instead.',
    _context: context
  };
}

export function verifyStandardsOnly(collection: any) {
  const result = reviewCollection(collection, { skipSources: ['audit', 'ux'] as FindingSource[] });
  return {
    valid: result.summary.critical === 0,
    violations: result.findings.map((f) => ({
      standard: f.category.replace(/^standards:/, ''),
      field: f.code,
      message: f.messageEn,
      fix: f.recommendationEn
    })),
    standardsChecked: [],
    _deprecated: 'Use review_collection instead.'
  };
}
