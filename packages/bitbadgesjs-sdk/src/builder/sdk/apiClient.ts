/**
 * BitBadges API Client
 * Lightweight wrapper for BitBadges API calls
 */

export interface ApiClientConfig {
  apiKey?: string;
  apiUrl?: string;
  testnet?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get the API key. Resolution order:
 *   1. `BITBADGES_API_KEY` environment variable (highest priority — overrides
 *      everything so CI / one-off shells can swap keys without touching disk).
 *   2. `~/.bitbadges/config.json` `apiKey` field, populated via
 *      `bitbadges-cli config set apiKey <key>`. Persistent default for
 *      day-to-day use.
 *
 * Imported lazily so this module stays usable in environments where the
 * filesystem helper isn't available (e.g. browser bundles via the SDK).
 */
export function getApiKey(): string | undefined {
  const envKey = process.env.BITBADGES_API_KEY;
  if (envKey) return envKey;
  try {
    // Lazy require to avoid pulling fs/os into non-Node consumers of the SDK.
    // The CLI config helper is the source of truth for the on-disk format.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getConfigApiKey } = require('../../cli/utils/config.js');
    return getConfigApiKey();
  } catch {
    return undefined;
  }
}

/**
 * Get the base API URL
 */
export function getApiUrl(testnet: boolean = false): string {
  const envUrl = process.env.BITBADGES_API_URL;
  if (envUrl) return envUrl;
  const base = 'https://api.bitbadges.io';
  return testnet ? `${base}/testnet` : base;
}

/**
 * Make an API request to BitBadges
 */
export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: unknown,
  config: ApiClientConfig = {}
): Promise<ApiResponse<T>> {
  const apiKey = config.apiKey || getApiKey();
  const apiUrl = config.apiUrl || getApiUrl(config.testnet);

  if (!apiKey) {
    return {
      success: false,
      error: 'BITBADGES_API_KEY environment variable not set. Set it to use API query tools.'
    };
  }

  try {
    const url = `${apiUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API Error ${response.status}: ${errorText}`
      };
    }

    const data = await response.json() as T;
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: `Request failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// ============================================
// Collection APIs
// ============================================

export interface GetCollectionsRequest {
  collectionsToFetch: Array<{
    collectionId: string;
    metadataToFetch?: {
      uris?: string[];
    };
    fetchTotalAndMintBalances?: boolean;
  }>;
  bookmark?: string;
}

export interface CollectionResponse {
  collections: Array<{
    collectionId: string;
    collectionMetadataTimeline: Array<{
      collectionMetadata: {
        uri: string;
        metadata?: {
          name?: string;
          description?: string;
          image?: string;
        };
      };
    }>;
    validBadgeIds: Array<{ start: string; end: string }>;
    manager: string;
    standards: string[];
    [key: string]: unknown;
  }>;
  bookmark?: string;
  hasMore?: boolean;
}

export async function getCollections(
  request: GetCollectionsRequest,
  config?: ApiClientConfig
): Promise<ApiResponse<CollectionResponse>> {
  return apiRequest<CollectionResponse>('/api/v0/collections', 'POST', request, config);
}

// ============================================
// Balance APIs
// ============================================

export interface BalanceResponse {
  balance: {
    balances: Array<{
      amount: string;
      badgeIds: Array<{ start: string; end: string }>;
      ownershipTimes: Array<{ start: string; end: string }>;
    }>;
    [key: string]: unknown;
  };
}

export async function getBalance(
  collectionId: string,
  address: string,
  config?: ApiClientConfig
): Promise<ApiResponse<BalanceResponse>> {
  return apiRequest<BalanceResponse>(
    `/api/v0/collections/${collectionId}/balance/${address}`,
    'POST',
    {},
    config
  );
}

export interface TokenBalanceResponse {
  balance: string;
}

export async function getBalanceForToken(
  collectionId: string,
  tokenId: string,
  address: string,
  config?: ApiClientConfig
): Promise<ApiResponse<TokenBalanceResponse>> {
  return apiRequest<TokenBalanceResponse>(
    `/api/v0/collection/${collectionId}/${tokenId}/balance/${address}`,
    'GET',
    undefined,
    config
  );
}

// ============================================
// Simulation APIs
// ============================================

/**
 * Agent-JSON single-tx simulate request. Sent to the indexer's
 * `/api/v0/simulate` Path 2. The indexer proto-encodes server-side
 * via `encodeMsgsFromJson` and forwards to the LCD simulate endpoint.
 *
 * Previously this type wrapped a single tx in a `{txs: [...]}` "batch"
 * envelope. The batch wrapper was never actually used as a batch
 * (always exactly 1 element) and has been removed.
 */
export interface SimulateRequest {
  messages: unknown[];
  memo?: string;
  fee?: {
    amount: Array<{ denom: string; amount: string }>;
    gas: string;
  };
  /** bb1… address of the tx signer. Optional if every message already
   * has the same `value.creator`. */
  creatorAddress?: string;
}

/**
 * Raw LCD simulate response — what the indexer forwards back from
 * `/cosmos/tx/v1beta1/simulate`. Consumers typically read
 * `gas_info.gas_used` + `result.events`.
 */
export interface SimulateResponse {
  gas_info?: { gas_used?: string; gas_wanted?: string };
  result?: { events?: unknown[] };
  error?: string;
}

export async function simulateTx(
  request: SimulateRequest,
  config?: ApiClientConfig
): Promise<ApiResponse<SimulateResponse>> {
  return apiRequest<SimulateResponse>('/api/v0/simulate', 'POST', request, config);
}

// ============================================
// Ownership Verification APIs
// ============================================

export interface VerifyOwnershipRequest {
  address: string;
  assetOwnershipRequirements: {
    $and?: unknown[];
    $or?: unknown[];
    $not?: unknown;
    assets?: Array<{
      collectionId: string;
      tokenIds: Array<{ start: string; end: string }>;
      ownershipTimes: Array<{ start: string; end: string }>;
      amountRange: { start: string; end: string };
    }>;
  };
}

export interface VerifyOwnershipResponse {
  success: boolean;
  verified: boolean;
  details?: unknown;
}

export async function verifyOwnership(
  request: VerifyOwnershipRequest,
  config?: ApiClientConfig
): Promise<ApiResponse<VerifyOwnershipResponse>> {
  return apiRequest<VerifyOwnershipResponse>('/api/v0/verifyOwnershipRequirements', 'POST', request, config);
}

// ============================================
// Search APIs
// ============================================

export interface SearchRequest {
  searchValue: string;
  specificCollectionId?: string;
}

export interface SearchResponse {
  collections?: Array<{
    collectionId: string;
    [key: string]: unknown;
  }>;
  accounts?: Array<{
    address: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export async function search(
  request: SearchRequest,
  config?: ApiClientConfig
): Promise<ApiResponse<SearchResponse>> {
  return apiRequest<SearchResponse>('/api/v0/search', 'POST', request, config);
}

// ============================================
// Plugin Search APIs
// ============================================

export interface SearchPluginsRequest {
  searchValue?: string;
  pluginIds?: string[];
  bookmark?: string;
  creatorAddress?: string;
}

export interface PluginDoc {
  pluginId: string;
  metadata: {
    name: string;
    description: string;
    image: string;
  };
  stateFunctionPreset?: string;
  duplicatesAllowed?: boolean;
  requiresUserInputs?: boolean;
  reuseForNonIndexed?: boolean;
  receiveStatusWebhook?: boolean;
  skipProcessingWebhook?: boolean;
  ignoreSimulations?: boolean;
  requireSignIn?: boolean;
  verificationCall?: {
    uri: string;
  };
  userInputsSchema?: Array<Record<string, any>>;
  publicParamsSchema?: Array<Record<string, any>>;
  privateParamsSchema?: Array<Record<string, any>>;
  customDetailsDisplay?: string;
  [key: string]: unknown;
}

export interface SearchPluginsResponse {
  plugins: PluginDoc[];
  bookmark?: string;
}

export async function searchPlugins(
  request: SearchPluginsRequest,
  config?: ApiClientConfig
): Promise<ApiResponse<SearchPluginsResponse>> {
  if (request.pluginIds && request.pluginIds.length > 0) {
    return apiRequest<SearchPluginsResponse>('/api/v0/plugins', 'POST', { pluginIds: request.pluginIds }, config);
  }
  const params = new URLSearchParams();
  if (request.searchValue) params.set('searchValue', request.searchValue);
  if (request.bookmark) params.set('bookmark', request.bookmark);
  if (request.creatorAddress) params.set('creatorAddress', request.creatorAddress);
  const queryString = params.toString();
  const endpoint = `/api/v0/plugins/search${queryString ? `?${queryString}` : ''}`;
  return apiRequest<SearchPluginsResponse>(endpoint, 'GET', undefined, config);
}
