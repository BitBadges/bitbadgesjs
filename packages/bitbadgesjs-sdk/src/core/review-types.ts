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
  recommendationEn?: string;
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
