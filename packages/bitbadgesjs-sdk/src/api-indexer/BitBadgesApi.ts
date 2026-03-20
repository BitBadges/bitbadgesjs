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
  GetOnChainDynamicStoreSuccessResponse,
  GetOnChainDynamicStoreValueSuccessResponse,
  GetOnChainDynamicStoreValuesPaginatedSuccessResponse,
  GetOnChainDynamicStoresByCreatorSuccessResponse,
  GetPluginErrorsSuccessResponse,
  GetPluginSuccessResponse,
  GetPluginsSuccessResponse,
  GetPointsActivitySuccessResponse,
  GetReservedClaimCodesSuccessResponse,
  GetSIWBBRequestsForDeveloperAppSuccessResponse,
  GetSearchSuccessResponse,
  GetSignInChallengeSuccessResponse,
  GetStatusSuccessResponse,
  GetSwapActivitiesSuccessResponse,
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
  iGetBrowsePayload,
  iGetBrowseSuccessResponse,
  iGetClaimAttemptStatusSuccessResponse,
  iGetClaimAttemptsPayload,
  iGetClaimPayload,
  iGetClaimsPayloadV1,
  iGetClaimsSuccessResponse,
  iGetCollectionAmountTrackerByIdSuccessResponse,
  iGetCollectionChallengeTrackerByIdSuccessResponse,
  iGetCreatorPluginsPayload,
  iGetDeveloperAppPayload,
  iGetDeveloperAppsPayload,
  iGetDynamicDataActivityPayload,
  iGetDynamicDataStorePayload,
  iGetDynamicDataStoreValuePayload,
  iGetDynamicDataStoreValuesPaginatedPayload,
  iGetDynamicDataStoresPayload,
  iGetDynamicDataStoresSuccessResponse,
  iGetGatedContentForClaimPayload,
  iGetOnChainDynamicStoreSuccessResponse,
  iGetOnChainDynamicStoreValueSuccessResponse,
  iGetOnChainDynamicStoreValuesPaginatedPayload,
  iGetOnChainDynamicStoreValuesPaginatedSuccessResponse,
  iGetOnChainDynamicStoresByCreatorSuccessResponse,
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
  iGetSwapActivitiesPayload,
  iGetSwapActivitiesSuccessResponse,
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
  GetTokenMetadataSuccessResponse,
  GetTokensViewForUserSuccessResponse,
  GetTransferActivityForUserSuccessResponse,
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
  iGetTokenMetadataSuccessResponse,
  iGetTokensViewForUserPayload,
  iGetTokensViewForUserSuccessResponse,
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
    typia.assert<iGetStatusPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetStatusRoute(), GetStatusSuccessResponse, payload);
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
    typia.assert<iGetSearchPayload<NumberType>>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.SearchRoute(searchValue), GetSearchSuccessResponse, payload);
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
    typia.assert<iGetBalanceByAddressPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetBalanceByAddressSpecificTokenRoute(collectionId, address, tokenId), GetBalanceByAddressSuccessResponse);
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
    typia.assert<iCompleteClaimPayload>(payload ?? {});
    if (!claimId) {
      throw new Error('claimId is required');
    }
    return this.request('post', BitBadgesApiRoutes.CompleteClaimRoute(claimId, address), CompleteClaimSuccessResponse, payload);
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
    typia.assert<iSimulateClaimPayload>(payload ?? {});
    if (!claimId) {
      throw new Error('claimId is required');
    }
    return this.request('post', BitBadgesApiRoutes.SimulateClaimRoute(claimId, address), SimulateClaimSuccessResponse, payload);
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
    typia.assert<iGetReservedClaimCodesPayload>(payload ?? {});
    if (!claimId) {
      throw new Error('claimId is required');
    }
    return this.request('post', BitBadgesApiRoutes.GetReservedClaimCodesRoute(claimId, address), GetReservedClaimCodesSuccessResponse, payload);
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
    typia.assert<string>(claimAttemptId);
    if (!claimAttemptId) {
      throw new Error('claimAttemptId is required');
    }
    return this.request('post', BitBadgesApiRoutes.GetClaimAttemptStatusRoute(claimAttemptId), GetClaimAttemptStatusSuccessResponse);
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
    typia.assert<iCheckSignInStatusPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.CheckIfSignedInRoute(), CheckSignInStatusSuccessResponse, payload);
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
    return this.request('post', BitBadgesApiRoutes.BroadcastTxRoute(), BroadcastTxSuccessResponse, payload);
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
    return this.request('post', BitBadgesApiRoutes.SimulateTxRoute(), SimulateTxSuccessResponse, payload);
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
    typia.assert<iExchangeSIWBBAuthorizationCodePayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.ExchangeSIWBBAuthorizationCodesRoute(), ExchangeSIWBBAuthorizationCodeSuccessResponse, payload);
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
    typia.assert<iGetSIWBBRequestsForDeveloperAppPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetSIWBBRequestsForDeveloperAppRoute(), GetSIWBBRequestsForDeveloperAppSuccessResponse, payload);
  }

  /**
   * Creates a SIWBB request.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbbRequest`
   * - **SDK Function Call**: `await BitBadgesApi.createSIWBBRequest(payload);`
   */
  public async createSIWBBRequest(payload?: iCreateSIWBBRequestPayload): Promise<CreateSIWBBRequestSuccessResponse> {
    typia.assert<iCreateSIWBBRequestPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.CRUDSIWBBRequestRoute(), CreateSIWBBRequestSuccessResponse, payload);
  }

  /**
   * Rotates a SIWBB request.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbbRequest/rotate`
   * - **SDK Function Call**: `await BitBadgesApi.rotateSIWBBRequest(payload);`
   */
  public async rotateSIWBBRequest(payload: iRotateSIWBBRequestPayload): Promise<RotateSIWBBRequestSuccessResponse> {
    typia.assert<iRotateSIWBBRequestPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.RotateSIWBBRequestRoute(), RotateSIWBBRequestSuccessResponse, payload);
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
    typia.assert<iDeleteSIWBBRequestPayload>(payload ?? {});
    return this.request('delete', BitBadgesApiRoutes.CRUDSIWBBRequestRoute(), DeleteSIWBBRequestSuccessResponse, payload);
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
    typia.assert<iGetMapsPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.GetMapsRoute(), GetMapsSuccessResponse, payload);
  }

  /**
   * Get map by ID
   *
   * @remarks
   * - **API Route**: `GET /api/v0/map/{mapId}`
   * - **SDK Function Call**: `await BitBadgesApi.getMap(payload);`
   */
  public async getMap(mapId: string, payload?: iGetMapPayload): Promise<GetMapSuccessResponse<T>> {
    typia.assert<iGetMapPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetMapRoute(mapId), GetMapSuccessResponse, payload);
  }

  /**
   * Get map values
   *
   * @remarks
   * - **API Route**: `POST /api/v0/mapValues`
   * - **SDK Function Call**: `await BitBadgesApi.getMapValues(payload);`
   */
  public async getMapValues(payload: iGetMapValuesPayload): Promise<GetMapValuesSuccessResponse> {
    typia.assert<iGetMapValuesPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.GetMapValuesRoute(), GetMapValuesSuccessResponse, payload);
  }

  /**
   * Get map value by ID
   *
   * @remarks
   * - **API Route**: `GET /api/v0/mapValue/{mapId}/{key}`
   * - **SDK Function Call**: `await BitBadgesApi.getMapValue(mapId, key);`
   */
  public async getMapValue(mapId: string, key: string): Promise<GetMapValueSuccessResponse> {
    return this.request('get', BitBadgesApiRoutes.GetMapValueRoute(mapId, key), GetMapValueSuccessResponse);
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
    typia.assert<iGetClaimsPayloadV1>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.GetClaimsRoute(), GetClaimsSuccessResponse, payload);
  }

  /**
   * Searches for claims.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/claims/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchClaims(payload);`
   */
  public async searchClaims(payload: iSearchClaimsPayload): Promise<SearchClaimsSuccessResponse<T>> {
    typia.assert<iSearchClaimsPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.SearchClaimsRoute(), SearchClaimsSuccessResponse, payload);
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
    typia.assert<iCreateClaimPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.CRUDClaimsRoute(), CreateClaimSuccessResponse, payload);
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
    typia.assert<iDeleteClaimPayload>(payload ?? {});
    return this.request('delete', BitBadgesApiRoutes.CRUDClaimsRoute(), DeleteClaimSuccessResponse, payload);
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
    typia.assert<iUpdateClaimPayload>(payload ?? {});
    return this.request('put', BitBadgesApiRoutes.CRUDClaimsRoute(), UpdateClaimSuccessResponse, payload);
  }

  /**
   * Revokes an access token for a user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbb/token/revoke`
   * - **SDK Function Call**: `await BitBadgesApi.oauthRevoke(payload);`
   */
  public async revokeOauthAuthorization(payload: iOauthRevokePayload): Promise<OauthRevokeSuccessResponse> {
    typia.assert<iOauthRevokePayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.OauthRevokeRoute(), OauthRevokeSuccessResponse, payload);
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
    typia.assert<iGetGatedContentForClaimPayload>({});
    return this.request('get', BitBadgesApiRoutes.GetGatedContentForClaimRoute(claimId), GetGatedContentForClaimSuccessResponse, payload);
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
    typia.assert<iPerformStoreActionSingleWithBodyAuthPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.PerformStoreActionSingleWithBodyAuthRoute(), PerformStoreActionSuccessResponse, payload);
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
    typia.assert<iPerformStoreActionBatchWithBodyAuthPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.PerformStoreActionBatchWithBodyAuthRoute(), BatchStoreActionSuccessResponse, { ...payload });
  }

  /**
   * Get dynamic data store activity
   *
   * @remarks
   * - **API Route**: `GET /api/v0/dynamicStores/activity`
   * - **SDK Function Call**: `await BitBadgesApi.getDynamicDataActivity(payload);`
   */
  public async getDynamicDataActivity(payload: iGetDynamicDataActivityPayload): Promise<GetDynamicDataActivitySuccessResponse> {
    return this.request('get', BitBadgesApiRoutes.GetDynamicDataStoreActivityRoute(), GetDynamicDataActivitySuccessResponse, payload);
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
    typia.assert<iGetDynamicDataStoresPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.GetDynamicDataStoresRoute(), GetDynamicDataStoresSuccessResponse, payload);
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
    typia.assert<iSearchDynamicDataStoresPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.SearchDynamicDataStoresRoute(), SearchDynamicDataStoresSuccessResponse, payload);
  }

  /**
   * Gets applications.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/applications/fetch`
   * - **SDK Function Call**: `await BitBadgesApi.getApplications(payload);`
   */
  public async getApplications(payload: iGetApplicationsPayload): Promise<GetApplicationsSuccessResponse<T>> {
    typia.assert<iGetApplicationsPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.GetApplicationsRoute(), GetApplicationsSuccessResponse, payload);
  }

  /**
   * Searches for applications.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/applications/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchApplications(payload);`
   */
  public async searchApplications(payload: iSearchApplicationsPayload): Promise<SearchApplicationsSuccessResponse<T>> {
    typia.assert<iSearchApplicationsPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.SearchApplicationsRoute(), SearchApplicationsSuccessResponse, payload);
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
    typia.assert<iCreateApplicationPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.CRUDApplicationsRoute(), CreateApplicationSuccessResponse, payload);
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
    typia.assert<iUpdateApplicationPayload>(payload ?? {});
    return this.request('put', BitBadgesApiRoutes.CRUDApplicationsRoute(), UpdateApplicationSuccessResponse, payload);
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
    typia.assert<iDeleteApplicationPayload>(payload ?? {});
    return this.request('delete', BitBadgesApiRoutes.CRUDApplicationsRoute(), DeleteApplicationSuccessResponse, payload);
  }

  /**
   * Calculates points for a page in an application and caches the result.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/applications/points`
   * - **SDK Function Call**: `await BitBadgesApi.calculatePoints(payload);`
   */
  public async calculatePoints(payload: iCalculatePointsPayload): Promise<CalculatePointsSuccessResponse> {
    return this.request('post', BitBadgesApiRoutes.CalculatePointsRoute(), CalculatePointsSuccessResponse, payload);
  }

  /**
   * Gets points activity for an application.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/applications/points/activity`
   * - **SDK Function Call**: `await BitBadgesApi.getPointsActivity(payload);`
   */
  public async getPointsActivity<T extends NumberType>(payload: iGetPointsActivityPayload): Promise<GetPointsActivitySuccessResponse<T>> {
    typia.assert<iGetPointsActivityPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetPointsActivityRoute(), GetPointsActivitySuccessResponse, payload);
  }

  /**
   * Gets utility pages.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/utilityPages/fetch`
   * - **SDK Function Call**: `await BitBadgesApi.getUtilityPages(payload);`
   */
  public async getUtilityPages(payload: iGetUtilityPagesPayload): Promise<GetUtilityPagesSuccessResponse<T>> {
    return this.request('post', BitBadgesApiRoutes.GetUtilityPagesRoute(), GetUtilityPagesSuccessResponse, payload);
  }

  /**
   * Searches for utility pages.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/utilityPages/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchUtilityPages(payload);`
   */
  public async searchUtilityPages(payload: iSearchUtilityPagesPayload): Promise<SearchUtilityPagesSuccessResponse<T>> {
    return this.request('get', BitBadgesApiRoutes.SearchUtilityPagesRoute(), SearchUtilityPagesSuccessResponse, payload);
  }

  /**
   * Creates a utility page.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/utilityPages`
   * - **SDK Function Call**: `await BitBadgesApi.createUtilityPage(payload);`
   */
  public async createUtilityPage(payload: iCreateUtilityPagePayload<T>): Promise<CreateUtilityPageSuccessResponse<T>> {
    return this.request('post', BitBadgesApiRoutes.CRUDUtilityPagesRoute(), CreateUtilityPageSuccessResponse, payload);
  }

  /**
   * Updates a utility page.
   *
   * @remarks
   * - **API Route**: `PUT /api/v0/utilityPages`
   * - **SDK Function Call**: `await BitBadgesApi.updateUtilityPage(payload);`
   */
  public async updateUtilityPage(payload: iUpdateUtilityPagePayload<T>): Promise<UpdateUtilityPageSuccessResponse<T>> {
    return this.request('put', BitBadgesApiRoutes.CRUDUtilityPagesRoute(), UpdateUtilityPageSuccessResponse, payload);
  }

  /**
   * Deletes a utility page.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/utilityPages`
   * - **SDK Function Call**: `await BitBadgesApi.deleteUtilityPage(payload);`
   */
  public async deleteUtilityPage(payload: iDeleteUtilityPagePayload): Promise<DeleteUtilityPageSuccessResponse> {
    return this.request('delete', BitBadgesApiRoutes.CRUDUtilityPagesRoute(), DeleteUtilityPageSuccessResponse, payload);
  }

  /**
   * Gets claim attempts.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/claims/:claimId/attempts`
   * - **SDK Function Call**: `await BitBadgesApi.getClaimAttempts(claimId, payload);`
   */
  public async getClaimAttempts(claimId: string, payload: iGetClaimAttemptsPayload): Promise<GetClaimAttemptsSuccessResponse<T>> {
    typia.assert<iGetClaimAttemptsPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetClaimAttemptsRoute(claimId), GetClaimAttemptsSuccessResponse, payload);
  }

  /**
   * Checks if a claim has been successfully completed.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/claims/success/:claimId/:address`
   * - **SDK Function Call**: `await BitBadgesApi.checkClaimSuccess(claimId, address);`
   */
  public async checkClaimSuccess(claimId: string, address: NativeAddress): Promise<CheckClaimSuccessSuccessResponse> {
    return this.request('get', BitBadgesApiRoutes.CheckClaimSuccessRoute(claimId, address), CheckClaimSuccessSuccessResponse);
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
    typia.assert<iGetSiwbbRequestsForUserPayload>(payload);
    return this.request('get', BitBadgesApiRoutes.GetSiwbbRequestsForUserRoute(address), GetSiwbbRequestsForUserSuccessResponse, payload);
  }

  /**
   * Gets transfer activity for a specific user.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/account/:address/activity/tokens`
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
    typia.assert<iGetTransferActivityForUserPayload>(payload);
    return this.request('get', BitBadgesApiRoutes.GetTransferActivityForUserRoute(address), GetTransferActivityForUserSuccessResponse, payload);
  }

  /**
   * Gets tokens for a specific user. Specify the viewType to determine what
   * tokens to retrieve.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/account/:address/tokens`
   * - **SDK Function Call**: `await BitBadgesApi.getTokensViewForUser(address, { viewType });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getTokensViewForUser("bb1...", { viewType: "collected" });
   * console.log(res);
   * ```
   * */
  public async getTokensViewForUser(address: NativeAddress, payload: iGetTokensViewForUserPayload): Promise<GetTokensViewForUserSuccessResponse<T>> {
    typia.assert<iGetTokensViewForUserPayload>(payload);
    return this.request('get', BitBadgesApiRoutes.GetTokensByTypeForUserRoute(address), GetTokensViewForUserSuccessResponse, payload);
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
    typia.assert<iGetClaimActivityForUserPayload>(payload);
    return this.request('get', BitBadgesApiRoutes.GetClaimActivityByTypeForUserRoute(address), GetClaimActivityForUserSuccessResponse, payload);
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
    typia.assert<iGetPointsActivityForUserPayload>(payload);
    return this.request('get', BitBadgesApiRoutes.GetPointsActivityForUserRoute(address), GetPointsActivityForUserSuccessResponse, payload);
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
    typia.assert<iGetCollectionOwnersPayload>(payload);
    return this.request('get', BitBadgesApiRoutes.GetCollectionOwnersRoute(collectionId), GetCollectionOwnersSuccessResponse, payload);
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
    return this.request('get', BitBadgesApiRoutes.GetCollectionRoute(collectionId), GetCollectionSuccessResponse, payload);
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
    return this.request('get', BitBadgesApiRoutes.GetTokenMetadataRoute(collectionId, tokenId), GetTokenMetadataSuccessResponse);
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
    typia.assert<iGetCollectionTransferActivityPayload>(payload);
    return this.request('get', BitBadgesApiRoutes.GetCollectionTransferActivityRoute(collectionId), GetCollectionTransferActivitySuccessResponse, payload);
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
    typia.assert<iGetCollectionChallengeTrackersPayload>(payload);
    return this.request('get', BitBadgesApiRoutes.GetCollectionChallengeTrackersRoute(collectionId), GetCollectionChallengeTrackersSuccessResponse, payload);
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
    typia.assert<iGetCollectionAmountTrackersPayload>(payload);
    return this.request('get', BitBadgesApiRoutes.GetCollectionAmountTrackersRoute(collectionId), GetCollectionAmountTrackersSuccessResponse, payload);
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
    typia.assert<iGetCollectionListingsPayload>(payload);
    return this.request('get', BitBadgesApiRoutes.GetCollectionListingsRoute(collectionId), GetCollectionListingsSuccessResponse, payload);
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
    return this.request('get', BitBadgesApiRoutes.GetCollectionClaimsRoute(collectionId), GetCollectionClaimsSuccessResponse);
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
    typia.assert<iGetClaimPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetClaimRoute(claimId), GetClaimSuccessResponse, payload);
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
    typia.assert<iGetApplicationPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetApplicationRoute(applicationId), GetApplicationSuccessResponse, payload);
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
    typia.assert<iGetDynamicDataStorePayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetDynamicDataStoreRoute(dynamicStoreId), GetDynamicDataStoreSuccessResponse, payload);
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
    typia.assert<iGetDynamicDataStoreValuePayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetDynamicDataStoreValueRoute(dynamicStoreId), GetDynamicDataStoreValueSuccessResponse, payload);
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
    typia.assert<iGetDynamicDataStoreValuesPaginatedPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetDynamicDataStoreValuesPaginatedRoute(dynamicStoreId), GetDynamicDataStoreValuesPaginatedSuccessResponse, payload);
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
    typia.assert<iGetPluginPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetPluginRoute(pluginId), GetPluginSuccessResponse, payload);
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
    typia.assert<iGetUtilityPagePayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetUtilityPageRoute(utilityPageId), GetUtilityPageSuccessResponse, payload);
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
    typia.assert<iGetDeveloperAppPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetDeveloperAppRoute(developerAppId), GetDeveloperAppSuccessResponse, payload);
  }

  /**
   * Get all developer apps for a user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/plugins/fetch`
   * - **SDK Function Call**: `await BitBadgesApi.getPlugins(payload);`
   */
  public async getPlugins(payload: iGetPluginsPayload): Promise<GetPluginsSuccessResponse<T>> {
    typia.assert<iGetPluginsPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.GetPluginsRoute(), GetPluginsSuccessResponse, payload);
  }

  /**
   * A generic route for verifying asset ownership requirements. Asset requirements support AND / OR / NOT logic.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/verifyOwnershipRequirements`
   * - **SDK Function Call**: `await BitBadgesApi.verifyOwnershipRequirements(payload);`
   */
  public async verifyOwnershipRequirements(payload: iGenericVerifyAssetsPayload): Promise<GenericVerifyAssetsSuccessResponse> {
    typia.assert<iGenericVerifyAssetsPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.GenericVerifyAssetsRoute(), GenericVerifyAssetsSuccessResponse, payload);
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
    typia.assert<iCreateDeveloperAppPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.CRUDDeveloperAppRoute(), CreateDeveloperAppSuccessResponse, payload);
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
    typia.assert<iDeleteDeveloperAppPayload>(payload ?? {});
    return this.request('delete', BitBadgesApiRoutes.CRUDDeveloperAppRoute(), DeleteDeveloperAppSuccessResponse, payload);
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
    typia.assert<iUpdateDeveloperAppPayload>(payload ?? {});
    return this.request('put', BitBadgesApiRoutes.CRUDDeveloperAppRoute(), UpdateDeveloperAppSuccessResponse, payload);
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
    typia.assert<iCreateDynamicDataStorePayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.CRUDDynamicDataStoreRoute(), CreateDynamicDataStoreSuccessResponse, payload);
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
    typia.assert<iUpdateDynamicDataStorePayload>(payload ?? {});
    return this.request('put', BitBadgesApiRoutes.CRUDDynamicDataStoreRoute(), UpdateDynamicDataStoreSuccessResponse, payload);
  }

  /**
   * Deletes a dynamic data bin.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/dynamicStores`
   * - **SDK Function Call**: `await BitBadgesApi.deleteDynamicDataStore(payload);`
   */
  public async deleteDynamicDataStore(payload: iDeleteDynamicDataStorePayload): Promise<DeleteDynamicDataStoreSuccessResponse> {
    typia.assert<iDeleteDynamicDataStorePayload>(payload ?? {});
    return this.request('delete', BitBadgesApiRoutes.CRUDDynamicDataStoreRoute(), DeleteDynamicDataStoreSuccessResponse, payload);
  }

  /**
   * Get all developer apps for a user.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/developerApps`
   * - **SDK Function Call**: `await BitBadgesApi.getDeveloperApp(payload);`
   */
  public async getDeveloperApps(payload: iGetDeveloperAppsPayload): Promise<GetDeveloperAppsSuccessResponse<T>> {
    typia.assert<iGetDeveloperAppsPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.GetDeveloperAppsRoute(), GetDeveloperAppsSuccessResponse, payload);
  }

  /**
   * Searches for developer apps.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/developerApps/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchDeveloperApps(payload);`
   */
  public async searchDeveloperApps(payload: iSearchDeveloperAppsPayload): Promise<SearchDeveloperAppsSuccessResponse<T>> {
    typia.assert<iSearchDeveloperAppsPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.SearchDeveloperAppsRoute(), SearchDeveloperAppsSuccessResponse, payload);
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
    return this.request('get', BitBadgesApiRoutes.GetCollectionAmountTrackerByIdRoute(), GetCollectionAmountTrackerByIdSuccessResponse, trackerDetails);
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
    return this.request('get', BitBadgesApiRoutes.GetCollectionChallengeTrackerByIdRoute(), GetCollectionChallengeTrackerByIdSuccessResponse, trackerDetails);
  }

  /**
   * Get Swap Activities
   *
   * @remarks
   * - **API Route**: `GET /api/v0/swapActivities`
   * - **SDK Function Call**: `await BitBadgesApi.getSwapActivities({ bookmark: '', limit: 25 });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getSwapActivities({ bookmark: '', limit: 25 });
   * console.log(res);
   * ```
   */
  public async getSwapActivities(payload?: iGetSwapActivitiesPayload): Promise<GetSwapActivitiesSuccessResponse<T>> {
    typia.assert<iGetSwapActivitiesPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetSwapActivitiesRoute(), GetSwapActivitiesSuccessResponse, payload);
  }

  /**
   * Get On-Chain Dynamic Store by ID
   *
   * @remarks
   * - **API Route**: `GET /api/v0/onChainDynamicStore/:storeId`
   * - **SDK Function Call**: `await BitBadgesApi.getOnChainDynamicStore(storeId);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getOnChainDynamicStore(storeId);
   * console.log(res);
   * ```
   */
  public async getOnChainDynamicStore(storeId: string): Promise<GetOnChainDynamicStoreSuccessResponse<T>> {
    return this.request('get', BitBadgesApiRoutes.GetOnChainDynamicStoreRoute(storeId), GetOnChainDynamicStoreSuccessResponse);
  }

  /**
   * Get On-Chain Dynamic Stores by Creator
   *
   * @remarks
   * - **API Route**: `GET /api/v0/onChainDynamicStores/by-creator/:address`
   * - **SDK Function Call**: `await BitBadgesApi.getOnChainDynamicStoresByCreator(address);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getOnChainDynamicStoresByCreator(address);
   * console.log(res);
   * ```
   */
  public async getOnChainDynamicStoresByCreator(address: NativeAddress): Promise<GetOnChainDynamicStoresByCreatorSuccessResponse<T>> {
    return this.request('get', BitBadgesApiRoutes.GetOnChainDynamicStoresByCreatorRoute(address), GetOnChainDynamicStoresByCreatorSuccessResponse);
  }

  /**
   * Get On-Chain Dynamic Store Value
   *
   * @remarks
   * - **API Route**: `GET /api/v0/onChainDynamicStore/:storeId/value/:address`
   * - **SDK Function Call**: `await BitBadgesApi.getOnChainDynamicStoreValue(storeId, address);`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getOnChainDynamicStoreValue(storeId, address);
   * console.log(res);
   * ```
   */
  public async getOnChainDynamicStoreValue(storeId: string, address: NativeAddress): Promise<GetOnChainDynamicStoreValueSuccessResponse<T>> {
    return this.request('get', BitBadgesApiRoutes.GetOnChainDynamicStoreValueRoute(storeId, address), GetOnChainDynamicStoreValueSuccessResponse);
  }

  /**
   * Get On-Chain Dynamic Store Values (Paginated)
   *
   * @remarks
   * - **API Route**: `GET /api/v0/onChainDynamicStore/:storeId/values`
   * - **SDK Function Call**: `await BitBadgesApi.getOnChainDynamicStoreValuesPaginated(storeId, { bookmark: '', limit: 25 });`
   *
   * @example
   * ```typescript
   * const res = await BitBadgesApi.getOnChainDynamicStoreValuesPaginated(storeId, {
   *   bookmark: '',
   *   limit: 25
   * });
   * console.log(res);
   * ```
   */
  public async getOnChainDynamicStoreValuesPaginated(
    storeId: string,
    payload?: iGetOnChainDynamicStoreValuesPaginatedPayload
  ): Promise<GetOnChainDynamicStoreValuesPaginatedSuccessResponse<T>> {
    typia.assert<iGetOnChainDynamicStoreValuesPaginatedPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetOnChainDynamicStoreValuesPaginatedRoute(storeId), GetOnChainDynamicStoreValuesPaginatedSuccessResponse, payload);
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
    typia.assert<iGetActiveAuthorizationsPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetActiveAuthorizationsRoute(), GetActiveAuthorizationsSuccessResponse, payload);
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
    typia.assert<iCreatePluginPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.CRUDPluginRoute(), CreatePluginSuccessResponse, payload);
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
    typia.assert<iUpdatePluginPayload>(payload ?? {});
    return this.request('put', BitBadgesApiRoutes.CRUDPluginRoute(), UpdatePluginSuccessResponse, payload);
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
    typia.assert<iDeletePluginPayload>(payload ?? {});
    return this.request('delete', BitBadgesApiRoutes.CRUDPluginRoute(), DeletePluginSuccessResponse, payload);
  }

  /**
   * Searches for plugins.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/plugins/search`
   * - **SDK Function Call**: `await BitBadgesApi.searchPlugins(payload);`
   */
  public async searchPlugins(payload: iSearchPluginsPayload): Promise<SearchPluginsSuccessResponse<T>> {
    typia.assert<iSearchPluginsPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.SearchPluginsRoute(), SearchPluginsSuccessResponse, payload);
  }

  /**
   * Fetches all plugins created/managed by a specific address.
   * If authenticated as the creator, sensitive data (pluginSecret) is included.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/plugins/creator`
   * - **SDK Function Call**: `await BitBadgesApi.getCreatorPlugins(payload);`
   */
  public async getCreatorPlugins(payload: iGetCreatorPluginsPayload): Promise<GetPluginsSuccessResponse<T>> {
    typia.assert<iGetCreatorPluginsPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetCreatorPluginsRoute(), GetPluginsSuccessResponse, payload);
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
    typia.assert<iFetchMetadataDirectlyPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.FetchMetadataDirectlyRoute(), FetchMetadataDirectlySuccessResponse, payload);
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
    typia.assert<iGetTokensFromFaucetPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.GetTokensFromFaucetRoute(), GetTokensFromFaucetSuccessResponse, payload);
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
    typia.assert<iAddToIpfsPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.AddToIpfsRoute(), AddToIpfsSuccessResponse, payload);
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
    typia.assert<iAddApprovalDetailsToOffChainStoragePayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.AddApprovalDetailsToOffChainStorageRoute(), AddApprovalDetailsToOffChainStorageSuccessResponse, payload);
  }

  /**
   * Creates a payment intent for the user to pay.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/createPaymentIntent`
   * - **SDK Function Call**: `await BitBadgesApi.createPaymentIntent(payload);`
   */
  public async createPaymentIntent(payload: iCreatePaymentIntentPayload): Promise<CreatePaymentIntentSuccessResponse> {
    return this.request('post', BitBadgesApiRoutes.CreatePaymentIntentRoute(), CreatePaymentIntentSuccessResponse, payload);
  }

  /**
   * Gets the API keys.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/apiKeys/fetch`
   * - **SDK Function Call**: `await BitBadgesApi.getApiKeys();`
   */
  public async getApiKeys(payload: iGetApiKeysPayload): Promise<GetApiKeysSuccessResponse> {
    return this.request('post', BitBadgesApiRoutes.GetApiKeysRoute(), GetApiKeysSuccessResponse, payload);
  }

  /**
   * Creates an API key.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/apiKeys`
   * - **SDK Function Call**: `await BitBadgesApi.createApiKey(payload);`
   */
  public async createApiKey(payload: iCreateApiKeyPayload): Promise<CreateApiKeySuccessResponse> {
    return this.request('post', BitBadgesApiRoutes.CRUDApiKeysRoute(), CreateApiKeySuccessResponse, payload);
  }

  /**
   * Rotates an API key.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/apiKeys/rotate`
   * - **SDK Function Call**: `await BitBadgesApi.rotateApiKey(payload);`
   */
  public async rotateApiKey(payload: iRotateApiKeyPayload): Promise<RotateApiKeySuccessResponse> {
    return this.request('post', BitBadgesApiRoutes.RotateApiKeyRoute(), RotateApiKeySuccessResponse, payload);
  }

  /**
   * Deletes an API key.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/apiKeys`
   * - **SDK Function Call**: `await BitBadgesApi.deleteApiKey(payload);`
   */
  public async deleteApiKey(payload: iDeleteApiKeyPayload): Promise<DeleteApiKeySuccessResponse> {
    return this.request('delete', BitBadgesApiRoutes.CRUDApiKeysRoute(), DeleteApiKeySuccessResponse, payload);
  }

  public async getPluginErrors(payload: iGetPluginErrorsPayload): Promise<GetPluginErrorsSuccessResponse> {
    typia.assert<iGetPluginErrorsPayload>(payload ?? {});
    return this.request('get', BitBadgesApiRoutes.GetPluginErrorsRoute(), GetPluginErrorsSuccessResponse, payload);
  }

  public async scheduleTokenRefresh(payload: iScheduleTokenRefreshPayload): Promise<ScheduleTokenRefreshSuccessResponse> {
    return this.request('post', BitBadgesApiRoutes.ScheduleTokenRefreshRoute(), ScheduleTokenRefreshSuccessResponse, payload);
  }

  /**
   * Gets all connected Stripe accounts.
   *
   * @remarks
   * - **API Route**: `GET /api/v0/stripe/connected-accounts`
   * - **SDK Function Call**: `await BitBadgesApi.getConnectedAccounts();`
   */
  public async getConnectedAccounts(): Promise<GetConnectedAccountsSuccessResponse> {
    return this.request('get', BitBadgesApiRoutes.GetConnectedAccountsRoute(), GetConnectedAccountsSuccessResponse);
  }

  /**
   * Deletes a connected Stripe account.
   *
   * @remarks
   * - **API Route**: `DELETE /api/v0/stripe/connected-accounts/:accountId`
   * - **SDK Function Call**: `await BitBadgesApi.deleteConnectedAccount(accountId);`
   */
  public async deleteConnectedAccount(accountId: string): Promise<DeleteConnectedAccountSuccessResponse> {
    return this.request('delete', BitBadgesApiRoutes.DeleteConnectedAccountRoute(accountId), DeleteConnectedAccountSuccessResponse);
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
    typia.assert<iGetSignInChallengePayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.GetSignInChallengeRoute(), GetSignInChallengeSuccessResponse, payload);
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
    typia.assert<iVerifySignInPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.VerifySignInRoute(), VerifySignInSuccessResponse, payload);
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
    typia.assert<iSignOutPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.SignOutRoute(), SignOutSuccessResponse, payload);
  }

  /**
   * Gets the filter suggestions based on attributes in a collection.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/collection/:collectionId/filterSuggestions`
   * - **SDK Function Call**: `await BitBadgesApi.filterSuggestions(collectionId, payload);`
   */
  public async filterSuggestions(collectionId: CollectionId, payload?: iFilterSuggestionsPayload): Promise<FilterSuggestionsSuccessResponse> {
    typia.assert<iFilterSuggestionsPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.FilterSuggestionsRoute(collectionId), FilterSuggestionsSuccessResponse, payload);
  }

  /**
   * Gets details for a browse / explore page.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/browse`
   * - **SDK Function Call**: `await BitBadgesApi.GetBrowse(payload);`
   */
  public async getBrowse(payload: iGetBrowsePayload): Promise<GetBrowseSuccessResponse<T>> {
    typia.assert<iGetBrowsePayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.GetBrowseRoute(), GetBrowseSuccessResponse, payload);
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
    typia.assert<iUpdateAccountInfoPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.UpdateAccountInfoRoute(), UpdateAccountInfoSuccessResponse, payload);
  }

  /**
   * A generic route for verifying SIWBB requests. Used as a helper if implementing on your own.
   *
   * @remarks
   * - **API Route**: `POST /api/v0/siwbbRequest/verify`
   * - **SDK Function Call**: `await BitBadgesApi.verifySIWBBRequest(payload);`
   */
  public async verifySIWBBRequest(payload: iGenericBlockinVerifyPayload): Promise<GenericBlockinVerifySuccessResponse> {
    typia.assert<iGenericBlockinVerifyPayload>(payload ?? {});
    return this.request('post', BitBadgesApiRoutes.GenericVerifyRoute(), GenericBlockinVerifySuccessResponse, payload);
  }
}

export default BitBadgesAPI;
