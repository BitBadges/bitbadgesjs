import axiosApi from "axios";
import { BigIntify, NumberType } from "bitbadgesjs-proto";
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
 * See official documentation for more details and examples.
 *
 * Must pass in a valid API key. To get an API key, reach out to the team.
 *
 * convertFunction is used to convert any responses returned by the API to your desired NumberType.
 * import { BigIntify, Stringify, Numberify } from "bitbadgesjs-utils";
 * const api = new BitBadgesAPI({ convertFunction: BigIntify, ....})
 *
 * By default, we use the official backend API URL. You can override this by passing in a custom apiUrl.
 *
 * @category API / Indexer
 */
export class BitBadgesAPI {
  axios = axiosApi.create({
    withCredentials: true,
    headers: {
      "Content-type": "application/json",
      "x-api-key": process.env.BITBADGES_API_KEY,
    },
  });
  BACKEND_URL = process.env.BITBADGES_API_URL || "https://api.bitbadges.io";
  ConvertFunction = BigIntify;
  apiKey = process.env.BITBADGES_API_KEY;

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

  async handleApiError(error: any): Promise<void> {
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
   * **API Route**: POST /api/v0/status
   *
   * **SDK Function Call**: await BitBadgesAPI.getStatus();
   */
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
   * **API Route**: POST /api/v0/search/:searchValue
   *
   * **SDK Function Call**: await BitBadgesAPI.getSearchResults(searchValue);
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
   * Gets badge collections and accompying details. Consider using the getCollectionsAndUpdate function instead to natively help you handle paginations,
   * appending metadata, and so on.
   *
   * **API Route**: POST /api/v0/collection/batch
   *
   * **SDK Function Call**: await BitBadgesAPI.getCollections(requestBody);
   *
   * **Tutorial**: See the Fetching Collections tutoral on the official docs.
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
   * This handles pagination, appending metadata, and so on. It also prunes the request's metadataToFetch to only fetch non-fetched metadata.
   *
   * All previously fetched collections are required to be present in the currCollections array for intended behavior.
   *
   * **API Route**: POST /api/v0/collection/batch
   *
   * **SDK Function Call**: await BitBadgesAPI.getCollections(requestBody);
   *
   * **Tutorial**: See the Fetching Collections tutoral on the official docs.
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
   * **API Route**: POST /api/v0/collection/:collectionId/:badgeId/owners
   *
   * **SDK Function Call**: await BitBadgesAPI.getOwnersForBadge(collectionId, badgeId, requestBody);
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
   * **API Route**: POST /api/v0/collection/:collectionId/balance/:cosmosAddress
   *
   * **SDK Function Call**: await BitBadgesAPI.getBadgeBalanceByAddress(collectionId, cosmosAddress, requestBody);
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
   * **API Route**: POST /api/v0/collection/:collectionId/:badgeId/activity
   *
   * **SDK Function Call**: await BitBadgesAPI.getBadgeActivity(collectionId, badgeId, requestBody);
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
   * **API Route**: POST /api/v0/collection/:collectionId/refresh
   *
   * **SDK Function Call**: await BitBadgesAPI.refreshMetadata(collectionId, requestBody);
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
   * **API Route**: POST /api/v0/collection/:collectionId/codes
   *
   * **SDK Function Call**: await BitBadgesAPI.getAllPasswordsAndCodes(collectionId, requestBody);
   *
   * **Authentication**: Must be signed in and the manager of the requested collection.
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
   * **API Route**: POST /api/v0/collection/:collectionId/password/:cid/:password
   *
   * **SDK Function Call**: await BitBadgesAPI.getCodeForPassword(collectionId, cid, password, requestBody);
   *
   * **Authentication**: Must be signed in.
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
   * **API Route**: POST /api/v0/deleteReview/:reviewId
   *
   * **SDK Function Call**: await BitBadgesAPI.deleteReview(reviewId, requestBody);
   *
   * **Authentication**: Must be signed in and the owner of the review.
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

  // public async deleteAnnouncement(announcementId: string, requestBody?: DeleteAnnouncementRouteRequestBody): Promise<DeleteAnnouncementRouteSuccessResponse<DesiredNumberType>> {
  //   try {

  //     const response = await this.axios.post<DeleteAnnouncementRouteSuccessResponse<string>>(`${this.BACKEND_URL}${DeleteAnnouncementRoute(announcementId)}`, requestBody);
  //     return convertDeleteAnnouncementRouteSuccessResponse(response.data, this.ConvertFunction);
  //   } catch (error) {
  //     await this.handleApiError(error);
  //     return Promise.reject(error);
  //   }
  // }

  /**
   * Adds a new review for a collection.
   *
   * **API Route**: POST /api/v0/collection/:collectionId/addReview
   *
   * **SDK Function Call**: await BitBadgesAPI.addReviewForCollection(collectionId, requestBody);
   *
   * **Authentication**: Must be signed in.
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
   * **API Route**: POST /api/v0/user/batch
   *
   * **SDK Function Call**: await BitBadgesAPI.getAccounts(requestBody);
   *
   * **Tutorial**: See the Fetching Accounts tutoral on the official docs.
   *
   * **Authentication**: Must be signed in, if fetching private information such as private lists or auth codes. If fetching public information only, no sign in required.
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
   * **API Route**: POST /api/v0/user/batch
   *
   * **SDK Function Call**: await BitBadgesAPI.getAccounts(requestBody);
   *
   * **Tutorial**: See the Fetching Accounts tutoral on the official docs.
   *
   * **Authentication**: Must be signed in, if fetching private information such as private lists or auth codes. If fetching public information only, no sign in required.
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
   * **API Route**: POST /api/v0/user/:addressOrUsername/addReview
   *
   * **SDK Function Call**: await BitBadgesAPI.addReviewForUser(addressOrUsername, requestBody);
   *
   * **Authentication**: Must be signed in.
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
   * **API Route**: POST /api/v0/user/updateAccount
   *
   * **SDK Function Call**: await BitBadgesAPI.updateAccountInfo(requestBody);
   *
   * **Authentication**: Must be signed in.
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
   * **API Route**: POST /api/v0/addBalancesToOffChainStorage
   *
   * **SDK Function Call**: await BitBadgesAPI.addBalancesToOffChainStorage(requestBody);
   *
   * **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
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
   * **API Route**: POST /api/v0/addMetadataToIpfs
   *
   * **SDK Function Call**: await BitBadgesAPI.addMetadataToIpfs(requestBody);
   *
   * **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
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
   * Adds approval details to off-chain storage
   *
   * **API Route**: POST /api/v0/addApprovalDetailsToOffChainStorage
   *
   * **SDK Function Call**: await BitBadgesAPI.addApprovalDetailsToOffChainStorage(requestBody);
   *
   * **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
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
   * **API Route**: POST /api/v0/auth/getChallenge
   *
   * **SDK Function Call**: await BitBadgesAPI.getSignInChallenge(requestBody);
   *
   * **Tutorial**: See Authentication tutorial on the official docs.
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
   * **API Route**: POST /api/v0/auth/verify
   *
   * **SDK Function Call**: await BitBadgesAPI.verifySignIn(requestBody);
   *
   * **Tutorial**: See Authentication tutorial on the official docs.
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
   * **API Route**: POST /api/v0/auth/status
   *
   * **SDK Function Call**: await BitBadgesAPI.checkIfSignedIn(requestBody);
   *
   * **Tutorial**: See Authentication tutorial on the official docs.
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
   * **API Route**: POST /api/v0/auth/logout
   *
   * **SDK Function Call**: await BitBadgesAPI.signOut(requestBody);
   *
   * **Tutorial**: See Authentication tutorial on the official docs.
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
   * **API Route**: POST /api/v0/browse
   *
   * **SDK Function Call**: await BitBadgesAPI.getBrowseCollections(requestBody);
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
   * Also, consider checking out https://bitbadges.io/dev/broadcast, so you can simply copy and paste your transaction to a UI. All signing, API communication, etc is outsourced to the UI,
   *
   * **API Route**: POST /api/v0/broadcast
   *
   * **SDK Function Call**: await BitBadgesAPI.broadcastTx(requestBody);
   *
   * **Tutorial**: See Broadcasting Transactions tutorial on the official docs.
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
   * Simulates a transaction on the blockchain. This means that it will return the gas used and any errors that occur on a dry run.
   * Should be used before broadcasting a transaction. Does not require signatures.
   *
   * **API Route**: POST /api/v0/simulate
   *
   * **SDK Function Call**: await BitBadgesAPI.simulateTx(requestBody);
   *
   * **Tutorial**: See Broadcasting Transactions tutorial on the official docs.
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
   * **API Route**: POST /api/v0/metadata
   *
   * **SDK Function Call**: await BitBadgesAPI.fetchMetadataDirectly(requestBody);
   *
   * **CORS**: Restricted to only BitBadges official site.
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
   * **API Route**: POST /api/v0/faucet
   *
   * **SDK Function Call**: await BitBadgesAPI.getTokensFromFaucet(requestBody);
   *
   * **Authentication**: Must be signed in.
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
   * Must be created off-chain. For on-chain, they must be created through MsgCreateAddressMappings.
   * Creator can update their created lists with no restrictions. Else, requires an edit key.
   *
   * **API Route**: POST /api/v0/addressList/update
   *
   * **SDK Function Call**: await BitBadgesAPI.updateAddressLists(requestBody);
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
   * Note for reserved lists, you can use getReservedAddressList from the SDK.
   *
   *
   * **API Route**: POST /api/v0/addressList/get
   *
   * **SDK Function Call**: await BitBadgesAPI.getAddressLists(requestBody);
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
   * **API Route**: POST /api/v0/addressList/delete
   *
   * **SDK Function Call**: await BitBadgesAPI.deleteAddressLists(requestBody);
   *
   * **Authentication**: Must be signed in and the creator of the address list.
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
   * Gets a Blockin authentication code. This is used for signing in with Blockin at in-person events.
   * Anyone with the signature is able to fetch the preimage message.
   *
   * **API Route**: POST /api/v0/authCode
   *
   * **SDK Function Call**: await BitBadgesAPI.getAuthCode(requestBody);
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
   * **API Route**: POST /api/v0/authCode/create
   *
   * **SDK Function Call**: await BitBadgesAPI.createAuthCode(requestBody);
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
   * **API Route**: POST /api/v0/authCode/delete
   *
   * **SDK Function Call**: await BitBadgesAPI.deleteAuthCode(requestBody);
   *
   * **Authentication**: Must be signed in and the owner of the auth code.
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
   * **API Route**: POST /api/v0/auth/verifyGeneric
   *
   * **SDK Function Call**: await BitBadgesAPI.verifySignInGeneric(requestBody);
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
   * Adds an address to an address list. Must be created off-chain.
   * Must provide a valid edit key, or else, must be the creator
   *
   * **API Route**: POST /api/v0/addressList/addAddress
   *
   * **SDK Function Call**: await BitBadgesAPI.addAddressToAddressList(requestBody);
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
   * **API Route**: POST /api/v0/sendClaimAlerts
   *
   * **SDK Function Call**: await BitBadgesAPI.sendClaimAlert(requestBody);
   *
   * **Authentication**: Must be signed in and the manager of the collection.
   *
   * **CORS**: Restricted to only BitBadges official site. Otherwise, you will need to self-host.
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
   * **API Route**: POST /api/v0/getFollowDetails
   *
   * **SDK Function Call**: await BitBadgesAPI.getFollowDetails(requestBody);
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
   * Gets claim alerts for a collection or user
   *
   * **API Route**: POST /api/v0/getClaimAlerts
   *
   * **SDK Function Call**: await BitBadgesAPI.getClaimAlerts(requestBody);
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
   * **API Route**: POST /api/v0/getRefreshStatus
   *
   * **SDK Function Call**: await BitBadgesAPI.getRefreshStatus(requestBody);
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
   * **API Route**: POST /api/v0/getProtocol
   *
   * **SDK Function Call**: await BitBadgesAPI.getProtocol(requestBody);
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
   * **API Route**: POST /api/v0/getCollectionForProtocol
   *
   * **SDK Function Call**: await BitBadgesAPI.getCollectionForProtocol(requestBody);
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
   * **API Route**: POST /api/v0/filterBadgesInCollection
   *
   * **SDK Function Call**: await BitBadgesAPI.filterBadgesInCollection(requestBody);
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
