/**
 * Unified review types — kept in a standalone file so the review-ux check
 * modules can import types without creating a circular dependency with
 * `review.ts` (which imports the check modules at runtime).
 */

export type Severity = 'critical' | 'warning' | 'info';
export type FindingSource = 'audit' | 'standards' | 'ux';

/**
 * Who is this finding meant for?
 *
 * - `'agent'`  — produced by tooling that agents already consume
 *                (`review_collection`, `validate_transaction`). The
 *                frontend review sidebar filters these out because the
 *                human user doesn't need to see the same issues the
 *                agent already handled during construction.
 * - `'human'`  — surfaced in the frontend review sidebar. These come
 *                from the ported UX checks in `review-ux/*.ts` that the
 *                frontend used to run inline pre-port.
 * - `'both'`   — shown to both audiences. Standards violations default
 *                to this because they block broadcast and are relevant
 *                for both agents and humans.
 */
export type FindingAudience = 'agent' | 'human' | 'both';

export interface Finding {
  code: string;
  severity: Severity;
  source: FindingSource;
  /**
   * Target audience for this finding. Optional on the raw emit; the
   * `reviewCollection` aggregator fills in a default per-source
   * (`audit` → `'agent'`, `standards` → `'both'`, `ux` → `'human'`) so
   * individual checks don't have to set it. A check CAN override by
   * setting an explicit audience at emit time.
   */
  audience?: FindingAudience;
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
  /**
   * Prior on-chain collection state. Required for diff checks
   * (deleted approvals, tracker-id changes, claim plugin diffs) and
   * for update-only suppressions (e.g., auto_approve_disabled_on_mintable
   * skips on updates because defaultBalances is immutable post-create).
   * Everything else runs purely on the proposed collection's structure.
   */
  onChainCollection?: unknown;
  skipSources?: FindingSource[];
  /**
   * Filter findings by audience after aggregation. When set, any
   * finding whose audience doesn't match is dropped from the result.
   * The frontend review sidebar passes `'human'` to hide
   * agent-oriented audit output; MCP/CLI callers leave this unset so
   * they see everything.
   */
  audienceFilter?: FindingAudience;
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
