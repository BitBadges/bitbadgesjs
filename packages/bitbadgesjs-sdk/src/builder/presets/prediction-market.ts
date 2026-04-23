/**
 * Prediction Market presets — the 7 approvals that constitute a
 * yes/no market:
 *
 *   1. paired-mint           — deposit USDC → mint 1 YES + 1 NO
 *   2. transferable          — free peer-to-peer transfer of YES/NO
 *   3. pre-settlement-redeem — burn 1 YES + 1 NO → 1 USDC (arbitrage path)
 *   4. yes-wins              — verifier votes yes → burn YES → 1 USDC
 *   5. no-wins               — verifier votes no  → burn NO  → 1 USDC
 *   6. push-yes              — indeterminate → burn YES → 0.5 USDC
 *   7. push-no               — indeterminate → burn NO  → 0.5 USDC
 *
 * Chain-mandated structure is extensive (per-approval
 * predeterminedBalances, mustPrioritize rules, voting challenges on
 * outcome-gated approvals). Params capture only the product decisions:
 * USDC denom, verifier address, per-payout amounts.
 *
 * NOTE: All approval IDs here are FIXED strings. The prediction-market
 * frontend indexes by exact id for outcome routing, so this differs
 * from bounty where random suffixes are fine.
 */

import { z } from 'zod';
import type { Preset, RenderedApproval } from './types.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];
const TOKEN_1 = [{ start: '1', end: '1' }];
const TOKEN_2 = [{ start: '2', end: '2' }];
const TOKEN_1_TO_2 = [{ start: '1', end: '2' }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

function orderCalc(): Record<string, unknown> {
  return {
    useOverallNumTransfers: true,
    usePerToAddressNumTransfers: false,
    usePerFromAddressNumTransfers: false,
    usePerInitiatedByAddressNumTransfers: false,
    useMerkleChallengeLeafIndex: false,
    challengeTrackerId: ''
  };
}

function incrementedBalances(startBalances: Array<Record<string, unknown>>): Record<string, unknown> {
  return {
    startBalances,
    incrementTokenIdsBy: '0',
    incrementOwnershipTimesBy: '0',
    durationFromTimestamp: '0',
    allowOverrideTimestamp: false,
    recurringOwnershipTimes: { startTime: '0', intervalLength: '0', chargePeriodLength: '0' },
    allowOverrideWithAnyValidToken: false
  };
}

function maxOneShotTrackedAs(id: string, overall = MAX_UINT64): Record<string, unknown> {
  return {
    overallMaxNumTransfers: overall,
    perFromAddressMaxNumTransfers: '0',
    perToAddressMaxNumTransfers: '0',
    perInitiatedByAddressMaxNumTransfers: '0',
    amountTrackerId: id,
    resetTimeIntervals: { startTime: '0', intervalLength: '0' }
  };
}

/* ───────────── Paired Mint ───────────── */

const PairedMintParams = z.object({
  usdcDenom: z.string().describe('USDC IBC denom (full "ibc/..." hash). Used for the 1 USDC deposit coinTransfer.')
});
type PairedMintParams = z.infer<typeof PairedMintParams>;

function renderPairedMint(p: PairedMintParams): RenderedApproval {
  return {
    approvalId: 'paired-mint',
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    tokenIds: TOKEN_1_TO_2,
    ownershipTimes: FOREVER,
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: false,
      mustPrioritize: true,
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: incrementedBalances([
          { amount: '1', tokenIds: TOKEN_1, ownershipTimes: FOREVER },
          { amount: '1', tokenIds: TOKEN_2, ownershipTimes: FOREVER }
        ]),
        orderCalculationMethod: orderCalc()
      },
      coinTransfers: [
        {
          to: 'Mint',
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false,
          coins: [{ amount: '1000000', denom: p.usdcDenom }]
        }
      ],
      merkleChallenges: [],
      mustOwnTokens: [],
      votingChallenges: [],
      maxNumTransfers: maxOneShotTrackedAs('paired-mint'),
      approvalAmounts: {
        overallApprovalAmount: '0',
        perFromAddressApprovalAmount: '0',
        perToAddressApprovalAmount: '0',
        perInitiatedByAddressApprovalAmount: '0',
        amountTrackerId: 'paired-mint',
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      }
    }
  };
}

/* ───────────── Transferable ───────────── */

function renderTransferable(_: Record<string, never>): RenderedApproval {
  return {
    approvalId: 'transferable',
    fromListId: '!Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    tokenIds: TOKEN_1_TO_2,
    ownershipTimes: FOREVER,
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: false,
      overridesToIncomingApprovals: false,
      mustPrioritize: false,
      merkleChallenges: [],
      mustOwnTokens: [],
      votingChallenges: []
    }
  };
}

/* ───────────── Settlement Approvals (shared shape) ───────────── */

/**
 * Settlement approvals all look the same modulo:
 *   - approvalId / amountTrackerId
 *   - tokenIds (1 for YES, 2 for NO, both for pre-settlement-redeem)
 *   - coinTransfers amount (1M for full-payout, 500K for push)
 *   - votingChallenges presence + proposalId + verifierAddress
 */
interface SettlementConfig {
  approvalId: string;
  tokenIds: Array<{ start: string; end: string }>;
  startBalances: Array<Record<string, unknown>>;
  payoutAmount: string;
  proposalId?: string;
  verifierAddress?: string;
}

function renderSettlement(p: SettlementConfig, usdcDenom: string): RenderedApproval {
  const votingChallenges =
    p.proposalId && p.verifierAddress
      ? [
          {
            proposalId: p.proposalId,
            quorumThreshold: '100',
            voters: [{ address: p.verifierAddress, weight: '1' }]
          }
        ]
      : [];
  return {
    approvalId: p.approvalId,
    fromListId: '!Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    tokenIds: p.tokenIds,
    ownershipTimes: FOREVER,
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: false,
      mustPrioritize: true,
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: incrementedBalances(p.startBalances),
        orderCalculationMethod: orderCalc()
      },
      coinTransfers: [
        {
          to: '',
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true,
          coins: [{ amount: p.payoutAmount, denom: usdcDenom }]
        }
      ],
      merkleChallenges: [],
      mustOwnTokens: [],
      votingChallenges,
      maxNumTransfers: maxOneShotTrackedAs(p.approvalId),
      approvalAmounts: {
        overallApprovalAmount: '0',
        perFromAddressApprovalAmount: '0',
        perToAddressApprovalAmount: '0',
        perInitiatedByAddressApprovalAmount: '0',
        amountTrackerId: p.approvalId,
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      }
    }
  };
}

const UsdcOnlyParams = z.object({
  usdcDenom: z.string().describe('USDC IBC denom.')
});
type UsdcOnlyParams = z.infer<typeof UsdcOnlyParams>;

function renderPreSettlement(p: UsdcOnlyParams): RenderedApproval {
  return renderSettlement(
    {
      approvalId: 'pre-settlement-redeem',
      tokenIds: TOKEN_1_TO_2,
      startBalances: [
        { amount: '1', tokenIds: TOKEN_1, ownershipTimes: FOREVER },
        { amount: '1', tokenIds: TOKEN_2, ownershipTimes: FOREVER }
      ],
      payoutAmount: '1000000'
    },
    p.usdcDenom
  );
}

const OutcomeParams = z.object({
  usdcDenom: z.string().describe('USDC IBC denom.'),
  verifierAddress: z.string().describe('bb1... verifier who votes on outcome.')
});
type OutcomeParams = z.infer<typeof OutcomeParams>;

function renderYesWins(p: OutcomeParams): RenderedApproval {
  return renderSettlement(
    {
      approvalId: 'yes-wins',
      tokenIds: TOKEN_1,
      startBalances: [{ amount: '1', tokenIds: TOKEN_1, ownershipTimes: FOREVER }],
      payoutAmount: '1000000',
      proposalId: 'yes-wins-proposal',
      verifierAddress: p.verifierAddress
    },
    p.usdcDenom
  );
}

function renderNoWins(p: OutcomeParams): RenderedApproval {
  return renderSettlement(
    {
      approvalId: 'no-wins',
      tokenIds: TOKEN_2,
      startBalances: [{ amount: '1', tokenIds: TOKEN_2, ownershipTimes: FOREVER }],
      payoutAmount: '1000000',
      proposalId: 'no-wins-proposal',
      verifierAddress: p.verifierAddress
    },
    p.usdcDenom
  );
}

function renderPushYes(p: OutcomeParams): RenderedApproval {
  return renderSettlement(
    {
      approvalId: 'push-yes',
      tokenIds: TOKEN_1,
      startBalances: [{ amount: '1', tokenIds: TOKEN_1, ownershipTimes: FOREVER }],
      payoutAmount: '500000',
      proposalId: 'push-yes-proposal',
      verifierAddress: p.verifierAddress
    },
    p.usdcDenom
  );
}

function renderPushNo(p: OutcomeParams): RenderedApproval {
  return renderSettlement(
    {
      approvalId: 'push-no',
      tokenIds: TOKEN_2,
      startBalances: [{ amount: '1', tokenIds: TOKEN_2, ownershipTimes: FOREVER }],
      payoutAmount: '500000',
      proposalId: 'push-no-proposal',
      verifierAddress: p.verifierAddress
    },
    p.usdcDenom
  );
}

export const PREDICTION_MARKET_PRESETS: Preset<any>[] = [
  {
    presetId: 'prediction-market.paired-mint',
    skillId: 'prediction-market',
    name: 'Prediction Market — paired mint (deposit 1 USDC → 1 YES + 1 NO)',
    description:
      'User deposits 1 USDC and receives 1 YES (token 1) + 1 NO (token 2). Coins go to "Mint" which chain auto-resolves to the mintEscrowAddress.',
    paramsSchema: PairedMintParams,
    render: renderPairedMint
  },
  {
    presetId: 'prediction-market.transferable',
    skillId: 'prediction-market',
    name: 'Prediction Market — freely transferable',
    description:
      'Peer-to-peer transfer of YES/NO shares between non-Mint addresses. No coinTransfers, no voting — just auto-approve scan.',
    paramsSchema: z.object({}),
    render: renderTransferable
  },
  {
    presetId: 'prediction-market.pre-settlement-redeem',
    skillId: 'prediction-market',
    name: 'Prediction Market — pre-settlement redemption (1 YES + 1 NO → 1 USDC)',
    description:
      'Arbitrage path: holder burns 1 YES + 1 NO and receives 1 USDC from escrow. Available BEFORE outcome is decided.',
    paramsSchema: UsdcOnlyParams,
    render: renderPreSettlement
  },
  {
    presetId: 'prediction-market.yes-wins',
    skillId: 'prediction-market',
    name: 'Prediction Market — YES wins settlement (burn YES → 1 USDC)',
    description:
      'Active after verifier votes yes on proposalId "yes-wins-proposal". Holders burn 1 YES token → receive 1 USDC.',
    paramsSchema: OutcomeParams,
    render: renderYesWins
  },
  {
    presetId: 'prediction-market.no-wins',
    skillId: 'prediction-market',
    name: 'Prediction Market — NO wins settlement (burn NO → 1 USDC)',
    description:
      'Active after verifier votes yes on proposalId "no-wins-proposal". Holders burn 1 NO token → receive 1 USDC.',
    paramsSchema: OutcomeParams,
    render: renderNoWins
  },
  {
    presetId: 'prediction-market.push-yes',
    skillId: 'prediction-market',
    name: 'Prediction Market — push YES (indeterminate outcome, YES → 0.5 USDC)',
    description:
      'Fallback: if the market is ruled indeterminate via "push-yes-proposal", holders burn YES → 0.5 USDC.',
    paramsSchema: OutcomeParams,
    render: renderPushYes
  },
  {
    presetId: 'prediction-market.push-no',
    skillId: 'prediction-market',
    name: 'Prediction Market — push NO (indeterminate outcome, NO → 0.5 USDC)',
    description:
      'Fallback: if the market is ruled indeterminate via "push-no-proposal", holders burn NO → 0.5 USDC.',
    paramsSchema: OutcomeParams,
    render: renderPushNo
  }
];
