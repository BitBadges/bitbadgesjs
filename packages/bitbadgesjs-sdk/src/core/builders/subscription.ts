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
  baselinePermissions,
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
  transferable?: boolean; // allow post-mint P2P transfers of subscription tokens
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

  // Subscription standard requires every coin transfer in the faucet
  // approval to use a SINGLE denom — the SDK's
  // `doesCollectionFollowSubscriptionProtocol()` rejects mixed-denom
  // approvals because the subscription unit (one period × one price)
  // doesn't translate to "X USDC + Y BADGE" semantically. Fail fast at
  // build time with a clear hint instead of producing a tx that the
  // frontend silently won't recognize as a subscription.
  const uniqueDenoms = Array.from(new Set(payouts.map((p) => p.denom)));
  if (uniqueDenoms.length > 1) {
    throw new Error(
      `Subscription must use a single denom across all payouts. Got ${uniqueDenoms.length}: ${uniqueDenoms.join(', ')}. Use one shared denom (e.g. all in USDC) or split into separate subscription collections.`
    );
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
            useOverallNumTransfers: true,
            usePerToAddressNumTransfers: false,
            usePerFromAddressNumTransfers: false,
            usePerInitiatedByAddressNumTransfers: false,
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
        // Subscriptions must NOT override the recipient's incoming approvals.
        // The frontend's `doesCollectionFollowSubscriptionProtocol()` rejects
        // subscription faucet approvals that override incoming, because the
        // recipient still needs `autoApproveAllIncomingTransfers: true` to
        // gate whether they actually receive the minted token.
        overridesToIncomingApprovals: false
      }
    });
  }

  if (params.transferable) {
    collectionApprovals.push({
      fromListId: '!Mint',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'free-transfer',
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {}
    });
  }

  return buildMsg({
    collectionApprovals,
    standards: ['Subscriptions'],
    validTokenIds: [{ start: '1', end: String(tiers) }],
    collectionPermissions: baselinePermissions(),
    invariants: {
      noCustomOwnershipTimes: false,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: false
    },
    defaultBalances: defaultBalances({ autoApproveAllIncomingTransfers: true })
  });
}
