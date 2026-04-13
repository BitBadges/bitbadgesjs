/**
 * Quests builder — creates a MsgUniversalUpdateCollection for quest reward tokens.
 * @module core/builders/quests
 */
import {
  FOREVER,
  BURN_ADDRESS,
  resolveCoin,
  toBaseUnits,
  buildMsg,
  emptyPermissions,
  mintToBurnBalances
} from './shared.js';

export interface QuestsParams {
  reward: number; // display units per claim
  denom: string; // USDC, BADGE
  maxClaims: number;
  name?: string;
}

export function buildQuests(params: QuestsParams): any {
  const coin = resolveCoin(params.denom);
  const rewardBase = toBaseUnits(params.reward, coin.decimals);

  // The amountTrackerId must match the approvalId so claim counts are
  // tracked against the same approval. Frontend registries derive the
  // tracker from the approvalId param; mirror that pattern here.
  const questApprovalId = `quest-approval-${Math.random().toString(16).slice(2, 10)}`;

  const collectionApprovals = [
    // Quest claim approval
    {
      fromListId: 'Mint',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: questApprovalId,
      transferTimes: FOREVER,
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        predeterminedBalances: mintToBurnBalances(),
        maxNumTransfers: {
          overallMaxNumTransfers: String(params.maxClaims),
          perToAddressMaxNumTransfers: '0',
          perFromAddressMaxNumTransfers: '0',
          perInitiatedByAddressMaxNumTransfers: '0',
          amountTrackerId: questApprovalId,
          resetTimeIntervals: { startTime: '0', intervalLength: '0' }
        },
        coinTransfers: [
          {
            to: '',
            coins: [{ amount: rewardBase, denom: coin.denom }],
            overrideFromWithApproverAddress: true,
            overrideToWithInitiator: true
          }
        ],
        overridesFromOutgoingApprovals: true,
        merkleChallenges: []
      }
    },
    // Burn approval
    {
      fromListId: '!Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: 'All',
      approvalId: 'burnable-approval',
      transferTimes: FOREVER,
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {}
    }
  ];

  return buildMsg({
    collectionApprovals,
    standards: ['Quests'],
    collectionPermissions: emptyPermissions(),
    invariants: {
      noCustomOwnershipTimes: true,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: false
    },
    mintEscrowCoinsToTransfer: [
      { amount: String(BigInt(rewardBase) * BigInt(params.maxClaims)), denom: coin.denom }
    ]
  });
}
