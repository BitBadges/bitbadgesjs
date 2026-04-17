/**
 * Tool: verify_ownership
 * Verify if an address meets ownership requirements (AND/OR/NOT)
 *
 * Supports two input shapes:
 *   1. Shorthand — `collectionId` (+ optional `tokenId` / `tokenIdEnd` /
 *      `minAmount`) covers the ~80% single-collection "does this address
 *      own at least N of token X from collection Y?" case (e.g. BB-402).
 *   2. Advanced — `requirements` as a JSON-stringified `AssetConditionGroup`
 *      for `$and` / `$or` / `$not` logic across multiple assets.
 *
 * Shorthand collapses to the full `AssetConditionGroup` server-side; both
 * paths hit the same API surface. See backlog #0225 for the regression
 * context (shorthand was dropped during the SDK fold and restored here).
 */

import { z } from 'zod';
import { verifyOwnership } from '../../sdk/apiClient.js';
import { ensureBb1 } from '../../sdk/addressUtils.js';

/** UintRange end sentinel meaning "forever / no upper bound". */
const MAX_UINT64 = '18446744073709551615';

export const verifyOwnershipSchema = z
  .object({
    address: z.string().describe('The address to verify (bb1... or 0x...)'),

    // Shorthand for single-collection check (~80%+ of uses).
    collectionId: z
      .string()
      .optional()
      .describe(
        'Collection ID to check ownership of. Use this shorthand for simple single-collection checks. Ignored if `requirements` is set.'
      ),
    tokenId: z
      .string()
      .optional()
      .describe('Token ID to check (default: "1"). Used with collectionId shorthand.'),
    tokenIdEnd: z
      .string()
      .optional()
      .describe('End of token ID range (default: same as tokenId).'),
    minAmount: z
      .string()
      .optional()
      .describe('Minimum amount required (default: "1").'),

    // Full requirements for advanced AND/OR/NOT logic.
    requirements: z
      .string()
      .optional()
      .describe(
        'Advanced: full AssetConditionGroup JSON string for $and / $or / $not logic. Only needed when the shorthand is not expressive enough.'
      )
  })
  .refine((v) => !!(v.collectionId || v.requirements), {
    message: 'Provide either `collectionId` (shorthand) or `requirements` (advanced JSON).'
  });

export type VerifyOwnershipInput = z.infer<typeof verifyOwnershipSchema>;

export interface VerifyOwnershipResult {
  success: boolean;
  verified?: boolean;
  details?: unknown;
  error?: string;
}

export const verifyOwnershipTool = {
  name: 'verify_ownership',
  description:
    'Verify if an address meets ownership requirements (AND/OR/NOT). Use the `collectionId` shorthand for a single-collection check, or pass a full `requirements` JSON for advanced logic. Requires BITBADGES_API_KEY environment variable.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      address: {
        type: 'string',
        description: 'The address to verify (bb1... or 0x...)'
      },
      collectionId: {
        type: 'string',
        description:
          'Collection ID to check ownership of. Use this shorthand for simple single-collection checks. Ignored if `requirements` is set.'
      },
      tokenId: {
        type: 'string',
        description: 'Token ID to check (default: "1"). Used with collectionId shorthand.'
      },
      tokenIdEnd: {
        type: 'string',
        description: 'End of token ID range (default: same as tokenId).'
      },
      minAmount: {
        type: 'string',
        description: 'Minimum amount required (default: "1").'
      },
      requirements: {
        type: 'string',
        description:
          'Advanced: full AssetConditionGroup JSON string for $and / $or / $not logic. Only needed when the shorthand is not expressive enough.'
      }
    },
    required: ['address']
  }
};

export async function handleVerifyOwnership(input: VerifyOwnershipInput): Promise<VerifyOwnershipResult> {
  try {
    const address = ensureBb1(input.address);

    let parsedRequirements: unknown;

    if (input.requirements) {
      // Advanced path — user provided the full AssetConditionGroup.
      try {
        parsedRequirements = JSON.parse(input.requirements);
      } catch {
        return {
          success: false,
          error: 'Invalid JSON: Could not parse requirements'
        };
      }
    } else if (input.collectionId) {
      // Shorthand — expand a single-collection check into the full structure.
      const tokenStart = input.tokenId || '1';
      const tokenEnd = input.tokenIdEnd || tokenStart;
      const minAmount = input.minAmount || '1';
      parsedRequirements = {
        assets: [
          {
            collectionId: input.collectionId,
            tokenIds: [{ start: tokenStart, end: tokenEnd }],
            ownershipTimes: [{ start: '1', end: MAX_UINT64 }],
            amountRange: { start: minAmount, end: MAX_UINT64 }
          }
        ]
      };
    } else {
      // Caught by the zod `.refine()`, but guarded here too since the tool
      // registry's pre-flight validator only enforces `required: ['address']`.
      return {
        success: false,
        error: 'Provide either `collectionId` (shorthand) or `requirements` (advanced JSON).'
      };
    }

    const response = await verifyOwnership({
      address,
      assetOwnershipRequirements: parsedRequirements as {
        $and?: unknown[];
        $or?: unknown[];
        $not?: unknown;
        assets?: Array<{
          collectionId: string;
          tokenIds: Array<{ start: string; end: string }>;
          ownershipTimes: Array<{ start: string; end: string }>;
          amountRange: { start: string; end: string };
        }>;
      }
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error
      };
    }

    return {
      success: true,
      verified: response.data?.verified,
      details: response.data?.details
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to verify ownership: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}
