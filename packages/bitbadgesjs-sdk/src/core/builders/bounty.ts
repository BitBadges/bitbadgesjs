/**
 * Bounty builder — creates a MsgUniversalUpdateCollection for a bounty escrow.
 * @module core/builders/bounty
 */
import {
  MAX_UINT64,
  FOREVER,
  BURN_ADDRESS,
  resolveCoin,
  toBaseUnits,
  durationToTimestamp,
  uniqueId,
  buildMsg,
  buildAliasPath,
  frozenPermissions,
  defaultBalances,
  metadataPlaceholders,
  mintToBurnBalances,
  zeroAmounts,
  zeroMaxTransfers
} from './shared.js';

export interface BountyParams {
  amount: number; // display units
  denom: string; // USDC, BADGE, etc.
  verifier: string; // bb1... address
  recipient: string; // bb1... address
  expiration?: string; // duration shorthand, default "30d"
  name?: string;
}

export function buildBounty(params: BountyParams): any {
  const coin = resolveCoin(params.denom);
  const baseAmount = toBaseUnits(params.amount, coin.decimals);
  const expirationTs = durationToTimestamp(params.expiration || '30d');

  const collectionApprovals = [
    // Accept — verifier approves, pays recipient
    {
      fromListId: 'Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: 'All',
      approvalId: 'bounty-accept',
      transferTimes: [{ start: '1', end: expirationTs }],
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        predeterminedBalances: mintToBurnBalances(),
        maxNumTransfers: {
          ...zeroMaxTransfers('bounty-accept-tracker'),
          overallMaxNumTransfers: '1'
        },
        votingChallenges: [
          {
            proposalId: uniqueId('bounty-accept'),
            quorumThreshold: '100',
            voters: [{ address: params.verifier, weight: '100' }]
          }
        ],
        coinTransfers: [
          {
            to: params.recipient,
            coins: [{ amount: baseAmount, denom: coin.denom }],
            overrideFromWithApproverAddress: true,
            overrideToWithInitiator: false
          }
        ],
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    },
    // Deny — verifier denies, refunds creator
    {
      fromListId: 'Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: 'All',
      approvalId: 'bounty-deny',
      transferTimes: [{ start: '1', end: expirationTs }],
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        predeterminedBalances: mintToBurnBalances(),
        maxNumTransfers: {
          ...zeroMaxTransfers('bounty-deny-tracker'),
          overallMaxNumTransfers: '1'
        },
        votingChallenges: [
          {
            proposalId: uniqueId('bounty-deny'),
            quorumThreshold: '100',
            voters: [{ address: params.verifier, weight: '100' }]
          }
        ],
        coinTransfers: [
          {
            to: '',
            coins: [{ amount: baseAmount, denom: coin.denom }],
            overrideFromWithApproverAddress: true,
            overrideToWithInitiator: false
          }
        ],
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    },
    // Expire — anyone can trigger after expiration, refunds creator
    {
      fromListId: 'Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: 'All',
      approvalId: 'bounty-expire',
      transferTimes: [{ start: String(BigInt(expirationTs) + 1n), end: MAX_UINT64 }],
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        predeterminedBalances: mintToBurnBalances(),
        maxNumTransfers: {
          ...zeroMaxTransfers('bounty-expire-tracker'),
          overallMaxNumTransfers: '1'
        },
        coinTransfers: [
          {
            to: '',
            coins: [{ amount: baseAmount, denom: coin.denom }],
            overrideFromWithApproverAddress: true,
            overrideToWithInitiator: false
          }
        ],
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    }
  ];

  const { collectionMetadata, tokenMetadata, placeholders } = metadataPlaceholders(params.name || 'Bounty');

  return buildMsg({
    collectionApprovals,
    standards: ['Bounty'],
    collectionPermissions: frozenPermissions(),
    defaultBalances: defaultBalances(),
    invariants: {
      noCustomOwnershipTimes: true,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: true
    },
    // Bounty receipt is a 1-of-1 NFT-style token — no fractional denom
    // unit needed. The previous version added an alias path with
    // `decimals: 0` which the chain rejects.
    aliasPathsToAdd: [],
    mintEscrowCoinsToTransfer: [{ amount: baseAmount, denom: coin.denom }],
    collectionMetadata,
    tokenMetadata,
    metadataPlaceholders: placeholders
  });
}
