/**
 * Tool: get_review_url
 * Upload the built transaction to the open preview endpoint and return a
 * short bitbadges.io link where the user reviews and signs it. This is the
 * dev-first handoff: the agent builds, the site only reviews + signs.
 */
import { z } from 'zod';
import { getApiUrl } from '../../sdk/apiClient.js';
import { getTransaction as getTransactionFromSession, ensureStringNumbers } from '../../session/sessionState.js';
import { normalizeTxMessages } from '../../../cli/utils/normalizeMsg.js';
import { buildPreviewUrlFromCode, buildReviewUrlFromCode } from '../../handoff.js';

export const getReviewUrlSchema = z.object({
  transaction: z.object({}).passthrough().optional().describe('Transaction object to hand off. If omitted, the current session transaction is used.'),
  sessionId: z.string().optional().describe('Session ID (only needed when auto-filling from session state).'),
  creatorAddress: z.string().optional().describe('Creator bb1... address (only needed when auto-filling from session state).'),
  frontendUrl: z
    .string()
    .optional()
    .describe('Override the frontend base URL (default: bitbadges.io, or testnet.bitbadges.io when the API URL is testnet).')
});

export type GetReviewUrlInput = z.infer<typeof getReviewUrlSchema>;

export interface GetReviewUrlResult {
  success: boolean;
  /** Short code backing both URLs; expires after `expiresIn`. */
  code?: string;
  /** Open this to review AND sign in the browser (wallet required). */
  reviewUrl?: string;
  /** Read-only preview (no signing). Safe to share with a reviewer. */
  previewUrl?: string;
  expiresAt?: number;
  expiresIn?: string;
  error?: string;
}

export const getReviewUrlTool = {
  name: 'get_review_url',
  description:
    'FINAL STEP after building: upload the transaction and get a short bitbadges.io link the user opens to review and sign it with their wallet. Give the user `reviewUrl`. Uses the current session transaction unless `transaction` is passed. No API key needed. Links expire after 1 hour.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      transaction: { type: 'object', description: 'Transaction object to hand off. If omitted, the current session transaction is used.' },
      sessionId: { type: 'string', description: 'Session ID (only when auto-filling from session state).' },
      creatorAddress: { type: 'string', description: 'Creator address (only when auto-filling from session state).' },
      frontendUrl: { type: 'string', description: 'Override the frontend base URL.' }
    }
  }
};

/** BITBADGES_FRONTEND_URL, else infer testnet from the API URL, else mainnet. */
export function resolveFrontendBase(explicit?: string): string {
  if (explicit) return explicit;
  if (process.env.BITBADGES_FRONTEND_URL) return process.env.BITBADGES_FRONTEND_URL;
  return getApiUrl().includes('/testnet') ? 'https://testnet.bitbadges.io' : 'https://bitbadges.io';
}

export async function handleGetReviewUrl(input: GetReviewUrlInput): Promise<GetReviewUrlResult> {
  const raw = input.transaction ?? getTransactionFromSession(input.sessionId, input.creatorAddress);
  const transaction = normalizeTxMessages(ensureStringNumbers(raw));
  const messages = Array.isArray(transaction?.messages) ? transaction.messages : [];
  if (messages.length === 0) {
    return {
      success: false,
      error: 'Transaction has no messages. Build the collection first (set_standards, set_collection_metadata, ...) or pass `transaction`.'
    };
  }

  const url = `${getApiUrl()}/api/v0/builder/preview`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: { messages, ...(transaction.memo ? { memo: transaction.memo } : {}) } })
    });
  } catch (err: any) {
    return { success: false, error: `Preview upload failed: ${err?.message || String(err)}` };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { success: false, error: `Preview upload failed: HTTP ${res.status} ${text}`.trim() };
  }
  const data = (await res.json()) as { code: string; expiresAt?: number; expiresIn?: string };
  const frontendBase = resolveFrontendBase(input.frontendUrl);
  return {
    success: true,
    code: data.code,
    reviewUrl: buildReviewUrlFromCode(frontendBase, data.code, transaction),
    previewUrl: buildPreviewUrlFromCode(frontendBase, data.code),
    expiresAt: data.expiresAt,
    expiresIn: data.expiresIn
  };
}
