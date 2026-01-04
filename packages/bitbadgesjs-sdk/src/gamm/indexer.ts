import { NumberType } from '@/common/string-numbers.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import { iCosmosCoin, CosmosCoin } from '@/core/coin.js';
import { Doc, PaginationInfo } from '@/api-indexer/base.js';
import { iMetadata, Metadata } from '@/api-indexer/metadata/metadata.js';

export interface iLiquidityPoolInfoVolume<T extends NumberType> {
  daily: iCosmosCoin<T>[];
  weekly: iCosmosCoin<T>[];
  monthly: iCosmosCoin<T>[];
  allTime: iCosmosCoin<T>[];
}

export class LiquidityPoolInfoVolume<T extends NumberType>
  extends BaseNumberTypeClass<LiquidityPoolInfoVolume<T>>
  implements iLiquidityPoolInfoVolume<T>
{
  daily: CosmosCoin<T>[];
  weekly: CosmosCoin<T>[];
  monthly: CosmosCoin<T>[];
  allTime: CosmosCoin<T>[];

  constructor(doc: iLiquidityPoolInfoVolume<T>) {
    super();
    this.daily = doc.daily.map((coin) => new CosmosCoin<T>(coin));
    this.weekly = doc.weekly.map((coin) => new CosmosCoin<T>(coin));
    this.monthly = doc.monthly.map((coin) => new CosmosCoin<T>(coin));
    this.allTime = doc.allTime.map((coin) => new CosmosCoin<T>(coin));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: { keepOriginalObject: boolean }): LiquidityPoolInfoVolume<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as LiquidityPoolInfoVolume<U>;
  }
}

export interface iLiquidityPoolInfoDoc<T extends NumberType> extends Doc {
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
  volume: iLiquidityPoolInfoVolume<T>;
  lastVolumeUpdate: number;
  liquidity: iCosmosCoin<T>[];
  lastLiquidityUpdate: number;
  totalShares: T;
}

export class LiquidityPoolInfoDoc<T extends NumberType> extends BaseNumberTypeClass<LiquidityPoolInfoDoc<T>> implements iLiquidityPoolInfoDoc<T> {
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
  volume: LiquidityPoolInfoVolume<T>;
  lastVolumeUpdate: number;
  liquidity: CosmosCoin<T>[];
  lastLiquidityUpdate: number;
  totalShares: T;

  constructor(doc: iLiquidityPoolInfoDoc<T>) {
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
    this.liquidity = doc.liquidity.map((coin) => new CosmosCoin<T>(coin));
    this.lastLiquidityUpdate = doc.lastLiquidityUpdate || Date.now();
    this.totalShares = doc.totalShares;
  }

  getNumberFieldNames(): string[] {
    return ['totalShares'];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: { keepOriginalObject: boolean }): LiquidityPoolInfoDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as LiquidityPoolInfoDoc<U>;
  }
}

export interface iAssetPriceHistoryDoc<T extends NumberType> extends Doc {
  asset: string;
  price: number;
  timestamp: T;
  totalLiquidity: iCosmosCoin<T>[];
  timeframe?: string;
  high?: number;
  low?: number;
  open?: number;
}

export class AssetPriceHistoryDoc<T extends NumberType> extends BaseNumberTypeClass<AssetPriceHistoryDoc<T>> implements iAssetPriceHistoryDoc<T> {
  _id?: string;
  _docId: string;
  asset: string;
  price: number;
  timestamp: T;
  totalLiquidity: CosmosCoin<T>[];
  timeframe: string;
  high?: number;
  low?: number;
  open?: number;

  constructor(doc: iAssetPriceHistoryDoc<T>) {
    super();
    this._id = doc._id;
    this._docId = doc._docId;
    this.asset = doc.asset;
    this.price = doc.price;
    this.timestamp = doc.timestamp;
    this.totalLiquidity = doc.totalLiquidity.map((coin) => new CosmosCoin<T>(coin));
    this.timeframe = doc.timeframe || '';
    this.high = doc.high;
    this.low = doc.low;
    this.open = doc.open;
  }

  getNumberFieldNames(): string[] {
    return ['timestamp'];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: { keepOriginalObject: boolean }): AssetPriceHistoryDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AssetPriceHistoryDoc<U>;
  }
}

export interface iGetAllPoolsPayload {
  bookmark?: string;
  sortBy?: 'liquidity' | 'volume' | 'dailyVolume' | 'weeklyVolume' | 'monthlyVolume' | 'allTimeVolume' | 'lastLiquidityUpdate' | 'lastVolumeUpdate';
  sortOrder?: 'asc' | 'desc';
}

export interface iGetAllPoolsSuccessResponse<T extends NumberType> {
  pools: LiquidityPoolInfoDoc<T>[];
  pagination: PaginationInfo;
}

export interface iGetPoolInfosByDenomPayload {
  denom: string;
}

export interface iGetPoolInfosByDenomSuccessResponse<T extends NumberType> {
  pools: LiquidityPoolInfoDoc<T>[];
  denom: string;
  count: number;
}

export interface iGetPoolInfosByAssetsPayload {
  asset1: string;
  asset2?: string;
}

export interface iGetPoolInfosByAssetsSuccessResponse<T extends NumberType> {
  pools: LiquidityPoolInfoDoc<T>[];
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

interface SkipGoMessage {
  multi_chain_msg: MultiChainMsg;
}

export interface iEstimateSwapPayload {
  /** The token in to swap. Format: "amount:X,denom:Y" */
  tokenIn: string;
  /** Optional chain ID for the token in. Defaults to "bitbadges-1" if not provided. */
  tokenInChainId?: string;
  /** The token out denom to swap to. */
  tokenOutDenom: string;
  /** Optional chain ID for the token out. Defaults to "bitbadges-1" if not provided. */
  tokenOutChainId?: string;
  /**
   * Mapping of chain IDs to addresses. Must include "bitbadges-1" with a valid BitBadges address.
   * Other chain addresses will be generated automatically from the bitbadges-1 address.
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

export interface iEstimateSwapSuccessResponse {
  success: boolean;
  estimate: {
    tokenOutAmount: string;
    tokenInAmount: string;
    skipGoMsgs: SkipGoMessage[];
    assetPath: {
      denom: string;
      chainId: string;
      how: 'genesis' | 'swap' | 'transfer';
    }[];
    doesSwap: boolean;
    lowLiquidityWarning?: boolean;
    complianceNotPassedWarning?: boolean;
    complianceErrorMessage?: string;
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

export interface iGetAssetPairsSuccessResponse<T extends NumberType> {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: T;
    lastUpdated: T;
    totalLiquidity: any[];
    volume24h: T;
    volume7d: T;
    percentageChange24h: T;
    percentageChange7d: T;
    info?: WrappedCosmosAssetMetadataDoc<T>;
  }>;
  pagination: PaginationInfo;
}

export interface iGetTopGainersPayload {
  bookmark?: string;
}

export interface iGetTopGainersSuccessResponse<T extends NumberType> {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: T;
    lastUpdated: T;
    totalLiquidity: any[];
    volume24h: T;
    volume7d: T;
    percentageChange24h: T;
    percentageChange7d: T;
    info?: WrappedCosmosAssetMetadataDoc<T>;
  }>;
  pagination: PaginationInfo;
}

export interface iGetTopLosersPayload {
  bookmark?: string;
}

export interface iGetTopLosersSuccessResponse<T extends NumberType> {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: T;
    lastUpdated: T;
    totalLiquidity: any[];
    volume24h: T;
    volume7d: T;
    percentageChange24h: T;
    percentageChange7d: T;
    info?: WrappedCosmosAssetMetadataDoc<T>;
  }>;
  pagination: PaginationInfo;
}

export interface iGetHighestVolumePayload {
  bookmark?: string;
}

export interface iGetHighestVolumeSuccessResponse<T extends NumberType> {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: T;
    lastUpdated: T;
    totalLiquidity: any[];
    volume24h: T;
    volume7d: T;
    percentageChange24h: T;
    percentageChange7d: T;
    info?: WrappedCosmosAssetMetadataDoc<T>;
  }>;
  pagination: PaginationInfo;
}

export interface iGetByPricePayload {
  bookmark?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface iGetByPriceSuccessResponse<T extends NumberType> {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: T;
    lastUpdated: T;
    totalLiquidity: any[];
    volume24h: T;
    volume7d: T;
    percentageChange24h: T;
    percentageChange7d: T;
    info?: WrappedCosmosAssetMetadataDoc<T>;
  }>;
  pagination: PaginationInfo;
}

export interface iGetWeeklyTopGainersPayload {
  bookmark?: string;
}

export interface iGetWeeklyTopGainersSuccessResponse<T extends NumberType> {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: T;
    lastUpdated: T;
    totalLiquidity: any[];
    volume24h: T;
    volume7d: T;
    percentageChange24h: T;
    percentageChange7d: T;
    info?: WrappedCosmosAssetMetadataDoc<T>;
  }>;
  pagination: PaginationInfo;
}

export interface iGetWeeklyTopLosersPayload {
  bookmark?: string;
}

export interface iGetWeeklyTopLosersSuccessResponse<T extends NumberType> {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: T;
    lastUpdated: T;
    totalLiquidity: any[];
    volume24h: T;
    volume7d: T;
    percentageChange24h: T;
    percentageChange7d: T;
    info?: WrappedCosmosAssetMetadataDoc<T>;
  }>;
  pagination: PaginationInfo;
}

export interface iSearchAssetPairsByTextPayload {
  query: string;
}

export interface iSearchAssetPairsByTextSuccessResponse<T extends NumberType> {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: T;
    lastUpdated: T;
    totalLiquidity: any[];
    volume24h: T;
    volume7d: T;
    percentageChange24h: T;
    percentageChange7d: T;
    info?: WrappedCosmosAssetMetadataDoc<T>;
  }>;
  pagination: PaginationInfo;
}

export interface iGetByDenomsPayload {
  denoms: string[];
}

export interface iGetByDenomsSuccessResponse<T extends NumberType> {
  assetPairs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: T;
    lastUpdated: T;
    totalLiquidity: any[];
    volume24h: T;
    volume7d: T;
    percentageChange24h: T;
    percentageChange7d: T;
    info?: WrappedCosmosAssetMetadataDoc<T>;
  }>;
  pagination: PaginationInfo;
}
export interface iWrappedCosmosAssetMetadataDoc<T extends NumberType> extends Doc {
  collectionId: string;
  baseDenom: string;
  symbol: string;
  decimals: T;
  metadata: iMetadata<T>;
}

export class WrappedCosmosAssetMetadataDoc<T extends NumberType>
  extends BaseNumberTypeClass<WrappedCosmosAssetMetadataDoc<T>>
  implements iWrappedCosmosAssetMetadataDoc<T>
{
  _id?: string;
  _docId: string;
  collectionId: string;
  baseDenom: string;
  symbol: string;
  decimals: T;
  metadata: Metadata<T>;

  constructor(doc: iWrappedCosmosAssetMetadataDoc<T>) {
    super();
    this._id = doc._id;
    this._docId = doc._docId;
    this.collectionId = doc.collectionId;
    this.baseDenom = doc.baseDenom;
    this.symbol = doc.symbol;
    this.decimals = doc.decimals;
    this.metadata = new Metadata<T>(doc.metadata);
  }

  getNumberFieldNames(): string[] {
    return ['decimals'];
  }

  convert<U extends NumberType>(
    convertFunction: (val: NumberType) => U,
    options?: { keepOriginalObject: boolean }
  ): WrappedCosmosAssetMetadataDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as WrappedCosmosAssetMetadataDoc<U>;
  }
}
