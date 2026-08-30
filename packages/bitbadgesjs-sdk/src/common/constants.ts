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
 * Canonical USDC on BitBadges: Circle's native USDC on Injective (CCTP-enabled),
 * carried one IBC hop over the existing BitBadges <-> Injective channel.
 *
 * IBC denoms hash the *full* route, so the same underlying asset reaching the
 * chain by a different path is a different denom. That is why USDC appears
 * twice in this file.
 *
 *   trace: transfer/channel-40/erc20:0xa00C59fF5a080D2b954d0c75e46E22a0c371235a
 *          channel-40 is BitBadges -> Injective; the erc20:0x... segment is
 *          Injective's bank denom for Circle native USDC, checksummed exactly
 *          as Injective's bank module spells it — the IBC hash is
 *          case-sensitive.
 *
 * @category Coins Registry
 */
export const USDC_DENOM = 'ibc/E1116484B327AEE59CDC3DA73D319834781A13DB2A7DFC1F38A30CD45ABF58B8';

/**
 * Legacy Noble-direct USDC, displayed as `USDC.n` — Skip Go's ecosystem-wide
 * name for the Noble voucher, including Skip's own bitbadges-1 registry entry.
 *
 *   trace: transfer/channel-2/uusdc
 *
 * Kept only for backwards compatibility with existing balances and
 * collections — nothing new is steered toward it. Fully supported:
 * collections that declared a backed path against it cannot be repointed,
 * because the backed-path escrow address is derived from the denom string
 * itself. Balances stay spendable. There is no
 * in-place migration to {@link USDC_DENOM}: reaching canonical USDC means
 * exiting to Noble and swapping/CCTP-ing into native USDC on Injective, then
 * one IBC hop in — not IBC forwarding.
 *
 * @category Coins Registry
 */
export const USDC_NOBLE_DENOM = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';

/**
 * Accepted typed-input aliases for registry symbols (upper-cased alias →
 * denom). Everything displayed or emitted uses the registry symbol; these
 * exist only so older spellings keep resolving. `USDC.noble` was the
 * pre-release name for {@link USDC_NOBLE_DENOM} before it was renamed to
 * `USDC.n` to match Skip Go.
 *
 * @category Coins Registry
 */
export const SYMBOL_INPUT_ALIASES: Record<string, string> = {
  'USDC.NOBLE': USDC_NOBLE_DENOM
};

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
    // Still Skip-supported so holders can swap out of the legacy denom.
    // Kept only for backwards compatibility with existing balances and
    // collections — nothing new is steered toward it. `USDC.n` matches
    // Skip Go's ecosystem-wide name for the Noble voucher.
    skipGoSupported: true,
    label: 'USDC.n',
    symbol: 'USDC.n',
    decimals: '6',
    baseDenom: USDC_NOBLE_DENOM,
    image: 'https://github.com/cosmos/chain-registry/blob/master/noble/images/USDCoin.png?raw=true',
    deprecated: true,
    deprecationNote:
      'Legacy Noble-routed USDC. Existing balances stay fully usable — use canonical USDC (via Injective) for everything new.'
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
