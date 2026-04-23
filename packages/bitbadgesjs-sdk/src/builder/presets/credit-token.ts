/**
 * Credit Token presets.
 *
 * The modern Credit Token standard uses a SINGLE scaled approval with
 * `allowAmountScaling: true` — the frontend mint form multiplies at
 * purchase time, so one approval covers arbitrary quantities. This
 * supersedes the deprecated 8-10-tier pattern (credit-1, credit-5, …).
 *
 * Only CHAIN-MANDATED defaults live in the preset. Product decisions
 * (payment denom, recipient, per-unit rate) come from params.
 */

import { z } from 'zod';
import type { Preset, RenderedApproval } from './types.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER: { start: string; end: string }[] = [{ start: '1', end: MAX_UINT64 }];
const TOKEN_ID_1: { start: string; end: string }[] = [{ start: '1', end: '1' }];

/** Params for the `credit-token.scaled` preset. */
const ScaledParams = z.object({
  paymentDenom: z.string().describe('ICS20 denom users pay in (e.g. an ibc/... hash or a native denom).'),
  paymentRecipient: z.string().describe('bb1... address that receives payments.'),
  tokensPerUnit: z.string().describe(
    'Tokens minted per ONE base unit of payment (both typically 6 decimals, so "100" means 1 USDC → 100 TOKEN).'
  )
});
type ScaledParams = z.infer<typeof ScaledParams>;

function renderScaled(p: ScaledParams): RenderedApproval {
  return {
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    tokenIds: TOKEN_ID_1,
    ownershipTimes: FOREVER,
    approvalId: 'credit-scaled',
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: [
            {
              amount: p.tokensPerUnit,
              tokenIds: TOKEN_ID_1,
              ownershipTimes: FOREVER
            }
          ],
          incrementTokenIdsBy: '0',
          incrementOwnershipTimesBy: '0',
          durationFromTimestamp: '0',
          allowOverrideTimestamp: false,
          recurringOwnershipTimes: { startTime: '0', intervalLength: '0', chargePeriodLength: '0' },
          allowOverrideWithAnyValidToken: false,
          allowAmountScaling: true,
          maxScalingMultiplier: MAX_UINT64
        },
        orderCalculationMethod: {
          useOverallNumTransfers: true,
          usePerToAddressNumTransfers: false,
          usePerFromAddressNumTransfers: false,
          usePerInitiatedByAddressNumTransfers: false,
          useMerkleChallengeLeafIndex: false,
          challengeTrackerId: ''
        }
      },
      approvalAmounts: {
        overallApprovalAmount: '0',
        perToAddressApprovalAmount: '0',
        perFromAddressApprovalAmount: '0',
        perInitiatedByAddressApprovalAmount: '0',
        amountTrackerId: 'credit-scaled',
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      maxNumTransfers: {
        overallMaxNumTransfers: '0',
        perToAddressMaxNumTransfers: '0',
        perFromAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: 'credit-scaled',
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      coinTransfers: [
        {
          to: p.paymentRecipient,
          coins: [{ amount: '1', denom: p.paymentDenom }],
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        }
      ],
      merkleChallenges: [],
      mustOwnTokens: [],
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: false,
      mustPrioritize: true
    }
  };
}

export const CREDIT_TOKEN_PRESETS: Preset<any>[] = [
  {
    presetId: 'credit-token.scaled',
    skillId: 'credit-token',
    name: 'Credit Token — scaled purchase approval',
    description:
      'Single approval with allowAmountScaling:true. Users purchase any quantity; the frontend multiplies coinTransfers and startBalances by the requested amount at mint time. Supersedes the deprecated 8-10-tier pattern.',
    paramsSchema: ScaledParams,
    render: renderScaled
  }
];
