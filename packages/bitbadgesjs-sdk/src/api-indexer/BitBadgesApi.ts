import type { NumberType } from '@/common/string-numbers.js';
import { BitBadgesCollection, GetCollectionsPayload, GetCollectionsSuccessResponse } from './BitBadgesCollection.js';

import typia from 'typia';
import type {
  CreateAddressListsPayload,
  CreateAddressListsSuccessResponse,
  DeleteAddressListsPayload,
  DeleteAddressListsSuccessResponse,
  GetAddressListsPayload,
  GetAddressListsSuccessResponse,
  UpdateAddressListsPayload,
  UpdateAddressListsSuccessResponse
} from './BitBadgesAddressList.js';
import { BitBadgesAddressList } from './BitBadgesAddressList.js';
import type { GetAccountsPayload, GetAccountsSuccessResponse } from './BitBadgesUserInfo.js';
import { BitBadgesUserInfo } from './BitBadgesUserInfo.js';
import type { iBitBadgesApi } from './base.js';
import { BaseBitBadgesApi } from './base.js';
import type { DynamicDataHandlerType, NativeAddress } from './docs/interfaces.js';
import type {
  FilterBadgesInCollectionPayload,
  FilterBadgesInCollectionSuccessResponse,
  FilterSuggestionsPayload,
  GetBadgeActivityPayload,
  GetBadgeActivitySuccessResponse,
  GetBadgeBalanceByAddressPayload,
  GetBadgeBalanceByAddressSuccessResponse,
  GetOwnersForBadgePayload,
  GetOwnersForBadgeSuccessResponse,
  RefreshMetadataPayload,
  RefreshMetadataSuccessResponse,
  RefreshStatusSuccessResponse,
  iFilterSuggestionsSuccessResponse
} from './requests/collections.js';
import { FilterSuggestionsSuccessResponse } from './requests/collections.js';
import {
  GetMapValuesPayload,
  GetMapValuesSuccessResponse,
  GetMapsPayload,
  GetMapsSuccessResponse,
  iGetMapValuesSuccessResponse,
  iGetMapsSuccessResponse
} from './requests/maps.js';
import {
  AddApprovalDetailsToOffChainStoragePayload,
  AddApprovalDetailsToOffChainStorageSuccessResponse,
  AddBalancesToOffChainStoragePayload,
  AddBalancesToOffChainStorageSuccessResponse,
  AddToIpfsPayload,
  AddToIpfsSuccessResponse,
  BatchBinActionPayload,
  BatchBinActionSuccessResponse,
  BroadcastTxPayload,
  BroadcastTxSuccessResponse,
  CheckSignInStatusPayload,
  CheckSignInStatusSuccessResponse,
  CompleteClaimPayload,
  CompleteClaimSuccessResponse,
  CreateAttestationPayload,
  CreateAttestationSuccessResponse,
  CreateClaimPayload,
  CreateClaimSuccessResponse,
  CreateDeveloperAppPayload,
  CreateDeveloperAppSuccessResponse,
  CreateDynamicDataBinPayload,
  CreateDynamicDataBinSuccessResponse,
  CreateInternalActionPayload,
  CreateInternalActionSuccessResponse,
  CreatePaymentIntentPayload,
  CreatePaymentIntentSuccessResponse,
  CreatePluginPayload,
  CreatePluginSuccessResponse,
  CreateSIWBBRequestPayload,
  CreateSIWBBRequestSuccessResponse,
  DeleteAttestationPayload,
  DeleteAttestationSuccessResponse,
  DeleteClaimPayload,
  DeleteClaimSuccessResponse,
  DeleteDeveloperAppPayload,
  DeleteDeveloperAppSuccessResponse,
  DeleteDynamicDataBinPayload,
  DeleteDynamicDataBinSuccessResponse,
  DeleteInternalActionPayload,
  DeleteInternalActionSuccessResponse,
  DeletePluginPayload,
  DeletePluginSuccessResponse,
  DeleteSIWBBRequestPayload,
  DeleteSIWBBRequestSuccessResponse,
  ExchangeSIWBBAuthorizationCodePayload,
  ExchangeSIWBBAuthorizationCodeSuccessResponse,
  FetchMetadataDirectlyPayload,
  FetchMetadataDirectlySuccessResponse,
  GenerateAppleWalletPassPayload,
  GenerateAppleWalletPassSuccessResponse,
  GenerateGoogleWalletPayload,
  GenerateGoogleWalletSuccessResponse,
  GenericBlockinVerifyPayload,
  GenericBlockinVerifySuccessResponse,
  GenericVerifyAssetsPayload,
  GenericVerifyAssetsSuccessResponse,
  GetActiveAuthorizationsPayload,
  GetActiveAuthorizationsSuccessResponse,
  GetAttestationsPayload,
  GetAttestationsSuccessResponse,
  GetBrowseCollectionsPayload,
  GetBrowseCollectionsSuccessResponse,
  GetClaimAlertsForCollectionPayload,
  GetClaimAlertsForCollectionSuccessResponse,
  GetClaimAttemptStatusSuccessResponse,
  GetClaimsPayload,
  GetClaimsSuccessResponse,
  GetDeveloperAppPayload,
  GetDeveloperAppSuccessResponse,
  GetDynamicDataActivityPayload,
  GetDynamicDataActivitySuccessResponse,
  GetDynamicDataBinsPayload,
  GetDynamicDataBinsSuccessResponse,
  GetGatedContentForClaimPayload,
  GetGatedContentForClaimSuccessResponse,
  GetInternalActionPayload,
  GetInternalActionSuccessResponse,
  GetPluginPayload,
  GetPluginSuccessResponse,
  GetReservedClaimCodesPayload,
  GetReservedClaimCodesSuccessResponse,
  GetSIWBBRequestsForDeveloperAppPayload,
  GetSIWBBRequestsForDeveloperAppSuccessResponse,
  GetSearchPayload,
  GetSearchSuccessResponse,
  GetSignInChallengePayload,
  GetSignInChallengeSuccessResponse,
  GetStatusPayload,
  GetStatusSuccessResponse,
  GetTokensFromFaucetPayload,
  GetTokensFromFaucetSuccessResponse,
  OauthRevokePayload,
  OauthRevokeSuccessResponse,
  PerformBinActionPayload,
  PerformBinActionSuccessResponse,
  RotateSIWBBRequestPayload,
  RotateSIWBBRequestSuccessResponse,
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
  UpdateAttestationPayload,
  UpdateAttestationSuccessResponse,
  UpdateClaimPayload,
  UpdateClaimSuccessResponse,
  UpdateDeveloperAppPayload,
  UpdateDeveloperAppSuccessResponse,
  UpdateDynamicDataBinPayload,
  UpdateDynamicDataBinSuccessResponse,
  UpdateInternalActionPayload,
  UpdateInternalActionSuccessResponse,
  UpdatePluginPayload,
  UpdatePluginSuccessResponse,
  VerifyAttestationPayload,
  VerifyAttestationSuccessResponse,
  VerifySignInPayload,
  VerifySignInSuccessResponse,
  iAddApprovalDetailsToOffChainStorageSuccessResponse,
  iAddBalancesToOffChainStorageSuccessResponse,
  iAddToIpfsSuccessResponse,
  iBroadcastTxSuccessResponse,
  iCheckSignInStatusSuccessResponse,
  iCompleteClaimSuccessResponse,
  iCreateDynamicDataBinSuccessResponse,
  iCreatePaymentIntentSuccessResponse,
  iCreateSIWBBRequestSuccessResponse,
  iDeleteSIWBBRequestSuccessResponse,
  iExchangeSIWBBAuthorizationCodeSuccessResponse,
  iFetchMetadataDirectlySuccessResponse,
  iGenericBlockinVerifySuccessResponse,
  iGenericVerifyAssetsSuccessResponse,
  iGetBrowseCollectionsSuccessResponse,
  iGetClaimAlertsForCollectionSuccessResponse,
  iGetClaimAttemptStatusSuccessResponse,
  iGetClaimsSuccessResponse,
  iGetDynamicDataBinsSuccessResponse,
  iGetReservedClaimCodesSuccessResponse,
  iGetSIWBBRequestsForDeveloperAppSuccessResponse,
  iGetSearchSuccessResponse,
  iGetSignInChallengeSuccessResponse,
  iGetStatusSuccessResponse,
  iGetTokensFromFaucetSuccessResponse,
  iRotateSIWBBRequestSuccessResponse,
  iSendClaimAlertsSuccessResponse,
  iSignOutSuccessResponse,
  iSimulateClaimSuccessResponse,
  iSimulateTxSuccessResponse,
  iUpdateAccountInfoSuccessResponse,
  iUpdateDynamicDataBinSuccessResponse,
  iVerifySignInSuccessResponse
} from './requests/requests.js';
import { BitBadgesApiRoutes } from './requests/routes.js';

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
  public async getStatus(payload?: GetStatusPayload): Promise<GetStatusSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<GetStatusPayload> = typia.validate<GetStatusPayload>(payload ?? {});
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
  public async getSearchResults(searchValue: string, payload?: GetSearchPayload): Promise<GetSearchSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<GetSearchPayload> = typia.validate<GetSearchPayload>(payload ?? {});
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
  public async completeClaim(claimId: string, address: string, payload: CompleteClaimPayload): Promise<CompleteClaimSuccessResponse> {
    try {
      const validateRes: typia.IValidation<CompleteClaimPayload> = typia.validate<CompleteClaimPayload>(payload ?? {});
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
  public async simulateClaim(claimId: string, address: string, payload: SimulateClaimPayload): Promise<SimulateClaimSuccessResponse> {
    try {
      const validateRes: typia.IValidation<SimulateClaimPayload> = typia.validate<SimulateClaimPayload>(payload ?? {});
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
    payload: GetReservedClaimCodesPayload
  ): Promise<GetReservedClaimCodesSuccessResponse> {
    try {
      const validateRes: typia.IValidation<GetReservedClaimCodesPayload> = typia.validate<GetReservedClaimCodesPayload>(payload ?? {});
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
      const validateRes: typia.IValidation<UpdateAccountInfoPayload> = typia.validate<UpdateAccountInfoPayload>(payload ?? {});
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
  public async checkIfSignedIn(payload: CheckSignInStatusPayload): Promise<CheckSignInStatusSuccessResponse> {
    try {
      const validateRes: typia.IValidation<CheckSignInStatusPayload> = typia.validate<CheckSignInStatusPayload>(payload ?? {});
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
   * - **SDK Function Call**: `await BitBadgesApi.getBrowseCollections(payload);`
   */
  public async getBrowseCollections(payload: GetBrowseCollectionsPayload): Promise<GetBrowseCollectionsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<GetBrowseCollectionsPayload> = typia.validate<GetBrowseCollectionsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
      // const validateRes: typia.IValidation<BroadcastTxPayload> = typia.validate<BroadcastTxPayload>(payload ?? {});
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
  public async simulateTx(payload: SimulateTxPayload | string): Promise<SimulateTxSuccessResponse> {
    try {
      // const validateRes: typia.IValidation<SimulateTxPayload> = typia.validate<SimulateTxPayload>(payload ?? {});
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
  public async createAddressLists(payload: CreateAddressListsPayload<T>): Promise<CreateAddressListsSuccessResponse> {
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
  public async updateAddressLists(payload: UpdateAddressListsPayload<T>): Promise<UpdateAddressListsSuccessResponse> {
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
   * - **SDK Function Call**: `await BitBadgesApi.exchangeSIWBBAuthorizationCode(payload);`
   */
  public async exchangeSIWBBAuthorizationCode(
    payload?: ExchangeSIWBBAuthorizationCodePayload
  ): Promise<ExchangeSIWBBAuthorizationCodeSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<ExchangeSIWBBAuthorizationCodePayload> = typia.validate<ExchangeSIWBBAuthorizationCodePayload>(
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
   * - **API Route**: `POST /api/v0/developerApp/siwbbRequests`
   * - **SDK Function Call**: `await BitBadgesApi.getSIWBBRequestsForDeveloperApp(payload);`
   */
  public async getSIWBBRequestsForDeveloperApp(
    payload: GetSIWBBRequestsForDeveloperAppPayload
  ): Promise<GetSIWBBRequestsForDeveloperAppSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<GetSIWBBRequestsForDeveloperAppPayload> = typia.validate<GetSIWBBRequestsForDeveloperAppPayload>(
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
  public async createSIWBBRequest(payload?: CreateSIWBBRequestPayload): Promise<CreateSIWBBRequestSuccessResponse> {
    try {
      const validateRes: typia.IValidation<CreateSIWBBRequestPayload> = typia.validate<CreateSIWBBRequestPayload>(payload ?? {});
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
  public async rotateSIWBBRequest(payload: RotateSIWBBRequestPayload): Promise<RotateSIWBBRequestSuccessResponse> {
    try {
      const validateRes: typia.IValidation<RotateSIWBBRequestPayload> = typia.validate<RotateSIWBBRequestPayload>(payload ?? {});
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
  public async deleteSIWBBRequest(payload?: DeleteSIWBBRequestPayload): Promise<DeleteSIWBBRequestSuccessResponse> {
    try {
      const validateRes: typia.IValidation<DeleteSIWBBRequestPayload> = typia.validate<DeleteSIWBBRequestPayload>(payload ?? {});
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
  public async verifySIWBBRequest(payload: GenericBlockinVerifyPayload): Promise<GenericBlockinVerifySuccessResponse> {
    try {
      const validateRes: typia.IValidation<GenericBlockinVerifyPayload> = typia.validate<GenericBlockinVerifyPayload>(payload ?? {});
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
  public async verifyOwnershipRequirements(payload: GenericVerifyAssetsPayload): Promise<GenericVerifyAssetsSuccessResponse> {
    try {
      const validateRes: typia.IValidation<GenericVerifyAssetsPayload> = typia.validate<GenericVerifyAssetsPayload>(payload ?? {});
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
  public async sendClaimAlert(payload: SendClaimAlertsPayload): Promise<SendClaimAlertsSuccessResponse> {
    try {
      const validateRes: typia.IValidation<SendClaimAlertsPayload> = typia.validate<SendClaimAlertsPayload>(payload ?? {});
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
  public async getClaimAlerts(payload: GetClaimAlertsForCollectionPayload): Promise<GetClaimAlertsForCollectionSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<GetClaimAlertsForCollectionPayload> = typia.validate<GetClaimAlertsForCollectionPayload>(payload ?? {});
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
  public async getMaps(payload: GetMapsPayload): Promise<GetMapsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<GetMapsPayload> = typia.validate<GetMapsPayload>(payload ?? {});
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
  public async getMapValues(payload: GetMapValuesPayload): Promise<GetMapValuesSuccessResponse> {
    try {
      const validateRes: typia.IValidation<GetMapValuesPayload> = typia.validate<GetMapValuesPayload>(payload ?? {});
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
    payload: FilterBadgesInCollectionPayload
  ): Promise<FilterBadgesInCollectionSuccessResponse<T>> {
    return await BitBadgesCollection.FilterBadgesInCollection(this, collectionId, payload);
  }

  /**
   * Gets the filter suggestions based on attributes in a collection.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/filterSuggestions`
   * - **SDK Function Call**: `await BitBadgesApi.filterSuggestions(payload);`
   */
  public async filterSuggestions(collectionId: T, payload?: FilterSuggestionsPayload): Promise<FilterSuggestionsSuccessResponse> {
    try {
      const validateRes: typia.IValidation<FilterSuggestionsPayload> = typia.validate<FilterSuggestionsPayload>(payload ?? {});
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
  public async getClaims(payload: GetClaimsPayload): Promise<GetClaimsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<GetClaimsPayload> = typia.validate<GetClaimsPayload>(payload ?? {});
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
   * Get an off-chain attestation signature (typically a credential).
   *
   * @remarks
   * - **API Route**: `POST /api/v0/attestations`
   * - **SDK Function Call**: `await BitBadgesApi.getAttestations(payload);`
   */
  public async getAttestations(payload: GetAttestationsPayload): Promise<GetAttestationsSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<GetAttestationsPayload> = typia.validate<GetAttestationsPayload>(payload ?? {});
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
   * - **API Route**: `POST /api/v0/attestation`
   * - **SDK Function Call**: `await BitBadgesApi.createAttestation(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async createAttestation(payload: CreateAttestationPayload): Promise<CreateAttestationSuccessResponse> {
    try {
      const validateRes: typia.IValidation<CreateAttestationPayload> = typia.validate<CreateAttestationPayload>(payload ?? {});
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
   * - **API Route**: `DELETE /api/v0/attestation`
   * - **SDK Function Call**: `await BitBadgesApi.deleteAttestation(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async deleteAttestation(payload: DeleteAttestationPayload): Promise<DeleteAttestationSuccessResponse> {
    try {
      const validateRes: typia.IValidation<DeleteAttestationPayload> = typia.validate<DeleteAttestationPayload>(payload ?? {});
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
   * - **API Route**: `PUT /api/v0/attestation`
   * - **SDK Function Call**: `await BitBadgesApi.updateUserAttestations(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async updateAttestation(payload: UpdateAttestationPayload): Promise<UpdateAttestationSuccessResponse> {
    try {
      const validateRes: typia.IValidation<UpdateAttestationPayload> = typia.validate<UpdateAttestationPayload>(payload ?? {});
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
   * - **API Route**: `POST /api/v0/attestation/verify`
   * - **SDK Function Call**: `await BitBadgesApi.verifyAttestation(payload);`
   */
  public async verifyAttestation(payload: VerifyAttestationPayload): Promise<VerifyAttestationSuccessResponse> {
    try {
      const validateRes: typia.IValidation<VerifyAttestationPayload> = typia.validate<VerifyAttestationPayload>(payload ?? {});
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
  public async createClaims(payload: CreateClaimPayload): Promise<CreateClaimSuccessResponse> {
    try {
      const validateRes: typia.IValidation<CreateClaimPayload> = typia.validate<CreateClaimPayload>(payload ?? {});
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
  public async deleteClaims(payload: DeleteClaimPayload): Promise<DeleteClaimSuccessResponse> {
    try {
      const validateRes: typia.IValidation<DeleteClaimPayload> = typia.validate<DeleteClaimPayload>(payload ?? {});
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
  public async updateClaims(payload: UpdateClaimPayload): Promise<UpdateClaimSuccessResponse> {
    try {
      const validateRes: typia.IValidation<UpdateClaimPayload> = typia.validate<UpdateClaimPayload>(payload ?? {});
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
  public async revokeOauthAuthorization(payload: OauthRevokePayload): Promise<OauthRevokeSuccessResponse> {
    try {
      const validateRes: typia.IValidation<OauthRevokePayload> = typia.validate<OauthRevokePayload>(payload ?? {});
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
  public async addBalancesToOffChainStorage(payload: AddBalancesToOffChainStoragePayload): Promise<AddBalancesToOffChainStorageSuccessResponse> {
    try {
      const validateRes: typia.IValidation<AddBalancesToOffChainStoragePayload> = typia.validate<AddBalancesToOffChainStoragePayload>(payload ?? {});
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
      const validateRes: typia.IValidation<GetGatedContentForClaimPayload> = typia.validate<GetGatedContentForClaimPayload>({});
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
  public async getSignInChallenge(payload: GetSignInChallengePayload): Promise<GetSignInChallengeSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<GetSignInChallengePayload> = typia.validate<GetSignInChallengePayload>(payload ?? {});
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
  public async verifySignIn(payload: VerifySignInPayload): Promise<VerifySignInSuccessResponse> {
    try {
      const validateRes: typia.IValidation<VerifySignInPayload> = typia.validate<VerifySignInPayload>(payload ?? {});
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
  public async signOut(payload?: SignOutPayload): Promise<SignOutSuccessResponse> {
    try {
      const validateRes: typia.IValidation<SignOutPayload> = typia.validate<SignOutPayload>(payload ?? {});
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
   * Performs a bin action.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/bin-actions/{actionName}/{binId}/{binSecret}`
   * - **API Route (Body Auth)**: `POST /api/v0/bin-actions/single`
   * - **SDK Function Call**: `await BitBadgesApi.performBinAction(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async performBinAction(
    payload: PerformBinActionPayload,
    actionName: string,
    binId: string,
    binSecret: string,
    /**
     * There are two ways to pass in the payload.
     * 1. Body Auth: `POST /api/v0/bin-actions/single`
     * 2. Path Auth: `POST /api/v0/bin-actions/{actionName}/{binId}/{binSecret}`
     *
     * Since you are calling from the API and have control over the payload, we always recommend the body auth for more security.
     */
    bodyAuth = true
  ): Promise<PerformBinActionSuccessResponse> {
    try {
      const validateRes: typia.IValidation<PerformBinActionPayload> = typia.validate<PerformBinActionPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      if (bodyAuth) {
        const response = await this.axios.post<PerformBinActionSuccessResponse>(
          `${this.BACKEND_URL}${BitBadgesApiRoutes.PerformBinActionSingleWithBodyAuthRoute()}`,
          {
            dynamicDataId: binId,
            dataSecret: binSecret,
            actionName: actionName,
            payload: payload
          }
        );
        return new PerformBinActionSuccessResponse(response.data);
      } else {
        const response = await this.axios.post<PerformBinActionSuccessResponse>(
          `${this.BACKEND_URL}${BitBadgesApiRoutes.PerformBinActionSingleRoute(actionName, binId, binSecret)}`,
          payload
        );
        return new PerformBinActionSuccessResponse(response.data);
      }
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Performs multiple bin actions in batch.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/bin-actions/batch/{binId}/{binSecret}`
   * - **API Route (Body Auth)**: `POST /api/v0/bin-actions/batch`
   * - **SDK Function Call**: `await BitBadgesApi.performBatchBinAction(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async performBatchBinAction(
    payload: BatchBinActionPayload,
    binId: string,
    binSecret: string,
    /**
     * There are two ways to pass in the payload.
     * 1. Body Auth: `POST /api/v0/bin-actions/batch`
     * 2. Path Auth: `POST /api/v0/bin-actions/batch/{binId}/{binSecret}`
     *
     * Since you are calling from the API and have control over the payload, we always recommend the body auth for more security.
     */
    bodyAuth = true
  ): Promise<BatchBinActionSuccessResponse> {
    try {
      const validateRes: typia.IValidation<BatchBinActionPayload> = typia.validate<BatchBinActionPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      if (bodyAuth) {
        const response = await this.axios.post<BatchBinActionSuccessResponse>(
          `${this.BACKEND_URL}${BitBadgesApiRoutes.PerformBinActionBatchWithBodyAuthRoute()}`,
          {
            ...payload,
            dynamicDataId: binId,
            dataSecret: binSecret
          }
        );
        return new BatchBinActionSuccessResponse(response.data);
      } else {
        const response = await this.axios.post<BatchBinActionSuccessResponse>(
          `${this.BACKEND_URL}${BitBadgesApiRoutes.PerformBinActionBatchRoute(binId, binSecret)}`,
          payload
        );
        return new BatchBinActionSuccessResponse(response.data);
      }
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get dynamic data bin activity
   */
  public async getDynamicDataActivity(payload: GetDynamicDataActivityPayload): Promise<GetDynamicDataActivitySuccessResponse> {
    try {
      const response = await this.axios.post<GetDynamicDataActivitySuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetDynamicDataActivityRoute()}`,
        payload
      );
      return new GetDynamicDataActivitySuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets dynamic data bins.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/dynamicData/fetch`
   * - **SDK Function Call**: `await BitBadgesApi.getDynamicDataBins(payload);`
   */
  public async getDynamicDataBins<Q extends DynamicDataHandlerType>(
    payload: GetDynamicDataBinsPayload
  ): Promise<GetDynamicDataBinsSuccessResponse<Q>> {
    try {
      const validateRes: typia.IValidation<GetDynamicDataBinsPayload> = typia.validate<GetDynamicDataBinsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iGetDynamicDataBinsSuccessResponse<Q>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetDynamicDataBinsRoute()}`,
        payload
      );
      return new GetDynamicDataBinsSuccessResponse<Q>(response.data);
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
  public async getActiveAuthorizations(payload: GetActiveAuthorizationsPayload): Promise<GetActiveAuthorizationsSuccessResponse> {
    try {
      const validateRes: typia.IValidation<GetActiveAuthorizationsPayload> = typia.validate<GetActiveAuthorizationsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

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
   * Creates a plugin.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/plugins`
   * - **SDK Function Call**: `await BitBadgesApi.createPlugin(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async createPlugin(payload: CreatePluginPayload): Promise<CreatePluginSuccessResponse> {
    try {
      const validateRes: typia.IValidation<CreatePluginPayload> = typia.validate<CreatePluginPayload>(payload ?? {});
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
  public async updatePlugin(payload: UpdatePluginPayload): Promise<UpdatePluginSuccessResponse> {
    try {
      const validateRes: typia.IValidation<UpdatePluginPayload> = typia.validate<UpdatePluginPayload>(payload ?? {});
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
  public async deletePlugin(payload: DeletePluginPayload): Promise<DeletePluginSuccessResponse> {
    try {
      const validateRes: typia.IValidation<DeletePluginPayload> = typia.validate<DeletePluginPayload>(payload ?? {});
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
   * - **API Route**: `POST /api/v0/developerApp`
   * - **SDK Function Call**: `await BitBadgesApi.getDeveloperApp(payload);`
   */
  public async getDeveloperApps(payload: GetDeveloperAppPayload): Promise<GetDeveloperAppSuccessResponse> {
    try {
      const validateRes: typia.IValidation<GetDeveloperAppPayload> = typia.validate<GetDeveloperAppPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<GetDeveloperAppSuccessResponse>(
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
   * Creates an developer app.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/developerApp`
   * - **SDK Function Call**: `await BitBadgesApi.createDeveloperApp(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async createDeveloperApp(payload: CreateDeveloperAppPayload): Promise<CreateDeveloperAppSuccessResponse> {
    try {
      const validateRes: typia.IValidation<CreateDeveloperAppPayload> = typia.validate<CreateDeveloperAppPayload>(payload ?? {});
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
   * - **API Route**: `DELETE /api/v0/developerApp`
   * - **SDK Function Call**: `await BitBadgesApi.deleteDeveloperApp(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async deleteDeveloperApp(payload: DeleteDeveloperAppPayload): Promise<DeleteDeveloperAppSuccessResponse> {
    try {
      const validateRes: typia.IValidation<DeleteDeveloperAppPayload> = typia.validate<DeleteDeveloperAppPayload>(payload ?? {});
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
   * - **API Route**: `PUT /api/v0/developerApp`
   * - **SDK Function Call**: `await BitBadgesApi.updateUserDeveloperApps(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async updateDeveloperApp(payload: UpdateDeveloperAppPayload): Promise<UpdateDeveloperAppSuccessResponse> {
    try {
      const validateRes: typia.IValidation<UpdateDeveloperAppPayload> = typia.validate<UpdateDeveloperAppPayload>(payload ?? {});
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
  public async getPlugins(payload: GetPluginPayload): Promise<GetPluginSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<GetPluginPayload> = typia.validate<GetPluginPayload>(payload ?? {});
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
  public async generateGoogleWallet(payload: GenerateGoogleWalletPayload): Promise<GenerateGoogleWalletSuccessResponse> {
    try {
      const validateRes: typia.IValidation<GenerateGoogleWalletPayload> = typia.validate<GenerateGoogleWalletPayload>(payload ?? {});
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
  public async generateAppleWalletPass(payload: GenerateAppleWalletPassPayload): Promise<GenerateAppleWalletPassSuccessResponse> {
    try {
      const validateRes: typia.IValidation<GenerateAppleWalletPassPayload> = typia.validate<GenerateAppleWalletPassPayload>(payload ?? {});
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
  public async fetchMetadataDirectly(payload: FetchMetadataDirectlyPayload): Promise<FetchMetadataDirectlySuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<FetchMetadataDirectlyPayload> = typia.validate<FetchMetadataDirectlyPayload>(payload ?? {});
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
  public async getTokensFromFaucet(payload?: GetTokensFromFaucetPayload): Promise<GetTokensFromFaucetSuccessResponse> {
    try {
      const validateRes: typia.IValidation<GetTokensFromFaucetPayload> = typia.validate<GetTokensFromFaucetPayload>(payload ?? {});
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
  public async addToIpfs(payload: AddToIpfsPayload): Promise<AddToIpfsSuccessResponse> {
    try {
      const validateRes: typia.IValidation<AddToIpfsPayload> = typia.validate<AddToIpfsPayload>(payload ?? {});
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
    payload: AddApprovalDetailsToOffChainStoragePayload
  ): Promise<AddApprovalDetailsToOffChainStorageSuccessResponse> {
    try {
      const validateRes: typia.IValidation<AddApprovalDetailsToOffChainStoragePayload> = typia.validate<AddApprovalDetailsToOffChainStoragePayload>(
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
  public async createPaymentIntent(payload: CreatePaymentIntentPayload): Promise<CreatePaymentIntentSuccessResponse> {
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
   * - **API Route**: `POST /api/v0/dynamicData`
   * - **SDK Function Call**: `await BitBadgesApi.createDynamicDataBin(payload);`
   */
  public async createDynamicDataBin<Q extends DynamicDataHandlerType>(
    payload: CreateDynamicDataBinPayload
  ): Promise<CreateDynamicDataBinSuccessResponse<Q>> {
    try {
      const validateRes: typia.IValidation<CreateDynamicDataBinPayload> = typia.validate<CreateDynamicDataBinPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<iCreateDynamicDataBinSuccessResponse<Q>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDDynamicDataRoute()}`,
        payload
      );
      return new CreateDynamicDataBinSuccessResponse<Q>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates a dynamic data bin.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/dynamicData`
   * - **SDK Function Call**: `await BitBadgesApi.updateDynamicDataBin(payload);`
   */
  public async updateDynamicDataBin<Q extends DynamicDataHandlerType>(
    payload: UpdateDynamicDataBinPayload
  ): Promise<UpdateDynamicDataBinSuccessResponse<Q>> {
    try {
      const validateRes: typia.IValidation<UpdateDynamicDataBinPayload> = typia.validate<UpdateDynamicDataBinPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.put<iUpdateDynamicDataBinSuccessResponse<Q>>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDDynamicDataRoute()}`,
        payload
      );
      return new UpdateDynamicDataBinSuccessResponse<Q>(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes a dynamic data bin.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/dynamicData`
   * - **SDK Function Call**: `await BitBadgesApi.deleteDynamicDataBin(payload);`
   */
  public async deleteDynamicDataBin(payload: DeleteDynamicDataBinPayload): Promise<DeleteDynamicDataBinSuccessResponse> {
    try {
      const validateRes: typia.IValidation<DeleteDynamicDataBinPayload> = typia.validate<DeleteDynamicDataBinPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.delete<DeleteDynamicDataBinSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDDynamicDataRoute()}`,
        { data: payload }
      );
      return new DeleteDynamicDataBinSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * @remarks
   * - **API Route**: `POST /api/v0/internalAction`
   * - **SDK Function Call**: `await BitBadgesApi.createInternalAction(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async createInternalAction(payload: CreateInternalActionPayload): Promise<CreateInternalActionSuccessResponse> {
    try {
      const validateRes: typia.IValidation<CreateInternalActionPayload> = typia.validate<CreateInternalActionPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<CreateInternalActionSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDInternalActionRoute()}`,
        payload
      );
      return new CreateInternalActionSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets internal actions.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/internalAction/fetch`
   * - **SDK Function Call**: `await BitBadgesApi.getInternalActions(payload);`
   */
  public async getInternalActions(payload: GetInternalActionPayload): Promise<GetInternalActionSuccessResponse> {
    try {
      const validateRes: typia.IValidation<GetInternalActionPayload> = typia.validate<GetInternalActionPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.post<GetInternalActionSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.GetInternalActionsRoute()}`,
        payload
      );
      return new GetInternalActionSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates an internal action.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/internalAction`
   * - **SDK Function Call**: `await BitBadgesApi.updateInternalAction(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async updateInternalAction(payload: UpdateInternalActionPayload): Promise<UpdateInternalActionSuccessResponse> {
    try {
      const validateRes: typia.IValidation<UpdateInternalActionPayload> = typia.validate<UpdateInternalActionPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.put<UpdateInternalActionSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDInternalActionRoute()}`,
        payload
      );
      return new UpdateInternalActionSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes an internal action.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/internalAction`
   * - **SDK Function Call**: `await BitBadgesApi.deleteInternalAction(payload);`
   * - **Authentication**: Must be signed in.
   */
  public async deleteInternalAction(payload: DeleteInternalActionPayload): Promise<DeleteInternalActionSuccessResponse> {
    try {
      const validateRes: typia.IValidation<DeleteInternalActionPayload> = typia.validate<DeleteInternalActionPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await this.axios.delete<DeleteInternalActionSuccessResponse>(
        `${this.BACKEND_URL}${BitBadgesApiRoutes.CRUDInternalActionRoute()}`,
        { data: payload }
      );
      return new DeleteInternalActionSuccessResponse(response.data);
    } catch (error) {
      await this.handleApiError(error);
      return Promise.reject(error);
    }
  }
}

export default BitBadgesAPI;
