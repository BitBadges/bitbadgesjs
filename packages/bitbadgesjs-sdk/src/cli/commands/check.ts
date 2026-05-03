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
    .option('--json', 'Output the structured result as JSON')
    .option('--strict', 'Exit 1 on warnings (criticals/errors always exit 2)')
    .option('--no-validate', 'Skip the structural validation section (full depth only)')
    .option('--no-review', 'Skip the design review section (full depth only)')
    .option('--no-metadata', 'Skip the metadata coverage section (full depth only)')
    .option('--design', 'Include the design decisions (informational ✓/✗) section in full depth output. Hidden by default; the underlying decisions still appear in --json output.')
    .option('--output-file <path>', 'Write output to file instead of stdout')
).action(
  async (
    input: string,
    opts: {
      depth?: string;
      json?: boolean;
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
    }
  ) => {
    const depth = (opts.depth || 'full').toLowerCase();
    if (!['structural', 'review', 'full'].includes(depth)) {
      process.stderr.write(`Unknown --depth "${opts.depth}". Use one of: structural, review, full.\n`);
      process.exit(2);
    }

    const { readJsonInput, output, getApiUrl, getApiKeyForNetwork } = await import('../utils/io.js');

    // Fetch numeric collection ids from the indexer (review/full depths
    // both accept this — structural validate operates on tx JSON only).
    let raw: any;
    if (/^\d+$/.test(input)) {
      if (depth === 'structural') {
        process.stderr.write(
          `Numeric collection ids cannot be structurally validated — pass the tx JSON directly.\n`
        );
        process.exit(2);
      }
      const baseUrl = getApiUrl(opts);
      const apiKey = getApiKeyForNetwork(opts) || '';
      try {
        const response = await fetch(`${baseUrl}/api/v0/collection/${input}`, {
          headers: { 'x-api-key': apiKey }
        });
        if (!response.ok) {
          process.stderr.write(
            `Could not fetch collection ${input} from ${baseUrl} — HTTP ${response.status}.\n` +
              `Hint: --network local may not have a wired collection-by-id endpoint.\n`
          );
          process.exit(2);
        }
        raw = await response.json();
      } catch (err: any) {
        process.stderr.write(
          `Could not reach ${baseUrl}/api/v0/collection/${input}: ${err?.message || err}\n`
        );
        process.exit(2);
      }
    } else {
      try {
        raw = readJsonInput(input);
      } catch (err: any) {
        process.stderr.write(
          `Failed to parse input JSON: ${err?.message || err}\n` +
            `Accepts: file path, @file.json, inline JSON, numeric collection id, or - for stdin.\n`
        );
        process.exit(2);
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
        if (opts.json) {
          output(result, { ...opts, human: false });
        } else {
          process.stderr.write('▲ WARNING  messages: Transaction has an empty messages array.\n');
        }
        process.exitCode = 1;
        return;
      }

      const { validateTransaction } = await import('../../core/validate.js');
      const result = validateTransaction(wrapped);

      if (opts.json) {
        output(result, { ...opts, human: false });
      } else {
        const { renderValidate } = await import('../utils/terminal.js');
        const text = renderValidate(result, { stream: process.stdout });
        if (opts.outputFile) {
          const fsMod = await import('fs');
          const plain = text.replace(/\x1b\[[0-9;]*m/g, '');
          fsMod.writeFileSync(opts.outputFile, plain + '\n', 'utf-8');
          process.stderr.write(`Written to ${opts.outputFile}\n`);
        } else {
          console.log(text);
        }
      }

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
        process.stderr.write(
          `Could not review input: ${err?.message || err}\n` +
            `\`check --depth review\` expects a transaction (with messages[]), a single Msg ({typeUrl,value}), or a complete on-chain collection document.\n`
        );
        process.exit(2);
      }

      if (opts.json) {
        output(result, { ...opts, human: false });
      } else {
        const { renderReview } = await import('../utils/terminal.js');
        const text = renderReview(result, { stream: process.stdout });
        if (opts.outputFile) {
          const fsMod = await import('fs');
          const plain = text.replace(/\x1b\[[0-9;]*m/g, '');
          fsMod.writeFileSync(opts.outputFile, plain + '\n', 'utf-8');
          process.stderr.write(`Written to ${opts.outputFile}\n`);
        } else {
          console.log(text);
        }
      }

      if (result.summary.critical > 0) process.exit(2);
      if (opts.strict && result.summary.warning > 0) process.exit(1);
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

    if (opts.json) {
      output(
        {
          validate: validation,
          review,
          design,
          metadata: {
            placeholders,
            filled: firstMsg?.value?._meta?.metadataPlaceholders || {}
          }
        },
        { ...opts, human: false }
      );
    } else {
      const lines: string[] = [];
      if (validation) {
        lines.push(renderValidate(validation, { stream: process.stdout }));
        lines.push('');
      }
      if (review) {
        lines.push(renderReview(review, { stream: process.stdout }));
        lines.push('');
      }
      if (design && opts.design === true) {
        lines.push(renderDesignDecisions(design, { stream: process.stdout }));
        lines.push('');
      }
      if (placeholders.length > 0) {
        lines.push(
          renderMetadataPlaceholders(placeholders, firstMsg?.value?._meta?.metadataPlaceholders, {
            stream: process.stdout
          })
        );
      }
      const text = lines.join('\n');

      if (opts.outputFile) {
        const fsMod = await import('fs');
        const plain = text.replace(/\x1b\[[0-9;]*m/g, '');
        fsMod.writeFileSync(opts.outputFile, plain + '\n', 'utf-8');
        process.stderr.write(`Written to ${opts.outputFile}\n`);
      } else {
        console.log(text);
      }
    }

    const hasValidationErrors = validation && validation.issues?.some((i: any) => i.severity === 'error');
    const hasCritical = review && review.summary?.critical > 0;
    if (hasValidationErrors || hasCritical) process.exit(2);
    const hasValidationWarnings = validation && validation.issues?.some((i: any) => i.severity === 'warning');
    const hasReviewWarnings = review && review.summary?.warning > 0;
    if (opts.strict && (hasValidationWarnings || hasReviewWarnings)) process.exit(1);
  }
);
