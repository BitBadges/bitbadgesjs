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

interface SdkLinks {
  /** SDK request/payload type name */
  request?: string;
  /** SDK response type name */
  response?: string;
  /** SDK API function name */
  function?: string;
}

interface ParamInfo {
  name: string;
  description: string;
  required: boolean;
}

interface FieldInfo {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

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
  /** Tag for grouping in CLI help */
  tag: string;
  /** Query parameters (for GET routes with exploded payload) */
  queryParams?: ParamInfo[];
  /** Key body fields (for POST/PUT/DELETE routes) */
  bodyFields?: FieldInfo[];
  /** SDK usage example */
  example?: string;
  /** Links to SDK type docs */
  sdkLinks?: SdkLinks;
  /** Compact TypeScript-like schema for the request type */
  requestSchema?: string;
  /** Compact TypeScript-like schema for the response type */
  responseSchema?: string;
}

const ROUTES: ApiRoute[] = [
  // =========================================================================
  // Accounts
  // =========================================================================
  {
    name: 'get-account',
    tag: 'accounts',
    method: 'GET',
    path: '/user',
    description: 'Get account by address or username',
    pathParams: [],
    hasBody: false,
    queryParams: [
      { name: 'address', description: 'The address of the account', required: false },
      { name: 'username', description: 'The username of the account', required: false },
    ],
    example: `const res = await BitBadgesApi.getAccount({ address: '...' });`,
    sdkLinks: {
      request: 'iGetAccountPayload',
      response: 'iGetAccountSuccessResponse',
      function: 'BitBadgesAPI.getAccount',
    },
    requestSchema: `{
  address?: string;
  username?: string;
}`,
    responseSchema: `{
  account: iBitBadgesUserInfo;  // Full account details
}`,
  },
  {
    name: 'get-accounts',
    tag: 'accounts',
    method: 'POST',
    path: '/users',
    description: 'Get accounts (batch, view-based)',
    pathParams: [],
    hasBody: true,
    bodyFields: [
      { name: 'accountsToFetch', type: 'Array<{ address, viewsToFetch? }>', description: 'Array of accounts to fetch with optional views', required: true },
    ],
    example: `const res = await BitBadgesApi.getAccounts({ accountsToFetch: [{ address: 'bb1...' }] });`,
    sdkLinks: {
      request: 'iGetAccountsPayload',
      response: 'iGetAccountsSuccessResponse',
      function: 'BitBadgesAPI.getAccounts',
    },
    requestSchema: `{
  accountsToFetch: Array<{
    address: string;
    viewsToFetch?: Record<string, { viewType: string; bookmark?: string }>;
  }>;
}`,
    responseSchema: `{
  accounts: iBitBadgesUserInfo[];  // Array of account details
}`,
  },
  {
    name: 'get-siwbb-requests-for-user',
    tag: 'accounts',
    method: 'GET',
    path: '/account/{address}/requests/siwbb',
    description: 'Get SIWBB requests for a user',
    pathParams: ['address'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetSiwbbRequestsForUserPayload',
      response: 'iGetSiwbbRequestsForUserSuccessResponse',
      function: 'BitBadgesAPI.getSiwbbRequestsForUser',
    },
  },
  {
    name: 'get-transfer-activity-for-user',
    tag: 'accounts',
    method: 'GET',
    path: '/account/{address}/activity/tokens',
    description: 'Get transfer activity for a user',
    pathParams: ['address'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetTransferActivityForUserPayload',
      response: 'iGetTransferActivityForUserSuccessResponse',
      function: 'BitBadgesAPI.getTransferActivityForUser',
    },
  },
  {
    name: 'get-tokens-for-user',
    tag: 'accounts',
    method: 'GET',
    path: '/account/{address}/tokens',
    description: 'Get tokens for a user. Specify viewType to choose collected, created, managing, etc.',
    pathParams: ['address'],
    hasBody: false,
    queryParams: [
      { name: 'viewType', description: 'Type of tokens view (collected, created, managing, etc.)', required: false },
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetTokensViewForUserPayload',
      response: 'iGetTokensViewForUserSuccessResponse',
      function: 'BitBadgesAPI.getTokensViewForUser',
    },
  },
  {
    name: 'get-claim-activity-for-user',
    tag: 'accounts',
    method: 'GET',
    path: '/account/{address}/activity/claims',
    description: 'Get claim activity for a user',
    pathParams: ['address'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetClaimActivityForUserPayload',
      response: 'iGetClaimActivityForUserSuccessResponse',
      function: 'BitBadgesAPI.getClaimActivityForUser',
    },
  },
  {
    name: 'get-points-activity-for-user',
    tag: 'accounts',
    method: 'GET',
    path: '/account/{address}/activity/points',
    description: 'Get points activity for a user',
    pathParams: ['address'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetPointsActivityForUserPayload',
      response: 'iGetPointsActivityForUserSuccessResponse',
      function: 'BitBadgesAPI.getPointsActivityForUser',
    },
  },

  // =========================================================================
  // Collections / Tokens
  // =========================================================================
  {
    name: 'get-collection',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}',
    description: 'Get a specific collection',
    pathParams: ['collectionId'],
    hasBody: false,
    example: `await BitBadgesApi.getCollection("123");`,
    sdkLinks: {
      response: 'iGetCollectionSuccessResponse',
      function: 'BitBadgesAPI.getCollection',
    },
    responseSchema: `{
  collection: iBitBadgesCollection;  // Full collection details
  metadata: iMetadata;               // Current collection metadata
}`,
  },
  {
    name: 'get-token-metadata',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}/{tokenId}/metadata',
    description: 'Get metadata for a specific token',
    pathParams: ['collectionId', 'tokenId'],
    hasBody: false,
    example: `await BitBadgesApi.getTokenMetadata("123", "1");`,
    sdkLinks: {
      response: 'iGetTokenMetadataSuccessResponse',
      function: 'BitBadgesAPI.getTokenMetadata',
    },
  },
  {
    name: 'get-collections',
    tag: 'tokens',
    method: 'POST',
    path: '/collections',
    description: 'Get collections (batch, view-based)',
    pathParams: [],
    hasBody: true,
    bodyFields: [
      { name: 'collectionsToFetch', type: 'Array<{ collectionId, metadataToFetch?, viewsToFetch?, fetchTotalAndMintBalances? }>', description: 'Array of collections to fetch with optional metadata/views', required: true },
    ],
    example: `const res = await BitBadgesApi.getCollections({ collectionsToFetch: [{ collectionId: 1n }] });`,
    sdkLinks: {
      request: 'iGetCollectionsPayload',
      response: 'iGetCollectionsSuccessResponse',
      function: 'BitBadgesAPI.getCollections',
    },
    requestSchema: `{
  collectionsToFetch: Array<{
    collectionId: NumberType;
    metadataToFetch?: { badgeIds?: iUintRange[]; ... };
    viewsToFetch?: Record<string, { viewType: string; bookmark?: string }>;
    fetchTotalAndMintBalances?: boolean;
  }>;
}`,
    responseSchema: `{
  collections: iBitBadgesCollection[];  // Array of collection details
}`,
  },
  {
    name: 'get-balance-specific-token',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}/balance/{address}/{tokenId}',
    description: 'Get balance of a specific token for an address. Address can be "Total" for circulating supply.',
    pathParams: ['collectionId', 'address', 'tokenId'],
    hasBody: false,
    example: `const res = await BitBadgesApi.getBalanceByAddressSpecificToken(collectionId, address, tokenId);`,
    sdkLinks: {
      request: 'iGetBalanceByAddressSpecificTokenPayload',
      response: 'iGetBalanceByAddressSpecificTokenSuccessResponse',
      function: 'BitBadgesAPI.getBalanceByAddressSpecificToken',
    },
    responseSchema: `{
  balance: NumberType;  // The balance amount for this specific token
}`,
  },
  {
    name: 'get-balance-by-address',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}/balance/{address}',
    description: 'Get balances for an address in a collection. Address can be "Total" for circulating supply.',
    pathParams: ['collectionId', 'address'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetBalanceByAddressPayload',
      response: 'iGetBalanceByAddressSuccessResponse',
      function: 'BitBadgesAPI.getBalanceByAddress',
    },
    requestSchema: `{
  fetchPrivateParams?: boolean;
  forceful?: boolean;
}`,
    responseSchema: `{
  balances: iBalance[];
  incomingApprovals: iUserIncomingApproval[];
  outgoingApprovals: iUserOutgoingApproval[];
  userPermissions: iUserPermissions;
  autoApproveSelfInitiatedOutgoingTransfers: boolean;
  autoApproveSelfInitiatedIncomingTransfers: boolean;
  autoApproveAllIncomingTransfers: boolean;
  collectionId: NumberType;
  bitbadgesAddress: string;
  ...
}`,
  },
  {
    name: 'get-token-owners',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}/{tokenId}/owners',
    description: 'Get owners of a specific token (paginated)',
    pathParams: ['collectionId', 'tokenId'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetOwnersPayload',
      response: 'iGetOwnersSuccessResponse',
      function: 'BitBadgesAPI.getOwners',
    },
  },
  {
    name: 'get-token-activity',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}/{tokenId}/activity',
    description: 'Get activity for a specific token (paginated)',
    pathParams: ['collectionId', 'tokenId'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetTokenActivityPayload',
      response: 'iGetTokenActivitySuccessResponse',
      function: 'BitBadgesAPI.getTokenActivity',
    },
  },
  {
    name: 'refresh-metadata',
    tag: 'tokens',
    method: 'POST',
    path: '/collection/{collectionId}/refresh',
    description: 'Trigger metadata refresh for a collection. Will reject if recently refreshed.',
    pathParams: ['collectionId'],
    hasBody: true,
    sdkLinks: {
      request: 'iRefreshMetadataPayload',
      response: 'iRefreshMetadataSuccessResponse',
      function: 'BitBadgesAPI.refreshMetadata',
    },
  },
  {
    name: 'get-refresh-status',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}/refreshStatus',
    description: 'Get refresh status for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
    sdkLinks: {
      request: 'iGetRefreshStatusPayload',
      response: 'iRefreshStatusSuccessResponse',
      function: 'BitBadgesAPI.getRefreshStatus',
    },
  },
  {
    name: 'get-collection-owners',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}/owners',
    description: 'Get owners for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetCollectionOwnersPayload',
      response: 'iGetCollectionOwnersSuccessResponse',
      function: 'BitBadgesAPI.getCollectionOwners',
    },
  },
  {
    name: 'get-collection-transfer-activity',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}/activity',
    description: 'Get transfer activity for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetCollectionTransferActivityPayload',
      response: 'iGetCollectionTransferActivitySuccessResponse',
      function: 'BitBadgesAPI.getCollectionTransferActivity',
    },
  },
  {
    name: 'get-collection-challenge-trackers',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}/challengeTrackers',
    description: 'Get challenge trackers for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetCollectionChallengeTrackersPayload',
      response: 'iGetCollectionChallengeTrackersSuccessResponse',
      function: 'BitBadgesAPI.getCollectionChallengeTrackers',
    },
  },
  {
    name: 'get-collection-amount-trackers',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}/amountTrackers',
    description: 'Get amount trackers for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetCollectionAmountTrackersPayload',
      response: 'iGetCollectionAmountTrackersSuccessResponse',
      function: 'BitBadgesAPI.getCollectionAmountTrackers',
    },
  },
  {
    name: 'get-collection-amount-tracker-by-id',
    tag: 'tokens',
    method: 'GET',
    path: '/api/v0/collection/amountTracker',
    description: 'Get a collection amount tracker by ID',
    pathParams: [],
    hasBody: false,
    queryParams: [
      { name: 'collectionId', description: 'The collection ID', required: true },
      { name: 'approvalId', description: 'The approval ID', required: true },
      { name: 'approvalLevel', description: 'The approval level', required: true },
      { name: 'approverAddress', description: 'The approver address', required: true },
      { name: 'amountTrackerId', description: 'The amount tracker ID', required: true },
      { name: 'trackerType', description: 'The tracker type', required: true },
    ],
    sdkLinks: {
      request: 'iAmountTrackerIdDetails',
      response: 'iGetCollectionAmountTrackerByIdSuccessResponse',
      function: 'BitBadgesAPI.getCollectionAmountTrackerById',
    },
  },
  {
    name: 'get-collection-challenge-tracker-by-id',
    tag: 'tokens',
    method: 'GET',
    path: '/api/v0/collection/challengeTracker',
    description: 'Get a collection challenge tracker by ID',
    pathParams: [],
    hasBody: false,
    queryParams: [
      { name: 'collectionId', description: 'The collection ID', required: true },
      { name: 'approvalId', description: 'The approval ID', required: true },
      { name: 'approvalLevel', description: 'The approval level', required: true },
      { name: 'approverAddress', description: 'The approver address', required: true },
      { name: 'challengeTrackerId', description: 'The challenge tracker ID', required: true },
    ],
    sdkLinks: {
      request: 'iChallengeTrackerIdDetails',
      response: 'iGetCollectionChallengeTrackerByIdSuccessResponse',
      function: 'BitBadgesAPI.getCollectionChallengeTrackerById',
    },
  },
  {
    name: 'get-collection-listings',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}/listings',
    description: 'Get listings for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetCollectionListingsPayload',
      response: 'iGetCollectionListingsSuccessResponse',
      function: 'BitBadgesAPI.getCollectionListings',
    },
  },
  {
    name: 'get-collection-claims',
    tag: 'tokens',
    method: 'GET',
    path: '/collection/{collectionId}/claims',
    description: 'Get claims for a collection',
    pathParams: ['collectionId'],
    hasBody: false,
    sdkLinks: {
      response: 'iGetCollectionClaimsSuccessResponse',
      function: 'BitBadgesAPI.getCollectionClaims',
    },
  },

  // =========================================================================
  // Claims
  // =========================================================================
  {
    name: 'get-claim',
    tag: 'claims',
    method: 'GET',
    path: '/claim/{claimId}',
    description: 'Get a claim by ID',
    pathParams: ['claimId'],
    hasBody: false,
    queryParams: [
      { name: 'fetchPrivateParams', description: 'Whether to fetch private claim parameters (must be manager)', required: false },
    ],
    example: `await BitBadgesApi.getClaim("claim123");`,
    sdkLinks: {
      request: 'iGetClaimPayload',
      response: 'iGetClaimSuccessResponse',
      function: 'BitBadgesAPI.getClaim',
    },
    requestSchema: `{
  fetchPrivateParams?: boolean;
  fetchAllClaimedUsers?: boolean;
  privateStatesToFetch?: string[];
}`,
    responseSchema: `{
  claim: iClaimDetails;  // Full claim details including plugins
}`,
  },
  {
    name: 'check-claim-success',
    tag: 'claims',
    method: 'GET',
    path: '/claims/success/{claimId}/{address}',
    description: 'Check if a claim was successfully completed by a user. Returns success count.',
    pathParams: ['claimId', 'address'],
    hasBody: false,
    example: `const res = await BitBadgesApi.checkClaimSuccess(claimId, address);`,
    sdkLinks: {
      request: 'iCheckClaimSuccessPayload',
      response: 'iCheckClaimSuccessSuccessResponse',
      function: 'BitBadgesAPI.checkClaimSuccess',
    },
    responseSchema: `{
  success: boolean;
  numUsed: number;   // Number of times claim was completed
}`,
  },
  {
    name: 'complete-claim',
    tag: 'claims',
    method: 'POST',
    path: '/claims/complete/{claimId}/{address}',
    description: 'Complete a claim for an address. Returns a claimAttemptId to check status.',
    pathParams: ['claimId', 'address'],
    hasBody: true,
    bodyFields: [
      { name: '_expectedVersion', type: 'number', description: 'Must match the claim version. Use -1 to skip check.', required: true },
      { name: '[pluginInstanceId]', type: 'object', description: 'Body for each plugin instance (keyed by plugin instance ID)', required: false },
    ],
    example: `const res = await BitBadgesApi.completeClaim(claimId, address, { _expectedVersion: 1 });`,
    sdkLinks: {
      request: 'iCompleteClaimPayload',
      response: 'iCompleteClaimSuccessResponse',
      function: 'BitBadgesAPI.completeClaim',
    },
    requestSchema: `{
  _expectedVersion: number;  // Must match claim version, or -1 to skip
  _specificInstanceIds?: string[];
  [pluginInstanceId: string]: any;  // Per-plugin bodies keyed by instance ID
}`,
    responseSchema: `{
  claimAttemptId: string;  // Track with get-claim-attempt-status
}`,
  },
  {
    name: 'simulate-claim',
    tag: 'claims',
    method: 'POST',
    path: '/claims/simulate/{claimId}/{address}',
    description: 'Simulate a claim for an address. Instant check (no queue). Success means simulation passed.',
    pathParams: ['claimId', 'address'],
    hasBody: true,
    bodyFields: [
      { name: '_expectedVersion', type: 'number', description: 'Must match the claim version. Use -1 to skip check.', required: true },
      { name: '_specificInstanceIds', type: 'string[]', description: 'Optional: simulate only specific plugin instances', required: false },
      { name: '[pluginInstanceId]', type: 'object', description: 'Body for each plugin instance', required: false },
    ],
    example: `const res = await BitBadgesApi.simulateClaim(claimId, address, { _expectedVersion: 1 });`,
    sdkLinks: {
      request: 'iSimulateClaimPayload',
      response: 'iSimulateClaimSuccessResponse',
      function: 'BitBadgesAPI.simulateClaim',
    },
    requestSchema: `{
  _expectedVersion: number;  // Must match claim version, or -1 to skip
  _specificInstanceIds?: string[];  // Simulate only specific plugin instances
  [pluginInstanceId: string]: any;  // Per-plugin bodies
}`,
  },
  {
    name: 'get-reserved-codes',
    tag: 'claims',
    method: 'POST',
    path: '/claims/reserved/{claimId}/{address}',
    description: 'Get reserved claim codes (for on-chain claims bridging off-chain to on-chain)',
    pathParams: ['claimId', 'address'],
    hasBody: true,
    sdkLinks: {
      request: 'iGetReservedClaimCodesPayload',
      response: 'iGetReservedClaimCodesSuccessResponse',
      function: 'BitBadgesAPI.getReservedCodes',
    },
  },
  {
    name: 'get-claim-attempt-status',
    tag: 'claims',
    method: 'GET',
    path: '/claims/status/{claimAttemptId}',
    description: 'Get status of a claim attempt by the ID received when submitting',
    pathParams: ['claimAttemptId'],
    hasBody: false,
    example: `const res = await BitBadgesApi.getClaimAttemptStatus(claimAttemptId);`,
    sdkLinks: {
      request: 'iGetClaimAttemptStatusPayload',
      response: 'iGetClaimAttemptStatusSuccessResponse',
      function: 'BitBadgesAPI.getClaimAttemptStatus',
    },
    responseSchema: `{
  success: boolean;
  error: string;
  code?: string;            // On-chain tx code (if applicable)
  bitbadgesAddress: string;
}`,
  },
  {
    name: 'search-claims',
    tag: 'claims',
    method: 'GET',
    path: '/claims/search',
    description: 'Search through your managed claims (requires sign-in)',
    pathParams: [],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iSearchClaimsPayload',
      response: 'iSearchClaimsSuccessResponse',
      function: 'BitBadgesAPI.searchClaims',
    },
  },
  {
    name: 'get-claims',
    tag: 'claims',
    method: 'POST',
    path: '/claims/fetch',
    description: 'Get claims (batch). To fetch private state, must be manager and signed in.',
    pathParams: [],
    hasBody: true,
    bodyFields: [
      { name: 'claimsToFetch', type: 'Array<{ claimId, fetchPrivateParams?, privateStatesToFetch? }>', description: 'Claims to fetch with optional private data requests', required: true },
    ],
    example: `const res = await BitBadgesApi.getClaims({ claimsToFetch: [{ claimId: '123' }] });`,
    sdkLinks: {
      request: 'iGetClaimsPayloadV1',
      response: 'iGetClaimsSuccessResponse',
      function: 'BitBadgesAPI.getClaims',
    },
    requestSchema: `{
  claimsToFetch: Array<{
    claimId: string;
    privateStatesToFetch?: string[];
    fetchAllClaimedUsers?: boolean;
    fetchPrivateParams?: boolean;
  }>;
}`,
    responseSchema: `{
  claims: iClaimDetails[];
  bookmark?: string;
}`,
  },
  {
    name: 'create-claim',
    tag: 'claims',
    method: 'POST',
    path: '/claims',
    description: 'Create a new claim. Scope: manageClaims',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iCreateClaimPayload',
      response: 'iCreateClaimSuccessResponse',
      function: 'BitBadgesAPI.createClaims',
    },
  },
  {
    name: 'update-claim',
    tag: 'claims',
    method: 'PUT',
    path: '/claims',
    description: 'Update an existing claim. Scope: manageClaims',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iUpdateClaimPayload',
      response: 'iUpdateClaimSuccessResponse',
      function: 'BitBadgesAPI.updateClaims',
    },
  },
  {
    name: 'delete-claim',
    tag: 'claims',
    method: 'DELETE',
    path: '/claims',
    description: 'Delete a claim. Scope: manageClaims',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iDeleteClaimPayload',
      response: 'iDeleteClaimSuccessResponse',
      function: 'BitBadgesAPI.deleteClaims',
    },
  },
  {
    name: 'generate-code',
    tag: 'claims',
    method: 'GET',
    path: '/codes',
    description: 'Generate a unique code from a seed and index (Codes plugin)',
    pathParams: [],
    hasBody: false,
    queryParams: [
      { name: 'seedCode', description: 'The seed used to generate the code', required: true },
      { name: 'idx', description: 'The zero-based index of the code to generate', required: true },
    ],
  },
  {
    name: 'get-claim-attempts',
    tag: 'claims',
    method: 'GET',
    path: '/claims/{claimId}/attempts',
    description: 'Get claim attempts (paginated). Managers can include errors.',
    pathParams: ['claimId'],
    hasBody: false,
    queryParams: [
      { name: 'address', description: 'Filter by claimant address', required: false },
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
      { name: 'includeErrors', description: 'Include failed attempts with errors (manager only)', required: false },
    ],
    sdkLinks: {
      request: 'iGetClaimAttemptsPayload',
      response: 'iGetClaimAttemptsSuccessResponse',
      function: 'BitBadgesAPI.getClaimAttempts',
    },
  },
  {
    name: 'get-gated-content-for-claim',
    tag: 'claims',
    method: 'GET',
    path: '/claims/gatedContent/{claimId}',
    description: 'Get gated content for a claim (must have completed claim). Scope: completeClaims',
    pathParams: ['claimId'],
    hasBody: false,
    sdkLinks: {
      request: 'iGetGatedContentForClaimPayload',
      response: 'iGetGatedContentForClaimSuccessResponse',
      function: 'BitBadgesAPI.getGatedContentForClaim',
    },
  },

  // =========================================================================
  // Transactions
  // =========================================================================
  {
    name: 'broadcast-tx',
    tag: 'tx',
    method: 'POST',
    path: '/broadcast',
    description: 'Broadcast a transaction to the blockchain',
    pathParams: [],
    hasBody: true,
    example: `const res = await BitBadgesApi.broadcastTx(...);`,
    sdkLinks: {
      request: 'iBroadcastTxPayload',
      response: 'iBroadcastTxSuccessResponse',
      function: 'BitBadgesAPI.broadcastTx',
    },
    requestSchema: `{
  tx_bytes: any;   // Signed transaction bytes
  mode: string;    // Broadcast mode (e.g. "BROADCAST_MODE_SYNC")
}`,
    responseSchema: `{
  tx_response: {
    code: number;
    txhash: string;
    height: string;
    gas_wanted: string;
    gas_used: string;
    raw_log: string;
    events: Array<{ type: string; attributes: ... }>;
    ...
  };
}`,
  },
  {
    name: 'simulate-tx',
    tag: 'tx',
    method: 'POST',
    path: '/simulate',
    description: 'Simulate a transaction on the blockchain',
    pathParams: [],
    hasBody: true,
    example: `const res = await BitBadgesApi.simulateTx(...);`,
    sdkLinks: {
      request: 'iSimulateTxPayload',
      response: 'iSimulateTxSuccessResponse',
      function: 'BitBadgesAPI.simulateTx',
    },
    requestSchema: `{
  tx_bytes: any;   // Signed transaction bytes
  mode: string;    // Broadcast mode
}`,
    responseSchema: `{
  gas_info: {
    gas_used: string;
    gas_wanted: string;
  };
  result: {
    data: string;
    log: string;
    events: Array<{ type: string; attributes: ... }>;
  };
}`,
  },

  // =========================================================================
  // Sign In with BitBadges (SIWBB) / OAuth
  // =========================================================================
  {
    name: 'exchange-siwbb-code',
    tag: 'auth',
    method: 'POST',
    path: '/siwbb/token',
    description: 'Exchange SIWBB authorization code or refresh token for access token',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iExchangeSIWBBAuthorizationCodePayload',
      response: 'iExchangeSIWBBAuthorizationCodeSuccessResponse',
      function: 'BitBadgesAPI.exchangeSIWBBAuthorizationCode',
    },
  },
  {
    name: 'revoke-oauth',
    tag: 'auth',
    method: 'POST',
    path: '/siwbb/token/revoke',
    description: 'Revoke an OAuth authorization (access or refresh token)',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iOauthRevokePayload',
      response: 'iOauthRevokeSuccessResponse',
      function: 'BitBadgesAPI.revokeOauthAuthorization',
    },
  },
  {
    name: 'rotate-siwbb-request',
    tag: 'auth',
    method: 'POST',
    path: '/siwbbRequest/rotate',
    description: 'Rotate a SIWBB request (e.g. QR code). Scope: approveSignInWithBitBadgesRequests',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iRotateSIWBBRequestPayload',
      response: 'iRotateSIWBBRequestSuccessResponse',
      function: 'BitBadgesAPI.rotateSIWBBRequest',
    },
  },
  {
    name: 'delete-siwbb-request',
    tag: 'auth',
    method: 'DELETE',
    path: '/siwbbRequest',
    description: 'Delete a SIWBB request. Scope: deleteAuthenticationCodes',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iDeleteSIWBBRequestPayload',
      response: 'iDeleteSIWBBRequestSuccessResponse',
      function: 'BitBadgesAPI.deleteSIWBBRequest',
    },
  },
  {
    name: 'create-siwbb-request',
    tag: 'auth',
    method: 'POST',
    path: '/siwbbRequest',
    description: 'Create a SIWBB request. Typically use frontend flow instead. Scope: approveSignInWithBitBadgesRequests',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iCreateSIWBBRequestPayload',
      response: 'iCreateSIWBBRequestSuccessResponse',
      function: 'BitBadgesAPI.createSIWBBRequest',
    },
  },
  {
    name: 'get-siwbb-requests-for-app',
    tag: 'auth',
    method: 'GET',
    path: '/developerApps/siwbbRequests',
    description: 'Get SIWBB requests for a developer app. Scope: manageDeveloperApps',
    pathParams: [],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetSIWBBRequestsForDeveloperAppPayload',
      response: 'iGetSIWBBRequestsForDeveloperAppSuccessResponse',
      function: 'BitBadgesAPI.getSIWBBRequestsForDeveloperApp',
    },
  },
  {
    name: 'check-sign-in-status',
    tag: 'auth',
    method: 'POST',
    path: '/auth/status',
    description: 'Check if a user is currently signed in and get auth status',
    pathParams: [],
    hasBody: true,
    example: `const res = await BitBadgesApi.checkIfSignedIn(...);`,
    sdkLinks: {
      request: 'iCheckSignInStatusPayload',
      response: 'iCheckSignInStatusSuccessResponse',
      function: 'BitBadgesAPI.checkIfSignedIn',
    },
  },

  // =========================================================================
  // Developer Apps
  // =========================================================================
  {
    name: 'get-developer-app',
    tag: 'apps',
    method: 'GET',
    path: '/developerApp/{clientId}',
    description: 'Get an OAuth app by client ID. Scope: manageDeveloperApps (for client secret)',
    pathParams: ['clientId'],
    hasBody: false,
    sdkLinks: {
      request: 'iGetDeveloperAppPayload',
      response: 'iGetDeveloperAppSuccessResponse',
      function: 'BitBadgesAPI.getDeveloperApp',
    },
  },
  {
    name: 'create-developer-app',
    tag: 'apps',
    method: 'POST',
    path: '/developerApps',
    description: 'Create a new OAuth app. Scope: manageDeveloperApps',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iCreateDeveloperAppPayload',
      response: 'iCreateDeveloperAppSuccessResponse',
      function: 'BitBadgesAPI.createDeveloperApp',
    },
  },
  {
    name: 'update-developer-app',
    tag: 'apps',
    method: 'PUT',
    path: '/developerApps',
    description: 'Update an OAuth app. Scope: manageDeveloperApps',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iUpdateDeveloperAppPayload',
      response: 'iUpdateDeveloperAppSuccessResponse',
      function: 'BitBadgesAPI.updateDeveloperApp',
    },
  },
  {
    name: 'delete-developer-app',
    tag: 'apps',
    method: 'DELETE',
    path: '/developerApps',
    description: 'Delete an OAuth app. Scope: manageDeveloperApps',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iDeleteDeveloperAppPayload',
      response: 'iDeleteDeveloperAppSuccessResponse',
      function: 'BitBadgesAPI.deleteDeveloperApp',
    },
  },

  // =========================================================================
  // Plugins
  // =========================================================================
  {
    name: 'get-plugin',
    tag: 'plugins',
    method: 'GET',
    path: '/plugin/{pluginId}',
    description: 'Get a plugin by ID',
    pathParams: ['pluginId'],
    hasBody: false,
    sdkLinks: {
      request: 'iGetPluginPayload',
      response: 'iGetPluginSuccessResponse',
      function: 'BitBadgesAPI.getPlugin',
    },
  },
  {
    name: 'get-plugins',
    tag: 'plugins',
    method: 'POST',
    path: '/plugins/fetch',
    description: 'Get plugins (batch)',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iGetPluginsPayload',
      response: 'iGetPluginSuccessResponse',
      function: 'BitBadgesAPI.getPlugins',
    },
  },
  {
    name: 'search-plugins',
    tag: 'plugins',
    method: 'GET',
    path: '/plugins/search',
    description: 'Search plugins',
    pathParams: [],
    hasBody: false,
    sdkLinks: {
      request: 'iSearchPluginsPayload',
      response: 'iSearchPluginsSuccessResponse',
      function: 'BitBadgesAPI.searchPlugins',
    },
  },
  {
    name: 'get-creator-plugins',
    tag: 'plugins',
    method: 'GET',
    path: '/plugins/creator',
    description: 'Get plugins by creator address. Full Access scope required for private plugins.',
    pathParams: [],
    hasBody: false,
    queryParams: [
      { name: 'creatorAddress', description: 'The creator address', required: false },
      { name: 'returnSensitiveData', description: 'Return sensitive data like plugin secret', required: false },
    ],
    sdkLinks: {
      request: 'iGetCreatorPluginsPayload',
      response: 'iGetPluginSuccessResponse',
      function: 'BitBadgesAPI.getCreatorPlugins',
    },
  },

  // =========================================================================
  // Dynamic Stores (off-chain)
  // =========================================================================
  {
    name: 'get-dynamic-store',
    tag: 'stores',
    method: 'GET',
    path: '/dynamicStore/{dynamicStoreId}',
    description: 'Get a dynamic data store by ID. Scope: manageDynamicStores (or use dataSecret)',
    pathParams: ['dynamicStoreId'],
    hasBody: false,
    queryParams: [
      { name: 'dataSecret', description: 'Data secret for authentication (alternative to sign-in)', required: false },
    ],
    sdkLinks: {
      request: 'iGetDynamicDataStorePayload',
      response: 'iGetDynamicDataStoreSuccessResponse',
      function: 'BitBadgesAPI.getDynamicDataStore',
    },
  },
  {
    name: 'get-dynamic-store-value',
    tag: 'stores',
    method: 'GET',
    path: '/dynamicStore/{dynamicStoreId}/value',
    description: 'Get a value from a dynamic data store by key',
    pathParams: ['dynamicStoreId'],
    hasBody: false,
    queryParams: [
      { name: 'key', description: 'The key to fetch', required: true },
      { name: 'dataSecret', description: 'Data secret for authentication', required: false },
    ],
    sdkLinks: {
      request: 'iGetDynamicDataStoreValuePayload',
      response: 'iGetDynamicDataStoreValueSuccessResponse',
      function: 'BitBadgesAPI.getDynamicDataStoreValue',
    },
  },
  {
    name: 'get-dynamic-store-values',
    tag: 'stores',
    method: 'GET',
    path: '/dynamicStore/{dynamicStoreId}/values',
    description: 'Get paginated values from a dynamic data store',
    pathParams: ['dynamicStoreId'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetDynamicDataStoreValuesPaginatedPayload',
      response: 'iGetDynamicDataStoreValuesPaginatedSuccessResponse',
      function: 'BitBadgesAPI.getDynamicDataStoreValuesPaginated',
    },
  },
  {
    name: 'create-dynamic-store',
    tag: 'stores',
    method: 'POST',
    path: '/dynamicStores',
    description: 'Create a new dynamic data store. Scope: manageDynamicStores',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iCreateDynamicDataStorePayload',
      response: 'iCreateDynamicDataStoreSuccessResponse',
      function: 'BitBadgesAPI.createDynamicDataStore',
    },
  },
  {
    name: 'update-dynamic-store',
    tag: 'stores',
    method: 'PUT',
    path: '/dynamicStores',
    description: 'Update a dynamic data store. Scope: manageDynamicStores',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iUpdateDynamicDataStorePayload',
      response: 'iUpdateDynamicDataStoreSuccessResponse',
      function: 'BitBadgesAPI.updateDynamicDataStore',
    },
  },
  {
    name: 'delete-dynamic-store',
    tag: 'stores',
    method: 'DELETE',
    path: '/dynamicStores',
    description: 'Delete a dynamic data store. Scope: manageDynamicStores',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iDeleteDynamicDataStorePayload',
      response: 'iDeleteDynamicDataStoreSuccessResponse',
      function: 'BitBadgesAPI.deleteDynamicDataStore',
    },
  },
  {
    name: 'get-dynamic-stores',
    tag: 'stores',
    method: 'POST',
    path: '/dynamicStores/fetch',
    description: 'Fetch dynamic data stores (batch). Scope: manageDynamicStores (or dataSecret)',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iGetDynamicDataStoresPayload',
      response: 'iGetDynamicDataStoresSuccessResponse',
      function: 'BitBadgesAPI.getDynamicDataStores',
    },
  },
  {
    name: 'search-dynamic-stores',
    tag: 'stores',
    method: 'GET',
    path: '/dynamicStores/search',
    description: 'Search dynamic data stores for signed-in user. Scope: manageDynamicStores',
    pathParams: [],
    hasBody: false,
    sdkLinks: {
      request: 'iSearchDynamicDataStoresPayload',
      response: 'iSearchDynamicDataStoresSuccessResponse',
      function: 'BitBadgesAPI.searchDynamicDataStores',
    },
  },
  {
    name: 'get-dynamic-data-activity',
    tag: 'stores',
    method: 'GET',
    path: '/dynamicStores/activity',
    description: 'Get dynamic data store activity history. Scope: manageDynamicStores (or dataSecret)',
    pathParams: [],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetDynamicDataActivityPayload',
      response: 'iGetDynamicDataActivitySuccessResponse',
      function: 'BitBadgesAPI.getDynamicDataActivity',
    },
  },
  {
    name: 'perform-store-action-single',
    tag: 'stores',
    method: 'POST',
    path: '/storeActions/single',
    description: 'Perform a single store action (body auth). Scope: manageDynamicStores (or dataSecret)',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iPerformStoreActionSingleWithBodyAuthPayload',
      response: 'iPerformStoreActionSuccessResponse',
      function: 'BitBadgesAPI.performStoreAction',
    },
  },
  {
    name: 'perform-store-action-batch',
    tag: 'stores',
    method: 'POST',
    path: '/storeActions/batch',
    description: 'Perform batch store actions (body auth). Scope: manageDynamicStores (or dataSecret)',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iPerformStoreActionBatchWithBodyAuthPayload',
      response: 'iBatchStoreActionSuccessResponse',
      function: 'BitBadgesAPI.performBatchStoreAction',
    },
  },

  // =========================================================================
  // Applications
  // =========================================================================
  {
    name: 'get-application',
    tag: 'apps',
    method: 'GET',
    path: '/application/{applicationId}',
    description: 'Get an application by ID',
    pathParams: ['applicationId'],
    hasBody: false,
    sdkLinks: {
      request: 'iGetApplicationPayload',
      response: 'iGetApplicationSuccessResponse',
      function: 'BitBadgesAPI.getApplication',
    },
  },
  {
    name: 'search-applications',
    tag: 'apps',
    method: 'GET',
    path: '/applications/search',
    description: 'Search applications (signed-in user only). Scope: manageApplications',
    pathParams: [],
    hasBody: false,
    sdkLinks: {
      request: 'iSearchApplicationsPayload',
      response: 'iSearchApplicationsSuccessResponse',
      function: 'BitBadgesAPI.searchApplications',
    },
  },
  {
    name: 'get-applications',
    tag: 'apps',
    method: 'POST',
    path: '/applications/fetch',
    description: 'Fetch applications (batch)',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iGetApplicationsPayload',
      response: 'iGetApplicationsSuccessResponse',
      function: 'BitBadgesAPI.getApplications',
    },
  },
  {
    name: 'create-application',
    tag: 'apps',
    method: 'POST',
    path: '/applications',
    description: 'Create an application. Scope: manageApplications',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iCreateApplicationPayload',
      response: 'iCreateApplicationSuccessResponse',
      function: 'BitBadgesAPI.createApplication',
    },
  },
  {
    name: 'update-application',
    tag: 'apps',
    method: 'PUT',
    path: '/applications',
    description: 'Update an application. Scope: manageApplications',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iUpdateApplicationPayload',
      response: 'iUpdateApplicationSuccessResponse',
      function: 'BitBadgesAPI.updateApplication',
    },
  },
  {
    name: 'delete-application',
    tag: 'apps',
    method: 'DELETE',
    path: '/applications',
    description: 'Delete an application. Scope: manageApplications',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iDeleteApplicationPayload',
      response: 'iDeleteApplicationSuccessResponse',
      function: 'BitBadgesAPI.deleteApplication',
    },
  },
  {
    name: 'calculate-points',
    tag: 'apps',
    method: 'POST',
    path: '/applications/points',
    description: 'Calculate points for an application. Uses heavy caching.',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iCalculatePointsPayload',
      response: 'iCalculatePointsSuccessResponse',
      function: 'BitBadgesAPI.calculatePoints',
    },
  },
  {
    name: 'get-points-activity',
    tag: 'apps',
    method: 'GET',
    path: '/applications/points/activity',
    description: 'Get points activity for an application',
    pathParams: [],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
    sdkLinks: {
      request: 'iGetPointsActivityPayload',
      response: 'iGetPointsActivitySuccessResponse',
      function: 'BitBadgesAPI.getPointsActivity',
    },
  },

  // =========================================================================
  // Utility Pages
  // =========================================================================
  {
    name: 'get-utility-page',
    tag: 'pages',
    method: 'GET',
    path: '/utilityPage/{utilityPageId}',
    description: 'Get a utility page by ID. Scope: manageUtilityPages (for private pages)',
    pathParams: ['utilityPageId'],
    hasBody: false,
    sdkLinks: {
      request: 'iGetUtilityPagePayload',
      response: 'iGetUtilityPageSuccessResponse',
      function: 'BitBadgesAPI.getUtilityPage',
    },
  },
  {
    name: 'get-utility-pages',
    tag: 'pages',
    method: 'POST',
    path: '/utilityPages/fetch',
    description: 'Fetch utility pages (batch). Scope: manageUtilityPages (for private pages)',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iGetUtilityPagesPayload',
      response: 'iGetUtilityPagesSuccessResponse',
      function: 'BitBadgesAPI.getUtilityPages',
    },
  },
  {
    name: 'search-utility-pages',
    tag: 'pages',
    method: 'GET',
    path: '/utilityPages/search',
    description: 'Search utility pages (signed-in user only). Scope: manageUtilityPages',
    pathParams: [],
    hasBody: false,
    sdkLinks: {
      request: 'iSearchUtilityPagesPayload',
      response: 'iSearchUtilityPagesSuccessResponse',
      function: 'BitBadgesAPI.searchUtilityPages',
    },
  },
  {
    name: 'create-utility-page',
    tag: 'pages',
    method: 'POST',
    path: '/utilityPages',
    description: 'Create a utility page. Scope: manageUtilityPages',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iCreateUtilityPagePayload',
      response: 'iCreateUtilityPageSuccessResponse',
      function: 'BitBadgesAPI.createUtilityPage',
    },
  },
  {
    name: 'update-utility-page',
    tag: 'pages',
    method: 'PUT',
    path: '/utilityPages',
    description: 'Update a utility page. Scope: manageUtilityPages',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iUpdateUtilityPagePayload',
      response: 'iUpdateUtilityPageSuccessResponse',
      function: 'BitBadgesAPI.updateUtilityPage',
    },
  },
  {
    name: 'delete-utility-page',
    tag: 'pages',
    method: 'DELETE',
    path: '/utilityPages',
    description: 'Delete a utility page. Scope: manageUtilityPages',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iDeleteUtilityPagePayload',
      response: 'iDeleteUtilityPageSuccessResponse',
      function: 'BitBadgesAPI.deleteUtilityPage',
    },
  },

  // =========================================================================
  // Maps and Protocols
  // =========================================================================
  {
    name: 'get-map',
    tag: 'maps',
    method: 'GET',
    path: '/maps/{mapId}',
    description: 'Get a map by ID. Maps are on-chain key-value stores.',
    pathParams: ['mapId'],
    hasBody: false,
    sdkLinks: {
      request: 'iGetMapPayload',
      response: 'iGetMapSuccessResponse',
      function: 'BitBadgesAPI.getMap',
    },
  },
  {
    name: 'get-maps',
    tag: 'maps',
    method: 'POST',
    path: '/maps',
    description: 'Get maps (batch)',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iGetMapsPayload',
      response: 'iGetMapsSuccessResponse',
      function: 'BitBadgesAPI.getMaps',
    },
  },
  {
    name: 'get-map-values',
    tag: 'maps',
    method: 'POST',
    path: '/mapValues',
    description: 'Get map values (batch)',
    pathParams: [],
    hasBody: true,
    sdkLinks: {
      request: 'iGetMapValuesPayload',
      response: 'iGetMapValuesSuccessResponse',
      function: 'BitBadgesAPI.getMapValues',
    },
  },
  {
    name: 'get-map-value',
    tag: 'maps',
    method: 'GET',
    path: '/mapValue/{mapId}/{key}',
    description: 'Get a single map value by map ID and key',
    pathParams: ['mapId', 'key'],
    hasBody: false,
    sdkLinks: {
      request: 'iGetMapValuePayload',
      response: 'iGetMapValueSuccessResponse',
      function: 'BitBadgesAPI.getMapValue',
    },
  },

  // =========================================================================
  // Miscellaneous
  // =========================================================================
  {
    name: 'get-status',
    tag: 'misc',
    method: 'GET',
    path: '/status',
    description: 'Get blockchain/indexer status (gas, block height, etc.)',
    pathParams: [],
    hasBody: false,
    example: `const res = await BitBadgesApi.getStatus();`,
    sdkLinks: {
      request: 'iGetStatusPayload',
      response: 'iGetStatusSuccessResponse',
      function: 'BitBadgesAPI.getStatus',
    },
    requestSchema: `{
  withOutOfSyncCheck?: boolean;
  chain?: string;
}`,
    responseSchema: `{
  status: iStatusDoc;    // Indexer/blockchain status details
  outOfSync?: boolean;   // True if indexer is behind the chain
  prices?: object;       // Asset prices
}`,
  },

  // =========================================================================
  // On-Chain Dynamic Stores
  // =========================================================================
  {
    name: 'get-on-chain-dynamic-store',
    tag: 'onchain-stores',
    method: 'GET',
    path: '/onChainDynamicStore/{storeId}',
    description: 'Get an on-chain dynamic store by ID (stored on blockchain)',
    pathParams: ['storeId'],
    hasBody: false,
  },
  {
    name: 'get-on-chain-dynamic-stores-by-creator',
    tag: 'onchain-stores',
    method: 'GET',
    path: '/onChainDynamicStores/by-creator/{address}',
    description: 'Get on-chain dynamic stores by creator address',
    pathParams: ['address'],
    hasBody: false,
  },
  {
    name: 'get-on-chain-dynamic-store-value',
    tag: 'onchain-stores',
    method: 'GET',
    path: '/onChainDynamicStore/{storeId}/value/{address}',
    description: 'Get value for an address in an on-chain dynamic store',
    pathParams: ['storeId', 'address'],
    hasBody: false,
  },
  {
    name: 'get-on-chain-dynamic-store-values',
    tag: 'onchain-stores',
    method: 'GET',
    path: '/onChainDynamicStore/{storeId}/values',
    description: 'Get paginated values from an on-chain dynamic store',
    pathParams: ['storeId'],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
  },

  // =========================================================================
  // Assets / DEX
  // =========================================================================
  {
    name: 'get-all-pools',
    tag: 'assets',
    method: 'GET',
    path: '/api/{version}/pools',
    description: 'Get all liquidity pools',
    pathParams: ['version'],
    hasBody: false,
    sdkLinks: {
      request: 'iGetAllPoolsPayload',
      response: 'iGetAllPoolsSuccessResponse',
    },
  },
  {
    name: 'get-pool-infos-by-denom',
    tag: 'assets',
    method: 'GET',
    path: '/api/{version}/pools/byDenom',
    description: 'Get pool infos filtered by denomination',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-pool-infos-by-assets',
    tag: 'assets',
    method: 'GET',
    path: '/api/{version}/pools/byAssets',
    description: 'Get pool infos filtered by assets',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-pool-info-by-id',
    tag: 'assets',
    method: 'GET',
    path: '/api/{version}/pools/{poolId}',
    description: 'Get pool info by pool ID',
    pathParams: ['version', 'poolId'],
    hasBody: false,
  },
  {
    name: 'estimate-swap',
    tag: 'assets',
    method: 'POST',
    path: '/api/{version}/swaps/estimate',
    description: 'Estimate the output amount for a swap',
    pathParams: ['version'],
    hasBody: true,
  },
  {
    name: 'get-asset-pairs',
    tag: 'assets',
    method: 'GET',
    path: '/api/{version}/assetPairs',
    description: 'Get all asset pairs',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-top-gainers',
    tag: 'assets',
    method: 'GET',
    path: '/api/{version}/assetPairs/topGainers',
    description: 'Get asset pairs with highest price gains',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-top-losers',
    tag: 'assets',
    method: 'GET',
    path: '/api/{version}/assetPairs/topLosers',
    description: 'Get asset pairs with highest price losses',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-highest-volume',
    tag: 'assets',
    method: 'GET',
    path: '/api/{version}/assetPairs/highestVolume',
    description: 'Get asset pairs with highest trading volume',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-by-price',
    tag: 'assets',
    method: 'GET',
    path: '/api/{version}/assetPairs/priceSorted',
    description: 'Get asset pairs sorted by price',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-weekly-top-gainers',
    tag: 'assets',
    method: 'GET',
    path: '/api/{version}/assetPairs/weeklyTopGainers',
    description: 'Get asset pairs with highest weekly gains',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-weekly-top-losers',
    tag: 'assets',
    method: 'GET',
    path: '/api/{version}/assetPairs/weeklyTopLosers',
    description: 'Get asset pairs with highest weekly losses',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'search-asset-pairs',
    tag: 'assets',
    method: 'GET',
    path: '/api/{version}/assetPairs/search',
    description: 'Search asset pairs by text',
    pathParams: ['version'],
    hasBody: false,
  },
  {
    name: 'get-by-denoms',
    tag: 'assets',
    method: 'POST',
    path: '/api/{version}/assetPairs/byDenoms',
    description: 'Get asset pairs filtered by denominations',
    pathParams: ['version'],
    hasBody: true,
  },
  {
    name: 'get-swap-activities',
    tag: 'assets',
    method: 'GET',
    path: '/swapActivities',
    description: 'Get swap activities (paginated)',
    pathParams: [],
    hasBody: false,
    queryParams: [
      { name: 'bookmark', description: 'Pagination bookmark', required: false },
    ],
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
// Help text builder
// ---------------------------------------------------------------------------

const SDK_DOCS_BASE = 'https://bitbadges.github.io/bitbadgesjs';

function buildAfterHelpText(route: ApiRoute): string {
  const lines: string[] = [];

  // SDK type information
  if (route.sdkLinks) {
    lines.push('');
    lines.push('SDK Types:');
    if (route.sdkLinks.request) {
      lines.push(`  Request:  ${route.sdkLinks.request}`);
      lines.push(`            ${SDK_DOCS_BASE}/interfaces/${route.sdkLinks.request}`);
    }
    if (route.sdkLinks.response) {
      lines.push(`  Response: ${route.sdkLinks.response}`);
      lines.push(`            ${SDK_DOCS_BASE}/interfaces/${route.sdkLinks.response}`);
    }
    if (route.sdkLinks.function) {
      lines.push(`  Function: ${route.sdkLinks.function}`);
    }
  }

  // Inline TypeScript interface schemas
  if (route.requestSchema && route.sdkLinks?.request) {
    lines.push('');
    lines.push(`Request Type (${route.sdkLinks.request}):`);
    for (const schemaLine of route.requestSchema.split('\n')) {
      lines.push(`  ${schemaLine}`);
    }
  }
  if (route.responseSchema && route.sdkLinks?.response) {
    lines.push('');
    lines.push(`Response Type (${route.sdkLinks.response}):`);
    for (const schemaLine of route.responseSchema.split('\n')) {
      lines.push(`  ${schemaLine}`);
    }
  }

  // Query parameters
  if (route.queryParams && route.queryParams.length > 0) {
    lines.push('');
    lines.push('Query Parameters (pass via --query \'{"key":"value"}\'):');
    for (const qp of route.queryParams) {
      const req = qp.required ? ' (required)' : '';
      lines.push(`  ${qp.name}${req} - ${qp.description}`);
    }
  }

  // Body fields
  if (route.bodyFields && route.bodyFields.length > 0) {
    lines.push('');
    lines.push('Body Fields (pass via --body):');
    for (const bf of route.bodyFields) {
      const req = bf.required ? ' (required)' : '';
      lines.push(`  ${bf.name}: ${bf.type}${req}`);
      lines.push(`    ${bf.description}`);
    }
  }

  // Example
  if (route.example) {
    lines.push('');
    lines.push('SDK Example:');
    lines.push(`  ${route.example}`);
  }

  return lines.length > 0 ? lines.join('\n') : '';
}

// ---------------------------------------------------------------------------
// Tag definitions
// ---------------------------------------------------------------------------

const TAG_DESCRIPTIONS: Record<string, string> = {
  accounts: 'Account and user routes',
  tokens: 'Collection and token routes',
  claims: 'Claim management routes',
  auth: 'Sign In with BitBadges / OAuth routes',
  tx: 'Transaction broadcast and simulation',
  apps: 'Developer apps and applications',
  plugins: 'Plugin management routes',
  stores: 'Dynamic data store routes',
  'onchain-stores': 'On-chain dynamic store routes',
  pages: 'Utility page routes',
  maps: 'On-chain map and protocol routes',
  assets: 'DEX, pools, and asset pair routes',
  misc: 'Miscellaneous routes',
};

// ---------------------------------------------------------------------------
// Command builder
// ---------------------------------------------------------------------------

function buildRouteCommand(route: ApiRoute): Command {
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

  // Append rich documentation from the OpenAPI spec
  const afterHelp = buildAfterHelpText(route);
  if (afterHelp) {
    cmd.addHelpText('after', afterHelp);
  }

  cmd.action(async (...args: any[]) => {
    // Commander passes positional args first, then the options object, then the command
    const opts = args[route.pathParams.length];

    try {
      const network: 'mainnet' | 'testnet' | 'local' | undefined = opts.testnet
        ? 'testnet'
        : opts.local
          ? 'local'
          : undefined;
      const apiKey = resolveApiKey(opts.apiKey, network);
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

      // For GET routes, convert --body to exploded query params (OpenAPI explode: true)
      // GET routes use ?key1=value1&key2=value2 instead of a JSON body
      if (route.method === 'GET' && body !== undefined && typeof body === 'object') {
        const searchParams = new URLSearchParams();
        // First add any existing --query params
        if (opts.query) {
          const queryObj = JSON.parse(opts.query);
          for (const [k, v] of Object.entries(queryObj)) {
            searchParams.set(k, String(v));
          }
        }
        // Then explode the body fields as query params
        for (const [k, v] of Object.entries(body)) {
          if (v !== undefined && v !== null) {
            // For objects/arrays, JSON-encode them
            searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
          }
        }
        const qs = searchParams.toString();
        if (qs) {
          resolvedPath += (resolvedPath.includes('?') ? '&' : '?') + qs;
        }
        body = undefined; // Don't send body on GET
      }

      // Warn when a POST/PUT/DELETE route is called without --body
      if (route.hasBody && body === undefined && route.method !== 'GET' && !opts.dryRun) {
        const typeHint = route.sdkLinks?.request
          ? ` (see ${route.sdkLinks.request} for fields)`
          : '';
        process.stderr.write(
          `Warning: ${route.method} ${route.path} expects a request body but none was provided.${typeHint}\n` +
          `  Use --body '{}' to send an empty body, or --body @file.json to load from file.\n`
        );
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

  return cmd;
}

export function createApiCommand(): Command {
  const api = new Command('api').description(
    `BitBadges Indexer API client (${ROUTES.length} routes). Call any API endpoint from the CLI.\n\nRoutes are grouped by category. Use "api all <command>" for a flat list.`
  );

  // Create tag-based group commands
  const groups: Record<string, Command> = {};
  for (const [tag, desc] of Object.entries(TAG_DESCRIPTIONS)) {
    const tagRoutes = ROUTES.filter((r) => r.tag === tag);
    if (tagRoutes.length === 0) continue;
    groups[tag] = new Command(tag).description(`${desc} (${tagRoutes.length} routes)`);
    api.addCommand(groups[tag]);
  }

  // Create "all" group with every route (flat, backward compat)
  const allCmd = new Command('all').description(`All API routes ungrouped (${ROUTES.length} routes)`);
  api.addCommand(allCmd);

  // Register each route in its tag group AND in "all"
  for (const route of ROUTES) {
    if (groups[route.tag]) {
      groups[route.tag].addCommand(buildRouteCommand(route));
    }
    allCmd.addCommand(buildRouteCommand(route));
  }

  return api;
}
