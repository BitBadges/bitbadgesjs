import { BigIntify, NumberType } from "bitbadgesjs-proto";
import { updateBadgeMetadata } from "./badgeMetadata";
import { getMaxMetadataId } from "./metadataIds";
import { ErrorResponse, GetStatusRouteRequestBody, GetStatusRouteSuccessResponse, convertGetStatusRouteSuccessResponse, GetSearchRouteRequestBody, GetSearchRouteSuccessResponse, convertGetSearchRouteSuccessResponse, GetCollectionBatchRouteRequestBody, GetCollectionBatchRouteSuccessResponse, convertGetCollectionBatchRouteSuccessResponse, GetCollectionByIdRouteRequestBody, GetCollectionRouteSuccessResponse, convertGetCollectionRouteSuccessResponse, GetOwnersForBadgeRouteRequestBody, GetOwnersForBadgeRouteSuccessResponse, convertGetOwnersForBadgeRouteSuccessResponse, GetMetadataForCollectionRouteRequestBody, GetMetadataForCollectionRouteSuccessResponse, convertGetMetadataForCollectionRouteSuccessResponse, GetBadgeBalanceByAddressRouteRequestBody, GetBadgeBalanceByAddressRouteSuccessResponse, convertGetBadgeBalanceByAddressRouteSuccessResponse, GetBadgeActivityRouteRequestBody, GetBadgeActivityRouteSuccessResponse, convertGetBadgeActivityRouteSuccessResponse, RefreshMetadataRouteRequestBody, RefreshMetadataRouteSuccessResponse, convertRefreshMetadataRouteSuccessResponse, GetAllCodesAndPasswordsRouteRequestBody, GetAllCodesAndPasswordsRouteSuccessResponse, convertGetAllCodesAndPasswordsRouteSuccessResponse, GetMerkleChallengeCodeViaPasswordRouteRequestBody, GetMerkleChallengeCodeViaPasswordRouteSuccessResponse, convertGetMerkleChallengeCodeViaPasswordRouteSuccessResponse, AddAnnouncementRouteRequestBody, AddAnnouncementRouteSuccessResponse, convertAddAnnouncementRouteSuccessResponse, DeleteReviewRouteRequestBody, DeleteReviewRouteSuccessResponse, convertDeleteReviewRouteSuccessResponse, DeleteAnnouncementRouteRequestBody, DeleteAnnouncementRouteSuccessResponse, convertDeleteAnnouncementRouteSuccessResponse, AddReviewForCollectionRouteRequestBody, AddReviewForCollectionRouteSuccessResponse, convertAddReviewForCollectionRouteSuccessResponse, GetAccountsRouteRequestBody, GetAccountsRouteSuccessResponse, convertGetAccountsRouteSuccessResponse, GetAccountRouteRequestBody, GetAccountRouteSuccessResponse, convertGetAccountRouteSuccessResponse, AddReviewForUserRouteRequestBody, AddReviewForUserRouteSuccessResponse, convertAddReviewForUserRouteSuccessResponse, UpdateAccountInfoRouteRequestBody, UpdateAccountInfoRouteSuccessResponse, convertUpdateAccountInfoRouteSuccessResponse, AddBalancesToIpfsRouteRequestBody, AddBalancesToIpfsRouteSuccessResponse, convertAddBalancesToIpfsRouteSuccessResponse, AddMetadataToIpfsRouteRequestBody, AddMetadataToIpfsRouteSuccessResponse, convertAddMetadataToIpfsRouteSuccessResponse, AddMerkleChallengeToIpfsRouteRequestBody, AddMerkleChallengeToIpfsRouteSuccessResponse, convertAddMerkleChallengeToIpfsRouteSuccessResponse, GetSignInChallengeRouteRequestBody, GetSignInChallengeRouteSuccessResponse, convertGetSignInChallengeRouteSuccessResponse, VerifySignInRouteRequestBody, VerifySignInRouteSuccessResponse, convertVerifySignInRouteSuccessResponse, CheckSignInStatusRequestBody, CheckSignInStatusRequestSuccessResponse, convertCheckSignInStatusRequestSuccessResponse, SignOutRequestBody, SignOutSuccessResponse, convertSignOutSuccessResponse, GetBrowseCollectionsRouteRequestBody, GetBrowseCollectionsRouteSuccessResponse, convertGetBrowseCollectionsRouteSuccessResponse, BroadcastTxRouteRequestBody, BroadcastTxRouteSuccessResponse, convertBroadcastTxRouteSuccessResponse, SimulateTxRouteRequestBody, SimulateTxRouteSuccessResponse, convertSimulateTxRouteSuccessResponse, FetchMetadataDirectlyRouteRequestBody, FetchMetadataDirectlyRouteSuccessResponse, convertFetchMetadataDirectlyRouteSuccessResponse, GetTokensFromFaucetRouteRequestBody, GetTokensFromFaucetRouteSuccessResponse, convertGetTokensFromFaucetRouteSuccessResponse, UpdateAddressMappingsRouteRequestBody, UpdateAddressMappingsRouteSuccessResponse, convertUpdateAddressMappingsRouteSuccessResponse, GetAddressMappingsRouteRequestBody, GetAddressMappingsRouteSuccessResponse, convertGetAddressMappingsRouteSuccessResponse, DeleteAddressMappingsRouteRequestBody, DeleteAddressMappingsRouteSuccessResponse, convertDeleteAddressMappingsRouteSuccessResponse, GetApprovalsRouteRequestBody, GetApprovalsRouteSuccessResponse, convertGetApprovalsRouteSuccessResponse, GetMerkleChallengeTrackersRouteRequestBody, GetMerkleChallengeTrackersRouteSuccessResponse, convertGetMerkleChallengeTrackersRouteSuccessResponse, MetadataFetchOptions } from "./types/api";
import { convertBitBadgesCollection, BitBadgesCollection } from "./types/collections";
import { GetStatusRoute, GetSearchRoute, GetCollectionBatchRoute, GetCollectionByIdRoute, GetOwnersForBadgeRoute, GetMetadataForCollectionRoute, GetBadgeBalanceByAddressRoute, GetBadgeActivityRoute, RefreshMetadataRoute, GetAllPasswordsAndCodesRoute, GetMerkleChallengeCodeViaPasswordRoute, AddAnnouncementRoute, DeleteReviewRoute, DeleteAnnouncementRoute, AddReviewForCollectionRoute, GetAccountsRoute, GetAccountRoute, AddReviewForUserRoute, UpdateAccountInfoRoute, AddBalancesToIpfsRoute, AddMetadataToIpfsRoute, AddMerkleChallengeToIpfsRoute, GetSignInChallengeRoute, VerifySignInRoute, CheckIfSignedInRoute, SignOutRoute, GetBrowseCollectionsRoute, BroadcastTxRoute, SimulateTxRoute, FetchMetadataDirectlyRoute, GetTokensFromFaucetRoute, UpdateAddressMappingRoute, GetAddressMappingsRoute, DeleteAddressMappingRoute, GetApprovalsRoute, GetMerkleChallengeTrackerRoute } from "./types/routes";
import axiosApi from "axios";
import { stringify } from "./utils/preserveJson";
import Joi from "joi";
import { getCurrentValuesForCollection } from "./timelines";

export type DesiredNumberType = bigint;


export const axios = axiosApi.create({
  withCredentials: true,
  headers: {
    "Content-type": "application/json",
    "x-api-key": process.env.BITBADGES_API_KEY,
  },
});

let BACKEND_URL = process.env.BITBADGES_API_URL || "https://api.bitbadges.io";
let ConvertFunction = BigIntify;

//BITBADGES_API_KEY should be set in the .env file

export class BitBadgesAPI {
  constructor(backendUrl: string, convertFunction: (num: NumberType) => DesiredNumberType = BigIntify) {
    BACKEND_URL = backendUrl;
    ConvertFunction = convertFunction;
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
      const response = await axios.post<GetStatusRouteSuccessResponse<string>>(`${BACKEND_URL}${GetStatusRoute()}`, requestBody);
      return convertGetStatusRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getSearchResults(searchValue: string, requestBody?: GetSearchRouteRequestBody): Promise<GetSearchRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<GetSearchRouteSuccessResponse<string>>(`${BACKEND_URL}${GetSearchRoute(searchValue)}`, requestBody);
      return convertGetSearchRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getCollections(requestBody: GetCollectionBatchRouteRequestBody): Promise<GetCollectionBatchRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<GetCollectionBatchRouteSuccessResponse<string>>(`${BACKEND_URL}${GetCollectionBatchRoute()}`, requestBody);
      return convertGetCollectionBatchRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getCollectionById(collectionId: NumberType, requestBody: GetCollectionByIdRouteRequestBody, fetchAllMetadata = false): Promise<GetCollectionRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await axios.post<GetCollectionRouteSuccessResponse<string>>(`${BACKEND_URL}${GetCollectionByIdRoute(collectionId)}`, requestBody);
      const responseData = convertGetCollectionRouteSuccessResponse(response.data, ConvertFunction);

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

      const response = await axios.post<GetOwnersForBadgeRouteSuccessResponse<string>>(`${BACKEND_URL}${GetOwnersForBadgeRoute(collectionId, badgeId)}`, requestBody);
      return convertGetOwnersForBadgeRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getMetadataForCollection(collectionId: NumberType, requestBody: GetMetadataForCollectionRouteRequestBody): Promise<GetMetadataForCollectionRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await axios.post<GetMetadataForCollectionRouteSuccessResponse<string>>(`${BACKEND_URL}${GetMetadataForCollectionRoute(collectionId)}`, requestBody);
      return convertGetMetadataForCollectionRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getBadgeBalanceByAddress(collectionId: NumberType, cosmosAddress: string, requestBody?: GetBadgeBalanceByAddressRouteRequestBody): Promise<GetBadgeBalanceByAddressRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await axios.post<GetBadgeBalanceByAddressRouteSuccessResponse<string>>(`${BACKEND_URL}${GetBadgeBalanceByAddressRoute(collectionId, cosmosAddress)}`, requestBody);
      return convertGetBadgeBalanceByAddressRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getBadgeActivity(collectionId: NumberType, badgeId: NumberType, requestBody: GetBadgeActivityRouteRequestBody): Promise<GetBadgeActivityRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);
      this.assertPositiveInteger(badgeId);
      const response = await axios.post<GetBadgeActivityRouteSuccessResponse<string>>(`${BACKEND_URL}${GetBadgeActivityRoute(collectionId, badgeId)}`, requestBody);
      return convertGetBadgeActivityRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async refreshMetadata(collectionId: NumberType, requestBody?: RefreshMetadataRouteRequestBody): Promise<RefreshMetadataRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await axios.post<RefreshMetadataRouteSuccessResponse<string>>(`${BACKEND_URL}${RefreshMetadataRoute(collectionId)}`, requestBody);
      return convertRefreshMetadataRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getAllPasswordsAndCodes(collectionId: NumberType, requestBody?: GetAllCodesAndPasswordsRouteRequestBody): Promise<GetAllCodesAndPasswordsRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await axios.post<GetAllCodesAndPasswordsRouteSuccessResponse<string>>(`${BACKEND_URL}${GetAllPasswordsAndCodesRoute(collectionId)}`, requestBody);
      return convertGetAllCodesAndPasswordsRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getMerkleChallengeCodeViaPassword(collectionId: NumberType, cid: string, password: string, requestBody?: GetMerkleChallengeCodeViaPasswordRouteRequestBody): Promise<GetMerkleChallengeCodeViaPasswordRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await axios.post<GetMerkleChallengeCodeViaPasswordRouteSuccessResponse<string>>(`${BACKEND_URL}${GetMerkleChallengeCodeViaPasswordRoute(collectionId, cid, password)}`, requestBody);
      return convertGetMerkleChallengeCodeViaPasswordRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async addAnnouncement(collectionId: NumberType, requestBody: AddAnnouncementRouteRequestBody): Promise<AddAnnouncementRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await axios.post<AddAnnouncementRouteSuccessResponse<string>>(`${BACKEND_URL}${AddAnnouncementRoute(collectionId)}`, requestBody);
      return convertAddAnnouncementRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async deleteReview(reviewId: string, requestBody?: DeleteReviewRouteRequestBody): Promise<DeleteReviewRouteSuccessResponse<DesiredNumberType>> {
    try {

      const response = await axios.post<DeleteReviewRouteSuccessResponse<string>>(`${BACKEND_URL}${DeleteReviewRoute(reviewId)}`, requestBody);
      return convertDeleteReviewRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async deleteAnnouncement(announcementId: string, requestBody?: DeleteAnnouncementRouteRequestBody): Promise<DeleteAnnouncementRouteSuccessResponse<DesiredNumberType>> {
    try {

      const response = await axios.post<DeleteAnnouncementRouteSuccessResponse<string>>(`${BACKEND_URL}${DeleteAnnouncementRoute(announcementId)}`, requestBody);
      return convertDeleteAnnouncementRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }


  public async addReviewForCollection(collectionId: NumberType, requestBody: AddReviewForCollectionRouteRequestBody): Promise<AddReviewForCollectionRouteSuccessResponse<DesiredNumberType>> {
    try {
      this.assertPositiveInteger(collectionId);

      const response = await axios.post<AddReviewForCollectionRouteSuccessResponse<string>>(`${BACKEND_URL}${AddReviewForCollectionRoute(collectionId)}`, requestBody);
      return convertAddReviewForCollectionRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getAccounts(requestBody: GetAccountsRouteRequestBody): Promise<GetAccountsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<GetAccountsRouteSuccessResponse<string>>(`${BACKEND_URL}${GetAccountsRoute()}`, requestBody);
      return convertGetAccountsRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getAccount(addressOrUsername: string, requestBody: GetAccountRouteRequestBody): Promise<GetAccountRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<GetAccountRouteSuccessResponse<string>>(`${BACKEND_URL}${GetAccountRoute(addressOrUsername)}`, requestBody);
      return convertGetAccountRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }


  public async addReviewForUser(addressOrUsername: string, requestBody: AddReviewForUserRouteRequestBody): Promise<AddReviewForUserRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<AddReviewForUserRouteSuccessResponse<string>>(`${BACKEND_URL}${AddReviewForUserRoute(addressOrUsername)}`, requestBody);
      return convertAddReviewForUserRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async updateAccountInfo(requestBody: UpdateAccountInfoRouteRequestBody<DesiredNumberType>): Promise<UpdateAccountInfoRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<UpdateAccountInfoRouteSuccessResponse<string>>(`${BACKEND_URL}${UpdateAccountInfoRoute()}`, requestBody);
      return convertUpdateAccountInfoRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async addBalancesToIpfs(requestBody: AddBalancesToIpfsRouteRequestBody): Promise<AddBalancesToIpfsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<AddBalancesToIpfsRouteSuccessResponse<string>>(`${BACKEND_URL}${AddBalancesToIpfsRoute()}`, requestBody);
      return convertAddBalancesToIpfsRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async addMetadataToIpfs(requestBody: AddMetadataToIpfsRouteRequestBody): Promise<AddMetadataToIpfsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<AddMetadataToIpfsRouteSuccessResponse<string>>(`${BACKEND_URL}${AddMetadataToIpfsRoute()}`, requestBody);
      return convertAddMetadataToIpfsRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async addMerkleChallengeToIpfs(requestBody: AddMerkleChallengeToIpfsRouteRequestBody): Promise<AddMerkleChallengeToIpfsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<AddMerkleChallengeToIpfsRouteSuccessResponse<string>>(`${BACKEND_URL}${AddMerkleChallengeToIpfsRoute()}`, requestBody);
      return convertAddMerkleChallengeToIpfsRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getSignInChallenge(requestBody: GetSignInChallengeRouteRequestBody): Promise<GetSignInChallengeRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<GetSignInChallengeRouteSuccessResponse<string>>(`${BACKEND_URL}${GetSignInChallengeRoute()}`, requestBody);
      return convertGetSignInChallengeRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async verifySignIn(requestBody: VerifySignInRouteRequestBody): Promise<VerifySignInRouteSuccessResponse<DesiredNumberType>> {
    try {
      const body = stringify(requestBody);
      const response = await axios.post<VerifySignInRouteSuccessResponse<string>>(`${BACKEND_URL}${VerifySignInRoute()}`, body);
      return convertVerifySignInRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async checkIfSignedIn(requestBody: CheckSignInStatusRequestBody): Promise<CheckSignInStatusRequestSuccessResponse<DesiredNumberType>> {
    try {
      const body = stringify(requestBody);
      const response = await axios.post<CheckSignInStatusRequestSuccessResponse<string>>(`${BACKEND_URL}${CheckIfSignedInRoute()}`, body);
      return convertCheckSignInStatusRequestSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async signOut(requestBody?: SignOutRequestBody): Promise<SignOutSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<SignOutSuccessResponse<string>>(`${BACKEND_URL}${SignOutRoute()}`, requestBody);
      return convertSignOutSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getBrowseCollections(requestBody?: GetBrowseCollectionsRouteRequestBody): Promise<GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<GetBrowseCollectionsRouteSuccessResponse<string>>(`${BACKEND_URL}${GetBrowseCollectionsRoute()}`, requestBody);
      return convertGetBrowseCollectionsRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async broadcastTx(requestBody: BroadcastTxRouteRequestBody | string): Promise<BroadcastTxRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<BroadcastTxRouteSuccessResponse<string>>(`${BACKEND_URL}${BroadcastTxRoute()}`, requestBody);
      return convertBroadcastTxRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async simulateTx(requestBody: SimulateTxRouteRequestBody | string): Promise<SimulateTxRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<SimulateTxRouteSuccessResponse<string>>(`${BACKEND_URL}${SimulateTxRoute()}`, requestBody);
      return convertSimulateTxRouteSuccessResponse(response.data, ConvertFunction);
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

      const response = await axios.post<FetchMetadataDirectlyRouteSuccessResponse<string>>(`${BACKEND_URL}${FetchMetadataDirectlyRoute()}`, requestBody);
      return convertFetchMetadataDirectlyRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getTokensFromFaucet(requestBody?: GetTokensFromFaucetRouteRequestBody): Promise<GetTokensFromFaucetRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<GetTokensFromFaucetRouteSuccessResponse<string>>(`${BACKEND_URL}${GetTokensFromFaucetRoute()}`, requestBody);
      return convertGetTokensFromFaucetRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async updateAddressMappings(requestBody?: UpdateAddressMappingsRouteRequestBody): Promise<UpdateAddressMappingsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<UpdateAddressMappingsRouteSuccessResponse<string>>(`${BACKEND_URL}${UpdateAddressMappingRoute()}`, requestBody);
      return convertUpdateAddressMappingsRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getAddressMappings(requestBody?: GetAddressMappingsRouteRequestBody): Promise<GetAddressMappingsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<GetAddressMappingsRouteSuccessResponse<string>>(`${BACKEND_URL}${GetAddressMappingsRoute()}`, requestBody);
      return convertGetAddressMappingsRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async deleteAddressMappings(requestBody?: DeleteAddressMappingsRouteRequestBody): Promise<DeleteAddressMappingsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<DeleteAddressMappingsRouteSuccessResponse<string>>(`${BACKEND_URL}${DeleteAddressMappingRoute()}`, requestBody);
      return convertDeleteAddressMappingsRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }


  public async getApprovalTrackers(requestBody?: GetApprovalsRouteRequestBody): Promise<GetApprovalsRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<GetApprovalsRouteSuccessResponse<string>>(`${BACKEND_URL}${GetApprovalsRoute()}`, requestBody);
      return convertGetApprovalsRouteSuccessResponse(response.data, ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getMerkleChallengeTrackers(requestBody?: GetMerkleChallengeTrackersRouteRequestBody): Promise<GetMerkleChallengeTrackersRouteSuccessResponse<DesiredNumberType>> {
    try {
      const response = await axios.post<GetMerkleChallengeTrackersRouteSuccessResponse<string>>(`${BACKEND_URL}${GetMerkleChallengeTrackerRoute()}`, requestBody);
      return convertGetMerkleChallengeTrackersRouteSuccessResponse(response.data, ConvertFunction);
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
