import type { NumberType } from '@/common/string-numbers';
import Joi from 'joi';
import { BitBadgesCollection } from './BitBadgesCollection';

import { NativeAddress } from '..';
import type {
  CreateAddressListsBody,
  CreateAddressListsSuccessResponse,
  DeleteAddressListsBody,
  DeleteAddressListsSuccessResponse,
  GetAddressListsBody,
  GetAddressListsSuccessResponse,
  UpdateAddressListsBody,
  UpdateAddressListsSuccessResponse
} from './BitBadgesAddressList';
import { BitBadgesAddressList } from './BitBadgesAddressList';
import type { GetAccountsBody, GetAccountsSuccessResponse, GetFollowDetailsBody, GetFollowDetailsSuccessResponse } from './BitBadgesUserInfo';
import { BitBadgesUserInfo } from './BitBadgesUserInfo';
import type { iBitBadgesApi } from './base';
import { BaseBitBadgesApi } from './base';
import type {
  FilterBadgesInCollectionBody,
  FilterBadgesInCollectionSuccessResponse,
  GetBadgeActivityBody,
  GetBadgeActivitySuccessResponse,
  GetBadgeBalanceByAddressBody,
  GetBadgeBalanceByAddressSuccessResponse,
  GetCollectionsBody,
  GetCollectionsSuccessResponse,
  GetOwnersForBadgeBody,
  GetOwnersForBadgeSuccessResponse,
  RefreshMetadataBody,
  RefreshMetadataSuccessResponse,
  RefreshStatusSuccessResponse
} from './requests/collections';
import { GetMapsBody, GetMapsSuccessResponse, iGetMapsSuccessResponse } from './requests/maps';
import {
  AddApprovalDetailsToOffChainStorageBody,
  AddApprovalDetailsToOffChainStorageSuccessResponse,
  AddBalancesToOffChainStorageBody,
  AddBalancesToOffChainStorageSuccessResponse,
  AddReviewBody,
  AddReviewSuccessResponse,
  AddToIpfsBody,
  AddToIpfsSuccessResponse,
  BroadcastTxBody,
  BroadcastTxSuccessResponse,
  CheckSignInStatusBody,
  CheckSignInStatusSuccessResponse,
  CompleteClaimBody,
  CompleteClaimSuccessResponse,
  CreateDeveloperAppBody,
  CreateDeveloperAppSuccessResponse,
  CreateSIWBBRequestBody,
  CreateSIWBBRequestSuccessResponse,
  CreateClaimBody,
  CreateClaimSuccessResponse,
  CreatePluginBody,
  CreatePluginSuccessResponse,
  CreateSecretBody,
  CreateSecretSuccessResponse,
  DeleteDeveloperAppBody,
  DeleteDeveloperAppSuccessResponse,
  DeleteSIWBBRequestBody,
  DeleteSIWBBRequestSuccessResponse,
  DeleteClaimBody,
  DeleteClaimSuccessResponse,
  DeleteReviewBody,
  DeleteReviewSuccessResponse,
  DeleteSecretBody,
  DeleteSecretSuccessResponse,
  FetchMetadataDirectlyBody,
  FetchMetadataDirectlySuccessResponse,
  GenerateAppleWalletPassBody,
  GenerateAppleWalletPassSuccessResponse,
  GenericBlockinVerifyBody,
  GenericBlockinVerifySuccessResponse,
  GenericVerifyAssetsBody,
  GenericVerifyAssetsSuccessResponse,
  GetActiveAuthorizationsBody,
  GetActiveAuthorizationsSuccessResponse,
  GetDeveloperAppBody,
  GetDeveloperAppSuccessResponse,
  GetAndVerifySIWBBRequestBody,
  GetAndVerifySIWBBRequestSuccessResponse,
  GetAndVerifySIWBBRequestsForDeveloperAppBody,
  GetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse,
  GetBrowseCollectionsBody,
  GetBrowseCollectionsSuccessResponse,
  GetClaimAlertsForCollectionBody,
  GetClaimAlertsForCollectionSuccessResponse,
  GetClaimAttemptStatusSuccessResponse,
  GetClaimsBody,
  GetClaimsSuccessResponse,
  GetPluginBody,
  GetPluginSuccessResponse,
  GetReservedClaimCodesBody,
  GetReservedClaimCodesSuccessResponse,
  GetSearchBody,
  GetSearchSuccessResponse,
  GetSecretBody,
  GetSecretSuccessResponse,
  GetSignInChallengeBody,
  GetSignInChallengeSuccessResponse,
  GetStatusSuccessResponse,
  GetTokensFromFaucetBody,
  GetTokensFromFaucetSuccessResponse,
  OauthAuthorizeBody,
  OauthAuthorizeSuccessResponse,
  OauthRevokeBody,
  OauthRevokeSuccessResponse,
  OauthTokenBody,
  OauthTokenSuccessResponse,
  SendClaimAlertsBody,
  SendClaimAlertsSuccessResponse,
  SignOutBody,
  SignOutSuccessResponse,
  SimulateClaimBody,
  SimulateClaimSuccessResponse,
  SimulateTxBody,
  SimulateTxSuccessResponse,
  UpdateAccountInfoBody,
  UpdateAccountInfoSuccessResponse,
  UpdateDeveloperAppBody,
  UpdateDeveloperAppSuccessResponse,
  UpdateClaimBody,
  UpdateClaimSuccessResponse,
  UpdateSecretBody,
  UpdateSecretSuccessResponse,
  VerifySignInBody,
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
  public async getSearchResults(searchValue: string, body?: GetSearchBody): Promise<GetSearchSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetSearchSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetSearchRoute(searchValue)}`,
        body
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
   * - **API Route**: `POST /api/v0/collection/batch`
   * - **Tutorial**: Refer to the [Fetching Collections tutorial](https://docs.bitbadges.io/for-developers/bitbadges-api/tutorials/fetching-collections) on the official documentation.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getCollections([{ collectionId, metadataToFetch: { badgeIds: [{ start: 1n, end: 10n }] } }]);
   * const collection = res.collections[0];
   * ```
   */
  public async getCollections(body: GetCollectionsBody): Promise<GetCollectionsSuccessResponse<T>> {
    return await BitBadgesCollection.GetCollections(this, body);
  }

  /**
   * Gets the owners for a specific badge in a collection
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/:badgeId/owners`
   * - **SDK Function Call**: `await BitBadgesApi.getOwnersForBadge(collectionId, badgeId, body);`
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
    body: GetOwnersForBadgeBody
  ): Promise<GetOwnersForBadgeSuccessResponse<T>> {
    return await BitBadgesCollection.GetOwnersForBadge<T>(this, collectionId, badgeId, body);
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
    body?: GetBadgeBalanceByAddressBody
  ): Promise<GetBadgeBalanceByAddressSuccessResponse<T>> {
    return await BitBadgesCollection.GetBadgeBalanceByAddress(this, collectionId, address, body);
  }

  /**
   * Gets the activity for a specific badge in a collection
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/:badgeId/activity`
   * - **SDK Function Call**: `await BitBadgesApi.getBadgeActivity(collectionId, badgeId, body);`
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
    body: GetBadgeActivityBody
  ): Promise<GetBadgeActivitySuccessResponse<T>> {
    return await BitBadgesCollection.GetBadgeActivity<T>(this, collectionId, badgeId, body);
  }

  /**
   * Triggers a metadata refresh for a specific collection. BitBadges API uses a refresh queue system for fetching anything off-chain.
   * This will refetch any details for the collection (such as metadata, balances, approval details, etc).
   * Note it will reject if recently refreshed. Uses a cooldown of 5 minutes.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/refresh`
   * - **SDK Function Call**: `await BitBadgesApi.refreshMetadata(collectionId, body);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.refreshMetadata(collectionId);
   * console.log(res);
   * ```
   */
  public async refreshMetadata(collectionId: NumberType, body?: RefreshMetadataBody): Promise<RefreshMetadataSuccessResponse> {
    return await BitBadgesCollection.RefreshMetadata(this, collectionId, body);
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
  public async completeClaim(claimId: string, cosmosAddress: string, body: CompleteClaimBody): Promise<CompleteClaimSuccessResponse> {
    try {
      if (!claimId) {
        throw new Error('claimId is required');
      }

      const response = await this.axios.post<iCompleteClaimSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CompleteClaimRoute(claimId, cosmosAddress)}`,
        body
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
  public async simulateClaim(claimId: string, cosmosAddress: string, body: SimulateClaimBody): Promise<SimulateClaimSuccessResponse> {
    try {
      if (!claimId) {
        throw new Error('claimId is required');
      }

      const response = await this.axios.post<iSimulateClaimSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SimulateClaimRoute(claimId, cosmosAddress)}`,
        body
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
    body: GetReservedClaimCodesBody
  ): Promise<GetReservedClaimCodesSuccessResponse> {
    try {
      if (!claimId) {
        throw new Error('claimId is required');
      }

      const response = await this.axios.post<iGetReservedClaimCodesSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetReservedClaimCodesRoute(claimId, cosmosAddress)}`,
        body
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
   * - **API Route**: `POST /api/v0/deleteReview/:reviewId`
   * - **SDK Function Call**: `await BitBadgesApi.deleteReview(reviewId, body);`
   * - **Authentication**: Must be signed in and the owner of the review.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.deleteReview(reviewId);
   * console.log(res);
   * ```
   */
  public async deleteReview(reviewId: string, body?: DeleteReviewBody): Promise<DeleteReviewSuccessResponse> {
    try {
      const response = await this.axios.post<iDeleteReviewSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.DeleteReviewRoute(reviewId)}`,
        body
      );
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
   * - **API Route**: `POST /api/v0/collection/:collectionId/addReview`
   * - **SDK Function Call**: `await BitBadgesApi.addReview(collectionId, body);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addReview(collectionId, body);
   * console.log(res);
   * ```
   */
  public async addReview(body: AddReviewBody): Promise<AddReviewSuccessResponse> {
    try {
      const response = await this.axios.post(`${this.BACKEND_URL}${BitBadgesApiRoutes.AddReviewRoute()}`, body);
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
   * - **API Route**: `POST /api/v0/user/batch`
   * - **SDK Function Call**: `await BitBadgesApi.getAccounts(Body);`
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
  public async getAccounts(body: GetAccountsBody): Promise<GetAccountsSuccessResponse<T>> {
    return await BitBadgesUserInfo.GetAccounts(this, body);
  }

  /**
   * Updates the profile / account information for a user. We will only update the provided fields.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/user/updateAccount`
   * - **SDK Function Call**: `await BitBadgesApi.updateAccountInfo(Body);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.updateAccountInfo(Body);
   * console.log(res);
   * ```
   */
  public async updateAccountInfo(body: UpdateAccountInfoBody): Promise<UpdateAccountInfoSuccessResponse> {
    try {
      const response = await this.axios.post<iUpdateAccountInfoSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.UpdateAccountInfoRoute()}`,
        body
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
   * - **SDK Function Call**: `await BitBadgesApi.addBalancesToOffChainStorage(Body);`
   * - **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addBalancesToOffChainStorage(Body);
   * console.log(res);
   * ```
   */
  public async addBalancesToOffChainStorage(body: AddBalancesToOffChainStorageBody): Promise<AddBalancesToOffChainStorageSuccessResponse> {
    try {
      const response = await this.axios.post<iAddBalancesToOffChainStorageSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.AddBalancesToOffChainStorageRoute()}`,
        body
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
   * - **SDK Function Call**: `await BitBadgesApi.addToIpfs(Body);`
   * - **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addToIpfs(Body);
   * console.log(res);
   * ```
   */
  public async addToIpfs(body: AddToIpfsBody): Promise<AddToIpfsSuccessResponse> {
    try {
      const response = await this.axios.post<iAddToIpfsSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.AddToIpfsRoute()}`, body);
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
   * - **SDK Function Call**: `await BitBadgesApi.addApprovalDetailsToOffChainStorage(Body);`
   * - **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addApprovalDetailsToOffChainStorage(Body);
   * console.log(res);
   * ```
   */
  public async addApprovalDetailsToOffChainStorage(
    body: AddApprovalDetailsToOffChainStorageBody
  ): Promise<AddApprovalDetailsToOffChainStorageSuccessResponse> {
    try {
      const response = await this.axios.post<iAddApprovalDetailsToOffChainStorageSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.AddApprovalDetailsToOffChainStorageRoute()}`,
        body
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
   * - **SDK Function Call**: `await BitBadgesApi.getSignInChallenge(Body);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getSignInChallenge(Body);
   * console.log(res);
   * ```
   */
  public async getSignInChallenge(body: GetSignInChallengeBody): Promise<GetSignInChallengeSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetSignInChallengeSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetSignInChallengeRoute()}`,
        body
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
   * - **SDK Function Call**: `await BitBadgesApi.verifySignIn(Body);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.verifySignIn(Body);
   * console.log(res);
   * ```
   */
  public async verifySignIn(body: VerifySignInBody): Promise<VerifySignInSuccessResponse> {
    try {
      const response = await this.axios.post<iVerifySignInSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.VerifySignInRoute()}`, body);
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
   * - **SDK Function Call**: `await BitBadgesApi.checkIfSignedIn(Body);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   */
  public async checkIfSignedIn(body: CheckSignInStatusBody): Promise<CheckSignInStatusSuccessResponse> {
    try {
      const response = await this.axios.post<iCheckSignInStatusSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CheckIfSignedInRoute()}`,
        body
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
   * - **SDK Function Call**: `await BitBadgesApi.signOut(Body);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   */
  public async signOut(body?: SignOutBody): Promise<SignOutSuccessResponse> {
    try {
      const response = await this.axios.post<iSignOutSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.SignOutRoute()}`, body);
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
   * - **SDK Function Call**: `await BitBadgesApi.getBrowseCollections(Body);`
   */
  public async getBrowseCollections(body?: GetBrowseCollectionsBody): Promise<GetBrowseCollectionsSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetBrowseCollectionsSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetBrowseCollectionsRoute()}`,
        body
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
   * - **SDK Function Call**: `await BitBadgesApi.broadcastTx(Body);`
   * - **Tutorial**: See Broadcasting Transactions tutorial on the official docs.
   *
   * Also, consider checking out [Broadcast UI](https://bitbadges.io/dev/broadcast), so you can simply copy and paste your transaction to a UI. All signing, API communication, etc is outsourced to the UI.
   */
  public async broadcastTx(body: BroadcastTxBody | string): Promise<BroadcastTxSuccessResponse> {
    try {
      const response = await this.axios.post<iBroadcastTxSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.BroadcastTxRoute()}`, body);
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
   * - **SDK Function Call**: `await BitBadgesApi.simulateTx(Body);`
   * - **Tutorial**: See Broadcasting Transactions tutorial on the official docs.
   *
   * This means that it will return the gas used and any errors that occur on a dry run. Should be used before broadcasting a transaction. Does not require signatures.
   */
  public async simulateTx(body: SimulateTxBody | string): Promise<SimulateTxSuccessResponse> {
    try {
      const response = await this.axios.post<iSimulateTxSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.SimulateTxRoute()}`, body);
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
   * - **SDK Function Call**: `await BitBadgesApi.fetchMetadataDirectly(Body);`
   * - **CORS**: Restricted to only BitBadges official site.
   */
  public async fetchMetadataDirectly(body: FetchMetadataDirectlyBody): Promise<FetchMetadataDirectlySuccessResponse<T>> {
    try {
      const error = body.uris.find((uri) => Joi.string().uri().required().validate(uri).error);
      if (error) {
        throw `Invalid URIs`;
      }

      const response = await this.axios.post<iFetchMetadataDirectlySuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.FetchMetadataDirectlyRoute()}`,
        body
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
   * - **SDK Function Call**: `await BitBadgesApi.getTokensFromFaucet(Body);`
   * - **Authentication**: Must be signed in.
   */
  public async getTokensFromFaucet(body?: GetTokensFromFaucetBody): Promise<GetTokensFromFaucetSuccessResponse> {
    try {
      const response = await this.axios.post<iGetTokensFromFaucetSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetTokensFromFaucetRoute()}`,
        body
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
   * - **API Route**: `POST /api/v0/addressList/update`
   * - **SDK Function Call**: `await BitBadgesApi.updateAddressLists(Body);`
   *
   * Must be created off-chain. For on-chain, they must be created through MsgCreateAddressMappings. Creator can update their created lists with no restrictions. Else, requires an edit key.
   */
  public async createAddressLists(body: CreateAddressListsBody): Promise<CreateAddressListsSuccessResponse> {
    return await BitBadgesAddressList.CreateAddressList(this, body);
  }
  /**
   * Updates address lists stored by BitBadges centralized servers.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addressList/update`
   * - **SDK Function Call**: `await BitBadgesApi.updateAddressLists(Body);`
   *
   * Must be created off-chain. For on-chain, they must be created through MsgCreateAddressMappings. Creator can update their created lists with no restrictions. Else, requires an edit key.
   */
  public async updateAddressLists(body: UpdateAddressListsBody<NumberType>): Promise<UpdateAddressListsSuccessResponse> {
    return await BitBadgesAddressList.UpdateAddressList(this, body);
  }

  /**
   * Gets address lists. Can be on-chain or off-chain.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addressList`
   * - **SDK Function Call**: `await BitBadgesApi.getAddressLists(Body);`
   *
   * Note for reserved lists, you can use getReservedAddressList from the SDK.
   */
  public async getAddressLists(body: GetAddressListsBody): Promise<GetAddressListsSuccessResponse<T>> {
    return await BitBadgesAddressList.GetAddressLists(this, body);
  }

  /**
   * Deletes address lists. Must be created off-chain.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addressList/delete`
   * - **SDK Function Call**: `await BitBadgesApi.deleteAddressLists(Body);`
   * - **Authentication**: Must be signed in and the creator of the address list.
   */
  public async deleteAddressLists(body: DeleteAddressListsBody): Promise<DeleteAddressListsSuccessResponse> {
    return await BitBadgesAddressList.DeleteAddressList(this, body);
  }

  /**
   * Gets and verifies a SIWBB request.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbbRequest`
   * - **SDK Function Call**: `await BitBadgesApi.getAndVerifySIWBBRequest(Body);`
   */
  public async getAndVerifySIWBBRequest(body?: GetAndVerifySIWBBRequestBody): Promise<GetAndVerifySIWBBRequestSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetAndVerifySIWBBRequestSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetAndVerifySIWBBRequestRoute()}`,
        body
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
   * - **API Route**: `POST /api/v0/siwbbRequestsForDeveloperApp`
   * - **SDK Function Call**: `await BitBadgesApi.getSIWBBRequestsForDeveloperApp(Body);`
   */
  public async getSIWBBRequestsForDeveloperApp(
    body: GetAndVerifySIWBBRequestsForDeveloperAppBody
  ): Promise<GetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetSIWBBRequestsForDeveloperAppRoute()}`,
        body
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
   * - **API Route**: `POST /api/v0/siwbbRequest/create`
   * - **SDK Function Call**: `await BitBadgesApi.createSIWBBRequest(Body);`
   */
  public async createSIWBBRequest(body?: CreateSIWBBRequestBody): Promise<CreateSIWBBRequestSuccessResponse> {
    try {
      const response = await this.axios.post<iCreateSIWBBRequestSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CreateSIWBBRequestRoute()}`,
        body
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
   * - **API Route**: `POST /api/v0/siwbbRequest/delete`
   * - **SDK Function Call**: `await BitBadgesApi.deleteSIWBBRequest(Body);`
   * - **Authentication**: Must be signed in and the owner of the requesy.
   */
  public async deleteSIWBBRequest(body?: DeleteSIWBBRequestBody): Promise<DeleteSIWBBRequestSuccessResponse> {
    try {
      const response = await this.axios.post<iDeleteSIWBBRequestSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.DeleteSIWBBRequestRoute()}`,
        body
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
   * - **API Route**: `POST /api/v0/auth/verifyGeneric`
   * - **SDK Function Call**: `await BitBadgesApi.verifySIWBBRequest(Body);`
   */
  public async verifySIWBBRequest(body: GenericBlockinVerifyBody): Promise<GenericBlockinVerifySuccessResponse> {
    try {
      const response = await this.axios.post<iGenericBlockinVerifySuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GenericVerifyRoute()}`,
        body
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
   * - **API Route**: `POST /api/v0/auth/verifyOwnershipRequirements`
   * - **SDK Function Call**: `await BitBadgesApi.verifyOwnershipRequirements(Body);`
   */
  public async verifyOwnershipRequirements(body: GenericVerifyAssetsBody): Promise<GenericVerifyAssetsSuccessResponse> {
    try {
      const response = await this.axios.post<iGenericVerifyAssetsSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GenericVerifyAssetsRoute()}`,
        body
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
   * - **API Route**: `POST /api/v0/sendClaimAlerts`
   * - **SDK Function Call**: `await BitBadgesApi.sendClaimAlert(Body);`
   * - **Authentication**: Must be signed in and the manager of the collection.
   * - **CORS**: Restricted to only BitBadges official site.
   */
  public async sendClaimAlert(body: SendClaimAlertsBody): Promise<SendClaimAlertsSuccessResponse> {
    try {
      const response = await this.axios.post<iSendClaimAlertsSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.SendClaimAlertRoute()}`, body);
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
   * - **API Route**: `POST /api/v0/getFollowDetails`
   * - **SDK Function Call**: `await BitBadgesApi.getFollowDetails(Body);`
   */
  public async getFollowDetails(body: GetFollowDetailsBody): Promise<GetFollowDetailsSuccessResponse<T>> {
    return await BitBadgesUserInfo.GetFollowDetails(this, body);
  }

  /**
   * Gets claim alerts for a collection.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/getClaimAlerts`
   * - **SDK Function Call**: `await BitBadgesApi.getClaimAlerts(Body);`
   * - **Authentication**: Must be signed in and the manager of the collection.
   */
  public async getClaimAlerts(body: GetClaimAlertsForCollectionBody): Promise<GetClaimAlertsForCollectionSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetClaimAlertsForCollectionSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetClaimAlertsRoute()}`,
        body
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
   * - **API Route**: `POST /api/v0/getRefreshStatus`
   * - **SDK Function Call**: `await BitBadgesApi.getRefreshStatus(Body);`
   */
  public async getRefreshStatus(collectionId: NumberType): Promise<RefreshStatusSuccessResponse<NumberType>> {
    return await BitBadgesCollection.GetRefreshStatus(this, collectionId);
  }

  /**
   * Get maps by ID
   *
   * @remarks
   * - **API Route**: `POST /api/v0/maps`
   * - **SDK Function Call**: `await BitBadgesApi.getMaps(Body);`
   */
  public async getMaps(body: GetMapsBody): Promise<GetMapsSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetMapsSuccessResponse<string>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetMapsRoute()}`, body);
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
   * - **API Route**: `POST /api/v0/filterBadgesInCollection`
   * - **SDK Function Call**: `await BitBadgesApi.filterBadgesInCollection(Body);`
   */
  public async filterBadgesInCollection(body: FilterBadgesInCollectionBody): Promise<FilterBadgesInCollectionSuccessResponse<T>> {
    return await BitBadgesCollection.FilterBadgesInCollection(this, body);
  }

  /**
   * Generates an Apple wallet pass for a code.
   *
   * Returns application/vnd.apple.pkpass content type.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/appleWalletPass`
   * - **SDK Function Call**: `await BitBadgesApi.generateAppleWalletPass(Body);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.generateAppleWalletPass(Body);
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
  public async generateAppleWalletPass(body: GenerateAppleWalletPassBody): Promise<GenerateAppleWalletPassSuccessResponse> {
    try {
      const response = await this.axios.post<GenerateAppleWalletPassSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GenerateAppleWalletPassRoute()}`,
        body
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
   * - **SDK Function Call**: `await BitBadgesApi.getClaims(Body);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getClaims(Body);
   * console.log(res);
   * ```
   */
  public async getClaims(body: GetClaimsBody): Promise<GetClaimsSuccessResponse<T>> {
    try {
      const response = await this.axios.post<GetClaimsSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetClaimsRoute()}`, body);
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
   * - **SDK Function Call**: `await BitBadgesApi.getSecret(Body);`
   */
  public async getSecret(body: GetSecretBody): Promise<GetSecretSuccessResponse<T>> {
    try {
      const response = await this.axios.post<GetSecretSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetSecretRoute()}`, body);
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
   * - **API Route**: `POST /api/v0/secret/create`
   * - **SDK Function Call**: `await BitBadgesApi.createSecret(Body);`
   * - **Authentication**: Must be signed in.
   */
  public async createSecret(body: CreateSecretBody): Promise<CreateSecretSuccessResponse> {
    try {
      const response = await this.axios.post<CreateSecretSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CreateSecretRoute()}`, body);
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
   * - **API Route**: `POST /api/v0/secret/delete`
   * - **SDK Function Call**: `await BitBadgesApi.deleteSecret(Body);`
   * - **Authentication**: Must be signed in.
   */
  public async deleteSecret(body: DeleteSecretBody): Promise<DeleteSecretSuccessResponse> {
    try {
      const response = await this.axios.post<DeleteSecretSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.DeleteSecretRoute()}`, body);
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
   * - **API Route**: `POST /api/v0/user/secrets`
   * - **SDK Function Call**: `await BitBadgesApi.updateUserSecrets(Body);`
   * - **Authentication**: Must be signed in.
   */
  public async updateSecret(body: UpdateSecretBody): Promise<UpdateSecretSuccessResponse> {
    try {
      const response = await this.axios.post<UpdateSecretSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.UpdateSecretRoute()}`, body);
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
   * - **SDK Function Call**: `await BitBadgesApi.getDeveloperApp(Body);`
   */
  public async getDeveloperApps(body: GetDeveloperAppBody): Promise<GetDeveloperAppSuccessResponse> {
    try {
      const response = await this.axios.post<GetDeveloperAppSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetDeveloperAppRoute()}`, body);
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
   * - **API Route**: `POST /api/v0/developerApp/create`
   * - **SDK Function Call**: `await BitBadgesApi.createDeveloperApp(Body);`
   * - **Authentication**: Must be signed in.
   */
  public async createDeveloperApp(body: CreateDeveloperAppBody): Promise<CreateDeveloperAppSuccessResponse> {
    try {
      const response = await this.axios.post<CreateDeveloperAppSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CreateDeveloperAppRoute()}`,
        body
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
   * - **API Route**: `POST /api/v0/developerApp/delete`
   * - **SDK Function Call**: `await BitBadgesApi.deleteDeveloperApp(Body);`
   * - **Authentication**: Must be signed in.
   */
  public async deleteDeveloperApp(body: DeleteDeveloperAppBody): Promise<DeleteDeveloperAppSuccessResponse> {
    try {
      const response = await this.axios.post<DeleteDeveloperAppSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.DeleteDeveloperAppRoute()}`,
        body
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
   * - **API Route**: `POST /api/v0/developerApp/update`
   * - **SDK Function Call**: `await BitBadgesApi.updateUserDeveloperApps(Body);`
   * - **Authentication**: Must be signed in.
   */
  public async updateDeveloperApp(body: UpdateDeveloperAppBody): Promise<UpdateDeveloperAppSuccessResponse> {
    try {
      const response = await this.axios.post<UpdateDeveloperAppSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.UpdateDeveloperAppRoute()}`,
        body
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
   * - **SDK Function Call**: `await BitBadgesApi.getPlugins(Body);`
   */
  public async getPlugins(body: GetPluginBody): Promise<GetPluginSuccessResponse<T>> {
    try {
      const response = await this.axios.post<GetPluginSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetPluginRoute()}`, body);
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
   * - **API Route**: `POST /api/v0/developerApp/create`
   * - **SDK Function Call**: `await BitBadgesApi.createPlugin(Body);`
   * - **Authentication**: Must be signed in.
   */
  public async createPlugin(body: CreatePluginBody): Promise<CreatePluginSuccessResponse> {
    try {
      const response = await this.axios.post<CreatePluginSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CreatePluginRoute()}`, body);
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
   * - **API Route**: `POST /api/v0/claims/create`
   * - **SDK Function Call**: `await BitBadgesApi.createClaim(Body);`
   * - **Authentication**: Must be signed in.
   */
  public async createClaim(body: CreateClaimBody<T>): Promise<CreateClaimSuccessResponse> {
    try {
      const response = await this.axios.post<CreateClaimSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CreateClaimRoute()}`, body);
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
   * - **API Route**: `POST /api/v0/claims/delete`
   * - **SDK Function Call**: `await BitBadgesApi.deleteClaim(Body);`
   * - **Authentication**: Must be signed in.
   */
  public async deleteClaim(body: DeleteClaimBody): Promise<DeleteClaimSuccessResponse> {
    try {
      const response = await this.axios.post<DeleteClaimSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.DeleteClaimRoute()}`, body);
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
   * - **API Route**: `POST /api/v0/claims/update`
   * - **SDK Function Call**: `await BitBadgesApi.updateClaim(Body);`
   * - **Authentication**: Must be signed in.
   */
  public async updateClaim(body: UpdateClaimBody<T>): Promise<UpdateClaimSuccessResponse> {
    try {
      const response = await this.axios.post<UpdateClaimSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.UpdateClaimRoute()}`, body);
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
   * - **API Route**: `POST /api/v0/authorizations`
   * - **SDK Function Call**: `await BitBadgesApi.getActiveAuthorizations(Body);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getActiveAuthorizations(Body);
   * console.log(res);
   * ```
   *
   */
  public async getActiveAuthorizations(body: GetActiveAuthorizationsBody): Promise<GetActiveAuthorizationsSuccessResponse> {
    try {
      const response = await this.axios.post<GetActiveAuthorizationsSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetActiveAuthorizationsRoute()}`,
        body
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
   * - **SDK Function Call**: `await BitBadgesApi.oauthAuthorize(Body);`
   * - **Authentication**: Must be signed in.
   */
  public async getOauthAuthorizationCode(body: OauthAuthorizeBody): Promise<OauthAuthorizeSuccessResponse> {
    try {
      const response = await this.axios.post<OauthAuthorizeSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.OauthAuthorizeRoute()}`, body);
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
   * - **SDK Function Call**: `await BitBadgesApi.oauthToken(Body);`
   */
  public async getOauthAccessToken(body: OauthTokenBody): Promise<OauthTokenSuccessResponse> {
    try {
      const response = await this.axios.post<OauthTokenSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.OauthTokenRoute()}`, body);
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
   * - **SDK Function Call**: `await BitBadgesApi.oauthRevoke(Body);`
   */
  public async revokeOauthAuthorization(body: OauthRevokeBody): Promise<OauthRevokeSuccessResponse> {
    try {
      const response = await this.axios.post<OauthRevokeSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.OauthRevokeRoute()}`, body);
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
