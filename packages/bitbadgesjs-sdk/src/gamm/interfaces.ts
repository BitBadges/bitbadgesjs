import { NumberType } from '@/common/string-numbers.js';
import { iCosmosCoin } from '@/core/coin.js';

export interface iPoolParams {
  swapFee: string;
  exitFee: string;
}

export interface iPoolAsset {
  token: iCosmosCoin;
  weight: string | number;
}

export interface iPool {
  address: string;
  id: string | number;
  poolParams: iPoolParams;
  totalShares: iCosmosCoin;
  poolAssets: iPoolAsset[];
  totalWeight: string | number;
}
