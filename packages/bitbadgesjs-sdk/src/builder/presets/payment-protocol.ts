/**
 * Payment Protocol presets. Approach 1 (coinTransfer-based):
 * one approval per invoice/milestone/bounty line item, wired with
 * coinTransfers for payment.
 *
 * Escrow-style payment protocol builds (Approach 2) use the smart-token
 * skill — presets for those belong there.
 */

import { z } from 'zod';
import type { Preset, RenderedApproval } from './types.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];
const TOKEN_ID_1 = [{ start: '1', end: '1' }];

const InvoiceParams = z.object({
  approvalId: z.string().describe('Unique invoice/milestone id (e.g. "invoice-1", "milestone-frontend-done"). Used as amountTrackerId too.'),
  payerAddress: z.string().describe('bb1... payer address — initiatedByListId is restricted to this address so only the payer can trigger payment.'),
  payeeAddress: z.string().describe('bb1... payee address — receives the coins.'),
  amount: z.string().describe('Invoice amount in BASE units of the denom.'),
  denom: z.string().describe('Payment denom.')
});
type InvoiceParams = z.infer<typeof InvoiceParams>;

function renderInvoice(p: InvoiceParams): RenderedApproval {
  return {
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: p.payerAddress,
    transferTimes: FOREVER,
    tokenIds: TOKEN_ID_1,
    ownershipTimes: FOREVER,
    approvalId: p.approvalId,
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      coinTransfers: [
        {
          to: p.payeeAddress,
          coins: [{ amount: p.amount, denom: p.denom }],
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        }
      ],
      maxNumTransfers: {
        overallMaxNumTransfers: '1',
        perFromAddressMaxNumTransfers: '0',
        perToAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: p.approvalId,
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      }
    }
  };
}

export const PAYMENT_PROTOCOL_PRESETS: Preset<any>[] = [
  {
    presetId: 'payment-protocol.invoice',
    skillId: 'payment-protocol',
    name: 'Payment Protocol — one-shot invoice/milestone approval',
    description:
      "One approval per invoice/milestone/bounty line. Payer-gated (initiatedByListId = payer), pays the payee directly, maxNumTransfers=1 (one-shot). Standards should include ListView:Invoice Requests or ListView:Milestones or ListView:Bounties. Use this for SIMPLE one-shot payments; for escrow/hold-and-release use the smart-token skill's escrow pattern (Approach 2 in the skill doc).",
    paramsSchema: InvoiceParams,
    render: renderInvoice
  }
];
