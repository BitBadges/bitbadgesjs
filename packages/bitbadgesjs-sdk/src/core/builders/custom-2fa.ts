/**
 * Custom 2FA builder — creates a MsgUniversalUpdateCollection for 2FA tokens with 5-minute expiry.
 * @module core/builders/custom-2fa
 */
import {
  FOREVER,
  BURN_ADDRESS,
  buildMsg,
  baselinePermissions,
  alwaysLockedPermission,
  alwaysLockedTokenIdsPermission,
  tokenMetadataEntry,
  metadataFromFlat,
  MetadataMissingError,
  approvalMetadata
} from './shared.js';

export interface Custom2FAParams {
  /** Pre-hosted collection metadata URI. If provided, name/image/description are ignored. */
  uri?: string;
  name?: string;
  image?: string;
  description?: string;
  burnable?: boolean;
  transferable?: boolean; // allow post-mint P2P transfers of 2FA tokens
  /**
   * Manager address allowed to initiate mints. The CLI passes this
   * through from --creator. Required: the FE-canonical preset
   * (builder/presets/custom-2fa.ts) sets the mint approval's
   * `initiatedByListId` to this address. Without it, anyone could mint a
   * 2FA token to anyone, breaking the standard's security model.
   */
  creator?: string;
}

export function buildCustom2FA(params: Custom2FAParams): any {
  const managerAddr = params.creator;
  if (!managerAddr) {
    throw new Error(
      'Custom 2FA requires a manager address. Pass --creator <bb1...> (only the manager may mint 2FA tokens).'
    );
  }

  const collectionApprovals: any[] = [
    // 2FA Mint — 5-minute expiration via durationFromTimestamp
    {
      fromListId: 'Mint',
      toListId: 'All',
      // Only the manager may mint 2FA tokens — matches the FE-canonical
      // preset (builder/presets/custom-2fa.ts). 'All' here let anyone
      // issue a valid 2FA token to anyone, breaking the standard.
      initiatedByListId: managerAddr,
      approvalId: 'custom-2fa-mint',
      ...approvalMetadata(
        'Issue 2FA token',
        'Mint a short-lived two-factor authentication token. Tokens auto-expire so they cannot be reused.'
      ),
      transferTimes: FOREVER,
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        // Expiration is runtime-enforced by the frontend at mint time
        // via `getCustom2FAOwnershipTimes()` + `allowPurgeIfExpired`;
        // the approval itself doesn't encode a duration. Use an empty
        // `startBalances` so the chain's "exactly one
        // orderCalculationMethod flag must be true" rule doesn't fire
        // (it only applies when startBalances is non-empty).
        predeterminedBalances: {
          manualBalances: [],
          incrementedBalances: {
            startBalances: [],
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
            useOverallNumTransfers: false,
            usePerToAddressNumTransfers: false,
            usePerFromAddressNumTransfers: false,
            usePerInitiatedByAddressNumTransfers: false,
            useMerkleChallengeLeafIndex: false,
            challengeTrackerId: ''
          }
        },
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: false,
        autoDeletionOptions: {
          afterOneUse: false,
          afterOverallMaxNumTransfers: false,
          allowCounterpartyPurge: false,
          allowPurgeIfExpired: true
        }
      }
    }
  ];

  // Optional burn approval
  if (params.burnable) {
    collectionApprovals.push({
      fromListId: '!Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: 'All',
      approvalId: 'burn',
      ...approvalMetadata('Burn', 'Burn 2FA tokens to the burn address.'),
      transferTimes: FOREVER,
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {}
    });
  }

  // Optional free-transfer approval
  if (params.transferable) {
    collectionApprovals.push({
      fromListId: '!Mint',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'free-transfer',
      ...approvalMetadata(
        'Transferable',
        'Allow holders to transfer 2FA tokens between addresses.'
      ),
      transferTimes: FOREVER,
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {}
    });
  }

  // Permissions: lock certain fields, leave approvals + manager + token metadata + collection metadata open
  const perms = {
    canDeleteCollection: [alwaysLockedPermission()],
    canArchiveCollection: [alwaysLockedPermission()],
    canUpdateStandards: [alwaysLockedPermission()],
    canUpdateCustomData: [alwaysLockedPermission()],
    canUpdateManager: [],
    canUpdateCollectionMetadata: [],
    canUpdateValidTokenIds: [alwaysLockedTokenIdsPermission()],
    canUpdateTokenMetadata: [],
    canUpdateCollectionApprovals: [],
    canAddMoreAliasPaths: [alwaysLockedPermission()],
    canAddMoreCosmosCoinWrapperPaths: [alwaysLockedPermission()]
  };

  const collectionSource = metadataFromFlat({
    uri: params.uri,
    name: params.name,
    description: params.description,
    image: params.image
  });
  if (!collectionSource) {
    throw new MetadataMissingError('custom-2fa collectionMetadata', ['name', 'image', 'description']);
  }

  return buildMsg({
    collectionApprovals,
    standards: ['Custom-2FA'],
    collectionPermissions: perms,
    invariants: {
      noCustomOwnershipTimes: false,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: true
    },
    collectionMetadata: collectionSource,
    tokenMetadata: [tokenMetadataEntry([{ start: '1', end: '1' }], collectionSource, '2FA token')]
  });
}
