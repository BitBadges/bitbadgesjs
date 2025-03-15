import type { NumberType } from '@/common/string-numbers.js';
import type { NativeAddress } from '../docs/index.js';

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

  static GetOwnersForBadgeRoute = (collectionId: NumberType, badgeId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/owners`;
  static GetBadgeBalanceByAddressRoute = (collectionId: NumberType, bitbadgesAddress: string) =>
    `/api/v0/collection/${collectionId.toString()}/balance/${bitbadgesAddress}`;
  static GetBadgeBalanceByAddressSpecificBadgeRoute = (collectionId: NumberType, bitbadgesAddress: string, badgeId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/balance/${bitbadgesAddress}`;
  static GetBadgeActivityRoute = (collectionId: NumberType, badgeId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/activity`;
  static RefreshMetadataRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refresh`;
  static GetRefreshStatusRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refreshStatus`;
  static FilterBadgesInCollectionRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/filter`;
  static FilterSuggestionsRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/filterSuggestions`;

  static CompleteClaimRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/complete/${claimId.toString()}/${address}`;
  static SimulateClaimRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/simulate/${claimId.toString()}/${address}`;
  static GetReservedClaimCodesRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/reserved/${claimId.toString()}/${address}`;
  static GetClaimAttemptStatusRoute = (claimAttemptId: string) => `/api/v0/claims/status/${claimAttemptId.toString()}`;
  static GetClaimAttemptsRoute = (claimId: string) => `/api/v0/claims/${claimId.toString()}/attempts`;
  static GetGatedContentForClaimRoute = (claimId: string) => `/api/v0/claims/gatedContent/${claimId.toString()}`;

  static GetPluginErrorsRoute = () => `/api/v0/plugins/errors`;

  static GetClaimsRoute = () => '/api/v1/claims/fetch';
  static SearchClaimsRoute = () => '/api/v0/claims/search';
  static CRUDClaimsRoute = () => `/api/v0/claims`;

  static GetAddressListsRoute = () => '/api/v0/addressLists/fetch';
  static CRUDAddressListsRoute = () => '/api/v0/addressLists';

  static GetAccountsRoute = () => '/api/v0/users';
  static UpdateAccountInfoRoute = () => '/api/v0/user/updateAccount';

  static GetApiKeysRoute = () => '/api/v0/apiKeys/fetch';
  static CRUDApiKeysRoute = () => '/api/v0/apiKeys';
  static RotateApiKeyRoute = () => '/api/v0/apiKeys/rotate';
  static AddToIpfsRoute = () => '/api/v0/addToIpfs';
  static AddApprovalDetailsToOffChainStorageRoute = () => '/api/v0/addApprovalDetailsToOffChainStorage';
  static AddBalancesToOffChainStorageRoute = () => '/api/v0/addBalancesToOffChainStorage';

  static GetSignInChallengeRoute = () => '/api/v0/auth/getChallenge';
  static VerifySignInRoute = () => '/api/v0/auth/verify';
  static SignOutRoute = () => '/api/v0/auth/logout';
  static CheckIfSignedInRoute = () => '/api/v0/auth/status';

  static GetBrowseRoute = () => '/api/v0/browse';

  static BroadcastTxRoute = () => '/api/v0/broadcast';
  static SimulateTxRoute = () => '/api/v0/simulate';
  static FetchMetadataDirectlyRoute = () => '/api/v0/metadata';
  static GetTokensFromFaucetRoute = () => '/api/v0/faucet';

  static SendClaimAlertRoute = () => '/api/v0/claimAlerts/send';

  static ExchangeSIWBBAuthorizationCodesRoute = () => '/api/v0/siwbb/token';
  static CRUDSIWBBRequestRoute = () => '/api/v0/siwbbRequest';
  static RotateSIWBBRequestRoute = () => '/api/v0/siwbbRequest/rotate';
  static GenericVerifyRoute = () => '/api/v0/siwbbRequest/verify';

  static GenerateAppleWalletPassRoute = () => '/api/v0/siwbbRequest/appleWalletPass';
  static GenerateGoogleWalletPassRoute = () => '/api/v0/siwbbRequest/googleWalletPass';

  static GetAttestationsRoute = () => '/api/v0/attestations/fetch';
  static CRUDAttestationRoute = () => '/api/v0/attestations';

  static GetDeveloperAppsRoute = () => '/api/v0/developerApps/fetch';
  static SearchDeveloperAppsRoute = () => '/api/v0/developerApps/search';
  static CRUDDeveloperAppRoute = () => '/api/v0/developerApps';
  static GetSIWBBRequestsForDeveloperAppRoute = () => '/api/v0/developerApps/siwbbRequests';

  static GetPluginRoute = () => '/api/v0/plugins/fetch';
  static SearchPluginsRoute = () => '/api/v0/plugins/search';
  static CRUDPluginRoute = () => '/api/v0/plugins';

  static GetMapsRoute = () => '/api/v0/maps';
  static GetMapValuesRoute = () => '/api/v0/mapValues';

  static GetActiveAuthorizationsRoute = () => '/api/v0/oauth/authorizations';
  static OauthRevokeRoute = () => '/api/v0/siwbb/token/revoke';

  static CreatePaymentIntentRoute = () => '/api/v0/stripe/createPaymentIntent';

  static GetConnectedAccountsRoute = () => '/api/v0/stripe/connected-accounts';
  static DeleteConnectedAccountRoute = (accountId: string) => `/api/v0/stripe/connected-accounts/${accountId}`;

  static VerifyAttestationRoute = () => '/api/v0/attestations/verify';

  static GetCodesFromSeedHelperRoute = () => '/api/v0/codes';

  static GetDynamicDataStoresRoute = () => '/api/v0/dynamicStores/fetch';
  static SearchDynamicDataStoresRoute = () => '/api/v0/dynamicStores/search';
  static CRUDDynamicDataStoreRoute = () => '/api/v0/dynamicStores';
  static GetDynamicDataStoreActivityRoute = () => `/api/v0/dynamicStores/activity`;

  static PerformStoreActionSingleRoute = (actionName: string, dynamicDataId: string, dynamicDataSecret: string) =>
    `/api/v0/storeActions/${actionName}/${dynamicDataId}/${dynamicDataSecret}`;
  static PerformStoreActionBatchRoute = (dynamicDataId: string, dynamicDataSecret: string) =>
    `/api/v0/storeActions/batch/${dynamicDataId}/${dynamicDataSecret}`;

  static PerformStoreActionSingleWithBodyAuthRoute = () => `/api/v0/storeActions/single`;
  static PerformStoreActionBatchWithBodyAuthRoute = () => `/api/v0/storeActions/batch`;

  static GetApplicationsRoute = () => '/api/v0/applications/fetch';
  static SearchApplicationsRoute = () => '/api/v0/applications/search';
  static CRUDApplicationsRoute = () => '/api/v0/applications';
  static CalculatePointsRoute = () => '/api/v0/applications/points';
  static GetPointsActivityRoute = () => '/api/v0/applications/points/activity';

  static GetUtilityListingsRoute = () => '/api/v0/utilityListings/fetch';
  static SearchUtilityListingsRoute = () => '/api/v0/utilityListings/search';
  static CRUDUtilityListingsRoute = () => '/api/v0/utilityListings';

  static GetEmbeddedWalletRoute = () => '/api/v0/embeddedWallets';
  static SignWithEmbeddedWalletRoute = () => '/api/v0/embeddedWallets/signMessage';

  static ScheduleTokenRefreshRoute = () => '/api/v0/oauth-token-refresh-schedule';

  static CheckClaimSuccessRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/success/${claimId}/${address}`;

  static GetAddressListsForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/lists`;
  static GetSiwbbRequestsForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/requests/siwbb`;
  static GetTransferActivityForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/activity/badges`;
  static GetBadgesByTypeForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/badges`;
  static GetListsActivityForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/activity/lists`;
  static GetAttestationsByTypeForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/attestations`;
  static GetClaimActivityByTypeForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/activity/claims`;
  static GetPointsActivityForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/activity/points`;
  static GetClaimAlertsForUserRoute = (address: NativeAddress) => `/api/v0/account/${address}/claimAlerts`;

  static GetAddressListActivityRoute = (addressListId: string) => `/api/v0/addressLists/${addressListId}/activity`;
  static GetAddressListListingsRoute = (addressListId: string) => `/api/v0/addressLists/${addressListId}/listings`;
  static GetAddressListClaimsRoute = (addressListId: string) => `/api/v0/addressLists/${addressListId}/claims`;

  static GetCollectionOwnersRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/owners`;
  static GetCollectionRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}`;
  static GetBadgeMetadataRoute = (collectionId: NumberType, badgeId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/metadata`;
  static GetCollectionClaimsRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/claims`;

  static GetCollectionTransferActivityRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/activity`;
  static GetCollectionChallengeTrackersRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/challengeTrackers`;
  static GetCollectionAmountTrackersRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/amountTrackers`;
  static GetCollectionListingsRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/listings`;
}
