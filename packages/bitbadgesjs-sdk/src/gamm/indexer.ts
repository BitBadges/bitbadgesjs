import { NumberType } from '@/common/string-numbers.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import { iCosmosCoin, CosmosCoin } from '@/core/coin.js';
import { Doc, PaginationInfo } from '@/api-indexer/base.js';
import { iMetadata, Metadata } from '@/api-indexer/metadata/metadata.js';

export interface iLiquidityPoolInfoVolume {
  daily: iCosmosCoin[];
  weekly: iCosmosCoin[];
  monthly: iCosmosCoin[];
  allTime: iCosmosCoin[];
}

export class LiquidityPoolInfoVolume extends BaseNumberTypeClass<LiquidityPoolInfoVolume> implements iLiquidityPoolInfoVolume {
  daily: CosmosCoin[];
  weekly: CosmosCoin[];
  monthly: CosmosCoin[];
  allTime: CosmosCoin[];

  constructor(doc: iLiquidityPoolInfoVolume) {
    super();
    this.daily = doc.daily.map((coin) => new CosmosCoin(coin));
    this.weekly = doc.weekly.map((coin) => new CosmosCoin(coin));
    this.monthly = doc.monthly.map((coin) => new CosmosCoin(coin));
    this.allTime = doc.allTime.map((coin) => new CosmosCoin(coin));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: { keepOriginalObject: boolean }): LiquidityPoolInfoVolume {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as LiquidityPoolInfoVolume;
  }
}

export interface iLiquidityPoolInfoDoc extends Doc {
  poolId: string;
  collectionId: string;
  address: string;
  allAssetDenoms: string[];
  asset1: string;
  asset2: string;
  poolParams?: {
    swapFee: string;
    exitFee: string;
  };
  volume: iLiquidityPoolInfoVolume;
  lastVolumeUpdate: number;
  liquidity: iCosmosCoin[];
  lastLiquidityUpdate: number;
  totalShares: string | number;
}

export class LiquidityPoolInfoDoc extends BaseNumberTypeClass<LiquidityPoolInfoDoc> implements iLiquidityPoolInfoDoc {
  _id?: string;
  _docId: string;
  poolId: string;
  collectionId: string;
  address: string;
  allAssetDenoms: string[];
  asset1: string;
  asset2: string;
  poolParams?: {
    swapFee: string;
    exitFee: string;
  };
  volume: LiquidityPoolInfoVolume;
  lastVolumeUpdate: number;
  liquidity: CosmosCoin[];
  lastLiquidityUpdate: number;
  totalShares: string | number;

  constructor(doc: iLiquidityPoolInfoDoc) {
    super();
    this._id = doc._id;
    this._docId = doc._docId;
    this.poolId = doc.poolId;
    this.collectionId = doc.collectionId;
    this.address = doc.address;
    this.allAssetDenoms = doc.allAssetDenoms;
    this.asset1 = doc.asset1;
    this.asset2 = doc.asset2;
    this.poolParams = doc.poolParams;
    this.volume = new LiquidityPoolInfoVolume(doc.volume);
    this.lastVolumeUpdate = doc.lastVolumeUpdate || Date.now();
    this.liquidity = doc.liquidity.map((coin) => new CosmosCoin(coin));
    this.lastLiquidityUpdate = doc.lastLiquidityUpdate || Date.now();
    this.totalShares = doc.totalShares;
  }

  getNumberFieldNames(): string[] {
    return ['totalShares'];
  }

  convert(convertFunction: (val: string | number) => U, options?: { keepOriginalObject: boolean }): LiquidityPoolInfoDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as LiquidityPoolInfoDoc;
  }
}

export interface iAssetPriceHistoryDoc extends Doc {
  asset: string;
  price: number;
  timestamp: string | number;
  totalLiquidity: iCosmosCoin[];
  timeframe?: string;
  high?: number;
  low?: number;
  open?: number;
}

export class AssetPriceHistoryDoc extends BaseNumberTypeClass<AssetPriceHistoryDoc> implements iAssetPriceHistoryDoc {
  _id?: string;
  _docId: string;
  asset: string;
  price: number;
  timestamp: string | number;
  totalLiquidity: CosmosCoin[];
  timeframe: string;
  high?: number;
  low?: number;
  open?: number;

  constructor(doc: iAssetPriceHistoryDoc) {
    super();
    this._id = doc._id;
    this._docId = doc._docId;
    this.asset = doc.asset;
    this.price = doc.price;
    this.timestamp = doc.timestamp;
    this.totalLiquidity = doc.totalLiquidity.map((coin) => new CosmosCoin(coin));
    this.timeframe = doc.timeframe || '';
    this.high = doc.high;
    this.low = doc.low;
    this.open = doc.open;
  }

  getNumberFieldNames(): string[] {
    return ['timestamp'];
  }

  convert(convertFunction: (val: string | number) => U, options?: { keepOriginalObject: boolean }): AssetPriceHistoryDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AssetPriceHistoryDoc;
  }
}

export interface iGetAllPoolsPayload {
  bookmark?: string;
  sortBy?: 'liquidity' | 'volume' | 'dailyVolume' | 'weeklyVolume' | 'monthlyVolume' | 'allTimeVolume' | 'lastLiquidityUpdate' | 'lastVolumeUpdate';
  sortOrder?: 'asc' | 'desc';
}

export interface iGetAllPoolsSuccessResponse {
  pools: LiquidityPoolInfoDoc[];
  pagination: PaginationInfo;
}

export interface iGetPoolInfosByDenomPayload {
  denom: string;
}

export interface iGetPoolInfosByDenomSuccessResponse {
  pools: LiquidityPoolInfoDoc[];
  denom: string;
  count: number;
}

export interface iGetPoolInfosByAssetsPayload {
  asset1: string;
  asset2?: string;
}

export interface iGetPoolInfosByAssetsSuccessResponse {
  pools: LiquidityPoolInfoDoc[];
  asset1: string;
  asset2?: string;
  count: number;
}

export interface iGetPoolInfoByIdPayload {
  poolId: string;
}

export interface iGetPoolInfoByIdSuccessResponse {
  success: boolean;
  poolInfo: any; // This would be the actual pool info from GAMM query client
}

// ============================================================================
// SWAP TYPES
// ============================================================================

interface MultiChainMsg {
  chain_id: string;
  path: string[];
  msg: string;
  msg_type_url: string;
}

interface EvmTx {
  chain_id: string;
  to: string;
  value: string;
  data: string;
  required_erc20_approvals?: Array<{ token: string; spender: string }>;
  signer_address: string;
}

interface SkipGoMessage {
  multi_chain_msg?: MultiChainMsg;
  evm_tx?: EvmTx;
}

export interface iEstimateSwapPayload {
  /** The token in to swap. Formats accepted: "amount:1,denom:ubadge" or "1ubadge" */
  tokenIn: string;
  /** Optional chain ID for the token in. Defaults to "bitbadges-1" if not provided. */
  tokenInChainId?: string;
  /** The token out denom to swap to. */
  tokenOutDenom: string;
  /** Optional chain ID for the token out. Defaults to "bitbadges-1" if not provided. */
  tokenOutChainId?: string;
  /**
   * Mapping of chain IDs to addresses.
   * Only supports "bitbadges-1" (bech32 bb prefixed address for Cosmos-based chains) and "1" (EVM-based chains with a standard 0x address)
   *
   * We will generate any other chain addresses from these addresses.
   */
  chainIdsToAddresses: Record<string, string>;
  /**
   * Optional mapping of chain IDs to affiliate fee recipients.
   * Structure: { [chainId]: { affiliates: Array<{ address: string; basis_points_fee: string }> } }
   */
  chainIdsToAffiliates?: Record<string, { affiliates: Array<{ address: string; basis_points_fee: string }> }>;
  /** Slippage tolerance as a percentage (0-100). Can be a string or number. */
  slippageTolerancePercent: string | number;
  /** Forcefully recheck compliance and avoid cache (5 minutes) */
  forcefulRecheckCompliance?: boolean;
}

/**
 * Response interface for a successful swap estimation.
 * Contains the estimated swap details including amounts, routing path, and any warnings.
 */
export interface iEstimateSwapSuccessResponse {
  /** Whether the swap estimation was successful. */
  success: boolean;
  /** Detailed estimation information for the swap. */
  estimate: {
    /** The estimated amount of tokens that will be received (token out). */
    tokenOutAmount: string;
    /** The amount of tokens being swapped in (token in). */
    tokenInAmount: string;
    /**
     * Messages for multi-chain routing.
     * Contains either a multi-chain message (for Cosmos chains) or an EVM transaction (for EVM chains).
     * These messages are used to execute the swap across different chains if needed.
     */
    skipGoMsgs: SkipGoMessage[];
    /**
     * The path the asset takes through different chains and operations to complete the swap.
     * Each step in the path indicates the denom, chain ID, and how the asset moves (genesis, swap, or transfer).
     */
    assetPath: {
      denom: string;
      chainId: string;
      how: 'genesis' | 'swap' | 'transfer';
    }[];
    /** Whether an actual swap operation occurs (true) or if it's just a transfer. */
    doesSwap: boolean;
    /** Warning flag indicating if the liquidity pool has low liquidity, which may affect swap execution. */
    lowLiquidityWarning?: boolean;
    /** Warning flag indicating if compliance checks did not pass for this swap. This means swap is likely to fail on BitBadges pool swap with compliance checks. */
    complianceNotPassedWarning?: boolean;
    /** Detailed error message if compliance checks failed. */
    complianceErrorMessage?: string;
    /** Estimated time in seconds for the swap to complete (if available). */
    estimatedTime?: number;
    /** Fallback asset if swap is not possible. */
    fallbackAsset?: { denom: string; chainId: string };
    /** Whether the swap was automatically redirected to WETH. BitBadges only supports single-tx operations. Bridges return WETH. Then, another unwrap tx is required (which we do not handle). */
    autoRedirectedToWETH?: boolean;
    /** Whether the swap was vs standard estimate (internal use) */
    rerouted?: boolean;
  };
}

// ============================================================================
// ASSET PAIRS TYPES
// ============================================================================

export interface iGetAssetPairsPayload {
  bookmark?: string;
  sortBy?: 'volume24h' | 'volume7d' | 'percentageChange24h' | 'percentageChange7d' | 'price';
  sortDirection?: 'asc' | 'desc';
}

export interface iGetAssetPairsSuccessResponse {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: string | number;
    lastUpdated: string | number;
    totalLiquidity: any[];
    volume24h: string | number;
    volume7d: string | number;
    percentageChange24h: string | number;
    percentageChange7d: string | number;
    info?: WrappedCosmosAssetMetadataDoc;
  }>;
  pagination: PaginationInfo;
}

export interface iGetTopGainersPayload {
  bookmark?: string;
}

export interface iGetTopGainersSuccessResponse {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: string | number;
    lastUpdated: string | number;
    totalLiquidity: any[];
    volume24h: string | number;
    volume7d: string | number;
    percentageChange24h: string | number;
    percentageChange7d: string | number;
    info?: WrappedCosmosAssetMetadataDoc;
  }>;
  pagination: PaginationInfo;
}

export interface iGetTopLosersPayload {
  bookmark?: string;
}

export interface iGetTopLosersSuccessResponse {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: string | number;
    lastUpdated: string | number;
    totalLiquidity: any[];
    volume24h: string | number;
    volume7d: string | number;
    percentageChange24h: string | number;
    percentageChange7d: string | number;
    info?: WrappedCosmosAssetMetadataDoc;
  }>;
  pagination: PaginationInfo;
}

export interface iGetHighestVolumePayload {
  bookmark?: string;
}

export interface iGetHighestVolumeSuccessResponse {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: string | number;
    lastUpdated: string | number;
    totalLiquidity: any[];
    volume24h: string | number;
    volume7d: string | number;
    percentageChange24h: string | number;
    percentageChange7d: string | number;
    info?: WrappedCosmosAssetMetadataDoc;
  }>;
  pagination: PaginationInfo;
}

export interface iGetByPricePayload {
  bookmark?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface iGetByPriceSuccessResponse {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: string | number;
    lastUpdated: string | number;
    totalLiquidity: any[];
    volume24h: string | number;
    volume7d: string | number;
    percentageChange24h: string | number;
    percentageChange7d: string | number;
    info?: WrappedCosmosAssetMetadataDoc;
  }>;
  pagination: PaginationInfo;
}

export interface iGetWeeklyTopGainersPayload {
  bookmark?: string;
}

export interface iGetWeeklyTopGainersSuccessResponse {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: string | number;
    lastUpdated: string | number;
    totalLiquidity: any[];
    volume24h: string | number;
    volume7d: string | number;
    percentageChange24h: string | number;
    percentageChange7d: string | number;
    info?: WrappedCosmosAssetMetadataDoc;
  }>;
  pagination: PaginationInfo;
}

export interface iGetWeeklyTopLosersPayload {
  bookmark?: string;
}

export interface iGetWeeklyTopLosersSuccessResponse {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: string | number;
    lastUpdated: string | number;
    totalLiquidity: any[];
    volume24h: string | number;
    volume7d: string | number;
    percentageChange24h: string | number;
    percentageChange7d: string | number;
    info?: WrappedCosmosAssetMetadataDoc;
  }>;
  pagination: PaginationInfo;
}

export interface iSearchAssetPairsByTextPayload {
  query: string;
}

export interface iSearchAssetPairsByTextSuccessResponse {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: string | number;
    lastUpdated: string | number;
    totalLiquidity: any[];
    volume24h: string | number;
    volume7d: string | number;
    percentageChange24h: string | number;
    percentageChange7d: string | number;
    info?: WrappedCosmosAssetMetadataDoc;
  }>;
  pagination: PaginationInfo;
}

export interface iGetByDenomsPayload {
  denoms: string[];
}

export interface iGetByDenomsSuccessResponse {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: string | number;
    lastUpdated: string | number;
    totalLiquidity: any[];
    volume24h: string | number;
    volume7d: string | number;
    percentageChange24h: string | number;
    percentageChange7d: string | number;
    info?: WrappedCosmosAssetMetadataDoc;
  }>;
  pagination: PaginationInfo;
}
export interface iWrappedCosmosAssetMetadataDoc extends Doc {
  collectionId: string;
  baseDenom: string;
  symbol: string;
  decimals: string | number;
  metadata: iMetadata;
}

export class WrappedCosmosAssetMetadataDoc extends BaseNumberTypeClass<WrappedCosmosAssetMetadataDoc> implements iWrappedCosmosAssetMetadataDoc {
  _id?: string;
  _docId: string;
  collectionId: string;
  baseDenom: string;
  symbol: string;
  decimals: string | number;
  metadata: Metadata;

  constructor(doc: iWrappedCosmosAssetMetadataDoc) {
    super();
    this._id = doc._id;
    this._docId = doc._docId;
    this.collectionId = doc.collectionId;
    this.baseDenom = doc.baseDenom;
    this.symbol = doc.symbol;
    this.decimals = doc.decimals;
    this.metadata = new Metadata(doc.metadata);
  }

  getNumberFieldNames(): string[] {
    return ['decimals'];
  }

  convert(convertFunction: (val: string | number) => U, options?: { keepOriginalObject: boolean }): WrappedCosmosAssetMetadataDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as WrappedCosmosAssetMetadataDoc;
  }
}
