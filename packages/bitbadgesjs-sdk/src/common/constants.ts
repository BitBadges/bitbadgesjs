/**
 * BitBadges Betanet chain details.
 *
 * @category Chain Details
 */
export const BETANET_CHAIN_DETAILS = {
  chainId: 1,
  cosmosChainId: 'bitbadges_1-1'
};

/**
 * BitBadges Testnet chain details. This is the same as the Betanet chain details for now.
 *
 * @category Chain Details
 */
export const TESTNET_CHAIN_DETAILS = {
  chainId: 1,
  cosmosChainId: 'bitbadges_1-2'
};

/**
 * BitBadges Mainnet chain details.
 *
 * @category Chain Details
 */
export const MAINNET_CHAIN_DETAILS = {
  chainId: 1,
  cosmosChainId: 'bitbadges_1-1'
};

/**
 * BitBadges Betanet chain details to suggest to Keplr.
 *
 * @category Chain Details
 */
export const BitBadgesKeplrSuggestBetanetChainInfo = {
  chainId: 'bitbadges_1-1',
  chainName: 'BitBadges',
  chainSymbolImageUrl: 'https://avatars.githubusercontent.com/u/86890740',
  coinImageUrl: 'https://avatars.githubusercontent.com/u/86890740',
  rpc: 'https://node.bitbadges.io/rpc',
  rest: 'https://node.bitbadges.io/api',
  bip44: {
    coinType: 118
  },
  bech32Config: {
    bech32PrefixAccAddr: 'cosmos',
    bech32PrefixAccPub: 'cosmos' + 'pub',
    bech32PrefixValAddr: 'cosmos' + 'valoper',
    bech32PrefixValPub: 'cosmos' + 'valoperpub',
    bech32PrefixConsAddr: 'cosmos' + 'valcons',
    bech32PrefixConsPub: 'cosmos' + 'valconspub'
  },
  currencies: [
    {
      coinDenom: 'BADGE',
      coinMinimalDenom: 'ubadge',
      coinDecimals: 9,
      coinGeckoId: 'cosmos',
      coinImageUrl: 'https://avatars.githubusercontent.com/u/86890740'
    },
    {
      coinDenom: 'STAKE',
      coinMinimalDenom: 'ustake',
      coinDecimals: 9,
      coinGeckoId: 'cosmos',
      coinImageUrl: 'https://avatars.githubusercontent.com/u/86890740'
    }
  ],
  feeCurrencies: [
    {
      coinDenom: 'BADGE',
      coinMinimalDenom: 'ubadge',
      coinDecimals: 9,
      coinGeckoId: 'cosmos',
      gasPriceStep: {
        low: 0.000000000001,
        average: 0.000000000001,
        high: 0.000000000001
      },
      coinImageUrl: 'https://avatars.githubusercontent.com/u/86890740'
    }
  ],
  stakeCurrency: {
    coinDenom: 'STAKE',
    coinMinimalDenom: 'ustake',
    coinDecimals: 9,
    coinGeckoId: 'cosmos',
    coinImageUrl: 'https://avatars.githubusercontent.com/u/86890740'
  }
};
