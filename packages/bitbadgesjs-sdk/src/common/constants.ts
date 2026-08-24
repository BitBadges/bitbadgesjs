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
export const MAINNET_CHAIN_DETAILS = {
  chainId: 1,
  cosmosChainId: 'bitbadges-1'
};

/**
 * EVMChainIDMainnet is the EVM chain ID for BitBadges mainnet
 * Chain ID: 50024 (claimed in ethereum-lists/chains registry)
 * This should match the chain_id in genesis under app_state.evm.params.chain_config.chain_id
 *
 * @category Chain Details
 */
export const EVMChainIDMainnet = '50024';

/**
 * EVMChainIDTestnet is the EVM chain ID for BitBadges testnet
 * Chain ID: 50025 (claimed in ethereum-lists/chains registry)
 * This should match the chain_id in genesis under app_state.evm.params.chain_config.chain_id
 *
 * @category Chain Details
 */
export const EVMChainIDTestnet = '50025';

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

  rpc: 'https://rpc-testnet.bitbadges.io',
  rest: 'https://lcd-testnet.bitbadges.io'
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
  /**
   * Set when the coin still works but should not be offered for new activity.
   *
   * Consumers should keep rendering balances and allow swapping *out*, while
   * excluding it from pickers, defaults and quote destinations. It is not the
   * same as hiding the coin — hiding a deprecated asset strands whoever holds
   * it.
   */
  deprecated?: boolean;
  /** Human-readable reason shown next to a deprecated coin. */
  deprecationNote?: string;
}

/**
 * Base coins registry containing common coins available across all networks.
 *
 * @category Coins Registry
 */
/**
 * Canonical USDC on BitBadges, routed through Injective.
 *
 * IBC denoms hash the *full* route, so the same underlying asset reaching the
 * chain by a different path is a different denom. That is why USDC appears
 * twice in this file.
 *
 *   trace: transfer/channel-40/transfer/channel-148/uusdc
 *          channel-40  BitBadges -> Injective
 *          channel-148 Injective -> Noble
 *
 * @category Coins Registry
 */
export const USDC_DENOM = 'ibc/0E485657AEF4C39D551E7D53463734E4C445A96E6C814DC4C2FF0031470B40BB';

/**
 * Legacy Noble-direct USDC, displayed as `USDC.noble`.
 *
 *   trace: transfer/channel-2/uusdc
 *
 * Deprecated for new activity but fully supported: collections that declared a
 * backed path against it cannot be repointed, because the backed-path escrow
 * address is derived from the denom string itself. Balances stay spendable and
 * swappable.
 *
 * @category Coins Registry
 */
export const USDC_NOBLE_DENOM = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';

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
    image:
      'https://bitbadges.io/_next/image?url=https%3A%2F%2Fipfs.bitbadges.io%2Fipfs%2FQmdRQUvQBo6p24RQ7AS7RD6srqyUjoHJ5Cjs4p22zie9bQ&w=1920&q=75'
  },
  [USDC_DENOM]: {
    skipGoSupported: true,
    label: 'USDC',
    symbol: 'USDC',
    decimals: '6',
    baseDenom: USDC_DENOM,
    image: 'https://github.com/cosmos/chain-registry/blob/master/noble/images/USDCoin.png?raw=true'
  },
  [USDC_NOBLE_DENOM]: {
    // Still Skip-supported on purpose: swapping *out* of the legacy denom is
    // exactly how a holder converts to canonical USDC.
    skipGoSupported: true,
    label: 'USDC.noble',
    symbol: 'USDC.noble',
    decimals: '6',
    baseDenom: USDC_NOBLE_DENOM,
    image: 'https://github.com/cosmos/chain-registry/blob/master/noble/images/USDCoin.png?raw=true',
    deprecated: true,
    deprecationNote: 'Legacy Noble-routed USDC. Swap to USDC (via Injective) — balances remain fully usable.'
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
