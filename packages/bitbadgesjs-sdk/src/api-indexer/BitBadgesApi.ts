import type { NumberType } from '@/common/string-numbers.js';
import { BitBadgesCollection, GetCollectionsSuccessResponse, iGetCollectionsPayload } from './BitBadgesCollection.js';

import typia from 'typia';
import type {
  CreateAddressListsSuccessResponse,
  DeleteAddressListsSuccessResponse,
  GetAddressListsSuccessResponse,
  UpdateAddressListsSuccessResponse,
  iCreateAddressListsPayload,
  iDeleteAddressListsPayload,
  iGetAddressListsPayload,
  iUpdateAddressListsPayload
} from './BitBadgesAddressList.js';
import { BitBadgesAddressList } from './BitBadgesAddressList.js';
import type { GetAccountsSuccessResponse, iGetAccountsPayload } from './BitBadgesUserInfo.js';
import { BitBadgesUserInfo } from './BitBadgesUserInfo.js';
import type { iBitBadgesApi } from './base.js';
import { BaseBitBadgesApi } from './base.js';
import type { DynamicDataHandlerType, NativeAddress } from './docs/interfaces.js';
import {
  FilterBadgesInCollectionSuccessResponse,
  FilterSuggestionsSuccessResponse,
  GetBadgeActivitySuccessResponse,
  GetBadgeBalanceByAddressSuccessResponse,
  GetOwnersForBadgeSuccessResponse,
  RefreshMetadataSuccessResponse,
  RefreshStatusSuccessResponse,
  iFilterBadgesInCollectionPayload,
  iFilterSuggestionsPayload,
  iFilterSuggestionsSuccessResponse,
  iGetBadgeActivityPayload,
  iGetBadgeBalanceByAddressPayload,
  iGetBadgeBalanceByAddressSuccessResponse,
  iGetOwnersForBadgePayload,
  iRefreshMetadataPayload
} from './requests/collections.js';
import {
  GetMapValuesSuccessResponse,
  GetMapsSuccessResponse,
  iGetMapValuesPayload,
  iGetMapValuesSuccessResponse,
  iGetMapsPayload,
  iGetMapsSuccessResponse
} from './requests/maps.js';
import {
  AddApprovalDetailsToOffChainStorageSuccessResponse,
  AddBalancesToOffChainStorageSuccessResponse,
  AddToIpfsSuccessResponse,
  BatchStoreActionSuccessResponse,
  BroadcastTxSuccessResponse,
  CalculatePointsSuccessResponse,
  CheckClaimSuccessSuccessResponse,
  CheckSignInStatusSuccessResponse,
  CompleteClaimSuccessResponse,
  CreateApiKeySuccessResponse,
  CreateApplicationSuccessResponse,
  CreateAttestationSuccessResponse,
  CreateClaimSuccessResponse,
  CreateDeveloperAppSuccessResponse,
  CreateDynamicDataStoreSuccessResponse,
  CreatePaymentIntentSuccessResponse,
  CreatePluginSuccessResponse,
  CreateSIWBBRequestSuccessResponse,
  CreateUtilityListingSuccessResponse,
  DeleteApiKeySuccessResponse,
  DeleteApplicationSuccessResponse,
  DeleteAttestationSuccessResponse,
  DeleteClaimSuccessResponse,
  DeleteDeveloperAppSuccessResponse,
  DeleteDynamicDataStoreSuccessResponse,
  DeletePluginSuccessResponse,
  DeleteSIWBBRequestSuccessResponse,
  DeleteUtilityListingSuccessResponse,
  ExchangeSIWBBAuthorizationCodeSuccessResponse,
  FetchMetadataDirectlySuccessResponse,
  GenerateAppleWalletPassSuccessResponse,
  GenerateGoogleWalletSuccessResponse,
  GenericBlockinVerifySuccessResponse,
  GenericVerifyAssetsSuccessResponse,
  GetActiveAuthorizationsSuccessResponse,
  GetApiKeysSuccessResponse,
  GetApplicationsSuccessResponse,
  GetAttestationsSuccessResponse,
  GetBrowseSuccessResponse,
  GetClaimAlertsForCollectionSuccessResponse,
  GetClaimAttemptStatusSuccessResponse,
  GetClaimAttemptsSuccessResponse,
  GetClaimsSuccessResponse,
  GetDeveloperAppSuccessResponse,
  GetDynamicDataActivitySuccessResponse,
  GetDynamicDataStoresSuccessResponse,
  GetGatedContentForClaimSuccessResponse,
  GetOrCreateEmbeddedWalletSuccessResponse,
  GetPluginErrorsSuccessResponse,
  GetPluginSuccessResponse,
  GetPointsActivitySuccessResponse,
  GetReservedClaimCodesSuccessResponse,
  GetSIWBBRequestsForDeveloperAppSuccessResponse,
  GetSearchSuccessResponse,
  GetSignInChallengeSuccessResponse,
  GetStatusSuccessResponse,
  GetTokensFromFaucetSuccessResponse,
  GetUtilityListingsSuccessResponse,
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
  SearchUtilityListingsSuccessResponse,
  SendClaimAlertsSuccessResponse,
  SignOutSuccessResponse,
  SignWithEmbeddedWalletSuccessResponse,
  SimulateClaimSuccessResponse,
  SimulateTxSuccessResponse,
  UpdateAccountInfoSuccessResponse,
  UpdateApplicationSuccessResponse,
  UpdateAttestationSuccessResponse,
  UpdateClaimSuccessResponse,
  UpdateDeveloperAppSuccessResponse,
  UpdateDynamicDataStoreSuccessResponse,
  UpdatePluginSuccessResponse,
  UpdateUtilityListingSuccessResponse,
  VerifyAttestationSuccessResponse,
  VerifySignInSuccessResponse,
  iAddApprovalDetailsToOffChainStoragePayload,
  iAddApprovalDetailsToOffChainStorageSuccessResponse,
  iAddBalancesToOffChainStoragePayload,
  iAddBalancesToOffChainStorageSuccessResponse,
  iAddToIpfsPayload,
  iAddToIpfsSuccessResponse,
  iBatchStoreActionPayload,
  iBroadcastTxPayload,
  iBroadcastTxSuccessResponse,
  iCalculatePointsPayload,
  iCheckSignInStatusPayload,
  iCheckSignInStatusSuccessResponse,
  iCompleteClaimPayload,
  iCompleteClaimSuccessResponse,
  iCreateApiKeyPayload,
  iCreateApplicationPayload,
  iCreateAttestationPayload,
  iCreateClaimPayload,
  iCreateDeveloperAppPayload,
  iCreateDynamicDataStorePayload,
  iCreateDynamicDataStoreSuccessResponse,
  iCreatePaymentIntentPayload,
  iCreatePaymentIntentSuccessResponse,
  iCreatePluginPayload,
  iCreateSIWBBRequestPayload,
  iCreateSIWBBRequestSuccessResponse,
  iCreateUtilityListingPayload,
  iDeleteApiKeyPayload,
  iDeleteApplicationPayload,
  iDeleteAttestationPayload,
  iDeleteClaimPayload,
  iDeleteDeveloperAppPayload,
  iDeleteDynamicDataStorePayload,
  iDeletePluginPayload,
  iDeleteSIWBBRequestPayload,
  iDeleteSIWBBRequestSuccessResponse,
  iDeleteUtilityListingPayload,
  iExchangeSIWBBAuthorizationCodePayload,
  iExchangeSIWBBAuthorizationCodeSuccessResponse,
  iFetchMetadataDirectlyPayload,
  iFetchMetadataDirectlySuccessResponse,
  iGenerateAppleWalletPassPayload,
  iGenerateGoogleWalletPayload,
  iGenericBlockinVerifyPayload,
  iGenericBlockinVerifySuccessResponse,
  iGenericVerifyAssetsPayload,
  iGenericVerifyAssetsSuccessResponse,
  iGetActiveAuthorizationsPayload,
  iGetApiKeysPayload,
  iGetApplicationsPayload,
  iGetAttestationsPayload,
  iGetBrowsePayload,
  iGetBrowseSuccessResponse,
  iGetClaimAlertsForCollectionPayload,
  iGetClaimAlertsForCollectionSuccessResponse,
  iGetClaimAttemptStatusSuccessResponse,
  iGetClaimAttemptsPayload,
  iGetClaimsPayloadV1,
  iGetClaimsSuccessResponse,
  iGetDeveloperAppsPayload,
  iGetDynamicDataActivityPayload,
  iGetDynamicDataStoresPayload,
  iGetDynamicDataStoresSuccessResponse,
  iGetGatedContentForClaimPayload,
  iGetOrCreateEmbeddedWalletPayload,
  iGetPluginErrorsPayload,
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
  iGetUtilityListingsPayload,
  iOauthRevokePayload,
  iPerformStoreActionPayload,
  iRotateApiKeyPayload,
  iRotateSIWBBRequestPayload,
  iRotateSIWBBRequestSuccessResponse,
  iScheduleTokenRefreshPayload,
  iSearchApplicationsPayload,
  iSearchClaimsPayload,
  iSearchDeveloperAppsPayload,
  iSearchDynamicDataStoresPayload,
  iSearchPluginsPayload,
  iSearchUtilityListingsPayload,
  iSendClaimAlertsPayload,
  iSendClaimAlertsSuccessResponse,
  iSignOutPayload,
  iSignOutSuccessResponse,
  iSignWithEmbeddedWalletPayload,
  iSimulateClaimPayload,
  iSimulateClaimSuccessResponse,
  iSimulateTxPayload,
  iSimulateTxSuccessResponse,
  iUpdateAccountInfoPayload,
  iUpdateAccountInfoSuccessResponse,
  iUpdateApplicationPayload,
  iUpdateAttestationPayload,
  iUpdateClaimPayload,
  iUpdateDeveloperAppPayload,
  iUpdateDynamicDataStorePayload,
  iUpdateDynamicDataStoreSuccessResponse,
  iUpdatePluginPayload,
  iUpdateUtilityListingPayload,
  iVerifyAttestationPayload,
  iVerifySignInPayload,
  iVerifySignInSuccessResponse
} from './requests/requests.js';
import { BitBadgesApiRoutes } from './requests/routes.js';

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
   * - **API Route**: `POST /api/v0/status`
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

      const response = await this.axios.post<iGetStatusSuccessResponse<string>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetStatusRoute()}`, payload);
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
  public async getCollections(payload: iGetCollectionsPayload): Promise<GetCollectionsSuccessResponse<T>> {
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
    payload: iGetOwnersForBadgePayload
  ): Promise<GetOwnersForBadgeSuccessResponse<T>> {
    return await BitBadgesCollection.GetOwnersForBadge<T>(this, collectionId, badgeId, payload);
  }

  /**
   * Gets the balance of a specific badge for a specific address
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/balance/:address`
   * - **SDK Function Call**: `await BitBadgesApi.getBadgeBalanceByAddress(collectionId, address);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getBadgeBalanceByAddress(collectionId, address);
   * console.log(res);
   * ```
   */
  public async getBadgeBalanceByAddress(
    collectionId: NumberType,
    address: NativeAddress,
    payload?: iGetBadgeBalanceByAddressPayload
  ): Promise<GetBadgeBalanceByAddressSuccessResponse<T>> {
    return await BitBadgesCollection.GetBadgeBalanceByAddress(this, collectionId, address, payload);
  }

  /**
   * Gets the badge balance for an address at the current time. This is a streamlined version of
   * getBadgeBalanceByAddress.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/collection/:collectionId/:badgeId/balance/:address`
   * - **SDK Function Call**: `await BitBadgesApi.getBadgeBalanceByAddress(collectionId, badgeId, address);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getBadgeBalanceByAddress(collectionId, badgeId, address);
   * console.log(res);
   * ```
   */
  public async getBadgeBalanceByAddressSpecificBadge(
    collectionId: NumberType,
    badgeId: NumberType,
    address: NativeAddress,
    payload?: iGetBadgeBalanceByAddressPayload
  ): Promise<GetBadgeBalanceByAddressSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetBadgeBalanceByAddressPayload> = typia.validate<iGetBadgeBalanceByAddressPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.get<iGetBadgeBalanceByAddressSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetBadgeBalanceByAddressSpecificBadgeRoute(collectionId, address, badgeId)}`
      );
      return new GetBadgeBalanceByAddressSuccessResponse(response.data).convert(this.ConvertFunction);
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
    payload: iGetBadgeActivityPayload
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
  public async refreshMetadata(collectionId: NumberType, payload?: iRefreshMetadataPayload): Promise<RefreshMetadataSuccessResponse> {
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
   * Creates address lists stored by BitBadges centralized servers.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/addressLists`
   * - **SDK Function Call**: `await BitBadgesApi.updateAddressLists(payload);`
   *
   * Must be created off-chain. For on-chain, they must be created through MsgCreateAddressMappings. Creator can update their created lists with no restrictions. Else, requires an edit key.
   */
  public async createAddressLists(payload: iCreateAddressListsPayload<T>): Promise<CreateAddressListsSuccessResponse> {
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
  public async updateAddressLists(payload: iUpdateAddressListsPayload<T>): Promise<UpdateAddressListsSuccessResponse> {
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
  public async getAddressLists(payload: iGetAddressListsPayload): Promise<GetAddressListsSuccessResponse<T>> {
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
  public async deleteAddressLists(payload: iDeleteAddressListsPayload): Promise<DeleteAddressListsSuccessResponse> {
    return await BitBadgesAddressList.DeleteAddressList(this, payload);
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
   * - **API Route**: `POST /api/v0/developerApps/siwbbRequests`
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

      const response = await this.axios.post<iGetSIWBBRequestsForDeveloperAppSuccessResponse<string>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetSIWBBRequestsForDeveloperAppRoute()}`,
        payload
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
   * Sends claim alert notifications out.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/claimAlerts/send`
   * - **SDK Function Call**: `await BitBadgesApi.sendClaimAlert(payload);`
   * - **Authentication**: Must be signed in and the manager of the collection.
   * - **CORS**: Restricted to only BitBadges official site.
   */
  public async sendClaimAlert(payload: iSendClaimAlertsPayload): Promise<SendClaimAlertsSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iSendClaimAlertsPayload> = typia.validate<iSendClaimAlertsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * Gets claim alerts for a collection.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/claimAlerts`
   * - **SDK Function Call**: `await BitBadgesApi.getClaimAlerts(payload);`
   * - **Authentication**: Must be signed in and the manager of the collection.
   */
  public async getClaimAlerts(payload: iGetClaimAlertsForCollectionPayload<NumberType>): Promise<GetClaimAlertsForCollectionSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetClaimAlertsForCollectionPayload<NumberType>> = typia.validate<
        iGetClaimAlertsForCollectionPayload<NumberType>
      >(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * Filters badges in a collection based on multiple filter values.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/filter`
   * - **SDK Function Call**: `await BitBadgesApi.filterBadgesInCollection(payload);`
   */
  public async filterBadgesInCollection(
    collectionId: T,
    payload: iFilterBadgesInCollectionPayload
  ): Promise<FilterBadgesInCollectionSuccessResponse<T>> {
    return await BitBadgesCollection.FilterBadgesInCollection(this, collectionId, payload);
  }

  /**
   * Gets the filter suggestions based on attributes in a collection.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/filterSuggestions`
   * - **SDK Function Call**: `await BitBadgesApi.filterSuggestions(collectionId, payload);`
   */
  public async filterSuggestions(collectionId: T, payload?: iFilterSuggestionsPayload): Promise<FilterSuggestionsSuccessResponse> {
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
   * - **API Route**: `POST /api/v0/claims/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchClaims(payload);`
   */
  public async searchClaims(payload: iSearchClaimsPayload): Promise<SearchClaimsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iSearchClaimsPayload> = typia.validate<iSearchClaimsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<SearchClaimsSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.SearchClaimsRoute()}`, payload);
      return new SearchClaimsSuccessResponse<T>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get an off-chain attestation signature (typically a credential).
   *
   * @remarks
   * - **API Route**: `POST /api/v0/attestations`
   * - **SDK Function Call**: `await BitBadgesApi.getAttestations(payload);`
   */
  public async getAttestations(payload: iGetAttestationsPayload): Promise<GetAttestationsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetAttestationsPayload> = typia.validate<iGetAttestationsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<GetAttestationsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetAttestationsRoute()}`,
        payload
      );
      return new GetAttestationsSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates an off-chain attestation signature (typically a credential).
   *
   * @remarks
   * - **API Route**: `POST /api/v0/attestations`
   * - **SDK Function Call**: `await BitBadgesApi.createAttestation(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async createAttestation(payload: iCreateAttestationPayload): Promise<CreateAttestationSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iCreateAttestationPayload> = typia.validate<iCreateAttestationPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<CreateAttestationSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDAttestationRoute()}`,
        payload
      );
      return new CreateAttestationSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes an off-chain attestation signature (typically a credential).
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/attestations`
   * - **SDK Function Call**: `await BitBadgesApi.deleteAttestation(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async deleteAttestation(payload: iDeleteAttestationPayload): Promise<DeleteAttestationSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iDeleteAttestationPayload> = typia.validate<iDeleteAttestationPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.delete<DeleteAttestationSuccessResponse>(`${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDAttestationRoute()}`, {
        data: payload
      });
      return new DeleteAttestationSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Update a attestation.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/attestations`
   * - **SDK Function Call**: `await BitBadgesApi.updateUserAttestations(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async updateAttestation(payload: iUpdateAttestationPayload): Promise<UpdateAttestationSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iUpdateAttestationPayload> = typia.validate<iUpdateAttestationPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.put<UpdateAttestationSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDAttestationRoute()}`,
        payload
      );
      return new UpdateAttestationSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Verifies an attestation.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/attestations/verify`
   * - **SDK Function Call**: `await BitBadgesApi.verifyAttestation(payload);`
   */
  public async verifyAttestation(payload: iVerifyAttestationPayload): Promise<VerifyAttestationSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iVerifyAttestationPayload> = typia.validate<iVerifyAttestationPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<VerifyAttestationSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.VerifyAttestationRoute()}`,
        payload
      );
      return new VerifyAttestationSuccessResponse(response.data);
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
  public async addBalancesToOffChainStorage(payload: iAddBalancesToOffChainStoragePayload): Promise<AddBalancesToOffChainStorageSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iAddBalancesToOffChainStoragePayload> = typia.validate<iAddBalancesToOffChainStoragePayload>(
        payload ?? {}
      );
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * Get the gated content for a claim.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/claims/gatedContent/{claimId}`
   * - **SDK Function Call**: `await BitBadgesApi.getGatedContentForClaim(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async getGatedContentForClaim(claimId: string): Promise<GetGatedContentForClaimSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetGatedContentForClaimPayload> = typia.validate<iGetGatedContentForClaimPayload>({});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<GetGatedContentForClaimSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetGatedContentForClaimRoute(claimId)}`
      );
      return new GetGatedContentForClaimSuccessResponse(response.data);
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
   * Performs an action for a dynamicStore.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/storeActions/{actionName}/{dynamicDataId}/{dynamicDataSecret}`
   * - **API Route (Body Auth)**: `POST /api/v0/storeActions/single`
   * - **SDK Function Call**: `await BitBadgesApi.performStoreAction(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async performStoreAction(
    payload: iPerformStoreActionPayload,
    actionName: string,
    dynamicDataId: string,
    dynamicDataSecret: string,
    /**
     * There are two ways to pass in the payload.
     * 1. Body Auth: `POST /api/v0/storeActions/single`
     * 2. Path Auth: `POST /api/v0/storeActions/{actionName}/{dynamicDataId}/{dynamicDataSecret}`
     *
     * Since you are calling from the API and have control over the payload, we always recommend the body auth for more security.
     */
    bodyAuth = true
  ): Promise<PerformStoreActionSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iPerformStoreActionPayload> = typia.validate<iPerformStoreActionPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      if (bodyAuth) {
        const response = await this.axios.post<PerformStoreActionSuccessResponse>(
          `${this.BACKEND_URL}${BitBadgesApiRoutes.PerformStoreActionSingleWithBodyAuthRoute()}`,
          {
            dynamicDataId: dynamicDataId,
            dataSecret: dynamicDataSecret,
            actionName: actionName,
            payload: payload
          }
        );
        return new PerformStoreActionSuccessResponse(response.data);
      } else {
        const response = await this.axios.post<PerformStoreActionSuccessResponse>(
          `${this.BACKEND_URL}${BitBadgesApiRoutes.PerformStoreActionSingleRoute(actionName, dynamicDataId, dynamicDataSecret)}`,
          payload
        );
        return new PerformStoreActionSuccessResponse(response.data);
      }
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Performs multiple actions for a dynamicStore in batch.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/storeActions/batch/{dynamicDataId}/{dynamicDataSecret}`
   * - **API Route (Body Auth)**: `POST /api/v0/storeActions/batch`
   * - **SDK Function Call**: `await BitBadgesApi.performBatchStoreAction(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async performBatchStoreAction(
    payload: iBatchStoreActionPayload,
    dynamicDataId: string,
    dynamicDataSecret: string,
    /**
     * There are two ways to pass in the payload.
     * 1. Body Auth: `POST /api/v0/storeActions/batch`
     * 2. Path Auth: `POST /api/v0/storeActions/batch/{dynamicDataId}/{dynamicDataSecret}`
     *
     * Since you are calling from the API and have control over the payload, we always recommend the body auth for more security.
     */
    bodyAuth = true
  ): Promise<BatchStoreActionSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iBatchStoreActionPayload> = typia.validate<iBatchStoreActionPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      if (bodyAuth) {
        const response = await this.axios.post<BatchStoreActionSuccessResponse>(
          `${this.BACKEND_URL}${BitBadgesApiRoutes.PerformStoreActionBatchWithBodyAuthRoute()}`,
          {
            ...payload,
            dynamicDataId: dynamicDataId,
            dataSecret: dynamicDataSecret
          }
        );
        return new BatchStoreActionSuccessResponse(response.data);
      } else {
        const response = await this.axios.post<BatchStoreActionSuccessResponse>(
          `${this.BACKEND_URL}${BitBadgesApiRoutes.PerformStoreActionBatchRoute(dynamicDataId, dynamicDataSecret)}`,
          payload
        );
        return new BatchStoreActionSuccessResponse(response.data);
      }
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get dynamic data store activity
   */
  public async getDynamicDataActivity(payload: iGetDynamicDataActivityPayload): Promise<GetDynamicDataActivitySuccessResponse> {
    try {
      const response = await this.axios.post<GetDynamicDataActivitySuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetDynamicDataStoreActivityRoute()}`,
        payload
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
   * - **API Route**: `POST /api/v0/dynamicStores/search`
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

      const response = await this.axios.post<SearchDynamicDataStoresSuccessResponse<Q, NumberType>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SearchDynamicDataStoresRoute()}`,
        payload
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
   * - **API Route**: `POST /api/v0/applications/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchApplications(payload);`
   */
  public async searchApplications(payload: iSearchApplicationsPayload): Promise<SearchApplicationsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iSearchApplicationsPayload> = typia.validate<iSearchApplicationsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<SearchApplicationsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SearchApplicationsRoute()}`,
        payload
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
   * - **API Route**: `POST /api/v0/applications/points/activity`
   * - **SDK Function Call**: `await BitBadgesApi.getPointsActivity(payload);`
   */
  public async getPointsActivity<T extends NumberType>(payload: iGetPointsActivityPayload): Promise<GetPointsActivitySuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetPointsActivityPayload> = typia.validate<iGetPointsActivityPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iGetPointsActivitySuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetPointsActivityRoute()}`,
        payload
      );
      return new GetPointsActivitySuccessResponse<T>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets utility listings.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/utilityListings/fetch`
   * - **SDK Function Call**: `await BitBadgesApi.getUtilityListings(payload);`
   */
  public async getUtilityListings(payload: iGetUtilityListingsPayload): Promise<GetUtilityListingsSuccessResponse<T>> {
    try {
      const response = await this.axios.post<GetUtilityListingsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetUtilityListingsRoute()}`,
        payload
      );
      return new GetUtilityListingsSuccessResponse<T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Searches for utility listings.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/utilityListings/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchUtilityListings(payload);`
   */
  public async searchUtilityListings(payload: iSearchUtilityListingsPayload): Promise<SearchUtilityListingsSuccessResponse<T>> {
    try {
      const response = await this.axios.post<SearchUtilityListingsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SearchUtilityListingsRoute()}`,
        payload
      );
      return new SearchUtilityListingsSuccessResponse<T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates a utility listing.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/utilityListings`
   * - **SDK Function Call**: `await BitBadgesApi.createUtilityListing(payload);`
   */
  public async createUtilityListing(payload: iCreateUtilityListingPayload<T>): Promise<CreateUtilityListingSuccessResponse<T>> {
    try {
      const response = await this.axios.post<CreateUtilityListingSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDUtilityListingsRoute()}`,
        payload
      );
      return new CreateUtilityListingSuccessResponse<T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates a utility listing.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/utilityListings`
   * - **SDK Function Call**: `await BitBadgesApi.updateUtilityListing(payload);`
   */
  public async updateUtilityListing(payload: iUpdateUtilityListingPayload<T>): Promise<UpdateUtilityListingSuccessResponse<T>> {
    try {
      const response = await this.axios.put<UpdateUtilityListingSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDUtilityListingsRoute()}`,
        payload
      );
      return new UpdateUtilityListingSuccessResponse<T>(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes a utility listing.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/utilityListings`
   * - **SDK Function Call**: `await BitBadgesApi.deleteUtilityListing(payload);`
   */
  public async deleteUtilityListing(payload: iDeleteUtilityListingPayload): Promise<DeleteUtilityListingSuccessResponse> {
    try {
      const response = await this.axios.delete<DeleteUtilityListingSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDUtilityListingsRoute()}`,
        { data: payload }
      );
      return new DeleteUtilityListingSuccessResponse(response.data);
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
   * - **SDK Function Call**: `await BitBadgesApi.getClaimAttempts(payload);`
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
   * Updates the user's seen activity.
   */
  public async updateUserSeenActivity() {
    return await this.updateAccountInfo({ seenActivity: Date.now() }); //Authenticated route so no need to pass in address
  }
}

export class BitBadgesAdminAPI<T extends NumberType> extends BitBadgesAPI<T> {
  constructor(apiDetails: iBitBadgesApi<T>) {
    super(apiDetails);
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
  public async getActiveAuthorizations(payload: iGetActiveAuthorizationsPayload): Promise<GetActiveAuthorizationsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetActiveAuthorizationsPayload> = typia.validate<iGetActiveAuthorizationsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<GetActiveAuthorizationsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetActiveAuthorizationsRoute()}`,
        payload
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
   * Get all developer apps for a user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/developerApps`
   * - **SDK Function Call**: `await BitBadgesApi.getDeveloperApp(payload);`
   */
  public async getDeveloperApps(payload: iGetDeveloperAppsPayload): Promise<GetDeveloperAppSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetDeveloperAppsPayload> = typia.validate<iGetDeveloperAppsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<GetDeveloperAppSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetDeveloperAppsRoute()}`,
        payload
      );
      return new GetDeveloperAppSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Searches for developer apps.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/developerApps/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchDeveloperApps(payload);`
   */
  public async searchDeveloperApps(payload: iSearchDeveloperAppsPayload): Promise<SearchDeveloperAppsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iSearchDeveloperAppsPayload> = typia.validate<iSearchDeveloperAppsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<SearchDeveloperAppsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SearchDeveloperAppsRoute()}`,
        payload
      );
      return new SearchDeveloperAppsSuccessResponse<T>(response.data);
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
   * Get all developer apps for a user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/plugins`
   * - **SDK Function Call**: `await BitBadgesApi.getPlugins(payload);`
   */
  public async getPlugins(payload: iGetPluginsPayload): Promise<GetPluginSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetPluginsPayload> = typia.validate<iGetPluginsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<GetPluginSuccessResponse<T>>(`${this.BACKEND_URL}${BitBadgesApiRoutes.GetPluginRoute()}`, payload);
      return new GetPluginSuccessResponse(response.data).convert(this.ConvertFunction);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Searches for plugins.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/plugins/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchPlugins(payload);`
   */
  public async searchPlugins(payload: iSearchPluginsPayload): Promise<SearchPluginsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iSearchPluginsPayload> = typia.validate<iSearchPluginsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<SearchPluginsSuccessResponse<T>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SearchPluginsRoute()}`,
        payload
      );
      return new SearchPluginsSuccessResponse<T>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Generates an Google wallet pass for a code. Returns a saveUrl to be opened.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbbRequest/googleWalletPass`
   * - **SDK Function Call**: `await BitBadgesApi.generateGoogleWallet(payload);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.generateGoogleWallet(payload);
   * console.log(res);
   * ```
   */
  public async generateGoogleWallet(payload: iGenerateGoogleWalletPayload): Promise<GenerateGoogleWalletSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iGenerateGoogleWalletPayload> = typia.validate<iGenerateGoogleWalletPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<GenerateGoogleWalletSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GenerateGoogleWalletPassRoute()}`,
        payload
      );
      return new GenerateGoogleWalletSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
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
  public async generateAppleWalletPass(payload: iGenerateAppleWalletPassPayload): Promise<GenerateAppleWalletPassSuccessResponse> {
    try {
      const validateRes: typia.IValidation<iGenerateAppleWalletPassPayload> = typia.validate<iGenerateAppleWalletPassPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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

  public async getEmbeddedWallet(payload?: iGetOrCreateEmbeddedWalletPayload): Promise<GetOrCreateEmbeddedWalletSuccessResponse> {
    try {
      const response = await this.axios.post<GetOrCreateEmbeddedWalletSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetEmbeddedWalletRoute()}`,
        payload
      );
      return new GetOrCreateEmbeddedWalletSuccessResponse(response.data);
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

  public async signWithEmbeddedWallet(payload: iSignWithEmbeddedWalletPayload): Promise<SignWithEmbeddedWalletSuccessResponse> {
    try {
      const response = await this.axios.post<SignWithEmbeddedWalletSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.SignWithEmbeddedWalletRoute()}`,
        payload
      );
      return new SignWithEmbeddedWalletSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }
}

export default BitBadgesAPI;
