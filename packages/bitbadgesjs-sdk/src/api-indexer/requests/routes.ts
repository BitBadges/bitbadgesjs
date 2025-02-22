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
  static GetBadgeActivityRoute = (collectionId: NumberType, badgeId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/activity`;
  static RefreshMetadataRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refresh`;
  static GetRefreshStatusRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refreshStatus`;
  static FilterBadgesInCollectionRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/filter`;
  static FilterSuggestionsRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/filterSuggestions`;

  static GenericVerifyAssetsRoute = () => '/api/v0/verifyOwnershipRequirements';

  static CompleteClaimRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/complete/${claimId.toString()}/${address}`;
  static SimulateClaimRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/simulate/${claimId.toString()}/${address}`;
  static GetReservedClaimCodesRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/reserved/${claimId.toString()}/${address}`;
  static GetClaimAttemptStatusRoute = (claimAttemptId: string) => `/api/v0/claims/status/${claimAttemptId.toString()}`;
  static GetClaimAttemptsRoute = (claimId: string) => `/api/v0/claims/${claimId.toString()}/attempts`;
  static GetGatedContentForClaimRoute = (claimId: string) => `/api/v0/claims/gatedContent/${claimId.toString()}`;

  static GetPluginErrorsRoute = () => `/api/v0/plugins/errors`;

  static GetClaimsRoute = () => '/api/v0/claims/fetch';
  static CRUDClaimsRoute = () => `/api/v0/claims`;

  static AddReviewRoute = () => '/api/v0/reviews/add';
  static DeleteReviewRoute = (reviewId: string) => `/api/v0/reviews/delete/${reviewId}`;

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
  static GetClaimAlertsRoute = () => '/api/v0/claimAlerts';

  static ExchangeSIWBBAuthorizationCodesRoute = () => '/api/v0/siwbb/token';
  static CRUDSIWBBRequestRoute = () => '/api/v0/siwbbRequest';
  static RotateSIWBBRequestRoute = () => '/api/v0/siwbbRequest/rotate';
  static GenericVerifyRoute = () => '/api/v0/siwbbRequest/verify';

  static GenerateAppleWalletPassRoute = () => '/api/v0/siwbbRequest/appleWalletPass';
  static GenerateGoogleWalletPassRoute = () => '/api/v0/siwbbRequest/googleWalletPass';

  static GetAttestationsRoute = () => '/api/v0/attestation/fetch';
  static CRUDAttestationRoute = () => '/api/v0/attestation';

  static GetDeveloperAppsRoute = () => '/api/v0/developerApp/fetch';
  static CRUDDeveloperAppRoute = () => '/api/v0/developerApp';
  static GetSIWBBRequestsForDeveloperAppRoute = () => '/api/v0/developerApp/siwbbRequests';

  static GetPluginRoute = () => '/api/v0/plugins/fetch';
  static CRUDPluginRoute = () => '/api/v0/plugins';

  static GetMapsRoute = () => '/api/v0/maps';
  static GetMapValuesRoute = () => '/api/v0/mapValues';

  static GetActiveAuthorizationsRoute = () => '/api/v0/oauth/authorizations';
  static OauthRevokeRoute = () => '/api/v0/siwbb/token/revoke';

  static CreatePaymentIntentRoute = () => '/api/v0/stripe/createPaymentIntent';

  static VerifyAttestationRoute = () => '/api/v0/attestation/verify';

  static GetCodesFromSeedHelperRoute = () => '/api/v0/codes';

  static GetDynamicDataBinsRoute = () => '/api/v0/bins/fetch';
  static CRUDDynamicDataRoute = () => '/api/v0/bins';
  static GetDynamicDataActivityRoute = () => `/api/v0/bins/activity`;

  static PerformBinActionSingleRoute = (actionName: string, binId: string, binSecret: string) =>
    `/api/v0/bin-actions/${actionName}/${binId}/${binSecret}`;
  static PerformBinActionBatchRoute = (binId: string, binSecret: string) => `/api/v0/bin-actions/batch/${binId}/${binSecret}`;

  static PerformBinActionSingleWithBodyAuthRoute = () => `/api/v0/bin-actions/single`;
  static PerformBinActionBatchWithBodyAuthRoute = () => `/api/v0/bin-actions/batch`;

  static GetGroupsRoute = () => '/api/v0/groups/fetch';
  static CRUDGroupsRoute = () => '/api/v0/groups';
  static CalculatePointsRoute = () => '/api/v0/groups/points';
  static GetPointsActivityRoute = () => '/api/v0/groups/points/activity';

  static GetUtilityListingsRoute = () => '/api/v0/utilityListings/fetch';
  static CRUDUtilityListingsRoute = () => '/api/v0/utilityListings';

  static GetEmbeddedWalletRoute = () => '/api/v0/embeddedWallets';
  static SignWithEmbeddedWalletRoute = () => '/api/v0/embeddedWallets/signMessage';

  static ScheduleTokenRefreshRoute = () => '/api/v0/oauth-token-refresh-schedule';

  static CheckClaimSuccessRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/success/${claimId}/${address}`;
}
