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
  frozenPermissions,
  defaultBalances,
  scalingBalances,
  tokenMetadataEntry,
  metadataFromFlat,
  MetadataMissingError,
  approvalMetadata
} from './shared.js';

export interface CrowdfundParams {
  goal: number; // display units
  denom: string;
  crowdfunder?: string; // bb1... address — who receives funds on success (creator fills in if empty)
  deadline?: string; // duration shorthand, default "30d"
  /** Pre-hosted collection metadata URI. If provided, name/image/description are ignored. */
  uri?: string;
  name?: string;
  description?: string;
  image?: string;
  /**
   * Creator address — used as the default crowdfunder when `crowdfunder`
   * isn't specified. The CLI passes this through from `--creator`.
   * Without a real address the resulting tx is broken (the success/refund
   * approvals would have `toListId: 'All'` which is meaningless for an
   * escrow payout).
   */
  creator?: string;
}

export function buildCrowdfund(params: CrowdfundParams): any {
  const coin = resolveCoin(params.denom);
  const goalBase = toBaseUnits(params.goal, coin.decimals);
  const deadlineTs = durationToTimestamp(params.deadline || '30d');
  // Resolve the crowdfunder destination once. Falling back to 'All'
  // would produce an unsigned-payout-target collection that the chain
  // would accept but no one could practically use. Prefer the explicit
  // flag, then the creator (passed through from CLI --creator), and
  // only as a last resort use 'All' (which the reviewer flags).
  const crowdfunderAddr = params.crowdfunder || params.creator || 'All';

  const collectionApprovals = [
    // Deposit-Refund — public deposit, mints refund receipt (token 1)
    {
      fromListId: 'Mint',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'deposit-refund',
      ...approvalMetadata(
        'Deposit',
        'Contribute USDC and receive a refund token'
      ),
      transferTimes: [{ start: '1', end: deadlineTs }],
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
        // Mint approval: outgoing override required by standard.
        // Incoming: recipient auto-approves via defaultBalances.
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: false
      }
    },
    // Deposit-Progress — tracks total deposits via token 2 to creator.
    // toListId falls back to 'All' if --crowdfunder isn't set; the reviewer
    // will flag the ambiguity so callers pass a concrete address.
    {
      fromListId: 'Mint',
      toListId: crowdfunderAddr,
      initiatedByListId: 'All',
      approvalId: 'deposit-progress',
      ...approvalMetadata(
        'Progress Tracker',
        'Tracks cumulative contributions to crowdfunder'
      ),
      transferTimes: [{ start: '1', end: deadlineTs }],
      tokenIds: [{ start: '2', end: '2' }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        allowAmountScaling: true,
        predeterminedBalances: scalingBalances('1'),
        // Mint approval: outgoing override required by standard.
        // Incoming: crowdfunder auto-approves via defaultBalances.
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: false
      }
    },
    // Success — crowdfunder withdraws funds after deadline if goal met.
    // toListId is BURN_ADDRESS: the success approval burns the deposit
    // receipt token and the coinTransfer (with
    // overrideFromWithApproverAddress) routes the underlying funds to
    // the crowdfunder via the escrow. Routing tokens to
    // crowdfunderAddr directly would mint an NFT to them, which isn't
    // the intended semantic.
    {
      fromListId: 'Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: crowdfunderAddr,
      approvalId: 'success',
      ...approvalMetadata(
        'Withdraw',
        'Crowdfunder withdraws funds when goal is met'
      ),
      // Strictly AFTER deadline — `deadlineTs + 1` prevents the
      // success claim from racing the final deposit at the exact
      // deadline second. Matches CrowdfundRegistry's
      // `{start: deadlineTime + 1n, end: MAX_UINT}`.
      transferTimes: [{ start: String(BigInt(deadlineTs) + 1n), end: MAX_UINT64 }],
      tokenIds: [{ start: '1', end: '1' }],
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
            mustSatisfyForAllAssets: true
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
        // Only one successful withdrawal ever — the crowdfunder claims
        // the escrowed funds once. Frontend uses overall:1.
        maxNumTransfers: {
          overallMaxNumTransfers: '1',
          perToAddressMaxNumTransfers: '0',
          perFromAddressMaxNumTransfers: '0',
          perInitiatedByAddressMaxNumTransfers: '0',
          amountTrackerId: 'crowdfund-success',
          resetTimeIntervals: { startTime: '0', intervalLength: '0' }
        },
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
      ...approvalMetadata(
        'Refund',
        'After deadline, burn refund token to reclaim deposit'
      ),
      // Same `deadlineTs + 1` boundary as the success approval — no
      // refunds at the exact deadline second, only strictly after.
      transferTimes: [{ start: String(BigInt(deadlineTs) + 1n), end: MAX_UINT64 }],
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
            mustSatisfyForAllAssets: true
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
        // Refunds unlimited in aggregate — each backer gates themselves
        // via their own deposit receipt ownership (mustOwnTokens).
        maxNumTransfers: {
          overallMaxNumTransfers: MAX_UINT64,
          perToAddressMaxNumTransfers: '0',
          perFromAddressMaxNumTransfers: '0',
          perInitiatedByAddressMaxNumTransfers: '0',
          amountTrackerId: 'crowdfund-refund',
          resetTimeIntervals: { startTime: '0', intervalLength: '0' }
        },
        allowAmountScaling: true,
        predeterminedBalances: scalingBalances('1'),
        // No overrides: holder self-initiates their own refund burn and
        // auto-approves via defaultBalances. Previously both overrides
        // were true, which let any third party initiate the burn and
        // redirect the refund payout via overrideToWithInitiator —
        // a theft vector closed.
        overridesFromOutgoingApprovals: false,
        overridesToIncomingApprovals: false
      }
    },
    // Burn — general burn, always allowed
    {
      fromListId: '!Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: 'All',
      approvalId: 'burn',
      ...approvalMetadata('Burn', 'Burn leftover refund tokens'),
      transferTimes: FOREVER,
      tokenIds: [{ start: '1', end: '2' }],
      ownershipTimes: FOREVER,
      version: '0'
    }
  ];

  const collectionSource = metadataFromFlat({
    uri: params.uri,
    name: params.name,
    description: params.description,
    image: params.image
  });
  if (!collectionSource) {
    throw new MetadataMissingError('crowdfund collectionMetadata', ['name', 'image', 'description']);
  }

  // Per-token metadata: refund + progress receipts use distinct fixed
  // names regardless of the caller's --name (the standard expects
  // these specific receipt names). When the caller passed --uri,
  // they've taken responsibility for hosting the per-token JSON too
  // and we reuse the same uri. In inline mode we serialize the
  // standard receipt names + the caller's image.
  const refundSource: any = params.uri
    ? { uri: params.uri }
    : {
        inlineMetadata: {
          name: 'Refund Token',
          description: 'Refundable share of the crowdfund pool.',
          image: params.image as string
        }
      };
  const progressSource: any = params.uri
    ? { uri: params.uri }
    : {
        inlineMetadata: {
          name: 'Progress Token',
          description: 'Tracks total deposits in the crowdfund pool.',
          image: params.image as string
        }
      };

  return buildMsg({
    collectionApprovals,
    validTokenIds: [{ start: '1', end: '2' }],
    standards: ['Crowdfund'],
    collectionPermissions: frozenPermissions(),
    defaultBalances: defaultBalances(),
    invariants: {
      noCustomOwnershipTimes: true,
      maxSupplyPerId: '0',
      // Non-mint approvals (refund, burn) no longer use override flags,
      // so forceful post-mint transfers can be permanently locked.
      noForcefulPostMintTransfers: true,
      disablePoolCreation: true
    },
    // Refund + total-deposit tokens are 1-of-1 receipt-style — no
    // fractional denom unit needed. The previous version added alias
    // paths with `decimals: 0` which the chain rejects.
    aliasPathsToAdd: [],
    collectionMetadata: collectionSource,
    tokenMetadata: [
      tokenMetadataEntry([{ start: '1', end: '1' }], refundSource, 'refund token'),
      tokenMetadataEntry([{ start: '2', end: '2' }], progressSource, 'progress token')
    ]
  });
}
