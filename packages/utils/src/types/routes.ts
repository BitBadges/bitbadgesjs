import { NumberType } from "bitbadgesjs-proto";

//Status
export const GetStatusRoute = () => "/api/v0/status";

//Search
export const GetSearchRoute = (searchValue: string) => `/api/v0/search/${searchValue}`;

//Collections
export const GetCollectionBatchRoute = () => "/api/v0/collection/batch";
export const GetCollectionByIdRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}`;
export const GetOwnersForBadgeRoute = (collectionId: NumberType, badgeId: NumberType) => `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/owners`;
export const GetMetadataForCollectionRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/metadata`;
export const GetBadgeBalanceByAddressRoute = (collectionId: NumberType, cosmosAddress: string) => `/api/v0/collection/${collectionId.toString()}/balance/${cosmosAddress}`;
export const GetBadgeActivityRoute = (collectionId: NumberType, badgeId: NumberType) => `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/activity`;
export const RefreshMetadataRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refreshMetadata`;
export const RefreshBadgeMetadataRoute = (collectionId: NumberType, badgeId: NumberType) => `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/refreshMetadata`;
export const GetAllPasswordsAndCodesRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/codes`;
export const GetMerkleChallengeCodeViaPasswordRoute = (collectionId: NumberType, challengeId: string, password: string) => `/api/v0/collection/${collectionId.toString()}/password/${challengeId}/${password}`;
export const AddAnnouncementRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/addAnnouncement`;
export const AddReviewForCollectionRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/addReview`;

//Address Mappings
export const GetAddressMappingsRoute = () => "/api/v0/addressMappings";

//Approvals
export const GetApprovalsRoute = () => "/api/v0/approvals";

//Merkle Challenge Tracker
export const GetMerkleChallengeTrackerRoute = () => "/api/v0/merkleChallenges";

//User
export const GetAccountsRoute = () => "/api/v0/user/batch";
export const GetAccountRoute = (addressOrUsername: string) => `/api/v0/user/${addressOrUsername}`;
export const AddReviewForUserRoute = (addressOrUsername: string) => `/api/v0/user/${addressOrUsername}/addReview`;
export const UpdateAccountInfoRoute = () => "/api/v0/user/updateAccount";

//IPFS
export const AddMetadataToIpfsRoute = () => "/api/v0/addMetadataToIpfs";
export const AddClaimToIpfsRoute = () => "/api/v0/addClaimToIpfs";
export const AddBalancesToIpfsRoute = () => "/api/v0/addBalancesToIpfs";

//Blockin Auth
export const GetSignInChallengeRoute = () => "/api/v0/auth/getChallenge";
export const VerifySignInRoute = () => "/api/v0/auth/verify";
export const SignOutRoute = () => "/api/v0/auth/logout";

//Browse
export const GetBrowseCollectionsRoute = () => "/api/v0/browse";

//Broadcasting
export const BroadcastTxRoute = () => "/api/v0/broadcast";
export const SimulateTxRoute = () => "/api/v0/simulate";

//Fetch arbitrary metadata
export const FetchMetadataDirectlyRoute = () => "/api/v0/metadata";

//Faucet
export const GetTokensFromFaucetRoute = () => "/api/v0/faucet";
