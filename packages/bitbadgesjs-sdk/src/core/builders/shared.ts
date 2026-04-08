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
 */
export function resolveCoin(symbolOrDenom: string): ResolvedCoin {
  // Try direct match first (raw denom like ubadge or ibc/...)
  const direct = MAINNET_COINS_REGISTRY[symbolOrDenom];
  if (direct) {
    return { denom: direct.baseDenom, symbol: direct.symbol, decimals: Number(direct.decimals), image: direct.image };
  }

  // Try symbol lookup (case-insensitive)
  const upper = symbolOrDenom.toUpperCase();
  for (const [denom, details] of Object.entries(MAINNET_COINS_REGISTRY)) {
    if (details.symbol.toUpperCase() === upper) {
      return { denom: details.baseDenom, symbol: details.symbol, decimals: Number(details.decimals), image: details.image };
    }
  }

  throw new Error(
    `Unknown coin "${symbolOrDenom}". Supported: ${Object.values(MAINNET_COINS_REGISTRY)
      .map((c) => c.symbol)
      .filter((s, i, a) => a.indexOf(s) === i)
      .join(', ')}`
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
      uri: 'ipfs://METADATA_COLLECTION',
      customData: JSON.stringify({ name, description: description || '', image: image || '' })
    },
    tokenMetadata: [
      {
        uri: 'ipfs://METADATA_TOKEN_{id}',
        customData: '',
        tokenIds: FOREVER
      }
    ]
  };
}

export function singleTokenMetadata(tokenId: string, name: string, description?: string, image?: string) {
  return {
    uri: '',
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
      creator: '',
      collectionId: '0',
      updateValidTokenIds: true,
      validTokenIds: params.validTokenIds || [{ start: '1', end: '1' }],
      updateCollectionPermissions: true,
      collectionPermissions: params.collectionPermissions || emptyPermissions(),
      updateManager: true,
      manager: params.manager || '',
      updateCollectionMetadata: true,
      collectionMetadata: params.collectionMetadata || { uri: 'ipfs://METADATA_COLLECTION', customData: '' },
      updateTokenMetadata: true,
      tokenMetadata: params.tokenMetadata || [{ uri: 'ipfs://METADATA_TOKEN_{id}', customData: '', tokenIds: FOREVER }],
      updateCustomData: true,
      customData: params.customData || '',
      updateCollectionApprovals: true,
      collectionApprovals: params.collectionApprovals,
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

export function alwaysLockedPermission() {
  return { permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER };
}

export function emptyPermissions() {
  return {
    canDeleteCollection: [alwaysLockedPermission()],
    canArchiveCollection: [alwaysLockedPermission()],
    canUpdateStandards: [alwaysLockedPermission()],
    canUpdateCustomData: [alwaysLockedPermission()],
    canUpdateManager: [],
    canUpdateCollectionMetadata: [],
    canUpdateValidTokenIds: [alwaysLockedPermission()],
    canUpdateTokenMetadata: [],
    canUpdateCollectionApprovals: [],
    canAddMoreAliasPaths: [alwaysLockedPermission()],
    canAddMoreCosmosCoinWrapperPaths: [alwaysLockedPermission()]
  };
}

export function frozenPermissions() {
  const locked = [alwaysLockedPermission()];
  return {
    canDeleteCollection: locked,
    canArchiveCollection: locked,
    canUpdateStandards: locked,
    canUpdateCustomData: locked,
    canUpdateManager: locked,
    canUpdateCollectionMetadata: locked,
    canUpdateValidTokenIds: locked,
    canUpdateTokenMetadata: locked,
    canUpdateCollectionApprovals: locked,
    canAddMoreAliasPaths: locked,
    canAddMoreCosmosCoinWrapperPaths: locked
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
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: []
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

export function buildAliasPath(denom: string, symbol: string, decimals: number, image?: string) {
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
        metadata: { uri: '', customData: '' }
      }
    ],
    metadata: { uri: image || '', customData: '' }
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
