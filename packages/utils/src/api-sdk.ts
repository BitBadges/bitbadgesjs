import { BigIntify, NumberType } from "bitbadgesjs-proto";
import { updateBadgeMetadata } from "./badgeMetadata";
import { getMaxMetadataId } from "./metadataIds";
import { ErrorResponse, GetStatusRouteRequestBody, GetStatusRouteSuccessResponse, convertGetStatusRouteSuccessResponse, GetSearchRouteRequestBody, GetSearchRouteSuccessResponse, convertGetSearchRouteSuccessResponse, GetCollectionBatchRouteRequestBody, GetCollectionBatchRouteSuccessResponse, convertGetCollectionBatchRouteSuccessResponse, GetCollectionByIdRouteRequestBody, GetCollectionRouteSuccessResponse, convertGetCollectionRouteSuccessResponse, GetOwnersForBadgeRouteRequestBody, GetOwnersForBadgeRouteSuccessResponse, convertGetOwnersForBadgeRouteSuccessResponse, GetMetadataForCollectionRouteRequestBody, GetMetadataForCollectionRouteSuccessResponse, convertGetMetadataForCollectionRouteSuccessResponse, GetBadgeBalanceByAddressRouteRequestBody, GetBadgeBalanceByAddressRouteSuccessResponse, convertGetBadgeBalanceByAddressRouteSuccessResponse, GetBadgeActivityRouteRequestBody, GetBadgeActivityRouteSuccessResponse, convertGetBadgeActivityRouteSuccessResponse, RefreshMetadataRouteRequestBody, RefreshMetadataRouteSuccessResponse, convertRefreshMetadataRouteSuccessResponse, GetAllCodesAndPasswordsRouteRequestBody, GetAllCodesAndPasswordsRouteSuccessResponse, convertGetAllCodesAndPasswordsRouteSuccessResponse, GetCodeForPasswordRouteRequestBody, GetCodeForPasswordRouteSuccessResponse, convertGetCodeForPasswordRouteSuccessResponse, AddAnnouncementRouteRequestBody, AddAnnouncementRouteSuccessResponse, convertAddAnnouncementRouteSuccessResponse, DeleteReviewRouteRequestBody, DeleteReviewRouteSuccessResponse, convertDeleteReviewRouteSuccessResponse, DeleteAnnouncementRouteRequestBody, DeleteAnnouncementRouteSuccessResponse, convertDeleteAnnouncementRouteSuccessResponse, AddReviewForCollectionRouteRequestBody, AddReviewForCollectionRouteSuccessResponse, convertAddReviewForCollectionRouteSuccessResponse, GetAccountsRouteRequestBody, GetAccountsRouteSuccessResponse, convertGetAccountsRouteSuccessResponse, GetAccountRouteRequestBody, GetAccountRouteSuccessResponse, convertGetAccountRouteSuccessResponse, AddReviewForUserRouteRequestBody, AddReviewForUserRouteSuccessResponse, convertAddReviewForUserRouteSuccessResponse, UpdateAccountInfoRouteRequestBody, UpdateAccountInfoRouteSuccessResponse, convertUpdateAccountInfoRouteSuccessResponse, AddBalancesToOffChainStorageRouteRequestBody, AddBalancesToOffChainStorageRouteSuccessResponse, convertAddBalancesToOffChainStorageRouteSuccessResponse, AddMetadataToIpfsRouteRequestBody, AddMetadataToIpfsRouteSuccessResponse, convertAddMetadataToIpfsRouteSuccessResponse, AddApprovalDetailsToOffChainStorageRouteRequestBody, AddApprovalDetailsToOffChainStorageRouteSuccessResponse, convertAddApprovalDetailsToOffChainStorageRouteSuccessResponse, GetSignInChallengeRouteRequestBody, GetSignInChallengeRouteSuccessResponse, convertGetSignInChallengeRouteSuccessResponse, VerifySignInRouteRequestBody, VerifySignInRouteSuccessResponse, convertVerifySignInRouteSuccessResponse, CheckSignInStatusRequestBody, CheckSignInStatusRequestSuccessResponse, convertCheckSignInStatusRequestSuccessResponse, SignOutRequestBody, SignOutSuccessResponse, convertSignOutSuccessResponse, GetBrowseCollectionsRouteRequestBody, GetBrowseCollectionsRouteSuccessResponse, convertGetBrowseCollectionsRouteSuccessResponse, BroadcastTxRouteRequestBody, BroadcastTxRouteSuccessResponse, convertBroadcastTxRouteSuccessResponse, SimulateTxRouteRequestBody, SimulateTxRouteSuccessResponse, convertSimulateTxRouteSuccessResponse, FetchMetadataDirectlyRouteRequestBody, FetchMetadataDirectlyRouteSuccessResponse, convertFetchMetadataDirectlyRouteSuccessResponse, GetTokensFromFaucetRouteRequestBody, GetTokensFromFaucetRouteSuccessResponse, convertGetTokensFromFaucetRouteSuccessResponse, UpdateAddressMappingsRouteRequestBody, UpdateAddressMappingsRouteSuccessResponse, convertUpdateAddressMappingsRouteSuccessResponse, GetAddressMappingsRouteRequestBody, GetAddressMappingsRouteSuccessResponse, convertGetAddressMappingsRouteSuccessResponse, DeleteAddressMappingsRouteRequestBody, DeleteAddressMappingsRouteSuccessResponse, convertDeleteAddressMappingsRouteSuccessResponse, GetApprovalsRouteRequestBody, GetApprovalsRouteSuccessResponse, convertGetApprovalsRouteSuccessResponse, GetChallengeTrackersRouteRequestBody, GetChallengeTrackersRouteSuccessResponse, convertGetChallengeTrackersRouteSuccessResponse, MetadataFetchOptions } from "./types/api";
import { convertBitBadgesCollection, BitBadgesCollection } from "./types/collections";
import { GetStatusRoute, GetSearchRoute, GetCollectionBatchRoute, GetCollectionByIdRoute, GetOwnersForBadgeRoute, GetMetadataForCollectionRoute, GetBadgeBalanceByAddressRoute, GetBadgeActivityRoute, RefreshMetadataRoute, GetAllPasswordsAndCodesRoute, GetCodeForPasswordRoute, AddAnnouncementRoute, DeleteReviewRoute, DeleteAnnouncementRoute, AddReviewForCollectionRoute, GetAccountsRoute, GetAccountRoute, AddReviewForUserRoute, UpdateAccountInfoRoute, AddBalancesToOffChainStorageRoute, AddMetadataToIpfsRoute, AddApprovalDetailsToOffChainStorageRoute, GetSignInChallengeRoute, VerifySignInRoute, CheckIfSignedInRoute, SignOutRoute, GetBrowseCollectionsRoute, BroadcastTxRoute, SimulateTxRoute, FetchMetadataDirectlyRoute, GetTokensFromFaucetRoute, UpdateAddressMappingRoute, GetAddressMappingsRoute, DeleteAddressMappingRoute, GetApprovalsRoute, GetChallengeTrackerRoute } from "./types/routes";
import axiosApi from "axios";
import { stringify } from "./utils/preserveJson";
import Joi from "joi";
import { getCurrentValuesForCollection } from "./timelines";

type DesiredNumberType = bigint;


export interface BitBadgesApiDetails {
  apiUrl?: string;
  apiKey?: string;
  convertFunction: (num: NumberType) => DesiredNumberType;
}

/**
 * @category API / Indexer
 *
 * This is the BitBadgesAPI class which provides all typed API calls to the BitBadges API.
 * See official documentation for more details and examples.
 *
 * Must have a valid API key set. To get an API key, reach out to the team.
 *
 * convertFunction is used to convert any numbers returned by the API to the desired NumberType.
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

  public async handleApiError(error: any): Promise<void> {
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

  public async getStatus(requestBody?: GetStatusRouteRequestBody): Promise<GetStatusRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetStatusRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetStatusRoute()}`, requestBody);
      return convertGetStatusRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getSearchResults(searchValue: string, requestBody?: GetSearchRouteRequestBody): Promise<GetSearchRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetSearchRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetSearchRoute(searchValue)}`, requestBody);
      return convertGetSearchRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getCollections(requestBody: GetCollectionBatchRouteRequestBody): Promise<GetCollectionBatchRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetCollectionBatchRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetCollectionBatchRoute()}`, requestBody);
      return convertGetCollectionBatchRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getCollectionById(collectionId: NumberType, requestBody: GetCollectionByIdRouteRequestBody, fetchAllMetadata = false): Promise<GetCollectionRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await this.axios.post<GetCollectionRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetCollectionByIdRoute(collectionId)}`, requestBody);
      const responseData = convertGetCollectionRouteSuccessResponse(response.data, this.ConvertFunction);

      if (fetchAllMetadata) {
        const _collection = convertBitBadgesCollection(responseData.collection, BigIntify);
        const currentBadgeMetadata = getCurrentValuesForCollection(_collection).badgeMetadata;
        responseData.collection = await this.fetchAndUpdateMetadata(responseData.collection, {
          metadataIds: [{ start: 0, end: getMaxMetadataId(currentBadgeMetadata) }],
        });
      }

      return responseData;
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

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

  public async getMetadataForCollection(collectionId: NumberType, requestBody: GetMetadataForCollectionRouteRequestBody): Promise<GetMetadataForCollectionRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await this.axios.post<GetMetadataForCollectionRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetMetadataForCollectionRoute(collectionId)}`, requestBody);
      return convertGetMetadataForCollectionRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

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

  public async addAnnouncement(collectionId: NumberType, requestBody: AddAnnouncementRouteRequestBody): Promise<AddAnnouncementRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await this.axios.post<AddAnnouncementRouteSuccessResponse<string>>(`${this.BACKEND_URL}${AddAnnouncementRoute(collectionId)}`, requestBody);
      return convertAddAnnouncementRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async deleteReview(reviewId: string, requestBody?: DeleteReviewRouteRequestBody): Promise<DeleteReviewRouteSuccessResponse<DesiredNumberType>> {
    try {

      const response = await this.axios.post<DeleteReviewRouteSuccessResponse<string>>(`${this.BACKEND_URL}${DeleteReviewRoute(reviewId)}`, requestBody);
      return convertDeleteReviewRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async deleteAnnouncement(announcementId: string, requestBody?: DeleteAnnouncementRouteRequestBody): Promise<DeleteAnnouncementRouteSuccessResponse<DesiredNumberType>> {
    try {

      const response = await this.axios.post<DeleteAnnouncementRouteSuccessResponse<string>>(`${this.BACKEND_URL}${DeleteAnnouncementRoute(announcementId)}`, requestBody);
      return convertDeleteAnnouncementRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }


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

  public async getAccounts(requestBody: GetAccountsRouteRequestBody): Promise<GetAccountsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetAccountsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetAccountsRoute()}`, requestBody);
      return convertGetAccountsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getAccount(addressOrUsername: string, requestBody: GetAccountRouteRequestBody): Promise<GetAccountRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetAccountRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetAccountRoute(addressOrUsername)}`, requestBody);
      return convertGetAccountRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }


  public async addReviewForUser(addressOrUsername: string, requestBody: AddReviewForUserRouteRequestBody): Promise<AddReviewForUserRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<AddReviewForUserRouteSuccessResponse<string>>(`${this.BACKEND_URL}${AddReviewForUserRoute(addressOrUsername)}`, requestBody);
      return convertAddReviewForUserRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async updateAccountInfo(requestBody: UpdateAccountInfoRouteRequestBody<DesiredNumberType>): Promise<UpdateAccountInfoRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<UpdateAccountInfoRouteSuccessResponse<string>>(`${this.BACKEND_URL}${UpdateAccountInfoRoute()}`, requestBody);
      return convertUpdateAccountInfoRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async addBalancesToOffChainStorage(requestBody: AddBalancesToOffChainStorageRouteRequestBody): Promise<AddBalancesToOffChainStorageRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<AddBalancesToOffChainStorageRouteSuccessResponse<string>>(`${this.BACKEND_URL}${AddBalancesToOffChainStorageRoute()}`, requestBody);
      return convertAddBalancesToOffChainStorageRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async addMetadataToIpfs(requestBody: AddMetadataToIpfsRouteRequestBody): Promise<AddMetadataToIpfsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<AddMetadataToIpfsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${AddMetadataToIpfsRoute()}`, requestBody);
      return convertAddMetadataToIpfsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async addApprovalDetailsToOffChainStorage(requestBody: AddApprovalDetailsToOffChainStorageRouteRequestBody): Promise<AddApprovalDetailsToOffChainStorageRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<AddApprovalDetailsToOffChainStorageRouteSuccessResponse<string>>(`${this.BACKEND_URL}${AddApprovalDetailsToOffChainStorageRoute()}`, requestBody);
      return convertAddApprovalDetailsToOffChainStorageRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getSignInChallenge(requestBody: GetSignInChallengeRouteRequestBody): Promise<GetSignInChallengeRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetSignInChallengeRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetSignInChallengeRoute()}`, requestBody);
      return convertGetSignInChallengeRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async verifySignIn(requestBody: VerifySignInRouteRequestBody): Promise<VerifySignInRouteSuccessResponse<DesiredNumberType>> {
    try {
      const body = stringify(requestBody);
      const response = await this.axios.post<VerifySignInRouteSuccessResponse<string>>(`${this.BACKEND_URL}${VerifySignInRoute()}`, body);
      return convertVerifySignInRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async checkIfSignedIn(requestBody: CheckSignInStatusRequestBody): Promise<CheckSignInStatusRequestSuccessResponse<DesiredNumberType>> {
    try {
      const body = stringify(requestBody);
      const response = await this.axios.post<CheckSignInStatusRequestSuccessResponse<string>>(`${this.BACKEND_URL}${CheckIfSignedInRoute()}`, body);
      return convertCheckSignInStatusRequestSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async signOut(requestBody?: SignOutRequestBody): Promise<SignOutSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<SignOutSuccessResponse<string>>(`${this.BACKEND_URL}${SignOutRoute()}`, requestBody);
      return convertSignOutSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getBrowseCollections(requestBody?: GetBrowseCollectionsRouteRequestBody): Promise<GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetBrowseCollectionsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetBrowseCollectionsRoute()}`, requestBody);
      return convertGetBrowseCollectionsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async broadcastTx(requestBody: BroadcastTxRouteRequestBody | string): Promise<BroadcastTxRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<BroadcastTxRouteSuccessResponse<string>>(`${this.BACKEND_URL}${BroadcastTxRoute()}`, requestBody);
      return convertBroadcastTxRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async simulateTx(requestBody: SimulateTxRouteRequestBody | string): Promise<SimulateTxRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<SimulateTxRouteSuccessResponse<string>>(`${this.BACKEND_URL}${SimulateTxRoute()}`, requestBody);
      return convertSimulateTxRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

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

  public async getTokensFromFaucet(requestBody?: GetTokensFromFaucetRouteRequestBody): Promise<GetTokensFromFaucetRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetTokensFromFaucetRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetTokensFromFaucetRoute()}`, requestBody);
      return convertGetTokensFromFaucetRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async updateAddressMappings(requestBody?: UpdateAddressMappingsRouteRequestBody): Promise<UpdateAddressMappingsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<UpdateAddressMappingsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${UpdateAddressMappingRoute()}`, requestBody);
      return convertUpdateAddressMappingsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getAddressMappings(requestBody?: GetAddressMappingsRouteRequestBody): Promise<GetAddressMappingsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetAddressMappingsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetAddressMappingsRoute()}`, requestBody);
      return convertGetAddressMappingsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async deleteAddressMappings(requestBody?: DeleteAddressMappingsRouteRequestBody): Promise<DeleteAddressMappingsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<DeleteAddressMappingsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${DeleteAddressMappingRoute()}`, requestBody);
      return convertDeleteAddressMappingsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }


  public async getApprovalTrackers(requestBody?: GetApprovalsRouteRequestBody): Promise<GetApprovalsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetApprovalsRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetApprovalsRoute()}`, requestBody);
      return convertGetApprovalsRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getChallengeTrackers(requestBody?: GetChallengeTrackersRouteRequestBody): Promise<GetChallengeTrackersRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await this.axios.post<GetChallengeTrackersRouteSuccessResponse<string>>(`${this.BACKEND_URL}${GetChallengeTrackerRoute()}`, requestBody);
      return convertGetChallengeTrackersRouteSuccessResponse(response.data, this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /** Update Helper Functions for Pagination and Dynamic Fetches */
  public async updateUserSeenActivity() {
    return await this.updateAccountInfo({ seenActivity: Date.now() }); //Authenticated route so no need to pass in address
  }

  //Gets metadata batches for a collection starting from startBatchId ?? 0 and incrementing METADATA_PAGE_LIMIT times
  public async fetchAndUpdateMetadata(collection: BitBadgesCollection<bigint>, metadataFetchOptions: MetadataFetchOptions) {
    const promises = [];
    promises.push(this.getMetadataForCollection(collection.collectionId, { metadataToFetch: metadataFetchOptions }));

    const metadataResponses = await Promise.all(promises);

    for (const metadataRes of metadataResponses) {
      if (metadataRes.collectionMetadata) {
        const isCollectionMetadataResEmpty = Object.keys(metadataRes.collectionMetadata).length === 0;
        collection.cachedCollectionMetadata = !isCollectionMetadataResEmpty ? metadataRes.collectionMetadata : collection.cachedCollectionMetadata;
      }

      if (metadataRes.badgeMetadata) {
        const vals = Object.values(metadataRes.badgeMetadata);
        for (const val of vals) {
          if (!val) continue;
          collection.cachedBadgeMetadata = updateBadgeMetadata(collection.cachedBadgeMetadata, val);
        }
      }
    }

    return collection;
  }
}

export default BitBadgesAPI;
