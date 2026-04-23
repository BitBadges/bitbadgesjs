/**
 * Subscription presets. One approval covers the canonical faucet:
 * Mint → All with durationFromTimestamp set (subscription length),
 * allowOverrideTimestamp true (each mint gets its own window).
 */

import { z } from 'zod';
import type { Preset, RenderedApproval } from './types.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];
const TOKEN_ID_1 = [{ start: '1', end: '1' }];

export const SUBSCRIPTION_DURATIONS = {
  daily: '86400000',
  monthly: '2592000000',
  annual: '31536000000'
} as const;

const FaucetParams = z.object({
  paymentRecipient: z.string().describe('bb1... address that receives subscription payments.'),
  paymentDenom: z.string().describe('ICS20 denom users pay in (e.g. ibc/... hash or native denom like "ubadge", "uatom").'),
  paymentAmount: z.string().describe('Payment amount per period in BASE units of the denom (e.g. "5000000000" for 5 ATOM at 6 decimals).'),
  durationMs: z.string().describe('Subscription period in ms. Common: "86400000" (daily), "2592000000" (monthly, 30d), "31536000000" (annual, 365d).')
});
type FaucetParams = z.infer<typeof FaucetParams>;

function renderFaucet(p: FaucetParams): RenderedApproval {
  return {
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    tokenIds: TOKEN_ID_1,
    ownershipTimes: FOREVER,
    approvalId: 'subscription-mint',
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      coinTransfers: [
        {
          to: p.paymentRecipient,
          coins: [{ amount: p.paymentAmount, denom: p.paymentDenom }],
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        }
      ],
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: [{ amount: '1', tokenIds: TOKEN_ID_1, ownershipTimes: FOREVER }],
          incrementTokenIdsBy: '0',
          incrementOwnershipTimesBy: '0',
          durationFromTimestamp: p.durationMs,
          allowOverrideTimestamp: true,
          recurringOwnershipTimes: { startTime: '0', intervalLength: '0', chargePeriodLength: '0' },
          allowOverrideWithAnyValidToken: false
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
      merkleChallenges: []
    }
  };
}

export const SUBSCRIPTION_PRESETS: Preset<any>[] = [
  {
    presetId: 'subscription.faucet',
    skillId: 'subscription',
    name: 'Subscription — periodic faucet',
    description:
      'Canonical subscription faucet: user pays once, gets a token with a time-bounded ownershipTime window. durationFromTimestamp + allowOverrideTimestamp wire the chain to mint a fresh window each time. Duration is in ms — use "86400000" (daily), "2592000000" (monthly), or "31536000000" (annual).',
    paramsSchema: FaucetParams,
    render: renderFaucet
  }
];
