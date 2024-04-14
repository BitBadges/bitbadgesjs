import type { NumberType } from '@/common/string-numbers';

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
  static GetCollectionBatchRoute = () => '/api/v0/collection/batch';
  static GetOwnersForBadgeRoute = (collectionId: NumberType, badgeId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/owners`;
  static GetBadgeBalanceByAddressRoute = (collectionId: NumberType, cosmosAddress: string) =>
    `/api/v0/collection/${collectionId.toString()}/balance/${cosmosAddress}`;
  static GetBadgeActivityRoute = (collectionId: NumberType, badgeId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/activity`;
  static RefreshMetadataRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refresh`;
  static RefreshBadgeMetadataRoute = (collectionId: NumberType, badgeId: NumberType) =>
    `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/refresh`;
  static GetRefreshStatusRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refreshStatus`;

  static CheckAndCompleteClaimRoute = (claimId: string, cosmosAddress: string) => `/api/v0/claims/${claimId.toString()}/${cosmosAddress}`;
  static GetClaimsRoute = () => `/api/v0/claims`;

  static AddReviewForCollectionRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/addReview`;
  static DeleteReviewRoute = (reviewId: string) => `/api/v0/deleteReview/${reviewId}`;
  static FilterBadgesInCollectionRoute = () => '/api/v0/collections/filter';

  static GetAddressListsRoute = () => '/api/v0/addressLists';
  static CreateAddressListRoute = () => '/api/v0/addressLists/create';
  static UpdateAddressListRoute = () => '/api/v0/addressLists/update';
  static DeleteAddressListRoute = () => '/api/v0/addressLists/delete';
  static GetAccountsRoute = () => '/api/v0/user/batch';

  static AddReviewForUserRoute = (addressOrUsername: string) => `/api/v0/user/${addressOrUsername}/addReview`;
  static UpdateAccountInfoRoute = () => '/api/v0/user/updateAccount';
  static AddMetadataToIpfsRoute = () => '/api/v0/addMetadataToIpfs';
  static AddApprovalDetailsToOffChainStorageRoute = () => '/api/v0/addApprovalDetailsToOffChainStorage';
  static AddBalancesToOffChainStorageRoute = () => '/api/v0/addBalancesToOffChainStorage';
  static GetSignInChallengeRoute = () => '/api/v0/auth/getChallenge';
  static VerifySignInRoute = () => '/api/v0/auth/verify';
  static SignOutRoute = () => '/api/v0/auth/logout';
  static CheckIfSignedInRoute = () => '/api/v0/auth/status';
  static GenericVerifyRoute = () => '/api/v0/auth/genericVerify';
  static GetBrowseCollectionsRoute = () => '/api/v0/browse';
  static BroadcastTxRoute = () => '/api/v0/broadcast';
  static SimulateTxRoute = () => '/api/v0/simulate';
  static FetchMetadataDirectlyRoute = () => '/api/v0/metadata';
  static GetTokensFromFaucetRoute = () => '/api/v0/faucet';

  static SendClaimAlertRoute = () => '/api/v0/claimAlerts/send';
  static GetClaimAlertsRoute = () => '/api/v0/claimAlerts';

  static GetAuthCodeRoute = () => '/api/v0/authCode';
  static CreateAuthCodeRoute = () => '/api/v0/authCode/create';
  static DeleteAuthCodeRoute = () => '/api/v0/authCode/delete';

  static GetFollowDetailsRoute = () => '/api/v0/follow-protocol';

  static GenerateAppleWalletPassRoute = () => '/api/v0/appleWalletPass';

  static GetExternalCallKeyRoute = () => '/api/v0/externalCallKey';

  static GetSecretRoute = () => '/api/v0/secret';
  static CreateSecretRoute = () => '/api/v0/secret/create';
  static DeleteSecretRoute = () => '/api/v0/secret/delete';
  static UpdateSecretRoute = () => '/api/v0/secret/update';

  static GetMapsRoute = () => '/api/v0/maps';
}
