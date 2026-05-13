export interface ChainRegistry {
  chains: Chain[];
}

export interface AssetRegistry {
  assets: Asset[];
}

export interface Chain {
  chain_name: string;
  chain_id: string;
  pretty_name: string;
  status: 'live' | 'upcoming' | 'killed';
  network_type: 'mainnet' | 'testnet' | 'devnet';
  bech32_prefix: string;
  daemon_name: string;
  node_home: string;
  slip44: number;
  fees: {
    fee_tokens: FeeToken[];
  };
  staking: {
    staking_tokens: StakingToken[];
  };
  codebase: {
    git_repo: string;
    recommended_version: string;
    compatible_versions: string[];
  };
  apis: {
    rpc: ApiEndpoint[];
    rest: ApiEndpoint[];
  };
  explorers: Explorer[];
  logo_URIs: {
    png?: string;
    svg?: string;
  };
  ibc_channels: IBCChannel[];
}

export interface Asset {
  denom: string;
  symbol: string;
  name: string;
  decimals: number;
  chain_id: string;
  logo_URIs: {
    png?: string;
    svg?: string;
  };
  coingecko_id: string;
  description: string;
}

/**
 * Interface for IBC chain configuration
 */
export interface IBCChainConfig {
  chain_id: string;
  chain_name: string;
  enabled: boolean; // Whether to automatically generate IBC denoms for this chain
  priority?: number; // Priority for route selection (lower = higher priority)
}

/**
 * Enhanced Asset interface with IBC chain configurations
 */
export interface EnhancedAsset extends Asset {
  ibc_chains?: IBCChainConfig[]; // Chains where this asset should have IBC denoms generated
  is_native?: boolean; // Whether this is a native asset (not IBC)
}

export interface FeeToken {
  denom: string;
  fixed_min_gas_price?: number;
  low_gas_price?: number;
  average_gas_price?: number;
  high_gas_price?: number;
}

export interface StakingToken {
  denom: string;
}

export interface ApiEndpoint {
  address: string;
  provider: string;
}

export interface Explorer {
  kind: string;
  url: string;
  tx_page: string;
  account_page: string;
  supply_page?: string;
}

export interface IBCChannel {
  chain_1: {
    channel_id: string;
    port_id: string;
  };
  chain_2: {
    channel_id: string;
    port_id: string;
  };
  ordering: 'ordered' | 'unordered';
  version: string;
  tags: {
    status: 'live' | 'upcoming' | 'killed';
    preferred?: boolean;
    dex?: string;
    [key: string]: any;
  };
}

export interface IBCConnection {
  id: string;
  chain_1: {
    chain_name: string;
    chain_id: string;
    client_id: string;
    connection_id: string;
  };
  chain_2: {
    chain_name: string;
    chain_id: string;
    client_id: string;
    connection_id: string;
  };
  channels: IBCChannel[];
  status: 'live' | 'upcoming' | 'killed';
  last_updated: string;
}

export interface IBCConnectionsRegistry {
  ibc_connections: IBCConnection[];
  metadata: {
    total_connections: number;
    last_sync: string;
    source: string;
    version: string;
  };
}

export interface DenomUnit {
  denom: string;
  exponent: number;
}

// Utility types for working with the registry
export interface ChainInfo {
  chain: Chain;
  assets: Asset[];
}

export interface AssetInfo {
  asset: Asset;
  chain: Chain;
}

// Helper functions type definitions
export interface RegistryUtils {
  getChainByName: (chainName: string) => Chain | undefined;
  getChainByChainId: (chainId: string) => Chain | undefined;
  getAssetsByChain: (chainName: string) => Asset[];
  getAllChains: () => Chain[];
  getAllAssets: () => Asset[];
  getIBCChannels: (chainName: string) => IBCChannel[];
  getIBCConnection: (connectionId: string) => IBCConnection | undefined;
  getAllIBCConnections: () => IBCConnection[];
  getIBCConnectionsForChain: (chainName: string) => IBCConnection[];
  getIBCConnectionBetweenChains: (chain1: string, chain2: string) => IBCConnection | undefined;
  findMultiHopRoute: (sourceChain: string, destinationChain: string, asset?: Asset) => IBCConnection[] | null;
  isMultiHopRoute: (sourceChain: string, destinationChain: string) => boolean;
  validateAllIBCConfigs: () => { asset: string; errors: string[] }[];
  getNativeAssets: () => Asset[];
  getIBCAssets: () => Asset[];
}
