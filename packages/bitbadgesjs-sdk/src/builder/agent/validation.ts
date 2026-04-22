/**
 * Validation gate + fix loop driver.
 *
 * Runs three checks in parallel on a composed transaction:
 *  1. Deterministic review (audit + standards + ux).
 *  2. Structural validation (SDK validator).
 *  3. Simulation (pluggable — indexer LCD call, or no-op default).
 *
 * Ported from bitbadges-indexer/src/routes/ai-builder/core/validationGate.ts.
 * Unlike the indexer version, the transaction is required as input — the
 * agent owns session state and passes it directly, avoiding circular deps
 * with session storage.
 */

import { handleValidateTransaction as builderValidateTransaction, handleReviewCollection } from '../tools/index.js';
import { isAdvisorySimulationError, parseSimulationError } from './simulationErrorPatterns.js';
import type { TransactionSimulator } from './types.js';

export interface SimulationResult {
  valid: boolean;
  gasUsed?: string;
  error?: string;
}

export type ValidationLogType = 'tool_call' | 'tool_result' | 'ai_text' | 'validation' | 'audit' | 'error' | 'info';

export interface ValidationLogEntry {
  type: ValidationLogType;
  label: string;
  data?: unknown;
}

export interface HardErrorCounts {
  validation: number;
  simulation: number;
  standards: number;
}

export interface LegacyAuditShape {
  findings: any[];
  summary: any;
  review: any;
}

export interface ValidationGateParams {
  /** The transaction to validate. */
  transaction: any;
  creatorAddress: string;
  /** Optional on-chain snapshot for diff-based review (update flow). */
  onChainSnapshot?: any;
  /** Optional simulator. If absent, simulation is skipped. */
  simulate?: TransactionSimulator;
  /** Propagates abort down to the simulator. */
  abortSignal?: AbortSignal;
  onLog?: (entry: ValidationLogEntry) => Promise<void> | void;
}

export interface ValidationGateResult {
  valid: boolean;
  validation: any;
  audit: LegacyAuditShape | null;
  simulation: SimulationResult | null;
  hardErrors: string[];
  advisoryNotes: string[];
  counts: HardErrorCounts;
}

export async function runValidationGate(params: ValidationGateParams): Promise<ValidationGateResult> {
  const { transaction, creatorAddress, onChainSnapshot, simulate, abortSignal, onLog } = params;
  if (onLog) await onLog({ type: 'info', label: 'Validation gate started' });

  const hardErrors: string[] = [];
  const counts: HardErrorCounts = { validation: 0, simulation: 0, standards: 0 };
  const advisoryNotes: string[] = [];

  // 1. Unified deterministic review
  let review: any = null;
  const wrapper = transaction?.messages?.[0] || transaction?.msgs?.[0];
  const msg = wrapper?.value || wrapper;
  if (!msg) {
    hardErrors.push('[validation] transaction has no messages to review');
    counts.validation++;
  } else {
    try {
      review = handleReviewCollection({
        collection: msg,
        context: onChainSnapshot ? { onChainCollection: onChainSnapshot } : undefined
      } as any);
    } catch (e: any) {
      const errMsg = e?.message || String(e);
      hardErrors.push(`[review] reviewCollection threw: ${errMsg}`);
      counts.validation++;
      if (onLog) await onLog({ type: 'error', label: 'Review threw', data: { error: errMsg } });
    }
  }

  // 2. Structural validation via the SDK validator
  let validation: any;
  try {
    validation = builderValidateTransaction({ transactionJson: JSON.stringify(transaction) } as any);
  } catch (e: any) {
    validation = { valid: false, issues: [{ severity: 'error', message: e.message }] };
  }
  for (const issue of validation.issues || []) {
    if (issue.severity !== 'error') continue;
    const path = issue.path ? `[${issue.path}] ` : '';
    hardErrors.push(`[validation] ${path}${issue.message}`);
    counts.validation++;
  }

  // 3. Simulation (pluggable)
  let simulation: SimulationResult | null = null;
  if (simulate) {
    try {
      simulation = await simulate(transaction, { creatorAddress, abortSignal });
    } catch (e: any) {
      simulation = { valid: false, error: e?.message || String(e) };
    }
    if (simulation && !simulation.valid && simulation.error) {
      const parsed = parseSimulationError(simulation.error);
      if (isAdvisorySimulationError(simulation.error)) {
        advisoryNotes.push(`[simulation] ${parsed}`);
      } else {
        hardErrors.push(`[simulation] ${parsed}`);
        counts.simulation++;
      }
    }
  }

  // 4. Standards findings → hard errors; audit + ux → advisory
  if (review) {
    for (const f of review.findings || []) {
      const titleEn = f.title?.en || '';
      const detailEn = f.detail?.en || '';
      const recEn = f.recommendation?.en || '';
      const fixHint = recEn ? ` Fix: ${recEn}` : '';
      const body = detailEn || titleEn;
      if (f.source === 'standards') {
        hardErrors.push(`[standards] [${f.category}] ${body}${fixHint}`);
        counts.standards++;
      } else if (f.source === 'ux' || f.source === 'audit') {
        advisoryNotes.push(`[${f.source}] [${f.severity}] [${f.category}] ${body}${fixHint}`);
      }
    }
  }

  const audit: LegacyAuditShape | null = review
    ? {
        findings: (review.findings || []).filter((f: any) => f.source === 'audit'),
        summary: review.summary,
        review
      }
    : null;

  const valid = hardErrors.length === 0;

  if (onLog) {
    await onLog({
      type: 'validation',
      label: valid ? 'Validation PASSED' : `Validation FAILED (${hardErrors.length} errors)`,
      data: {
        validation,
        simulation: simulation?.valid,
        counts,
        errors: valid ? undefined : hardErrors
      }
    });
  }

  return { valid, validation, audit, simulation, hardErrors, advisoryNotes, counts };
}
