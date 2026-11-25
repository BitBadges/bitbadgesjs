/**
 * Tool: get_review_url
 * Upload the built transaction to the preview endpoint and return a
 * short bitbadges.io link where the user reviews and signs it. This is the
 * dev-first handoff: the agent builds, the site only reviews + signs.
 */
import { z } from 'zod';
import { getApiKey, getApiUrl, isLocalApiUrl } from '../../sdk/apiClient.js';
import { getTransaction as getTransactionFromSession, ensureStringNumbers } from '../../session/sessionState.js';
import { normalizeTxMessages } from '../../../cli/utils/normalizeMsg.js';
import { buildReviewUrlFromCode } from '../../handoff.js';

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
  expiresAt?: number;
  expiresIn?: string;
  error?: string;
}

export const getReviewUrlTool = {
  name: 'get_review_url',
  description:
    'FINAL STEP after building: upload the transaction and get a short bitbadges.io link the user opens to review and sign it with their wallet. Give the user `reviewUrl`. Uses the current session transaction unless `transaction` is passed. Uploading needs a BitBadges API key (BITBADGES_API_KEY or `bb settings set apiKey`) except against a local indexer; the person opening the link needs none. Links expire after 1 hour.',
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

const ALLOWED_FRONTEND_ORIGINS = new Set([
  'https://bitbadges.io',
  'https://testnet.bitbadges.io',
  'https://stagenet.bitbadges.io'
]);

function isLoopbackHttpUrl(parsed: URL): boolean {
  return parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
}

function normalizeAndValidateFrontendBase(rawUrl: string, allowAnyHttpsOrigin: boolean): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid frontendUrl "${rawUrl}": expected a valid https:// or http://localhost URL.`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`Invalid frontendUrl "${rawUrl}": embedded credentials are not allowed.`);
  }
  if (parsed.search || parsed.hash) {
    throw new Error(`Invalid frontendUrl "${rawUrl}": query parameters and fragments are not allowed.`);
  }
  const isHttps = parsed.protocol === 'https:';
  const isLoopbackHttp = isLoopbackHttpUrl(parsed);
  if (!isHttps && !isLoopbackHttp) {
    throw new Error(`Invalid frontendUrl "${rawUrl}": only https:// or http://localhost / http://127.0.0.1 URLs are allowed.`);
  }
  if (!allowAnyHttpsOrigin && !isLoopbackHttp && !ALLOWED_FRONTEND_ORIGINS.has(parsed.origin)) {
    const envUrl = process.env.BITBADGES_FRONTEND_URL;
    let matchesEnvOrigin = false;
    if (envUrl) {
      try {
        matchesEnvOrigin = new URL(envUrl).origin === parsed.origin;
      } catch {
        matchesEnvOrigin = false;
      }
    }
    if (!matchesEnvOrigin) {
      throw new Error(
        `Untrusted frontendUrl origin "${parsed.origin}". Allowed origins: ${[...ALLOWED_FRONTEND_ORIGINS].join(', ')}, http://localhost, http://127.0.0.1, or an origin explicitly configured via BITBADGES_FRONTEND_URL.`
      );
    }
  }
  let end = parsed.pathname.length;
  while (end > 0 && parsed.pathname[end - 1] === '/') end--;
  const trimmedPath = end === 0 ? '' : parsed.pathname.slice(0, end);
  return `${parsed.origin}${trimmedPath}`;
}

/** BITBADGES_FRONTEND_URL, else infer testnet from the API URL, else mainnet. */
export function resolveFrontendBase(explicit?: string): string {
  if (explicit) return normalizeAndValidateFrontendBase(explicit, false);
  if (process.env.BITBADGES_FRONTEND_URL) return normalizeAndValidateFrontendBase(process.env.BITBADGES_FRONTEND_URL, true);
  return getApiUrl().includes('/testnet') ? 'https://testnet.bitbadges.io' : 'https://bitbadges.io';
}

export async function handleGetReviewUrl(input: GetReviewUrlInput): Promise<GetReviewUrlResult> {
  let frontendBase: string;
  try {
    frontendBase = resolveFrontendBase(input.frontendUrl);
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }

  const raw = input.transaction ?? getTransactionFromSession(input.sessionId, input.creatorAddress);
  const transaction = normalizeTxMessages(ensureStringNumbers(raw));
  const messages = Array.isArray(transaction?.messages) ? transaction.messages : [];
  if (messages.length === 0) {
    return {
      success: false,
      error: 'Transaction has no messages. Build the collection first (set_standards, set_collection_metadata, ...) or pass `transaction`.'
    };
  }

  const apiUrl = getApiUrl();
  const url = `${apiUrl}/api/v0/builder/preview`;
  // The indexer gates /builder/preview behind an API key (premiumOnlyHandler).
  // Send the configured key; without one only a local indexer accepts the upload.
  const apiKey = getApiKey();
  if (!apiKey && !isLocalApiUrl(apiUrl)) {
    return {
      success: false,
      error:
        'get_review_url needs a BitBadges API key to upload the preview. Get one at https://bitbadges.io/developer, then set BITBADGES_API_KEY or run `bb settings set apiKey <key>`. Without a key, hand off with get_transaction and paste the JSON at https://bitbadges.io/mint/local-builder.'
    };
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
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
  return {
    success: true,
    code: data.code,
    reviewUrl: buildReviewUrlFromCode(frontendBase, data.code, transaction),
    expiresAt: data.expiresAt,
    expiresIn: data.expiresIn
  };
}
