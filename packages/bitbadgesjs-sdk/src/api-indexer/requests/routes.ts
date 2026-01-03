import type { NumberType } from '@/common/string-numbers.js';
import type { NativeAddress } from '../docs-types/index.js';
import { CollectionId } from '@/interfaces/index.js';

/**
 * Exports static methods that return the routes for the BitBadges API. Append this to the base URL of the API to get the full URL.
 *
 * @example
 * ```ts
 * import { BitBadgesApiRoutes } from 'bitbadgesjs-sdk'
 * const url = `https://api.bitbadges.io${BitBadgesApiRoutes.GetStatusRoute()}`
 * ```
 *
 * @category API
 */
export class BitBadgesApiRoutes {
  static GetStatusRoute = () => '/api/v0/status';
  static SearchRoute = (searchValue: string) => `/api/v0/search/${searchValue}`;
  static GetCollectionsRoute = () => '/api/v0/collections';

  static GetOwnersRoute = (collectionId: CollectionId, tokenId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${tokenId.toString()}/owners`;
  static GetBalanceByAddressRoute = (collectionId: CollectionId, bitbadgesAddress: string) =>
    `/api/v0/collection/${collectionId.toString()}/balance/${bitbadgesAddress}`;
  static GetBalanceByAddressSpecificTokenRoute = (collectionId: CollectionId, bitbadgesAddress: string, tokenId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${tokenId.toString()}/balance/${bitbadgesAddress}`;
  static GetTokenActivityRoute = (collectionId: CollectionId, tokenId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${tokenId.toString()}/activity`;
  static RefreshMetadataRoute = (collectionId: CollectionId) => `/api/v0/collection/${collectionId.toString()}/refresh`;
  static GetRefreshStatusRoute = (collectionId: CollectionId) => `/api/v0/collection/${collectionId.toString()}/refreshStatus`;
  static FilterTokensInCollectionRoute = (collectionId: CollectionId) => `/api/v0/collection/${collectionId.toString()}/filter`;
  static FilterSuggestionsRoute = (collectionId: CollectionId) => `/api/v0/collection/${collectionId.toString()}/filterSuggestions`;

  static CompleteClaimRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/complete/${claimId.toString()}/${address}`;
  static SimulateClaimRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/simulate/${claimId.toString()}/${address}`;
  static GetReservedClaimCodesRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/reserved/${claimId.toString()}/${address}`;
  static GetClaimAttemptStatusRoute = (claimAttemptId: string) => `/api/v0/claims/status/${claimAttemptId.toString()}`;
  static GetClaimAttemptsRoute = (claimId: string) => `/api/v0/claims/${claimId.toString()}/attempts`;
  static GetGatedContentForClaimRoute = (claimId: string) => `/api/v0/claims/gatedContent/${claimId.toString()}`;

  static GetPluginErrorsRoute = () => `/api/v0/plugins/errors`;
  static GenericVerifyAssetsRoute = () => '/api/v0/verifyOwnershipRequirements';

  static GetClaimRoute = (claimId: string) => `/api/v0/claim/${claimId.toString()}`;
  static GetClaimsRoute = () => '/api/v1/claims/fetch';
  static SearchClaimsRoute = () => '/api/v0/claims/search';
  static CRUDClaimsRoute = () => `/api/v0/claims`;

  static GetAccountsRoute = () => '/api/v0/users';
  static GetAccountRoute = () => '/api/v0/user';
  static UpdateAccountInfoRoute = () => '/api/v0/user/updateAccount';

  static GetApiKeysRoute = () => '/api/v0/apiKeys/fetch';
  static CRUDApiKeysRoute = () => '/api/v0/apiKeys';
  static RotateApiKeyRoute = () => '/api/v0/apiKeys/rotate';
  static AddToIpfsRoute = () => '/api/v0/addToIpfs';
  static AddApprovalDetailsToOffChainStorageRoute = () => '/api/v0/addApprovalDetailsToOffChainStorage';

  static GetAttemptDataFromRequestBinRoute = (claimId: string, claimAttemptId: string) =>
    `/api/v0/requestBin/attemptData/${claimId.toString()}/${claimAttemptId.toString()}`;

  static GetSignInChallengeRoute = () => '/api/v0/auth/getChallenge';
  static VerifySignInRoute = () => '/api/v0/auth/verify';
  static SignOutRoute = () => '/api/v0/auth/logout';
  static CheckIfSignedInRoute = () => '/api/v0/auth/status';

  static GetBrowseRoute = () => '/api/v0/browse';

  static BroadcastTxRoute = () => '/api/v0/broadcast';
  static SimulateTxRoute = () => '/api/v0/simulate';
  static FetchMetadataDirectlyRoute = () => '/api/v0/metadata';
  static GetTokensFromFaucetRoute = () => '/api/v0/faucet';

  static ExchangeSIWBBAuthorizationCodesRoute = () => '/api/v0/siwbb/token';
  static CRUDSIWBBRequestRoute = () => '/api/v0/siwbbRequest';
  static RotateSIWBBRequestRoute = () => '/api/v0/siwbbRequest/rotate';
  static GenericVerifyRoute = () => '/api/v0/siwbbRequest/verify';

  static GetDeveloperAppRoute = (developerAppId: string) => `/api/v0/developerApp/${developerAppId.toString()}`;
  static GetDeveloperAppsRoute = () => '/api/v0/developerApps/fetch';
  static SearchDeveloperAppsRoute = () => '/api/v0/developerApps/search';
  static CRUDDeveloperAppRoute = () => '/api/v0/developerApps';
  static GetSIWBBRequestsForDeveloperAppRoute = () => '/api/v0/developerApps/siwbbRequests';

  static GetPluginRoute = (pluginId: string) => `/api/v0/plugins/${pluginId.toString()}`;
  static GetPluginsRoute = () => '/api/v0/plugins/fetch';
  static SearchPluginsRoute = () => '/api/v0/plugins/search';
  static CRUDPluginRoute = () => '/api/v0/plugins';

  static GetMapsRoute = () => '/api/v0/maps';
  static GetMapValuesRoute = () => '/api/v0/mapValues';
  static GetMapRoute = (mapId: string) => `/api/v0/map/${mapId.toString()}`;
  static GetMapValueRoute = (mapId: string, key: string) => `/api/v0/mapValue/${mapId.toString()}/${key.toString()}`;

  static GetActiveAuthorizationsRoute = () => '/api/v0/oauth/authorizations';
  static OauthRevokeRoute = () => '/api/v0/siwbb/token/revoke';

  static CreatePaymentIntentRoute = () => '/api/v0/stripe/createPaymentIntent';

  static GetConnectedAccountsRoute = () => '/api/v0/stripe/connected-accounts';
  static DeleteConnectedAccountRoute = (accountId: string) => `/api/v0/stripe/connected-accounts/${accountId}`;

  static GetCodesFromSeedHelperRoute = () => '/api/v0/codes';

  static GetDynamicDataStoreRoute = (dynamicStoreId: string) => `/api/v0/dynamicStore/${dynamicStoreId.toString()}`;
  static GetDynamicDataStoreValueRoute = (dynamicStoreId: string) => `/api/v0/dynamicStore/${dynamicStoreId.toString()}/value`;
  static GetDynamicDataStoreValuesPaginatedRoute = (dynamicStoreId: string) => `/api/v0/dynamicStore/${dynamicStoreId.toString()}/values`;

  static GetDynamicDataStoresRoute = () => '/api/v0/dynamicStores/fetch';
  static SearchDynamicDataStoresRoute = () => '/api/v0/dynamicStores/search';
  static CRUDDynamicDataStoreRoute = () => '/api/v0/dynamicStores';
  static GetDynamicDataStoreActivityRoute = () => `/api/v0/dynamicStores/activity`;

  static PerformStoreActionSingleWithBodyAuthRoute = () => `/api/v0/storeActions/single`;
  static PerformStoreActionBatchWithBodyAuthRoute = () => `/api/v0/storeActions/batch`;

  static GetApplicationRoute = (applicationId: string) => `/api/v0/application/${applicationId.toString()}`;
  static GetApplicationsRoute = () => '/api/v0/applications/fetch';
  static SearchApplicationsRoute = () => '/api/v0/applications/search';
  static CRUDApplicationsRoute = () => '/api/v0/applications';
  static CalculatePointsRoute = () => '/api/v0/applications/points';
  static GetPointsActivityRoute = () => '/api/v0/applications/points/activity';

  static GetUtilityPageRoute = (utilityPageId: string) => `/api/v0/utilityPage/${utilityPageId.toString()}`;
  static GetUtilityPagesRoute = () => '/api/v0/utilityPages/fetch';
  static SearchUtilityPagesRoute = () => '/api/v0/utilityPages/search';
  static CRUDUtilityPagesRoute = () => '/api/v0/utilityPages';

  static ScheduleTokenRefreshRoute = () => '/api/v0/oauth-token-refresh-schedule';

  static CheckClaimSuccessRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/success/${claimId}/${address}`;

  static GetSiwbbRequestsForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/requests/siwbb`;
  static GetTransferActivityForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/activity/badges`;
  static GetTokensByTypeForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/badges`;

  static GetClaimActivityByTypeForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/activity/claims`;
  static GetPointsActivityForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/activity/points`;

  static GetCollectionOwnersRoute = (collectionId: CollectionId) => `/api/v0/collection/${collectionId.toString()}/owners`;
  static GetCollectionRoute = (collectionId: CollectionId) => `/api/v0/collection/${collectionId.toString()}`;
  static GetTokenMetadataRoute = (collectionId: CollectionId, tokenId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${tokenId.toString()}/metadata`;
  static GetCollectionClaimsRoute = (collectionId: CollectionId) => `/api/v0/collection/${collectionId.toString()}/claims`;

  static GetCollectionTransferActivityRoute = (collectionId: CollectionId) => `/api/v0/collection/${collectionId.toString()}/activity`;
  static GetCollectionChallengeTrackersRoute = (collectionId: CollectionId) => `/api/v0/collection/${collectionId.toString()}/challengeTrackers`;
  static GetCollectionAmountTrackersRoute = (collectionId: CollectionId) => `/api/v0/collection/${collectionId.toString()}/amountTrackers`;
  static GetCollectionListingsRoute = (collectionId: CollectionId) => `/api/v0/collection/${collectionId.toString()}/listings`;

  static GetCollectionAmountTrackerByIdRoute = () => `/api/v0/collection/amountTracker`;
  static GetCollectionChallengeTrackerByIdRoute = () => `/api/v0/collection/challengeTracker`;

  static GetSwapActivitiesRoute = () => '/api/v0/swapActivities';
  static GetOnChainDynamicStoreRoute = (storeId: string) => `/api/v0/onChainDynamicStore/${storeId.toString()}`;
  static GetOnChainDynamicStoresByCreatorRoute = (address: NativeAddress) => `/api/v0/onChainDynamicStores/by-creator/${address}`;
  static GetOnChainDynamicStoreValueRoute = (storeId: string, address: NativeAddress) =>
    `/api/v0/onChainDynamicStore/${storeId.toString()}/value/${address}`;
  static GetOnChainDynamicStoreValuesPaginatedRoute = (storeId: string) => `/api/v0/onChainDynamicStore/${storeId.toString()}/values`;
}
