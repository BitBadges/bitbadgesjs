import Joi from 'joi';
import type {
  GetCollectionForProtocolRouteRequestBody,
  GetCollectionForProtocolRouteSuccessResponse,
  GetProtocolsRouteRequestBody,
  GetProtocolsRouteSuccessResponse
} from './requests/protocols';
import { Protocol } from './requests/protocols';
import type { NumberType } from '@/common/string-numbers';
import { BitBadgesCollection } from './BitBadgesCollection';

import { BaseBitBadgesApi } from './base';
import type {
  UpdateAddressListsRouteRequestBody,
  UpdateAddressListsRouteSuccessResponse,
  GetAddressListsRouteRequestBody,
  GetAddressListsRouteSuccessResponse,
  DeleteAddressListsRouteRequestBody,
  DeleteAddressListsRouteSuccessResponse
} from './BitBadgesAddressList';
import { BitBadgesAddressList } from './BitBadgesAddressList';
import type {
  GetAccountsRouteRequestBody,
  GetAccountsRouteSuccessResponse,
  GetFollowDetailsRouteRequestBody,
  GetFollowDetailsRouteSuccessResponse
} from './BitBadgesUserInfo';
import { BitBadgesUserInfo } from './BitBadgesUserInfo';
import {
  iGetStatusRouteSuccessResponse,
  GetSearchRouteRequestBody,
  iGetSearchRouteSuccessResponse,
  CheckAndCompleteClaimRouteRequestBody,
  iCheckAndCompleteClaimRouteSuccessResponse,
  DeleteReviewRouteRequestBody,
  AddReviewForCollectionRouteRequestBody,
  AddReviewForUserRouteRequestBody,
  iAddReviewForUserRouteSuccessResponse,
  UpdateAccountInfoRouteRequestBody,
  iUpdateAccountInfoRouteSuccessResponse,
  AddBalancesToOffChainStorageRouteRequestBody,
  iAddBalancesToOffChainStorageRouteSuccessResponse,
  AddMetadataToIpfsRouteRequestBody,
  iAddMetadataToIpfsRouteSuccessResponse,
  AddApprovalDetailsToOffChainStorageRouteRequestBody,
  iAddApprovalDetailsToOffChainStorageRouteSuccessResponse,
  GetSignInChallengeRouteRequestBody,
  iGetSignInChallengeRouteSuccessResponse,
  VerifySignInRouteRequestBody,
  iVerifySignInRouteSuccessResponse,
  CheckSignInStatusRequestBody,
  iCheckSignInStatusRequestSuccessResponse,
  SignOutRequestBody,
  iSignOutSuccessResponse,
  GetBrowseCollectionsRouteRequestBody,
  iGetBrowseCollectionsRouteSuccessResponse,
  BroadcastTxRouteRequestBody,
  iBroadcastTxRouteSuccessResponse,
  SimulateTxRouteRequestBody,
  iSimulateTxRouteSuccessResponse,
  FetchMetadataDirectlyRouteRequestBody,
  iFetchMetadataDirectlyRouteSuccessResponse,
  GetTokensFromFaucetRouteRequestBody,
  iGetTokensFromFaucetRouteSuccessResponse,
  GetBlockinAuthCodeRouteRequestBody,
  iGetBlockinAuthCodeRouteSuccessResponse,
  CreateBlockinAuthCodeRouteRequestBody,
  iCreateBlockinAuthCodeRouteSuccessResponse,
  DeleteBlockinAuthCodeRouteRequestBody,
  iDeleteBlockinAuthCodeRouteSuccessResponse,
  GenericBlockinVerifyRouteRequestBody,
  iGenericBlockinVerifyRouteSuccessResponse,
  SendClaimAlertsRouteRequestBody,
  iSendClaimAlertsRouteSuccessResponse,
  GetClaimAlertsForCollectionRouteRequestBody,
  iGetClaimAlertsForCollectionRouteSuccessResponse,
  iDeleteReviewRouteSuccessResponse,
  GenerateAppleWalletPassRouteRequestBody,
  GetClaimsRouteRequestBody,
  GetClaimsRouteSuccessResponse
} from './requests/requests';
import {
  GetStatusRouteSuccessResponse,
  GetSearchRouteSuccessResponse,
  CheckAndCompleteClaimRouteSuccessResponse,
  DeleteReviewRouteSuccessResponse,
  AddReviewForCollectionRouteSuccessResponse,
  AddReviewForUserRouteSuccessResponse,
  UpdateAccountInfoRouteSuccessResponse,
  AddBalancesToOffChainStorageRouteSuccessResponse,
  AddMetadataToIpfsRouteSuccessResponse,
  AddApprovalDetailsToOffChainStorageRouteSuccessResponse,
  GetSignInChallengeRouteSuccessResponse,
  VerifySignInRouteSuccessResponse,
  CheckSignInStatusRequestSuccessResponse,
  SignOutSuccessResponse,
  GetBrowseCollectionsRouteSuccessResponse,
  BroadcastTxRouteSuccessResponse,
  SimulateTxRouteSuccessResponse,
  FetchMetadataDirectlyRouteSuccessResponse,
  GetTokensFromFaucetRouteSuccessResponse,
  GetBlockinAuthCodeRouteSuccessResponse,
  CreateBlockinAuthCodeRouteSuccessResponse,
  DeleteBlockinAuthCodeRouteSuccessResponse,
  GenericBlockinVerifyRouteSuccessResponse,
  SendClaimAlertsRouteSuccessResponse,
  GetClaimAlertsForCollectionRouteSuccessResponse,
  GenerateAppleWalletPassRouteSuccessResponse
} from './requests/requests';
import { BitBadgesApiRoutes } from './requests/routes';
import type { iBitBadgesApi } from './base';
import type {
  FilterBadgesInCollectionRequestBody,
  FilterBadgesInCollectionSuccessResponse,
  GetBadgeActivityRouteRequestBody,
  GetBadgeActivityRouteSuccessResponse,
  GetBadgeBalanceByAddressRouteRequestBody,
  GetBadgeBalanceByAddressRouteSuccessResponse,
  GetCollectionBatchRouteRequestBody,
  GetCollectionBatchRouteSuccessResponse,
  GetOwnersForBadgeRouteRequestBody,
  GetOwnersForBadgeRouteSuccessResponse,
  RefreshMetadataRouteRequestBody,
  RefreshMetadataRouteSuccessResponse,
  RefreshStatusRouteSuccessResponse
} from './requests/collections';

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
  public async getStatus(): Promise<GetStatusRouteSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetStatusRouteSuccessResponse<string>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetStatusRoute()}`);
      return new GetStatusRouteSuccessResponse(response.data).convert(this.ConvertFunction);
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
  public async getSearchResults(searchValue: string, requestBody?: GetSearchRouteRequestBody): Promise<GetSearchRouteSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetSearchRouteSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetSearchRoute(searchValue)}`,
        requestBody
      );
      return new GetSearchRouteSuccessResponse(response.data).convert(this.ConvertFunction);
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
  public async getCollections(requestBody: GetCollectionBatchRouteRequestBody): Promise<GetCollectionBatchRouteSuccessResponse<T>> {
    return await BitBadgesCollection.GetCollections(this, requestBody);
  }

  /**
   * Gets the owners for a specific badge in a collection
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/:badgeId/owners`
   * - **SDK Function Call**: `await BitBadgesApi.getOwnersForBadge(collectionId, badgeId, requestBody);`
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
    requestBody: GetOwnersForBadgeRouteRequestBody
  ): Promise<GetOwnersForBadgeRouteSuccessResponse<T>> {
    return await BitBadgesCollection.GetOwnersForBadge<T>(this, collectionId, badgeId, requestBody);
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
    cosmosAddress: string,
    requestBody?: GetBadgeBalanceByAddressRouteRequestBody
  ): Promise<GetBadgeBalanceByAddressRouteSuccessResponse<T>> {
    return await BitBadgesCollection.GetBadgeBalanceByAddress(this, collectionId, cosmosAddress, requestBody);
  }

  /**
   * Gets the activity for a specific badge in a collection
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/:badgeId/activity`
   * - **SDK Function Call**: `await BitBadgesApi.getBadgeActivity(collectionId, badgeId, requestBody);`
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
    requestBody: GetBadgeActivityRouteRequestBody
  ): Promise<GetBadgeActivityRouteSuccessResponse<T>> {
    return await BitBadgesCollection.GetBadgeActivity<T>(this, collectionId, badgeId, requestBody);
  }

  /**
   * Triggers a metadata refresh for a specific collection. BitBadges API uses a refresh queue system for fetching anything off-chain.
   * This will refetch any details for the collection (such as metadata, balances, approval details, etc).
   * Note it will reject if recently refreshed. Uses a cooldown of 5 minutes.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/refresh`
   * - **SDK Function Call**: `await BitBadgesApi.refreshMetadata(collectionId, requestBody);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.refreshMetadata(collectionId);
   * console.log(res);
   * ```
   */
  public async refreshMetadata(
    collectionId: NumberType,
    requestBody?: RefreshMetadataRouteRequestBody
  ): Promise<RefreshMetadataRouteSuccessResponse> {
    return await BitBadgesCollection.RefreshMetadata(this, collectionId, requestBody);
  }

  /**
   * For password based approvals, we hand out codes behind the scenes whenever a user requests a password.
   * This is to prevent replay attacks on the blockchain. This API call will return a valid code if a valid password is provided.
   *
   * Each address is limited to one code per password. If the password is provided again, they will receive the same code.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/password/:cid/:password`
   * - **SDK Function Call**: `await BitBadgesApi.checkAndCompleteClaim(collectionId, cid, password);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.checkAndCompleteClaim(collectionId, cid, password);
   * console.log(res);
   * ```
   */
  public async checkAndCompleteClaim(
    claimId: string,
    cosmosAddress: string,
    requestBody: CheckAndCompleteClaimRouteRequestBody
  ): Promise<CheckAndCompleteClaimRouteSuccessResponse> {
    try {
      if (!claimId) {
        throw new Error('claimId is required');
      }

      const response = await this.axios.post<iCheckAndCompleteClaimRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CheckAndCompleteClaimRoute(claimId, cosmosAddress)}`,
        requestBody
      );
      return new CheckAndCompleteClaimRouteSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.deleteReview(reviewId, requestBody);`
   * - **Authentication**: Must be signed in and the owner of the review.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.deleteReview(reviewId);
   * console.log(res);
   * ```
   */
  public async deleteReview(reviewId: string, requestBody?: DeleteReviewRouteRequestBody): Promise<DeleteReviewRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iDeleteReviewRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.DeleteReviewRoute(reviewId)}`,
        requestBody
      );
      return new DeleteReviewRouteSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Adds a new review for a collection.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/addReview`
   * - **SDK Function Call**: `await BitBadgesApi.addReviewForCollection(collectionId, requestBody);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addReviewForCollection(collectionId, requestBody);
   * console.log(res);
   * ```
   */
  public async addReviewForCollection(
    collectionId: NumberType,
    requestBody: AddReviewForCollectionRouteRequestBody
  ): Promise<AddReviewForCollectionRouteSuccessResponse> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await this.axios.post(`${this.BACKEND_URL}${BitBadgesApiRoutes.AddReviewForCollectionRoute(collectionId)}`, requestBody);
      return new AddReviewForCollectionRouteSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.getAccounts(requestBody);`
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
  public async getAccounts(requestBody: GetAccountsRouteRequestBody): Promise<GetAccountsRouteSuccessResponse<T>> {
    return await BitBadgesUserInfo.GetAccounts(this, requestBody);
  }

  /**
   * Adds a review for a user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/user/:addressOrUsername/addReview`
   * - **SDK Function Call**: `await BitBadgesApi.addReviewForUser(addressOrUsername, requestBody);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addReviewForUser(addressOrUsername, requestBody);
   * console.log(res);
   * ```
   */
  public async addReviewForUser(
    addressOrUsername: string,
    requestBody: AddReviewForUserRouteRequestBody
  ): Promise<AddReviewForUserRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iAddReviewForUserRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.AddReviewForUserRoute(addressOrUsername)}`,
        requestBody
      );
      return new AddReviewForUserRouteSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates the profile / account information for a user. We will only update the provided fields.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/user/updateAccount`
   * - **SDK Function Call**: `await BitBadgesApi.updateAccountInfo(requestBody);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.updateAccountInfo(requestBody);
   * console.log(res);
   * ```
   */
  public async updateAccountInfo(requestBody: UpdateAccountInfoRouteRequestBody): Promise<UpdateAccountInfoRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iUpdateAccountInfoRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.UpdateAccountInfoRoute()}`,
        requestBody
      );
      return new UpdateAccountInfoRouteSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.addBalancesToOffChainStorage(requestBody);`
   * - **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addBalancesToOffChainStorage(requestBody);
   * console.log(res);
   * ```
   */
  public async addBalancesToOffChainStorage(
    requestBody: AddBalancesToOffChainStorageRouteRequestBody
  ): Promise<AddBalancesToOffChainStorageRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iAddBalancesToOffChainStorageRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.AddBalancesToOffChainStorageRoute()}`,
        requestBody
      );
      return new AddBalancesToOffChainStorageRouteSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }
  /**
   * Adds metadata to IPFS.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addMetadataToIpfs`
   * - **SDK Function Call**: `await BitBadgesApi.addMetadataToIpfs(requestBody);`
   * - **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addMetadataToIpfs(requestBody);
   * console.log(res);
   * ```
   */
  public async addMetadataToIpfs(requestBody: AddMetadataToIpfsRouteRequestBody): Promise<AddMetadataToIpfsRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iAddMetadataToIpfsRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.AddMetadataToIpfsRoute()}`,
        requestBody
      );
      return new AddMetadataToIpfsRouteSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.addApprovalDetailsToOffChainStorage(requestBody);`
   * - **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.addApprovalDetailsToOffChainStorage(requestBody);
   * console.log(res);
   * ```
   */
  public async addApprovalDetailsToOffChainStorage(
    requestBody: AddApprovalDetailsToOffChainStorageRouteRequestBody
  ): Promise<AddApprovalDetailsToOffChainStorageRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iAddApprovalDetailsToOffChainStorageRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.AddApprovalDetailsToOffChainStorageRoute()}`,
        requestBody
      );
      return new AddApprovalDetailsToOffChainStorageRouteSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.getSignInChallenge(requestBody);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getSignInChallenge(requestBody);
   * console.log(res);
   * ```
   */
  public async getSignInChallenge(requestBody: GetSignInChallengeRouteRequestBody): Promise<GetSignInChallengeRouteSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetSignInChallengeRouteSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetSignInChallengeRoute()}`,
        requestBody
      );
      return new GetSignInChallengeRouteSuccessResponse(response.data).convert(this.ConvertFunction);
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
   * - **SDK Function Call**: `await BitBadgesApi.verifySignIn(requestBody);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.verifySignIn(requestBody);
   * console.log(res);
   * ```
   */
  public async verifySignIn(requestBody: VerifySignInRouteRequestBody): Promise<VerifySignInRouteSuccessResponse> {
    try {
      const body = requestBody;
      const response = await this.axios.post<iVerifySignInRouteSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.VerifySignInRoute()}`, body);
      return new VerifySignInRouteSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.checkIfSignedIn(requestBody);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   */
  public async checkIfSignedIn(requestBody: CheckSignInStatusRequestBody): Promise<CheckSignInStatusRequestSuccessResponse> {
    try {
      const body = requestBody;
      const response = await this.axios.post<iCheckSignInStatusRequestSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CheckIfSignedInRoute()}`,
        body
      );
      return new CheckSignInStatusRequestSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.signOut(requestBody);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   */
  public async signOut(requestBody?: SignOutRequestBody): Promise<SignOutSuccessResponse> {
    try {
      const response = await this.axios.post<iSignOutSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.SignOutRoute()}`, requestBody);
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
   * - **SDK Function Call**: `await BitBadgesApi.getBrowseCollections(requestBody);`
   */
  public async getBrowseCollections(requestBody?: GetBrowseCollectionsRouteRequestBody): Promise<GetBrowseCollectionsRouteSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetBrowseCollectionsRouteSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetBrowseCollectionsRoute()}`,
        requestBody
      );
      return new GetBrowseCollectionsRouteSuccessResponse(response.data).convert(this.ConvertFunction);
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
   * - **SDK Function Call**: `await BitBadgesApi.broadcastTx(requestBody);`
   * - **Tutorial**: See Broadcasting Transactions tutorial on the official docs.
   *
   * Also, consider checking out [Broadcast UI](https://bitbadges.io/dev/broadcast), so you can simply copy and paste your transaction to a UI. All signing, API communication, etc is outsourced to the UI.
   */
  public async broadcastTx(requestBody: BroadcastTxRouteRequestBody | string): Promise<BroadcastTxRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iBroadcastTxRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.BroadcastTxRoute()}`,
        requestBody
      );
      return new BroadcastTxRouteSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.simulateTx(requestBody);`
   * - **Tutorial**: See Broadcasting Transactions tutorial on the official docs.
   *
   * This means that it will return the gas used and any errors that occur on a dry run. Should be used before broadcasting a transaction. Does not require signatures.
   */
  public async simulateTx(requestBody: SimulateTxRouteRequestBody | string): Promise<SimulateTxRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iSimulateTxRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SimulateTxRoute()}`,
        requestBody
      );
      return new SimulateTxRouteSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.fetchMetadataDirectly(requestBody);`
   * - **CORS**: Restricted to only BitBadges official site.
   */
  public async fetchMetadataDirectly(requestBody: FetchMetadataDirectlyRouteRequestBody): Promise<FetchMetadataDirectlyRouteSuccessResponse<T>> {
    try {
      const error = requestBody.uris.find((uri) => Joi.string().uri().required().validate(uri).error);
      if (error) {
        throw `Invalid URIs`;
      }

      const response = await this.axios.post<iFetchMetadataDirectlyRouteSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.FetchMetadataDirectlyRoute()}`,
        requestBody
      );
      return new FetchMetadataDirectlyRouteSuccessResponse(response.data).convert(this.ConvertFunction);
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
   * - **SDK Function Call**: `await BitBadgesApi.getTokensFromFaucet(requestBody);`
   * - **Authentication**: Must be signed in.
   */
  public async getTokensFromFaucet(requestBody?: GetTokensFromFaucetRouteRequestBody): Promise<GetTokensFromFaucetRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iGetTokensFromFaucetRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetTokensFromFaucetRoute()}`,
        requestBody
      );
      return new GetTokensFromFaucetRouteSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates or creates address lists stored by BitBadges centralized servers.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addressList/update`
   * - **SDK Function Call**: `await BitBadgesApi.updateAddressLists(requestBody);`
   *
   * Must be created off-chain. For on-chain, they must be created through MsgCreateAddressMappings. Creator can update their created lists with no restrictions. Else, requires an edit key.
   */
  public async updateAddressLists(requestBody: UpdateAddressListsRouteRequestBody<NumberType>): Promise<UpdateAddressListsRouteSuccessResponse> {
    return await BitBadgesAddressList.UpdateAddressList(this, requestBody);
  }

  /**
   * Gets address lists. Can be on-chain or off-chain.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addressList`
   * - **SDK Function Call**: `await BitBadgesApi.getAddressLists(requestBody);`
   *
   * Note for reserved lists, you can use getReservedAddressList from the SDK.
   */
  public async getAddressLists(requestBody: GetAddressListsRouteRequestBody): Promise<GetAddressListsRouteSuccessResponse<T>> {
    return await BitBadgesAddressList.GetAddressLists(this, requestBody);
  }

  /**
   * Deletes address lists. Must be created off-chain.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addressList/delete`
   * - **SDK Function Call**: `await BitBadgesApi.deleteAddressLists(requestBody);`
   * - **Authentication**: Must be signed in and the creator of the address list.
   */
  public async deleteAddressLists(requestBody: DeleteAddressListsRouteRequestBody): Promise<DeleteAddressListsRouteSuccessResponse> {
    return await BitBadgesAddressList.DeleteAddressList(this, requestBody);
  }

  /**
   * Gets a Blockin authentication code. This is used for signing in with Blockin at in-person events. Anyone with the signature is able to fetch the preimage message.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/authCode`
   * - **SDK Function Call**: `await BitBadgesApi.getAuthCode(requestBody);`
   */
  public async getAuthCode(requestBody?: GetBlockinAuthCodeRouteRequestBody): Promise<GetBlockinAuthCodeRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iGetBlockinAuthCodeRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetAuthCodeRoute()}`,
        requestBody
      );
      return new GetBlockinAuthCodeRouteSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates a Blockin authentication code. This is used for signing in with Blockin at in-person events.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/authCode/create`
   * - **SDK Function Call**: `await BitBadgesApi.createAuthCode(requestBody);`
   */
  public async createAuthCode(requestBody?: CreateBlockinAuthCodeRouteRequestBody): Promise<CreateBlockinAuthCodeRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iCreateBlockinAuthCodeRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CreateAuthCodeRoute()}`,
        requestBody
      );
      return new CreateBlockinAuthCodeRouteSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes a Blockin authentication code. This is used for signing in with Blockin at in-person events.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/authCode/delete`
   * - **SDK Function Call**: `await BitBadgesApi.deleteAuthCode(requestBody);`
   * - **Authentication**: Must be signed in and the owner of the auth code.
   */
  public async deleteAuthCode(requestBody?: DeleteBlockinAuthCodeRouteRequestBody): Promise<DeleteBlockinAuthCodeRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iDeleteBlockinAuthCodeRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.DeleteAuthCodeRoute()}`,
        requestBody
      );
      return new DeleteBlockinAuthCodeRouteSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * A generic route for verifying Blockin sign in requests. Used as a helper if implementing Blockin on your own.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/auth/verifyGeneric`
   * - **SDK Function Call**: `await BitBadgesApi.verifySignInGeneric(requestBody);`
   */
  public async verifySignInGeneric(requestBody: GenericBlockinVerifyRouteRequestBody): Promise<GenericBlockinVerifyRouteSuccessResponse> {
    try {
      const body = requestBody;
      const response = await this.axios.post<iGenericBlockinVerifyRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GenericVerifyRoute()}`,
        body
      );
      return new GenericBlockinVerifyRouteSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.sendClaimAlert(requestBody);`
   * - **Authentication**: Must be signed in and the manager of the collection.
   * - **CORS**: Restricted to only BitBadges official site.
   */
  public async sendClaimAlert(requestBody: SendClaimAlertsRouteRequestBody): Promise<SendClaimAlertsRouteSuccessResponse> {
    try {
      const response = await this.axios.post<iSendClaimAlertsRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SendClaimAlertRoute()}`,
        requestBody
      );
      return new SendClaimAlertsRouteSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.getFollowDetails(requestBody);`
   */
  public async getFollowDetails(requestBody: GetFollowDetailsRouteRequestBody): Promise<GetFollowDetailsRouteSuccessResponse<T>> {
    return await BitBadgesUserInfo.GetFollowDetails(this, requestBody);
  }

  /**
   * Gets claim alerts for a collection.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/getClaimAlerts`
   * - **SDK Function Call**: `await BitBadgesApi.getClaimAlerts(requestBody);`
   * - **Authentication**: Must be signed in and the manager of the collection.
   */
  public async getClaimAlerts(requestBody: GetClaimAlertsForCollectionRouteRequestBody): Promise<GetClaimAlertsForCollectionRouteSuccessResponse<T>> {
    try {
      const response = await this.axios.post<iGetClaimAlertsForCollectionRouteSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetClaimAlertsRoute()}`,
        requestBody
      );
      return new GetClaimAlertsForCollectionRouteSuccessResponse(response.data).convert(this.ConvertFunction);
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
   * - **SDK Function Call**: `await BitBadgesApi.getRefreshStatus(requestBody);`
   */
  public async getRefreshStatus(collectionId: NumberType): Promise<RefreshStatusRouteSuccessResponse<NumberType>> {
    return await BitBadgesCollection.GetRefreshStatus(this, collectionId);
  }

  /**
   * Get protocol details by name.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/getProtocol`
   * - **SDK Function Call**: `await BitBadgesApi.getProtocol(requestBody);`
   */
  public async getProtocol(requestBody: GetProtocolsRouteRequestBody): Promise<GetProtocolsRouteSuccessResponse> {
    return await Protocol.GetProtocols(this, requestBody);
  }

  /**
   * Gets the collection ID set by a user for a protocol.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/getCollectionForProtocol`
   * - **SDK Function Call**: `await BitBadgesApi.getCollectionForProtocol(requestBody);`
   */
  public async getCollectionForProtocol(
    requestBody: GetCollectionForProtocolRouteRequestBody
  ): Promise<GetCollectionForProtocolRouteSuccessResponse<T>> {
    return await Protocol.GetCollectionForProtocol(this, requestBody);
  }

  /**
   * Filters badges in a collection based on multiple filter values.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/filterBadgesInCollection`
   * - **SDK Function Call**: `await BitBadgesApi.filterBadgesInCollection(requestBody);`
   */
  public async filterBadgesInCollection(requestBody: FilterBadgesInCollectionRequestBody): Promise<FilterBadgesInCollectionSuccessResponse<T>> {
    return await BitBadgesCollection.FilterBadgesInCollection(this, requestBody);
  }

  public async generateAppleWalletPass(requestBody: GenerateAppleWalletPassRouteRequestBody): Promise<GenerateAppleWalletPassRouteSuccessResponse> {
    try {
      const response = await this.axios.post<GenerateAppleWalletPassRouteSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GenerateAppleWalletPassRoute()}`,
        requestBody
      );
      return new GenerateAppleWalletPassRouteSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getClaims(requestBody: GetClaimsRouteRequestBody): Promise<GetClaimsRouteSuccessResponse<T>> {
    try {
      const response = await this.axios.post<GetClaimsRouteSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetClaimsRoute()}`, requestBody);
      return new GetClaimsRouteSuccessResponse(response.data).convert(this.ConvertFunction);
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
