import type { CustomType } from '@/common/base';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, getConverterFunction } from '@/common/base';
import type { NumberType } from '@/common/string-numbers';
import { AddressList } from '@/core/addressLists';
import type { BatchBadgeDetails, iBatchBadgeDetails } from '@/core/batch-utils';
import { CosmosCoin } from '@/core/coin';
import type { iAddressList } from '@/interfaces/badges/core';
import { SupportedChain } from '../common/types';
import type { iBitBadgesAddressList } from './BitBadgesAddressList';
import { BitBadgesAddressList } from './BitBadgesAddressList';
import { BitBadgesCollection } from './BitBadgesCollection';
import type { BaseBitBadgesApi, ErrorResponse, PaginationInfo } from './base';
import { ClaimAlertDoc, ListActivityDoc, ReviewDoc, TransferActivityDoc } from './docs/activity';
import {
  ApprovalTrackerDoc,
  BalanceDocWithDetails,
  BlockinAuthSignatureDoc,
  FollowDetailsDoc,
  MapDoc,
  MerkleChallengeDoc,
  ProfileDoc,
  SecretDoc
} from './docs/docs';
import type {
  iAccountDoc,
  iApprovalTrackerDoc,
  iBalanceDocWithDetails,
  iBlockinAuthSignatureDoc,
  iClaimAlertDoc,
  iFollowDetailsDoc,
  iListActivityDoc,
  iMapDoc,
  iMerkleChallengeDoc,
  iProfileDoc,
  iReviewDoc,
  iSecretDoc,
  iTransferActivityDoc
} from './docs/interfaces';
import { BitBadgesApiRoutes } from './requests/routes';
import { CosmosAddress, NativeAddress } from '@/combined';

/**
 * @category Interfaces
 */
export interface iBitBadgesUserInfo<T extends NumberType> extends iProfileDoc<T>, iAccountDoc<T> {
  /** The resolved name of the account (e.g. ENS name). */
  resolvedName?: string;
  /** The avatar of the account. */
  avatar?: string;
  /** The Solana address of the account. */
  solAddress: string;
  /** The chain of the account. */
  chain: SupportedChain;
  /** Indicates whether the account has claimed their airdrop. */
  airdropped?: boolean;
  /** A list of badges that the account has collected. Paginated and fetched as needed. To be used in conjunction with views. */
  collected: iBalanceDocWithDetails<T>[];
  /** A list of transfer activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  activity: iTransferActivityDoc<T>[];
  /** A list of list activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  listsActivity: iListActivityDoc<T>[];
  /** A list of review activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  reviews: iReviewDoc<T>[];
  /** A list of merkle challenge activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  merkleChallenges: iMerkleChallengeDoc<T>[];
  /** A list of approvals tracker activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  approvalTrackers: iApprovalTrackerDoc<T>[];
  /** A list of address lists for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  addressLists: iBitBadgesAddressList<T>[];
  /** A list of claim alerts for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  claimAlerts: iClaimAlertDoc<T>[];
  /** A list of auth codes for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  authCodes: iBlockinAuthSignatureDoc<T>[];
  /** A list of user secrets for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  secrets: iSecretDoc<T>[];

  /** The reserved map for the account. This is created and managed on-chain through the x/maps module. */
  reservedMap?: iMapDoc<T>;

  /** The native address of the account */
  address: NativeAddress;

  /** Indicates whether the account is NSFW. */
  nsfw?: { [badgeId: string]: string };
  /** Indicates whether the account has been reported. */
  reported?: { [badgeId: string]: string };

  /** The views for this collection and their pagination Doc. Views will only include the doc _ids. Use the pagination to fetch more. To be used in conjunction with activity, announcements, reviews, owners, merkleChallenges, and approvalTrackers. For example, if you want to fetch the activity for a view, you would use the view's pagination to fetch the doc _ids, then use the corresponding activity array to find the matching docs. */
  views: {
    [viewId: string]:
      | {
          ids: string[];
          type: string;
          pagination: PaginationInfo;
        }
      | undefined;
  };

  /** The alias for the account. */
  alias?: {
    collectionId?: T;
    listId?: string;
  };
}

/**
 * BitBadgesUserInfo is the type for accounts returned by the BitBadges API. It includes all Docrmation about an account.
 * @remarks
 * Note that returned user Docs will only fetch what is requested. It is your responsibility to join the data together (paginations, etc).
 * See documentation for helper functions, examples, and tutorials on handling this data and paginations.
 *
 * @category Accounts
 */
export class BitBadgesUserInfo<T extends NumberType> extends ProfileDoc<T> implements iBitBadgesUserInfo<T>, CustomType<BitBadgesUserInfo<T>> {
  //TODO: Can we get rid of the AccountDoc stuff too?
  cosmosAddress: CosmosAddress;
  ethAddress: string;
  btcAddress: string;
  solAddress: string;
  accountNumber: T;
  sequence?: T;
  balance?: CosmosCoin<T>;
  pubKeyType: string;
  publicKey: string;

  resolvedName?: string;
  avatar?: string;
  chain: SupportedChain;
  airdropped?: boolean;
  collected: BalanceDocWithDetails<T>[];
  activity: TransferActivityDoc<T>[];
  listsActivity: ListActivityDoc<T>[];
  reviews: ReviewDoc<T>[];
  merkleChallenges: MerkleChallengeDoc<T>[];
  approvalTrackers: ApprovalTrackerDoc<T>[];
  addressLists: BitBadgesAddressList<T>[];
  claimAlerts: ClaimAlertDoc<T>[];
  authCodes: BlockinAuthSignatureDoc<T>[];
  secrets: iSecretDoc<T>[];

  address: NativeAddress;
  nsfw?: { [badgeId: string]: string };
  reported?: { [badgeId: string]: string };
  views: {
    [viewId: string]:
      | {
          ids: string[];
          type: string;
          pagination: PaginationInfo;
        }
      | undefined;
  };
  alias?: {
    collectionId?: T;
    listId?: string;
  };
  reservedMap?: MapDoc<T> | undefined;

  constructor(data: iBitBadgesUserInfo<T>) {
    super(data);
    this.cosmosAddress = data.cosmosAddress;
    this.ethAddress = data.ethAddress;
    this.btcAddress = data.btcAddress;
    this.solAddress = data.solAddress;
    this.accountNumber = data.accountNumber;
    this.sequence = data.sequence;
    this.balance = data.balance ? new CosmosCoin(data.balance) : undefined;
    this.pubKeyType = data.pubKeyType;
    this.publicKey = data.publicKey;
    this.resolvedName = data.resolvedName;
    this.avatar = data.avatar;
    this.chain = data.chain;
    this.airdropped = data.airdropped;
    this.collected = data.collected.map((balance) => new BalanceDocWithDetails(balance));
    this.activity = data.activity.map((activity) => new TransferActivityDoc(activity));
    this.listsActivity = data.listsActivity.map((activity) => new ListActivityDoc(activity));
    this.reviews = data.reviews.map((review) => new ReviewDoc(review));
    this.merkleChallenges = data.merkleChallenges.map((challenge) => new MerkleChallengeDoc(challenge));
    this.approvalTrackers = data.approvalTrackers.map((tracker) => new ApprovalTrackerDoc(tracker));
    this.addressLists = data.addressLists.map((list) => new BitBadgesAddressList(list));
    this.claimAlerts = data.claimAlerts.map((alert) => new ClaimAlertDoc(alert));
    this.authCodes = data.authCodes.map((auth) => new BlockinAuthSignatureDoc(auth));
    this.secrets = data.secrets.map((secret) => new SecretDoc(secret));
    this.address = data.address;
    this.nsfw = data.nsfw;
    this.reported = data.reported;
    this.views = data.views;
    this.alias = data.alias;
    this.reservedMap = data.reservedMap ? new MapDoc(data.reservedMap) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): BitBadgesUserInfo<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as BitBadgesUserInfo<U>;
  }

  clone(): BitBadgesUserInfo<T> {
    return super.clone() as BitBadgesUserInfo<T>;
  }

  getNumberFieldNames(): string[] {
    return ['accountNumber', 'sequence'];
  }

  /**
   * Fetches the user's information from the API and initializes a new BitBadgesUserInfo object.
   */
  static async FetchAndInitialize<T extends NumberType>(api: BaseBitBadgesApi<T>, options: AccountFetchDetails) {
    const collection = await BitBadgesUserInfo.GetAccounts(api, { accountsToFetch: [options] });
    return new BitBadgesUserInfo(collection.accounts[0]);
  }

  /**
   * Fetches users' information from the API and initializes a new BitBadgesUserInfo object for each.
   */
  static async FetchAndInitializeBatch<T extends NumberType>(api: BaseBitBadgesApi<T>, options: AccountFetchDetails[]) {
    const collection = await BitBadgesUserInfo.GetAccounts(api, { accountsToFetch: options });
    return collection.accounts.map((account) => new BitBadgesUserInfo(account));
  }

  /**
   * Gets accounts by address or username from the API.
   */
  static async GetAccounts<T extends NumberType>(api: BaseBitBadgesApi<T>, requestBody: GetAccountsRouteRequestBody) {
    try {
      const response = await api.axios.post<iGetAccountsRouteSuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetAccountsRoute()}`,
        requestBody
      );
      return new GetAccountsRouteSuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  private getBalanceInfo(collectionId: T, throwIfNotFound?: boolean) {
    const balance = this.collected.find((x) => x.collectionId === collectionId);
    if (!balance && throwIfNotFound) throw new Error('Balance not found');

    return balance;
  }

  /**
   * Gets the badge balance doc for a user by address.
   *
   * This returns the cached data if it exists. If you want to fetch, use fetchBadgeBalances.
   *
   * @example
   * ```ts
   * const res = user.getBadgeBalanceInfo(123n);
   * console.log(res.balances);
   * ```
   */
  getBadgeBalanceInfo(collectionId: T) {
    return this.getBalanceInfo(collectionId);
  }

  /**
   * Wrapper for {@link getBadgeBalanceInfo} that throws if not fetched yet.
   *
   * @example
   * ```ts
   * const res = user.mustGetBadgeBalanceInfo(123n);
   * console.log(res.balances);
   * ```
   */
  mustGetBadgeBalanceInfo(collectionId: T) {
    const balance = this.getBalanceInfo(collectionId, true);
    return balance as BalanceDocWithDetails<T>;
  }

  /**
   * Gets the badge balances for a user by address. Throws if not fetched yet. To fetch, use fetchBadgeBalances.
   *
   * Wrapper for {@link getBadgeBalances} that throws if not fetched yet.
   *
   * @example
   * ```ts
   * const res = user.mustGetBadgeBalances(123n);
   * console.log(res); // [{ ... }] Balances
   */
  mustGetBadgeBalances(collectionId: T) {
    return this.mustGetBadgeBalanceInfo(collectionId).balances;
  }

  /**
   * Fetch badge balances for a collection and updates the user's collected array. Must pass in a valid API instance.
   *
   * @example
   * ```ts
   * const res = await user.fetchBadgeBalances(api, 123n);
   * console.log(res.balances);
   * ```
   */
  getBadgeBalances(collectionId: T) {
    return this.getBadgeBalanceInfo(collectionId)?.balances;
  }

  /**
   * Fetch badge balances for a collection and updates the user's collected array. Must pass in a valid API instance.
   * If forceful is true, it will fetch regardless of if it is already fetched. Else, it will only fetch if it is not already cached.
   */
  async fetchBadgeBalances(api: BaseBitBadgesApi<T>, collectionId: T, forceful?: boolean) {
    const currOwnerInfo = this.collected.find((x) => x.collectionId === collectionId);
    if (currOwnerInfo && !forceful) return currOwnerInfo;

    const newOwnerInfo = await BitBadgesCollection.GetBadgeBalanceByAddress(api, collectionId, this.address);
    if (currOwnerInfo) {
      Object.assign(currOwnerInfo, newOwnerInfo);
      return currOwnerInfo;
    } else {
      this.collected.push(newOwnerInfo);
    }
    return newOwnerInfo;
  }

  /**
   * Returns if a get account request body is redundant for this user (meaning we have everything already).
   */
  isRedundantRequest(options: Omit<AccountFetchDetails, 'address' | 'username'>) {
    //Do not fetch views where hasMore is false (i.e. we alreay have everything)
    options = this.pruneRequestBody(options);

    //Check if we need to fetch anything at all
    const needToFetch =
      (options.fetchSequence && (this.sequence === undefined || BigInt(this.sequence) < 0)) ||
      (options.fetchBalance && this.balance === undefined) ||
      options.viewsToFetch?.length ||
      !this.fetchedProfile;

    if (needToFetch) {
      return false;
    }

    return true;
  }

  /**
   * Prunes the request body to remove any redundant fetches.
   */
  pruneRequestBody(options: Omit<AccountFetchDetails, 'address' | 'username'>) {
    const viewsToFetch = options.viewsToFetch?.filter((x) => this.viewHasMore(x.viewId));
    return {
      ...options,
      address: this.address,
      fetchSequence: options.fetchSequence && (this.sequence === undefined || BigInt(this.sequence) < 0),
      fetchBalance: options.fetchBalance && this.balance === undefined,
      viewsToFetch
    } as AccountFetchDetails;
  }

  /**
   * Fetch the user's information via an API request and updates the current BitBadgesUserInfo object.
   * This will handle all paginations, etc. behind the scenes.
   */
  async fetchAndUpdate(api: BaseBitBadgesApi<T>, options: Omit<AccountFetchDetails, 'address' | 'username'>, forceful?: boolean) {
    if (!forceful) {
      if (this.isRedundantRequest(options)) return;
      options = this.pruneRequestBody(options);
    }

    const account = await BitBadgesUserInfo.GetAccounts(api, {
      accountsToFetch: [{ ...options, address: this.address }]
    }).then((x) => x.accounts[0]);
    this.updateWithNewResponse(account, forceful);
  }

  /**
   * Logic for updating the current BitBadgesUserInfo object with a new API response. If forceful is true, it will overwrite everything.
   */
  updateWithNewResponse(newResponse: BitBadgesUserInfo<T>, forceful?: boolean) {
    if (forceful) {
      const newCollectionInfo = new BitBadgesUserInfo(newResponse);
      Object.assign(this, newCollectionInfo);
      return;
    } else {
      const newCollectionInfo = updateAccountWithResponse(this, newResponse);
      Object.assign(this, newCollectionInfo);
      return;
    }
  }

  viewHasMore(viewId: string) {
    return this.views[viewId]?.pagination?.hasMore ?? true;
  }

  getViewPagination(viewId: string) {
    return this.views[viewId]?.pagination;
  }

  getViewBookmark(viewId: string) {
    return this.views[viewId]?.pagination?.bookmark;
  }

  /**
   * Fetches the next page of a view for a user. If view has no more items, it will do nothing.
   */
  async fetchNextForView(
    api: BaseBitBadgesApi<T>,
    viewType: AccountViewKey,
    viewId: string,
    specificCollections?: BatchBadgeDetails<NumberType>[],
    specificLists?: string[],
    oldestFirst?: boolean
  ) {
    if (!this.viewHasMore(viewId)) return;

    await this.fetchAndUpdate(api, {
      viewsToFetch: [
        {
          viewId: viewId,
          specificLists,
          viewType,
          specificCollections,
          bookmark: this.views[viewId]?.pagination?.bookmark || '',
          oldestFirst
        }
      ]
    });
  }

  /**
   * Fetches until the view has no more items. 1 second delay between each fetch for rate limiting.
   */
  async fetchAllForView(api: BaseBitBadgesApi<T>, viewType: AccountViewKey, viewId: string) {
    while (this.viewHasMore(viewId)) {
      await this.fetchNextForView(api, viewType, viewId);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  /**
   * Type agnostic get view function. Uses the viewType to determine the type of view to fetch and docs to return.
   */
  getView<KeyType extends AccountViewKey>(viewType: KeyType, viewId: string): AccountViewData<T>[KeyType] {
    switch (viewType) {
      case 'createdLists':
        return this.getAccountAddressListsView(viewId) as AccountViewData<T>[KeyType];
      case 'privateLists':
        return this.getAccountAddressListsView(viewId) as AccountViewData<T>[KeyType];
      case 'authCodes':
        return this.getAuthCodesView(viewId) as AccountViewData<T>[KeyType];
      case 'transferActivity':
        return this.getAccountActivityView(viewId) as AccountViewData<T>[KeyType];
      case 'reviews':
        return this.getAccountReviewsView(viewId) as AccountViewData<T>[KeyType];
      case 'badgesCollected':
        return this.getAccountBalancesView(viewId) as AccountViewData<T>[KeyType];
      case 'sentClaimAlerts':
        return this.getAccountClaimAlertsView(viewId) as AccountViewData<T>[KeyType];
      case 'claimAlerts':
        return this.getAccountClaimAlertsView(viewId) as AccountViewData<T>[KeyType];
      case 'allLists':
        return this.getAccountAddressListsView(viewId) as AccountViewData<T>[KeyType];
      case 'whitelists':
        return this.getAccountAddressListsView(viewId) as AccountViewData<T>[KeyType];
      case 'blacklists':
        return this.getAccountAddressListsView(viewId) as AccountViewData<T>[KeyType];
      case 'createdBadges':
        return this.getAccountBalancesView(viewId) as AccountViewData<T>[KeyType];
      case 'managingBadges':
        return this.getAccountBalancesView(viewId) as AccountViewData<T>[KeyType];
      case 'listsActivity':
        return this.getAccountListsActivityView(viewId) as AccountViewData<T>[KeyType];
      case 'createdSecrets':
        return this.getSecretsView(viewId) as AccountViewData<T>[KeyType];
      case 'receivedSecrets':
        return this.getSecretsView(viewId) as AccountViewData<T>[KeyType];
      default:
        throw new Error('Invalid view type');
    }
  }

  getSecretsView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.secrets.find((y) => y._docId === x);
    }) ?? []) as SecretDoc<T>[];
  }

  getAuthCodesView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.authCodes.find((y) => y._docId === x);
    }) ?? []) as BlockinAuthSignatureDoc<T>[];
  }

  getAccountActivityView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.activity.find((y) => y._docId === x);
    }) ?? []) as TransferActivityDoc<T>[];
  }

  getAccountListsActivityView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.listsActivity.find((y) => y._docId === x);
    }) ?? []) as ListActivityDoc<T>[];
  }

  getAccountReviewsView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.reviews.find((y) => y._docId === x);
    }) ?? []) as ReviewDoc<T>[];
  }

  getAccountBalancesView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.collected.find((y) => y._docId === x);
    }) ?? []) as BalanceDocWithDetails<T>[];
  }

  getAccountAddressListsView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.addressLists.find((y) => y.listId === x);
    }) ?? []) as BitBadgesAddressList<T>[];
  }

  getAccountClaimAlertsView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.claimAlerts.find((y) => y._docId === x);
    }) ?? []) as ClaimAlertDoc<T>[];
  }

  /**
   * Fetches the BitBadges follow protocol details for a user.
   */
  async fetchFollowDetails<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    body: Omit<GetFollowDetailsRouteRequestBody, 'address' | 'cosmosAddress'>
  ): Promise<FollowDetailsDoc<T>> {
    return await BitBadgesUserInfo.GetFollowDetails(api, { ...body, cosmosAddress: this.cosmosAddress });
  }

  static async GetFollowDetails<T extends NumberType>(api: BaseBitBadgesApi<T>, body: GetFollowDetailsRouteRequestBody) {
    try {
      const response = await api.axios.post<iGetFollowDetailsRouteSuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetFollowDetailsRoute()}`,
        body
      );
      return new GetFollowDetailsRouteSuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Checks if this user is on a given address list.
   */
  onList(addressList: iAddressList) {
    return new AddressList(addressList).checkAddress(this.address);
  }

  /**
   * Returns a BitBadgesUserInfo object with all fields set for the Mint address.
   *
   * @remarks
   * By default, it uses <bigint> type for all number fields, but you can convert with the `.convert` method.
   */
  static MintAccount() {
    return new BitBadgesUserInfo<bigint>({
      cosmosAddress: 'Mint',
      ethAddress: 'Mint',
      solAddress: 'Mint',
      btcAddress: 'Mint',
      address: 'Mint',
      chain: SupportedChain.COSMOS,
      pubKeyType: 'secp256k1',
      publicKey: '',
      accountNumber: -1n,
      sequence: 0n,
      collected: [],
      activity: [],
      listsActivity: [],
      secrets: [],
      reviews: [],
      addressLists: [],
      claimAlerts: [],
      merkleChallenges: [],
      approvalTrackers: [],
      authCodes: [],
      seenActivity: 0n,
      createdAt: 0n,
      views: {},
      _docId: 'Mint'
    });
  }

  /**
   * Returns a BitBadgesUserInfo object with all fields set to blank.
   *
   * @remarks
   * By default, it uses <bigint> type for all number fields, but you can convert with the `.convert` method.
   */
  static BlankUserInfo() {
    return new BitBadgesUserInfo<bigint>({
      _docId: '',
      cosmosAddress: '',
      ethAddress: '',
      solAddress: '',
      btcAddress: '',
      address: '',
      chain: SupportedChain.UNKNOWN,
      pubKeyType: '',
      publicKey: '',
      sequence: 0n,
      accountNumber: -1n,
      collected: [],
      activity: [],
      secrets: [],
      claimAlerts: [],
      reviews: [],
      merkleChallenges: [],
      approvalTrackers: [],
      addressLists: [],
      listsActivity: [],
      authCodes: [],
      seenActivity: 0n,
      createdAt: 0n,
      views: {}
    });
  }

  //TODO: A little weird bc it is by collected doc not on base
  // validatePermissionsUpdate(newPermissions: UserPermissionsWithDetails<T>): Error | null {
  //   const result = validatePermissionsUpdate(this.convert(BigIntify).collectionPermissions, newPermissions.convert(BigIntify));
  //   return result;
  // }

  // validatePermissionUpdate(permissionName: PermissionNameString, newPermissions: any[]): Error | null {
  //   const { validatePermissionUpdateFunction } = getPermissionVariablesFromName(permissionName);
  //   const oldPermissions = this.[permissionName as keyof UserPermissions<T>];
  //   const result: Error | null = validatePermissionUpdateFunction(oldPermissions, newPermissions);
  //   return result;
  // }

  // validateCollectionApprovalsUpdate(newApprovals: CollectionApprovalWithDetails<T>[]): Error | null {
  //   const result = validateCollectionApprovalsUpdate(this.convert(BigIntify).collectionApprovals, newApprovals.map(x => x.convert(BigIntify)), this.convert(BigIntify).collectionPermissions.canUpdateCollectionApprovals);
  //   return result;
  // }

  // validateBadgeMetadataUpdate(newBadgeMetadata: BadgeMetadataTimeline<T>[]): Error | null {
  //   const result = validateBadgeMetadataUpdate(this.convert(BigIntify).badgeMetadataTimeline, newBadgeMetadata.map(x => x.convert(BigIntify)), this.convert(BigIntify).collectionPermissions.canUpdateBadgeMetadata);
  //   return result;
  // }

  // validateOffChainBalancesMetadataUpdate(newOffChainBalancesMetadata: OffChainBalancesMetadataTimeline<T>[]): Error | null {
  //   const result = validateOffChainBalancesMetadataUpdate(this.convert(BigIntify).offChainBalancesMetadataTimeline, newOffChainBalancesMetadata.map(x => x.convert(BigIntify)), this.convert(BigIntify).collectionPermissions.canUpdateOffChainBalancesMetadata);
  //   return result;
  // }
}

type AccountViewData<T extends NumberType> = {
  createdLists: BitBadgesAddressList<T>[];
  privateLists: BitBadgesAddressList<T>[];
  authCodes: BlockinAuthSignatureDoc<T>[];
  transferActivity: TransferActivityDoc<T>[];
  reviews: ReviewDoc<T>[];
  badgesCollected: BalanceDocWithDetails<T>[];
  sentClaimAlerts: ClaimAlertDoc<T>[];
  claimAlerts: ClaimAlertDoc<T>[];
  allLists: BitBadgesAddressList<T>[];
  whitelists: BitBadgesAddressList<T>[];
  blacklists: BitBadgesAddressList<T>[];
  createdBadges: BalanceDocWithDetails<T>[];
  managingBadges: BalanceDocWithDetails<T>[];
  listsActivity: ListActivityDoc<T>[];
  createdSecrets: SecretDoc<T>[];
  receivedSecrets: SecretDoc<T>[];
};

/**
 * AccountMap is used to store the user information by address.
 * @category Indexer
 */
export interface AccountMap<T extends NumberType> {
  [cosmosAddress: string]: BitBadgesUserInfo<T> | undefined;
}

/**
 * @category Indexer
 */
export function convertAccountMap<T extends NumberType, U extends NumberType>(
  item: AccountMap<T>,
  convertFunction: (item: NumberType) => U
): AccountMap<U> {
  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => {
      return [key, value ? value.convert(convertFunction) : undefined];
    })
  );
}

function updateAccountWithResponse<T extends NumberType>(
  oldAccount: BitBadgesUserInfo<T> | undefined,
  newAccountResponse: BitBadgesUserInfo<T>
): BitBadgesUserInfo<T> {
  const cachedAccount = oldAccount ? oldAccount.convert(getConverterFunction(oldAccount.accountNumber)) : undefined;
  if (!cachedAccount) return newAccountResponse;

  const account = newAccountResponse;

  const publicKey = cachedAccount?.publicKey ? cachedAccount.publicKey : account.publicKey ? account.publicKey : '';

  //Append all views to the existing views
  const views = cachedAccount?.views || {};
  for (const [key, newVal] of Object.entries(account.views)) {
    if (!newVal) continue;
    const oldVal = views[key];

    views[key] = {
      ids: [...new Set([...(oldVal?.ids || []), ...(newVal?.ids || [])])].filter((x, index, self) => index === self.findIndex((t) => t === x)),
      pagination: newVal.pagination,
      type: newVal.type
    };
  }

  const converterFunction = getConverterFunction(newAccountResponse.accountNumber);

  //Merge the rest
  const newAccount = new BitBadgesUserInfo({
    ...cachedAccount,
    ...account,

    reviews: [...(cachedAccount?.reviews || []), ...(account.reviews || [])],
    collected: [...(cachedAccount?.collected || []), ...(account.collected || [])],
    activity: [...(cachedAccount?.activity || []), ...(account.activity || [])],
    addressLists: [...(cachedAccount?.addressLists || []), ...(account.addressLists || [])],
    claimAlerts: [...(cachedAccount?.claimAlerts || []), ...(account.claimAlerts || [])],
    authCodes: [...(cachedAccount?.authCodes || []), ...(account.authCodes || [])],
    listsActivity: [...(cachedAccount?.listsActivity || []), ...(account.listsActivity || [])],
    secrets: [...(cachedAccount?.secrets || []), ...(account.secrets || [])],
    views: views,
    publicKey,
    airdropped: account.airdropped ? account.airdropped : cachedAccount?.airdropped ? cachedAccount.airdropped : false,
    sequence:
      account && account.sequence !== undefined && account.sequence >= converterFunction(0n)
        ? account.sequence
        : cachedAccount && cachedAccount.sequence !== undefined && cachedAccount.sequence >= converterFunction(0n)
          ? cachedAccount.sequence
          : converterFunction(-1n),
    accountNumber:
      account && account.accountNumber !== undefined && account.accountNumber >= converterFunction(0n)
        ? account.accountNumber
        : cachedAccount && cachedAccount.accountNumber !== undefined && cachedAccount.accountNumber >= converterFunction(0n)
          ? cachedAccount.accountNumber
          : converterFunction(-1n),
    resolvedName: account.resolvedName ? account.resolvedName : cachedAccount?.resolvedName ? cachedAccount.resolvedName : ''
  });

  //Filter duplicates
  newAccount.reviews = newAccount.reviews.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.collected = newAccount.collected.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.activity = newAccount.activity.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.addressLists = newAccount.addressLists.filter((x, index, self) => index === self.findIndex((t) => t.listId === x.listId));
  newAccount.claimAlerts = newAccount.claimAlerts.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.authCodes = newAccount.authCodes.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.listsActivity = newAccount.listsActivity.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.secrets = newAccount.secrets.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));

  //sort in descending order
  newAccount.activity = newAccount.activity.sort((a, b) => (BigInt(b.timestamp) - BigInt(a.timestamp) > 0 ? -1 : 1));
  newAccount.reviews = newAccount.reviews.sort((a, b) => (BigInt(b.timestamp) - BigInt(a.timestamp) > 0 ? -1 : 1));
  newAccount.claimAlerts = newAccount.claimAlerts.sort((a, b) => (BigInt(b.timestamp) - BigInt(a.timestamp) > 0 ? -1 : 1));
  newAccount.authCodes = newAccount.authCodes.sort((a, b) => (BigInt(b.createdAt) - BigInt(a.createdAt) > 0 ? -1 : 1));
  newAccount.listsActivity = newAccount.listsActivity.sort((a, b) => (BigInt(b.timestamp) - BigInt(a.timestamp) > 0 ? -1 : 1));

  return newAccount;
}

/**
 * The supported view keys for fetching account details.
 *
 * @category API Requests / Responses
 */
export type AccountViewKey =
  | 'createdLists'
  | 'privateLists'
  | 'authCodes'
  | 'transferActivity'
  | 'reviews'
  | 'badgesCollected'
  | 'sentClaimAlerts'
  | 'claimAlerts'
  | 'allLists'
  | 'whitelists'
  | 'blacklists'
  | 'createdBadges'
  | 'managingBadges'
  | 'listsActivity'
  | 'createdSecrets'
  | 'receivedSecrets';

/**
 * This defines the options for fetching additional account details.
 *
 * A view is a way of fetching additional details about an account, and these will be queryable in the response via the `views` property.
 *
 * Each view has a bookmark that is used for pagination and must be supplied to get the next page.
 *
 * We support the following views:
 * - `transferActivity` - Fetches the latest activity for the account.
 * - `latestAnnouncements` - Fetches the latest announcements for the account.
 * - `reviews` - Fetches the latest reviews for the account.
 * - `badgesCollected` - Fetches the badges collected by the account sequentially in random order.
 *
 * @typedef {Object} AccountFetchDetails
 *
 * @property {string} [address] - If present, the account corresponding to the specified address will be fetched. Please only specify one of `address` or `username`.
 * @property {string} [username] - If present, the account corresponding to the specified username will be fetched. Please only specify one of `address` or `username`.
 * @property {boolean} [fetchSequence] - If true, the sequence will be fetched from the blockchain.
 * @property {boolean} [fetchBalance] - If true, the $BADGE balance will be fetched from the blockchain.
 * @property {boolean} [noExternalCalls] - If true, only fetches local information stored in DB. Nothing external like resolved names, avatars, etc.
 * @property {Array<{ viewType: string, bookmark: string }>} [viewsToFetch] - An array of views to fetch with associated bookmarks.
 *
 * @category API Requests / Responses
 */
export type AccountFetchDetails = {
  /** The address of the user. This can be their native address. Only one of address or username should be specified. */
  address?: NativeAddress;
  /** The username of the user. Only one of address or username should be specified. */
  username?: string;
  /** If true, we will fetch the sequence from the blockchain. */
  fetchSequence?: boolean;
  /** If true, we will fetch the $BADGE balance from the blockchain. */
  fetchBalance?: boolean;
  /** If true, we will avoid external API calls. */
  noExternalCalls?: boolean;
  /** An array of views to fetch */
  viewsToFetch?: {
    /** Unique view ID. Used for pagination. All fetches w/ same ID should be made with same criteria. */
    viewId: string;
    /** The base view type to fetch. */
    viewType: AccountViewKey;
    /** If defined, we will filter the view to only include the specified collections. */
    specificCollections?: iBatchBadgeDetails<NumberType>[];
    /** If defined, we will filter the view to only include the specified lists. */
    specificLists?: string[];
    /** Oldest first. By default, we fetch newest */
    oldestFirst?: boolean;
    /** A bookmark to pass in for pagination. "" for first request. */
    bookmark: string;
  }[];
};

/**
 * @category API Requests / Responses
 */
export interface GetAccountsRouteRequestBody {
  accountsToFetch: AccountFetchDetails[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetAccountsRouteSuccessResponse<T extends NumberType> {
  accounts: iBitBadgesUserInfo<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetAccountsRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAccountsRouteSuccessResponse<T>>
  implements iGetAccountsRouteSuccessResponse<T>
{
  accounts: BitBadgesUserInfo<T>[];

  constructor(data: iGetAccountsRouteSuccessResponse<T>) {
    super();
    this.accounts = data.accounts.map((account) => new BitBadgesUserInfo(account));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetAccountsRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetAccountsRouteSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetFollowDetailsRouteRequestBody {
  cosmosAddress: string;

  followingBookmark?: string;
  followersBookmark?: string;

  protocol?: string;
  activityBookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetFollowDetailsRouteSuccessResponse<T extends NumberType> extends iFollowDetailsDoc<T> {
  followersPagination: PaginationInfo;
  followingPagination: PaginationInfo;

  activity: iTransferActivityDoc<T>[];
  activityPagination: PaginationInfo;
}
/**
 * @category API Requests / Responses
 */
export class GetFollowDetailsRouteSuccessResponse<T extends NumberType>
  extends FollowDetailsDoc<T>
  implements iGetFollowDetailsRouteSuccessResponse<T>
{
  followersPagination: PaginationInfo;
  followingPagination: PaginationInfo;
  activity: TransferActivityDoc<T>[];
  activityPagination: PaginationInfo;

  constructor(data: iGetFollowDetailsRouteSuccessResponse<T>) {
    super(data);
    this.followersPagination = data.followersPagination;
    this.followingPagination = data.followingPagination;
    this.activity = data.activity.map((activity) => new TransferActivityDoc(activity));
    this.activityPagination = data.activityPagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetFollowDetailsRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetFollowDetailsRouteSuccessResponse<U>;
  }
}
