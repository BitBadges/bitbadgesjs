import { NumberType } from "../..";

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
export const GetBadgeBalanceByAddressRoute = (collectionId: NumberType, cosmosAddress: string) => `/api/v0/collection/${collectionId.toString()}/balance/${cosmosAddress}`;
/**
 * @category API Routes
 */
export const GetBadgeActivityRoute = (collectionId: NumberType, badgeId: NumberType) => `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/activity`;
/**
 * @category API Routes
 */
export const RefreshMetadataRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refresh`;
/**
 * @category API Routes
 */
export const RefreshBadgeMetadataRoute = (collectionId: NumberType, badgeId: NumberType) => `/api/v0/collection/${collectionId.toString()}/${badgeId.toString()}/refresh`;
/**
 * @category API Routes
 */
export const GetRefreshStatusRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/refreshStatus`;
/**
 * @category API Routes
 */
export const GetAllPasswordsAndCodesRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/codes`;
/**
 * @category API Routes
 */
export const GetCodeForPasswordRoute = (collectionId: NumberType, cid: string, password: string) => `/api/v0/collection/${collectionId.toString()}/password/${cid}/${password}`;
/**
 * @category API Routes
 */
export const AddAnnouncementRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/addAnnouncement`;
/**
 * @category API Routes
 */
export const AddReviewForCollectionRoute = (collectionId: NumberType) => `/api/v0/collection/${collectionId.toString()}/addReview`;
/**
 * @category API Routes
 */
export const DeleteReviewRoute = (reviewId: string) => `/api/v0/deleteReview/${reviewId}`;
/**
 * @category API Routes
 */
export const DeleteAnnouncementRoute = (announcementId: string) => `/api/v0/deleteAnnouncement/${announcementId}`;

//Address Lists
/**
 * @category API Routes
 */
export const GetAddressListsRoute = () => "/api/v0/addressLists";

/**
 * @category API Routes
 */
export const UpdateAddressListRoute = () => "/api/v0/addressLists/update";


/**
 * @category API Routes
 */
export const DeleteAddressListRoute = () => "/api/v0/addressLists/delete";

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

//Note delete review is defined above

//IPFS
/**
 * @category API Routes
 */
export const AddMetadataToIpfsRoute = () => "/api/v0/addMetadataToIpfs";
/**
 * @category API Routes
 */
export const AddApprovalDetailsToOffChainStorageRoute = () => "/api/v0/addApprovalDetailsToOffChainStorage";
/**
 * @category API Routes
 */
export const AddBalancesToOffChainStorageRoute = () => "/api/v0/addBalancesToOffChainStorage";

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
/**
 * @category API Routes
 */
export const GenericVerifyRoute = () => "/api/v0/auth/genericVerify";



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


//Claim Alerts
/**
 * @category API Routes
 */
export const SendClaimAlertRoute = () => "/api/v0/claimAlerts/send";

/**
 * @category API Routes
 */
export const GetClaimAlertsRoute = () => "/api/v0/claimAlerts";


//Blockin Auth Codes

/**
 * @category API Routes
 */
export const GetAuthCodeRoute = () => "/api/v0/authCode";
/**
 * @category API Routes
 */
export const CreateAuthCodeRoute = () => "/api/v0/authCode/create";
/**
 * @category API Routes
 */
export const DeleteAuthCodeRoute = () => "/api/v0/authCode/delete";

//Address Surveys
/**
 * @category API Routes
 */
export const AddAddressToSurveyRoute = (editKey: string) => `/api/v0/survey/${editKey}/add`;


//Follow Protocol
/**
 * @category API Routes
 */
export const GetFollowDetailsRoute = () => "/api/v0/follow-protocol";

/**
 * @category API Routes
 */
export const GetProtocolsRoute = () => "/api/v0/protocols";

/**
 * @category API Routes
 */
export const GetCollectionForProtocolRoute = () => "/api/v0/protocols/collection";


/**
 * @category API Routes
 */
export const FilterBadgesInCollectionRoute = () => "/api/v0/collections/filter";
