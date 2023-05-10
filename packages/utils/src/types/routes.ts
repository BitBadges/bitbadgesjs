//TODO: Make this complete and handle all API routes

export const GetAccountRoute = (bech32address: string) => {
  return `/api/v0/user/${bech32address}/address`;
}

export const GetAccountByNumberRoute = (id: bigint) => {
  return `/api/v0/user/${id.toString()}/id`;
}

export const GetAccountsRoute = () => {
  return `/api/v0/user/batch`;
}

export const GetBalanceRoute = (bech32address: string) => {
  return `/cosmos/bank/balances/${bech32address}`;
}

export const GetCollectionRoute = (collectionId: bigint) => {
  return `/api/v0/collection/${collectionId.toString()}`;
}

export const GetCollectionsRoute = () => {
  return `/api/v0/collection/batch`;
}

export const GetBadgeBalanceRoute = (collectionId: bigint, accountNumber: bigint) => {
  return `/api/v0/collection/${collectionId.toString()}/balance/${accountNumber.toString()}`;
}

export const GetOwnersRoute = (collectionId: bigint, badgeId: bigint) => {
  return `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/owners`;
}

export const GetPortfolioRoute = (cosmosAddr: string) => {
  return `/api/v0/user/${cosmosAddr}/portfolio`
}

export const GetMetadataRoute = (collectionId: bigint) => {
  return `/api/v0/collection/${collectionId.toString()}/metadata`;
}

export const GetSearchRoute = (query: string) => {
  return `/api/v0/search/${query}`;
}

export const GetStatusRoute = () => {
  return `/api/v0/status`;
}
