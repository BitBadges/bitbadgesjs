import { Command } from 'commander';
import { addNetworkOptions } from '../utils/io.js';

/**
 * `check` is the unified analysis entry point — folds the old
 * `validate`, `review`, and `verify` verbs into one command with a
 * `--depth` dial:
 *
 *   --depth structural  → validateTransaction() only (was: validate)
 *   --depth review      → reviewCollection() only (was: review)
 *   --depth full        → validate + review + design + metadata + ANSI
 *                          render (was: verify; the default)
 *
 * Default is `full` because `verify` was the most useful single-shot
 * check — it covers structural correctness, design issues, and metadata
 * coverage in one pass. Explicit narrower depths exist for callers that
 * want a fast offline check (`structural`) or a design-only audit
 * (`review`).
 */

function ensureTxWrapper(input: any): any {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input.messages)) return input;
  if (typeof input.typeUrl === 'string' && input.value) return { messages: [input] };
  return input;
}

export const checkCommand = addNetworkOptions(
  new Command('check')
    .description('Analyze a built transaction or collection. Default: full check (validate + review + metadata). Use --depth to narrow scope.')
    .argument('<input>', 'Tx/collection JSON file path, inline JSON, numeric collection id, or "-" for stdin')
    .option('--depth <level>', 'Check depth: structural | review | full', 'full')
    .option('--strict', 'Exit 1 on warnings (criticals/errors always exit 2)')
    .option('--no-validate', 'Skip the structural validation section (full depth only)')
    .option('--no-review', 'Skip the design review section (full depth only)')
    .option('--no-metadata', 'Skip the metadata coverage section (full depth only)')
    .option('--design', 'Include the design decisions (informational ✓/✗) section in the envelope payload.')
    .option('--condensed', 'Single-line JSON (smaller pipe payload)', false)
    .option('--output-file <path>', 'Write the envelope to file instead of stdout')
).action(
  async (
    input: string,
    opts: {
      depth?: string;
      strict?: boolean;
      validate?: boolean;
      review?: boolean;
      metadata?: boolean;
      design?: boolean;
      network?: 'mainnet' | 'local' | 'testnet';
      testnet?: boolean;
      local?: boolean;
      url?: string;
      outputFile?: string;
      condensed?: boolean;
    }
  ) => {
    const { emit, emitError, commentary, isQuiet } = await import('../utils/envelope.js');
    const depth = (opts.depth || 'full').toLowerCase();
    if (!['structural', 'review', 'full'].includes(depth)) {
      emitError(
        new Error(`Unknown --depth "${opts.depth}". Use one of: structural, review, full.`),
        { code: 'invalid_depth', exitCode: 2 }
      );
    }

    const { readJsonInput, getApiUrl, getApiKeyForNetwork } = await import('../utils/io.js');

    // Fetch numeric collection ids from the indexer (review/full depths
    // both accept this — structural validate operates on tx JSON only).
    let raw: any;
    if (/^\d+$/.test(input)) {
      if (depth === 'structural') {
        emitError(
          new Error('Numeric collection ids cannot be structurally validated — pass the tx JSON directly.'),
          { code: 'unsupported_input', exitCode: 2 }
        );
      }
      const baseUrl = getApiUrl(opts);
      const apiKey = getApiKeyForNetwork(opts) || '';
      try {
        const response = await fetch(`${baseUrl}/api/v0/collection/${input}`, {
          headers: { 'x-api-key': apiKey }
        });
        if (!response.ok) {
          emitError(
            new Error(
              `Could not fetch collection ${input} from ${baseUrl} — HTTP ${response.status}. ` +
                'Hint: --network local may not have a wired collection-by-id endpoint.'
            ),
            { code: 'fetch_failed', exitCode: 2 }
          );
        }
        raw = await response.json();
      } catch (err: any) {
        emitError(
          new Error(`Could not reach ${baseUrl}/api/v0/collection/${input}: ${err?.message || err}`),
          { code: 'fetch_failed', exitCode: 2 }
        );
      }
    } else {
      try {
        raw = readJsonInput(input);
      } catch (err: any) {
        emitError(
          new Error(
            `Failed to parse input JSON: ${err?.message || err}. ` +
              'Accepts: file path, @file.json, inline JSON, numeric collection id, or - for stdin.'
          ),
          { code: 'invalid_input', exitCode: 2 }
        );
      }
    }

    const wrapped = ensureTxWrapper(raw);

    // ── --depth structural ────────────────────────────────────────────
    if (depth === 'structural') {
      // Empty messages array isn't a structural error per se but it's
      // almost never what the user wanted.
      if (Array.isArray(wrapped?.messages) && wrapped.messages.length === 0) {
        const result = {
          valid: true,
          issues: [
            {
              severity: 'warning' as const,
              path: 'messages',
              message: 'Transaction has an empty messages array. Did you forget to add any messages?'
            }
          ]
        };
        commentary('▲ WARNING  messages: Transaction has an empty messages array.');
        emit(result, opts);
        process.exitCode = 1;
        return;
      }

      const { validateTransaction } = await import('../../core/validate.js');
      const result = validateTransaction(wrapped);

      if (!isQuiet()) {
        const { renderValidate } = await import('../utils/terminal.js');
        process.stderr.write(renderValidate(result, { stream: process.stderr }) + '\n');
      }
      emit(result, opts);

      if (!result.valid) process.exitCode = 1;
      return;
    }

    // ── --depth review ────────────────────────────────────────────────
    if (depth === 'review') {
      const { reviewCollection } = await import('../../core/review.js');
      let result;
      try {
        result = reviewCollection(wrapped);
      } catch (err: any) {
        emitError(
          new Error(
            `Could not review input: ${err?.message || err}. ` +
              '`check --depth review` expects a transaction (with messages[]), a single Msg ({typeUrl,value}), or a complete on-chain collection document.'
          ),
          { code: 'review_failed', exitCode: 2 }
        );
      }

      if (!isQuiet()) {
        const { renderReview } = await import('../utils/terminal.js');
        process.stderr.write(renderReview(result!, { stream: process.stderr }) + '\n');
      }
      emit(result, opts);

      if (result!.summary.critical > 0) process.exit(2);
      if (opts.strict && result!.summary.warning > 0) process.exit(1);
      return;
    }

    // ── --depth full (default) ────────────────────────────────────────
    const {
      renderValidate,
      renderReview,
      renderDesignDecisions,
      renderMetadataPlaceholders,
      collectMetadataPlaceholders
    } = await import('../utils/terminal.js');

    // Locate the first collection message so the metadata scan + review
    // pass operate on collection state, not whatever happens to be at
    // index 0. Falls back to messages[0] only when there's no collection
    // msg at all, in which case those sections will be skipped anyway.
    const { isCollectionMsg } = await import('../utils/normalizeMsg.js');
    const firstMsg = Array.isArray(wrapped?.messages) && wrapped.messages.length > 0
      ? wrapped.messages.find((m: any) => isCollectionMsg(m)) ?? wrapped.messages[0]
      : wrapped;

    const firstIsCollection = isCollectionMsg(firstMsg);

    let validation: any = null;
    if (opts.validate !== false) {
      const { validateTransaction } = await import('../../core/validate.js');
      validation = validateTransaction(wrapped);
    }

    let review: any = null;
    if (opts.review !== false && firstIsCollection) {
      const { reviewCollection } = await import('../../core/review.js');
      review = reviewCollection(wrapped);
    }

    let design: any = null;
    if (firstIsCollection) {
      const { runDesignChecks } = await import('../../core/design-decisions/index.js');
      design = runDesignChecks(wrapped);
    }

    let placeholders: ReturnType<typeof collectMetadataPlaceholders> = [];
    if (opts.metadata !== false && firstIsCollection) {
      placeholders = collectMetadataPlaceholders(firstMsg);
    }

    if (!isQuiet()) {
      const lines: string[] = [];
      if (validation) {
        lines.push(renderValidate(validation, { stream: process.stderr }));
        lines.push('');
      }
      if (review) {
        lines.push(renderReview(review, { stream: process.stderr }));
        lines.push('');
      }
      if (design && opts.design === true) {
        lines.push(renderDesignDecisions(design, { stream: process.stderr }));
        lines.push('');
      }
      if (placeholders.length > 0) {
        lines.push(
          renderMetadataPlaceholders(placeholders, firstMsg?.value?._meta?.metadataPlaceholders, {
            stream: process.stderr
          })
        );
      }
      const text = lines.join('\n');
      if (text) process.stderr.write(text + '\n');
    }
    emit(
      {
        validate: validation,
        review,
        design,
        metadata: {
          placeholders,
          filled: firstMsg?.value?._meta?.metadataPlaceholders || {}
        }
      },
      opts
    );

    const hasValidationErrors = validation && validation.issues?.some((i: any) => i.severity === 'error');
    const hasCritical = review && review.summary?.critical > 0;
    if (hasValidationErrors || hasCritical) process.exit(2);
    const hasValidationWarnings = validation && validation.issues?.some((i: any) => i.severity === 'warning');
    const hasReviewWarnings = review && review.summary?.warning > 0;
    if (opts.strict && (hasValidationWarnings || hasReviewWarnings)) process.exit(1);
  }
);
