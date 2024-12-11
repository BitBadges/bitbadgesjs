import type { CustomType } from '@/common/base.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, getConverterFunction } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { AddressList } from '@/core/addressLists.js';
import type { BatchBadgeDetails, iBatchBadgeDetails } from '@/core/batch-utils.js';
import { CosmosCoin } from '@/core/coin.js';
import type { iAddressList } from '@/interfaces/badges/core.js';
import typia from 'typia';
import { SupportedChain } from '../common/types.js';
import type { iBitBadgesAddressList } from './BitBadgesAddressList.js';
import { BitBadgesAddressList } from './BitBadgesAddressList.js';
import { BitBadgesCollection } from './BitBadgesCollection.js';
import type { BaseBitBadgesApi, PaginationInfo } from './base.js';
import { ClaimAlertDoc, ListActivityDoc, TransferActivityDoc } from './docs/activity.js';
import { ApprovalTrackerDoc, AttestationDoc, BalanceDocWithDetails, MapDoc, MerkleChallengeDoc, ProfileDoc, SIWBBRequestDoc } from './docs/docs.js';
import type {
  BitBadgesAddress,
  NativeAddress,
  iAccountDoc,
  iApprovalTrackerDoc,
  iAttestationDoc,
  iBalanceDocWithDetails,
  iClaimAlertDoc,
  iListActivityDoc,
  iMapDoc,
  iMerkleChallengeDoc,
  iProfileDoc,
  iSIWBBRequestDoc,
  iTransferActivityDoc
} from './docs/interfaces.js';
import { BitBadgesApiRoutes } from './requests/routes.js';

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
  /** A list of merkle challenge activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  merkleChallenges: iMerkleChallengeDoc<T>[];
  /** A list of approvals tracker activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  approvalTrackers: iApprovalTrackerDoc<T>[];
  /** A list of address lists for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  addressLists: iBitBadgesAddressList<T>[];
  /** A list of claim alerts for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  claimAlerts: iClaimAlertDoc<T>[];
  /** A list of SIWBB requests for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  siwbbRequests: iSIWBBRequestDoc<T>[];
  /** A list of user attestations for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  attestations: iAttestationDoc<T>[];

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
  bitbadgesAddress: BitBadgesAddress;
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
  merkleChallenges: MerkleChallengeDoc<T>[];
  approvalTrackers: ApprovalTrackerDoc<T>[];
  addressLists: BitBadgesAddressList<T>[];
  claimAlerts: ClaimAlertDoc<T>[];
  siwbbRequests: SIWBBRequestDoc<T>[];
  attestations: iAttestationDoc<T>[];

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
    this.bitbadgesAddress = data.bitbadgesAddress;
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
    this.merkleChallenges = data.merkleChallenges.map((challenge) => new MerkleChallengeDoc(challenge));
    this.approvalTrackers = data.approvalTrackers.map((tracker) => new ApprovalTrackerDoc(tracker));
    this.addressLists = data.addressLists.map((list) => new BitBadgesAddressList(list));
    this.claimAlerts = data.claimAlerts.map((alert) => new ClaimAlertDoc(alert));
    this.siwbbRequests = data.siwbbRequests.map((auth) => new SIWBBRequestDoc(auth));
    this.attestations = data.attestations.map((attestation) => new AttestationDoc(attestation));
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
  static async GetAccounts<T extends NumberType>(api: BaseBitBadgesApi<T>, params: GetAccountsPayload) {
    try {
      const validateRes: typia.IValidation<GetAccountsPayload> = typia.validate<GetAccountsPayload>(params ?? {});
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
    options = this.pruneBody(options);

    const isFullRequest = !options.partialProfile;
    const isPartialRequest = options.partialProfile;

    //Check if we need to fetch anything at all
    const needToFetch =
      (options.fetchSequence && (this.sequence === undefined || BigInt(this.sequence) < 0)) ||
      (options.fetchBalance && this.balance === undefined) ||
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
      case 'siwbbRequests':
        return this.getSIWBBRequestsView(viewId) as AccountViewData<T>[KeyType];
      case 'transferActivity':
        return this.getAccountActivityView(viewId) as AccountViewData<T>[KeyType];
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
      case 'createdAttestations':
        return this.getAttestationsView(viewId) as AccountViewData<T>[KeyType];
      case 'receivedAttestations':
        return this.getAttestationsView(viewId) as AccountViewData<T>[KeyType];
      case 'attestations':
        return this.getAttestationsView(viewId) as AccountViewData<T>[KeyType];
      default:
        throw new Error('Invalid view type');
    }
  }

  getAttestationsView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.attestations.find((y) => y._docId === x);
    }) ?? []) as AttestationDoc<T>[];
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

  getAccountListsActivityView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.listsActivity.find((y) => y._docId === x);
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
      address: 'Mint',
      chain: SupportedChain.COSMOS,
      pubKeyType: 'secp256k1',
      publicKey: '',
      accountNumber: -1n,
      sequence: 0n,
      collected: [],
      activity: [],
      listsActivity: [],
      attestations: [],
      addressLists: [],
      claimAlerts: [],
      merkleChallenges: [],
      approvalTrackers: [],
      siwbbRequests: [],
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
      bitbadgesAddress: '',
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
      attestations: [],
      claimAlerts: [],
      merkleChallenges: [],
      approvalTrackers: [],
      addressLists: [],
      listsActivity: [],
      siwbbRequests: [],
      seenActivity: 0n,
      createdAt: 0n,
      views: {}
    });
  }
}

type AccountViewData<T extends NumberType> = {
  createdLists: BitBadgesAddressList<T>[];
  privateLists: BitBadgesAddressList<T>[];
  siwbbRequests: SIWBBRequestDoc<T>[];
  transferActivity: TransferActivityDoc<T>[];
  badgesCollected: BalanceDocWithDetails<T>[];
  sentClaimAlerts: ClaimAlertDoc<T>[];
  claimAlerts: ClaimAlertDoc<T>[];
  allLists: BitBadgesAddressList<T>[];
  whitelists: BitBadgesAddressList<T>[];
  blacklists: BitBadgesAddressList<T>[];
  createdBadges: BalanceDocWithDetails<T>[];
  managingBadges: BalanceDocWithDetails<T>[];
  listsActivity: ListActivityDoc<T>[];
  createdAttestations: AttestationDoc<T>[];
  receivedAttestations: AttestationDoc<T>[];
  attestations: AttestationDoc<T>[];
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
    listsActivity: [...(cachedAccount?.listsActivity || []), ...(account.listsActivity || [])],
    attestations: [...(cachedAccount?.attestations || []), ...(account.attestations || [])],
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
  newAccount.listsActivity = newAccount.listsActivity.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));
  newAccount.attestations = newAccount.attestations.filter((x, index, self) => index === self.findIndex((t) => t._docId === x._docId));

  //sort in descending order
  newAccount.activity = newAccount.activity.sort((a, b) => (BigInt(b.timestamp) - BigInt(a.timestamp) > 0 ? -1 : 1));
  newAccount.claimAlerts = newAccount.claimAlerts.sort((a, b) => (BigInt(b.timestamp) - BigInt(a.timestamp) > 0 ? -1 : 1));
  newAccount.siwbbRequests = newAccount.siwbbRequests.sort((a, b) => (BigInt(b.createdAt) - BigInt(a.createdAt) > 0 ? -1 : 1));
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
  | 'siwbbRequests'
  | 'transferActivity'
  | 'badgesCollected'
  | 'sentClaimAlerts'
  | 'claimAlerts'
  | 'allLists'
  | 'whitelists'
  | 'blacklists'
  | 'createdBadges'
  | 'managingBadges'
  | 'listsActivity'
  | 'createdAttestations'
  | 'receivedAttestations'
  | 'attestations';

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
export interface GetAccountsPayload {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetAccountsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetAccountsSuccessResponse<U>;
  }
}
