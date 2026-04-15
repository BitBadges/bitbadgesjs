/**
 * Tool: build_transfer
 * Construct a correct MsgTransferTokens by querying the collection,
 * analyzing its approvals, and generating the right transaction.
 *
 * This is a COMPUTATIONAL tool — it auto-queries the collection and builds
 * the transfer with correct prioritizedApprovals, coinTransfers, etc.
 */

import { z } from 'zod';
import { getCollections } from '../../sdk/apiClient.js';
import { ensureBb1 } from '../../sdk/addressUtils.js';
import { simulateMessages, type SimulateTransactionResult } from './simulateTransaction.js';

export const buildTransferSchema = z.object({
  collectionId: z.string().describe('The collection ID'),
  fromAddress: z.string().describe('Sender address (bb1... or 0x...) — use "Mint" for minting'),
  toAddress: z.string().describe('Recipient address (bb1... or 0x...) — for unbacking, use the backing address'),
  tokenIds: z.array(z.object({
    start: z.string(),
    end: z.string()
  })).optional().describe('Token ID ranges to transfer (default: all valid token IDs)'),
  amount: z.string().optional().describe('Amount to transfer (default: "1")'),
  intent: z.enum(['mint', 'transfer', 'deposit', 'withdraw']).optional()
    .describe('Transfer intent — helps select the right approval. Auto-detected if not specified.'),
  autoCheck: z.boolean().optional().default(true)
    .describe('When true (default), auto-simulate the built transfer and return results inline on the `simulation` field. If simulation fails due to an exhausted/blocked approval, automatically fall back to the next viable approval candidate and return a working transfer. Set false for pure construction (no network call).')
});

export type BuildTransferInput = z.infer<typeof buildTransferSchema>;

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];

export interface BuildTransferResult {
  success: boolean;
  error?: string;
  transaction?: {
    messages: unknown[];
    memo: string;
    fee: { amount: Array<{ denom: string; amount: string }>; gas: string };
  };
  explanation?: {
    approvalUsed: string;
    intent: string;
    steps: string[];
    warnings: string[];
  };
  /**
   * Populated when `autoCheck` is true. Contains the inline simulation
   * result from `simulate_transaction`, or `{ error: ... }` if the
   * simulation itself failed at the transport layer (network, missing
   * API key). Never causes the overall call to fail — the transaction
   * is always returned.
   */
  simulation?: SimulateTransactionResult & { fallbackUsed?: string };
}

export const buildTransferTool = {
  name: 'build_transfer',
  description: 'Build a MsgTransferTokens by auto-querying the collection, analyzing its approvals, and constructing the correct transaction with proper prioritizedApprovals, coinTransfers, etc. Supports mint, transfer, deposit (IBC→token), and withdraw (token→IBC). Requires BITBADGES_API_KEY.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      collectionId: {
        type: 'string',
        description: 'The collection ID'
      },
      fromAddress: {
        type: 'string',
        description: 'Sender address (bb1... or 0x...) — use "Mint" for minting'
      },
      toAddress: {
        type: 'string',
        description: 'Recipient address (bb1... or 0x...) — for unbacking, use the backing address'
      },
      tokenIds: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' }
          },
          required: ['start', 'end']
        },
        description: 'Token ID ranges (default: all valid IDs)'
      },
      amount: {
        type: 'string',
        description: 'Amount to transfer (default: "1")'
      },
      intent: {
        type: 'string',
        enum: ['mint', 'transfer', 'deposit', 'withdraw'],
        description: 'Transfer intent (auto-detected if not specified)'
      },
      autoCheck: {
        type: 'boolean',
        description: 'Auto-simulate the built transfer and return inline results. On exhausted/blocked approvals, auto-fallback to the next viable approval. Default: true. Set false for pure construction.'
      }
    },
    required: ['collectionId', 'fromAddress', 'toAddress']
  }
};

function detectIntent(from: string, to: string, collection: Record<string, unknown>): string {
  if (from === 'Mint') return 'mint';

  const invariants = (collection.invariants as Record<string, unknown>) || {};
  const ibcPath = invariants.cosmosCoinBackedPath as Record<string, unknown> | null | undefined;
  const backingAddr = ibcPath?.backingAddress as string | undefined;

  if (backingAddr) {
    if (to === backingAddr) return 'withdraw';
    if (from === backingAddr) return 'deposit';
  }

  return 'transfer';
}

function findAllMatchingApprovals(
  approvals: Array<Record<string, unknown>>,
  intent: string,
  from: string,
  to: string,
  backingAddress?: string
): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  for (const approval of approvals) {
    const fromList = (approval.fromListId as string) || '';
    const toList = (approval.toListId as string) || '';
    const criteria = (approval.approvalCriteria as Record<string, unknown>) || {};

    switch (intent) {
      case 'mint':
        if (fromList === 'Mint') out.push(approval);
        break;
      case 'deposit':
        if (criteria.allowBackedMinting === true && backingAddress &&
            fromList.includes(backingAddress) && !fromList.startsWith('!')) {
          out.push(approval);
        }
        break;
      case 'withdraw':
        if (criteria.allowBackedMinting === true && backingAddress &&
            toList.includes(backingAddress) && !toList.startsWith('!')) {
          out.push(approval);
        }
        break;
      case 'transfer':
        if (fromList !== 'Mint' && !criteria.allowBackedMinting) {
          if (fromList === 'All' || fromList === '!Mint' ||
              fromList.startsWith('!Mint:') ||
              (from && fromList.includes(from))) {
            out.push(approval);
          }
        }
        break;
    }
  }
  return out;
}

function findMatchingApproval(
  approvals: Array<Record<string, unknown>>,
  intent: string,
  from: string,
  to: string,
  backingAddress?: string
): Record<string, unknown> | null {
  for (const approval of approvals) {
    const fromList = (approval.fromListId as string) || '';
    const toList = (approval.toListId as string) || '';
    const criteria = (approval.approvalCriteria as Record<string, unknown>) || {};

    switch (intent) {
      case 'mint':
        if (fromList === 'Mint') return approval;
        break;
      case 'deposit':
        if (criteria.allowBackedMinting === true && backingAddress &&
            fromList.includes(backingAddress) && !fromList.startsWith('!')) {
          return approval;
        }
        break;
      case 'withdraw':
        if (criteria.allowBackedMinting === true && backingAddress &&
            toList.includes(backingAddress) && !toList.startsWith('!')) {
          return approval;
        }
        break;
      case 'transfer':
        // Match transfer approvals (non-mint, non-backing)
        if (fromList !== 'Mint' && !criteria.allowBackedMinting) {
          // Check the from matches
          if (fromList === 'All' || fromList === '!Mint' ||
              fromList.startsWith('!Mint:') ||
              (from && fromList.includes(from))) {
            return approval;
          }
        }
        break;
    }
  }
  return null;
}

/**
 * Build the transaction object for a specific approval candidate. Factored
 * out of `handleBuildTransfer` so the autoCheck fallback loop can try
 * multiple approvals without duplicating the transfer-assembly logic.
 */
function buildTransactionForApproval(params: {
  collectionId: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
  intent: string;
  tokenIds: Array<{ start: string; end: string }>;
  matchedApproval: Record<string, unknown>;
  backingAddress?: string;
  ibcPath?: Record<string, unknown> | null;
}): { transaction: BuildTransferResult['transaction']; explanation: BuildTransferResult['explanation'] } {
  const { collectionId, amount, fromAddress, toAddress, intent, tokenIds, matchedApproval, backingAddress, ibcPath } = params;

  const approvalId = (matchedApproval.approvalId as string) || '';
  const criteria = (matchedApproval.approvalCriteria as Record<string, unknown>) || {};
  const warnings: string[] = [];
  const steps: string[] = [];

  let transferFrom = fromAddress;
  if (intent === 'mint') {
    transferFrom = 'Mint';
  }

  const prioritizedApprovals: Array<{ approvalId: string; approvalLevel: string; approverAddress: string }> = [{
    approvalId,
    approvalLevel: 'collection',
    approverAddress: ''
  }];

  steps.push(`Using approval "${approvalId}" (${intent})`);
  steps.push(`prioritizedApprovals set to target this specific approval`);

  const transfer: Record<string, unknown> = {
    from: transferFrom,
    toAddresses: [toAddress],
    balances: [{
      amount,
      tokenIds,
      ownershipTimes: FOREVER
    }],
    prioritizedApprovals,
    onlyCheckPrioritizedApprovals: false
  };

  if (Array.isArray(criteria.coinTransfers) && criteria.coinTransfers.length > 0) {
    const coinTransfer = criteria.coinTransfers[0] as Record<string, unknown>;
    const payTo = (coinTransfer.to as string) || '';
    const coins = (coinTransfer.coins as Array<{ denom: string; amount: string }>) || [];
    if (coins.length > 0) {
      const coinDesc = coins.map(c => `${c.amount} ${c.denom}`).join(' + ');
      steps.push(`Payment required: ${coinDesc} to ${payTo}`);
      warnings.push(`Ensure the sender has sufficient ${coins[0].denom} for the payment`);
    }
  }

  const maxNum = criteria.maxNumTransfers as Record<string, unknown> | undefined;
  if (maxNum?.perInitiatedByAddressMaxNumTransfers &&
      maxNum.perInitiatedByAddressMaxNumTransfers !== '0') {
    steps.push(`Per-user limit: ${maxNum.perInitiatedByAddressMaxNumTransfers} transfer(s)`);
    warnings.push(`This address may have already used some of its ${maxNum.perInitiatedByAddressMaxNumTransfers} allowed transfers`);
  }

  const amounts = criteria.approvalAmounts as Record<string, unknown> | undefined;
  if (amounts?.overallApprovalAmount && amounts.overallApprovalAmount !== '0') {
    steps.push(`Total supply cap: ${amounts.overallApprovalAmount}`);
    warnings.push('Supply cap may have been partially used. Use simulate_transaction to verify.');
  }

  if (Array.isArray(criteria.mustOwnTokens) && criteria.mustOwnTokens.length > 0) {
    for (const mot of criteria.mustOwnTokens as Array<Record<string, unknown>>) {
      const motCollId = (mot.collectionId as string) || '?';
      const amtRange = (mot.amountRange as Record<string, unknown>) || {};
      steps.push(`Prerequisite: must own tokens from collection ${motCollId} (min amount: ${amtRange.start || '1'})`);
      warnings.push(`Use verify_ownership to confirm prerequisite ownership before sending`);
    }
  }

  if (intent === 'deposit') {
    steps.push(`IBC deposit: send ${ibcPath?.ibcDenom || 'IBC denom'} to backing address ${backingAddress}`);
    warnings.push('Backing deposits are handled by the protocol — the MsgTransferTokens triggers the IBC conversion');
  }
  if (intent === 'withdraw') {
    steps.push(`IBC withdrawal: sending collection tokens to backing address ${backingAddress} releases the underlying asset`);
  }

  const creatorAddress = intent === 'mint' ? toAddress : fromAddress;

  const transaction = {
    messages: [{
      typeUrl: '/tokenization.MsgTransferTokens',
      value: {
        creator: creatorAddress,
        collectionId,
        transfers: [transfer]
      }
    }],
    memo: '',
    fee: {
      amount: [{ denom: 'ubadge', amount: '5000' }],
      gas: '500000'
    }
  };

  return {
    transaction,
    explanation: { approvalUsed: approvalId, intent, steps, warnings }
  };
}

/**
 * Errors returned by `simulate_transaction` that indicate the chosen
 * approval is unusable at the current block — i.e. exhausted supply cap,
 * burned per-user limit, or expired ownership/transfer times. When we hit
 * one of these under `autoCheck: true`, buildTransfer will transparently
 * retry with the next approval candidate from `findAllMatchingApprovals`
 * rather than returning a known-broken transaction.
 */
const EXHAUSTED_APPROVAL_SIGNALS = [
  'predeterminedBalances exhausted',
  'exhausted',
  'approvalAmounts exhausted',
  'overallApprovalAmount',
  'maxNumTransfers',
  'per-user limit',
  'perInitiatedByAddressMaxNumTransfers',
  'transferTimes',
  'ownershipTimes',
  'approval is not valid at this time',
  'approval expired'
];

function isExhaustedApprovalError(sim: SimulateTransactionResult): boolean {
  const msg = (sim.simulationError || sim.error || '').toLowerCase();
  if (!msg) return false;
  return EXHAUSTED_APPROVAL_SIGNALS.some(s => msg.includes(s.toLowerCase()));
}

export async function handleBuildTransfer(input: BuildTransferInput): Promise<BuildTransferResult> {
  try {
    const { collectionId, amount = '1' } = input;
    const autoCheck = input.autoCheck !== false; // default true
    const fromAddress = input.fromAddress === 'Mint' ? 'Mint' : ensureBb1(input.fromAddress);
    const toAddress = ensureBb1(input.toAddress);

    // Query collection
    const response = await getCollections({
      collectionsToFetch: [{
        collectionId,
        metadataToFetch: { uris: [] },
        fetchTotalAndMintBalances: true
      }]
    });

    if (!response.success || !response.data?.collections?.[0]) {
      return {
        success: false,
        error: response.error || `Collection ${collectionId} not found`
      };
    }

    const collection = response.data.collections[0] as Record<string, unknown>;
    const validBadgeIds = (collection.validBadgeIds as Array<{ start: string; end: string }>) || [{ start: '1', end: '1' }];
    const rawApprovals = (collection.collectionApprovals as Array<Record<string, unknown>>) || [];
    const invariants = (collection.invariants as Record<string, unknown>) || {};
    const ibcPath = invariants.cosmosCoinBackedPath as Record<string, unknown> | null | undefined;
    const backingAddress = ibcPath?.backingAddress as string | undefined;

    // Detect intent
    const intent = input.intent || detectIntent(fromAddress, toAddress, collection);
    const tokenIds = input.tokenIds || validBadgeIds;

    // Find ALL matching approval candidates (the first is the "best", the
    // rest act as fallback in autoCheck mode when simulation reveals the
    // chosen one is exhausted).
    const candidates = findAllMatchingApprovals(rawApprovals, intent, fromAddress, toAddress, backingAddress);

    if (candidates.length === 0) {
      return {
        success: false,
        error: `No matching ${intent} approval found in collection ${collectionId}. Available approvals: ${rawApprovals.map(a => `"${a.approvalId}" (from: ${a.fromListId}, to: ${a.toListId})`).join(', ')}. Use analyze_collection for full details.`
      };
    }

    // First candidate — always build it. If autoCheck is off, we return
    // immediately. If it's on, we simulate and may fall back.
    const firstBuild = buildTransactionForApproval({
      collectionId, amount, fromAddress, toAddress, intent, tokenIds,
      matchedApproval: candidates[0], backingAddress, ibcPath
    });

    if (!autoCheck) {
      return {
        success: true,
        transaction: firstBuild.transaction,
        explanation: firstBuild.explanation
      };
    }

    // autoCheck path: simulate and fall back through remaining candidates
    // on exhausted-approval errors. We always return SOMETHING buildable —
    // if every candidate is exhausted, we return the first build with the
    // simulation result attached so the caller can see why.
    let currentBuild = firstBuild;
    let lastSim: SimulateTransactionResult | undefined;
    let fallbackUsed: string | undefined;

    for (let i = 0; i < candidates.length; i++) {
      if (i > 0) {
        currentBuild = buildTransactionForApproval({
          collectionId, amount, fromAddress, toAddress, intent, tokenIds,
          matchedApproval: candidates[i], backingAddress, ibcPath
        });
        fallbackUsed = (candidates[i].approvalId as string) || '';
      }

      lastSim = await simulateMessages({
        messages: currentBuild.transaction!.messages,
        memo: currentBuild.transaction!.memo,
        fee: currentBuild.transaction!.fee
      });

      // Transport-level failure (network, missing API key) — don't retry,
      // just return the build with the sim error attached. Matches the
      // ticket #143 "degrade gracefully" behavior.
      if (!lastSim.success) {
        return {
          success: true,
          transaction: currentBuild.transaction,
          explanation: currentBuild.explanation,
          simulation: lastSim
        };
      }

      // Chain says it's valid — we're done.
      if (lastSim.valid) {
        return {
          success: true,
          transaction: currentBuild.transaction,
          explanation: currentBuild.explanation,
          simulation: fallbackUsed ? { ...lastSim, fallbackUsed } : lastSim
        };
      }

      // Not valid. If it's an exhausted-approval error AND we have more
      // candidates, try the next one. Otherwise return this build with the
      // sim result so the caller can inspect.
      if (!isExhaustedApprovalError(lastSim) || i === candidates.length - 1) {
        return {
          success: true,
          transaction: currentBuild.transaction,
          explanation: currentBuild.explanation,
          simulation: fallbackUsed ? { ...lastSim, fallbackUsed } : lastSim
        };
      }

      // Fall through to the next candidate
      currentBuild.explanation!.steps.push(
        `Approval "${candidates[i].approvalId}" exhausted — trying next candidate`
      );
    }

    // Unreachable — the loop always returns — but satisfy the compiler.
    return {
      success: true,
      transaction: currentBuild.transaction,
      explanation: currentBuild.explanation,
      simulation: lastSim
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to build transfer: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
