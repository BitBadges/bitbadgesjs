/**
 * Shared utilities for CLI template builders.
 * @module core/builders/shared
 */
import crypto from 'crypto';
import { MAINNET_COINS_REGISTRY, type CoinDetails } from '../../common/constants.js';
import { generateAliasAddressForIBCBackedDenom } from '../aliases.js';

// ── Constants ────────────────────────────────────────────────────────────────

export const MAX_UINT64 = '18446744073709551615';
export const FOREVER = [{ start: '1', end: MAX_UINT64 }];
export const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
export const BITBADGES_DEFAULT_IMAGE = 'ipfs://QmNTpizCkY5tcMpPMf1kkn7Y5YxFQo3oT54A9oKP5ijP9E';
export const DEFAULT_METADATA_URI = 'ipfs://QmSviTf2qQLpFU84oF8CrxNrdgXPdWwHEyrkX3k6j7iiqR';

// ── Coin resolution ──────────────────────────────────────────────────────────

export interface ResolvedCoin {
  denom: string;
  symbol: string;
  decimals: number;
  image: string;
}

/**
 * Resolve a coin symbol (USDC, BADGE, ATOM, OSMO) to its on-chain denom + metadata.
 * Also accepts raw denoms (ibc/..., ubadge) for pass-through.
 *
 * Pass `testnet: true` to use the testnet registry (only BADGE available).
 */
/**
 * Resolve a coin symbol (USDC, BADGE, ATOM, OSMO) to its on-chain denom + metadata.
 * Also accepts raw denoms (ibc/..., ubadge) for pass-through.
 * Uses mainnet registry. If a coin doesn't exist on your target chain, the tx will fail on-chain.
 */
export function resolveCoin(symbolOrDenom: string): ResolvedCoin {
  const registry = MAINNET_COINS_REGISTRY;

  // Try direct match first (raw denom like ubadge or ibc/...)
  const direct = registry[symbolOrDenom];
  if (direct) {
    return { denom: direct.baseDenom, symbol: direct.symbol, decimals: Number(direct.decimals), image: direct.image };
  }

  // Try symbol lookup (case-insensitive)
  const upper = symbolOrDenom.toUpperCase();
  for (const [denom, details] of Object.entries(registry)) {
    if (details.symbol.toUpperCase() === upper) {
      return { denom: details.baseDenom, symbol: details.symbol, decimals: Number(details.decimals), image: details.image };
    }
  }

  const supported = Object.values(registry)
    .map((c) => c.symbol)
    .filter((s, i, a) => a.indexOf(s) === i)
    .join(', ');
  throw new Error(
    `Unknown coin "${symbolOrDenom}". Supported: ${supported}`
  );
}

/**
 * Convert a display-unit amount (e.g. 10 USDC) to base units (e.g. 10000000 uusdc).
 */
export function toBaseUnits(displayAmount: number, decimals: number): string {
  return String(Math.round(displayAmount * 10 ** decimals));
}

// ── Duration parsing ─────────────────────────────────────────────────────────

const DURATION_MAP: Record<string, number> = {
  daily: 86400000,
  monthly: 2592000000, // 30 days
  annually: 31536000000, // 365 days
};

/**
 * Parse a duration shorthand (30d, 7d, 1h, monthly, annually, daily) to milliseconds string.
 */
export function parseDuration(input: string): string {
  const lower = input.toLowerCase();

  if (DURATION_MAP[lower]) return String(DURATION_MAP[lower]);

  const match = lower.match(/^(\d+(?:\.\d+)?)\s*(d|h|m|s|ms)$/);
  if (!match) throw new Error(`Invalid duration "${input}". Examples: 30d, 7d, 1h, monthly, annually`);

  const value = parseFloat(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return String(Math.round(value * multipliers[unit]));
}

/**
 * Parse a duration and return the absolute timestamp (now + duration) as a string.
 */
export function durationToTimestamp(input: string): string {
  const ms = Number(parseDuration(input));
  return String(Date.now() + ms);
}

// ── Unique ID generation ─────────────────────────────────────────────────────

export function uniqueId(prefix?: string): string {
  const rand = crypto.randomBytes(8).toString('hex');
  return prefix ? `${prefix}-${rand}` : rand;
}

// ── Common builder helpers ───────────────────────────────────────────────────

export function metadataPlaceholders(name: string, description?: string, image?: string) {
  return {
    collectionMetadata: {
      uri: DEFAULT_METADATA_URI,
      customData: JSON.stringify({ name, description: description || '', image: image || BITBADGES_DEFAULT_IMAGE })
    },
    tokenMetadata: [
      {
        uri: DEFAULT_METADATA_URI,
        customData: '',
        tokenIds: FOREVER
      }
    ]
  };
}

export function singleTokenMetadata(tokenId: string, name: string, description?: string, image?: string) {
  return {
    uri: DEFAULT_METADATA_URI,
    customData: JSON.stringify({ name, description: description || '', image: image || '' }),
    tokenIds: [{ start: tokenId, end: tokenId }]
  };
}

/**
 * Build a complete MsgUniversalUpdateCollection with collectionId "0" (new collection).
 * Output is wrapped in { typeUrl, value } for direct use with signing clients.
 */
export function buildMsg(params: {
  collectionApprovals: any[];
  validTokenIds?: any[];
  standards?: string[];
  collectionPermissions?: any;
  creator?: string;
  manager?: string;
  collectionMetadata?: any;
  tokenMetadata?: any[];
  customData?: string;
  defaultBalances?: any;
  invariants?: any;
  aliasPathsToAdd?: any[];
  cosmosCoinWrapperPathsToAdd?: any[];
  mintEscrowCoinsToTransfer?: any[];
}) {
  return {
    typeUrl: '/tokenization.MsgUniversalUpdateCollection',
    value: {
      creator: params.creator || '',
      collectionId: '0',
      updateValidTokenIds: true,
      validTokenIds: params.validTokenIds || [{ start: '1', end: '1' }],
      updateCollectionPermissions: true,
      collectionPermissions: params.collectionPermissions || emptyPermissions(),
      updateManager: true,
      manager: params.manager || '',
      updateCollectionMetadata: true,
      collectionMetadata: params.collectionMetadata || { uri: DEFAULT_METADATA_URI, customData: '' },
      updateTokenMetadata: true,
      tokenMetadata: params.tokenMetadata || [{ uri: DEFAULT_METADATA_URI, customData: '', tokenIds: FOREVER }],
      updateCustomData: true,
      customData: params.customData || '',
      updateCollectionApprovals: true,
      collectionApprovals: params.collectionApprovals.map((a: any) => ({
        ...a,
        uri: a.uri || DEFAULT_METADATA_URI
      })),
      updateStandards: true,
      standards: params.standards || [],
      updateIsArchived: false,
      isArchived: false,
      defaultBalances: params.defaultBalances || defaultBalances(),
      mintEscrowCoinsToTransfer: params.mintEscrowCoinsToTransfer || [],
      invariants: params.invariants || undefined,
      aliasPathsToAdd: params.aliasPathsToAdd || [],
      cosmosCoinWrapperPathsToAdd: params.cosmosCoinWrapperPathsToAdd || []
    }
  };
}

/**
 * Wrap a user-level approval in MsgUpdateUserApprovals { typeUrl, value }.
 * Caller provides the collectionId and either outgoing or incoming approval.
 */
export function buildUserApprovalMsg(params: {
  collectionId: string;
  outgoingApprovals?: any[];
  incomingApprovals?: any[];
}) {
  return {
    typeUrl: '/tokenization.MsgUpdateUserApprovals',
    value: {
      creator: '',
      collectionId: params.collectionId,
      updateOutgoingApprovals: (params.outgoingApprovals?.length ?? 0) > 0,
      outgoingApprovals: params.outgoingApprovals || [],
      updateIncomingApprovals: (params.incomingApprovals?.length ?? 0) > 0,
      incomingApprovals: params.incomingApprovals || []
    }
  };
}

// ── Permission helpers ───────────────────────────────────────────────────────

/**
 * Bare action permission — used for canDeleteCollection, canArchiveCollection,
 * canUpdateStandards, canUpdateCustomData, canUpdateManager,
 * canUpdateCollectionMetadata, canAddMoreAliasPaths,
 * canAddMoreCosmosCoinWrapperPaths. These permission types take no extra
 * scoping fields.
 */
export function alwaysLockedPermission() {
  return { permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER };
}

/**
 * Token-scoped action permission — used for canUpdateValidTokenIds and
 * canUpdateTokenMetadata, which require a `tokenIds` field that narrows
 * which token IDs the permission applies to. Defaults to all token IDs.
 */
export function alwaysLockedTokenIdsPermission() {
  return {
    tokenIds: FOREVER,
    permanentlyPermittedTimes: [],
    permanentlyForbiddenTimes: FOREVER
  };
}

/**
 * Approval-scoped action permission — used for canUpdateCollectionApprovals.
 * Requires fromListId / toListId / initiatedByListId plus tokenIds and
 * transferTimes. Defaults to "all approvals, forever" so the resulting
 * permission locks the whole approval set.
 */
export function alwaysLockedCollectionApprovalPermission() {
  return {
    fromListId: 'All',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    tokenIds: FOREVER,
    approvalId: 'All',
    amountTrackerId: 'All',
    challengeTrackerId: 'All',
    permanentlyPermittedTimes: [],
    permanentlyForbiddenTimes: FOREVER
  };
}

export function emptyPermissions() {
  return {
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
}

export function frozenPermissions() {
  return {
    canDeleteCollection: [alwaysLockedPermission()],
    canArchiveCollection: [alwaysLockedPermission()],
    canUpdateStandards: [alwaysLockedPermission()],
    canUpdateCustomData: [alwaysLockedPermission()],
    canUpdateManager: [alwaysLockedPermission()],
    canUpdateCollectionMetadata: [alwaysLockedPermission()],
    canUpdateValidTokenIds: [alwaysLockedTokenIdsPermission()],
    canUpdateTokenMetadata: [alwaysLockedTokenIdsPermission()],
    canUpdateCollectionApprovals: [alwaysLockedCollectionApprovalPermission()],
    canAddMoreAliasPaths: [alwaysLockedPermission()],
    canAddMoreCosmosCoinWrapperPaths: [alwaysLockedPermission()]
  };
}

// ── Default balances ─────────────────────────────────────────────────────────

export function defaultBalances(overrides?: Partial<{
  autoApproveAllIncomingTransfers: boolean;
  autoApproveSelfInitiatedOutgoingTransfers: boolean;
  autoApproveSelfInitiatedIncomingTransfers: boolean;
}>) {
  return {
    balances: [],
    outgoingApprovals: [],
    incomingApprovals: [],
    autoApproveAllIncomingTransfers: true,
    autoApproveSelfInitiatedOutgoingTransfers: true,
    autoApproveSelfInitiatedIncomingTransfers: true,
    userPermissions: {
      canUpdateIncomingApprovals: [],
      canUpdateOutgoingApprovals: [],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
      canUpdateAutoApproveAllIncomingTransfers: []
    },
    ...overrides
  };
}

// ── Approval template helpers ────────────────────────────────────────────────

export function zeroAmounts(trackerId?: string) {
  return {
    overallApprovalAmount: '0',
    perToAddressApprovalAmount: '0',
    perFromAddressApprovalAmount: '0',
    perInitiatedByAddressApprovalAmount: '0',
    amountTrackerId: trackerId || '',
    resetTimeIntervals: { startTime: '0', intervalLength: '0' }
  };
}

export function zeroMaxTransfers(trackerId?: string) {
  return {
    overallMaxNumTransfers: '0',
    perToAddressMaxNumTransfers: '0',
    perFromAddressMaxNumTransfers: '0',
    perInitiatedByAddressMaxNumTransfers: '0',
    amountTrackerId: trackerId || '',
    resetTimeIntervals: { startTime: '0', intervalLength: '0' }
  };
}

export function mintToBurnBalances() {
  return {
    manualBalances: [],
    incrementedBalances: {
      startBalances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }],
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
  };
}

export function scalingBalances(amount: string, maxMultiplier?: string) {
  return {
    manualBalances: [],
    incrementedBalances: {
      startBalances: [{ amount, tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }],
      incrementTokenIdsBy: '0',
      incrementOwnershipTimesBy: '0',
      durationFromTimestamp: '0',
      allowOverrideTimestamp: false,
      recurringOwnershipTimes: { startTime: '0', intervalLength: '0', chargePeriodLength: '0' },
      allowOverrideWithAnyValidToken: false,
      allowAmountScaling: true,
      maxScalingMultiplier: maxMultiplier || MAX_UINT64
    },
    orderCalculationMethod: {
      useOverallNumTransfers: true,
      usePerToAddressNumTransfers: false,
      usePerFromAddressNumTransfers: false,
      usePerInitiatedByAddressNumTransfers: false,
      useMerkleChallengeLeafIndex: false,
      challengeTrackerId: ''
    }
  };
}

// ── Alias path builder ───────────────────────────────────────────────────────

/**
 * Build an alias path for a denom. PathMetadata only accepts
 * `{ uri, customData }` — the image belongs inside the off-chain JSON
 * referenced by `metadata.uri`. We emit placeholder URIs by default so
 * users / agents can either (a) leave them and substitute after upload
 * via `builder metadata apply`, or (b) pass a real URI up front.
 *
 * @param image Optional image URI. Kept in the parameter list for callers
 *   that already pass it, but currently unused — the image must live in
 *   the off-chain JSON, not the on-chain PathMetadata. Will be surfaced
 *   through the metadata placeholder system.
 */
export function buildAliasPath(denom: string, symbol: string, decimals: number, image?: string) {
  // Keep the parameter for back-compat; the reviewer + metadata placeholder
  // layer will pick up the image via metadataPlaceholders, not the proto.
  void image;
  return {
    denom,
    conversion: {
      sideA: { amount: '1' },
      sideB: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }]
    },
    symbol,
    denomUnits: [
      {
        decimals: String(decimals),
        symbol,
        isDefaultDisplay: true,
        metadata: { uri: `ipfs://METADATA_ALIAS_${denom}_UNIT`, customData: '' }
      }
    ],
    metadata: { uri: `ipfs://METADATA_ALIAS_${denom}`, customData: '' }
  };
}

// ── IBC backed path helpers ──────────────────────────────────────────────────

export function ibcBackedInvariants(ibcDenom: string) {
  return {
    noCustomOwnershipTimes: false,
    maxSupplyPerId: '0',
    noForcefulPostMintTransfers: false,
    disablePoolCreation: false,
    cosmosCoinBackedPath: {
      conversion: {
        sideA: { amount: '1', denom: ibcDenom },
        sideB: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }]
      }
    }
  };
}

export { generateAliasAddressForIBCBackedDenom };
