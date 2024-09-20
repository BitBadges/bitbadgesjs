import type { NumberType } from '@/common/string-numbers.js';
import { NativeAddress } from '../docs/index.js';

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
  static GetBadgeBalanceByAddressRoute = (collectionId: NumberType, cosmosAddress: string) =>
    `/api/v0/collection/${collectionId.toString()}/balance/${cosmosAddress}`;
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

  static GetClaimsRoute = () => '/api/v0/claims/fetch';
  static CRUDClaimsRoute = () => `/api/v0/claims`;

  static AddReviewRoute = () => '/api/v0/reviews/add';
  static DeleteReviewRoute = (reviewId: string) => `/api/v0/reviews/delete/${reviewId}`;

  static GetAddressListsRoute = () => '/api/v0/addressLists/fetch';
  static CRUDAddressListsRoute = () => '/api/v0/addressLists';

  static GetAccountsRoute = () => '/api/v0/users';
  static UpdateAccountInfoRoute = () => '/api/v0/user/updateAccount';

  static AddToIpfsRoute = () => '/api/v0/addToIpfs';
  static AddApprovalDetailsToOffChainStorageRoute = () => '/api/v0/addApprovalDetailsToOffChainStorage';
  static AddBalancesToOffChainStorageRoute = () => '/api/v0/addBalancesToOffChainStorage';

  static GetSignInChallengeRoute = () => '/api/v0/auth/getChallenge';
  static VerifySignInRoute = () => '/api/v0/auth/verify';
  static SignOutRoute = () => '/api/v0/auth/logout';
  static CheckIfSignedInRoute = () => '/api/v0/auth/status';

  static GetBrowseCollectionsRoute = () => '/api/v0/browse';

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

  static GetAttestationProofsRoute = () => '/api/v0/attestationProof/fetch';
  static CRUDAttestationProofRoute = () => '/api/v0/attestationProof';

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

  static GetInternalActionsRoute = () => '/api/v0/internalAction/fetch';
  static CRUDInternalActionRoute = () => '/api/v0/internalAction';

  static GetGatedContentRoute = () => '/api/v0/gatedContent/fetch';
  static CRUDGatedContentRoute = () => '/api/v0/gatedContent';
}
