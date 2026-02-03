import type { NumberType } from '@/common/string-numbers.js';
import type { iCosmosCoin } from '@/core/coin.js';
import type { iPoolAsset, iPoolParams } from '../interfaces.js';

export interface iSwapAmountInRoute {
  poolId: string | number;
  tokenOutDenom: string;
}

export interface iSwapAmountOutRoute {
  poolId: string | number;
  tokenInDenom: string;
}

export interface iAffiliate {
  /** basis_points_fee is the fee in basis points (1/10000, e.g., 100 = 1%) */
  basisPointsFee: string;
  /** address is the affiliate recipient address */
  address: string;
}

export interface iMsgJoinPool {
  sender: string;
  poolId: string | number;
  shareOutAmount: string | number;
  tokenInMaxs: iCosmosCoin[];
}

export interface iMsgJoinPoolResponse {
  shareOutAmount: string | number;
  tokenIn: iCosmosCoin[];
}

export interface iMsgExitPool {
  sender: string;
  poolId: string | number;
  shareInAmount: string | number;
  tokenOutMins: iCosmosCoin[];
}

export interface iMsgExitPoolResponse {
  tokenOut: iCosmosCoin[];
}

export interface iMsgSwapExactAmountIn {
  sender: string;
  routes: iSwapAmountInRoute[];
  tokenIn: iCosmosCoin;
  tokenOutMinAmount: string | number;
  affiliates: iAffiliate[];
}

export interface iMsgSwapExactAmountInResponse {
  tokenOutAmount: string | number;
}

export interface iIBCTransferInfo {
  sourceChannel: string;
  receiver: string;
  memo: string;
  timeoutTimestamp: string | number;
}

export interface iMsgSwapExactAmountInWithIBCTransfer {
  sender: string;
  routes: iSwapAmountInRoute[];
  tokenIn: iCosmosCoin;
  tokenOutMinAmount: string | number;
  ibcTransferInfo: iIBCTransferInfo;
  /** affiliates are fee recipients that receive fees calculated from token_out_min_amount */
  affiliates: iAffiliate[];
}

export interface iMsgSwapExactAmountInWithIBCTransferResponse {
  tokenOutAmount: string | number;
}

export interface iMsgSwapExactAmountOut {
  sender: string;
  routes: iSwapAmountOutRoute[];
  tokenInMaxAmount: string | number;
  tokenOut: iCosmosCoin;
}

export interface iMsgSwapExactAmountOutResponse {
  tokenInAmount: string | number;
}

export interface iMsgJoinSwapExternAmountIn {
  sender: string;
  poolId: string | number;
  tokenIn: iCosmosCoin;
  shareOutMinAmount: string | number;
}

export interface iMsgJoinSwapExternAmountInResponse {
  shareOutAmount: string | number;
}

export interface iMsgJoinSwapShareAmountOut {
  sender: string;
  poolId: string | number;
  tokenInDenom: string;
  shareOutAmount: string | number;
  tokenInMaxAmount: string | number;
}

export interface iMsgJoinSwapShareAmountOutResponse {
  tokenInAmount: string | number;
}

export interface iMsgExitSwapShareAmountIn {
  sender: string;
  poolId: string | number;
  tokenOutDenom: string;
  shareInAmount: string | number;
  tokenOutMinAmount: string | number;
}

export interface iMsgExitSwapShareAmountInResponse {
  tokenOutAmount: string | number;
}

export interface iMsgExitSwapExternAmountOut {
  sender: string;
  poolId: string | number;
  tokenOut: iCosmosCoin;
  shareInMaxAmount: string | number;
}

export interface iMsgExitSwapExternAmountOutResponse {
  shareInAmount: string | number;
}

export interface iMsgCreateBalancerPool {
  sender: string;
  poolParams: iPoolParams;
  poolAssets: iPoolAsset[];
}

export interface iMsgCreateBalancerPoolResponse {
  poolId: string | number;
}
