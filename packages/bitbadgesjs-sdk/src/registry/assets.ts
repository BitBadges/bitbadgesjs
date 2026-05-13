/**
 * Canonical BitBadges asset registry. Inlined as a TS const so the module
 * compiles cleanly under both CJS and ESM targets (JSON-import attribute
 * support is uneven across our build modes — see registry/index.ts).
 *
 * Source-of-truth for asset metadata: symbol, denom, decimals,
 * coingecko_id, logo, IBC chain enablement. The frontend re-exports this
 * via `bitbadges` (see backlog 0394 / FE consolidation follow-up).
 */

import type { AssetRegistry } from './types.js';

export const ASSET_REGISTRY: AssetRegistry = {
  assets: [
    {
      denom: 'ubadge',
      symbol: 'BADGE',
      name: 'BitBadges',
      decimals: 9,
      chain_id: 'bitbadges-1',
      logo_URIs: {
        png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/bitbadges/images/badge_logo.png',
        svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/bitbadges/images/badge_logo.svg'
      },
      coingecko_id: 'bitbadges',
      description: 'The native token of BitBadges',
      // Extra fields — see EnhancedAsset
      ...({
        is_native: true,
        ibc_chains: [
          { chain_id: 'osmosis-1', chain_name: 'osmosis', enabled: true, priority: 1 },
          { chain_id: 'cosmoshub-4', chain_name: 'cosmoshub', enabled: true, priority: 3 }
        ]
      } as object)
    },
    {
      denom: 'uatom',
      symbol: 'ATOM',
      name: 'Cosmos Hub Atom',
      decimals: 6,
      chain_id: 'cosmoshub-4',
      logo_URIs: {
        png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
        svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg'
      },
      coingecko_id: 'cosmos',
      description:
        'ATOM is the native cryptocurrency of the Cosmos network, designed to facilitate interoperability between multiple blockchains through its innovative hub-and-spoke model.',
      ...({
        is_native: true,
        ibc_chains: [
          { chain_id: 'osmosis-1', chain_name: 'osmosis', enabled: true, priority: 1 },
          { chain_id: 'bitbadges-1', chain_name: 'bitbadges', enabled: true, priority: 2 }
        ]
      } as object)
    },
    {
      denom: 'uusdc',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chain_id: 'noble-1',
      logo_URIs: {
        png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/usdc.png',
        svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/usdc.svg'
      },
      coingecko_id: 'usd-coin',
      description: 'USD Coin (USDC) is a fully collateralized US dollar stablecoin issued by Circle',
      ...({
        is_native: true,
        ibc_chains: [
          { chain_id: 'osmosis-1', chain_name: 'osmosis', enabled: true, priority: 1 },
          { chain_id: 'bitbadges-1', chain_name: 'bitbadges', enabled: true, priority: 2 },
          { chain_id: 'cosmoshub-4', chain_name: 'cosmoshub', enabled: true, priority: 3 }
        ]
      } as object)
    },
    {
      denom: 'uosmo',
      symbol: 'OSMO',
      name: 'Osmosis',
      decimals: 6,
      chain_id: 'osmosis-1',
      logo_URIs: {
        png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png',
        svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.svg'
      },
      coingecko_id: 'osmosis',
      description:
        'OSMO is the native token of the Osmosis chain, a decentralized exchange protocol for the Cosmos ecosystem.',
      ...({
        is_native: true,
        ibc_chains: [
          { chain_id: 'bitbadges-1', chain_name: 'bitbadges', enabled: true, priority: 1 },
          { chain_id: 'cosmoshub-4', chain_name: 'cosmoshub', enabled: true, priority: 2 }
        ]
      } as object)
    }
  ]
};
