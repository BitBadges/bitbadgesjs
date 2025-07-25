/**
 * BitBadges Betanet chain details.
 *
 * @category Chain Details
 */
export const BETANET_CHAIN_DETAILS = {
  chainId: 1,
  cosmosChainId: 'bitbadges-1'
};

/**
 * BitBadges Testnet chain details.
 *
 * @category Chain Details
 */
export const TESTNET_CHAIN_DETAILS = {
  chainId: 2,
  cosmosChainId: 'bitbadges-2'
};

/**
 * BitBadges Mainnet chain details.
 *
 * @category Chain Details
 */
export const MAINNET_CHAIN_DETAILS = BETANET_CHAIN_DETAILS;

/**
 * Thorchain chain details.
 *
 * @category Chain Details
 */
export const THORCHAIN_CHAIN_DETAILS = {
  chainId: 1,
  cosmosChainId: 'thorchain'
};

/**
 * BitBadges Betanet chain details to suggest to Keplr.
 *
 * @category Chain Details
 */
export const BitBadgesKeplrSuggestMainnetChainInfo = {
  chainId: 'bitbadges-1',
  chainName: 'BitBadges',
  chainSymbolImageUrl: 'https://avatars.githubusercontent.com/u/86890740',
  coinImageUrl: 'https://github.com/cosmos/chain-registry/blob/master/bitbadges/images/badge_logo.png?raw=true',
  rpc: 'https://rpc.bitbadges.io',
  rest: 'https://lcd.bitbadges.io',
  bip44: {
    coinType: 118
  },
  bech32Config: {
    bech32PrefixAccAddr: 'bb',
    bech32PrefixAccPub: 'bb' + 'pub',
    bech32PrefixValAddr: 'bb' + 'valoper',
    bech32PrefixValPub: 'bb' + 'valoperpub',
    bech32PrefixConsAddr: 'bb' + 'valcons',
    bech32PrefixConsPub: 'bb' + 'valconspub'
  },
  currencies: [
    {
      coinDenom: 'BADGE',
      coinMinimalDenom: 'ubadge',
      coinDecimals: 9,
      coinImageUrl: 'https://github.com/cosmos/chain-registry/blob/master/bitbadges/images/badge_logo.png?raw=true',
      icon: 'https://github.com/cosmos/chain-registry/blob/master/bitbadges/images/badge_logo.png?raw=true'
    }
  ],
  feeCurrencies: [
    {
      coinDenom: 'BADGE',
      coinMinimalDenom: 'ubadge',
      coinDecimals: 9,
      gasPriceStep: {
        low: 0.000000000001,
        average: 0.000000000001,
        high: 0.000000000001
      },
      coinImageUrl: 'https://github.com/cosmos/chain-registry/blob/master/bitbadges/images/badge_logo.png?raw=true',
      icon: 'https://github.com/cosmos/chain-registry/blob/master/bitbadges/images/badge_logo.png?raw=true'
    }
  ],
  stakeCurrency: {
    coinDenom: 'BADGE',
    coinMinimalDenom: 'ubadge',
    coinDecimals: 9,
    coinImageUrl: 'https://github.com/cosmos/chain-registry/blob/master/bitbadges/images/badge_logo.png?raw=true',
    icon: 'https://github.com/cosmos/chain-registry/blob/master/bitbadges/images/badge_logo.png?raw=true'
  },
  image: 'https://avatars.githubusercontent.com/u/86890740'
};

/**
 * BitBadges testnet chain details to suggest to Keplr.
 *
 * @category Chain Details
 */
export const BitBadgesKeplrSuggestTestnetChainInfo = {
  ...BitBadgesKeplrSuggestMainnetChainInfo,
  chainId: 'bitbadges-2',
  chainName: 'BitBadges Testnet',

  rpc: 'http://138.197.10.8:26657',
  rest: 'http://138.197.10.8:1317'
};
