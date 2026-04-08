/**
 * Subscription builder — creates a MsgUniversalUpdateCollection for recurring subscription tokens.
 * @module core/builders/subscription
 */
import {
  FOREVER,
  resolveCoin,
  toBaseUnits,
  parseDuration,
  buildMsg,
  emptyPermissions,
  defaultBalances
} from './shared.js';

export interface SubscriptionPayout {
  recipient: string; // bb1... payout address
  amount: number; // display units per interval
  denom: string; // USDC, BADGE
}

export interface SubscriptionParams {
  interval: string; // "daily", "monthly", "annually", or duration shorthand
  /** Single payout — use this OR payouts[] */
  price?: number;
  denom?: string;
  recipient?: string;
  /** Multiple payouts per interval — use this OR price/denom/recipient */
  payouts?: SubscriptionPayout[];
  tiers?: number; // number of tiers, default 1
  name?: string;
}

export function buildSubscription(params: SubscriptionParams): any {
  const intervalMs = parseDuration(params.interval);
  const tiers = params.tiers || 1;

  // Resolve payouts — either from single recipient or payouts array
  const payouts: { recipient: string; amount: string; denom: string }[] = [];
  if (params.payouts && params.payouts.length > 0) {
    for (const p of params.payouts) {
      const coin = resolveCoin(p.denom);
      payouts.push({ recipient: p.recipient, amount: toBaseUnits(p.amount, coin.decimals), denom: coin.denom });
    }
  } else if (params.price !== undefined && params.denom && params.recipient) {
    const coin = resolveCoin(params.denom);
    payouts.push({ recipient: params.recipient, amount: toBaseUnits(params.price, coin.decimals), denom: coin.denom });
  } else {
    throw new Error('Subscription requires either --price/--denom/--recipient or --payouts array');
  }

  const collectionApprovals = [];

  for (let tier = 1; tier <= tiers; tier++) {
    collectionApprovals.push({
      fromListId: 'Mint',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: `subscription-tier-${tier}`,
      transferTimes: FOREVER,
      tokenIds: [{ start: String(tier), end: String(tier) }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        predeterminedBalances: {
          manualBalances: [],
          incrementedBalances: {
            startBalances: [
              { amount: '1', tokenIds: [{ start: String(tier), end: String(tier) }], ownershipTimes: FOREVER }
            ],
            incrementTokenIdsBy: '0',
            incrementOwnershipTimesBy: '0',
            durationFromTimestamp: intervalMs,
            allowOverrideTimestamp: true,
            recurringOwnershipTimes: { startTime: '0', intervalLength: '0', chargePeriodLength: '0' },
            allowOverrideWithAnyValidToken: false,
            allowAmountScaling: false,
            maxScalingMultiplier: '0'
          },
          orderCalculationMethod: {
            useOverallNumTransfers: false,
            usePerToAddressNumTransfers: false,
            usePerFromAddressNumTransfers: false,
            usePerInitiatedByAddressNumTransfers: true,
            useMerkleChallengeLeafIndex: false,
            challengeTrackerId: ''
          }
        },
        coinTransfers: payouts.map((p) => ({
          to: p.recipient,
          coins: [{ amount: p.amount, denom: p.denom }],
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        })),
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    });
  }

  return buildMsg({
    collectionApprovals,
    standards: ['Subscriptions'],
    validTokenIds: [{ start: '1', end: String(tiers) }],
    collectionPermissions: emptyPermissions(),
    invariants: {
      noCustomOwnershipTimes: false,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: true
    },
    defaultBalances: defaultBalances({ autoApproveAllIncomingTransfers: true })
  });
}
