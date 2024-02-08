import axiosApi from "axios";
import { BigIntify, NumberType } from "..";
import Joi from "joi";
import { AddAddressToSurveyRouteRequestBody, AddAddressToSurveyRouteSuccessResponse, AddApprovalDetailsToOffChainStorageRouteRequestBody, AddApprovalDetailsToOffChainStorageRouteSuccessResponse, AddBalancesToOffChainStorageRouteRequestBody, AddBalancesToOffChainStorageRouteSuccessResponse, AddMetadataToIpfsRouteRequestBody, AddMetadataToIpfsRouteSuccessResponse, AddReviewForCollectionRouteRequestBody, AddReviewForCollectionRouteSuccessResponse, AddReviewForUserRouteRequestBody, AddReviewForUserRouteSuccessResponse, BroadcastTxRouteRequestBody, BroadcastTxRouteSuccessResponse, CheckSignInStatusRequestBody, CheckSignInStatusRequestSuccessResponse, CreateBlockinAuthCodeRouteRequestBody, CreateBlockinAuthCodeRouteResponse, CreateBlockinAuthCodeRouteSuccessResponse, DeleteAddressListsRouteRequestBody, DeleteAddressListsRouteSuccessResponse, DeleteBlockinAuthCodeRouteRequestBody, DeleteBlockinAuthCodeRouteResponse, DeleteBlockinAuthCodeRouteSuccessResponse, DeleteReviewRouteRequestBody, DeleteReviewRouteSuccessResponse, ErrorResponse, FetchMetadataDirectlyRouteRequestBody, FetchMetadataDirectlyRouteSuccessResponse, FilterBadgesInCollectionRequestBody, FilterBadgesInCollectionSuccessResponse, GenericBlockinVerifyRouteRequestBody, GenericBlockinVerifyRouteSuccessResponse, GetAccountsRouteRequestBody, GetAccountsRouteSuccessResponse, GetAddressListsRouteRequestBody, GetAddressListsRouteSuccessResponse, GetAllCodesAndPasswordsRouteRequestBody, GetAllCodesAndPasswordsRouteSuccessResponse, GetBadgeActivityRouteRequestBody, GetBadgeActivityRouteSuccessResponse, GetBadgeBalanceByAddressRouteRequestBody, GetBadgeBalanceByAddressRouteSuccessResponse, GetBlockinAuthCodeRouteRequestBody, GetBlockinAuthCodeRouteSuccessResponse, GetBrowseCollectionsRouteRequestBody, GetBrowseCollectionsRouteSuccessResponse, GetClaimAlertsForCollectionRouteRequestBody, GetClaimAlertsForCollectionRouteSuccessResponse, GetCodeForPasswordRouteRequestBody, GetCodeForPasswordRouteSuccessResponse, GetCollectionBatchRouteRequestBody, GetCollectionBatchRouteSuccessResponse, GetCollectionForProtocolRouteRequestBody, GetCollectionForProtocolRouteSuccessResponse, GetFollowDetailsRouteRequestBody, GetFollowDetailsRouteSuccessResponse, GetOwnersForBadgeRouteRequestBody, GetOwnersForBadgeRouteSuccessResponse, GetProtocolsRouteRequestBody, GetProtocolsRouteSuccessResponse, GetSearchRouteRequestBody, GetSearchRouteSuccessResponse, GetSignInChallengeRouteRequestBody, GetSignInChallengeRouteSuccessResponse, GetStatusRouteSuccessResponse, GetTokensFromFaucetRouteRequestBody, GetTokensFromFaucetRouteSuccessResponse, RefreshMetadataRouteRequestBody, RefreshMetadataRouteSuccessResponse, RefreshStatusRouteSuccessResponse, SendClaimAlertsRouteRequestBody, SendClaimAlertsRouteSuccessResponse, SignOutRequestBody, SignOutSuccessResponse, SimulateTxRouteRequestBody, SimulateTxRouteSuccessResponse, UpdateAccountInfoRouteRequestBody, UpdateAccountInfoRouteSuccessResponse, UpdateAddressListsRouteRequestBody, UpdateAddressListsRouteSuccessResponse, VerifySignInRouteRequestBody, VerifySignInRouteSuccessResponse, convertAddApprovalDetailsToOffChainStorageRouteSuccessResponse, convertAddBalancesToOffChainStorageRouteSuccessResponse, convertAddMetadataToIpfsRouteSuccessResponse, convertAddReviewForCollectionRouteSuccessResponse, convertAddReviewForUserRouteSuccessResponse, convertBroadcastTxRouteSuccessResponse, convertCheckSignInStatusRequestSuccessResponse, convertDeleteAddressListsRouteSuccessResponse, convertDeleteReviewRouteSuccessResponse, convertFetchMetadataDirectlyRouteSuccessResponse, convertFilterBadgesInCollectionSuccessResponse, convertGetAccountsRouteSuccessResponse, convertGetAddressListsRouteSuccessResponse, convertGetAllCodesAndPasswordsRouteSuccessResponse, convertGetBadgeActivityRouteSuccessResponse, convertGetBadgeBalanceByAddressRouteSuccessResponse, convertGetBrowseCollectionsRouteSuccessResponse, convertGetClaimAlertsForCollectionRouteSuccessResponse, convertGetCodeForPasswordRouteSuccessResponse, convertGetCollectionBatchRouteSuccessResponse, convertGetCollectionForProtocolRouteSuccessResponse, convertGetFollowDetailsRouteSuccessResponse, convertGetOwnersForBadgeRouteSuccessResponse, convertGetProtocolsRouteSuccessResponse, convertGetSearchRouteSuccessResponse, convertGetSignInChallengeRouteSuccessResponse, convertGetStatusRouteSuccessResponse, convertGetTokensFromFaucetRouteSuccessResponse, convertRefreshMetadataRouteSuccessResponse, convertRefreshStatusRouteSuccessResponse, convertSignOutSuccessResponse, convertSimulateTxRouteSuccessResponse, convertUpdateAccountInfoRouteSuccessResponse, convertUpdateAddressListsRouteSuccessResponse, convertVerifySignInRouteSuccessResponse } from "./types/api";
import { AddAddressToSurveyRoute, AddApprovalDetailsToOffChainStorageRoute, AddBalancesToOffChainStorageRoute, AddMetadataToIpfsRoute, AddReviewForCollectionRoute, AddReviewForUserRoute, BroadcastTxRoute, CheckIfSignedInRoute, CreateAuthCodeRoute, DeleteAddressListRoute, DeleteAuthCodeRoute, DeleteReviewRoute, FetchMetadataDirectlyRoute, FilterBadgesInCollectionRoute, GenericVerifyRoute, GetAccountsRoute, GetAddressListsRoute, GetAllPasswordsAndCodesRoute, GetAuthCodeRoute, GetBadgeActivityRoute, GetBadgeBalanceByAddressRoute, GetBrowseCollectionsRoute, GetClaimAlertsRoute, GetCodeForPasswordRoute, GetCollectionBatchRoute, GetCollectionForProtocolRoute, GetFollowDetailsRoute, GetOwnersForBadgeRoute, GetProtocolsRoute, GetRefreshStatusRoute, GetSearchRoute, GetSignInChallengeRoute, GetStatusRoute, GetTokensFromFaucetRoute, RefreshMetadataRoute, SendClaimAlertRoute, SignOutRoute, SimulateTxRoute, UpdateAccountInfoRoute, UpdateAddressListRoute, VerifySignInRoute } from "./types/routes";
import { BitBadgesCollection } from "./types/collections";
import { pruneMetadataToFetch } from "./metadataIds";
import { updateAccountWithResponse, updateCollectionWithResponse } from "./api-utils";
import { BitBadgesUserInfo } from "./types/users";

type DesiredNumberType = bigint;

export interface BitBadgesApiDetails {
  apiUrl?: string;
  apiKey?: string;
  convertFunction: (num: NumberType) => DesiredNumberType;
}

/**
 * This is the BitBadgesAPI class which provides all typed API calls to the BitBadges API.
 * See official documentation for more details and examples. Must pass in a valid API key. To get an API key, reach out to the team.
 *
 * convertFunction is used to convert any responses returned by the API to your desired NumberType.
 * ```typescript
 * import { BigIntify, Stringify, Numberify, BitBadgesAPI } from "bitbadgesjs-sdk";
 * const BitBadgesApi = new BitBadgesAPI({ convertFunction: BigIntify, ....})
 * ```
 *
 * By default, we use the official backend API URL. You can override this by passing in a custom apiUrl.
 *
 * @category API / Indexer
 */
export class BitBadgesAPI {
  private axios = axiosApi.create({
    withCredentials: true,
    headers: {
      "Content-type": "application/json",
      "x-api-key": process.env.BITBADGES_API_KEY,
    },
  });
  private BACKEND_URL = process.env.BITBADGES_API_URL || "https://api.bitbadges.io";
  private ConvertFunction = BigIntify;
  private apiKey = process.env.BITBADGES_API_KEY;

  constructor(apiDetails: BitBadgesApiDetails) {
    this.BACKEND_URL = apiDetails.apiUrl || this.BACKEND_URL;
    this.ConvertFunction = apiDetails.convertFunction || this.ConvertFunction;
    this.apiKey = apiDetails.apiKey || this.apiKey;
    this.axios = axiosApi.create({
      withCredentials: true,
      headers: {
        "Content-type": "application/json",
        "x-api-key": this.apiKey,
      },
    });
  }

  private async handleApiError(error: any): Promise<void> {
    console.error(error);

    if (error && error.response && error.response.data) {
      const data: ErrorResponse = error.response.data;
      return Promise.reject(data);
    } else {
      return Promise.reject(error);
    }
  }

  private assertPositiveInteger(num: NumberType) {
    try {
      BigInt(num);
    } catch (e) {
      throw new Error(`Number is not a valid integer: ${num}`);
    }

    if (BigInt(num) <= 0) {
      throw new Error(`Number is not a positive integer: ${num}`);
    }
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
  public async getStatus(): Promise<GetStatusRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetStatusRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetStatusRoute()}`);
      return convertGetStatusRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async getSearchResults(searchValue: string, requestBody?: GetSearchRouteRequestBody): Promise<GetSearchRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetSearchRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetSearchRoute(searchValue)}`, requestBody);
      return convertGetSearchRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async getCollections(requestBody: GetCollectionBatchRouteRequestBody): Promise<GetCollectionBatchRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetCollectionBatchRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetCollectionBatchRoute()}`, requestBody);
      return convertGetCollectionBatchRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets badge collections and accompying details. This returns updated collections using your currently cached collections.
   * This handles pagination, appending metadata, and such. It also prunes the request's metadataToFetch to only fetch non-fetched metadata.
   *
   * All previously fetched collections are required to be present in the currCollections array for intended behavior.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/batch`
   * - **SDK Function Call**: `await BitBadgesApi.getCollectionsAndUpdate(requestBody, currCollections);`
   * - **Tutorial**: Refer to the [Fetching Collections tutorial](https://docs.bitbadges.io/for-developers/bitbadges-api/tutorials/fetching-collections) on the official documentation.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getCollectionsAndUpdate([{ collectionId, metadataToFetch: { badgeIds: [{ start: 1n, end: 10n }] } }], currCollections);
   * const collection = res.collections[0];
   * ```
   */
  public async getCollectionsAndUpdate(requestBody: GetCollectionBatchRouteRequestBody, currCollections: BitBadgesCollection<bigint>[]): Promise<BitBadgesCollection<bigint>[]> {
    try {
      for (const collectionToFetch of requestBody.collectionsToFetch) {
        const matchingCollection = currCollections.find(x => BigInt(x.collectionId) === BigInt(collectionToFetch.collectionId));
        if (!matchingCollection) continue;

        collectionToFetch.metadataToFetch = pruneMetadataToFetch(matchingCollection, collectionToFetch.metadataToFetch);
      }

      const response = await this.axios.post<GetCollectionBatchRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetCollectionBatchRoute()}`, requestBody);
      const convertedResponse = convertGetCollectionBatchRouteSuccessResponse(response.data, this.ConvertFunction);

      const updatedCollections: BitBadgesCollection<bigint>[] = [];
      for (const collectionRes of convertedResponse.collections) {
        const matchingCollection = currCollections.find(x => BigInt(x.collectionId) === BigInt(collectionRes.collectionId));
        if (!matchingCollection) {
          updatedCollections.push(collectionRes);
        } else {
          const updatedRes = updateCollectionWithResponse(matchingCollection, collectionRes);
          updatedCollections.push(updatedRes);
        }
      }

      return updatedCollections;
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
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
  public async getOwnersForBadge(collectionId: NumberType, badgeId: NumberType, requestBody: GetOwnersForBadgeRouteRequestBody): Promise<GetOwnersForBadgeRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);
      this.assertPositiveInteger(badgeId);

      const response = await this.axios.post<GetOwnersForBadgeRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetOwnersForBadgeRoute(collectionId, badgeId)}`, requestBody);
      return convertGetOwnersForBadgeRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
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
  public async getBadgeBalanceByAddress(collectionId: NumberType, cosmosAddress: string, requestBody?: GetBadgeBalanceByAddressRouteRequestBody): Promise<GetBadgeBalanceByAddressRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await this.axios.post<GetBadgeBalanceByAddressRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetBadgeBalanceByAddressRoute(collectionId, cosmosAddress)}`, requestBody);
      return convertGetBadgeBalanceByAddressRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
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
  public async getBadgeActivity(collectionId: NumberType, badgeId: NumberType, requestBody: GetBadgeActivityRouteRequestBody): Promise<GetBadgeActivityRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);
      this.assertPositiveInteger(badgeId);
      const response = await this.axios.post<GetBadgeActivityRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetBadgeActivityRoute(collectionId, badgeId)}`, requestBody);
      return convertGetBadgeActivityRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
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
  public async refreshMetadata(collectionId: NumberType, requestBody?: RefreshMetadataRouteRequestBody): Promise<RefreshMetadataRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await this.axios.post<RefreshMetadataRouteSuccessResponse<string>>(`${this.BACKEND_URL}${RefreshMetadataRoute(collectionId)}`, requestBody);
      return convertRefreshMetadataRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the password and/or codes for a specific approval.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/codes`
   * - **SDK Function Call**: `await BitBadgesApi.getAllPasswordsAndCodes(collectionId, requestBody);`
   * - **Authentication**: Must be signed in and the manager of the requested collection.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getAllPasswordsAndCodes(collectionId);
   * console.log(res);
   * ```
   */
  public async getAllPasswordsAndCodes(collectionId: NumberType, requestBody?: GetAllCodesAndPasswordsRouteRequestBody): Promise<GetAllCodesAndPasswordsRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await this.axios.post<GetAllCodesAndPasswordsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetAllPasswordsAndCodesRoute(collectionId)}`, requestBody);
      return convertGetAllCodesAndPasswordsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * For password based approvals, we hand out codes behind the scenes whenever a user requests a password.
   * This is to prevent replay attacks on the blockchain. This API call will return a valid code if a valid password is provided.
   *
   * Each address is limited to one code per password. If the password is provided again, they will receive the same code.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/password/:cid/:password`
   * - **SDK Function Call**: `await BitBadgesApi.getCodeForPassword(collectionId, cid, password);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getCodeForPassword(collectionId, cid, password);
   * console.log(res);
   * ```
   */
  public async getCodeForPassword(collectionId: NumberType, cid: string, password: string, requestBody?: GetCodeForPasswordRouteRequestBody): Promise<GetCodeForPasswordRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await this.axios.post<GetCodeForPasswordRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetCodeForPasswordRoute(collectionId, cid, password)}`, requestBody);
      return convertGetCodeForPasswordRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async deleteReview(reviewId: string, requestBody?: DeleteReviewRouteRequestBody): Promise<DeleteReviewRouteSuccessResponse<DesiredNumberType>> {
    try {

      const response = await this.axios.post<DeleteReviewRouteSuccessResponse<string>>(`${this.BACKEND_URL}${DeleteReviewRoute(reviewId)}`, requestBody);
      return convertDeleteReviewRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async addReviewForCollection(collectionId: NumberType, requestBody: AddReviewForCollectionRouteRequestBody): Promise<AddReviewForCollectionRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await this.axios.post<AddReviewForCollectionRouteSuccessResponse<string>>(`${this.BACKEND_URL}${AddReviewForCollectionRoute(collectionId)}`, requestBody);
      return convertAddReviewForCollectionRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async getAccounts(requestBody: GetAccountsRouteRequestBody): Promise<GetAccountsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetAccountsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetAccountsRoute()}`, requestBody);
      return convertGetAccountsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets accounts and accompying details and handles pagination, appending metadata, and so on to previously fetched accounts.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/user/batch`
   * - **SDK Function Call**: `await BitBadgesApi.getAccounts(requestBody);`
   * - **Tutorial**: See the [Fetching Accounts tutoral](https://docs.bitbadges.io/for-developers/bitbadges-api/tutorials/fetching-accounts) on the official docs.
   * - **Authentication**: Must be signed in, if fetching private information such as private lists or auth codes. If fetching public information only, no sign in required.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getAccountsAndUpdate(requestBody, currAccounts);
   * console.log(res);
   * ```
   */
  public async getAccountsAndUpdate(requestBody: GetAccountsRouteRequestBody, currAccounts: BitBadgesUserInfo<bigint>[]): Promise<BitBadgesUserInfo<bigint>[]> {
    try {
      const response = await this.axios.post<GetAccountsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetAccountsRoute()}`, requestBody);
      const convertedResponse = convertGetAccountsRouteSuccessResponse(response.data, this.ConvertFunction);

      const updatedAccounts: BitBadgesUserInfo<bigint>[] = [];
      for (const accountRes of convertedResponse.accounts) {
        const matchingAccount = currAccounts.find(x => x.address === accountRes.address);
        if (!matchingAccount) {
          updatedAccounts.push(accountRes);
        } else {
          const updatedRes = updateAccountWithResponse(matchingAccount, accountRes);
          updatedAccounts.push(updatedRes);
        }
      }

      return updatedAccounts;
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
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
  public async addReviewForUser(addressOrUsername: string, requestBody: AddReviewForUserRouteRequestBody): Promise<AddReviewForUserRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<AddReviewForUserRouteSuccessResponse<string>>(`${this.BACKEND_URL}${AddReviewForUserRoute(addressOrUsername)}`, requestBody);
      return convertAddReviewForUserRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async updateAccountInfo(requestBody: UpdateAccountInfoRouteRequestBody<NumberType>): Promise<UpdateAccountInfoRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<UpdateAccountInfoRouteSuccessResponse<string>>(`${this.BACKEND_URL}${UpdateAccountInfoRoute()}`, requestBody);
      return convertUpdateAccountInfoRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async addBalancesToOffChainStorage(requestBody: AddBalancesToOffChainStorageRouteRequestBody): Promise<AddBalancesToOffChainStorageRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<AddBalancesToOffChainStorageRouteSuccessResponse<string>>(`${this.BACKEND_URL}${AddBalancesToOffChainStorageRoute()}`, requestBody);
      return convertAddBalancesToOffChainStorageRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async addMetadataToIpfs(requestBody: AddMetadataToIpfsRouteRequestBody): Promise<AddMetadataToIpfsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<AddMetadataToIpfsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${AddMetadataToIpfsRoute()}`, requestBody);
      return convertAddMetadataToIpfsRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async addApprovalDetailsToOffChainStorage(requestBody: AddApprovalDetailsToOffChainStorageRouteRequestBody): Promise<AddApprovalDetailsToOffChainStorageRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<AddApprovalDetailsToOffChainStorageRouteSuccessResponse<string>>(`${this.BACKEND_URL}${AddApprovalDetailsToOffChainStorageRoute()}`, requestBody);
      return convertAddApprovalDetailsToOffChainStorageRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async getSignInChallenge(requestBody: GetSignInChallengeRouteRequestBody): Promise<GetSignInChallengeRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetSignInChallengeRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetSignInChallengeRoute()}`, requestBody);
      return convertGetSignInChallengeRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async verifySignIn(requestBody: VerifySignInRouteRequestBody): Promise<VerifySignInRouteSuccessResponse<DesiredNumberType>> {
    try {
      const body = requestBody;
      const response = await this.axios.post<VerifySignInRouteSuccessResponse<string>>(`${this.BACKEND_URL}${VerifySignInRoute()}`, body);
      return convertVerifySignInRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async checkIfSignedIn(requestBody: CheckSignInStatusRequestBody): Promise<CheckSignInStatusRequestSuccessResponse<DesiredNumberType>> {
    try {
      const body = requestBody;
      const response = await this.axios.post<CheckSignInStatusRequestSuccessResponse<string>>(`${this.BACKEND_URL}${CheckIfSignedInRoute()}`, body);
      return convertCheckSignInStatusRequestSuccessResponse(response.data, this.ConvertFunction);
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
  public async signOut(requestBody?: SignOutRequestBody): Promise<SignOutSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<SignOutSuccessResponse<string>>(`${this.BACKEND_URL}${SignOutRoute()}`, requestBody);
      return convertSignOutSuccessResponse(response.data, this.ConvertFunction);
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
  public async getBrowseCollections(requestBody?: GetBrowseCollectionsRouteRequestBody): Promise<GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetBrowseCollectionsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetBrowseCollectionsRoute()}`, requestBody);
      return convertGetBrowseCollectionsRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async broadcastTx(requestBody: BroadcastTxRouteRequestBody | string): Promise<BroadcastTxRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<BroadcastTxRouteSuccessResponse<string>>(`${this.BACKEND_URL}${BroadcastTxRoute()}`, requestBody);
      return convertBroadcastTxRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async simulateTx(requestBody: SimulateTxRouteRequestBody | string): Promise<SimulateTxRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<SimulateTxRouteSuccessResponse<string>>(`${this.BACKEND_URL}${SimulateTxRoute()}`, requestBody);
      return convertSimulateTxRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async fetchMetadataDirectly(requestBody: FetchMetadataDirectlyRouteRequestBody): Promise<FetchMetadataDirectlyRouteSuccessResponse<DesiredNumberType>> {
    try {
      const error = requestBody.uris.find(uri => Joi.string().uri().required().validate(uri).error);
      if (error) {
        throw `Invalid URIs`;
      }

      const response = await this.axios.post<FetchMetadataDirectlyRouteSuccessResponse<string>>(`${this.BACKEND_URL}${FetchMetadataDirectlyRoute()}`, requestBody);
      return convertFetchMetadataDirectlyRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async getTokensFromFaucet(requestBody?: GetTokensFromFaucetRouteRequestBody): Promise<GetTokensFromFaucetRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetTokensFromFaucetRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetTokensFromFaucetRoute()}`, requestBody);
      return convertGetTokensFromFaucetRouteSuccessResponse(response.data, this.ConvertFunction);
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
  public async updateAddressLists(requestBody?: UpdateAddressListsRouteRequestBody<NumberType>): Promise<UpdateAddressListsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<UpdateAddressListsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${UpdateAddressListRoute()}`, requestBody);
      return convertUpdateAddressListsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
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
  public async getAddressLists(requestBody?: GetAddressListsRouteRequestBody): Promise<GetAddressListsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetAddressListsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetAddressListsRoute()}`, requestBody);
      return convertGetAddressListsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes address lists. Must be created off-chain.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addressList/delete`
   * - **SDK Function Call**: `await BitBadgesApi.deleteAddressLists(requestBody);`
   * - **Authentication**: Must be signed in and the creator of the address list.
   */
  public async deleteAddressLists(requestBody?: DeleteAddressListsRouteRequestBody): Promise<DeleteAddressListsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<DeleteAddressListsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${DeleteAddressListRoute()}`, requestBody);
      return convertDeleteAddressListsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
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
      const response = await this.axios.post<GetBlockinAuthCodeRouteSuccessResponse>(`${this.BACKEND_URL}${GetAuthCodeRoute()}`, requestBody);
      return response.data;
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
      const response = await this.axios.post<CreateBlockinAuthCodeRouteResponse>(`${this.BACKEND_URL}${CreateAuthCodeRoute()}`, requestBody);
      return response.data;
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
      const response = await this.axios.post<DeleteBlockinAuthCodeRouteResponse>(`${this.BACKEND_URL}${DeleteAuthCodeRoute()}`, requestBody);
      return response.data;
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
      const response = await this.axios.post<GenericBlockinVerifyRouteSuccessResponse>(`${this.BACKEND_URL}${GenericVerifyRoute()}`, body);
      return convertVerifySignInRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Adds an address to an address list. Must be created off-chain. Must provide a valid edit key, or else, must be the creator.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addressList/addAddress`
   * - **SDK Function Call**: `await BitBadgesApi.addAddressToAddressList(requestBody);`
   */
  public async addAddressToSurvey(listId: string, requestBody: AddAddressToSurveyRouteRequestBody): Promise<AddAddressToSurveyRouteSuccessResponse> {
    try {
      const response = await this.axios.post<AddAddressToSurveyRouteSuccessResponse>(`${this.BACKEND_URL}${AddAddressToSurveyRoute(listId)}`, requestBody);
      return response.data;
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
   * - **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
   */
  public async sendClaimAlert(requestBody: SendClaimAlertsRouteRequestBody<NumberType>): Promise<SendClaimAlertsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<SendClaimAlertsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${SendClaimAlertRoute()}`, requestBody);
      return response.data;
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
  public async getFollowDetails(requestBody: GetFollowDetailsRouteRequestBody): Promise<GetFollowDetailsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetFollowDetailsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetFollowDetailsRoute()}`, requestBody);
      return convertGetFollowDetailsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets claim alerts for a collection or user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/getClaimAlerts`
   * - **SDK Function Call**: `await BitBadgesApi.getClaimAlerts(requestBody);`
   */
  public async getClaimAlerts(requestBody: GetClaimAlertsForCollectionRouteRequestBody<NumberType>): Promise<GetClaimAlertsForCollectionRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetClaimAlertsForCollectionRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetClaimAlertsRoute()}`, requestBody);
      return convertGetClaimAlertsForCollectionRouteSuccessResponse(response.data, this.ConvertFunction);
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
    try {
      const response = await this.axios.post<RefreshStatusRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetRefreshStatusRoute(collectionId)}`);
      return convertRefreshStatusRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get protocol details by name.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/getProtocol`
   * - **SDK Function Call**: `await BitBadgesApi.getProtocol(requestBody);`
   */
  public async getProtocol(requestBody: GetProtocolsRouteRequestBody): Promise<GetProtocolsRouteSuccessResponse> {
    try {
      const response = await this.axios.post<GetProtocolsRouteSuccessResponse>(`${this.BACKEND_URL}${GetProtocolsRoute()}`, requestBody);
      return convertGetProtocolsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the collection ID set by a user for a protocol.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/getCollectionForProtocol`
   * - **SDK Function Call**: `await BitBadgesApi.getCollectionForProtocol(requestBody);`
   */
  public async getCollectionForProtocol(requestBody: GetCollectionForProtocolRouteRequestBody): Promise<GetCollectionForProtocolRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetCollectionForProtocolRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetCollectionForProtocolRoute()}`, requestBody);
      return convertGetCollectionForProtocolRouteSuccessResponse(response.data, this.ConvertFunction);
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
   * - **SDK Function Call**: `await BitBadgesApi.filterBadgesInCollection(requestBody);`
   */
  public async filterBadgesInCollection(requestBody: FilterBadgesInCollectionRequestBody): Promise<FilterBadgesInCollectionSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<FilterBadgesInCollectionSuccessResponse<string>>(`${this.BACKEND_URL}${FilterBadgesInCollectionRoute()}`, requestBody);
      return convertFilterBadgesInCollectionSuccessResponse(response.data, this.ConvertFunction);
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
