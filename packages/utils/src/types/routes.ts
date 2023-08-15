import { NumberType } from "bitbadgesjs-proto";

//Status
/**
 * @category API Routes
 */
export const GetStatusRoute = () => "/api/v0/status";

//Search
/**
 * @category API Routes
 */
export const GetSearchRoute = (searchValue: string) => `/api/v0/search/${searchValue}`;

//Collections
/**
 * @category API Routes
 */
export const GetCollectionBatchRoute = () => "/api/v0/collection/batch";
/**
 * @category API Routes
 */
export const GetCollectionByIdRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}`;
/**
 * @category API Routes
 */
export const GetOwnersForBadgeRoute = (collectionId: NumberType, badgeId: NumberType) => `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/owners`;
/**
 * @category API Routes
 */
export const GetMetadataForCollectionRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/metadata`;
/**
 * @category API Routes
 */
export const GetBadgeBalanceByAddressRoute = (collectionId: NumberType, cosmosAddress: string) => `/api/v0/collection/${collectionId.toString()}/balance/${cosmosAddress}`;
/**
 * @category API Routes
 */
export const GetBadgeActivityRoute = (collectionId: NumberType, badgeId: NumberType) => `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/activity`;
/**
 * @category API Routes
 */
export const RefreshMetadataRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refreshMetadata`;
/**
 * @category API Routes
 */
export const RefreshBadgeMetadataRoute = (collectionId: NumberType, badgeId: NumberType) => `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/refreshMetadata`;
/**
 * @category API Routes
 */
export const GetAllPasswordsAndCodesRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/codes`;
/**
 * @category API Routes
 */
export const GetMerkleChallengeCodeViaPasswordRoute = (collectionId: NumberType, challengeId: string, password: string) => `/api/v0/collection/${collectionId.toString()}/password/${challengeId}/${password}`;
/**
 * @category API Routes
 */
export const AddAnnouncementRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/addAnnouncement`;
/**
 * @category API Routes
 */
export const AddReviewForCollectionRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/addReview`;

//Address Mappings
/**
 * @category API Routes
 */
export const GetAddressMappingsRoute = () => "/api/v0/addressMappings";

//Approvals
/**
 * @category API Routes
 */
export const GetApprovalsRoute = () => "/api/v0/approvals";

//Merkle Challenge Tracker
/**
 * @category API Routes
 */
export const GetMerkleChallengeTrackerRoute = () => "/api/v0/merkleChallenges";

//User
/**
 * @category API Routes
 */
export const GetAccountsRoute = () => "/api/v0/user/batch";
/**
 * @category API Routes
 */
export const GetAccountRoute = (addressOrUsername: string) => `/api/v0/user/${addressOrUsername}`;
/**
 * @category API Routes
 */
export const AddReviewForUserRoute = (addressOrUsername: string) => `/api/v0/user/${addressOrUsername}/addReview`;
/**
 * @category API Routes
 */
export const UpdateAccountInfoRoute = () => "/api/v0/user/updateAccount";

//IPFS
/**
 * @category API Routes
 */
export const AddMetadataToIpfsRoute = () => "/api/v0/addMetadataToIpfs";
/**
 * @category API Routes
 */
export const AddMerkleChallengeToIpfsRoute = () => "/api/v0/addMerkleChallengeToIpfs";
/**
 * @category API Routes
 */
export const AddBalancesToIpfsRoute = () => "/api/v0/addBalancesToIpfs";

//Blockin Auth
/**
 * @category API Routes
 */
export const GetSignInChallengeRoute = () => "/api/v0/auth/getChallenge";
/**
 * @category API Routes
 */
export const VerifySignInRoute = () => "/api/v0/auth/verify";
/**
 * @category API Routes
 */
export const SignOutRoute = () => "/api/v0/auth/logout";
/**
 * @category API Routes
 */
export const CheckIfSignedInRoute = () => '/api/v0/auth/status';

//Browse
/**
 * @category API Routes
 */
export const GetBrowseCollectionsRoute = () => "/api/v0/browse";

//Broadcasting
/**
 * @category API Routes
 */
export const BroadcastTxRoute = () => "/api/v0/broadcast";
/**
 * @category API Routes
 */
export const SimulateTxRoute = () => "/api/v0/simulate";

//Fetch arbitrary metadata
/**
 * @category API Routes
 */
export const FetchMetadataDirectlyRoute = () => "/api/v0/metadata";

//Faucet
/**
 * @category API Routes
 */
export const GetTokensFromFaucetRoute = () => "/api/v0/faucet";
