/**
 * Crowdfund presets — 4 approvals:
 *   - deposit-refund:    contributor pays coins → receives Token 1 (refund token)
 *   - deposit-progress:  paired — mints Token 2 to crowdfunder (no coinTransfer)
 *   - success-withdraw:  crowdfunder withdraws escrow AFTER deadline IF goal met
 *   - refund:            contributor burns Token 1 → receives refund AFTER deadline IF goal NOT met
 *
 * Token IDs: 1 = Refund token (contributor), 2 = Progress token (crowdfunder).
 * Goal is tracked via mustOwnTokens against collectionId "0" (self-reference).
 * All 4 approvals use allowAmountScaling:true so the contributor can choose deposit size.
 */

import { z } from 'zod';
import type { Preset, RenderedApproval } from './types.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];
const TOKEN_1 = [{ start: '1', end: '1' }];
const TOKEN_2 = [{ start: '2', end: '2' }];
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

function scaledBalances(startBalances: Array<Record<string, unknown>>): Record<string, unknown> {
  return {
    startBalances,
    allowAmountScaling: true,
    maxScalingMultiplier: MAX_UINT64,
    incrementTokenIdsBy: '0',
    incrementOwnershipTimesBy: '0',
    durationFromTimestamp: '0',
    allowOverrideTimestamp: false,
    recurringOwnershipTimes: { startTime: '0', intervalLength: '0', chargePeriodLength: '0' },
    allowOverrideWithAnyValidToken: false
  };
}

const DepositParams = z.object({
  denom: z.string().describe('Deposit denom (e.g. "ibc/..." hash for USDC).'),
  deadlineMs: z.string().describe('Unix ms timestamp when crowdfund closes.'),
  crowdfunderAddress: z.string().describe('bb1... address of the crowdfunder (receives Token 2 / withdraws funds).')
});
type DepositParams = z.infer<typeof DepositParams>;

function renderDepositRefund(p: DepositParams): RenderedApproval {
  return {
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: [{ start: '1', end: p.deadlineMs }],
    tokenIds: TOKEN_1,
    ownershipTimes: FOREVER,
    approvalId: 'deposit-refund',
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      requireToEqualsInitiatedBy: true,
      coinTransfers: [
        {
          to: 'Mint',
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false,
          coins: [{ amount: '1', denom: p.denom }]
        }
      ],
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: scaledBalances([
          { amount: '1', tokenIds: TOKEN_1, ownershipTimes: FOREVER }
        ]),
        orderCalculationMethod: orderCalc()
      },
      maxNumTransfers: {
        overallMaxNumTransfers: '0',
        perFromAddressMaxNumTransfers: '0',
        perToAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: 'deposit-refund',
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      merkleChallenges: [],
      mustOwnTokens: [],
      votingChallenges: []
    }
  };
}

function renderDepositProgress(p: DepositParams): RenderedApproval {
  return {
    fromListId: 'Mint',
    toListId: p.crowdfunderAddress,
    initiatedByListId: 'All',
    transferTimes: [{ start: '1', end: p.deadlineMs }],
    tokenIds: TOKEN_2,
    ownershipTimes: FOREVER,
    approvalId: 'deposit-progress',
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      coinTransfers: [],
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: scaledBalances([
          { amount: '1', tokenIds: TOKEN_2, ownershipTimes: FOREVER }
        ]),
        orderCalculationMethod: orderCalc()
      },
      maxNumTransfers: {
        overallMaxNumTransfers: '0',
        perFromAddressMaxNumTransfers: '0',
        perToAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: 'deposit-progress',
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      merkleChallenges: [],
      mustOwnTokens: [],
      votingChallenges: []
    }
  };
}

const SettlementParams = z.object({
  denom: z.string().describe('Deposit denom.'),
  deadlineMs: z.string().describe('Unix ms timestamp when crowdfund closes.'),
  crowdfunderAddress: z.string().describe('bb1... crowdfunder address (checked in mustOwnTokens).'),
  goalAmount: z.string().describe('Goal in BASE units of the denom — the crowdfunder needs >= this much of Token 2 to withdraw; contributors need the crowdfunder to have < this for refunds.')
});
type SettlementParams = z.infer<typeof SettlementParams>;

function renderSuccess(p: SettlementParams): RenderedApproval {
  const goalMinusOne = (BigInt(p.goalAmount) - 1n).toString();
  void goalMinusOne; // only used for refund
  return {
    fromListId: 'Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: p.crowdfunderAddress,
    transferTimes: [{ start: (BigInt(p.deadlineMs) + 1n).toString(), end: MAX_UINT64 }],
    tokenIds: TOKEN_1,
    ownershipTimes: FOREVER,
    approvalId: 'success-withdraw',
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      coinTransfers: [
        {
          to: p.crowdfunderAddress,
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: false,
          coins: [{ amount: '1', denom: p.denom }]
        }
      ],
      mustOwnTokens: [
        {
          collectionId: '0',
          tokenIds: TOKEN_2,
          amountRange: { start: p.goalAmount, end: MAX_UINT64 },
          ownershipCheckParty: p.crowdfunderAddress
        }
      ],
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: scaledBalances([
          { amount: '1', tokenIds: TOKEN_1, ownershipTimes: FOREVER }
        ]),
        orderCalculationMethod: orderCalc()
      },
      maxNumTransfers: {
        overallMaxNumTransfers: '1',
        perFromAddressMaxNumTransfers: '0',
        perToAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: 'success-withdraw',
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      merkleChallenges: [],
      votingChallenges: []
    }
  };
}

function renderRefund(p: SettlementParams): RenderedApproval {
  const goalMinusOne = (BigInt(p.goalAmount) - 1n).toString();
  return {
    fromListId: '!Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: 'All',
    transferTimes: [{ start: (BigInt(p.deadlineMs) + 1n).toString(), end: MAX_UINT64 }],
    tokenIds: TOKEN_1,
    ownershipTimes: FOREVER,
    approvalId: 'refund',
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      coinTransfers: [
        {
          to: '',
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true,
          coins: [{ amount: '1', denom: p.denom }]
        }
      ],
      mustOwnTokens: [
        {
          collectionId: '0',
          tokenIds: TOKEN_2,
          amountRange: { start: '0', end: goalMinusOne },
          ownershipCheckParty: p.crowdfunderAddress
        }
      ],
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: scaledBalances([
          { amount: '1', tokenIds: TOKEN_1, ownershipTimes: FOREVER }
        ]),
        orderCalculationMethod: orderCalc()
      },
      maxNumTransfers: {
        overallMaxNumTransfers: MAX_UINT64,
        perFromAddressMaxNumTransfers: '0',
        perToAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: 'refund',
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      merkleChallenges: [],
      votingChallenges: []
    }
  };
}

export const CROWDFUND_PRESETS: Preset<any>[] = [
  {
    presetId: 'crowdfund.deposit-refund',
    skillId: 'crowdfund',
    name: 'Crowdfund — deposit-refund (contributor pays → gets refund token)',
    description:
      'Contributor pays coins and receives Token 1 (refund token, one per unit deposited). allowAmountScaling:true lets the contributor choose their deposit size. requireToEqualsInitiatedBy:true ensures the contributor receives their own refund token. Coins go to "Mint" (auto-resolves to escrow).',
    paramsSchema: DepositParams,
    render: renderDepositRefund
  },
  {
    presetId: 'crowdfund.deposit-progress',
    skillId: 'crowdfund',
    name: 'Crowdfund — deposit-progress (paired: mints progress token to crowdfunder)',
    description:
      'Paired with deposit-refund. Mints Token 2 (progress token) to the crowdfunder for each deposit — this is what mustOwnTokens checks against the goal. toListId = crowdfunder address. No coinTransfers.',
    paramsSchema: DepositParams,
    render: renderDepositProgress
  },
  {
    presetId: 'crowdfund.success-withdraw',
    skillId: 'crowdfund',
    name: 'Crowdfund — success/withdraw (crowdfunder takes funds if goal met)',
    description:
      'After the deadline, if the crowdfunder owns >= goal of Token 2, they can withdraw escrow to themselves. mustOwnTokens with collectionId:"0" = self-reference. transferTimes begin at deadlineMs+1.',
    paramsSchema: SettlementParams,
    render: renderSuccess
  },
  {
    presetId: 'crowdfund.refund',
    skillId: 'crowdfund',
    name: 'Crowdfund — refund (contributors redeem if goal NOT met)',
    description:
      'After the deadline, if the crowdfunder owns LESS than goal, contributors can burn their Token 1 to receive a proportional refund. overrideFromWithApproverAddress + overrideToWithInitiator route escrow → contributor. transferTimes begin at deadlineMs+1.',
    paramsSchema: SettlementParams,
    render: renderRefund
  }
];
