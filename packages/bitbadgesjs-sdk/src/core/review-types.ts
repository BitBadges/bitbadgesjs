/**
 * Unified review types — kept in a standalone file so the review-ux check
 * modules can import types without creating a circular dependency with
 * `review.ts` (which imports the check modules at runtime).
 */

export type Severity = 'critical' | 'warning' | 'info';
export type FindingSource = 'audit' | 'standards' | 'ux';

export interface Finding {
  code: string;
  severity: Severity;
  source: FindingSource;
  category: string;
  params?: Record<string, string | number | boolean>;
  messageEn: string;
  /**
   * Optional second-line detail. Frontend adapters render this in the
   * `detail` slot below `messageEn`. Audit findings populate it from the
   * legacy `f.detail` field; UX checks generally leave it empty (their
   * `messageEn` is already self-contained).
   */
  detailEn?: string;
  recommendationEn?: string;
  /**
   * Optional stable key into the frontend locale file. When set, frontend
   * adapters should prefer `t(localeKey + '_title' / '_detail' / '_fix')`
   * over `messageEn` / `recommendationEn`. Format: `review_<snake_case>`.
   * Used for legacy parity with the pre-SDK frontend review items.
   */
  localeKey?: string;
  /**
   * Escape hatch when the three legacy locale keys for a finding don't share
   * a common `_title` / `_detail` / `_fix` base (e.g. the old Forceful /
   * Claims items which mix custom keys). If any of these is set, the adapter
   * uses it directly and ignores the derived `localeKey` variant for that
   * slot. `messageEn` / `recommendationEn` remain the final fallback.
   */
  localeKeyTitle?: string;
  localeKeyDetail?: string;
  localeKeyFix?: string;
}

export interface ReviewContext {
  selectedSkills?: string[];
  appliedStandards?: string[];
  onChainCollection?: unknown;
  skipSources?: FindingSource[];
}

export interface ReviewResult {
  findings: Finding[];
  summary: {
    critical: number;
    warning: number;
    info: number;
    verdict: 'pass' | 'warn' | 'fail';
  };
}
