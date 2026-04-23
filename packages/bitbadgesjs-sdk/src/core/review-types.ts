/**
 * Unified review types — kept in a standalone file so the review-ux check
 * modules can import types without creating a circular dependency with
 * `review.ts` (which imports the check modules at runtime).
 */

export type Severity = 'critical' | 'warning' | 'info';
export type FindingSource = 'audit' | 'standards' | 'ux';

/**
 * Localized string bag. `en` is always populated. Additional language
 * codes (e.g. `es`) are optional — consumers should fall back to `en`
 * when the user's preferred language is missing.
 *
 * Strings are pre-interpolated at finding-creation time. There is no
 * runtime template substitution — if a check needs to inject a name or
 * count, it builds the string inline via template literals.
 */
export interface Localized {
  en: string;
  [lang: string]: string | undefined;
}

/**
 * A single review finding. All three text fields (`title`, `detail`,
 * `recommendation`) are required. Info-severity items whose recommendation
 * is a no-op should still populate it with something like
 * "No action required — surfaced for visibility."
 */
export interface Finding {
  /** Stable machine identifier, e.g. `review.ux.forceful_transfers_allowed`. */
  code: string;
  severity: Severity;
  source: FindingSource;
  /** Free-form grouping label (e.g. `approvals`, `metadata`, `diff`). */
  category: string;
  /** Short label shown as the finding's headline. */
  title: Localized;
  /** Full explanation — the "why it matters" paragraph. */
  detail: Localized;
  /** How to fix it. Always populated. */
  recommendation: Localized;
  /**
   * Agent-only escape hatch. When `true`, the finding is hidden from
   * human consumers (frontend sidebar) but surfaced to agents
   * (CLI / indexer / MCP). Default is `false` / absent — everyone sees
   * the finding. Use sparingly for items that are genuinely
   * agent-internal (e.g. meta-level tool feedback).
   */
  agentOnly?: boolean;
}

export interface ReviewContext {
  /**
   * Prior on-chain collection state. Required for diff checks
   * (deleted approvals, tracker-id changes, claim plugin diffs) and
   * for update-only suppressions. Everything else runs purely on the
   * proposed collection's structure.
   */
  onChainCollection?: unknown;
  /**
   * Skip whole finding families by source. Frontend humans can pass
   * `['audit']` to hide design-noise, but the default is to show
   * everything. Agents typically omit this entirely.
   */
  skipSources?: FindingSource[];
  /**
   * When `true`, drop findings tagged `agentOnly: true`. Frontend
   * human consumers set this. CLI / indexer / MCP callers leave it
   * unset (agents see everything).
   */
  hideAgentOnly?: boolean;
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

/**
 * Informational property of the collection. Unlike a `Finding`, a decision
 * has no severity and asks for no action — it answers the inverse question:
 * "what did this collection end up being?"
 *
 * Three states:
 *   - `pass`  — the collection has the property (e.g. "follows the Subscription protocol end-to-end")
 *   - `fail`  — the collection explicitly does not have the property (e.g. "is NOT non-transferable")
 *   - `n/a`   — the property is not applicable to this collection (e.g. backing check on a non-backed token)
 *
 * Checks must encode a cross-field invariant or a cross-standard conformance
 * judgment. Restating something trivially readable from the raw JSON
 * (e.g. "has 'Subscriptions' in standards[]") is not a design decision.
 */
export type DesignDecisionStatus = 'pass' | 'fail' | 'n/a';

export interface DesignDecision {
  /** Stable machine identifier, e.g. `design.standards.subscription`. */
  code: string;
  /** Free-form grouping label — `standards`, `metadata`, `supply`, `transferability`, `permissions`, `backing`, etc. */
  category: string;
  /** Headline, e.g. "Follows the Subscription protocol". */
  title: Localized;
  /** Short "what this means" paragraph. */
  detail: Localized;
  status: DesignDecisionStatus;
  /** Optional human-readable proof of the verdict, e.g. "Supply cap 500, mint approval has usesPerAddress 1". */
  evidence?: string;
}

export interface DesignDecisionsResult {
  decisions: DesignDecision[];
  summary: {
    pass: number;
    fail: number;
    na: number;
  };
}
