/**
 * Review UX check registry.
 *
 * `runUxChecks()` executes every ported frontend UX check and returns a flat
 * list of {@link Finding}s. Each check file exports an array of `UxCheck`
 * pure functions keyed by domain.
 */

import type { Finding, ReviewContext } from '../review-types.js';
import type { UxCheck } from './shared.js';
import { approvalsChecks } from './approvals.js';
import { metadataChecks } from './metadata.js';
import { permissionsChecks } from './permissions.js';
import { diffChecks } from './diff.js';
import { skillChecks } from './skills.js';
import { registriesChecks } from './registries.js';

const ALL_CHECKS: UxCheck[] = [
  ...approvalsChecks,
  ...metadataChecks,
  ...permissionsChecks,
  ...diffChecks,
  ...skillChecks,
  ...registriesChecks
];

export function runUxChecks(value: unknown, context: ReviewContext): Finding[] {
  const out: Finding[] = [];
  for (const check of ALL_CHECKS) {
    try {
      const res = check(value, context);
      if (res && res.length) out.push(...res);
    } catch {
      // Individual check failure must not kill the whole review
    }
  }
  return out;
}

export { approvalsChecks, metadataChecks, permissionsChecks, diffChecks, skillChecks, registriesChecks };
