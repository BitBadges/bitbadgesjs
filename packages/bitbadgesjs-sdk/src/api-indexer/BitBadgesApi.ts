import type { NumberType } from '@/common/string-numbers';
import Joi from 'joi';
import { BitBadgesCollection } from './BitBadgesCollection';

import { NativeAddress } from '..';
import type {
  CreateAddressListsPayload,
  CreateAddressListsSuccessResponse,
  DeleteAddressListsPayload,
  DeleteAddressListsSuccessResponse,
  GetAddressListsPayload,
  GetAddressListsSuccessResponse,
  UpdateAddressListsPayload,
  UpdateAddressListsSuccessResponse
} from './BitBadgesAddressList';
import { BitBadgesAddressList } from './BitBadgesAddressList';
import type { GetAccountsPayload, GetAccountsSuccessResponse, GetFollowDetailsPayload, GetFollowDetailsSuccessResponse } from './BitBadgesUserInfo';
import { BitBadgesUserInfo } from './BitBadgesUserInfo';
import type { iBitBadgesApi } from './base';
import { BaseBitBadgesApi } from './base';
import type {
  FilterBadgesInCollectionPayload,
  FilterBadgesInCollectionSuccessResponse,
  GetBadgeActivityPayload,
  GetBadgeActivitySuccessResponse,
  GetBadgeBalanceByAddressPayload,
  GetBadgeBalanceByAddressSuccessResponse,
  GetCollectionsPayload,
  GetCollectionsSuccessResponse,
  GetOwnersForBadgePayload,
  GetOwnersForBadgeSuccessResponse,
  RefreshMetadataPayload,
  RefreshMetadataSuccessResponse,
  RefreshStatusSuccessResponse
} from './requests/collections';
import { GetMapsPayload, GetMapsSuccessResponse, iGetMapsSuccessResponse } from './requests/maps';
import {
  AddApprovalDetailsToOffChainStoragePayload,
  AddApprovalDetailsToOffChainStorageSuccessResponse,
  AddBalancesToOffChainStoragePayload,
  AddBalancesToOffChainStorageSuccessResponse,
  AddReviewPayload,
  AddReviewSuccessResponse,
  AddToIpfsPayload,
  AddToIpfsSuccessResponse,
  BroadcastTxPayload,
  BroadcastTxSuccessResponse,
  CheckSignInStatusPayload,
  CheckSignInStatusSuccessResponse,
  CompleteClaimPayload,
  CompleteClaimSuccessResponse,
  CreateDeveloperAppPayload,
  CreateDeveloperAppSuccessResponse,
  CreateSIWBBRequestPayload,
  CreateSIWBBRequestSuccessResponse,
  CreateClaimPayload,
  CreateClaimSuccessResponse,
  CreatePluginPayload,
  CreatePluginSuccessResponse,
  CreateSecretPayload,
  CreateSecretSuccessResponse,
  DeleteDeveloperAppPayload,
  DeleteDeveloperAppSuccessResponse,
  DeleteSIWBBRequestPayload,
  DeleteSIWBBRequestSuccessResponse,
  DeleteClaimPayload,
  DeleteClaimSuccessResponse,
  DeleteReviewPayload,
  DeleteReviewSuccessResponse,
  DeleteSecretPayload,
  DeleteSecretSuccessResponse,
  FetchMetadataDirectlyPayload,
  FetchMetadataDirectlySuccessResponse,
  GenerateAppleWalletPassPayload,
  GenerateAppleWalletPassSuccessResponse,
  GenericBlockinVerifyPayload,
  GenericBlockinVerifySuccessResponse,
  GenericVerifyAssetsPayload,
  GenericVerifyAssetsSuccessResponse,
  GetActiveAuthorizationsPayload,
  GetActiveAuthorizationsSuccessResponse,
  GetDeveloperAppPayload,
  GetDeveloperAppSuccessResponse,
  GetAndVerifySIWBBRequestPayload,
  GetAndVerifySIWBBRequestSuccessResponse,
  GetAndVerifySIWBBRequestsForDeveloperAppPayload,
  GetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse,
  GetBrowseCollectionsPayload,
  GetBrowseCollectionsSuccessResponse,
  GetClaimAlertsForCollectionPayload,
  GetClaimAlertsForCollectionSuccessResponse,
  GetClaimAttemptStatusSuccessResponse,
  GetClaimsPayload,
  GetClaimsSuccessResponse,
  GetPluginPayload,
  GetPluginSuccessResponse,
  GetReservedClaimCodesPayload,
  GetReservedClaimCodesSuccessResponse,
  GetSearchPayload,
  GetSearchSuccessResponse,
  GetSecretPayload,
  GetSecretSuccessResponse,
  GetSignInChallengePayload,
  GetSignInChallengeSuccessResponse,
  GetStatusSuccessResponse,
  GetTokensFromFaucetPayload,
  GetTokensFromFaucetSuccessResponse,
  OauthAuthorizePayload,
  OauthAuthorizeSuccessResponse,
  OauthRevokePayload,
  OauthRevokeSuccessResponse,
  OauthTokenPayload,
  OauthTokenSuccessResponse,
  SendClaimAlertsPayload,
  SendClaimAlertsSuccessResponse,
  SignOutPayload,
  SignOutSuccessResponse,
  SimulateClaimPayload,
  SimulateClaimSuccessResponse,
  SimulateTxPayload,
  SimulateTxSuccessResponse,
  UpdateAccountInfoPayload,
  UpdateAccountInfoSuccessResponse,
  UpdateDeveloperAppPayload,
  UpdateDeveloperAppSuccessResponse,
  UpdateClaimPayload,
  UpdateClaimSuccessResponse,
  UpdateSecretPayload,
  UpdateSecretSuccessResponse,
  VerifySignInPayload,
  VerifySignInSuccessResponse,
  iAddApprovalDetailsToOffChainStorageSuccessResponse,
  iAddBalancesToOffChainStorageSuccessResponse,
  iAddToIpfsSuccessResponse,
  iBroadcastTxSuccessResponse,
  iCheckSignInStatusSuccessResponse,
  iCompleteClaimSuccessResponse,
  iCreateSIWBBRequestSuccessResponse,
  iDeleteSIWBBRequestSuccessResponse,
  iDeleteReviewSuccessResponse,
  iFetchMetadataDirectlySuccessResponse,
  iGenericBlockinVerifySuccessResponse,
  iGenericVerifyAssetsSuccessResponse,
  iGetAndVerifySIWBBRequestSuccessResponse,
  iGetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse,
  iGetBrowseCollectionsSuccessResponse,
  iGetClaimAlertsForCollectionSuccessResponse,
  iGetClaimAttemptStatusSuccessResponse,
  iGetReservedClaimCodesSuccessResponse,
  iGetSearchSuccessResponse,
  iGetSignInChallengeSuccessResponse,
  iGetStatusSuccessResponse,
  iGetTokensFromFaucetSuccessResponse,
  iSendClaimAlertsSuccessResponse,
  iSignOutSuccessResponse,
  iSimulateClaimSuccessResponse,
  iSimulateTxSuccessResponse,
  iUpdateAccountInfoSuccessResponse,
  iVerifySignInSuccessResponse
} from './requests/requests';
import { BitBadgesApiRoutes } from './requests/routes';

/**
 * This is the BitBadgesAPI class which provides all typed API calls to the BitBadges API.
 * See official documentation for more details and examples. Must pass in a valid API key.
 *
 * convertFunction is used to convert any responses returned by the API to your desired NumberType.
 * ```typescript
 * import { BigIntify, Stringify, Numberify, BitBadgesAPI } from "bitbadgesjs-sdk";
 * const BitBadgesApi = new BitBadgesAPI({ convertFunction: BigIntify, ....})
 * const collections = await BitBadgesApi.getCollections(...);
 * ```
 *
 * By default, we use the official API URL (https://api.bitbadges.io). You can override this by passing in a custom apiUrl.
 *
 * @category API
 *
 * @see [BitBadges API Documentation](https://docs.bitbadges.io/for-developers/bitbadges-api/api)
 */
export class BitBadgesAPI<T extends NumberType> extends BaseBitBadgesApi<T> {
  constructor(apiDetails: iBitBadgesApi<T>) {
    super(apiDetails);
  }

  /**
   * Gets the current status details about the blockchain / indexer (gas, block height, etc).
   *
   * @remarks
   * - **API Route**: `POST /api/v0/status`
   * - **SDK Function Call**: `await BitBadgesApi.getStatus();`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getStatus();
   * console.log(res);
   * ```
   * */
  public async getStatus(): Promise<GetStatusSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetStatusSuccessResponse<string>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetStatusRoute()}`);
      return new GetStatusSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Search collections, badges, accounts, address lists based on a search value.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/search/:searchValue`
   * - **SDK Function Call**: `await BitBadgesApi.getSearchResults(searchValue);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getSearchResults('vitalik.eth', { noAddressLists: true, noCollections: true, noBadges: true });
   * console.log(res);
   * ```
   */
  public async getSearchResults(searchValue: string, payload?: GetSearchPayload): Promise<GetSearchSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetSearchSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SearchRoute(searchValue)}`,
        payload
      );
      return new GetSearchSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * This function retrieves badge collections and accompanying details. Consider using the `getCollectionsAndUpdate` function instead for native support in handling paginations, appending metadata, and more.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collections`
   * - **Tutorial**: Refer to the [Fetching Collections tutorial](https://docs.bitbadges.io/for-developers/bitbadges-api/tutorials/fetching-collections) on the official documentation.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getCollections([{ collectionId, metadataToFetch: { badgeIds: [{ start: 1n, end: 10n }] } }]);
   * const collection = res.collections[0];
   * ```
   */
  public async getCollections(payload: GetCollectionsPayload): Promise<GetCollectionsSuccessResponse<T>> {
    return await BitBadgesCollection.GetCollections(this, payload);
  }

  /**
   * Gets the owners for a specific badge in a collection
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/:badgeId/owners`
   * - **SDK Function Call**: `await BitBadgesApi.getOwnersForBadge(collectionId, badgeId, payload);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getOwnersForBadge(collectionId, badgeId, { bookmark: 'prev' });
   * console.log(res);
   * ```
   */
  public async getOwnersForBadge(
    collectionId: NumberType,
    badgeId: NumberType,
    payload: GetOwnersForBadgePayload
  ): Promise<GetOwnersForBadgeSuccessResponse<T>> {
    return await BitBadgesCollection.GetOwnersForBadge<T>(this, collectionId, badgeId, payload);
  }

  /**
   * Gets the balance of a specific badge for a specific address
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/balance/:cosmosAddress`
   * - **SDK Function Call**: `await BitBadgesApi.getBadgeBalanceByAddress(collectionId, cosmosAddress);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getBadgeBalanceByAddress(collectionId, cosmosAddress);
   * console.log(res);
   * ```
   */
  public async getBadgeBalanceByAddress(
    collectionId: NumberType,
    address: NativeAddress,
    payload?: GetBadgeBalanceByAddressPayload
  ): Promise<GetBadgeBalanceByAddressSuccessResponse<T>> {
    return await BitBadgesCollection.GetBadgeBalanceByAddress(this, collectionId, address, payload);
  }

  /**
   * Gets the activity for a specific badge in a collection
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/:badgeId/activity`
   * - **SDK Function Call**: `await BitBadgesApi.getBadgeActivity(collectionId, badgeId, payload);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getBadgeActivity(collectionId, badgeId, { bookmark: 'prev' });
   * console.log(res);
   * ```
   */
  public async getBadgeActivity(
    collectionId: NumberType,
    badgeId: NumberType,
    payload: GetBadgeActivityPayload
  ): Promise<GetBadgeActivitySuccessResponse<T>> {
    return await BitBadgesCollection.GetBadgeActivity<T>(this, collectionId, badgeId, payload);
  }

  /**
   * Triggers a metadata refresh for a specific collection. BitBadges API uses a refresh queue system for fetching anything off-chain.
   * This will refetch any details for the collection (such as metadata, balances, approval details, etc).
   * Note it will reject if recently refreshed. Uses a cooldown of 5 minutes.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/refresh`
   * - **SDK Function Call**: `await BitBadgesApi.refreshMetadata(collectionId, payload);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.refreshMetadata(collectionId);
   * console.log(res);
   * ```
   */
  public async refreshMetadata(collectionId: NumberType, payload?: RefreshMetadataPayload): Promise<RefreshMetadataSuccessResponse> {
    return await BitBadgesCollection.RefreshMetadata(this, collectionId, payload);
  }

  /**
   * For password based approvals, we hand out codes behind the scenes whenever a user requests a password.
   * This is to prevent replay attacks on the blockchain. This API call will return a valid code if a valid password is provided.
   *
   * Each address is limited to one code per password. If the password is provided again, they will receive the same code.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/claims/complete/:claimId/:cosmosAddress`
   * - **SDK Function Call**: `await BitBadgesApi.completeClaim(claimId, address, { ...body });`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.completeClaim(claimId, address, { ...body });
   * console.log(res);
   * ```
   */
  public async completeClaim(claimId: string, cosmosAddress: string, payload: CompleteClaimPayload): Promise<CompleteClaimSuccessResponse> {
    try {
      if (!claimId) {
        throw new Error('claimId is required');
      }

      const response = await this.axios.post<iCompleteClaimSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CompleteClaimRoute(claimId, cosmosAddress)}`,
        payload
      );
      return new CompleteClaimSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Simulates a claim attempt. A success response means the claim is valid and can be completed.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/claims/simulate/:claimId/:cosmosAddress`
   * - **SDK Function Call**: `await BitBadgesApi.simulateClaim(claimId, address, { ...body });`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.simulateClaim(claimId, address, { ...body });
   * console.log(res);
   * ```
   */
  public async simulateClaim(claimId: string, cosmosAddress: string, payload: SimulateClaimPayload): Promise<SimulateClaimSuccessResponse> {
    try {
      if (!claimId) {
        throw new Error('claimId is required');
      }

      const response = await this.axios.post<iSimulateClaimSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SimulateClaimRoute(claimId, cosmosAddress)}`,
        payload
      );
      return new SimulateClaimSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * For on-chain claims where codes are "reserved" for a specific address, this function will return all codes reserved.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/claims/reserved/:claimId/:cosmosAddress`
   * - **SDK Function Call**: `await BitBadgesApi.getReservedClaimCodes(claimId, address, { ...body });`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getReservedClaimCodes(claimId, address, { ...body });
   * console.log(res);
   * ```
   */
  public async getReservedClaimCodes(
    claimId: string,
    cosmosAddress: string,
    payload: GetReservedClaimCodesPayload
  ): Promise<GetReservedClaimCodesSuccessResponse> {
    try {
      if (!claimId) {
        throw new Error('claimId is required');
      }

      const response = await this.axios.post<iGetReservedClaimCodesSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetReservedClaimCodesRoute(claimId, cosmosAddress)}`,
        payload
      );
      return new GetReservedClaimCodesSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the status of a claim attempt.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/claims/status/:claimId`
   * - **SDK Function Call**: `await BitBadgesApi.getClaimAttemptStatus(claimAttemptId);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getClaimAttemptStatus(claimAttemptId);
   * console.log(res);
   * ```
   */
  public async getClaimAttemptStatus(claimAttemptId: string): Promise<GetClaimAttemptStatusSuccessResponse> {
    try {
      if (!claimAttemptId) {
        throw new Error('claimAttemptId is required');
      }

      const response = await this.axios.post<iGetClaimAttemptStatusSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetClaimAttemptStatusRoute(claimAttemptId)}`
      );
      return new GetClaimAttemptStatusSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes a review.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/deleteReview/:reviewId`
   * - **SDK Function Call**: `await BitBadgesApi.deleteReview(reviewId, payload);`
   * - **Authentication**: Must be signed in and the owner of the review.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.deleteReview(reviewId);
   * console.log(res);
   * ```
   */
  public async deleteReview(reviewId: string, payload?: DeleteReviewPayload): Promise<DeleteReviewSuccessResponse> {
    try {
      const response = await this.axios.delete<iDeleteReviewSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.DeleteReviewRoute(reviewId)}`, {
        data: payload
      });
      return new DeleteReviewSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Adds a new review for a collection or address.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/reviews/add`
   * - **SDK Function Call**: `await BitBadgesApi.addReview(collectionId, payload);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addReview(collectionId, payload);
   * console.log(res);
   * ```
   */
  public async addReview(payload: AddReviewPayload): Promise<AddReviewSuccessResponse> {
    try {
      const response = await this.axios.post(`${this.BACKEND_URL}${BitBadgesApiRoutes.AddReviewRoute()}`, payload);
      return new AddReviewSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets accounts and accompying details.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/users`
   * - **SDK Function Call**: `await BitBadgesApi.getAccounts(payload);`
   * - **Tutorial**: See the [Fetching Accounts tutoral](https://docs.bitbadges.io/for-developers/bitbadges-api/tutorials/fetching-accounts) on the official docs.
   * - **Authentication**: Must be signed in, if fetching private information such as private lists or auth codes. If fetching public information only, no sign in required.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getAccounts([{ address, fetchSequence: true, fetchBalance: true }]);
   * console.log(res);
   * ```
   *
   * @note
   * This function is used to fetch accounts and their details. It is your responsibility to join the data together (paginations, etc).
   * Use getAccountsAndUpdate for a more convenient way to handle paginations and appending metadata.
   */
  public async getAccounts(payload: GetAccountsPayload): Promise<GetAccountsSuccessResponse<T>> {
    return await BitBadgesUserInfo.GetAccounts(this, payload);
  }

  /**
   * Updates the profile / account information for a user. We will only update the provided fields.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/user/updateAccount`
   * - **SDK Function Call**: `await BitBadgesApi.updateAccountInfo(payload);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.updateAccountInfo(payload);
   * console.log(res);
   * ```
   */
  public async updateAccountInfo(payload: UpdateAccountInfoPayload): Promise<UpdateAccountInfoSuccessResponse> {
    try {
      const response = await this.axios.post<iUpdateAccountInfoSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.UpdateAccountInfoRoute()}`,
        payload
      );
      return new UpdateAccountInfoSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Adds a balance map to off-chain storage. Mode can either be 'ipfs" for storing on IPFS or 'centralized' for storing on DigitalOcean.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addBalancesToOffChainStorage`
   * - **SDK Function Call**: `await BitBadgesApi.addBalancesToOffChainStorage(payload);`
   * - **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addBalancesToOffChainStorage(payload);
   * console.log(res);
   * ```
   */
  public async addBalancesToOffChainStorage(payload: AddBalancesToOffChainStoragePayload): Promise<AddBalancesToOffChainStorageSuccessResponse> {
    try {
      const response = await this.axios.post<iAddBalancesToOffChainStorageSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.AddBalancesToOffChainStorageRoute()}`,
        payload
      );
      return new AddBalancesToOffChainStorageSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }
  /**
   * Adds metadata to IPFS.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addToIpfs`
   * - **SDK Function Call**: `await BitBadgesApi.addToIpfs(payload);`
   * - **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addToIpfs(payload);
   * console.log(res);
   * ```
   */
  public async addToIpfs(payload: AddToIpfsPayload): Promise<AddToIpfsSuccessResponse> {
    try {
      const response = await this.axios.post<iAddToIpfsSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.AddToIpfsRoute()}`, payload);
      return new AddToIpfsSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Adds approval details to off-chain storage.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addApprovalDetailsToOffChainStorage`
   * - **SDK Function Call**: `await BitBadgesApi.addApprovalDetailsToOffChainStorage(payload);`
   * - **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addApprovalDetailsToOffChainStorage(payload);
   * console.log(res);
   * ```
   */
  public async addApprovalDetailsToOffChainStorage(
    payload: AddApprovalDetailsToOffChainStoragePayload
  ): Promise<AddApprovalDetailsToOffChainStorageSuccessResponse> {
    try {
      const response = await this.axios.post<iAddApprovalDetailsToOffChainStorageSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.AddApprovalDetailsToOffChainStorageRoute()}`,
        payload
      );
      return new AddApprovalDetailsToOffChainStorageSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the Blockin sign in challenge to be signed for authentication. The returned blockinMessage is the message to be signed by the user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/auth/getChallenge`
   * - **SDK Function Call**: `await BitBadgesApi.getSignInChallenge(payload);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getSignInChallenge(payload);
   * console.log(res);
   * ```
   */
  public async getSignInChallenge(payload: GetSignInChallengePayload): Promise<GetSignInChallengeSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetSignInChallengeSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetSignInChallengeRoute()}`,
        payload
      );
      return new GetSignInChallengeSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Verifies the user signed challenge and grants them a valid session if everything checks out.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/auth/verify`
   * - **SDK Function Call**: `await BitBadgesApi.verifySignIn(payload);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.verifySignIn(payload);
   * console.log(res);
   * ```
   */
  public async verifySignIn(payload: VerifySignInPayload): Promise<VerifySignInSuccessResponse> {
    try {
      const response = await this.axios.post<iVerifySignInSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.VerifySignInRoute()}`, payload);
      return new VerifySignInSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Checks if the user is signed in.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/auth/status`
   * - **SDK Function Call**: `await BitBadgesApi.checkIfSignedIn(payload);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   */
  public async checkIfSignedIn(payload: CheckSignInStatusPayload): Promise<CheckSignInStatusSuccessResponse> {
    try {
      const response = await this.axios.post<iCheckSignInStatusSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CheckIfSignedInRoute()}`,
        payload
      );
      return new CheckSignInStatusSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Signs the user out.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/auth/logout`
   * - **SDK Function Call**: `await BitBadgesApi.signOut(payload);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   */
  public async signOut(payload?: SignOutPayload): Promise<SignOutSuccessResponse> {
    try {
      const response = await this.axios.post<iSignOutSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.SignOutRoute()}`, payload);
      return new SignOutSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets details for a browse / explore page.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/browse`
   * - **SDK Function Call**: `await BitBadgesApi.getBrowseCollections(payload);`
   */
  public async getBrowseCollections(payload?: GetBrowseCollectionsPayload): Promise<GetBrowseCollectionsSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetBrowseCollectionsSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetBrowseCollectionsRoute()}`,
        payload
      );
      return new GetBrowseCollectionsSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Broadcasts a transaction to the blockchain.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/broadcast`
   * - **SDK Function Call**: `await BitBadgesApi.broadcastTx(payload);`
   * - **Tutorial**: See Broadcasting Transactions tutorial on the official docs.
   *
   * Also, consider checking out [Broadcast UI](https://bitbadges.io/dev/broadcast), so you can simply copy and paste your transaction to a UI. All signing, API communication, etc is outsourced to the UI.
   */
  public async broadcastTx(payload: BroadcastTxPayload | string): Promise<BroadcastTxSuccessResponse> {
    try {
      const response = await this.axios.post<iBroadcastTxSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.BroadcastTxRoute()}`, payload);
      return new BroadcastTxSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Simulates a transaction on the blockchain.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/simulate`
   * - **SDK Function Call**: `await BitBadgesApi.simulateTx(payload);`
   * - **Tutorial**: See Broadcasting Transactions tutorial on the official docs.
   *
   * This means that it will return the gas used and any errors that occur on a dry run. Should be used before broadcasting a transaction. Does not require signatures.
   */
  public async simulateTx(payload: SimulateTxPayload | string): Promise<SimulateTxSuccessResponse> {
    try {
      const response = await this.axios.post<iSimulateTxSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.SimulateTxRoute()}`, payload);
      return new SimulateTxSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Fetches arbitrary metadata directly from IPFS. This is useful for fetching metadata that is not stored on-chain.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/metadata`
   * - **SDK Function Call**: `await BitBadgesApi.fetchMetadataDirectly(payload);`
   * - **CORS**: Restricted to only BitBadges official site.
   */
  public async fetchMetadataDirectly(payload: FetchMetadataDirectlyPayload): Promise<FetchMetadataDirectlySuccessResponse<T>> {
    try {
      const error = payload.uris.find((uri) => Joi.string().uri().required().validate(uri).error);
      if (error) {
        throw `Invalid URIs`;
      }

      const response = await this.axios.post<iFetchMetadataDirectlySuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.FetchMetadataDirectlyRoute()}`,
        payload
      );
      return new FetchMetadataDirectlySuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the tokens from the faucet. This will only work on betanet.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/faucet`
   * - **SDK Function Call**: `await BitBadgesApi.getTokensFromFaucet(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async getTokensFromFaucet(payload?: GetTokensFromFaucetPayload): Promise<GetTokensFromFaucetSuccessResponse> {
    try {
      const response = await this.axios.post<iGetTokensFromFaucetSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetTokensFromFaucetRoute()}`,
        payload
      );
      return new GetTokensFromFaucetSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates address lists stored by BitBadges centralized servers.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addressLists`
   * - **SDK Function Call**: `await BitBadgesApi.updateAddressLists(payload);`
   *
   * Must be created off-chain. For on-chain, they must be created through MsgCreateAddressMappings. Creator can update their created lists with no restrictions. Else, requires an edit key.
   */
  public async createAddressLists(payload: CreateAddressListsPayload): Promise<CreateAddressListsSuccessResponse> {
    return await BitBadgesAddressList.CreateAddressList(this, payload);
  }
  /**
   * Updates address lists stored by BitBadges centralized servers.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/addressLists`
   * - **SDK Function Call**: `await BitBadgesApi.updateAddressLists(payload);`
   *
   * Must be created off-chain. For on-chain, they must be created through MsgCreateAddressMappings. Creator can update their created lists with no restrictions. Else, requires an edit key.
   */
  public async updateAddressLists(payload: UpdateAddressListsPayload): Promise<UpdateAddressListsSuccessResponse> {
    return await BitBadgesAddressList.UpdateAddressList(this, payload);
  }

  /**
   * Gets address lists. Can be on-chain or off-chain.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addressLists`
   * - **SDK Function Call**: `await BitBadgesApi.getAddressLists(payload);`
   *
   * Note for reserved lists, you can use getReservedAddressList from the SDK.
   */
  public async getAddressLists(payload: GetAddressListsPayload): Promise<GetAddressListsSuccessResponse<T>> {
    return await BitBadgesAddressList.GetAddressLists(this, payload);
  }

  /**
   * Deletes address lists. Must be created off-chain.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/addressLists`
   * - **SDK Function Call**: `await BitBadgesApi.deleteAddressLists(payload);`
   * - **Authentication**: Must be signed in and the creator of the address list.
   */
  public async deleteAddressLists(payload: DeleteAddressListsPayload): Promise<DeleteAddressListsSuccessResponse> {
    return await BitBadgesAddressList.DeleteAddressList(this, payload);
  }

  /**
   * Gets and verifies a SIWBB request.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbbRequest`
   * - **SDK Function Call**: `await BitBadgesApi.getAndVerifySIWBBRequest(payload);`
   */
  public async getAndVerifySIWBBRequest(payload?: GetAndVerifySIWBBRequestPayload): Promise<GetAndVerifySIWBBRequestSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetAndVerifySIWBBRequestSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDSIWBBRequestRoute()}`,
        payload
      );
      return new GetAndVerifySIWBBRequestSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the SIWBB requests for a specific developer app.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/developerApp/siwbbRequests`
   * - **SDK Function Call**: `await BitBadgesApi.getSIWBBRequestsForDeveloperApp(payload);`
   */
  public async getSIWBBRequestsForDeveloperApp(
    payload: GetAndVerifySIWBBRequestsForDeveloperAppPayload
  ): Promise<GetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetSIWBBRequestsForDeveloperAppRoute()}`,
        payload
      );
      return new GetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates a SIWBB request.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbbRequest`
   * - **SDK Function Call**: `await BitBadgesApi.createSIWBBRequest(payload);`
   */
  public async createSIWBBRequest(payload?: CreateSIWBBRequestPayload): Promise<CreateSIWBBRequestSuccessResponse> {
    try {
      const response = await this.axios.post<iCreateSIWBBRequestSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDSIWBBRequestRoute()}`,
        payload
      );
      return new CreateSIWBBRequestSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes a SIWBB request.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/siwbbRequest`
   * - **SDK Function Call**: `await BitBadgesApi.deleteSIWBBRequest(payload);`
   * - **Authentication**: Must be signed in and the owner of the requesy.
   */
  public async deleteSIWBBRequest(payload?: DeleteSIWBBRequestPayload): Promise<DeleteSIWBBRequestSuccessResponse> {
    try {
      const response = await this.axios.delete<iDeleteSIWBBRequestSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDSIWBBRequestRoute()}`,
        { data: payload }
      );
      return new DeleteSIWBBRequestSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * A generic route for verifying SIWBB requests. Used as a helper if implementing on your own.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbbRequest/verify`
   * - **SDK Function Call**: `await BitBadgesApi.verifySIWBBRequest(payload);`
   */
  public async verifySIWBBRequest(payload: GenericBlockinVerifyPayload): Promise<GenericBlockinVerifySuccessResponse> {
    try {
      const response = await this.axios.post<iGenericBlockinVerifySuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GenericVerifyRoute()}`,
        payload
      );
      return new GenericBlockinVerifySuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * A generic route for verifying asset ownership requirements. Asset requirements support AND / OR / NOT logic.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/verifyOwnershipRequirements`
   * - **SDK Function Call**: `await BitBadgesApi.verifyOwnershipRequirements(payload);`
   */
  public async verifyOwnershipRequirements(payload: GenericVerifyAssetsPayload): Promise<GenericVerifyAssetsSuccessResponse> {
    try {
      const response = await this.axios.post<iGenericVerifyAssetsSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GenericVerifyAssetsRoute()}`,
        payload
      );
      return new GenericVerifyAssetsSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Sends claim alert notifications out.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/claimAlerts/send`
   * - **SDK Function Call**: `await BitBadgesApi.sendClaimAlert(payload);`
   * - **Authentication**: Must be signed in and the manager of the collection.
   * - **CORS**: Restricted to only BitBadges official site.
   */
  public async sendClaimAlert(payload: SendClaimAlertsPayload): Promise<SendClaimAlertsSuccessResponse> {
    try {
      const response = await this.axios.post<iSendClaimAlertsSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SendClaimAlertRoute()}`,
        payload
      );
      return new SendClaimAlertsSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the follow details for a user with the BitBadges follow protocol.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/follow-protocol`
   * - **SDK Function Call**: `await BitBadgesApi.getFollowDetails(payload);`
   */
  public async getFollowDetails(payload: GetFollowDetailsPayload): Promise<GetFollowDetailsSuccessResponse<T>> {
    return await BitBadgesUserInfo.GetFollowDetails(this, payload);
  }

  /**
   * Gets claim alerts for a collection.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/claimAlerts`
   * - **SDK Function Call**: `await BitBadgesApi.getClaimAlerts(payload);`
   * - **Authentication**: Must be signed in and the manager of the collection.
   */
  public async getClaimAlerts(payload: GetClaimAlertsForCollectionPayload): Promise<GetClaimAlertsForCollectionSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetClaimAlertsForCollectionSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetClaimAlertsRoute()}`,
        payload
      );
      return new GetClaimAlertsForCollectionSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the refresh status for a collection. Used to track if any errors occur during a refresh, or if it is in the queue or not.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/refreshStatus`
   * - **SDK Function Call**: `await BitBadgesApi.getRefreshStatus(payload);`
   */
  public async getRefreshStatus(collectionId: NumberType): Promise<RefreshStatusSuccessResponse<NumberType>> {
    return await BitBadgesCollection.GetRefreshStatus(this, collectionId);
  }

  /**
   * Get maps by ID
   *
   * @remarks
   * - **API Route**: `POST /api/v0/maps`
   * - **SDK Function Call**: `await BitBadgesApi.getMaps(payload);`
   */
  public async getMaps(payload: GetMapsPayload): Promise<GetMapsSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetMapsSuccessResponse<string>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetMapsRoute()}`, payload);
      return new GetMapsSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Filters badges in a collection based on multiple filter values.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/filter`
   * - **SDK Function Call**: `await BitBadgesApi.filterBadgesInCollection(payload);`
   */
  public async filterBadgesInCollection(
    collectionId: T,
    payload: FilterBadgesInCollectionPayload
  ): Promise<FilterBadgesInCollectionSuccessResponse<T>> {
    return await BitBadgesCollection.FilterBadgesInCollection(this, collectionId, payload);
  }

  /**
   * Generates an Apple wallet pass for a code.
   *
   * Returns application/vnd.apple.pkpass content type.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbbRequest/appleWalletPass`
   * - **SDK Function Call**: `await BitBadgesApi.generateAppleWalletPass(payload);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.generateAppleWalletPass(payload);
   * console.log(res);
   * ```
   *
   * @example
   * ```typescript
   * const pass = Buffer.from(res.data);
   *
   * const blob = new Blob([pass], { type: 'application/vnd.apple.pkpass' });
   * const url = window.URL.createObjectURL(blob);
   * if (url) {
   *    const link = document.createElement('a');
   *    link.href = url;
   *    link.download = 'bitbadges.pkpass';
   *    link.click()
   * }
   * ```
   */
  public async generateAppleWalletPass(payload: GenerateAppleWalletPassPayload): Promise<GenerateAppleWalletPassSuccessResponse> {
    try {
      const response = await this.axios.post<GenerateAppleWalletPassSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GenerateAppleWalletPassRoute()}`,
        payload
      );
      return new GenerateAppleWalletPassSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the claim by ID.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/claims`
   * - **SDK Function Call**: `await BitBadgesApi.getClaims(payload);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getClaims(payload);
   * console.log(res);
   * ```
   */
  public async getClaims(payload: GetClaimsPayload): Promise<GetClaimsSuccessResponse<T>> {
    try {
      const response = await this.axios.post<GetClaimsSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDClaimsRoute()}`, payload);
      return new GetClaimsSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get an off-chain secret signature (typically a credential).
   *
   * @remarks
   * - **API Route**: `POST /api/v0/secret`
   * - **SDK Function Call**: `await BitBadgesApi.getSecret(payload);`
   */
  public async getSecret(payload: GetSecretPayload): Promise<GetSecretSuccessResponse<T>> {
    try {
      const response = await this.axios.post<GetSecretSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDSecretRoute()}`, payload);
      return new GetSecretSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates an off-chain secret signature (typically a credential).
   *
   * @remarks
   * - **API Route**: `POST /api/v0/secret`
   * - **SDK Function Call**: `await BitBadgesApi.createSecret(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async createSecret(payload: CreateSecretPayload): Promise<CreateSecretSuccessResponse> {
    try {
      const response = await this.axios.post<CreateSecretSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDSecretRoute()}`, payload);
      return new CreateSecretSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes an off-chain secret signature (typically a credential).
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/secret`
   * - **SDK Function Call**: `await BitBadgesApi.deleteSecret(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async deleteSecret(payload: DeleteSecretPayload): Promise<DeleteSecretSuccessResponse> {
    try {
      const response = await this.axios.delete<DeleteSecretSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDSecretRoute()}`, {
        data: payload
      });
      return new DeleteSecretSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Update a secret.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/secret`
   * - **SDK Function Call**: `await BitBadgesApi.updateUserSecrets(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async updateSecret(payload: UpdateSecretPayload): Promise<UpdateSecretSuccessResponse> {
    try {
      const response = await this.axios.put<UpdateSecretSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDSecretRoute()}`, payload);
      return new UpdateSecretSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get all developer apps for a user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/developerApp`
   * - **SDK Function Call**: `await BitBadgesApi.getDeveloperApp(payload);`
   */
  public async getDeveloperApps(payload: GetDeveloperAppPayload): Promise<GetDeveloperAppSuccessResponse> {
    try {
      const response = await this.axios.post<GetDeveloperAppSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDDeveloperAppRoute()}`,
        payload
      );
      return new GetDeveloperAppSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates an developer app.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/developerApp`
   * - **SDK Function Call**: `await BitBadgesApi.createDeveloperApp(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async createDeveloperApp(payload: CreateDeveloperAppPayload): Promise<CreateDeveloperAppSuccessResponse> {
    try {
      const response = await this.axios.post<CreateDeveloperAppSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDDeveloperAppRoute()}`,
        payload
      );
      return new CreateDeveloperAppSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes an developer app.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/developerApp`
   * - **SDK Function Call**: `await BitBadgesApi.deleteDeveloperApp(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async deleteDeveloperApp(payload: DeleteDeveloperAppPayload): Promise<DeleteDeveloperAppSuccessResponse> {
    try {
      const response = await this.axios.delete<DeleteDeveloperAppSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDDeveloperAppRoute()}`,
        { data: payload }
      );
      return new DeleteDeveloperAppSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Update an developer app.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/developerApp`
   * - **SDK Function Call**: `await BitBadgesApi.updateUserDeveloperApps(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async updateDeveloperApp(payload: UpdateDeveloperAppPayload): Promise<UpdateDeveloperAppSuccessResponse> {
    try {
      const response = await this.axios.put<UpdateDeveloperAppSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDDeveloperAppRoute()}`,
        payload
      );
      return new UpdateDeveloperAppSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get all developer apps for a user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/plugins`
   * - **SDK Function Call**: `await BitBadgesApi.getPlugins(payload);`
   */
  public async getPlugins(payload: GetPluginPayload): Promise<GetPluginSuccessResponse<T>> {
    try {
      const response = await this.axios.post<GetPluginSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDPluginRoute()}`, payload);
      return new GetPluginSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates an developer app.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/developerApp`
   * - **SDK Function Call**: `await BitBadgesApi.createPlugin(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async createPlugin(payload: CreatePluginPayload): Promise<CreatePluginSuccessResponse> {
    try {
      const response = await this.axios.post<CreatePluginSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDPluginRoute()}`, payload);
      return new CreatePluginSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates a claim.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/claims`
   * - **SDK Function Call**: `await BitBadgesApi.createClaim(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async createClaim(payload: CreateClaimPayload): Promise<CreateClaimSuccessResponse> {
    try {
      const response = await this.axios.post<CreateClaimSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDClaimsRoute()}`, payload);
      return new CreateClaimSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes a claim.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/claims`
   * - **SDK Function Call**: `await BitBadgesApi.deleteClaim(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async deleteClaim(payload: DeleteClaimPayload): Promise<DeleteClaimSuccessResponse> {
    try {
      const response = await this.axios.delete<DeleteClaimSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDClaimsRoute()}`, {
        data: payload
      });
      return new DeleteClaimSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Update an claim.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/claims`
   * - **SDK Function Call**: `await BitBadgesApi.updateClaim(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async updateClaim(payload: UpdateClaimPayload): Promise<UpdateClaimSuccessResponse> {
    try {
      const response = await this.axios.put<UpdateClaimSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDClaimsRoute()}`, payload);
      return new UpdateClaimSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets all active authorizations for a user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/oauth/authorizations`
   * - **SDK Function Call**: `await BitBadgesApi.getActiveAuthorizations(payload);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getActiveAuthorizations(payload);
   * console.log(res);
   * ```
   */
  public async getActiveAuthorizations(payload: GetActiveAuthorizationsPayload): Promise<GetActiveAuthorizationsSuccessResponse> {
    try {
      const response = await this.axios.post<GetActiveAuthorizationsSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetActiveAuthorizationsRoute()}`,
        payload
      );
      return new GetActiveAuthorizationsSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Authorizes a user for a specific scope.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/oauth/authorize`
   * - **SDK Function Call**: `await BitBadgesApi.oauthAuthorize(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async getOauthAuthorizationCode(payload: OauthAuthorizePayload): Promise<OauthAuthorizeSuccessResponse> {
    try {
      const response = await this.axios.post<OauthAuthorizeSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.OauthAuthorizeRoute()}`,
        payload
      );
      console.log(response.data);

      return new OauthAuthorizeSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Exchange either an authorization code or a refresh token for an access token.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/oauth/token`
   * - **SDK Function Call**: `await BitBadgesApi.getOauthAccessToken(payload);`
   */
  public async getOauthAccessToken(payload: OauthTokenPayload): Promise<OauthTokenSuccessResponse> {
    try {
      const response = await this.axios.post<OauthTokenSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.OauthTokenRoute()}`, payload);
      return new OauthTokenSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Revokes an access token for a user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/oauth/token/revoke`
   * - **SDK Function Call**: `await BitBadgesApi.oauthRevoke(payload);`
   */
  public async revokeOauthAuthorization(payload: OauthRevokePayload): Promise<OauthRevokeSuccessResponse> {
    try {
      const response = await this.axios.post<OauthRevokeSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.OauthRevokeRoute()}`, payload);
      return new OauthRevokeSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /** Update Helper Functions for Pagination and Dynamic Fetches */
  public async updateUserSeenActivity() {
    return await this.updateAccountInfo({ seenActivity: Date.now() }); //Authenticated route so no need to pass in address
  }
}

export default BitBadgesAPI;
