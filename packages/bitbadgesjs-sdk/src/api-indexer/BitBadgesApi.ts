import type { NumberType } from '@/common/string-numbers.js';
import { BitBadgesCollection, GetCollectionsSuccessResponse, iGetCollectionsPayload } from './BitBadgesCollection.js';

import type { CollectionId, iAmountTrackerIdDetails } from '@/interfaces/index.js';
import typia from 'typia';
import type { GetAccountSuccessResponse, GetAccountsSuccessResponse, iGetAccountPayload, iGetAccountsPayload } from './BitBadgesUserInfo.js';
import { BitBadgesUserInfo } from './BitBadgesUserInfo.js';
import type { iBitBadgesApi } from './base.js';
import { BaseBitBadgesApi } from './base.js';
import type { DynamicDataHandlerType, NativeAddress, iChallengeTrackerIdDetails } from './docs-types/interfaces.js';
import {
  FilterSuggestionsSuccessResponse,
  FilterTokensInCollectionSuccessResponse,
  GetBalanceByAddressSuccessResponse,
  GetOwnersSuccessResponse,
  GetTokenActivitySuccessResponse,
  RefreshMetadataSuccessResponse,
  RefreshStatusSuccessResponse,
  iFilterSuggestionsPayload,
  iFilterSuggestionsSuccessResponse,
  iFilterTokensInCollectionPayload,
  iGetBalanceByAddressPayload,
  iGetBalanceByAddressSuccessResponse,
  iGetOwnersPayload,
  iGetTokenActivityPayload,
  iRefreshMetadataPayload
} from './requests/collections.js';
import {
  GetMapSuccessResponse,
  GetMapValueSuccessResponse,
  GetMapValuesSuccessResponse,
  GetMapsSuccessResponse,
  iGetMapPayload,
  iGetMapSuccessResponse,
  iGetMapValueSuccessResponse,
  iGetMapValuesPayload,
  iGetMapValuesSuccessResponse,
  iGetMapsPayload,
  iGetMapsSuccessResponse
} from './requests/maps.js';
import {
  AddApprovalDetailsToOffChainStorageSuccessResponse,
  AddToIpfsSuccessResponse,
  BatchStoreActionSuccessResponse,
  BroadcastTxSuccessResponse,
  CalculatePointsSuccessResponse,
  CheckClaimSuccessSuccessResponse,
  CheckSignInStatusSuccessResponse,
  CompleteClaimSuccessResponse,
  CreateApiKeySuccessResponse,
  CreateApplicationSuccessResponse,
  CreateClaimSuccessResponse,
  CreateDeveloperAppSuccessResponse,
  CreateDynamicDataStoreSuccessResponse,
  CreatePaymentIntentSuccessResponse,
  CreatePluginSuccessResponse,
  CreateSIWBBRequestSuccessResponse,
  CreateUtilityPageSuccessResponse,
  DeleteApiKeySuccessResponse,
  DeleteApplicationSuccessResponse,
  DeleteClaimSuccessResponse,
  DeleteDeveloperAppSuccessResponse,
  DeleteDynamicDataStoreSuccessResponse,
  DeletePluginSuccessResponse,
  DeleteSIWBBRequestSuccessResponse,
  DeleteUtilityPageSuccessResponse,
  ExchangeSIWBBAuthorizationCodeSuccessResponse,
  FetchMetadataDirectlySuccessResponse,
  GenericBlockinVerifySuccessResponse,
  GenericVerifyAssetsSuccessResponse,
  GetActiveAuthorizationsSuccessResponse,
  GetApiKeysSuccessResponse,
  GetApplicationSuccessResponse,
  GetApplicationsSuccessResponse,
  GetAttemptDataFromRequestBinSuccessResponse,
  GetBrowseSuccessResponse,
  GetClaimAttemptStatusSuccessResponse,
  GetClaimAttemptsSuccessResponse,
  GetClaimSuccessResponse,
  GetClaimsSuccessResponse,
  GetCollectionAmountTrackerByIdSuccessResponse,
  GetCollectionChallengeTrackerByIdSuccessResponse,
  GetDeveloperAppSuccessResponse,
  GetDeveloperAppsSuccessResponse,
  GetDynamicDataActivitySuccessResponse,
  GetDynamicDataStoreSuccessResponse,
  GetDynamicDataStoreValueSuccessResponse,
  GetDynamicDataStoreValuesPaginatedSuccessResponse,
  GetDynamicDataStoresSuccessResponse,
  GetGatedContentForClaimSuccessResponse,
  GetPluginErrorsSuccessResponse,
  GetPluginSuccessResponse,
  GetPluginsSuccessResponse,
  GetPointsActivitySuccessResponse,
  GetReservedClaimCodesSuccessResponse,
  GetSIWBBRequestsForDeveloperAppSuccessResponse,
  GetSearchSuccessResponse,
  GetSignInChallengeSuccessResponse,
  GetStatusSuccessResponse,
  GetTokensFromFaucetSuccessResponse,
  GetUtilityPageSuccessResponse,
  GetUtilityPagesSuccessResponse,
  OauthRevokeSuccessResponse,
  PerformStoreActionSuccessResponse,
  RotateApiKeySuccessResponse,
  RotateSIWBBRequestSuccessResponse,
  ScheduleTokenRefreshSuccessResponse,
  SearchApplicationsSuccessResponse,
  SearchClaimsSuccessResponse,
  SearchDeveloperAppsSuccessResponse,
  SearchDynamicDataStoresSuccessResponse,
  SearchPluginsSuccessResponse,
  SearchUtilityPagesSuccessResponse,
  SignOutSuccessResponse,
  SimulateClaimSuccessResponse,
  SimulateTxSuccessResponse,
  UpdateAccountInfoSuccessResponse,
  UpdateApplicationSuccessResponse,
  UpdateClaimSuccessResponse,
  UpdateDeveloperAppSuccessResponse,
  UpdateDynamicDataStoreSuccessResponse,
  UpdatePluginSuccessResponse,
  UpdateUtilityPageSuccessResponse,
  VerifySignInSuccessResponse,
  iAddApprovalDetailsToOffChainStoragePayload,
  iAddApprovalDetailsToOffChainStorageSuccessResponse,
  iAddToIpfsPayload,
  iAddToIpfsSuccessResponse,
  iBroadcastTxPayload,
  iBroadcastTxSuccessResponse,
  iCalculatePointsPayload,
  iCheckSignInStatusPayload,
  iCheckSignInStatusSuccessResponse,
  iCompleteClaimPayload,
  iCompleteClaimSuccessResponse,
  iCreateApiKeyPayload,
  iCreateApplicationPayload,
  iCreateClaimPayload,
  iCreateDeveloperAppPayload,
  iCreateDynamicDataStorePayload,
  iCreateDynamicDataStoreSuccessResponse,
  iCreatePaymentIntentPayload,
  iCreatePaymentIntentSuccessResponse,
  iCreatePluginPayload,
  iCreateSIWBBRequestPayload,
  iCreateSIWBBRequestSuccessResponse,
  iCreateUtilityPagePayload,
  iDeleteApiKeyPayload,
  iDeleteApplicationPayload,
  iDeleteClaimPayload,
  iDeleteDeveloperAppPayload,
  iDeleteDynamicDataStorePayload,
  iDeletePluginPayload,
  iDeleteSIWBBRequestPayload,
  iDeleteSIWBBRequestSuccessResponse,
  iDeleteUtilityPagePayload,
  iExchangeSIWBBAuthorizationCodePayload,
  iExchangeSIWBBAuthorizationCodeSuccessResponse,
  iFetchMetadataDirectlyPayload,
  iFetchMetadataDirectlySuccessResponse,
  iGenericBlockinVerifyPayload,
  iGenericBlockinVerifySuccessResponse,
  iGenericVerifyAssetsPayload,
  iGenericVerifyAssetsSuccessResponse,
  iGetActiveAuthorizationsPayload,
  iGetApiKeysPayload,
  iGetApplicationPayload,
  iGetApplicationsPayload,
  iGetAttemptDataFromRequestBinPayload,
  iGetBrowsePayload,
  iGetBrowseSuccessResponse,
  iGetClaimAttemptStatusSuccessResponse,
  iGetClaimAttemptsPayload,
  iGetClaimPayload,
  iGetClaimsPayloadV1,
  iGetClaimsSuccessResponse,
  iGetCollectionAmountTrackerByIdSuccessResponse,
  iGetCollectionChallengeTrackerByIdSuccessResponse,
  iGetDeveloperAppPayload,
  iGetDeveloperAppsPayload,
  iGetDynamicDataActivityPayload,
  iGetDynamicDataStorePayload,
  iGetDynamicDataStoreValuePayload,
  iGetDynamicDataStoreValuesPaginatedPayload,
  iGetDynamicDataStoresPayload,
  iGetDynamicDataStoresSuccessResponse,
  iGetGatedContentForClaimPayload,
  iGetPluginErrorsPayload,
  iGetPluginPayload,
  iGetPluginsPayload,
  iGetPointsActivityPayload,
  iGetPointsActivitySuccessResponse,
  iGetReservedClaimCodesPayload,
  iGetReservedClaimCodesSuccessResponse,
  iGetSIWBBRequestsForDeveloperAppPayload,
  iGetSIWBBRequestsForDeveloperAppSuccessResponse,
  iGetSearchPayload,
  iGetSearchSuccessResponse,
  iGetSignInChallengePayload,
  iGetSignInChallengeSuccessResponse,
  iGetStatusPayload,
  iGetStatusSuccessResponse,
  iGetTokensFromFaucetPayload,
  iGetTokensFromFaucetSuccessResponse,
  iGetUtilityPagePayload,
  iGetUtilityPagesPayload,
  iOauthRevokePayload,
  iPerformStoreActionBatchWithBodyAuthPayload,
  iPerformStoreActionSingleWithBodyAuthPayload,
  iRotateApiKeyPayload,
  iRotateSIWBBRequestPayload,
  iRotateSIWBBRequestSuccessResponse,
  iScheduleTokenRefreshPayload,
  iSearchApplicationsPayload,
  iSearchClaimsPayload,
  iSearchDeveloperAppsPayload,
  iSearchDynamicDataStoresPayload,
  iSearchPluginsPayload,
  iSearchUtilityPagesPayload,
  iSignOutPayload,
  iSignOutSuccessResponse,
  iSimulateClaimPayload,
  iSimulateClaimSuccessResponse,
  iSimulateTxPayload,
  iSimulateTxSuccessResponse,
  iUpdateAccountInfoPayload,
  iUpdateAccountInfoSuccessResponse,
  iUpdateApplicationPayload,
  iUpdateClaimPayload,
  iUpdateDeveloperAppPayload,
  iUpdateDynamicDataStorePayload,
  iUpdateDynamicDataStoreSuccessResponse,
  iUpdatePluginPayload,
  iUpdateUtilityPagePayload,
  iVerifySignInPayload,
  iVerifySignInSuccessResponse
} from './requests/requests.js';
import { BitBadgesApiRoutes } from './requests/routes.js';
import {
  GetTokenMetadataSuccessResponse,
  GetTokensViewForUserSuccessResponse,
  GetClaimActivityForUserSuccessResponse,
  GetCollectionAmountTrackersSuccessResponse,
  GetCollectionChallengeTrackersSuccessResponse,
  GetCollectionClaimsSuccessResponse,
  GetCollectionListingsSuccessResponse,
  GetCollectionOwnersSuccessResponse,
  GetCollectionSuccessResponse,
  GetCollectionTransferActivitySuccessResponse,
  GetPointsActivityForUserSuccessResponse,
  GetSiwbbRequestsForUserSuccessResponse,
  GetTransferActivityForUserSuccessResponse,
  iGetTokenMetadataSuccessResponse,
  iGetTokensViewForUserPayload,
  iGetTokensViewForUserSuccessResponse,
  iGetClaimActivityForUserPayload,
  iGetClaimActivityForUserSuccessResponse,
  iGetCollectionAmountTrackersPayload,
  iGetCollectionAmountTrackersSuccessResponse,
  iGetCollectionChallengeTrackersPayload,
  iGetCollectionChallengeTrackersSuccessResponse,
  iGetCollectionClaimsSuccessResponse,
  iGetCollectionListingsPayload,
  iGetCollectionListingsSuccessResponse,
  iGetCollectionOwnersPayload,
  iGetCollectionOwnersSuccessResponse,
  iGetCollectionPayload,
  iGetCollectionSuccessResponse,
  iGetCollectionTransferActivityPayload,
  iGetCollectionTransferActivitySuccessResponse,
  iGetPointsActivityForUserPayload,
  iGetPointsActivityForUserSuccessResponse,
  iGetSiwbbRequestsForUserPayload,
  iGetSiwbbRequestsForUserSuccessResponse,
  iGetTransferActivityForUserPayload,
  iGetTransferActivityForUserSuccessResponse
} from './requests/wrappers.js';
import { DeleteConnectedAccountSuccessResponse, GetConnectedAccountsSuccessResponse } from './responses/stripe.js';

/**
 * This is the BitBadgesAPI class which provides all typed API calls to the BitBadges API.
 * See official documentation for more details and examples. Must pass in a valid API key.
 *,
  iGetDeveloperAppsPayload
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
   * - **API Route**: `GET /api/v0/status`
   * - **SDK Function Call**: `await BitBadgesApi.getStatus();`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getStatus();
   * console.log(res);
   * ```
   * */
  public async getStatus(payload?: iGetStatusPayload): Promise<GetStatusSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetStatusPayload> = typia.validate<iGetStatusPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetStatusSuccessResponse<string>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetStatusRoute()}`, {
        params: payload
      });
      return new GetStatusSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Search collections, tokens, accounts based on a search value.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/search/:searchValue`
   * - **SDK Function Call**: `await BitBadgesApi.getSearchResults(searchValue);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getSearchResults('vitalik.eth', {  noCollections: true });
   * console.log(res);
   * ```
   */
  public async getSearchResults(searchValue: string, payload?: iGetSearchPayload<NumberType>): Promise<GetSearchSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetSearchPayload<NumberType>> = typia.validate<iGetSearchPayload<NumberType>>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * This function retrieves collections and accompanying details. Consider using the `getCollectionsAndUpdate` function instead for native support in handling paginations, appending metadata, and more.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collections`
   * - **Tutorial**: Refer to the [Fetching Collections tutorial](https://docs.bitbadges.io/for-developers/bitbadges-api/tutorials/fetching-collections) on the official documentation.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getCollections([{ collectionId, metadataToFetch: { tokenIds: [{ start: 1n, end: 10n }] } }]);
   * const collection = res.collections[0];
   * ```
   */
  public async getCollections(payload: iGetCollectionsPayload): Promise<GetCollectionsSuccessResponse<T>> {
    return await BitBadgesCollection.GetCollections(this, payload);
  }

  /**
   * Gets the owners for a specific token in a collection
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId/:tokenId/owners`
   * - **SDK Function Call**: `await BitBadgesApi.getOwners(collectionId, tokenId, payload);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getOwners(collectionId, tokenId, { bookmark: 'prev' });
   * console.log(res);
   * ```
   */
  public async getOwners(collectionId: CollectionId, tokenId: NumberType, payload: iGetOwnersPayload): Promise<GetOwnersSuccessResponse<T>> {
    return await BitBadgesCollection.GetOwners<T>(this, collectionId, tokenId, payload);
  }

  /**
   * Gets the balance of a specific token for a specific address
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/balance/:address`
   * - **SDK Function Call**: `await BitBadgesApi.getBalanceByAddress(collectionId, address);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getBalanceByAddress(collectionId, address);
   * console.log(res);
   * ```
   */
  public async getBalanceByAddress(
    collectionId: CollectionId,
    address: NativeAddress,
    payload?: iGetBalanceByAddressPayload
  ): Promise<GetBalanceByAddressSuccessResponse<T>> {
    return await BitBadgesCollection.GetBalanceByAddress(this, collectionId, address, payload);
  }

  /**
   * Gets the balance for an address at the current time. This is a streamlined version of
   * getBalanceByAddress.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId/:tokenId/balance/:address`
   * - **SDK Function Call**: `await BitBadgesApi.getBalanceByAddress(collectionId, tokenId, address);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getBalanceByAddress(collectionId, tokenId, address);
   * console.log(res);
   * ```
   */
  public async getBalanceByAddressSpecificToken(
    collectionId: CollectionId,
    tokenId: NumberType,
    address: NativeAddress,
    payload?: iGetBalanceByAddressPayload
  ): Promise<GetBalanceByAddressSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetBalanceByAddressPayload> = typia.validate<iGetBalanceByAddressPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetBalanceByAddressSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetBalanceByAddressSpecificTokenRoute(collectionId, address, tokenId)}`
      );
      return new GetBalanceByAddressSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the activity for a specific token in a collection
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId/:tokenId/activity`
   * - **SDK Function Call**: `await BitBadgesApi.getTokenActivity(collectionId, tokenId, payload);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getTokenActivity(collectionId, tokenId, { bookmark: 'prev' });
   * console.log(res);
   * ```
   */
  public async getTokenActivity(
    collectionId: CollectionId,
    tokenId: NumberType,
    payload: iGetTokenActivityPayload
  ): Promise<GetTokenActivitySuccessResponse<T>> {
    return await BitBadgesCollection.GetTokenActivity<T>(this, collectionId, tokenId, payload);
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
  public async refreshMetadata(collectionId: CollectionId, payload?: iRefreshMetadataPayload): Promise<RefreshMetadataSuccessResponse> {
    return await BitBadgesCollection.RefreshMetadata(this, collectionId, payload);
  }

  /**
   * For password based approvals, we hand out codes behind the scenes whenever a user requests a password.
   * This is to prevent replay attacks on the blockchain. This API call will return a valid code if a valid password is provided.
   *
   * Each address is limited to one code per password. If the password is provided again, they will receive the same code.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/claims/complete/:claimId/:address`
   * - **SDK Function Call**: `await BitBadgesApi.completeClaim(claimId, address, { ...body });`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.completeClaim(claimId, address, { ...body });
   * console.log(res);
   * ```
   */
  public async completeClaim(claimId: string, address: string, payload: iCompleteClaimPayload): Promise<CompleteClaimSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iCompleteClaimPayload> = typia.validate<iCompleteClaimPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      if (!claimId) {
        throw new Error('claimId is required');
      }

      const response = await this.axios.post<iCompleteClaimSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CompleteClaimRoute(claimId, address)}`,
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
   * - **API Route**: `POST /api/v0/claims/simulate/:claimId/:address`
   * - **SDK Function Call**: `await BitBadgesApi.simulateClaim(claimId, address, { ...body });`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.simulateClaim(claimId, address, { ...body });
   * console.log(res);
   * ```
   */
  public async simulateClaim(claimId: string, address: string, payload: iSimulateClaimPayload): Promise<SimulateClaimSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iSimulateClaimPayload> = typia.validate<iSimulateClaimPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      if (!claimId) {
        throw new Error('claimId is required');
      }

      const response = await this.axios.post<iSimulateClaimSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SimulateClaimRoute(claimId, address)}`,
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
   * - **API Route**: `POST /api/v0/claims/reserved/:claimId/:address`
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
    address: string,
    payload: iGetReservedClaimCodesPayload
  ): Promise<GetReservedClaimCodesSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iGetReservedClaimCodesPayload> = typia.validate<iGetReservedClaimCodesPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      if (!claimId) {
        throw new Error('claimId is required');
      }

      const response = await this.axios.post<iGetReservedClaimCodesSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetReservedClaimCodesRoute(claimId, address)}`,
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
      typia.assert<string>(claimAttemptId);
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
   * const res = await BitBadgesApi.getAccounts([{ address }]);
   * console.log(res);
   * ```
   *
   * @note
   * This function is used to fetch accounts and their details. It is your responsibility to join the data together (paginations, etc).
   * Use getAccountsAndUpdate for a more convenient way to handle paginations and appending metadata.
   */
  public async getAccounts(payload: iGetAccountsPayload): Promise<GetAccountsSuccessResponse<T>> {
    return await BitBadgesUserInfo.GetAccounts(this, payload);
  }

  /**
   * Gets an account by address or username.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/user`
   * - **SDK Function Call**: `await BitBadgesApi.getAccount({ address: '...', username: '...' });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getAccount({ address: '...', username: '...' });
   * console.log(res);
   * ```
   */
  public async getAccount(payload: iGetAccountPayload): Promise<GetAccountSuccessResponse<T>> {
    return await BitBadgesUserInfo.GetAccount(this, payload);
  }

  /**
   * Checks if the user is signed in.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/auth/status`
   * - **SDK Function Call**: `await BitBadgesApi.checkIfSignedIn(payload);`
   * - **Tutorial**: See Authentication tutorial on the official docs.
   */
  public async checkIfSignedIn(payload?: iCheckSignInStatusPayload): Promise<CheckSignInStatusSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iCheckSignInStatusPayload> = typia.validate<iCheckSignInStatusPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * Broadcasts a transaction to the blockchain.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/broadcast`
   * - **SDK Function Call**: `await BitBadgesApi.broadcastTx(payload);`
   * - **Tutorial**: See Broadcasting Transactions tutorial on the official docs.
   *
   * Also, consider checking out [Broadcast UI](https://bitbadges.io/dev/broadcast), so you can simply copy and paste your transaction to a UI. All signing, API communication, etc is outsourced to the UI.
   */
  public async broadcastTx(payload: iBroadcastTxPayload | string): Promise<BroadcastTxSuccessResponse> {
    try {
      // const validateRes: typia.IValidation<iBroadcastTxPayload> = typia.validate<iBroadcastTxPayload>(payload ?? {});
      // if (!validateRes.success) {
      //   throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      // }

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
  public async simulateTx(payload: iSimulateTxPayload | string): Promise<SimulateTxSuccessResponse> {
    try {
      // const validateRes: typia.IValidation<iSimulateTxPayload> = typia.validate<iSimulateTxPayload>(payload ?? {});
      // if (!validateRes.success) {
      //   throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      // }

      const response = await this.axios.post<iSimulateTxSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.SimulateTxRoute()}`, payload);
      return new SimulateTxSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets and verifies a SIWBB request.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbbRequest`
   * - **SDK Function Call**: `await BitBadgesApi.exchangeSIWBBAuthorizationCode(payload);`
   */
  public async exchangeSIWBBAuthorizationCode(
    payload?: iExchangeSIWBBAuthorizationCodePayload
  ): Promise<ExchangeSIWBBAuthorizationCodeSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iExchangeSIWBBAuthorizationCodePayload> = typia.validate<iExchangeSIWBBAuthorizationCodePayload>(
        payload ?? {}
      );
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iExchangeSIWBBAuthorizationCodeSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.ExchangeSIWBBAuthorizationCodesRoute()}`,
        payload
      );
      return new ExchangeSIWBBAuthorizationCodeSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the SIWBB requests for a specific developer app.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/developerApps/siwbbRequests`
   * - **SDK Function Call**: `await BitBadgesApi.getSIWBBRequestsForDeveloperApp(payload);`
   */
  public async getSIWBBRequestsForDeveloperApp(
    payload: iGetSIWBBRequestsForDeveloperAppPayload
  ): Promise<GetSIWBBRequestsForDeveloperAppSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetSIWBBRequestsForDeveloperAppPayload> = typia.validate<iGetSIWBBRequestsForDeveloperAppPayload>(
        payload ?? {}
      );
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetSIWBBRequestsForDeveloperAppSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetSIWBBRequestsForDeveloperAppRoute()}`,
        { params: payload }
      );
      return new GetSIWBBRequestsForDeveloperAppSuccessResponse(response.data).convert(this.ConvertFunction);
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
  public async createSIWBBRequest(payload?: iCreateSIWBBRequestPayload): Promise<CreateSIWBBRequestSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iCreateSIWBBRequestPayload> = typia.validate<iCreateSIWBBRequestPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * Rotates a SIWBB request.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbbRequest/rotate`
   * - **SDK Function Call**: `await BitBadgesApi.rotateSIWBBRequest(payload);`
   */
  public async rotateSIWBBRequest(payload: iRotateSIWBBRequestPayload): Promise<RotateSIWBBRequestSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iRotateSIWBBRequestPayload> = typia.validate<iRotateSIWBBRequestPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iRotateSIWBBRequestSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.RotateSIWBBRequestRoute()}`,
        payload
      );
      return new RotateSIWBBRequestSuccessResponse(response.data);
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
  public async deleteSIWBBRequest(payload?: iDeleteSIWBBRequestPayload): Promise<DeleteSIWBBRequestSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iDeleteSIWBBRequestPayload> = typia.validate<iDeleteSIWBBRequestPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * Gets the refresh status for a collection. Used to track if any errors occur during a refresh, or if it is in the queue or not.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId/refreshStatus`
   * - **SDK Function Call**: `await BitBadgesApi.getRefreshStatus(payload);`
   */
  public async getRefreshStatus(collectionId: CollectionId): Promise<RefreshStatusSuccessResponse<NumberType>> {
    return await BitBadgesCollection.GetRefreshStatus(this, collectionId);
  }

  /**
   * Get maps by ID
   *
   * @remarks
   * - **API Route**: `POST /api/v0/maps`
   * - **SDK Function Call**: `await BitBadgesApi.getMaps(payload);`
   */
  public async getMaps(payload: iGetMapsPayload): Promise<GetMapsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetMapsPayload> = typia.validate<iGetMapsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iGetMapsSuccessResponse<string>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetMapsRoute()}`, payload);
      return new GetMapsSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get map by ID
   *
   * @remarks
   * - **API Route**: `GET /api/v0/map/{mapId}`
   * - **SDK Function Call**: `await BitBadgesApi.getMap(payload);`
   */
  public async getMap(mapId: string, payload?: iGetMapPayload): Promise<GetMapSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetMapPayload> = typia.validate<iGetMapPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetMapSuccessResponse<string>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetMapRoute(mapId)}`, {
        params: payload
      });
      return new GetMapSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get map values
   *
   * @remarks
   * - **API Route**: `POST /api/v0/mapValues`
   * - **SDK Function Call**: `await BitBadgesApi.getMapValues(payload);`
   */
  public async getMapValues(payload: iGetMapValuesPayload): Promise<GetMapValuesSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iGetMapValuesPayload> = typia.validate<iGetMapValuesPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iGetMapValuesSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetMapValuesRoute()}`, payload);
      return new GetMapValuesSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get map value by ID
   *
   * @remarks
   * - **API Route**: `GET /api/v0/mapValue/{mapId}/{key}`
   * - **SDK Function Call**: `await BitBadgesApi.getMapValue(mapId, key);`
   */
  public async getMapValue(mapId: string, key: string): Promise<GetMapValueSuccessResponse> {
    try {
      const response = await this.axios.get<iGetMapValueSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetMapValueRoute(mapId, key)}`);
      return new GetMapValueSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Filters tokens in a collection based on multiple filter values.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/filter`
   * - **SDK Function Call**: `await BitBadgesApi.FilterTokensInCollection(payload);`
   */
  public async FilterTokensInCollection(
    collectionId: CollectionId,
    payload: iFilterTokensInCollectionPayload
  ): Promise<FilterTokensInCollectionSuccessResponse<T>> {
    return await BitBadgesCollection.FilterTokensInCollection(this, collectionId, payload);
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
  public async getClaims(payload: iGetClaimsPayloadV1): Promise<GetClaimsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetClaimsPayloadV1> = typia.validate<iGetClaimsPayloadV1>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iGetClaimsSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetClaimsRoute()}`, payload);
      return new GetClaimsSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Searches for claims.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/claims/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchClaims(payload);`
   */
  public async searchClaims(payload: iSearchClaimsPayload): Promise<SearchClaimsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iSearchClaimsPayload> = typia.validate<iSearchClaimsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<SearchClaimsSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.SearchClaimsRoute()}`, {
        params: payload
      });
      return new SearchClaimsSuccessResponse<T>(response.data);
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
  public async createClaims(payload: iCreateClaimPayload): Promise<CreateClaimSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iCreateClaimPayload> = typia.validate<iCreateClaimPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
  public async deleteClaims(payload: iDeleteClaimPayload): Promise<DeleteClaimSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iDeleteClaimPayload> = typia.validate<iDeleteClaimPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
  public async updateClaims(payload: iUpdateClaimPayload): Promise<UpdateClaimSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iUpdateClaimPayload> = typia.validate<iUpdateClaimPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.put<UpdateClaimSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDClaimsRoute()}`, payload);
      return new UpdateClaimSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Revokes an access token for a user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbb/token/revoke`
   * - **SDK Function Call**: `await BitBadgesApi.oauthRevoke(payload);`
   */
  public async revokeOauthAuthorization(payload: iOauthRevokePayload): Promise<OauthRevokeSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iOauthRevokePayload> = typia.validate<iOauthRevokePayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<OauthRevokeSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.OauthRevokeRoute()}`, payload);
      return new OauthRevokeSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get the gated content for a claim.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/claims/gatedContent/{claimId}`
   * - **SDK Function Call**: `await BitBadgesApi.getGatedContentForClaim(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async getGatedContentForClaim(
    claimId: string,
    payload?: iGetGatedContentForClaimPayload
  ): Promise<GetGatedContentForClaimSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetGatedContentForClaimPayload> = typia.validate<iGetGatedContentForClaimPayload>({});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<GetGatedContentForClaimSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetGatedContentForClaimRoute(claimId)}`,
        { params: payload }
      );
      return new GetGatedContentForClaimSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Performs an action for a dynamicStore.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/storeActions/single`
   * - **SDK Function Call**: `await BitBadgesApi.performStoreAction(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async performStoreAction(payload: iPerformStoreActionSingleWithBodyAuthPayload): Promise<PerformStoreActionSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iPerformStoreActionSingleWithBodyAuthPayload> =
        typia.validate<iPerformStoreActionSingleWithBodyAuthPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<PerformStoreActionSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.PerformStoreActionSingleWithBodyAuthRoute()}`,
        payload
      );
      return new PerformStoreActionSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Performs multiple actions for a dynamicStore in batch.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/storeActions/batch`
   * - **SDK Function Call**: `await BitBadgesApi.performBatchStoreAction(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async performBatchStoreAction(payload: iPerformStoreActionBatchWithBodyAuthPayload): Promise<BatchStoreActionSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iPerformStoreActionBatchWithBodyAuthPayload> = typia.validate<iPerformStoreActionBatchWithBodyAuthPayload>(
        payload ?? {}
      );
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<PerformStoreActionSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.PerformStoreActionBatchWithBodyAuthRoute()}`,
        {
          ...payload
        }
      );
      return new BatchStoreActionSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get dynamic data store activity
   *
   * @remarks
   * - **API Route**: `GET /api/v0/dynamicStores/activity`
   * - **SDK Function Call**: `await BitBadgesApi.getDynamicDataActivity(payload);`
   */
  public async getDynamicDataActivity(payload: iGetDynamicDataActivityPayload): Promise<GetDynamicDataActivitySuccessResponse> {
    try {
      const response = await this.axios.get<GetDynamicDataActivitySuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetDynamicDataStoreActivityRoute()}`,
        { params: payload }
      );
      return new GetDynamicDataActivitySuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets dynamic data stores.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/dynamicStores/fetch`
   * - **SDK Function Call**: `await BitBadgesApi.getDynamicDataStores(payload);`
   */
  public async getDynamicDataStores<Q extends DynamicDataHandlerType, NumberType>(
    payload: iGetDynamicDataStoresPayload
  ): Promise<GetDynamicDataStoresSuccessResponse<Q, T>> {
    try {
      const validateRes: typia.IValidation<iGetDynamicDataStoresPayload> = typia.validate<iGetDynamicDataStoresPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iGetDynamicDataStoresSuccessResponse<Q, string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetDynamicDataStoresRoute()}`,
        payload
      );
      return new GetDynamicDataStoresSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Searches dynamic data stores.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/dynamicStores/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchDynamicDataStores(payload);`
   */
  public async searchDynamicDataStores<Q extends DynamicDataHandlerType>(
    payload: iSearchDynamicDataStoresPayload
  ): Promise<SearchDynamicDataStoresSuccessResponse<Q, T>> {
    try {
      const validateRes: typia.IValidation<iSearchDynamicDataStoresPayload> = typia.validate<iSearchDynamicDataStoresPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<SearchDynamicDataStoresSuccessResponse<Q, NumberType>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SearchDynamicDataStoresRoute()}`,
        { params: payload }
      );
      return new SearchDynamicDataStoresSuccessResponse<Q, NumberType>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets applications.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/applications/fetch`
   * - **SDK Function Call**: `await BitBadgesApi.getApplications(payload);`
   */
  public async getApplications(payload: iGetApplicationsPayload): Promise<GetApplicationsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetApplicationsPayload> = typia.validate<iGetApplicationsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<GetApplicationsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetApplicationsRoute()}`,
        payload
      );
      return new GetApplicationsSuccessResponse<T>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Searches for applications.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/applications/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchApplications(payload);`
   */
  public async searchApplications(payload: iSearchApplicationsPayload): Promise<SearchApplicationsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iSearchApplicationsPayload> = typia.validate<iSearchApplicationsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<SearchApplicationsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SearchApplicationsRoute()}`,
        { params: payload }
      );
      return new SearchApplicationsSuccessResponse<T>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates an application.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/applications`
   * - **SDK Function Call**: `await BitBadgesApi.createApplication(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async createApplication(payload: iCreateApplicationPayload): Promise<CreateApplicationSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iCreateApplicationPayload> = typia.validate<iCreateApplicationPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<CreateApplicationSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDApplicationsRoute()}`,
        payload
      );
      return new CreateApplicationSuccessResponse<T>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates an application.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/applications`
   * - **SDK Function Call**: `await BitBadgesApi.updateApplication(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async updateApplication(payload: iUpdateApplicationPayload): Promise<UpdateApplicationSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iUpdateApplicationPayload> = typia.validate<iUpdateApplicationPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.put<UpdateApplicationSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDApplicationsRoute()}`,
        payload
      );
      return new UpdateApplicationSuccessResponse<T>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes an application.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/applications`
   * - **SDK Function Call**: `await BitBadgesApi.deleteApplication(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async deleteApplication(payload: iDeleteApplicationPayload): Promise<DeleteApplicationSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iDeleteApplicationPayload> = typia.validate<iDeleteApplicationPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.delete<DeleteApplicationSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDApplicationsRoute()}`, {
        data: payload
      });
      return new DeleteApplicationSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Calculates points for a page in an application and caches the result.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/applications/points`
   * - **SDK Function Call**: `await BitBadgesApi.calculatePoints(payload);`
   */
  public async calculatePoints(payload: iCalculatePointsPayload): Promise<CalculatePointsSuccessResponse> {
    try {
      const response = await this.axios.post<CalculatePointsSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CalculatePointsRoute()}`,
        payload
      );
      return new CalculatePointsSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets points activity for an application.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/applications/points/activity`
   * - **SDK Function Call**: `await BitBadgesApi.getPointsActivity(payload);`
   */
  public async getPointsActivity<T extends NumberType>(payload: iGetPointsActivityPayload): Promise<GetPointsActivitySuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetPointsActivityPayload> = typia.validate<iGetPointsActivityPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetPointsActivitySuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetPointsActivityRoute()}`,
        { params: payload }
      );
      return new GetPointsActivitySuccessResponse<T>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets utility pages.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/utilityPages/fetch`
   * - **SDK Function Call**: `await BitBadgesApi.getUtilityPages(payload);`
   */
  public async getUtilityPages(payload: iGetUtilityPagesPayload): Promise<GetUtilityPagesSuccessResponse<T>> {
    try {
      const response = await this.axios.post<GetUtilityPagesSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetUtilityPagesRoute()}`,
        payload
      );
      return new GetUtilityPagesSuccessResponse<T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Searches for utility pages.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/utilityPages/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchUtilityPages(payload);`
   */
  public async searchUtilityPages(payload: iSearchUtilityPagesPayload): Promise<SearchUtilityPagesSuccessResponse<T>> {
    try {
      const response = await this.axios.get<SearchUtilityPagesSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SearchUtilityPagesRoute()}`,
        { params: payload }
      );
      return new SearchUtilityPagesSuccessResponse<T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates a utility page.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/utilityPages`
   * - **SDK Function Call**: `await BitBadgesApi.createUtilityPage(payload);`
   */
  public async createUtilityPage(payload: iCreateUtilityPagePayload<T>): Promise<CreateUtilityPageSuccessResponse<T>> {
    try {
      const response = await this.axios.post<CreateUtilityPageSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDUtilityPagesRoute()}`,
        payload
      );
      return new CreateUtilityPageSuccessResponse<T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates a utility page.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/utilityPages`
   * - **SDK Function Call**: `await BitBadgesApi.updateUtilityPage(payload);`
   */
  public async updateUtilityPage(payload: iUpdateUtilityPagePayload<T>): Promise<UpdateUtilityPageSuccessResponse<T>> {
    try {
      const response = await this.axios.put<UpdateUtilityPageSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDUtilityPagesRoute()}`,
        payload
      );
      return new UpdateUtilityPageSuccessResponse<T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes a utility page.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/utilityPages`
   * - **SDK Function Call**: `await BitBadgesApi.deleteUtilityPage(payload);`
   */
  public async deleteUtilityPage(payload: iDeleteUtilityPagePayload): Promise<DeleteUtilityPageSuccessResponse> {
    try {
      const response = await this.axios.delete<DeleteUtilityPageSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDUtilityPagesRoute()}`, {
        data: payload
      });
      return new DeleteUtilityPageSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets claim attempts.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/claims/:claimId/attempts`
   * - **SDK Function Call**: `await BitBadgesApi.getClaimAttempts(claimId, payload);`
   */
  public async getClaimAttempts(claimId: string, payload: iGetClaimAttemptsPayload): Promise<GetClaimAttemptsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetClaimAttemptsPayload> = typia.validate<iGetClaimAttemptsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<GetClaimAttemptsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetClaimAttemptsRoute(claimId)}`,
        { params: payload }
      );
      return new GetClaimAttemptsSuccessResponse<T>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Checks if a claim has been successfully completed.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/claims/success/:claimId/:address`
   * - **SDK Function Call**: `await BitBadgesApi.checkClaimSuccess(claimId, address);`
   */
  public async checkClaimSuccess(claimId: string, address: NativeAddress): Promise<CheckClaimSuccessSuccessResponse> {
    try {
      const response = await this.axios.get<CheckClaimSuccessSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CheckClaimSuccessRoute(claimId, address)}`
      );
      return new CheckClaimSuccessSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }
  /**
   * Gets Sign-In with BitBadges (SIWBB) requests (authentication requests)
   * for a user.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/account/:address/requests/siwbb`
   * - **SDK Function Call**: `await BitBadgesApi.getSiwbbRequestsForUser(address, {  });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getSiwbbRequestsForUser("bb1...", { });
   * console.log(res);
   * ```
   * */
  public async getSiwbbRequestsForUser(
    address: NativeAddress,
    payload: iGetSiwbbRequestsForUserPayload
  ): Promise<GetSiwbbRequestsForUserSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetSiwbbRequestsForUserPayload> = typia.validate<iGetSiwbbRequestsForUserPayload>(payload);
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetSiwbbRequestsForUserSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetSiwbbRequestsForUserRoute(address)}`,
        {
          params: payload
        }
      );
      return new GetSiwbbRequestsForUserSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets transfer activity for a specific user.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/account/:address/activity/badges`
   * - **SDK Function Call**: `await BitBadgesApi.getTransferActivityForUser(address, { });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getTransferActivityForUser("bb1...", { });
   * console.log(res);
   * ```
   * */
  public async getTransferActivityForUser(
    address: NativeAddress,
    payload: iGetTransferActivityForUserPayload
  ): Promise<GetTransferActivityForUserSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetTransferActivityForUserPayload> = typia.validate<iGetTransferActivityForUserPayload>(payload);
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetTransferActivityForUserSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetTransferActivityForUserRoute(address)}`,
        {
          params: payload
        }
      );
      return new GetTransferActivityForUserSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets tokens for a specific user. Specify the viewType to determine what
   * tokens to retrieve.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/account/:address/badges`
   * - **SDK Function Call**: `await BitBadgesApi.getTokensViewForUser(address, { viewType });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getTokensViewForUser("bb1...", { viewType: "collected" });
   * console.log(res);
   * ```
   * */
  public async getTokensViewForUser(address: NativeAddress, payload: iGetTokensViewForUserPayload): Promise<GetTokensViewForUserSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetTokensViewForUserPayload> = typia.validate<iGetTokensViewForUserPayload>(payload);
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetTokensViewForUserSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetTokensByTypeForUserRoute(address)}`,
        {
          params: payload
        }
      );
      return new GetTokensViewForUserSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets claim activity by type for a specific user. Specify the viewType to determine what
   * claim activity to retrieve.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/account/:address/activity/claims`
   * - **SDK Function Call**: `await BitBadgesApi.getClaimActivityForUser(address, { viewType });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getClaimActivityForUser("bb1...", { viewType: "public" });
   * console.log(res);
   * ```
   * */
  public async getClaimActivityForUser(
    address: NativeAddress,
    payload: iGetClaimActivityForUserPayload
  ): Promise<GetClaimActivityForUserSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetClaimActivityForUserPayload> = typia.validate<iGetClaimActivityForUserPayload>(payload);
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetClaimActivityForUserSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetClaimActivityByTypeForUserRoute(address)}`,
        { params: payload }
      );
      return new GetClaimActivityForUserSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets points activity for a specific user.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/account/:address/activity/points`
   * - **SDK Function Call**: `await BitBadgesApi.getPointsActivityForUser(address, { ... });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getPointsActivityForUser("bb1...", { ... });
   * console.log(res);
   * ```
   * */
  public async getPointsActivityForUser(
    address: NativeAddress,
    payload: iGetPointsActivityForUserPayload
  ): Promise<GetPointsActivityForUserSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetPointsActivityForUserPayload> = typia.validate<iGetPointsActivityForUserPayload>(payload);
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetPointsActivityForUserSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetPointsActivityForUserRoute(address)}`,
        { params: payload }
      );
      return new GetPointsActivityForUserSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets owners for a specific collection.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId/owners`
   * - **SDK Function Call**: `await BitBadgesApi.getCollectionOwners(collectionId, { bookmark });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getCollectionOwners("123", { bookmark: "123" });
   * console.log(res);
   * ```
   * */
  public async getCollectionOwners(collectionId: CollectionId, payload: iGetCollectionOwnersPayload): Promise<GetCollectionOwnersSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetCollectionOwnersPayload> = typia.validate<iGetCollectionOwnersPayload>(payload);
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetCollectionOwnersSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetCollectionOwnersRoute(collectionId)}`,
        {
          params: payload
        }
      );
      return new GetCollectionOwnersSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets a specific collection.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId`
   * - **SDK Function Call**: `await BitBadgesApi.getCollection(collectionId);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getCollection("123");
   * console.log(res);
   * ```
   * */
  public async getCollection(collectionId: CollectionId, payload?: iGetCollectionPayload): Promise<GetCollectionSuccessResponse<T>> {
    try {
      const response = await this.axios.get<iGetCollectionSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetCollectionRoute(collectionId)}`,
        { params: payload }
      );
      return new GetCollectionSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets current metadata for a specific token in a collection.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId/:tokenId/metadata`
   * - **SDK Function Call**: `await BitBadgesApi.getTokenMetadata(collectionId, tokenId);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getTokenMetadata("123", "456");
   * console.log(res);
   * ```
   * */
  public async getTokenMetadata(collectionId: CollectionId, tokenId: NumberType): Promise<GetTokenMetadataSuccessResponse<T>> {
    try {
      const response = await this.axios.get<iGetTokenMetadataSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetTokenMetadataRoute(collectionId, tokenId)}`
      );
      return new GetTokenMetadataSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets transfer activity for a specific collection.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId/activity`
   * - **SDK Function Call**: `await BitBadgesApi.getCollectionTransferActivity(collectionId, { bookmark });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getCollectionTransferActivity("123", { bookmark: "123" });
   * console.log(res);
   * ```
   * */
  public async getCollectionTransferActivity(
    collectionId: CollectionId,
    payload: iGetCollectionTransferActivityPayload
  ): Promise<GetCollectionTransferActivitySuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetCollectionTransferActivityPayload> = typia.validate<iGetCollectionTransferActivityPayload>(payload);
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetCollectionTransferActivitySuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetCollectionTransferActivityRoute(collectionId)}`,
        {
          params: payload
        }
      );
      return new GetCollectionTransferActivitySuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets challenge trackers for a specific collection.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId/challengeTrackers`
   * - **SDK Function Call**: `await BitBadgesApi.getCollectionChallengeTrackers(collectionId, { bookmark });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getCollectionChallengeTrackers("123", { bookmark: "123" });
   * console.log(res);
   * ```
   * */
  public async getCollectionChallengeTrackers(
    collectionId: CollectionId,
    payload: iGetCollectionChallengeTrackersPayload
  ): Promise<GetCollectionChallengeTrackersSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetCollectionChallengeTrackersPayload> = typia.validate<iGetCollectionChallengeTrackersPayload>(payload);
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetCollectionChallengeTrackersSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetCollectionChallengeTrackersRoute(collectionId)}`,
        {
          params: payload
        }
      );
      return new GetCollectionChallengeTrackersSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets amount trackers for a specific collection.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId/amountTrackers`
   * - **SDK Function Call**: `await BitBadgesApi.getCollectionAmountTrackers(collectionId, { bookmark });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getCollectionAmountTrackers("123", { bookmark: "123" });
   * console.log(res);
   * ```
   * */
  public async getCollectionAmountTrackers(
    collectionId: CollectionId,
    payload: iGetCollectionAmountTrackersPayload
  ): Promise<GetCollectionAmountTrackersSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetCollectionAmountTrackersPayload> = typia.validate<iGetCollectionAmountTrackersPayload>(payload);
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetCollectionAmountTrackersSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetCollectionAmountTrackersRoute(collectionId)}`,
        {
          params: payload
        }
      );
      return new GetCollectionAmountTrackersSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets listings for a specific collection.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId/listings`
   * - **SDK Function Call**: `await BitBadgesApi.getCollectionListings(collectionId, { bookmark });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getCollectionListings("123", { bookmark: "123" });
   * console.log(res);
   * ```
   * */
  public async getCollectionListings(
    collectionId: CollectionId,
    payload: iGetCollectionListingsPayload
  ): Promise<GetCollectionListingsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetCollectionListingsPayload> = typia.validate<iGetCollectionListingsPayload>(payload);
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetCollectionListingsSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetCollectionListingsRoute(collectionId)}`,
        {
          params: payload
        }
      );
      return new GetCollectionListingsSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets claims for a specific collection.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId/claims`
   * - **SDK Function Call**: `await BitBadgesApi.getCollectionClaims(collectionId);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getCollectionClaims("123");
   * console.log(res);
   * ```
   * */
  public async getCollectionClaims(collectionId: CollectionId): Promise<GetCollectionClaimsSuccessResponse<T>> {
    try {
      const response = await this.axios.get<iGetCollectionClaimsSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetCollectionClaimsRoute(collectionId)}`
      );
      return new GetCollectionClaimsSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get a claim by ID.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/claim/:claimId`
   * - **SDK Function Call**: `await BitBadgesApi.getClaim(claimId, { ... });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getClaim("123", { ... });
   * console.log(res);
   * ```
   */
  public async getClaim(claimId: string, payload?: iGetClaimPayload): Promise<GetClaimSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetClaimPayload> = typia.validate<iGetClaimPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<GetClaimSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetClaimRoute(claimId)}`, {
        params: payload
      });
      return new GetClaimSuccessResponse<T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get an application by ID.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/application/:applicationId`
   * - **SDK Function Call**: `await BitBadgesApi.getApplication(applicationId, { ... });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getApplication("app123", { ... });
   * console.log(res);
   * ```
   */
  public async getApplication(applicationId: string, payload?: iGetApplicationPayload): Promise<GetApplicationSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetApplicationPayload> = typia.validate<iGetApplicationPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<GetApplicationSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetApplicationRoute(applicationId)}`,
        { params: payload }
      );
      return new GetApplicationSuccessResponse<T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get a dynamic data store by ID.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/dynamicStore/:dynamicStoreId`
   * - **SDK Function Call**: `await BitBadgesApi.getDynamicDataStore(dynamicStoreId, { ... });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getDynamicDataStore("store123", { ... });
   * console.log(res);
   * ```
   */
  public async getDynamicDataStore<Q extends DynamicDataHandlerType>(
    dynamicStoreId: string,
    payload?: iGetDynamicDataStorePayload
  ): Promise<GetDynamicDataStoreSuccessResponse<Q, T>> {
    try {
      const validateRes: typia.IValidation<iGetDynamicDataStorePayload> = typia.validate<iGetDynamicDataStorePayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<GetDynamicDataStoreSuccessResponse<Q, T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetDynamicDataStoreRoute(dynamicStoreId)}`,
        { params: payload }
      );
      return new GetDynamicDataStoreSuccessResponse<Q, T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get a dynamic data store value by ID.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/dynamicStore/:dynamicStoreId/:key`
   * - **SDK Function Call**: `await BitBadgesApi.getDynamicDataStoreValue(dynamicStoreId, { ... });`
   */
  public async getDynamicDataStoreValue(
    dynamicStoreId: string,
    payload?: iGetDynamicDataStoreValuePayload
  ): Promise<GetDynamicDataStoreValueSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iGetDynamicDataStoreValuePayload> = typia.validate<iGetDynamicDataStoreValuePayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<GetDynamicDataStoreValueSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetDynamicDataStoreValueRoute(dynamicStoreId)}`,
        { params: payload }
      );
      return new GetDynamicDataStoreValueSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get a dynamic data store values paginated by ID.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/dynamicStore/:dynamicStoreId/values`
   * - **SDK Function Call**: `await BitBadgesApi.getDynamicDataStoreValuesPaginated(dynamicStoreId, { ... });`
   */
  public async getDynamicDataStoreValuesPaginated<Q extends DynamicDataHandlerType>(
    dynamicStoreId: string,
    payload?: iGetDynamicDataStoreValuesPaginatedPayload
  ): Promise<GetDynamicDataStoreValuesPaginatedSuccessResponse<Q, T>> {
    try {
      const validateRes: typia.IValidation<iGetDynamicDataStoreValuesPaginatedPayload> = typia.validate<iGetDynamicDataStoreValuesPaginatedPayload>(
        payload ?? {}
      );
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<GetDynamicDataStoreValuesPaginatedSuccessResponse<Q, T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetDynamicDataStoreValuesPaginatedRoute(dynamicStoreId)}`,
        { params: payload }
      );
      return new GetDynamicDataStoreValuesPaginatedSuccessResponse<Q, T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get plugin by ID.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/plugin/:pluginId`
   * - **SDK Function Call**: `await BitBadgesApi.getPlugin(pluginId, { ... });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getPlugin("plugin123", { ... });
   * console.log(res);
   * ```
   */
  public async getPlugin(pluginId: string, payload?: iGetPluginPayload): Promise<GetPluginSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetPluginPayload> = typia.validate<iGetPluginPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<GetPluginSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetPluginRoute(pluginId)}`, {
        params: payload
      });
      return new GetPluginSuccessResponse<T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get utility page by ID.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/utilityPage/:utilityPageId`
   * - **SDK Function Call**: `await BitBadgesApi.getUtilityPage(utilityPageId, { ... });`
   *
   * @example
   */
  public async getUtilityPage(utilityPageId: string, payload?: iGetUtilityPagePayload): Promise<GetUtilityPageSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetUtilityPagePayload> = typia.validate<iGetUtilityPagePayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<GetUtilityPageSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetUtilityPageRoute(utilityPageId)}`,
        { params: payload }
      );
      return new GetUtilityPageSuccessResponse<T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get developer app by ID.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/developerApp/:developerAppId`
   * - **SDK Function Call**: `await BitBadgesApi.getDeveloperApp(developerAppId, { ... });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getDeveloperApp("developerApp123", { ... });
   * console.log(res);
   * ```
   */
  public async getDeveloperApp(developerAppId: string, payload?: iGetDeveloperAppPayload): Promise<GetDeveloperAppSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetDeveloperAppPayload> = typia.validate<iGetDeveloperAppPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<GetDeveloperAppSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetDeveloperAppRoute(developerAppId)}`,
        { params: payload }
      );
      return new GetDeveloperAppSuccessResponse<T>(response.data).convert(this.ConvertFunction);
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
  public async getPlugins(payload: iGetPluginsPayload): Promise<GetPluginsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetPluginsPayload> = typia.validate<iGetPluginsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<GetPluginsSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetPluginsRoute()}`, payload);
      return new GetPluginsSuccessResponse(response.data).convert(this.ConvertFunction);
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
  public async verifyOwnershipRequirements(payload: iGenericVerifyAssetsPayload): Promise<GenericVerifyAssetsSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iGenericVerifyAssetsPayload> = typia.validate<iGenericVerifyAssetsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * Creates an developer app.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/developerApps`
   * - **SDK Function Call**: `await BitBadgesApi.createDeveloperApp(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async createDeveloperApp(payload: iCreateDeveloperAppPayload): Promise<CreateDeveloperAppSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iCreateDeveloperAppPayload> = typia.validate<iCreateDeveloperAppPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * - **API Route**: `DELETE /api/v0/developerApps`
   * - **SDK Function Call**: `await BitBadgesApi.deleteDeveloperApp(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async deleteDeveloperApp(payload: iDeleteDeveloperAppPayload): Promise<DeleteDeveloperAppSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iDeleteDeveloperAppPayload> = typia.validate<iDeleteDeveloperAppPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * - **API Route**: `PUT /api/v0/developerApps
   * - **SDK Function Call**: `await BitBadgesApi.updateUserDeveloperApps(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async updateDeveloperApp(payload: iUpdateDeveloperAppPayload): Promise<UpdateDeveloperAppSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iUpdateDeveloperAppPayload> = typia.validate<iUpdateDeveloperAppPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * Creates a dynamic data bin.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/dynamicStores`
   * - **SDK Function Call**: `await BitBadgesApi.createDynamicDataStore(payload);`
   */
  public async createDynamicDataStore<Q extends DynamicDataHandlerType, NumberType>(
    payload: iCreateDynamicDataStorePayload
  ): Promise<CreateDynamicDataStoreSuccessResponse<Q, T>> {
    try {
      const validateRes: typia.IValidation<iCreateDynamicDataStorePayload> = typia.validate<iCreateDynamicDataStorePayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iCreateDynamicDataStoreSuccessResponse<Q, string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDDynamicDataStoreRoute()}`,
        payload
      );
      return new CreateDynamicDataStoreSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates a dynamic data bin.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/dynamicStores`
   * - **SDK Function Call**: `await BitBadgesApi.updateDynamicDataStore(payload);`
   */
  public async updateDynamicDataStore<Q extends DynamicDataHandlerType, T extends NumberType>(
    payload: iUpdateDynamicDataStorePayload
  ): Promise<UpdateDynamicDataStoreSuccessResponse<Q, T>> {
    try {
      const validateRes: typia.IValidation<iUpdateDynamicDataStorePayload> = typia.validate<iUpdateDynamicDataStorePayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.put<iUpdateDynamicDataStoreSuccessResponse<Q, T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDDynamicDataStoreRoute()}`,
        payload
      );
      return new UpdateDynamicDataStoreSuccessResponse<Q, T>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes a dynamic data bin.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/dynamicStores`
   * - **SDK Function Call**: `await BitBadgesApi.deleteDynamicDataStore(payload);`
   */
  public async deleteDynamicDataStore(payload: iDeleteDynamicDataStorePayload): Promise<DeleteDynamicDataStoreSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iDeleteDynamicDataStorePayload> = typia.validate<iDeleteDynamicDataStorePayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.delete<DeleteDynamicDataStoreSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDDynamicDataStoreRoute()}`,
        { data: payload }
      );
      return new DeleteDynamicDataStoreSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get all developer apps for a user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/developerApps`
   * - **SDK Function Call**: `await BitBadgesApi.getDeveloperApp(payload);`
   */
  public async getDeveloperApps(payload: iGetDeveloperAppsPayload): Promise<GetDeveloperAppsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetDeveloperAppsPayload> = typia.validate<iGetDeveloperAppsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<GetDeveloperAppsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetDeveloperAppsRoute()}`,
        payload
      );
      return new GetDeveloperAppsSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Searches for developer apps.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/developerApps/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchDeveloperApps(payload);`
   */
  public async searchDeveloperApps(payload: iSearchDeveloperAppsPayload): Promise<SearchDeveloperAppsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iSearchDeveloperAppsPayload> = typia.validate<iSearchDeveloperAppsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<SearchDeveloperAppsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SearchDeveloperAppsRoute()}`,
        { params: payload }
      );
      return new SearchDeveloperAppsSuccessResponse<T>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets a specific amount tracker by ID for a collection
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/amountTracker`
   * - **SDK Function Call**: `await BitBadgesApi.getCollectionAmountTrackerById(...);`
   */
  public async getCollectionAmountTrackerById<T extends NumberType>(
    trackerDetails: iAmountTrackerIdDetails<T>
  ): Promise<GetCollectionAmountTrackerByIdSuccessResponse<T>> {
    try {
      const response = await this.axios.get<iGetCollectionAmountTrackerByIdSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetCollectionAmountTrackerByIdRoute()}`,
        { params: trackerDetails }
      );
      return new GetCollectionAmountTrackerByIdSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets a specific challenge tracker by ID for a collection
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/challengeTracker`
   * - **SDK Function Call**: `await BitBadgesApi.getCollectionChallengeTrackerById(...);`
   */
  public async getCollectionChallengeTrackerById<T extends NumberType>(
    trackerDetails: iChallengeTrackerIdDetails<T>
  ): Promise<GetCollectionChallengeTrackerByIdSuccessResponse<T>> {
    try {
      const response = await this.axios.get<iGetCollectionChallengeTrackerByIdSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetCollectionChallengeTrackerByIdRoute()}`,
        { params: trackerDetails }
      );
      return new GetCollectionChallengeTrackerByIdSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the attempt data for a specific claim attempt from the request bin plugin.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/requestBin/attemptData/{claimId}/{claimAttemptId}`
   * - **SDK Function Call**: `await BitBadgesApi.getAttemptDataFromRequestBin(claimId, claimAttemptId, payload);`
   */
  public async getAttemptDataFromRequestBin(
    claimId: string,
    claimAttemptId: string,
    payload?: iGetAttemptDataFromRequestBinPayload
  ): Promise<GetAttemptDataFromRequestBinSuccessResponse> {
    try {
      const response = await this.axios.get<GetAttemptDataFromRequestBinSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetAttemptDataFromRequestBinRoute(claimId, claimAttemptId)}`,
        { params: payload }
      );
      return new GetAttemptDataFromRequestBinSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }
}

export class BitBadgesAdminAPI<T extends NumberType> extends BitBadgesAPI<T> {
  constructor(apiDetails: iBitBadgesApi<T>) {
    super(apiDetails);
  }

  /**
   * Updates the user's seen activity.
   */
  public async updateUserSeenActivity() {
    return await this.updateAccountInfo({ seenActivity: Date.now() }); //Authenticated route so no need to pass in address
  }

  /**
   * Gets all active authorizations for a user.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/oauth/authorizations`
   * - **SDK Function Call**: `await BitBadgesApi.getActiveAuthorizations(payload);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getActiveAuthorizations(payload);
   * console.log(res);
   * ```
   */
  public async getActiveAuthorizations(payload?: iGetActiveAuthorizationsPayload): Promise<GetActiveAuthorizationsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetActiveAuthorizationsPayload> = typia.validate<iGetActiveAuthorizationsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<GetActiveAuthorizationsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetActiveAuthorizationsRoute()}`,
        { params: payload }
      );
      return new GetActiveAuthorizationsSuccessResponse<T>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates a plugin.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/plugins`
   * - **SDK Function Call**: `await BitBadgesApi.createPlugin(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async createPlugin(payload: iCreatePluginPayload): Promise<CreatePluginSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iCreatePluginPayload> = typia.validate<iCreatePluginPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<CreatePluginSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDPluginRoute()}`, payload);
      return new CreatePluginSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates a plugin.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/plugins`
   * - **SDK Function Call**: `await BitBadgesApi.updatePlugin(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async updatePlugin(payload: iUpdatePluginPayload): Promise<UpdatePluginSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iUpdatePluginPayload> = typia.validate<iUpdatePluginPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.put<UpdatePluginSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDPluginRoute()}`, payload);
      return new UpdatePluginSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes a plugin.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/plugins`
   * - **SDK Function Call**: `await BitBadgesApi.deletePlugin(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async deletePlugin(payload: iDeletePluginPayload): Promise<DeletePluginSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iDeletePluginPayload> = typia.validate<iDeletePluginPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.delete<DeletePluginSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDPluginRoute()}`, {
        data: payload
      });
      return new DeletePluginSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Searches for plugins.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/plugins/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchPlugins(payload);`
   */
  public async searchPlugins(payload: iSearchPluginsPayload): Promise<SearchPluginsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iSearchPluginsPayload> = typia.validate<iSearchPluginsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<SearchPluginsSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.SearchPluginsRoute()}`, {
        params: payload
      });
      return new SearchPluginsSuccessResponse<T>(response.data);
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
  public async fetchMetadataDirectly(payload: iFetchMetadataDirectlyPayload): Promise<FetchMetadataDirectlySuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iFetchMetadataDirectlyPayload> = typia.validate<iFetchMetadataDirectlyPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
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
  public async getTokensFromFaucet(payload?: iGetTokensFromFaucetPayload): Promise<GetTokensFromFaucetSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iGetTokensFromFaucetPayload> = typia.validate<iGetTokensFromFaucetPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
  public async addToIpfs(payload: iAddToIpfsPayload): Promise<AddToIpfsSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iAddToIpfsPayload> = typia.validate<iAddToIpfsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
    payload: iAddApprovalDetailsToOffChainStoragePayload
  ): Promise<AddApprovalDetailsToOffChainStorageSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iAddApprovalDetailsToOffChainStoragePayload> = typia.validate<iAddApprovalDetailsToOffChainStoragePayload>(
        payload ?? {}
      );
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * Creates a payment intent for the user to pay.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/createPaymentIntent`
   * - **SDK Function Call**: `await BitBadgesApi.createPaymentIntent(payload);`
   */
  public async createPaymentIntent(payload: iCreatePaymentIntentPayload): Promise<CreatePaymentIntentSuccessResponse> {
    try {
      const response = await this.axios.post<iCreatePaymentIntentSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CreatePaymentIntentRoute()}`,
        payload
      );
      return new CreatePaymentIntentSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the API keys.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/apiKeys/fetch`
   * - **SDK Function Call**: `await BitBadgesApi.getApiKeys();`
   */
  public async getApiKeys(payload: iGetApiKeysPayload): Promise<GetApiKeysSuccessResponse> {
    try {
      const response = await this.axios.post<GetApiKeysSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetApiKeysRoute()}`, payload);
      return new GetApiKeysSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates an API key.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/apiKeys`
   * - **SDK Function Call**: `await BitBadgesApi.createApiKey(payload);`
   */
  public async createApiKey(payload: iCreateApiKeyPayload): Promise<CreateApiKeySuccessResponse> {
    try {
      const response = await this.axios.post<CreateApiKeySuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDApiKeysRoute()}`, payload);
      return new CreateApiKeySuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Rotates an API key.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/apiKeys/rotate`
   * - **SDK Function Call**: `await BitBadgesApi.rotateApiKey(payload);`
   */
  public async rotateApiKey(payload: iRotateApiKeyPayload): Promise<RotateApiKeySuccessResponse> {
    try {
      const response = await this.axios.post<RotateApiKeySuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.RotateApiKeyRoute()}`, payload);
      return new RotateApiKeySuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes an API key.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/apiKeys`
   * - **SDK Function Call**: `await BitBadgesApi.deleteApiKey(payload);`
   */
  public async deleteApiKey(payload: iDeleteApiKeyPayload): Promise<DeleteApiKeySuccessResponse> {
    try {
      const response = await this.axios.delete<DeleteApiKeySuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDApiKeysRoute()}`, {
        data: payload
      });
      return new DeleteApiKeySuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async getPluginErrors(payload: iGetPluginErrorsPayload): Promise<GetPluginErrorsSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iGetPluginErrorsPayload> = typia.validate<iGetPluginErrorsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<GetPluginErrorsSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetPluginErrorsRoute()}`);
      return new GetPluginErrorsSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  public async scheduleTokenRefresh(payload: iScheduleTokenRefreshPayload): Promise<ScheduleTokenRefreshSuccessResponse> {
    try {
      const response = await this.axios.post<ScheduleTokenRefreshSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.ScheduleTokenRefreshRoute()}`,
        payload
      );
      return new ScheduleTokenRefreshSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets all connected Stripe accounts.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/stripe/connected-accounts`
   * - **SDK Function Call**: `await BitBadgesApi.getConnectedAccounts();`
   */
  public async getConnectedAccounts(): Promise<GetConnectedAccountsSuccessResponse> {
    try {
      const response = await this.axios.get<GetConnectedAccountsSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetConnectedAccountsRoute()}`
      );
      return new GetConnectedAccountsSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes a connected Stripe account.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/stripe/connected-accounts/:accountId`
   * - **SDK Function Call**: `await BitBadgesApi.deleteConnectedAccount(accountId);`
   */
  public async deleteConnectedAccount(accountId: string): Promise<DeleteConnectedAccountSuccessResponse> {
    try {
      const response = await this.axios.delete<DeleteConnectedAccountSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.DeleteConnectedAccountRoute(accountId)}`
      );
      return new DeleteConnectedAccountSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the sign in challenge to be signed for authentication. The returned is the message to be signed by the user.
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
  public async getSignInChallenge(payload: iGetSignInChallengePayload): Promise<GetSignInChallengeSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetSignInChallengePayload> = typia.validate<iGetSignInChallengePayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
  public async verifySignIn(payload: iVerifySignInPayload): Promise<VerifySignInSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iVerifySignInPayload> = typia.validate<iVerifySignInPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iVerifySignInSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.VerifySignInRoute()}`, payload);
      return new VerifySignInSuccessResponse(response.data);
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
  public async signOut(payload?: iSignOutPayload): Promise<SignOutSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iSignOutPayload> = typia.validate<iSignOutPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iSignOutSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.SignOutRoute()}`, payload);
      return new SignOutSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the filter suggestions based on attributes in a collection.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/filterSuggestions`
   * - **SDK Function Call**: `await BitBadgesApi.filterSuggestions(collectionId, payload);`
   */
  public async filterSuggestions(collectionId: CollectionId, payload?: iFilterSuggestionsPayload): Promise<FilterSuggestionsSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iFilterSuggestionsPayload> = typia.validate<iFilterSuggestionsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iFilterSuggestionsSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.FilterSuggestionsRoute(collectionId)}`,
        payload
      );
      return new FilterSuggestionsSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.GetBrowse(payload);`
   */
  public async getBrowse(payload: iGetBrowsePayload): Promise<GetBrowseSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetBrowsePayload> = typia.validate<iGetBrowsePayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iGetBrowseSuccessResponse<string>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetBrowseRoute()}`, payload);
      return new GetBrowseSuccessResponse(response.data).convert(this.ConvertFunction);
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
   * - **SDK Function Call**: `await BitBadgesApi.updateAccountInfo(payload);`
   * - **Authentication**: Must be signed in.
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.updateAccountInfo(payload);
   * console.log(res);
   * ```
   */
  public async updateAccountInfo(payload: iUpdateAccountInfoPayload): Promise<UpdateAccountInfoSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iUpdateAccountInfoPayload> = typia.validate<iUpdateAccountInfoPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * A generic route for verifying SIWBB requests. Used as a helper if implementing on your own.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbbRequest/verify`
   * - **SDK Function Call**: `await BitBadgesApi.verifySIWBBRequest(payload);`
   */
  public async verifySIWBBRequest(payload: iGenericBlockinVerifyPayload): Promise<GenericBlockinVerifySuccessResponse> {
    try {
      const validateRes: typia.IValidation<iGenericBlockinVerifyPayload> = typia.validate<iGenericBlockinVerifyPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
}

export default BitBadgesAPI;
