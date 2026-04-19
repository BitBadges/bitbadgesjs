/**
 * Tool: redeem_claim
 *
 * Collapses the 5-call claim-redemption flow documented at
 * `bitbadges-docs/for-developers/ai-agents/claims-for-agents.md` into a
 * single MCP tool call. Under the hood, we:
 *
 *   1. `getClaims([claimId])` — lookup plugins + trackerDetails so we can
 *      auto-map the flat `inputs` object onto the right `instanceId` body
 *      and decide whether this is a standalone (off-chain) or on-chain
 *      gated claim.
 *   2. `completeClaim(claimId, address, payload)` — submit the attempt.
 *   3. Poll `getClaimAttemptStatus` with exponential backoff (500ms → 4s
 *      cap) bounded by `pollTimeoutMs` (default 30s).
 *   4. For on-chain claims, `getReservedClaimCodes` + `getMerkleProofInfo`
 *      + hand-stitched `MsgTransferTokens`, returned in the same shape
 *      `build_transfer` emits so `simulate_transaction` accepts it
 *      unmodified.
 *
 * See backlog #0256 (bitbadges-autopilot) for the simplification rationale.
 *
 * Convention note: schema + response shape mirror `buildClaim.ts`; the
 * polling + bigint→string patterns mirror `simulateTransaction.ts`.
 */

import { z } from 'zod';
import {
  type ApiClientConfig,
  type ClaimSummary,
  type ClaimPluginSummary,
  type CompleteClaimResponse,
  type ClaimAttemptStatusResponse,
  type ReservedClaimCodesResponse,
  type MerkleProofInfoResponse,
  completeClaim,
  getClaimAttemptStatus,
  getClaims,
  getMerkleProofInfo,
  getReservedClaimCodes
} from '../../sdk/apiClient.js';
import { ensureBb1 } from '../../sdk/addressUtils.js';

export const redeemClaimSchema = z.object({
  claimId: z.string().describe('Claim ID to redeem'),
  address: z.string().describe('Redeemer address (bb1... or 0x...)'),
  inputs: z
    .record(z.unknown())
    .optional()
    .describe(
      'Plugin inputs keyed either by flat verbs (code/password/address) or by the claim plugin instanceId. Leave empty for pure whitelist / open claims.'
    ),
  expectedVersion: z
    .number()
    .optional()
    .describe('Pin the claim version. Defaults to -1 ("do not care", matches latest).'),
  pollTimeoutMs: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('How long to wait for the claim attempt to resolve. Default 30000ms.'),
  returnTransfer: z
    .boolean()
    .optional()
    .describe(
      'For on-chain gated claims, also build a ready-to-sign MsgTransferTokens. Default true. Ignored for standalone claims.'
    )
});

export type RedeemClaimInput = z.infer<typeof redeemClaimSchema>;

export interface RedeemClaimResult {
  success: boolean;
  error?: string;
  /** The claim attempt ID from `completeClaim`. Present on most paths. */
  claimAttemptId?: string;
  /** On-chain reserved merkle code for this address (if any). */
  code?: string;
  /** Whether the redeemed claim is linked to an on-chain collection. */
  onChain?: boolean;
  /**
   * Ready-to-sign MsgTransferTokens transaction. Only populated when the
   * claim is on-chain gated AND `returnTransfer` is not false AND the
   * merkle proof resolved. Same shape as `build_transfer` emits so
   * `simulate_transaction` can consume it unmodified.
   */
  transaction?: {
    messages: unknown[];
    memo: string;
    fee: { amount: Array<{ denom: string; amount: string }>; gas: string };
  };
  /** Diagnostic info for agents that need to decide how to retry. */
  discovered?: {
    plugins: Array<{ pluginId: string; instanceId: string }>;
    standaloneClaim: boolean;
  };
}

export const redeemClaimTool = {
  name: 'redeem_claim',
  description:
    'Redeem a BitBadges claim on behalf of an address in one call. Submits the claim attempt, polls until the indexer resolves it, and — for on-chain gated claims — auto-fetches the reserved merkle code, fetches the merkle proof, and returns a ready-to-sign MsgTransferTokens. Collapses the 5-call flow (completeClaim → poll → getReservedClaimCodes → getMerkleProofInfo → build transfer) into a single tool call. Requires BITBADGES_API_KEY.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      claimId: { type: 'string', description: 'Claim ID to redeem' },
      address: { type: 'string', description: 'Redeemer address (bb1... or 0x...)' },
      inputs: {
        type: 'object',
        description:
          'Plugin inputs. Use flat verbs (code/password/address) for auto-mapping, or pass a full `{ [instanceId]: { ...plugin body } }` object to bypass auto-mapping. Leave empty for whitelist / open claims.'
      },
      expectedVersion: {
        type: 'number',
        description: 'Pin the claim version. Defaults to -1 (any version).'
      },
      pollTimeoutMs: {
        type: 'number',
        description: 'Timeout in ms for the polling loop. Default 30000.'
      },
      returnTransfer: {
        type: 'boolean',
        description:
          'For on-chain claims, also build the MsgTransferTokens. Default true.'
      }
    },
    required: ['claimId', 'address']
  }
};

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];

/** Keys that are considered "flat verbs" and get auto-mapped to plugin instanceIds. */
const FLAT_VERB_KEYS = new Set(['code', 'codes', 'password', 'whitelist']);

/**
 * Map a flat verb (e.g. `code`) to the plugin instance body the indexer
 * expects. Mirrors the per-plugin payload the docs show at
 * `claims-for-agents.md` — users typed `code: 'xyz'`, indexer expects
 * `{ [codesInstanceId]: { code: 'xyz' } }`.
 */
function buildPluginBodyForVerb(verb: string, value: unknown): Record<string, unknown> {
  switch (verb) {
    case 'code':
    case 'codes':
      // `value` is the actual code string
      return { code: String(value) };
    case 'password':
      return { password: String(value) };
    case 'whitelist':
      // Whitelist plugin accepts an empty body server-side; address gating
      // happens at the plugin level via the signed-in user's address.
      return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
    default:
      return { [verb]: value };
  }
}

/**
 * Find the first plugin whose `pluginId` matches one of the given candidate
 * IDs. Returns `undefined` if no plugin in the claim uses that pluginId.
 */
function findPluginByPluginId(
  plugins: ClaimPluginSummary[],
  pluginIds: string[]
): ClaimPluginSummary | undefined {
  for (const plugin of plugins) {
    if (pluginIds.includes(plugin.pluginId)) return plugin;
  }
  return undefined;
}

/**
 * Given a user-supplied `inputs` object + the claim's plugin list, produce
 * the `{ [instanceId]: body }` map that `completeClaim` expects. Returns
 * `null` if the inputs couldn't be mapped — caller should return an error
 * with the discovered plugin list so the agent can retry.
 */
function mapInputsToInstanceIds(
  inputs: Record<string, unknown> | undefined,
  plugins: ClaimPluginSummary[]
): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  if (!inputs || Object.keys(inputs).length === 0) {
    return out;
  }

  for (const [key, value] of Object.entries(inputs)) {
    if (FLAT_VERB_KEYS.has(key)) {
      // Flat verb → find matching plugin and rewrite under its instanceId.
      const pluginIdCandidates =
        key === 'code' || key === 'codes' ? ['codes'] :
        key === 'password' ? ['password'] :
        key === 'whitelist' ? ['whitelist'] :
        [key];
      const plugin = findPluginByPluginId(plugins, pluginIdCandidates);
      if (!plugin) {
        return null;
      }
      out[plugin.instanceId] = buildPluginBodyForVerb(key, value);
    } else {
      // Key was not a flat verb — assume the caller passed a raw
      // `{ instanceId: body }` shape (power-user escape hatch).
      out[key] = value;
    }
  }

  return out;
}

/** Exponential backoff capped at `cap`. Starts at `start`, doubles each step. */
function nextBackoffMs(prev: number, start: number, cap: number): number {
  if (prev === 0) return start;
  return Math.min(prev * 2, cap);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Poll `getClaimAttemptStatus` until terminal success/error or timeout.
 *
 * Returns the final status response regardless of which terminal state was
 * hit. The caller decides how to interpret `success`/`error`. On overall
 * polling-loop timeout, we surface a synthetic response with
 * `error: 'Polling timed out'` so the agent can choose to re-poll later
 * using the returned `claimAttemptId`.
 *
 * Exponential backoff: starts at 500ms, doubles until 4s cap. Matches the
 * handoff note in ticket #0256 — the docs' 2s-sleep pattern is a floor,
 * not a ceiling; we want to be more responsive at the front (typical
 * claims resolve in under a second) and less noisy if the attempt is
 * taking longer.
 */
async function pollClaimAttemptStatus(
  claimAttemptId: string,
  pollTimeoutMs: number,
  config?: ApiClientConfig
): Promise<
  | { ok: true; status: ClaimAttemptStatusResponse; timedOut?: false }
  | { ok: true; status: ClaimAttemptStatusResponse; timedOut: true }
  | { ok: false; error: string }
> {
  const startMs = Date.now();
  let delayMs = 0;
  let lastStatus: ClaimAttemptStatusResponse | undefined;

  while (Date.now() - startMs < pollTimeoutMs) {
    delayMs = nextBackoffMs(delayMs, 500, 4000);
    // Clamp the final wait so we don't exceed pollTimeoutMs.
    const remaining = pollTimeoutMs - (Date.now() - startMs);
    await sleep(Math.min(delayMs, Math.max(remaining, 0)));

    const res = await getClaimAttemptStatus(claimAttemptId, config);
    if (!res.success) {
      return { ok: false, error: res.error || 'Failed to fetch claim attempt status' };
    }
    lastStatus = res.data;
    if (lastStatus && (lastStatus.success || lastStatus.error)) {
      return { ok: true, status: lastStatus };
    }
  }

  return {
    ok: true,
    timedOut: true,
    status:
      lastStatus ?? {
        success: false,
        error: 'Polling timed out',
        bitbadgesAddress: ''
      }
  };
}

export async function handleRedeemClaim(input: RedeemClaimInput): Promise<RedeemClaimResult> {
  try {
    const address = ensureBb1(input.address);
    const pollTimeoutMs = input.pollTimeoutMs ?? 30_000;
    const returnTransfer = input.returnTransfer !== false; // default true

    // Step 1 — fetch the claim to discover plugins + on-chain linkage.
    const claimsRes = await getClaims([input.claimId]);
    if (!claimsRes.success) {
      return { success: false, error: claimsRes.error || 'Failed to fetch claim' };
    }
    const claim: ClaimSummary | undefined = claimsRes.data?.claims?.[0];
    if (!claim) {
      return { success: false, error: `Claim ${input.claimId} not found` };
    }

    const plugins = claim.plugins ?? [];
    const discovered = {
      plugins: plugins.map((p) => ({ pluginId: p.pluginId, instanceId: p.instanceId })),
      standaloneClaim: Boolean(claim.standaloneClaim) || !claim.trackerDetails
    };

    // Step 2 — map flat inputs onto plugin instanceIds.
    const mapped = mapInputsToInstanceIds(input.inputs, plugins);
    if (mapped === null) {
      return {
        success: false,
        error:
          'Could not map input keys to any plugin on this claim. Pass inputs keyed by plugin instanceId instead, or use one of the flat verbs (code, password, whitelist) if the claim has a matching plugin.',
        discovered
      };
    }

    const payload: Record<string, unknown> = {
      _expectedVersion: input.expectedVersion ?? -1,
      ...mapped
    };

    // Step 3 — submit the attempt.
    const completeRes = await completeClaim(input.claimId, address, payload);
    if (!completeRes.success || !completeRes.data?.claimAttemptId) {
      return {
        success: false,
        error: completeRes.error || 'completeClaim returned no claimAttemptId',
        discovered
      };
    }
    const claimAttemptId = (completeRes.data as CompleteClaimResponse).claimAttemptId;

    // Step 4 — poll until terminal.
    const pollResult = await pollClaimAttemptStatus(claimAttemptId, pollTimeoutMs);
    if (!pollResult.ok) {
      return { success: false, error: pollResult.error, claimAttemptId, discovered };
    }
    const status = pollResult.status;

    // Timeout is a distinct failure mode from "claim attempt succeeded
    // with error" — surface it explicitly so agents can re-poll later
    // using the returned claimAttemptId.
    if (pollResult.timedOut) {
      return {
        success: false,
        error: `Polling timed out after ${pollTimeoutMs}ms. Re-poll getClaimAttemptStatus(${claimAttemptId}) later.`,
        claimAttemptId,
        discovered
      };
    }

    if (!status.success) {
      return {
        success: false,
        error: status.error || 'Claim attempt failed',
        claimAttemptId,
        discovered
      };
    }

    // Step 5 — standalone claims stop here.
    const onChain = !discovered.standaloneClaim && Boolean(claim.trackerDetails);
    if (!onChain) {
      return {
        success: true,
        claimAttemptId,
        code: status.code,
        onChain: false,
        discovered
      };
    }

    // If the caller explicitly opted out of the transfer build, return
    // early with just the on-chain code so they can stitch the transfer
    // themselves (e.g. batch with other messages).
    if (!returnTransfer) {
      return {
        success: true,
        claimAttemptId,
        code: status.code,
        onChain: true,
        discovered
      };
    }

    // Step 6 — fetch reserved codes + merkle proof, then shape the transfer.
    const reservedRes = await getReservedClaimCodes(input.claimId, address);
    if (!reservedRes.success || !reservedRes.data) {
      return {
        success: false,
        error: reservedRes.error || 'Failed to fetch reserved claim codes',
        claimAttemptId,
        onChain: true,
        discovered
      };
    }
    const reserved: ReservedClaimCodesResponse = reservedRes.data;
    const reservedCode = reserved.reservedCodes?.[0];
    const leafSignature = reserved.leafSignatures?.[0];
    if (!reservedCode) {
      return {
        success: false,
        error:
          'No reserved claim code was returned for this address. The claim may not be linked to an on-chain tracker, or the address already redeemed all reserved leaves.',
        claimAttemptId,
        code: status.code,
        onChain: true,
        discovered
      };
    }

    const tracker = claim.trackerDetails!;
    const collectionId =
      typeof tracker.collectionId === 'bigint' ? tracker.collectionId.toString() : String(tracker.collectionId);

    const merkleRes = await getMerkleProofInfo({
      collectionId,
      approvalId: tracker.approvalId,
      approvalLevel: tracker.approvalLevel,
      approverAddress: tracker.approverAddress,
      challengeTrackerId: tracker.challengeTrackerId,
      leaves: [reservedCode],
      bitbadgesAddress: address,
      claimCodes: [reservedCode]
    });
    if (!merkleRes.success || !merkleRes.data) {
      return {
        success: false,
        error: merkleRes.error || 'Failed to fetch merkle proof info',
        claimAttemptId,
        code: status.code,
        onChain: true,
        discovered
      };
    }
    const proofDetail: MerkleProofInfoResponse['allProofDetails'][number] | undefined =
      merkleRes.data.allProofDetails?.[0];
    if (!proofDetail || !proofDetail.isValidProof) {
      return {
        success: false,
        error:
          'Indexer could not produce a valid merkle proof for the reserved code. The challenge tracker may not be populated yet — retry after the indexer catches up.',
        claimAttemptId,
        code: status.code,
        onChain: true,
        discovered
      };
    }

    // Step 7 — build the MsgTransferTokens with merkle proof stitched in.
    // Shape matches build_transfer's output so simulate_transaction
    // consumes it directly.
    const transfer: Record<string, unknown> = {
      from: 'Mint',
      toAddresses: [address],
      balances: [
        {
          amount: '1',
          tokenIds: FOREVER, // all valid IDs; indexer enforces via approval
          ownershipTimes: FOREVER
        }
      ],
      merkleProofs: [
        {
          leaf: reservedCode,
          leafSignature: leafSignature ?? '',
          aunts: proofDetail.proofObj
        }
      ],
      prioritizedApprovals: [
        {
          approvalId: tracker.approvalId,
          approvalLevel: tracker.approvalLevel || 'collection',
          approverAddress: tracker.approverAddress || '',
          version: '0'
        }
      ],
      onlyCheckPrioritizedApprovals: false
    };

    const transaction = {
      messages: [
        {
          typeUrl: '/tokenization.MsgTransferTokens',
          value: {
            creator: address,
            collectionId,
            transfers: [transfer]
          }
        }
      ],
      memo: '',
      fee: {
        amount: [{ denom: 'ubadge', amount: '5000' }],
        gas: '500000'
      }
    };

    return {
      success: true,
      claimAttemptId,
      code: status.code ?? reservedCode,
      onChain: true,
      transaction,
      discovered
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to redeem claim: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
