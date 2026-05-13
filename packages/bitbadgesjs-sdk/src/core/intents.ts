/**
 * Intent Exchange helpers — lifted from the frontend's
 * `UserOutgoingApprovalRegistry.intentApproval` and
 * `components/intent/intentTypes.ts:buildFillTxsInfo`.
 *
 * Intents are a thin overlay on the user-outgoing-approval mechanism:
 * the creator sets a `MsgSetOutgoingApproval` that promises "I'll send
 * X of denomA if you send me Y of denomB". A filler triggers a 3-msg
 * tx (mint vehicle token → fire creator's outgoing approval → burn the
 * vehicle) to execute the swap.
 *
 * Intents live on a SPECIAL "intent exchange" collection — the
 * collection ID is per-network and lives in `INTENT_EXCHANGE_COLLECTION_IDS`
 * below. The token itself (id=1) is just a vehicle; the real swap is
 * encoded in the approval's two coinTransfers.
 */

import { AddressList } from './addressLists.js';
import { UintRangeArray } from './uintRanges.js';
import type { iUintRange } from '@/interfaces/types/core.js';

/**
 * Burn address used as the "to" on the vehicle-burn step of an intent
 * fill — mirrors the chain-side burn list.
 */
export const INTENT_BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

/**
 * Per-network collection ID where the global intent exchange lives.
 * Mirrors `INTENT_EXCHANGE_COLLECTION_ID` in the FE constants.
 */
export const INTENT_EXCHANGE_COLLECTION_IDS: Record<'mainnet' | 'testnet' | 'local', string> = {
  mainnet: '81',
  testnet: '24',
  local: '24'
};

export function intentExchangeCollectionId(network: 'mainnet' | 'testnet' | 'local'): string {
  return INTENT_EXCHANGE_COLLECTION_IDS[network];
}

// ── Intent approval factory ───────────────────────────────────────────────

export interface IntentApprovalArgs {
  /** The intent creator's bb1 address (becomes the approver). */
  address: string;
  /** Denom the creator OFFERS (pays to filler). */
  payDenom: string;
  /** Amount of payDenom (base units, bigint). */
  payAmount: bigint;
  /** Denom the creator EXPECTS in return. */
  receiveDenom: string;
  /** Amount of receiveDenom (base units, bigint). */
  receiveAmount: bigint;
  /** Active window for the intent — typically a single range. */
  transferTimes: UintRangeArray<bigint>;
  /** Approval id — caller picks; usually a fresh random hex string. */
  approvalId: string;
}

/**
 * Build the user-outgoing approval that represents an intent
 * ("I'll pay X for Y"). Returned shape matches `iUserOutgoingApproval`
 * proto fields exactly — no FE enrichment (no `toList` /
 * `initiatedByList` / `details`).
 *
 * Use with `MsgSetOutgoingApproval` to post the intent on-chain.
 */
export function buildIntentApproval(args: IntentApprovalArgs): Record<string, unknown> {
  const { address, payDenom, payAmount, receiveDenom, receiveAmount, transferTimes, approvalId } = args;
  const tokenIds: iUintRange<bigint>[] = [{ start: 1n, end: 1n }];

  return {
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes,
    tokenIds,
    ownershipTimes: UintRangeArray.FullRanges(),
    approvalId,
    version: 0n,
    approvalCriteria: {
      autoDeletionOptions: {
        afterOneUse: true,
        afterOverallMaxNumTransfers: true,
        allowCounterpartyPurge: false,
        allowPurgeIfExpired: true
      },
      requireToDoesNotEqualInitiatedBy: false,
      // No requireFromDoesNotEqualInitiatedBy — OutgoingApprovalCriteria
      // proto has no "from" require-checks (the "from" is always the user).
      coinTransfers: [
        // Filler pays creator the requested asset.
        {
          to: address,
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false,
          coins: [{ amount: receiveAmount, denom: receiveDenom }]
        },
        // Creator's wallet pays filler the offered asset (overrides
        // both from and to so the chain fills them with approver / initiator).
        {
          to: '',
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true,
          coins: [{ amount: payAmount, denom: payDenom }]
        }
      ],
      predeterminedBalances: {
        manualBalances: [],
        orderCalculationMethod: {
          useOverallNumTransfers: true,
          usePerToAddressNumTransfers: false,
          usePerFromAddressNumTransfers: false,
          usePerInitiatedByAddressNumTransfers: false,
          useMerkleChallengeLeafIndex: false,
          challengeTrackerId: ''
        },
        incrementedBalances: {
          startBalances: [{ amount: 1n, tokenIds, ownershipTimes: UintRangeArray.FullRanges() }],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n,
          allowOverrideTimestamp: false,
          allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: 0n,
          recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
        }
      },
      maxNumTransfers: {
        overallMaxNumTransfers: 1n,
        perToAddressMaxNumTransfers: 0n,
        perFromAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: 0n,
        amountTrackerId: approvalId,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      approvalAmounts: {
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 0n,
        amountTrackerId: approvalId,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      merkleChallenges: [],
      mustOwnTokens: [],
      dynamicStoreChallenges: [],
      ethSignatureChallenges: [],
      votingChallenges: [],
      evmQueryChallenges: []
      // OutgoingApprovalCriteria proto has NO requireFromEquals* fields
      // (the "from" is always the user themselves on an outgoing approval).
      // Don't add them — chain rejects.
    }
  };
}

// ── Fill (complete) helpers ───────────────────────────────────────────────

export interface IntentFillTarget {
  /** The approval id on the intent exchange collection. */
  approvalId: string;
  /** The intent creator's bb1 address (approval owner). */
  approverAddress: string;
}

interface FillMsg {
  typeUrl: '/tokenization.MsgTransferTokens';
  value: Record<string, unknown>;
}

const VEHICLE_BALANCE = {
  amount: '1',
  tokenIds: [{ start: '1', end: '1' }],
  ownershipTimes: [{ start: '1', end: '18446744073709551615' }]
};

/**
 * Build the 3-msg tx wrapper that fills a (non-prediction-market) intent.
 * The chain accepts these in order: mint vehicle → fire creator approval
 * (does the actual swap via the two coinTransfers) → burn vehicle.
 *
 * Returns a `{messages: [...]}` wrapper that pipes directly into `bb deploy`.
 */
export function buildIntentFillTx(
  fillerAddress: string,
  intent: IntentFillTarget,
  collectionId: string,
  burnAddress: string = INTENT_BURN_ADDRESS
): { messages: FillMsg[] } {
  const collectionIdStr = String(collectionId);
  const emptyPrioritized = {
    prioritizedApprovals: [] as Array<Record<string, unknown>>,
    onlyCheckPrioritizedCollectionApprovals: false,
    onlyCheckPrioritizedOutgoingApprovals: false,
    onlyCheckPrioritizedIncomingApprovals: false,
    memo: ''
  };

  return {
    messages: [
      // 1. Mint a vehicle token to the intent creator.
      {
        typeUrl: '/tokenization.MsgTransferTokens',
        value: {
          creator: fillerAddress,
          collectionId: collectionIdStr,
          transfers: [
            {
              from: 'Mint',
              toAddresses: [intent.approverAddress],
              balances: [VEHICLE_BALANCE],
              ...emptyPrioritized
            }
          ]
        }
      },
      // 2. Fire the creator's outgoing approval — this is where the
      // actual swap happens via the approval's two coinTransfers.
      {
        typeUrl: '/tokenization.MsgTransferTokens',
        value: {
          creator: fillerAddress,
          collectionId: collectionIdStr,
          transfers: [
            {
              from: intent.approverAddress,
              toAddresses: [fillerAddress],
              balances: [VEHICLE_BALANCE],
              prioritizedApprovals: [
                {
                  approvalId: intent.approvalId,
                  approvalLevel: 'outgoing',
                  approverAddress: intent.approverAddress,
                  version: '0'
                }
              ],
              onlyCheckPrioritizedCollectionApprovals: false,
              onlyCheckPrioritizedOutgoingApprovals: true,
              onlyCheckPrioritizedIncomingApprovals: false,
              memo: ''
            }
          ]
        }
      },
      // 3. Burn the vehicle.
      {
        typeUrl: '/tokenization.MsgTransferTokens',
        value: {
          creator: fillerAddress,
          collectionId: collectionIdStr,
          transfers: [
            {
              from: fillerAddress,
              toAddresses: [burnAddress],
              balances: [VEHICLE_BALANCE],
              ...emptyPrioritized
            }
          ]
        }
      }
    ]
  };
}
