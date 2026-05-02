/**
 * PaymentRequest presets — inverse of Bounty: agent-initiated payment
 * requests where the payer approves AND pays from their own wallet in a
 * single action. No escrow up front.
 *
 * Two approvals form the canonical PaymentRequest:
 *   - pay     — payer initiates → coin transfer fires from payer's wallet
 *               to the recipient. transferTimes [1, expirationMs].
 *   - deny    — payer initiates → no coin transfer; mints token vehicle
 *               to record denial state. transferTimes [1, expirationMs].
 *
 * Expiration is implicit: once the deadline passes, neither approval
 * can fire and the request becomes inert. No separate expire approval
 * is needed because there's no escrow to refund — the token vehicle
 * can stay un-minted forever and clients compute "expired" from the
 * current time.
 *
 * Key inversion vs. Bounty: pay's coinTransfer uses
 * `overrideFromWithApproverAddress: false` so the proto default routes
 * the `from` to the initiator (the payer, scoped via initiatedByListId).
 * No mintEscrowCoinsToTransfer at the collection level.
 */

import { z } from 'zod';
import type { Preset, RenderedApproval } from './types.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER_OWNERSHIP = [{ start: '1', end: MAX_UINT64 }];
const TOKEN_ID_1 = [{ start: '1', end: '1' }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

const PaymentRequestPayParams = z.object({
  approvalId: z.string().describe('Pre-generated unique id (typically "payment-request-pay_<random>"). Use generate_unique_id for the suffix.'),
  payer: z.string().describe('bb1... address of the human approver/payer. Used as initiatedByListId so only this address can execute the approval, and as the implicit coinTransfer "from" via the chain default.'),
  recipient: z.string().describe('bb1... address that receives the funds when the payer approves.'),
  denom: z.string().describe('ICS20 denom of the payment amount.'),
  amount: z.string().describe('Payment amount in BASE units of the denom (e.g. 10000000 for 10 USDC at 6 decimals).'),
  expirationMs: z.string().describe('Unix millisecond timestamp when the approval window closes. transferTimes runs [1, expirationMs].')
});
type PaymentRequestPayParams = z.infer<typeof PaymentRequestPayParams>;

const PaymentRequestDenyParams = z.object({
  approvalId: z.string().describe('Pre-generated unique id (typically "payment-request-deny_<random>").'),
  payer: z.string().describe('bb1... address of the payer. Same as the pay approval — both must share the same initiatedByListId.'),
  expirationMs: z.string().describe('Unix millisecond timestamp. transferTimes runs [1, expirationMs] (same window as pay).')
});
type PaymentRequestDenyParams = z.infer<typeof PaymentRequestDenyParams>;

const mintToBurnPredeterminedBalances = {
  manualBalances: [],
  incrementedBalances: {
    startBalances: [
      { amount: '1', tokenIds: TOKEN_ID_1, ownershipTimes: FOREVER_OWNERSHIP }
    ],
    incrementTokenIdsBy: '0',
    incrementOwnershipTimesBy: '0',
    durationFromTimestamp: '0',
    allowOverrideTimestamp: false,
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
};

function renderPay(p: PaymentRequestPayParams): RenderedApproval {
  return {
    fromListId: 'Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: p.payer,
    transferTimes: [{ start: '1', end: p.expirationMs }],
    tokenIds: TOKEN_ID_1,
    ownershipTimes: FOREVER_OWNERSHIP,
    approvalId: p.approvalId,
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      predeterminedBalances: mintToBurnPredeterminedBalances,
      coinTransfers: [
        {
          to: p.recipient,
          coins: [{ amount: p.amount, denom: p.denom }],
          // Inverse of Bounty: false → chain defaults coinTransfer.from to
          // the initiator (the payer, gated by initiatedByListId), so the
          // payer's wallet is debited at execution. No escrow.
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        }
      ],
      maxNumTransfers: {
        overallMaxNumTransfers: '1',
        perToAddressMaxNumTransfers: '0',
        perFromAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: p.approvalId,
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      merkleChallenges: [],
      mustOwnTokens: [],
      votingChallenges: [],
      mustPrioritize: false
    }
  };
}

function renderDeny(p: PaymentRequestDenyParams): RenderedApproval {
  return {
    fromListId: 'Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: p.payer,
    transferTimes: [{ start: '1', end: p.expirationMs }],
    tokenIds: TOKEN_ID_1,
    ownershipTimes: FOREVER_OWNERSHIP,
    approvalId: p.approvalId,
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      predeterminedBalances: mintToBurnPredeterminedBalances,
      maxNumTransfers: {
        overallMaxNumTransfers: '1',
        perToAddressMaxNumTransfers: '0',
        perFromAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: p.approvalId,
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      coinTransfers: [],
      merkleChallenges: [],
      mustOwnTokens: [],
      votingChallenges: [],
      mustPrioritize: false
    }
  };
}

export const PAYMENT_REQUEST_PRESETS: Preset<any>[] = [
  {
    presetId: 'payment-request.pay',
    skillId: 'payment-request',
    name: 'PaymentRequest — pay approval',
    description:
      'Payer initiates → mints 1x token ID 1 to burn, fires coinTransfer from payer to recipient. transferTimes [1, expiration]; initiatedByListId locks execution to the payer. overrideFromWithApproverAddress=false so the chain debits the initiator (payer) directly — no escrow. Pair with payment-request.deny.',
    paramsSchema: PaymentRequestPayParams,
    render: renderPay
  },
  {
    presetId: 'payment-request.deny',
    skillId: 'payment-request',
    name: 'PaymentRequest — deny approval',
    description:
      'Payer rejects → mints 1x token ID 1 to burn, no coin transfer. Just records the denial state for indexers/UIs. Same window and initiator as pay; separate approvalId.',
    paramsSchema: PaymentRequestDenyParams,
    render: renderDeny
  }
];
