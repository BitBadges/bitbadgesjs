/**
 * Auto-generated API command module for the BitBadges CLI.
 *
 * Registers a commander subcommand for every indexer API route derived from
 * the OpenAPI spec at:
 *   bitbadgesjs/packages/bitbadgesjs-sdk/openapitypes-helpers/routes.yaml
 *
 * Usage examples:
 *   bitbadges api get-status
 *   bitbadges api get-collection 123
 *   bitbadges api get-accounts --body '{"accountsToFetch":[...]}'
 *   bitbadges api broadcast-tx --body @tx.json --testnet
 */

import { Command } from 'commander';
import * as fs from 'node:fs';
import {
  apiRequest,
  resolveApiKey,
  resolveBaseUrl,
} from '../utils/api-client.js';

// ---------------------------------------------------------------------------
// Route registry
// ---------------------------------------------------------------------------

interface ApiRoute {
  /** CLI command name (kebab-case) */
  name: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** API path template with {param} placeholders */
  path: string;
  /** Short description shown in --help */
  description: string;
  /** Ordered list of path parameters (maps to positional CLI args) */
  pathParams: string[];
  /** Whether the route accepts a JSON request body */
  hasBody: boolean;
}

const ROUTES: ApiRoute[] = [
  // =========================================================================
  // Accounts
  // =========================================================================
  {
    name: 'get-account',
    method: 'GET',
    path: '/user',
    description: 'Get account by address or username',
    pathParams: [],
    hasBody: false,
  },
  {
    name: 'get-accounts',
    method: 'POST',
    path: '/users',
    description: 'Get accounts (batch, view-based)',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'get-siwbb-requests-for-user',
    method: 'GET',
    path: '/account/{address}/requests/siwbb',
    description: 'Get SIWBB requests for a user',
    pathParams: ['address'],
    hasBody: false,
  },
  {
    name: 'get-transfer-activity-for-user',
    method: 'GET',
    path: '/account/{address}/activity/tokens',
    description: 'Get transfer activity for a user',
    pathParams: ['address'],
    hasBody: false,
  },
  {
    name: 'get-tokens-for-user',
    method: 'GET',
    path: '/account/{address}/tokens',
    description: 'Get tokens for a user',
    pathParams: ['address'],
    hasBody: false,
  },
  {
    name: 'get-claim-activity-for-user',
    method: 'GET',
    path: '/account/{address}/activity/claims',
    description: 'Get claim activity for a user',
    pathParams: ['address'],
    hasBody: false,
  },
  {
    name: 'get-points-activity-for-user',
    method: 'GET',
    path: '/account/{address}/activity/points',
    description: 'Get points activity for a user',
    pathParams: ['address'],
    hasBody: false,
  },

  // =========================================================================
  // Collections / Tokens
  // =========================================================================
  {
    name: 'get-collection',
    method: 'GET',
    path: '/collection/{collectionId}',
    description: 'Get a specific collection',
    pathParams: ['collectionId'],
    hasBody: false,
  },
  {
    name: 'get-token-metadata',
    method: 'GET',
    path: '/collection/{collectionId}/{tokenId}/metadata',
    description: 'Get metadata for a specific token',
    pathParams: ['collectionId', 'tokenId'],
    hasBody: false,
  },
  {
    name: 'get-collections',
    method: 'POST',
    path: '/collections',
    description: 'Get collections (batch, view-based)',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'get-balance-specific-token',
    method: 'GET',
    path: '/collection/{collectionId}/balance/{address}/{tokenId}',
    description: 'Get balance of a specific token for an address',
    pathParams: ['collectionId', 'address', 'tokenId'],
    hasBody: false,
  },
  {
    name: 'get-balance-by-address',
    method: 'GET',
    path: '/collection/{collectionId}/balance/{address}',
    description: 'Get balances for an address in a collection',
    pathParams: ['collectionId', 'address'],
    hasBody: false,
  },
  {
    name: 'get-token-owners',
    method: 'GET',
    path: '/collection/{collectionId}/{tokenId}/owners',
    description: 'Get owners of a specific token (paginated)',
    pathParams: ['collectionId', 'tokenId'],
    hasBody: false,
  },
  {
    name: 'get-token-activity',
    method: 'GET',
    path: '/collection/{collectionId}/{tokenId}/activity',
    description: 'Get activity for a specific token (paginated)',
    pathParams: ['collectionId', 'tokenId'],
    hasBody: false,
  },
  {
    name: 'refresh-metadata',
    method: 'POST',
    path: '/collection/{collectionId}/refresh',
    description: 'Trigger metadata refresh for a collection',
    pathParams: ['collectionId'],
    hasBody: true,
  },
  {
    name: 'get-refresh-status',
    method: 'GET',
    path: '/collection/{collectionId}/refreshStatus',
    description: 'Get refresh status for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
  },
  {
    name: 'get-collection-owners',
    method: 'GET',
    path: '/collection/{collectionId}/owners',
    description: 'Get owners for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
  },
  {
    name: 'get-collection-transfer-activity',
    method: 'GET',
    path: '/collection/{collectionId}/activity',
    description: 'Get transfer activity for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
  },
  {
    name: 'get-collection-challenge-trackers',
    method: 'GET',
    path: '/collection/{collectionId}/challengeTrackers',
    description: 'Get challenge trackers for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
  },
  {
    name: 'get-collection-amount-trackers',
    method: 'GET',
    path: '/collection/{collectionId}/amountTrackers',
    description: 'Get amount trackers for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
  },
  {
    name: 'get-collection-amount-tracker-by-id',
    method: 'GET',
    path: '/api/v0/collection/amountTracker',
    description: 'Get a collection amount tracker by ID',
    pathParams: [],
    hasBody: false,
  },
  {
    name: 'get-collection-challenge-tracker-by-id',
    method: 'GET',
    path: '/api/v0/collection/challengeTracker',
    description: 'Get a collection challenge tracker by ID',
    pathParams: [],
    hasBody: false,
  },
  {
    name: 'get-collection-listings',
    method: 'GET',
    path: '/collection/{collectionId}/listings',
    description: 'Get listings for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
  },
  {
    name: 'get-collection-claims',
    method: 'GET',
    path: '/collection/{collectionId}/claims',
    description: 'Get claims for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
  },

  // =========================================================================
  // Claims
  // =========================================================================
  {
    name: 'get-claim',
    method: 'GET',
    path: '/claim/{claimId}',
    description: 'Get a claim by ID',
    pathParams: ['claimId'],
    hasBody: false,
  },
  {
    name: 'check-claim-success',
    method: 'GET',
    path: '/claims/success/{claimId}/{address}',
    description: 'Check if a claim was successfully completed by a user',
    pathParams: ['claimId', 'address'],
    hasBody: false,
  },
  {
    name: 'complete-claim',
    method: 'POST',
    path: '/claims/complete/{claimId}/{address}',
    description: 'Complete a claim for an address',
    pathParams: ['claimId', 'address'],
    hasBody: true,
  },
  {
    name: 'simulate-claim',
    method: 'POST',
    path: '/claims/simulate/{claimId}/{address}',
    description: 'Simulate a claim for an address',
    pathParams: ['claimId', 'address'],
    hasBody: true,
  },
  {
    name: 'get-reserved-codes',
    method: 'POST',
    path: '/claims/reserved/{claimId}/{address}',
    description: 'Get reserved claim codes',
    pathParams: ['claimId', 'address'],
    hasBody: true,
  },
  {
    name: 'get-claim-attempt-status',
    method: 'GET',
    path: '/claims/status/{claimAttemptId}',
    description: 'Get status of a claim attempt',
    pathParams: ['claimAttemptId'],
    hasBody: false,
  },
  {
    name: 'search-claims',
    method: 'GET',
    path: '/claims/search',
    description: 'Search through your managed claims',
    pathParams: [],
    hasBody: false,
  },
  {
    name: 'get-claims',
    method: 'POST',
    path: '/claims/fetch',
    description: 'Get claims (batch)',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'create-claim',
    method: 'POST',
    path: '/claims',
    description: 'Create a new claim',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'update-claim',
    method: 'PUT',
    path: '/claims',
    description: 'Update an existing claim',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'delete-claim',
    method: 'DELETE',
    path: '/claims',
    description: 'Delete a claim',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'generate-code',
    method: 'GET',
    path: '/codes',
    description: 'Generate a unique code (Codes plugin)',
    pathParams: [],
    hasBody: false,
  },
  {
    name: 'get-claim-attempts',
    method: 'GET',
    path: '/claims/{claimId}/attempts',
    description: 'Get claim attempts (paginated)',
    pathParams: ['claimId'],
    hasBody: false,
  },
  {
    name: 'get-gated-content-for-claim',
    method: 'GET',
    path: '/claims/gatedContent/{claimId}',
    description: 'Get gated content for a claim',
    pathParams: ['claimId'],
    hasBody: false,
  },

  // =========================================================================
  // Transactions
  // =========================================================================
  {
    name: 'broadcast-tx',
    method: 'POST',
    path: '/broadcast',
    description: 'Broadcast a transaction to the blockchain',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'simulate-tx',
    method: 'POST',
    path: '/simulate',
    description: 'Simulate a transaction on the blockchain',
    pathParams: [],
    hasBody: true,
  },

  // =========================================================================
  // Sign In with BitBadges (SIWBB) / OAuth
  // =========================================================================
  {
    name: 'exchange-siwbb-code',
    method: 'POST',
    path: '/siwbb/token',
    description: 'Exchange SIWBB authorization code for access token',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'revoke-oauth',
    method: 'POST',
    path: '/siwbb/token/revoke',
    description: 'Revoke an OAuth authorization',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'rotate-siwbb-request',
    method: 'POST',
    path: '/siwbbRequest/rotate',
    description: 'Rotate a SIWBB request (e.g. QR code)',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'delete-siwbb-request',
    method: 'DELETE',
    path: '/siwbbRequest',
    description: 'Delete a SIWBB request',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'create-siwbb-request',
    method: 'POST',
    path: '/siwbbRequest',
    description: 'Create a SIWBB request',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'get-siwbb-requests-for-app',
    method: 'GET',
    path: '/developerApps/siwbbRequests',
    description: 'Get SIWBB requests for a developer app',
    pathParams: [],
    hasBody: false,
  },
  {
    name: 'check-sign-in-status',
    method: 'POST',
    path: '/auth/status',
    description: 'Check if a user is currently signed in',
    pathParams: [],
    hasBody: true,
  },

  // =========================================================================
  // Developer Apps
  // =========================================================================
  {
    name: 'get-developer-app',
    method: 'GET',
    path: '/developerApp/{clientId}',
    description: 'Get an OAuth app by client ID',
    pathParams: ['clientId'],
    hasBody: false,
  },
  {
    name: 'create-developer-app',
    method: 'POST',
    path: '/developerApps',
    description: 'Create a new OAuth app',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'update-developer-app',
    method: 'PUT',
    path: '/developerApps',
    description: 'Update an OAuth app',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'delete-developer-app',
    method: 'DELETE',
    path: '/developerApps',
    description: 'Delete an OAuth app',
    pathParams: [],
    hasBody: true,
  },

  // =========================================================================
  // Plugins
  // =========================================================================
  {
    name: 'get-plugin',
    method: 'GET',
    path: '/plugin/{pluginId}',
    description: 'Get a plugin by ID',
    pathParams: ['pluginId'],
    hasBody: false,
  },
  {
    name: 'get-plugins',
    method: 'POST',
    path: '/plugins/fetch',
    description: 'Get plugins (batch)',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'search-plugins',
    method: 'GET',
    path: '/plugins/search',
    description: 'Search plugins',
    pathParams: [],
    hasBody: false,
  },
  {
    name: 'get-creator-plugins',
    method: 'GET',
    path: '/plugins/creator',
    description: 'Get plugins by creator address',
    pathParams: [],
    hasBody: false,
  },

  // =========================================================================
  // Dynamic Stores (off-chain)
  // =========================================================================
  {
    name: 'get-dynamic-store',
    method: 'GET',
    path: '/dynamicStore/{dynamicStoreId}',
    description: 'Get a dynamic data store by ID',
    pathParams: ['dynamicStoreId'],
    hasBody: false,
  },
  {
    name: 'get-dynamic-store-value',
    method: 'GET',
    path: '/dynamicStore/{dynamicStoreId}/value',
    description: 'Get a value from a dynamic data store',
    pathParams: ['dynamicStoreId'],
    hasBody: false,
  },
  {
    name: 'get-dynamic-store-values',
    method: 'GET',
    path: '/dynamicStore/{dynamicStoreId}/values',
    description: 'Get paginated values from a dynamic data store',
    pathParams: ['dynamicStoreId'],
    hasBody: false,
  },
  {
    name: 'create-dynamic-store',
    method: 'POST',
    path: '/dynamicStores',
    description: 'Create a new dynamic data store',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'update-dynamic-store',
    method: 'PUT',
    path: '/dynamicStores',
    description: 'Update a dynamic data store',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'delete-dynamic-store',
    method: 'DELETE',
    path: '/dynamicStores',
    description: 'Delete a dynamic data store',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'get-dynamic-stores',
    method: 'POST',
    path: '/dynamicStores/fetch',
    description: 'Fetch dynamic data stores (batch)',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'search-dynamic-stores',
    method: 'GET',
    path: '/dynamicStores/search',
    description: 'Search dynamic data stores for user',
    pathParams: [],
    hasBody: false,
  },
  {
    name: 'get-dynamic-data-activity',
    method: 'GET',
    path: '/dynamicStores/activity',
    description: 'Get dynamic data store activity history',
    pathParams: [],
    hasBody: false,
  },
  {
    name: 'perform-store-action-single',
    method: 'POST',
    path: '/storeActions/single',
    description: 'Perform a single store action (body auth)',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'perform-store-action-batch',
    method: 'POST',
    path: '/storeActions/batch',
    description: 'Perform batch store actions (body auth)',
    pathParams: [],
    hasBody: true,
  },

  // =========================================================================
  // Applications
  // =========================================================================
  {
    name: 'get-application',
    method: 'GET',
    path: '/application/{applicationId}',
    description: 'Get an application by ID',
    pathParams: ['applicationId'],
    hasBody: false,
  },
  {
    name: 'search-applications',
    method: 'GET',
    path: '/applications/search',
    description: 'Search applications',
    pathParams: [],
    hasBody: false,
  },
  {
    name: 'get-applications',
    method: 'POST',
    path: '/applications/fetch',
    description: 'Fetch applications (batch)',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'create-application',
    method: 'POST',
    path: '/applications',
    description: 'Create an application',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'update-application',
    method: 'PUT',
    path: '/applications',
    description: 'Update an application',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'delete-application',
    method: 'DELETE',
    path: '/applications',
    description: 'Delete an application',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'calculate-points',
    method: 'POST',
    path: '/applications/points',
    description: 'Calculate points for an application',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'get-points-activity',
    method: 'GET',
    path: '/applications/points/activity',
    description: 'Get points activity for an application',
    pathParams: [],
    hasBody: false,
  },

  // =========================================================================
  // Utility Pages
  // =========================================================================
  {
    name: 'get-utility-page',
    method: 'GET',
    path: '/utilityPage/{utilityPageId}',
    description: 'Get a utility page by ID',
    pathParams: ['utilityPageId'],
    hasBody: false,
  },
  {
    name: 'get-utility-pages',
    method: 'POST',
    path: '/utilityPages/fetch',
    description: 'Fetch utility pages (batch)',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'search-utility-pages',
    method: 'GET',
    path: '/utilityPages/search',
    description: 'Search utility pages',
    pathParams: [],
    hasBody: false,
  },
  {
    name: 'create-utility-page',
    method: 'POST',
    path: '/utilityPages',
    description: 'Create a utility page',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'update-utility-page',
    method: 'PUT',
    path: '/utilityPages',
    description: 'Update a utility page',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'delete-utility-page',
    method: 'DELETE',
    path: '/utilityPages',
    description: 'Delete a utility page',
    pathParams: [],
    hasBody: true,
  },

  // =========================================================================
  // Maps and Protocols
  // =========================================================================
  {
    name: 'get-map',
    method: 'GET',
    path: '/maps/{mapId}',
    description: 'Get a map by ID',
    pathParams: ['mapId'],
    hasBody: false,
  },
  {
    name: 'get-maps',
    method: 'POST',
    path: '/maps',
    description: 'Get maps (batch)',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'get-map-values',
    method: 'POST',
    path: '/mapValues',
    description: 'Get map values (batch)',
    pathParams: [],
    hasBody: true,
  },
  {
    name: 'get-map-value',
    method: 'GET',
    path: '/mapValue/{mapId}/{key}',
    description: 'Get a single map value',
    pathParams: ['mapId', 'key'],
    hasBody: false,
  },

  // =========================================================================
  // Miscellaneous
  // =========================================================================
  {
    name: 'get-status',
    method: 'GET',
    path: '/status',
    description: 'Get blockchain/indexer status',
    pathParams: [],
    hasBody: false,
  },

  // =========================================================================
  // On-Chain Dynamic Stores
  // =========================================================================
  {
    name: 'get-on-chain-dynamic-store',
    method: 'GET',
    path: '/onChainDynamicStore/{storeId}',
    description: 'Get an on-chain dynamic store by ID',
    pathParams: ['storeId'],
    hasBody: false,
  },
  {
    name: 'get-on-chain-dynamic-stores-by-creator',
    method: 'GET',
    path: '/onChainDynamicStores/by-creator/{address}',
    description: 'Get on-chain dynamic stores by creator address',
    pathParams: ['address'],
    hasBody: false,
  },
  {
    name: 'get-on-chain-dynamic-store-value',
    method: 'GET',
    path: '/onChainDynamicStore/{storeId}/value/{address}',
    description: 'Get value for an address in an on-chain dynamic store',
    pathParams: ['storeId', 'address'],
    hasBody: false,
  },
  {
    name: 'get-on-chain-dynamic-store-values',
    method: 'GET',
    path: '/onChainDynamicStore/{storeId}/values',
    description: 'Get paginated values from an on-chain dynamic store',
    pathParams: ['storeId'],
    hasBody: false,
  },

  // =========================================================================
  // Assets / DEX
  // =========================================================================
  {
    name: 'get-all-pools',
    method: 'GET',
    path: '/api/{version}/pools',
    description: 'Get all liquidity pools',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-pool-infos-by-denom',
    method: 'GET',
    path: '/api/{version}/pools/byDenom',
    description: 'Get pool infos filtered by denomination',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-pool-infos-by-assets',
    method: 'GET',
    path: '/api/{version}/pools/byAssets',
    description: 'Get pool infos filtered by assets',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-pool-info-by-id',
    method: 'GET',
    path: '/api/{version}/pools/{poolId}',
    description: 'Get pool info by pool ID',
    pathParams: ['version', 'poolId'],
    hasBody: false,
  },
  {
    name: 'estimate-swap',
    method: 'POST',
    path: '/api/{version}/swaps/estimate',
    description: 'Estimate the output amount for a swap',
    pathParams: ['version'],
    hasBody: true,
  },
  {
    name: 'get-asset-pairs',
    method: 'GET',
    path: '/api/{version}/assetPairs',
    description: 'Get all asset pairs',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-top-gainers',
    method: 'GET',
    path: '/api/{version}/assetPairs/topGainers',
    description: 'Get asset pairs with highest price gains',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-top-losers',
    method: 'GET',
    path: '/api/{version}/assetPairs/topLosers',
    description: 'Get asset pairs with highest price losses',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-highest-volume',
    method: 'GET',
    path: '/api/{version}/assetPairs/highestVolume',
    description: 'Get asset pairs with highest trading volume',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-by-price',
    method: 'GET',
    path: '/api/{version}/assetPairs/priceSorted',
    description: 'Get asset pairs sorted by price',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-weekly-top-gainers',
    method: 'GET',
    path: '/api/{version}/assetPairs/weeklyTopGainers',
    description: 'Get asset pairs with highest weekly gains',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-weekly-top-losers',
    method: 'GET',
    path: '/api/{version}/assetPairs/weeklyTopLosers',
    description: 'Get asset pairs with highest weekly losses',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'search-asset-pairs',
    method: 'GET',
    path: '/api/{version}/assetPairs/search',
    description: 'Search asset pairs by text',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-by-denoms',
    method: 'POST',
    path: '/api/{version}/assetPairs/byDenoms',
    description: 'Get asset pairs filtered by denominations',
    pathParams: ['version'],
    hasBody: true,
  },
  {
    name: 'get-swap-activities',
    method: 'GET',
    path: '/swapActivities',
    description: 'Get swap activities (paginated)',
    pathParams: [],
    hasBody: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the --body flag value. Supports:
 *  - @filepath  (reads file from disk)
 *  - JSON string
 *  - stdin (when value is "-")
 */
function resolveBody(raw: string | undefined): any {
  if (raw === undefined) return undefined;

  // Read from file
  if (raw.startsWith('@')) {
    const filePath = raw.slice(1);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  // Read from stdin
  if (raw === '-') {
    const content = fs.readFileSync(0, 'utf-8');
    return JSON.parse(content);
  }

  // Inline JSON
  return JSON.parse(raw);
}

/**
 * Replace {param} placeholders in the path with actual values.
 */
function interpolatePath(
  template: string,
  params: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key}}`, encodeURIComponent(value));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Command builder
// ---------------------------------------------------------------------------

export function createApiCommand(): Command {
  const api = new Command('api').description(
    `BitBadges Indexer API client (${ROUTES.length} routes). Call any API endpoint from the CLI.`
  );

  for (const route of ROUTES) {
    let cmd = new Command(route.name).description(
      `[${route.method}] ${route.path} -- ${route.description}`
    );

    // Positional arguments for path params
    for (const param of route.pathParams) {
      cmd = cmd.argument(`<${param}>`, `Path parameter: ${param}`);
    }

    // Common options
    cmd
      .option('--body <json>', 'Request body: inline JSON, @file.json, or - for stdin')
      .option('--api-key <key>', 'BitBadges API key (overrides BITBADGES_API_KEY env)')
      .option('--testnet', 'Use testnet API', false)
      .option('--local', 'Use local API (localhost:3001)', false)
      .option('--url <url>', 'Custom API base URL (overrides all other URL options)')
      .option('--query <params>', 'Query string params as JSON object (e.g. \'{"bookmark":"x"}\')')
      .option('--condensed', 'Output condensed JSON (no whitespace)', false)
      .option('--dry-run', 'Show request details without sending', false)
      .option('--output-file <path>', 'Write output to file instead of stdout');

    cmd.action(async (...args: any[]) => {
      // Commander passes positional args first, then the options object, then the command
      const opts = args[route.pathParams.length];

      try {
        const apiKey = resolveApiKey(opts.apiKey);
        const baseUrl = resolveBaseUrl({
          testnet: opts.testnet,
          local: opts.local,
          baseUrl: opts.url,
        });

        // Build path params map
        const pathParamValues: Record<string, string> = {};
        for (let i = 0; i < route.pathParams.length; i++) {
          pathParamValues[route.pathParams[i]] = args[i];
        }

        let resolvedPath = interpolatePath(route.path, pathParamValues);

        // Append query params if provided
        if (opts.query) {
          const queryObj = JSON.parse(opts.query);
          const searchParams = new URLSearchParams();
          for (const [k, v] of Object.entries(queryObj)) {
            searchParams.set(k, String(v));
          }
          const qs = searchParams.toString();
          if (qs) {
            resolvedPath += `?${qs}`;
          }
        }

        // Resolve body
        let body: any = undefined;
        if (opts.body) {
          body = resolveBody(opts.body);
        }

        // Dry-run: show request details and exit
        if (opts.dryRun) {
          const dryOutput = {
            method: route.method,
            url: `${baseUrl}${resolvedPath}`,
            headers: {
              'x-api-key': apiKey ? apiKey.slice(0, 4) + '****' : '(none)',
              ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            },
            body: body ?? null,
          };
          process.stdout.write(JSON.stringify(dryOutput, null, 2) + '\n');
          return;
        }

        const result = await apiRequest({
          method: route.method,
          path: resolvedPath,
          body,
          apiKey,
          baseUrl,
        });

        const formatted = opts.condensed
          ? JSON.stringify(result)
          : JSON.stringify(result, null, 2);

        if (opts.outputFile) {
          fs.writeFileSync(opts.outputFile, formatted + '\n', 'utf-8');
          process.stderr.write(`Written to ${opts.outputFile}\n`);
        } else {
          process.stdout.write(formatted + '\n');
        }
      } catch (err: any) {
        // If the error has a response body, print it
        if (err.response) {
          process.stderr.write(JSON.stringify(err.response, null, 2) + '\n');
        } else {
          process.stderr.write(`Error: ${err.message}\n`);
        }
        process.exitCode = 1;
      }
    });

    api.addCommand(cmd);
  }

  return api;
}
