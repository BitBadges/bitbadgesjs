/**
 * Crowdfund builder — creates a MsgUniversalUpdateCollection for a crowdfund campaign.
 * @module core/builders/crowdfund
 */
import {
  MAX_UINT64,
  FOREVER,
  BURN_ADDRESS,
  resolveCoin,
  toBaseUnits,
  durationToTimestamp,
  buildMsg,
  buildAliasPath,
  frozenPermissions,
  defaultBalances,
  metadataPlaceholders,
  singleTokenMetadata,
  scalingBalances
} from './shared.js';

export interface CrowdfundParams {
  goal: number; // display units
  denom: string;
  crowdfunder?: string; // bb1... address — who receives funds on success (creator fills in if empty)
  deadline?: string; // duration shorthand, default "30d"
  name?: string;
}

export function buildCrowdfund(params: CrowdfundParams): any {
  const coin = resolveCoin(params.denom);
  const goalBase = toBaseUnits(params.goal, coin.decimals);
  const deadlineTs = durationToTimestamp(params.deadline || '30d');

  const collectionApprovals = [
    // Deposit-Refund — public deposit, mints refund receipt (token 1)
    {
      fromListId: 'Mint',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'deposit-refund',
      transferTimes: FOREVER,
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        requireToEqualsInitiatedBy: true,
        allowAmountScaling: true,
        predeterminedBalances: scalingBalances('1'),
        coinTransfers: [
          {
            to: 'Mint',
            coins: [{ amount: '1', denom: coin.denom }],
            overrideFromWithApproverAddress: false,
            overrideToWithInitiator: false
          }
        ],
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    },
    // Deposit-Progress — tracks total deposits via token 2 to creator.
    // toListId falls back to 'All' if --crowdfunder isn't set; the reviewer
    // will flag the ambiguity so callers pass a concrete address.
    {
      fromListId: 'Mint',
      toListId: params.crowdfunder || 'All',
      initiatedByListId: 'All',
      approvalId: 'deposit-progress',
      transferTimes: FOREVER,
      tokenIds: [{ start: '2', end: '2' }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        allowAmountScaling: true,
        predeterminedBalances: scalingBalances('1'),
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    },
    // Success — creator withdraws funds after deadline if goal met.
    // Same fallback story as deposit-progress: review surfaces the missing
    // crowdfunder when the flag isn't provided.
    {
      fromListId: 'Mint',
      toListId: params.crowdfunder || 'All',
      initiatedByListId: params.crowdfunder || 'All',
      approvalId: 'success',
      transferTimes: [{ start: deadlineTs, end: MAX_UINT64 }],
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        mustOwnTokens: [
          {
            collectionId: '0',
            amountRange: { start: goalBase, end: MAX_UINT64 },
            ownershipTimes: FOREVER,
            tokenIds: [{ start: '2', end: '2' }],
            overrideWithCurrentTime: true,
            mustSatisfyForAllAssets: false
          }
        ],
        coinTransfers: [
          {
            to: '',
            coins: [{ amount: '1', denom: coin.denom }],
            overrideFromWithApproverAddress: true,
            overrideToWithInitiator: true
          }
        ],
        predeterminedBalances: scalingBalances('1'),
        overridesFromOutgoingApprovals: true
      }
    },
    // Refund — backers burn receipt for refund after deadline if goal not met
    {
      fromListId: '!Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: 'All',
      approvalId: 'refund',
      transferTimes: [{ start: deadlineTs, end: MAX_UINT64 }],
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        mustOwnTokens: [
          {
            collectionId: '0',
            amountRange: { start: '0', end: String(BigInt(goalBase) - 1n) },
            ownershipTimes: FOREVER,
            tokenIds: [{ start: '2', end: '2' }],
            overrideWithCurrentTime: true,
            mustSatisfyForAllAssets: false
          }
        ],
        coinTransfers: [
          {
            to: '',
            coins: [{ amount: '1', denom: coin.denom }],
            overrideFromWithApproverAddress: true,
            overrideToWithInitiator: true
          }
        ],
        allowAmountScaling: true,
        predeterminedBalances: scalingBalances('1'),
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    },
    // Burn — general burn, always allowed
    {
      fromListId: '!Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: 'All',
      approvalId: 'burn',
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0'
    }
  ];

  const { collectionMetadata, placeholders: collectionPlaceholders } = metadataPlaceholders(
    params.name || 'Crowdfund'
  );
  const refundToken = singleTokenMetadata('1', 'Refund Token', 'Refundable share of the crowdfund pool.');
  const progressToken = singleTokenMetadata('2', 'Progress Token', 'Tracks total deposits in the crowdfund pool.');

  // Strip the per-token default that metadataPlaceholders() seeds — this
  // template defines its own per-token entries below, so the default
  // ipfs://METADATA_TOKEN_DEFAULT shouldn't end up in the sidecar.
  const { 'ipfs://METADATA_TOKEN_DEFAULT': _drop, ...collectionOnlyPlaceholders } = collectionPlaceholders;
  void _drop;

  return buildMsg({
    collectionApprovals,
    validTokenIds: [{ start: '1', end: '2' }],
    standards: ['Crowdfund'],
    collectionPermissions: frozenPermissions(),
    defaultBalances: defaultBalances(),
    invariants: {
      noCustomOwnershipTimes: true,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: true
    },
    aliasPathsToAdd: [
      buildAliasPath('urefund', 'REFUND', 0),
      buildAliasPath('utotaldeposit', 'TOTALDEPOSIT', 0)
    ],
    collectionMetadata,
    tokenMetadata: [refundToken.entry, progressToken.entry],
    metadataPlaceholders: {
      ...collectionOnlyPlaceholders,
      [refundToken.placeholder.uri]: refundToken.placeholder.content,
      [progressToken.placeholder.uri]: progressToken.placeholder.content
    }
  });
}
