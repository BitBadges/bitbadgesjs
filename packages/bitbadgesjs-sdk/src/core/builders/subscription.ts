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

export interface SubscriptionParams {
  interval: string; // "daily", "monthly", "annually", or duration shorthand
  price: number; // display units per interval
  denom: string; // USDC, BADGE
  recipient: string; // bb1... payout address
  tiers?: number; // number of tiers, default 1
  name?: string;
}

export function buildSubscription(params: SubscriptionParams): any {
  const coin = resolveCoin(params.denom);
  const basePrice = toBaseUnits(params.price, coin.decimals);
  const intervalMs = parseDuration(params.interval);
  const tiers = params.tiers || 1;

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
        coinTransfers: [
          {
            to: params.recipient,
            coins: [{ amount: basePrice, denom: coin.denom }],
            overrideFromWithApproverAddress: false,
            overrideToWithInitiator: false
          }
        ],
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
