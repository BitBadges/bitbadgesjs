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
        low: 0.01,
        average: 0.025,
        high: 0.03
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

/**
 * Coin details interface for the coins registry.
 *
 * @category Coins Registry
 */
export interface CoinDetails {
  skipGoSupported?: boolean;
  label: string;
  symbol: string;
  decimals: string;
  baseDenom: string;
  image: string;
}

/**
 * Base coins registry containing common coins available across all networks.
 *
 * @category Coins Registry
 */
const BaseCoinsRegistry: Record<string, CoinDetails> = {
  ubadge: {
    skipGoSupported: true,
    label: 'BADGE',
    symbol: 'BADGE',
    decimals: '9',
    baseDenom: 'ubadge',
    image: 'https://github.com/cosmos/chain-registry/blob/master/bitbadges/images/badge_logo.png?raw=true'
  }
};

/**
 * Mainnet coins registry containing coins available on mainnet.
 *
 * @category Coins Registry
 */
export const MAINNET_COINS_REGISTRY: Record<string, CoinDetails> = {
  ...BaseCoinsRegistry,
  'badges:49:chaosnet': {
    skipGoSupported: false,
    label: 'CHAOS',
    symbol: 'CHAOS',
    decimals: '9',
    baseDenom: 'badges:49:chaosnet',
    image: 'https://bitbadges.io/_next/image?url=https%3A%2F%2Fbitbadges-ipfs.infura-ipfs.io%2Fipfs%2FQmdRQUvQBo6p24RQ7AS7RD6srqyUjoHJ5Cjs4p22zie9bQ&w=1920&q=75'
  },
  'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349': {
    skipGoSupported: true,
    label: 'USDC',
    symbol: 'USDC',
    decimals: '6',
    baseDenom: 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349',
    image: 'https://github.com/cosmos/chain-registry/blob/master/noble/images/USDCoin.png?raw=true'
  },
  'ibc/A4DB47A9D3CF9A068D454513891B526702455D3EF08FB9EB558C561F9DC2B701': {
    skipGoSupported: true,
    label: 'ATOM',
    symbol: 'ATOM',
    decimals: '6',
    baseDenom: 'ibc/A4DB47A9D3CF9A068D454513891B526702455D3EF08FB9EB558C561F9DC2B701',
    image: 'https://github.com/cosmos/chain-registry/blob/master/cosmoshub/images/atom.png?raw=true'
  },
  'ibc/ED07A3391A112B175915CD8FAF43A2DA8E4790EDE12566649D0C2F97716B8518': {
    skipGoSupported: true,
    label: 'OSMO',
    symbol: 'OSMO',
    decimals: '6',
    baseDenom: 'ibc/ED07A3391A112B175915CD8FAF43A2DA8E4790EDE12566649D0C2F97716B8518',
    image: 'https://github.com/cosmos/chain-registry/blob/master/osmosis/images/osmo.png?raw=true'
  }
};

/**
 * Testnet coins registry containing coins available on testnet.
 *
 * @category Coins Registry
 */
export const TESTNET_COINS_REGISTRY: Record<string, CoinDetails> = {
  ...BaseCoinsRegistry
  // Testnet-specific coins can be added here
};

/**
 * Combined coins registry that merges base registry with mainnet or testnet registry.
 *
 * @category Coins Registry
 */
export const CoinsRegistry: Record<string, CoinDetails> = MAINNET_COINS_REGISTRY;
