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

/**
 * A sidecar map of placeholder URI → off-chain metadata content. Templates
 * accumulate these and attach them to the emitted Msg as `_meta.metadataPlaceholders`
 * so the CLI's Metadata To Upload section (and any frontend consumer)
 * knows which placeholder URIs already have content provided.
 */
export type PlaceholderSidecar = Record<string, { name: string; description: string; image: string }>;

/**
 * Build collection + default-token metadata using placeholder URIs that the
 * metadata auto-apply flow understands. Returns three things:
 *
 *   - `collectionMetadata` and `tokenMetadata` to drop into `buildMsg(...)`
 *   - `placeholders` — a sidecar map keyed by the placeholder URIs above,
 *     populated with the supplied name/description/image (or sane defaults).
 *
 * Callers should merge the returned `placeholders` into their own sidecar and
 * pass the combined map to `buildMsg({ ..., metadataPlaceholders })`, which
 * surfaces it on the emitted Msg as `_meta.metadataPlaceholders`.
 */
export function metadataPlaceholders(name: string, description?: string, image?: string) {
  const collectionUri = 'ipfs://METADATA_COLLECTION';
  const tokenUri = 'ipfs://METADATA_TOKEN_DEFAULT';
  const content = {
    name,
    description: description || '',
    image: image || BITBADGES_DEFAULT_IMAGE
  };
  return {
    collectionMetadata: { uri: collectionUri, customData: '' },
    tokenMetadata: [
      { uri: tokenUri, customData: '', tokenIds: FOREVER }
    ],
    placeholders: {
      [collectionUri]: { ...content },
      [tokenUri]: { ...content }
    } as PlaceholderSidecar
  };
}

/**
 * Build a per-token metadata entry using a placeholder URI scoped to the
 * token id. Returns `{ entry, placeholder }`:
 *
 *   - `entry` is the object to push into `tokenMetadata: [...]`
 *   - `placeholder` is the sidecar entry the caller should merge into its
 *     accumulated PlaceholderSidecar and pass to buildMsg via
 *     `metadataPlaceholders`.
 */
export function singleTokenMetadata(tokenId: string, name: string, description?: string, image?: string) {
  const uri = `ipfs://METADATA_TOKEN_${tokenId}`;
  return {
    entry: {
      uri,
      customData: '',
      tokenIds: [{ start: tokenId, end: tokenId }]
    },
    placeholder: {
      uri,
      content: {
        name,
        description: description || '',
        image: image || BITBADGES_DEFAULT_IMAGE
      }
    }
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
  /**
   * Off-chain metadata sidecar the template accumulated. Attached to the
   * output Msg as `_meta.metadataPlaceholders`. Templates that don't have
   * specific content should still pass an empty {} so the auto-apply flow
   * knows to treat default placeholder URIs as NEEDED.
   */
  metadataPlaceholders?: PlaceholderSidecar;
}) {
  // Default to placeholder URIs (not the legacy DEFAULT_METADATA_URI). The
  // metadata auto-apply flow recognizes `ipfs://METADATA_*` and substitutes
  // them with real uploaded URIs after the off-chain JSON is provided.
  const collectionMetadata = params.collectionMetadata || { uri: 'ipfs://METADATA_COLLECTION', customData: '' };
  const tokenMetadata = params.tokenMetadata || [
    { uri: 'ipfs://METADATA_TOKEN_DEFAULT', customData: '', tokenIds: FOREVER }
  ];

  const msg: any = {
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
      collectionMetadata,
      updateTokenMetadata: true,
      tokenMetadata,
      updateCustomData: true,
      customData: params.customData || '',
      updateCollectionApprovals: true,
      collectionApprovals: params.collectionApprovals.map((a: any) => ({
        ...a,
        uri: a.uri || `ipfs://METADATA_APPROVAL_${a.approvalId || 'unnamed'}`
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

  // Attach the sidecar as a CLI-only `_meta` annotation. emit() in
  // templates.ts strips this before writing the final JSON to stdout.
  if (params.metadataPlaceholders && Object.keys(params.metadataPlaceholders).length > 0) {
    msg._meta = { metadataPlaceholders: params.metadataPlaceholders };
  }

  return msg;
}

/**
 * Wrap a user-level approval in MsgUpdateUserApprovals { typeUrl, value }.
 * Caller provides the collectionId and either outgoing or incoming approval.
 */
export function buildUserApprovalMsg(params: {
  collectionId: string;
  /**
   * Optional creator override. The CLI's `emit()` backfills this from
   * the `--creator` flag after build, so most templates don't need to
   * pass it through. Provided here for callers that want to set it
   * explicitly (e.g. unit tests, other tooling).
   */
  creator?: string;
  outgoingApprovals?: any[];
  incomingApprovals?: any[];
}) {
  return {
    typeUrl: '/tokenization.MsgUpdateUserApprovals',
    value: {
      creator: params.creator || '',
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
/**
 * Strip any character not in `[a-zA-Z_{}-]` from a candidate cosmos
 * wrapper path denom or symbol. The chain regex
 * `^[a-zA-Z_{}-]+$` is enforced by `ValidateCosmosWrapperPathSymbol`
 * (chain side at validate_basic.go:80-94). Digits are common in
 * user-supplied symbols (e.g. "vUSDC9", "BADGE2") and must be removed
 * before they reach the chain.
 *
 * Throws if the result is empty so callers don't accidentally produce
 * a wrapper path with no name.
 */
export function sanitizeCosmosPathName(input: string, label: 'denom' | 'symbol' = 'symbol'): string {
  const cleaned = input.replace(/[^a-zA-Z_{}\-]/g, '');
  if (cleaned.length === 0) {
    throw new Error(
      `sanitizeCosmosPathName: input "${input}" produced an empty ${label} after stripping invalid characters. Provide a value containing at least one letter (a-zA-Z), underscore, brace, or dash.`
    );
  }
  return cleaned;
}

export function buildAliasPath(denom: string, symbol: string, decimals: number, image?: string) {
  // Keep the parameter for back-compat; the reviewer + metadata placeholder
  // layer will pick up the image via metadataPlaceholders, not the proto.
  void image;
  // Chain rule: denom unit decimals must be > 0. The chain rejects
  // `decimals: '0'` with "denom unit decimals cannot be 0". Fail fast at
  // build time so callers get a clear error instead of a chain rejection
  // ten steps later.
  if (!Number.isInteger(decimals) || decimals < 1) {
    throw new Error(
      `buildAliasPath: decimals must be an integer >= 1 (got ${decimals}). Use 1 for whole-unit-only tokens (e.g. NFTs that still need an alias path) or skip the alias path entirely if no fungible representation is needed.`
    );
  }
  // Both denom and symbol must satisfy the chain's wrapper-path regex
  // (`[a-zA-Z_{}-]+`). Validate up-front so callers get a clear error
  // instead of a chain "invalid characters" rejection at simulate time.
  const re = /^[a-zA-Z_{}\-]+$/;
  if (!re.test(denom)) {
    throw new Error(
      `buildAliasPath: denom "${denom}" contains invalid characters. Allowed: a-zA-Z, _, {, }, -. Use sanitizeCosmosPathName() to clean user input.`
    );
  }
  if (!re.test(symbol)) {
    throw new Error(
      `buildAliasPath: symbol "${symbol}" contains invalid characters. Allowed: a-zA-Z, _, {, }, -. Use sanitizeCosmosPathName() to clean user input.`
    );
  }
  // Chain rule: denom and symbol can't be the same string because the
  // chain validates them against a SHARED `symbolPaths` map per tx
  // (msg_server_universal_update_collection.go validatePathSymbols).
  // We already work around this by leaving the path-level symbol empty
  // below; this guard catches any caller that might pass the same
  // string for both fields explicitly.
  if (denom === symbol) {
    throw new Error(
      `buildAliasPath: denom and symbol cannot be identical ("${denom}"). The chain rejects this with "duplicate denom unit symbol" because both fields are validated against the same per-tx map. Use different strings (e.g. denom="usymbol", symbol="SYMBOL").`
    );
  }
  return {
    denom,
    conversion: {
      sideA: { amount: '1' },
      sideB: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }]
    },
    // Path-level symbol intentionally LEFT EMPTY. The chain validates
    // path-level symbols and denom-unit-level symbols against the SAME
    // `symbolPaths` map per tx (validatePathSymbols in
    // msg_server_universal_update_collection.go:673). When both are set
    // to the same string, the second insertion fails with "duplicate
    // denom unit symbol", even though there's only one alias path with
    // one denom unit. Skipping the path-level entry (chain check is
    // gated on `if pathSymbol != ""`) avoids the spurious collision
    // while keeping the user-facing symbol on the denom unit, which is
    // what the frontend / wallets actually display.
    symbol: '',
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
