import type { ConvertOptions, CustomType, ParsedQs } from '@/common/base.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, getConverterFunction } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { AddressList } from '@/core/addressLists.js';
import type { BatchTokenDetails, iBatchTokenDetails } from '@/core/batch-utils.js';
import { CosmosCoin } from '@/core/coin.js';
import type { CollectionId, iAddressList } from '@/interfaces/types/core.js';
import typia from 'typia';
import { SupportedChain } from '../common/types.js';
import type { iBitBadgesAddressList } from './BitBadgesAddressList.js';
import { BitBadgesAddressList } from './BitBadgesAddressList.js';
import { BitBadgesCollection } from './BitBadgesCollection.js';
import type { BaseBitBadgesApi, PaginationInfo } from './base.js';
import { ClaimActivityDoc, ClaimAlertDoc, ListActivityDoc, PointsActivityDoc, TransferActivityDoc } from './docs-types/activity.js';
import {
  ApprovalTrackerDoc,
  BalanceDocWithDetails,
  CreatorCreditsDoc,
  MerkleChallengeTrackerDoc,
  ProfileDoc,
  SIWBBRequestDoc
} from './docs-types/docs.js';
import type {
  BitBadgesAddress,
  NativeAddress,
  iAccountDoc,
  iApprovalTrackerDoc,
  iBalanceDocWithDetails,
  iClaimActivityDoc,
  iClaimAlertDoc,
  iCreatorCreditsDoc,
  iListActivityDoc,
  iMerkleChallengeTrackerDoc,
  iPointsActivityDoc,
  iProfileDoc,
  iSIWBBRequestDoc,
  iTransferActivityDoc
} from './docs-types/interfaces.js';
import { BitBadgesApiRoutes } from './requests/routes.js';

/**
 * @category Interfaces
 */
export interface iBitBadgesUserInfo<T extends NumberType> extends iProfileDoc<T>, iAccountDoc<T> {
  /** The resolved name of the account (e.g. ENS name). */
  resolvedName?: string;
  /** The avatar of the account. */
  avatar?: string;
  /** The Solana address of the account. Note: This may be empty if we do not have it yet. Solana -> BitBadges address conversions are one-way, and we cannot convert a BitBadges address to a Solana address without prior knowledge. */
  solAddress: string;
  /** The chain of the account. */
  chain: SupportedChain;
  /** Indicates whether the account has claimed their airdrop. */
  airdropped?: boolean;
  /** A list of tokens that the account has collected. Paginated and fetched as needed. To be used in conjunction with views. */
  collected: iBalanceDocWithDetails<T>[];
  /** A list of transfer activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  activity: iTransferActivityDoc<T>[];
  /** A list of list activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  listActivity: iListActivityDoc<T>[];
  /** A list of claim activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  claimActivity?: iClaimActivityDoc<T>[];
  /** A list of points activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  pointsActivity?: iPointsActivityDoc<T>[];
  /** A list of merkle challenge activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  challengeTrackers: iMerkleChallengeTrackerDoc<T>[];
  /** A list of approvals tracker activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  approvalTrackers: iApprovalTrackerDoc<T>[];
  /** A list of address lists for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  addressLists: iBitBadgesAddressList<T>[];
  /** A list of claim alerts for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  claimAlerts: iClaimAlertDoc<T>[];
  /** A list of SIWBB requests for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  siwbbRequests: iSIWBBRequestDoc<T>[];

  /** The native address of the account */
  address: NativeAddress;

  /** Indicates whether the account is NSFW. */
  nsfw?: { reason: string };
  /** Indicates whether the account has been reported. */
  reported?: { reason: string };

  /** The views for this collection and their pagination Doc. Views will only include the doc _ids. Use the pagination to fetch more.  For example, if you want to fetch the activity for a view, you would use the view's pagination to fetch the doc _ids, then use the corresponding activity array to find the matching docs. */
  views: {
    [viewId: string]:
      | {
          ids: string[];
          type: string;
          pagination: PaginationInfo;
        }
      | undefined;
  };

  /**
   * For advanced cases where you want a custom address or account for a collection or list. We map it to an account.
   *
   * Experimental - For example, if you want to send a badge to a collection, you can transfer it to the alias account.
   */
  alias?: {
    collectionId?: CollectionId;
    listId?: string;
  };

  /** The credits for the account. */
  creatorCredits?: iCreatorCreditsDoc<T>;
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
  bitbadgesAddress: BitBadgesAddress;
  ethAddress: string;
  btcAddress: string;
  solAddress: string;
  thorAddress: string;
  accountNumber: T;
  sequence?: T;
  balances?: CosmosCoin<T>[];
  pubKeyType: string;
  publicKey: string;

  resolvedName?: string;
  avatar?: string;
  chain: SupportedChain;
  airdropped?: boolean;
  collected: BalanceDocWithDetails<T>[];
  activity: TransferActivityDoc<T>[];
  listActivity: ListActivityDoc<T>[];
  claimActivity?: ClaimActivityDoc<T>[];
  pointsActivity?: PointsActivityDoc<T>[];
  challengeTrackers: MerkleChallengeTrackerDoc<T>[];
  approvalTrackers: ApprovalTrackerDoc<T>[];
  addressLists: BitBadgesAddressList<T>[];
  claimAlerts: ClaimAlertDoc<T>[];
  siwbbRequests: SIWBBRequestDoc<T>[];

  address: NativeAddress;
  nsfw?: { reason: string };
  reported?: { reason: string };
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
    collectionId?: CollectionId;
    listId?: string;
  };
  creatorCredits?: CreatorCreditsDoc<T>;

  constructor(data: iBitBadgesUserInfo<T>) {
    super(data);
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.ethAddress = data.ethAddress;
    this.btcAddress = data.btcAddress;
    this.solAddress = data.solAddress;
    this.thorAddress = data.thorAddress;
    this.accountNumber = data.accountNumber;
    this.sequence = data.sequence;
    this.balances = data.balances?.map((balance) => new CosmosCoin(balance)) ?? [];
    this.pubKeyType = data.pubKeyType;
    this.publicKey = data.publicKey;
    this.resolvedName = data.resolvedName;
    this.avatar = data.avatar;
    this.chain = data.chain;
    this.airdropped = data.airdropped;
    this.collected = data.collected.map((balance) => new BalanceDocWithDetails(balance));
    this.activity = data.activity.map((activity) => new TransferActivityDoc(activity));
    this.listActivity = data.listActivity.map((activity) => new ListActivityDoc(activity));
    this.claimActivity = data.claimActivity?.map((activity) => new ClaimActivityDoc(activity));
    this.pointsActivity = data.pointsActivity?.map((activity) => new PointsActivityDoc(activity));
    this.challengeTrackers = data.challengeTrackers.map((challenge) => new MerkleChallengeTrackerDoc(challenge));
    this.approvalTrackers = data.approvalTrackers.map((tracker) => new ApprovalTrackerDoc(tracker));
    this.addressLists = data.addressLists.map((list) => new BitBadgesAddressList(list));
    this.claimAlerts = data.claimAlerts.map((alert) => new ClaimAlertDoc(alert));
    this.siwbbRequests = data.siwbbRequests.map((auth) => new SIWBBRequestDoc(auth));
    this.address = data.address;
    this.nsfw = data.nsfw;
    this.reported = data.reported;
    this.views = data.views;
    this.alias = data.alias;
    this.creatorCredits = data.creatorCredits ? new CreatorCreditsDoc(data.creatorCredits) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): BitBadgesUserInfo<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as BitBadgesUserInfo<U>;
  }

  clone(): BitBadgesUserInfo<T> {
    return super.clone() as BitBadgesUserInfo<T>;
  }

  getNumberFieldNames(): string[] {
    return [...super.getNumberFieldNames(), 'accountNumber', 'sequence'];
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
  static async GetAccounts<T extends NumberType>(api: BaseBitBadgesApi<T>, params: iGetAccountsPayload) {
    try {
      const validateRes: typia.IValidation<iGetAccountsPayload> = typia.validate<iGetAccountsPayload>(params ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await api.axios.post<iGetAccountsSuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetAccountsRoute()}`,
        params
      );
      return new GetAccountsSuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets an account by address or username from the API.
   */
  static async GetAccount<T extends NumberType>(api: BaseBitBadgesApi<T>, params: iGetAccountPayload) {
    try {
      const validateRes: typia.IValidation<iGetAccountPayload> = typia.validate<iGetAccountPayload>(params ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await api.axios.get<iGetAccountSuccessResponse<string>>(`${api.BACKEND_URL}${BitBadgesApiRoutes.GetAccountRoute()}`, {
        params: new GetAccountPayload(params)
      });
      return new GetAccountSuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  private getBalanceInfoHelper(collectionId: CollectionId, throwIfNotFound?: boolean) {
    const balance = this.collected.find((x) => x.collectionId === collectionId);
    if (!balance && throwIfNotFound) throw new Error('Balance not found');

    return balance;
  }

  /**
   * Gets the balance doc for a user by address.
   *
   * This returns the cached data if it exists. If you want to fetch, use fetchBalances.
   *
   * @example
   * ```ts
   * const res = user.getBalanceInfo(123n);
   * console.log(res.balances);
   * ```
   */
  getBalanceInfo(collectionId: CollectionId) {
    return this.getBalanceInfoHelper(collectionId);
  }

  /**
   * Wrapper for {@link getBalanceInfo} that throws if not fetched yet.
   *
   * @example
   * ```ts
   * const res = user.mustGetBalanceInfo(123n);
   * console.log(res.balances);
   * ```
   */
  mustGetBalanceInfo(collectionId: CollectionId) {
    const balance = this.getBalanceInfoHelper(collectionId, true);
    return balance as BalanceDocWithDetails<T>;
  }

  /**
   * Gets the balances for a user by address. Throws if not fetched yet. To fetch, use fetchBalances.
   *
   * Wrapper for {@link getBalances} that throws if not fetched yet.
   *
   * @example
   * ```ts
   * const res = user.mustGetBalances(123n);
   * console.log(res); // [{ ... }] Balances
   */
  mustGetBalances(collectionId: CollectionId) {
    return this.mustGetBalanceInfo(collectionId).balances;
  }

  /**
   * Fetch balances for a collection and updates the user's collected array. Must pass in a valid API instance.
   *
   * @example
   * ```ts
   * const res = await user.fetchBalances(api, 123n);
   * console.log(res.balances);
   * ```
   */
  getBalances(collectionId: CollectionId) {
    return this.getBalanceInfo(collectionId)?.balances;
  }

  /**
   * Fetch balances for a collection and updates the user's collected array. Must pass in a valid API instance.
   * If forceful is true, it will fetch regardless of if it is already fetched. Else, it will only fetch if it is not already cached.
   */
  async fetchBalances(api: BaseBitBadgesApi<T>, collectionId: CollectionId, forceful?: boolean) {
    const currOwnerInfo = this.collected.find((x) => x.collectionId === collectionId);
    if (currOwnerInfo && !forceful) return currOwnerInfo;

    const newOwnerInfo = await BitBadgesCollection.GetBalanceByAddress(api, collectionId, this.address);
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
    options = this.pruneBody(options);

    const isFullRequest = !options.partialProfile;
    const isPartialRequest = options.partialProfile;

    //Check if we need to fetch anything at all
    const needToFetch =
      options.viewsToFetch?.length ||
      (isFullRequest && this.fetchedProfile !== 'full') || //Fetch full if we havent already
      (isPartialRequest && !this.fetchedProfile); //Fetch partial if we havent fetched anything yet

    if (needToFetch) {
      return false;
    }

    return true;
  }

  /**
   * Prunes the request body to remove any redundant fetches.
   */
  pruneBody(options: Omit<AccountFetchDetails, 'address' | 'username'>) {
    const viewsToFetch = options.viewsToFetch?.filter((x) => this.viewHasMore(x.viewId));
    return {
      ...options,
      address: this.address,
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
      options = this.pruneBody(options);
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
    specificCollections?: BatchTokenDetails<NumberType>[],
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
      case 'siwbbRequests':
        return this.getSIWBBRequestsView(viewId) as AccountViewData<T>[KeyType];
      case 'transferActivity':
        return this.getAccountActivityView(viewId) as AccountViewData<T>[KeyType];
      case 'tokensCollected':
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
      case 'createdTokens':
        return this.getAccountBalancesView(viewId) as AccountViewData<T>[KeyType];
      case 'managingTokens':
        return this.getAccountBalancesView(viewId) as AccountViewData<T>[KeyType];
      case 'listActivity':
        return this.getAccountListActivityView(viewId) as AccountViewData<T>[KeyType];
      case 'publicClaimActivity':
        return this.getClaimActivityView(viewId) as AccountViewData<T>[KeyType];
      case 'allClaimActivity':
        return this.getClaimActivityView(viewId) as AccountViewData<T>[KeyType];
      case 'pointsActivity':
        return this.getPointsActivityView(viewId) as AccountViewData<T>[KeyType];
      default:
        throw new Error('Invalid view type');
    }
  }

  getClaimActivityView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.claimActivity?.find((y) => y._docId === x);
    }) ?? []) as ClaimActivityDoc<T>[];
  }

  getPointsActivityView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.pointsActivity?.find((y) => y._docId === x);
    }) ?? []) as PointsActivityDoc<T>[];
  }

  getSIWBBRequestsView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.siwbbRequests.find((y) => y._docId === x);
    }) ?? []) as SIWBBRequestDoc<T>[];
  }

  getAccountActivityView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.activity.find((y) => y._docId === x);
    }) ?? []) as TransferActivityDoc<T>[];
  }

  getAccountListActivityView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.listActivity.find((y) => y._docId === x);
    }) ?? []) as ListActivityDoc<T>[];
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
      bitbadgesAddress: 'Mint',
      ethAddress: 'Mint',
      solAddress: 'Mint',
      btcAddress: 'Mint',
      thorAddress: 'Mint',
      address: 'Mint',
      chain: SupportedChain.COSMOS,
      pubKeyType: 'secp256k1',
      publicKey: '',
      accountNumber: -1n,
      sequence: 0n,
      collected: [],
      activity: [],
      listActivity: [],
      addressLists: [],
      claimAlerts: [],
      challengeTrackers: [],
      approvalTrackers: [],
      siwbbRequests: [],
      seenActivity: 0n,
      createdAt: 0n,
      claimActivity: [],
      pointsActivity: [],
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
      bitbadgesAddress: '',
      ethAddress: '',
      solAddress: '',
      btcAddress: '',
      thorAddress: '',
      address: '',
      chain: SupportedChain.UNKNOWN,
      pubKeyType: '',
      publicKey: '',
      sequence: 0n,
      accountNumber: -1n,
      collected: [],
      activity: [],
      claimAlerts: [],
      challengeTrackers: [],
      approvalTrackers: [],
      addressLists: [],
      listActivity: [],
      siwbbRequests: [],
      seenActivity: 0n,
      createdAt: 0n,
      claimActivity: [],
      pointsActivity: [],
      views: {}
    });
  }
}

type AccountViewData<T extends NumberType> = {
  createdLists: BitBadgesAddressList<T>[];
  siwbbRequests: SIWBBRequestDoc<T>[];
  transferActivity: TransferActivityDoc<T>[];
  tokensCollected: BalanceDocWithDetails<T>[];
  sentClaimAlerts: ClaimAlertDoc<T>[];
  claimAlerts: ClaimAlertDoc<T>[];
  allLists: BitBadgesAddressList<T>[];
  whitelists: BitBadgesAddressList<T>[];
  blacklists: BitBadgesAddressList<T>[];
  createdTokens: BalanceDocWithDetails<T>[];
  managingTokens: BalanceDocWithDetails<T>[];
  listActivity: ListActivityDoc<T>[];
  publicClaimActivity: ClaimActivityDoc<T>[];
  allClaimActivity: ClaimActivityDoc<T>[];
  pointsActivity: PointsActivityDoc<T>[];
};

/**
 * AccountMap is used to store the user information by address.
 * @category Indexer
 */
export interface AccountMap<T extends NumberType> {
  [bitbadgesAddress: string]: BitBadgesUserInfo<T> | undefined;
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

    collected: [...(cachedAccount?.collected || []), ...(account.collected || [])],
    activity: [...(cachedAccount?.activity || []), ...(account.activity || [])],
    addressLists: [...(cachedAccount?.addressLists || []), ...(account.addressLists || [])],
    claimAlerts: [...(cachedAccount?.claimAlerts || []), ...(account.claimAlerts || [])],
    siwbbRequests: [...(cachedAccount?.siwbbRequests || []), ...(account.siwbbRequests || [])],
    listActivity: [...(cachedAccount?.listActivity || []), ...(account.listActivity || [])],
    pointsActivity: [...(cachedAccount?.pointsActivity || []), ...(account.pointsActivity || [])],
    claimActivity: [...(cachedAccount?.claimActivity || []), ...(account.claimActivity || [])],
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
  newAccount.collected = newAccount.collected.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.activity = newAccount.activity.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.addressLists = newAccount.addressLists.filter((x, index, self) => index === self.findIndex((t) => t.listId === x.listId));
  newAccount.claimAlerts = newAccount.claimAlerts.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.siwbbRequests = newAccount.siwbbRequests.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.listActivity = newAccount.listActivity.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.claimActivity = newAccount.claimActivity?.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.pointsActivity = newAccount.pointsActivity?.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));

  //sort in descending order
  newAccount.activity = newAccount.activity.sort((a, b) => (BigInt(b.timestamp) - BigInt(a.timestamp) > 0 ? -1 : 1));
  newAccount.claimAlerts = newAccount.claimAlerts.sort((a, b) => (BigInt(b.timestamp) - BigInt(a.timestamp) > 0 ? -1 : 1));
  newAccount.siwbbRequests = newAccount.siwbbRequests.sort((a, b) => (BigInt(b.createdAt) - BigInt(a.createdAt) > 0 ? -1 : 1));
  newAccount.listActivity = newAccount.listActivity.sort((a, b) => (BigInt(b.timestamp) - BigInt(a.timestamp) > 0 ? -1 : 1));
  newAccount.claimActivity = newAccount.claimActivity?.sort((a, b) => (BigInt(b.timestamp) - BigInt(a.timestamp) > 0 ? -1 : 1));
  newAccount.pointsActivity = newAccount.pointsActivity?.sort((a, b) => (BigInt(b.timestamp) - BigInt(a.timestamp) > 0 ? -1 : 1));
  return newAccount;
}

/**
 * The supported view keys for fetching account details.
 *
 * @category API Requests / Responses
 */
export type AccountViewKey =
  | 'createdLists'
  | 'siwbbRequests'
  | 'transferActivity'
  | 'tokensCollected'
  | 'sentClaimAlerts'
  | 'claimAlerts'
  | 'allLists'
  | 'whitelists'
  | 'blacklists'
  | 'createdTokens'
  | 'managingTokens'
  | 'listActivity'
  | 'publicClaimActivity'
  | 'allClaimActivity'
  | 'pointsActivity';

/**
 * This defines the options for fetching additional account details.
 *
 * A view is a way of fetching additional details about an account, and these will be queryable in the response via the `views` property.
 *
 * Each view has a bookmark that is used for pagination and must be supplied to get the next page.
 *
 * @typedef {Object} AccountFetchDetails
 *
 * @property {string} [address] - If present, the account corresponding to the specified address will be fetched. Please only specify one of `address` or `username`.
 * @property {string} [username] - If present, the account corresponding to the specified username will be fetched. Please only specify one of `address` or `username`.
 * @property {boolean} [fetchSequence] - If true, the sequence will be fetched from the blockchain.
 * @property {boolean} [fetchBalance] - If true, the BADGE balance will be fetched from the blockchain.
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
  /**
   * If true, we will only fetch a partial set of the document for the user.
   *
   * Currently includes: solAddress, username, profile pic, and latest signed in chain
   *
   * Pretty much, anything you need to display the address but not the full profile
   */
  partialProfile?: boolean;

  /** An array of views to fetch */
  viewsToFetch?: {
    /** Unique view ID. Used for pagination. All fetches w/ same ID should be made with same criteria. */
    viewId: string;
    /** The base view type to fetch. */
    viewType: AccountViewKey;
    /** If defined, we will filter the view to only include the specified collections. */
    specificCollections?: iBatchTokenDetails<NumberType>[];
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
export interface iGetAccountPayload {
  address?: NativeAddress;
  username?: string;
}

/**
 * @category API Requests / Responses
 */
export class GetAccountPayload {
  address?: NativeAddress;
  username?: string;

  constructor(data: iGetAccountPayload) {
    this.address = data.address;
    this.username = data.username;
  }

  static FromQuery(query: ParsedQs): GetAccountPayload {
    return new GetAccountPayload({
      address: query.address as NativeAddress,
      username: query.username as string
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetAccountSuccessResponse<T extends NumberType> {
  account: iBitBadgesUserInfo<T>;
}

/**
 * @category API Requests / Responses
 */
export class GetAccountSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAccountSuccessResponse<T>>
  implements iGetAccountSuccessResponse<T>
{
  account: BitBadgesUserInfo<T>;

  constructor(data: iGetAccountSuccessResponse<T>) {
    super();
    this.account = new BitBadgesUserInfo(data.account);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetAccountSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetAccountSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetAccountSuccessResponse<T extends NumberType> {
  account: iBitBadgesUserInfo<T>;
}

/**
 * @category API Requests / Responses
 */
export interface iGetAccountsPayload {
  accountsToFetch: AccountFetchDetails[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetAccountsSuccessResponse<T extends NumberType> {
  accounts: iBitBadgesUserInfo<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetAccountsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAccountsSuccessResponse<T>>
  implements iGetAccountsSuccessResponse<T>
{
  accounts: BitBadgesUserInfo<T>[];

  constructor(data: iGetAccountsSuccessResponse<T>) {
    super();
    this.accounts = data.accounts.map((account) => new BitBadgesUserInfo(account));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetAccountsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetAccountsSuccessResponse<U>;
  }
}
