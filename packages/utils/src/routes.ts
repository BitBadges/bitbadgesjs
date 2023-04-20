import { AccountDocument, MetadataDocument } from "./db";
import { AnnouncementActivityItem, BalancesMap, BitBadgeCollection, CosmosAccountInformation, PaginationInfo, TransferActivityItem, UserBalance } from "./types";

export const GetAccountRoute = (bech32address: string) => {
    return `/api/v0/user/${bech32address}/address`;
}

export const GetAccountByNumberRoute = (id: number) => {
    return `/api/v0/user/${id}/id`;
}

export const GetAccountsRoute = () => {
    return `/api/v0/user/batch`;
}

export const GetBalanceRoute = (bech32address: string) => {
    return `/cosmos/bank/balances/${bech32address}`;
}

export const GetCollectionRoute = (collectionId: number) => {
    return `/api/v0/collection/${collectionId}`;
}

export const GetCollectionsRoute = () => {
    return `/api/v0/collection/batch`;
}

export const GetBadgeBalanceRoute = (collectionId: number, accountNumber: number) => {
    return `/api/v0/collection/${collectionId}/balance/${accountNumber}`;
}

export const GetOwnersRoute = (collectionId: number, badgeId: number) => {
    return `/api/v0/collection/${collectionId}/${badgeId}/owners`;
}

export const GetPortfolioRoute = (accountNumber: number) => {
    return `/api/v0/user/${accountNumber}/portfolio`
}

export const GetMetadataRoute = (collectionId: number) => {
    return `/api/v0/collection/${collectionId}/metadata`;
}

export const GetSearchRoute = (query: string) => {
    return `/api/v0/search/${query}`;
}

export const GetStatusRoute = () => {
    return `/api/v0/status`;
}


export interface GetCollectionResponse {
    error?: any;
    collection?: BitBadgeCollection;
    pagination: {
        activity: PaginationInfo,
        announcements: PaginationInfo,
    }
}

export interface GetAccountResponse {
    error?: any;
    accountInfo?: CosmosAccountInformation;
}

export interface GetBadgeBalanceResponse {
    error?: any;
    balance?: UserBalance;
}

export interface GetOwnersResponse {
    owners: number[],
    balances: BalancesMap
}

export interface GetPortfolioResponse {
    collected: BitBadgeCollection[],
    managing: BitBadgeCollection[],
    activity: TransferActivityItem[],
    announcements: AnnouncementActivityItem[],
    pagination: {
        userActivity: PaginationInfo,
        announcements: PaginationInfo,
        collected: PaginationInfo,
    }
}

export interface SearchResponse {
    accounts: AccountDocument[],
    collections: (MetadataDocument & {
        _id: string;
        _rev: string;
    })[]
}