/**
 * Design decisions — informational ✓/✗ checks that answer the inverse of
 * the review-item question: "what IS this collection?" instead of
 * "what might need attention?"
 *
 * Checks are pure functions over a normalized collection value. They
 * never throw (individual failures are swallowed so one broken check
 * cannot kill the whole output). They must add insight — a check that
 * only restates something trivially readable from the raw JSON
 * (e.g. "has standard X in standards[]") is not a design decision.
 *
 * The result is `DesignDecisionsResult` with a summary. A separate
 * array on `BuildResult` keeps this distinct from the actionable
 * `findings[]` surface, which has severity + fix semantics that don't
 * fit informational checks.
 */

import type { DesignDecision, DesignDecisionsResult } from '../review-types.js';
import { standardsDecisions } from './standards.js';
import { metadataDecisions } from './metadata.js';
import { supplyDecisions } from './supply.js';
import { transferabilityDecisions } from './transferability.js';
import { backingDecisions } from './backing.js';
import { normalizeForReview } from '../review-normalize.js';

export type DesignCheck = (collection: any) => DesignDecision[];

const ALL_CHECKS: DesignCheck[] = [
  standardsDecisions,
  metadataDecisions,
  supplyDecisions,
  transferabilityDecisions,
  backingDecisions
];

export function runDesignChecks(collection: unknown): DesignDecisionsResult {
  const value = normalizeForReview(collection);
  const decisions: DesignDecision[] = [];

  for (const check of ALL_CHECKS) {
    try {
      const out = check(value);
      if (out?.length) decisions.push(...out);
    } catch {
      // Individual check failure must not kill the whole run.
    }
  }

  let pass = 0;
  let fail = 0;
  let na = 0;
  for (const d of decisions) {
    if (d.status === 'pass') pass++;
    else if (d.status === 'fail') fail++;
    else na++;
  }

  return { decisions, summary: { pass, fail, na } };
}

export { standardsDecisions, metadataDecisions, supplyDecisions, transferabilityDecisions, backingDecisions };
