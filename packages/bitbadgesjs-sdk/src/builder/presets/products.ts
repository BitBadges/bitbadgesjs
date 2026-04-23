/**
 * Products presets. One purchase approval per product (LLM calls this
 * N times, once per product). Plus one shared burn approval.
 *
 * Products are storefront-style: each product is its own token ID,
 * has its own price, supply limit, and optional burn-on-purchase.
 */

import { z } from 'zod';
import type { Preset, RenderedApproval } from './types.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

const PurchaseParams = z.object({
  productIndex: z
    .number()
    .int()
    .min(1)
    .describe('1-based index of the product (token ID). approvalId becomes "product-purchase-<N>".'),
  storeAddress: z.string().describe('bb1... store owner address — receives payments.'),
  priceAmount: z.string().describe('Price in BASE units of the denom.'),
  denom: z.string().describe('Payment denom (e.g. "ubadge", "uatom", or an "ibc/..." hash).'),
  supplyLimit: z
    .string()
    .describe('Max copies available ("0" for unlimited, else the cap as a string number).'),
  burnOnPurchase: z
    .boolean()
    .describe('If true, token is minted directly to burn address (buyer never holds it — transaction is the receipt). If false, buyer holds the token.')
});
type PurchaseParams = z.infer<typeof PurchaseParams>;

function renderPurchase(p: PurchaseParams): RenderedApproval {
  const idx = String(p.productIndex);
  const tokenIds = [{ start: idx, end: idx }];
  return {
    fromListId: 'Mint',
    toListId: p.burnOnPurchase ? BURN_ADDRESS : 'All',
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    tokenIds,
    ownershipTimes: FOREVER,
    approvalId: `product-purchase-${idx}`,
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      coinTransfers: [
        {
          to: p.storeAddress,
          coins: [{ amount: p.priceAmount, denom: p.denom }],
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        }
      ],
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: [{ amount: '1', tokenIds, ownershipTimes: FOREVER }],
          incrementTokenIdsBy: '0',
          incrementOwnershipTimesBy: '0',
          durationFromTimestamp: '0',
          allowOverrideTimestamp: false,
          recurringOwnershipTimes: { startTime: '0', intervalLength: '0', chargePeriodLength: '0' },
          allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: '0'
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
      maxNumTransfers: {
        overallMaxNumTransfers: p.supplyLimit,
        perFromAddressMaxNumTransfers: '0',
        perToAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: `product-purchase-${idx}`,
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      merkleChallenges: [],
      mustOwnTokens: [],
      votingChallenges: []
    }
  };
}

const BurnParams = z.object({
  numProducts: z
    .number()
    .int()
    .min(1)
    .describe('Total number of products — burn approval covers token IDs 1..N.')
});
type BurnParams = z.infer<typeof BurnParams>;

function renderBurn(p: BurnParams): RenderedApproval {
  return {
    fromListId: '!Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    tokenIds: [{ start: '1', end: String(p.numProducts) }],
    ownershipTimes: FOREVER,
    approvalId: 'product-burn',
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      coinTransfers: [],
      merkleChallenges: [],
      mustOwnTokens: [],
      votingChallenges: []
    }
  };
}

export const PRODUCTS_PRESETS: Preset<any>[] = [
  {
    presetId: 'products.purchase',
    skillId: 'product-catalog',
    name: 'Products — per-product purchase approval',
    description:
      'One purchase approval per product. Payment flows DIRECTLY to the store address (no escrow, overrideFromWithApproverAddress:false). Fixed price per product; supplyLimit="0" means unlimited. burnOnPurchase:true sends the minted token to burn instead of to the buyer — transaction itself is the receipt.',
    paramsSchema: PurchaseParams,
    render: renderPurchase
  },
  {
    presetId: 'products.burn',
    skillId: 'product-catalog',
    name: 'Products — optional burn approval (holders can burn any product)',
    description:
      'Anyone can burn any product token (IDs 1..numProducts) to the burn address. Useful as redemption — e.g. holder burns a "ticket" product to redeem an event entry.',
    paramsSchema: BurnParams,
    render: renderBurn
  }
];
