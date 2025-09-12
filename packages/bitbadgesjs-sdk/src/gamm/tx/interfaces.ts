import type { NumberType } from '@/common/string-numbers.js';
import type { iCosmosCoin } from '@/core/coin.js';
import type { iPoolAsset, iPoolParams } from '../interfaces.js';

export interface iSwapAmountInRoute<T extends NumberType> {
  poolId: T;
  tokenOutDenom: string;
}

export interface iSwapAmountOutRoute<T extends NumberType> {
  poolId: T;
  tokenInDenom: string;
}

export interface iMsgJoinPool<T extends NumberType> {
  sender: string;
  poolId: T;
  shareOutAmount: T;
  tokenInMaxs: iCosmosCoin<T>[];
}

export interface iMsgJoinPoolResponse<T extends NumberType> {
  shareOutAmount: T;
  tokenIn: iCosmosCoin<T>[];
}

export interface iMsgExitPool<T extends NumberType> {
  sender: string;
  poolId: T;
  shareInAmount: T;
  tokenOutMins: iCosmosCoin<T>[];
}

export interface iMsgExitPoolResponse<T extends NumberType> {
  tokenOut: iCosmosCoin<T>[];
}

export interface iMsgSwapExactAmountIn<T extends NumberType> {
  sender: string;
  routes: iSwapAmountInRoute<T>[];
  tokenIn: iCosmosCoin<T>;
  tokenOutMinAmount: T;
}

export interface iMsgSwapExactAmountInResponse<T extends NumberType> {
  tokenOutAmount: T;
}

export interface iMsgSwapExactAmountOut<T extends NumberType> {
  sender: string;
  routes: iSwapAmountOutRoute<T>[];
  tokenInMaxAmount: T;
  tokenOut: iCosmosCoin<T>;
}

export interface iMsgSwapExactAmountOutResponse<T extends NumberType> {
  tokenInAmount: T;
}

export interface iMsgJoinSwapExternAmountIn<T extends NumberType> {
  sender: string;
  poolId: T;
  tokenIn: iCosmosCoin<T>;
  shareOutMinAmount: T;
}

export interface iMsgJoinSwapExternAmountInResponse<T extends NumberType> {
  shareOutAmount: T;
}

export interface iMsgJoinSwapShareAmountOut<T extends NumberType> {
  sender: string;
  poolId: T;
  tokenInDenom: string;
  shareOutAmount: T;
  tokenInMaxAmount: T;
}

export interface iMsgJoinSwapShareAmountOutResponse<T extends NumberType> {
  tokenInAmount: T;
}

export interface iMsgExitSwapShareAmountIn<T extends NumberType> {
  sender: string;
  poolId: T;
  tokenOutDenom: string;
  shareInAmount: T;
  tokenOutMinAmount: T;
}

export interface iMsgExitSwapShareAmountInResponse<T extends NumberType> {
  tokenOutAmount: T;
}

export interface iMsgExitSwapExternAmountOut<T extends NumberType> {
  sender: string;
  poolId: T;
  tokenOut: iCosmosCoin<T>;
  shareInMaxAmount: T;
}

export interface iMsgExitSwapExternAmountOutResponse<T extends NumberType> {
  shareInAmount: T;
}

export interface iMsgCreateBalancerPool<T extends NumberType> {
  sender: string;
  poolParams: iPoolParams<T>;
  poolAssets: iPoolAsset<T>[];
}

export interface iMsgCreateBalancerPoolResponse<T extends NumberType> {
  poolId: T;
}
