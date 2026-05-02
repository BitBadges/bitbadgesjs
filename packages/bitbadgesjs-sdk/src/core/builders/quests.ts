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
  baselinePermissions,
  mintToBurnBalances,
  tokenMetadataEntry,
  metadataFromFlat,
  MetadataMissingError
} from './shared.js';

export interface QuestsParams {
  reward: number; // display units per claim
  denom: string; // USDC, BADGE
  maxClaims: number;
  /** Pre-hosted collection metadata URI. If provided, name/image/description are ignored. */
  uri?: string;
  name?: string;
  description?: string;
  image?: string;
}

export function buildQuests(params: QuestsParams): any {
  const coin = resolveCoin(params.denom);
  const rewardBase = toBaseUnits(params.reward, coin.decimals);

  // Fixed `'quests-approval'` id matches the frontend quests.tsx page
  // which hardcodes this value when calling
  // `CollectionApprovalRegistry.questsApproval({ approvalId: 'quests-approval' })`.
  // Quests collections use a singleton claim approval (one per
  // collection), so there's no collision risk that would justify a
  // random suffix. The amountTrackerId mirrors the approvalId.
  const questApprovalId = 'quests-approval';

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

  const collectionSource = metadataFromFlat({
    uri: params.uri,
    name: params.name,
    description: params.description,
    image: params.image
  });
  if (!collectionSource) {
    throw new MetadataMissingError('quests collectionMetadata', ['name', 'image', 'description']);
  }

  return buildMsg({
    collectionApprovals,
    standards: ['Quests'],
    collectionPermissions: baselinePermissions(),
    invariants: {
      noCustomOwnershipTimes: true,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: false
    },
    mintEscrowCoinsToTransfer: [
      { amount: String(BigInt(rewardBase) * BigInt(params.maxClaims)), denom: coin.denom }
    ],
    collectionMetadata: collectionSource,
    tokenMetadata: [tokenMetadataEntry([{ start: '1', end: '1' }], collectionSource, 'quest token')]
  });
}
