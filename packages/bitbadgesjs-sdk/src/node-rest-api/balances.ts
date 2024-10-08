import type { CosmosCoin } from '@/core/coin.js';

export function generateEndpointBalances(address: string) {
  return `/cosmos/bank/v1beta1/balances/${address}`;
}

/* eslint-disable camelcase */
export interface BalancesResponse {
  balances: CosmosCoin<string>[];
  pagination: {
    next_key: string;
    total: number;
  };
}
