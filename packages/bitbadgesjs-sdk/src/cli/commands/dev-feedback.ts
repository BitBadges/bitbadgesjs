/**
 * `bb dev feedback` — submit feedback or a feature idea from the CLI.
 *
 * Mirrors the in-app FeedbackWidget on bitbadges.io. Useful for the
 * agentic surface — an agent that hits a sharp edge (bad error message,
 * missing flag, surprising defaults) can submit a structured note
 * without leaving the shell. Auto-populates `page` with a CLI-flavored
 * source string so the inbound feed shows what surface the agent was
 * using when they ran into the issue.
 */

import { Command } from 'commander';
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  callIndexer as callApi,
  emitIndexerResult as emit,
  emitIndexerError as emitError,
  type IndexerNetworkFlags as NetworkFlags,
  type IndexerOutputFlags as OutputFlags,
} from '../utils/indexer-options.js';

type FeedbackFlags = NetworkFlags & OutputFlags & {
  type?: 'feedback' | 'feature-idea';
  category?: string;
  page?: string;
};

const FEEDBACK_TYPES = ['feedback', 'feature-idea'] as const;

export const devFeedbackCommand = new Command('feedback')
  .description('Submit feedback or a feature idea to BitBadges. Visible alongside the in-app widget.')
  .argument('<message>', 'The feedback body. Wrap in quotes if it has spaces.')
  .option('--type <type>', `One of: ${FEEDBACK_TYPES.join(', ')}`, 'feedback')
  .option('--category <name>', 'Optional category tag (e.g. "cli-ergonomics"). Only used when --type=feature-idea.')
  .option('--page <ref>', 'Override the auto-populated source tag. Defaults to "cli:<version>".');

addOutputFlags(addNetworkFlags(devFeedbackCommand));

devFeedbackCommand
  .addHelpText('after', `\nExamples:\n  $ bb dev feedback "the --denom flag rejects 'usdc' lowercase — should match case-insensitively"\n  $ bb dev feedback --type feature-idea --category cli "add tab completion for collection IDs"\n`)
  .action(async (message: string, opts: FeedbackFlags) => {
    try {
      const trimmed = (message ?? '').trim();
      if (!trimmed) {
        throw new Error('Feedback message cannot be empty.');
      }
      if (trimmed.length > 2000) {
        throw new Error(`Feedback message is ${trimmed.length} chars; the indexer limit is 2000.`);
      }

      const type = opts.type ?? 'feedback';
      if (!FEEDBACK_TYPES.includes(type)) {
        throw new Error(`--type must be one of: ${FEEDBACK_TYPES.join(', ')} (got "${type}")`);
      }

      // Source-tag for the `page` field — mirrors the FE's `router.asPath`
      // semantic, but identifies CLI submissions so they're filterable in
      // the inbound feed. Default is "cli"; users can pass --page to be
      // more specific (e.g. "cli:auctions place-bid").
      const page = opts.page ?? 'cli';

      const body: Record<string, unknown> = {
        message: trimmed,
        page,
        type,
      };
      if (type === 'feature-idea' && opts.category) {
        body.category = opts.category.trim().slice(0, 100);
      }

      const res = await callApi('POST', '/feedback', opts, body);
      emit(res ?? { submitted: true, type, page }, opts);
    } catch (err) {
      emitError(err);
    }
  });
