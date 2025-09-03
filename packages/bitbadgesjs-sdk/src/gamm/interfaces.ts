import { NumberType } from '@/common/string-numbers.js';
import { iCosmosCoin } from '@/core/coin.js';

export interface iPoolParams<T extends NumberType> {
  swapFee: number;
  exitFee: number;
}

export interface iPoolAsset<T extends NumberType> {
  token: iCosmosCoin<T>;
  weight: T;
}

export interface iPool<T extends NumberType> {
  address: string;
  id: T;
  poolParams: iPoolParams<T>;
  totalShares: iCosmosCoin<T>;
  poolAssets: iPoolAsset<T>[];
  totalWeight: T;
}
