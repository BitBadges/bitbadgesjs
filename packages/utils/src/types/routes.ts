import { NumberType } from "bitbadgesjs-proto";

//Status
export const GetStatusRoute = () => "/api/v0/status";

//Search
export const GetSearchRoute = (searchValue: string) => `/api/v0/search/${searchValue}`;

//Collections
export const GetCollectionBatchRoute = () => "/api/v0/collection/batch";
export const GetCollectionByIdRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}`;
export const GetOwnersForCollectionRoute = (collectionId: NumberType, badgeId: NumberType) => `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/owners`;
export const GetMetadataForCollectionRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/metadata`;
export const GetBadgeBalanceRoute = (collectionId: NumberType, cosmosAddress: string) => `/api/v0/collection/${collectionId.toString()}/balance/${cosmosAddress}`;
export const GetBadgeActivityRoute = (collectionId: NumberType, badgeId: NumberType) => `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/activity`;
export const RefreshMetadataRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refreshMetadata`;
export const RefreshBadgeMetadataRoute = (collectionId: NumberType, badgeId: NumberType) => `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/refreshMetadata`;
export const GetCodesRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/codes`;
export const GetPasswordAndCodesRoute = (collectionId: NumberType, claimId: NumberType, password: string) => `/api/v0/collection/${collectionId.toString()}/password/${claimId}/${password}`;
export const AddAnnouncementRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/addAnnouncement`;
export const AddReviewForCollectionRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/addReview`;

//User
export const GetAccountsByAddressRoute = () => "/api/v0/user/batch";
export const GetAccountRoute = (addressOrUsername: string) => `/api/v0/user/${addressOrUsername}`;
export const GetPortfolioInfoRoute = (addressOrUsername: string) => `/api/v0/user/${addressOrUsername}/portfolio`;
export const GetActivityRoute = (addressOrUsername: string) => `/api/v0/user/${addressOrUsername}/activity`;
export const AddReviewForUserRoute = (addressOrUsername: string) => `/api/v0/user/${addressOrUsername}/addReview`;
export const UpdateAccountInfoRoute = () => "/api/v0/user/updateAccount";

//IPFS
export const AddMetadataToIpfsRoute = () => "/api/v0/addMetadataToIpfs";
export const AddClaimToIpfsRoute = () => "/api/v0/addClaimToIpfs";

//Blockin Auth
export const GetChallengeRoute = () => "/api/v0/auth/getChallenge";
export const VerifyBlockinAndGrantSessionCookieRoute = () => "/api/v0/auth/verify";
export const RemoveBlockinSessionCookieRoute = () => "/api/v0/auth/logout";

//Browse
export const GetBrowseCollectionsRoute = () => "/api/v0/browse";

//Broadcasting
export const BroadcastTxRoute = () => "/api/v0/broadcast";
export const SimulateTxRoute = () => "/api/v0/simulate";

//Fetch arbitrary metadata
export const FetchMetadataDirectlyRoute = () => "/api/v0/metadata";

//Faucet
export const SendTokensFromFaucetRoute = () => "/api/v0/faucet";
