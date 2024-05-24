import type { NumberType } from '@/common/string-numbers';
import { NativeAddress } from '../docs';

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
  static GetSearchRoute = (searchValue: string) => `/api/v0/search/${searchValue}`;
  static GetCollectionsRoute = () => '/api/v0/collection/batch';
  static GetOwnersForBadgeRoute = (collectionId: NumberType, badgeId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/owners`;
  static GetBadgeBalanceByAddressRoute = (collectionId: NumberType, cosmosAddress: string) =>
    `/api/v0/collection/${collectionId.toString()}/balance/${cosmosAddress}`;
  static GetBadgeActivityRoute = (collectionId: NumberType, badgeId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/activity`;
  static RefreshMetadataRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refresh`;
  static GetRefreshStatusRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refreshStatus`;

  static CompleteClaimRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/complete/${claimId.toString()}/${address}`;
  static SimulateClaimRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/simulate/${claimId.toString()}/${address}`;
  static GetReservedClaimCodesRoute = (claimId: string, address: NativeAddress) => `/api/v0/claims/reserved/${claimId.toString()}/${address}`;
  static GetClaimAttemptStatusRoute = (claimAttemptId: string) => `/api/v0/claims/status/${claimAttemptId.toString()}`;

  static GetClaimsRoute = () => `/api/v0/claims`;
  static CreateClaimRoute = () => `/api/v0/claims/create`;
  static UpdateClaimRoute = () => `/api/v0/claims/update`;
  static DeleteClaimRoute = () => `/api/v0/claims/delete`;

  static AddReviewRoute = () => '/api/v0/reviews/add';
  static DeleteReviewRoute = (reviewId: string) => `/api/v0/reviews/delete/${reviewId}`;

  static FilterBadgesInCollectionRoute = () => '/api/v0/collections/filter';

  static GetAddressListsRoute = () => '/api/v0/addressLists';
  static CreateAddressListRoute = () => '/api/v0/addressLists/create';
  static UpdateAddressListRoute = () => '/api/v0/addressLists/update';
  static DeleteAddressListRoute = () => '/api/v0/addressLists/delete';
  static GetAccountsRoute = () => '/api/v0/user/batch';

  static UpdateAccountInfoRoute = () => '/api/v0/user/updateAccount';
  static AddToIpfsRoute = () => '/api/v0/addToIpfs';
  static AddApprovalDetailsToOffChainStorageRoute = () => '/api/v0/addApprovalDetailsToOffChainStorage';
  static AddBalancesToOffChainStorageRoute = () => '/api/v0/addBalancesToOffChainStorage';
  static GetSignInChallengeRoute = () => '/api/v0/auth/getChallenge';
  static VerifySignInRoute = () => '/api/v0/auth/verify';
  static SignOutRoute = () => '/api/v0/auth/logout';
  static CheckIfSignedInRoute = () => '/api/v0/auth/status';

  static GenericVerifyRoute = () => '/api/v0/auth/genericVerify';
  static GenericVerifyAssetsRoute = () => '/api/v0/auth/genericVerifyAssets';
  static GetBrowseCollectionsRoute = () => '/api/v0/browse';
  static BroadcastTxRoute = () => '/api/v0/broadcast';
  static SimulateTxRoute = () => '/api/v0/simulate';
  static FetchMetadataDirectlyRoute = () => '/api/v0/metadata';
  static GetTokensFromFaucetRoute = () => '/api/v0/faucet';

  static SendClaimAlertRoute = () => '/api/v0/claimAlerts/send';
  static GetClaimAlertsRoute = () => '/api/v0/claimAlerts';

  static GetAndVerifySIWBBRequestRoute = () => '/api/v0/siwbbRequest';
  static CreateSIWBBRequestRoute = () => '/api/v0/siwbbRequest/create';
  static DeleteSIWBBRequestRoute = () => '/api/v0/siwbbRequest/delete';

  static GetSIWBBRequestsForDeveloperAppRoute = () => '/api/v0/siwbbRequest';

  static GetFollowDetailsRoute = () => '/api/v0/follow-protocol';

  static GenerateAppleWalletPassRoute = () => '/api/v0/appleWalletPass';

  static GetSecretRoute = () => '/api/v0/secret';
  static CreateSecretRoute = () => '/api/v0/secret/create';
  static DeleteSecretRoute = () => '/api/v0/secret/delete';
  static UpdateSecretRoute = () => '/api/v0/secret/update';

  static GetDeveloperAppRoute = () => '/api/v0/developerApp';
  static CreateDeveloperAppRoute = () => '/api/v0/developerApp/create';
  static DeleteDeveloperAppRoute = () => '/api/v0/developerApp/delete';
  static UpdateDeveloperAppRoute = () => '/api/v0/developerApp/update';

  static GetPluginRoute = () => '/api/v0/plugins';
  static CreatePluginRoute = () => '/api/v0/plugins/create';
  static DeletePluginRoute = () => '/api/v0/plugins/delete';
  static UpdatePluginRoute = () => '/api/v0/plugins/update';

  static GetMapsRoute = () => '/api/v0/maps';

  static GetActiveAuthorizationsRoute = () => '/api/v0/authorizations';
  static OauthAuthorizeRoute = () => '/api/v0/oauth/authorize';
  static OauthTokenRoute = () => '/api/v0/oauth/token';
  static OauthRevokeRoute = () => '/api/v0/oauth/token/revoke';
}
