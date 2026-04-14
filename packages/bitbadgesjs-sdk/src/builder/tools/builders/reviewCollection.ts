/**
 * Tool: review_collection
 * Unified deterministic review — combines audit + standards + UX checks
 * into a single ReviewResult. This is the only review entry point
 * exposed by the builder tool surface.
 *
 * Logic delegated to bitbadgesjs-sdk's reviewCollection().
 */

import { reviewCollection, type ReviewResult, type ReviewContext } from '../../../core/review.js';

export const reviewCollectionTool = {
  name: 'review_collection',
  description:
    'Run the unified deterministic review on a collection transaction or on-chain collection. Returns audit + standards + UX findings merged into one ReviewResult with a single verdict. Accepts an optional context (onChainCollection, skipSources, audienceFilter).',
  inputSchema: {
    type: 'object' as const,
    properties: {
      collection: {
        type: 'object',
        description:
          'The collection to review. Accepts a MsgUniversalUpdateCollection message, its value field, a transaction { messages: [...] }, or a raw on-chain collection object.'
      },
      context: {
        type: 'object',
        description:
          'Optional review context. Fields: onChainCollection (object, prior on-chain state used by diff checks and update-only suppressions), skipSources (array of "audit" | "standards" | "ux" to skip whole families), audienceFilter ("agent" | "human" | "both" to filter findings by audience tag).'
      }
    },
    required: ['collection']
  }
};

export function handleReviewCollection(input: {
  collection: Record<string, unknown>;
  context?: ReviewContext;
}): ReviewResult {
  return reviewCollection(input.collection, input.context);
}
