// /**
//  * Fields for the MongoDB database document
//  *
//  * @category Indexer
//  */
// export interface Doc {
//   /** A unique stringified document ID */
//   _docId: string;

//   /** A uniuqe document ID (Mongo DB ObjectID) */
//   _id?: string;
// }

// /**
//  * If an error occurs, the response will be an ErrorResponse.
//  *
//  * 400 - Bad Request (e.g. invalid request body)
//  * 401 - Unauthorized (e.g. invalid session cookie; must sign in with Blockin)
//  * 500 - Internal Server Error
//  *
//  * @category API Requests / Responses
//  */
// export interface ErrorResponse {
//   /**
//    * Serialized error object for debugging purposes. Technical users can use this to debug issues.
//    */
//   error?: any;
//   /**
//    * UX-friendly error message that can be displayed to the user. Always present if error.
//    */
//   errorMessage: string;
//   /**
//    * Authentication error. Present if the user is not authenticated.
//    */
//   unauthorized?: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iBitBadgesCollection extends iCollectionDoc {
//   /** The fetched collection metadata for this collection. Will only be fetched if requested. It is your responsibility to join this data. */
//   cachedCollectionMetadata?: iMetadata;
//   /** The fetched badge metadata for this collection. Will only be fetched if requested. It is your responsibility to join this data. */
//   cachedBadgeMetadata: iBadgeMetadataDetails[];

//   /** The fetched activity for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
//   activity: iTransferActivityDoc[];
//   /** The fetched reviews for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
//   reviews: iReviewDoc[];
//   /** The fetched owners of this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
//   owners: iBalanceDoc[];
//   /** The fetched merkle challenges for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
//   merkleChallenges: iMerkleChallengeDoc[];
//   /** The fetched approval trackers for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
//   approvalTrackers: iApprovalTrackerDoc[];

//   /** The badge IDs in this collection that are marked as NSFW. */
//   nsfw?: { badgeIds: iUintRange[]; reason: string };
//   /** The badge IDs in this collection that have been reported. */
//   reported?: { badgeIds: iUintRange[]; reason: string };

//   /** The views for this collection and their pagination Doc. Views will only include the doc _ids. Use the pagination to fetch more. To be used in conjunction with activity, announcements, reviews, owners, merkleChallenges, and approvalTrackers. For example, if you want to fetch the activity for a view, you would use the view's pagination to fetch the doc _ids, then use the corresponding activity array to find the matching docs. */
//   views: {
//     [viewId: string]:
//       | {
//           ids: string[];
//           type: string;
//           pagination: PaginationInfo;
//         }
//       | undefined;
//   };

//   /** Details about any off-chain claims for this collection. Only applicable when outsourced to BitBadges. */
//   offChainClaims: {
//     claimId: string;
//     plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
//     balancesToSet: iIncrementedBalances;
//     manualDistribution?: boolean;
//   }[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iUpdateHistory {
//   txHash: string;
//   block: string | number;
//   blockTimestamp: string | number;
// }

// /**
//  * @category Indexer
//  */
// export interface ErrorDoc {
//   _docId: string;
//   _id?: string;
//   error: string;
//   function: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iNotificationPreferences {
//   email?: string;
//   emailVerification?: iEmailVerificationStatus;
//   preferences?: {
//     listActivity?: boolean;
//     transferActivity?: boolean;
//     claimAlerts?: boolean;
//   };
// }

// /**
//  * @category Interfaces
//  */
// export interface iEmailVerificationStatus {
//   verified?: boolean;
//   token?: string;
//   expiry?: string | number;
//   antiPhishingCode?: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iActivityDoc extends Doc {
//   /** The timestamp  of the activity. */
//   timestamp: string | number;

//   /** The block number of the activity. */
//   block: string | number;

//   /** Whether or not the notifications have been handled by the indexer or not. */
//   _notificationsHandled?: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iReviewDoc extends iActivityDoc {
//   /** The review text (max 2048 characters). */
//   review: string;
//   /** The number of stars given (1-5). */
//   stars: string | number;
//   /** The cosmos address of the user who gave the review. */
//   from: string;
//   /** The collection ID of the collection that was reviewed. Only applicable to collection reviews. */
//   collectionId?: string | number;
//   /** The cosmos address of the user who the review is for. Only applicable to user reviews. */
//   reviewedAddress?: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iTransferActivityDoc extends iActivityDoc {
//   /** The list of cosmos addresses that were involved in the activity. */
//   to: string[];
//   /** The list of cosmos addresses that were involved in the activity. */
//   from: string;
//   /** The list of balances and badge IDs that were transferred. */
//   balances: iBalance[];
//   /** The collection ID of the collection that was transferred. */
//   collectionId: string | number;
//   /** The memo of the transfer. */
//   memo?: string;
//   /** Which approval to use to precalculate the balances. */
//   precalculateBalancesFromApproval?: iApprovalIdentifierDetails;
//   /** The prioritized approvals of the transfer. */
//   prioritizedApprovals?: iApprovalIdentifierDetails[];
//   /** Whether or not to only check prioritized approvals. */
//   onlyCheckPrioritizedApprovals?: boolean;
//   /** The cosmos address of the user who initiated the activity. */
//   initiatedBy: string;
//   /** The transaction hash of the activity. */
//   txHash?: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iListActivityDoc extends iActivityDoc {
//   /** The list ID of the list. */
//   listId: string;
//   /** Whether or not the address is included in the list. Note that this could mean added to an whitelist or a blacklist */
//   addedToList?: boolean;
//   /** The list of addresses that were added or removed from the list. */
//   addresses?: string[];
//   /** The transaction hash of the activity. */
//   txHash?: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iClaimAlertDoc extends iActivityDoc {
//   /** The code of the claim alert. */
//   code?: string;
//   /** The cosmos addresses of the users that have been alerted. */
//   cosmosAddresses: string[];
//   /** The collection ID of the claim alert. */
//   collectionId: string | number;
//   /** The message of the claim alert. */
//   message?: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iCollectionDoc extends Doc {
//   /** The collection ID */
//   collectionId: string | number;
//   /** The collection metadata timeline */
//   collectionMetadataTimeline: iCollectionMetadataTimeline[];
//   /** The badge metadata timeline */
//   badgeMetadataTimeline: iBadgeMetadataTimeline[];
//   /** The type of balances (i.e. "Standard", "Off-Chain - Indexed", "Inherited, "Off-Chain - Non-Indexed") */
//   balancesType: 'Standard' | 'Off-Chain - Indexed' | 'Inherited' | 'Off-Chain - Non-Indexed';
//   /** The off-chain balances metadata timeline */
//   offChainBalancesMetadataTimeline: iOffChainBalancesMetadataTimeline[];
//   /** The custom data timeline */
//   customDataTimeline: iCustomDataTimeline[];
//   /** The manager timeline */
//   managerTimeline: iManagerTimeline[];
//   /** The collection permissions */
//   collectionPermissions: iCollectionPermissions;
//   /** The collection approved transfers timeline */
//   collectionApprovals: iCollectionApproval[];
//   /** The standards timeline */
//   standardsTimeline: iStandardsTimeline[];
//   /** The is archived timeline */
//   isArchivedTimeline: iIsArchivedTimeline[];
//   /** The default balances for users who have not interacted with the collection yet. Only used if collection has "Standard" balance type. */
//   defaultBalances: iUserBalanceStore;
//   /** The cosmos address of the user who created this collection */
//   createdBy: string;
//   /** The block number when this collection was created */
//   createdBlock: string | number;
//   /** The timestamp when this collection was created (milliseconds since epoch) */
//   createdTimestamp: string | number;
//   /** The update history of this collection */
//   updateHistory: {
//     txHash: string;
//     block: string | number;
//     blockTimestamp: string | number;
//   }[];
//   /** The alias cosmos address for the collection */
//   aliasAddress: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iAccountDoc {
//   /** The public key of the account */
//   publicKey: string;
//   /** The account number of the account */
//   accountNumber: string | number;
//   /** The public key type of the account */
//   pubKeyType: string;
//   /** The Eth address of the account */
//   ethAddress: string;
//   /** The Bitcoin address of the account */
//   btcAddress: string;
//   /** The sequence of the account */
//   sequence?: string | number;
//   /** The balance of the account */
//   balance?: iCosmosCoin;
// }

// /**
//  * CustomLinks are custom links that can be added to a profile.
//  *
//  * @category Interfaces
//  */
// export interface iCustomLink {
//   title: string;
//   url: string;
//   image: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iCustomPage {
//   title: string;
//   description: string;
//   items: iBatchBadgeDetails[];
// }

// /**
//  * CustomListPage is a custom list page that can be added to a profile. The items are valid list IDs.
//  *
//  * @category Interfaces
//  */
// export interface iCustomListPage {
//   title: string;
//   description: string;
//   items: string[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iProfileDoc extends Doc {
//   /** Whether we have already fetched the profile or not */
//   fetchedProfile?: boolean;

//   /** The timestamp of the last activity seen for this account (milliseconds since epoch) */
//   seenActivity?: string | number;
//   /** The timestamp of when this account was created (milliseconds since epoch) */
//   createdAt?: string | number;

//   /** The Discord username of the account */
//   discord?: string;
//   /** The Twitter username of the account */
//   twitter?: string;
//   /** The GitHub username of the account */
//   github?: string;
//   /** The Telegram username of the account */
//   telegram?: string;
//   /** The readme of the account */
//   readme?: string;

//   /** The custom links of the account */
//   customLinks?: iCustomLink[];

//   /** The hidden badges of the account */
//   hiddenBadges?: iBatchBadgeDetails[];
//   /** The hidden lists of the account */
//   hiddenLists?: string[];

//   /** The custom pages of the account */
//   customPages?: {
//     badges: iCustomPage[];
//     lists: iCustomListPage[];
//   };

//   /** The watched lists of the account's portfolio */
//   watchlists?: {
//     badges: iCustomPage[];
//     lists: iCustomListPage[];
//   };

//   /** The profile picture URL of the account */
//   profilePicUrl?: string;
//   /** The username of the account */
//   username?: string;

//   /** The latest chain the user signed in with */
//   latestSignedInChain?: SupportedChain;

//   /** The Solana address of the profile, if applicable (bc we need it to convert) */
//   solAddress?: string;

//   /** The notifications of the account */
//   notifications?: iNotificationPreferences;

//   /** Approved ways to sign in (rather than Blockin) */
//   approvedSignInMethods?: {
//     discord?: {
//       username: string;
//       discriminator?: string;
//       id: string;
//     };
//   };
// }

// /**
//  * @category Interfaces
//  */
// export interface iQueueDoc extends Doc {
//   /** The URI of the metadata to be fetched. If {id} is present, it will be replaced with each individual ID in badgeIds */
//   uri: string;
//   /** The collection ID of the metadata to be fetched */
//   collectionId: string | number;
//   /** The load balance ID of the metadata to be fetched. Only the node with the same load balance ID will fetch this metadata */
//   loadBalanceId: string | number;
//   /** The timestamp of when this metadata was requested to be refreshed (milliseconds since epoch) */
//   refreshRequestTime: string | number;
//   /** The number of times this metadata has been tried to be fetched but failed */
//   numRetries: string | number;
//   /** The timestamp of when this metadata was last fetched (milliseconds since epoch) */
//   lastFetchedAt?: string | number;
//   /** The error message if this metadata failed to be fetched */
//   error?: string;
//   /** The timestamp of when this document was deleted (milliseconds since epoch) */
//   deletedAt?: string | number;
//   /** The timestamp of when this document should be fetched next (milliseconds since epoch) */
//   nextFetchTime?: string | number;

//   //Only used for failed push notifications
//   emailMessage?: string;
//   recipientAddress?: string;
//   activityDocId?: string;
//   notificationType?: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iIndexerStatus {
//   status: iStatusDoc;
// }

// /**
//  * @category Interfaces
//  */
// export interface iLatestBlockStatus {
//   /** The height of the latest block */
//   height: string | number;
//   /** The transaction index of the latest block */
//   txIndex: string | number;
//   /** The timestamp of the latest block (milliseconds since epoch) */
//   timestamp: string | number;
// }

// /**
//  * @category Interfaces
//  */
// export interface iStatusDoc extends Doc {
//   /** The latest synced block status (i.e. height, txIndex, timestamp) */
//   block: iLatestBlockStatus;
//   /** The next collection ID to be used */
//   nextCollectionId: string | number;
//   /** The current gas price based on the average of the lastXGasAmounts */
//   gasPrice: number;
//   /** The last X gas prices */
//   lastXGasAmounts: (string | number)[];
//   /** The last X gas limits */
//   lastXGasLimits: (string | number)[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iAddressListEditKey {
//   /** The key that can be used to edit the address list */
//   key: string;
//   /** The expiration date of the key (milliseconds since epoch) */
//   expirationDate: string | number;
//   /** True if the user can only add their signed in address to the list */
//   mustSignIn?: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iAddressListDoc extends iAddressList, Doc {
//   // /** The cosmos address of the user who created this list */
//   // createdBy: string;
//   /** The update history of this list */
//   updateHistory: {
//     txHash: string;
//     block: string | number;
//     blockTimestamp: string | number;
//   }[];
//   /** The block number when this list was created */
//   createdBlock: string | number;
//   /** The timestamp of when this list was last updated (milliseconds since epoch) */
//   lastUpdated: string | number;
//   /** The NSFW reason if this list is NSFW */
//   nsfw?: { reason: string };
//   /** The reported reason if this list is reported */
//   reported?: { reason: string };
//   /** True if this list is private and will not show up in search results */
//   private?: boolean;
//   /** True if this list is viewable if queried by the list ID directly */
//   viewableWithLink?: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iBalanceDoc extends iUserBalanceStore, Doc {
//   /** The collection ID */
//   collectionId: string | number;

//   /** The Cosmos address of the user */
//   cosmosAddress: string;

//   /** True if the balances are on-chain */
//   onChain: boolean;

//   /** The URI of the off-chain balances */
//   uri?: string;

//   /** The timestamp of when the off-chain balances were fetched (milliseconds since epoch). For BitBadges indexer, we only populate this for Mint and Total docs. */
//   fetchedAt?: string | number;

//   /** The block number of when the off-chain balances were fetched. For BitBadges indexer, we only populate this for Mint and Total docs. */
//   fetchedAtBlock?: string | number;

//   /** True if the off-chain balances are using permanent storage */
//   isPermanent?: boolean;

//   /** The content hash of the off-chain balances */
//   contentHash?: string;

//   /** The update history of this balance */
//   updateHistory: {
//     txHash: string;
//     block: string | number;
//     blockTimestamp: string | number;
//   }[];
// }

// export type ClaimIntegrationPluginType =
//   | 'password'
//   | 'numUses'
//   | 'greaterThanXBADGEBalance'
//   | 'discord'
//   | 'codes'
//   | 'twitter'
//   | 'transferTimes'
//   | 'requiresProofOfAddress'
//   | 'whitelist'
//   | 'mustOwnBadges'
//   | 'api';

// export type JsonBodyInputWithValue = {
//   key: string;
//   label: string;
//   type?: 'date' | 'url';
//   value: string | number | boolean;
// };
// export type JsonBodyInputSchema = { key: string; label: string; type: 'date' | 'url' | 'string' | 'number' | 'boolean'; helper?: string };

// export type ClaimIntegrationPublicParamsType<T extends ClaimIntegrationPluginType> = T extends 'numUses'
//   ? {
//       maxUses: number;
//       maxUsesPerAddress?: number;
//       assignMethod: 'firstComeFirstServe' | 'codeIdx';
//     }
//   : T extends 'greaterThanXBADGEBalance'
//     ? {
//         minBalance: number;
//       }
//     : T extends 'discord'
//       ? {
//           users?: string[];
//           serverId?: string;
//           serverName?: string;
//           maxUsesPerUser?: number;
//         }
//       : T extends 'codes'
//         ? {
//             numCodes: number;
//           }
//         : T extends 'twitter'
//           ? {
//               users?: string[];
//               maxUsesPerUser?: number;
//             }
//           : T extends 'transferTimes'
//             ? {
//                 transferTimes: iUintRange[];
//               }
//             : T extends 'whitelist'
//               ? {
//                   listId?: string;
//                   list?: iAddressList;
//                 }
//               : T extends 'mustOwnBadges'
//                 ? {
//                     ownershipRequirements?: AndGroup<T> | OrGroup<T> | OwnershipRequirements<T>;
//                   }
//                 : T extends 'api'
//                   ? {
//                       apiCalls: ClaimApiCallInfo[];
//                     }
//                   : {};

// export interface ClaimApiCallInfo {
//   uri: string;
//   name: string;
//   description?: string;
//   passDiscord?: boolean;
//   passTwitter?: boolean;
//   bodyParams?: object;
//   userInputsSchema: Array<JsonBodyInputSchema>;
// }

// export type ClaimIntegrationPrivateParamsType<T extends ClaimIntegrationPluginType> = T extends 'password'
//   ? {
//       password: string;
//     }
//   : T extends 'codes'
//     ? {
//         codes: string[];
//         seedCode: string;
//       }
//     : T extends 'whitelist'
//       ? {
//           listId?: string;
//           list?: iAddressList;
//         }
//       : T extends 'twitter'
//         ? {
//             users?: string[];
//           }
//         : T extends 'discord'
//           ? {
//               users?: string[];
//               serverId?: string;
//               serverName?: string;
//             }
//           : T extends 'mustOwnBadges'
//             ? {
//                 ownershipRequirements?: AndGroup<T> | OrGroup<T> | OwnershipRequirements<T>;
//               }
//             : {};

// export type ClaimIntegrationPublicStateType<T extends ClaimIntegrationPluginType> = T extends 'numUses'
//   ? {
//       numUses: number;
//       claimedUsers: {
//         [cosmosAddress: string]: number[];
//       };
//     }
//   : T extends 'codes'
//     ? {
//         usedCodes: string[];
//       }
//     : {};

// export interface IntegrationPluginParams<T extends ClaimIntegrationPluginType> {
//   id: string | number;
//   publicParams: ClaimIntegrationPublicParamsType<T>;
//   privateParams: ClaimIntegrationPrivateParamsType<T>;
// }

// export interface IntegrationPluginDetails<T extends ClaimIntegrationPluginType> extends IntegrationPluginParams<T> {
//   publicState: ClaimIntegrationPublicStateType<T>;
//   resetState?: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iClaimBuilderDoc extends Doc {
//   /** The CID of the password document */
//   cid: string;
//   /** The cosmos address of the user who created this password */
//   createdBy: string;
//   /** True if the password document is claimed by the collection */
//   docClaimed: boolean;
//   /** The collection ID of the password document */
//   collectionId: string | number;

//   /** Dynamic checks to run in the form of plugins */
//   plugins: IntegrationPluginParams<ClaimIntegrationPluginType>[];

//   /** If true, the claim codes are to be distributed manually. This doc will only be used for storage purposes. */
//   manualDistribution?: boolean;

//   /** The current state of each plugin */
//   state: {
//     [pluginId: string]: any;
//   };

//   /** Details for the action to perform if the criteria is correct */
//   action: {
//     codes?: string[];
//     seedCode?: string;
//     balancesToSet?: iIncrementedBalances;
//     listId?: string;
//   };
// }

// /**
//  * @category Interfaces
//  */
// export interface iApprovalTrackerDoc extends iAmountTrackerIdDetails, Doc {
//   /** The number of transfers. Is an incrementing tally. */
//   numTransfers: string | number;
//   /** A tally of the amounts transferred for this approval. */
//   amounts: iBalance[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iChallengeTrackerIdDetails {
//   /** The collection ID */
//   collectionId: string | number;
//   /** The challenge ID */
//   challengeId: string;
//   /** The challenge level (i.e. "collection", "incoming", "outgoing") */
//   challengeLevel: 'collection' | 'incoming' | 'outgoing' | '';
//   /** The approver address (leave blank if challengeLevel = "collection") */
//   approverAddress: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iMerkleChallengeDoc extends Doc {
//   /** The collection ID */
//   collectionId: string | number;
//   /** The challenge ID */
//   challengeId: string;
//   /** The challenge level (i.e. "collection", "incoming", "outgoing") */
//   challengeLevel: 'collection' | 'incoming' | 'outgoing' | '';
//   /** The approver address (leave blank if challengeLevel = "collection") */
//   approverAddress: string;
//   /** The used leaf indices for each challenge. A leaf index is the leaf location in the bottommost layer of the Merkle tree */
//   usedLeafIndices: (string | number)[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iMerkleChallengeIdDetails {
//   /** The collection ID */
//   collectionId: string | number;
//   /** The challenge ID */
//   challengeId: string;
//   /** The challenge level (i.e. "collection", "incoming", "outgoing") */
//   challengeLevel: 'collection' | 'incoming' | 'outgoing' | '';
//   /** The approver address (leave blank if challengeLevel = "collection") */
//   approverAddress: string;
//   /** The used leaf indices for each challenge. A leaf index is the leaf location in the bottommost layer of the Merkle tree */
//   usedLeafIndices: (string | number)[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iFetchDoc extends Doc {
//   /** The content of the fetch document. Note that we store balances in BALANCES_DB and not here to avoid double storage. */
//   content?: iMetadata | iApprovalInfoDetails | iOffChainBalancesMap;
//   /** The time the document was fetched */
//   fetchedAt: string | number;
//   /** The block the document was fetched */
//   fetchedAtBlock: string | number;
//   /** The type of content fetched. This is used for querying purposes */
//   db: 'ApprovalInfo' | 'Metadata' | 'Balances';
//   /** True if the document is permanent (i.e. fetched from a permanent URI like IPFS) */
//   isPermanent: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iRefreshDoc extends Doc {
//   /** The collection ID */
//   collectionId: string | number;
//   /** The time the refresh was requested (Unix timestamp in milliseconds) */
//   refreshRequestTime: string | number;
// }

// /**
//  * @category Interfaces
//  */
// export interface iAirdropDoc extends Doc {
//   /** True if the airdrop has been completed */
//   airdropped: boolean;
//   /** The timestamp of when the airdrop was completed (milliseconds since epoch) */
//   timestamp: string | number;
//   /** The hash of the airdrop transaction */
//   hash?: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iIPFSTotalsDoc extends Doc {
//   /** The total bytes uploaded */
//   bytesUploaded: string | number;
// }

// /**
//  * @category Interfaces
//  */
// export interface iComplianceDoc extends Doc {
//   badges: {
//     nsfw: iBatchBadgeDetails[];
//     reported: iBatchBadgeDetails[];
//   };
//   addressLists: {
//     nsfw: { listId: string; reason: string }[];
//     reported: { listId: string; reason: string }[];
//   };
//   accounts: {
//     nsfw: { cosmosAddress: string; reason: string }[];
//     reported: { cosmosAddress: string; reason: string }[];
//   };
// }

// /**
//  * @category Interfaces
//  */
// export interface iBlockinAuthSignatureDoc extends Doc {
//   signature: string;

//   name: string;
//   description: string;
//   image: string;

//   cosmosAddress: string;
//   params: ChallengeParams<string | number>;

//   createdAt: string | number;
//   deletedAt?: string | number;
// }

// /**
//  * @category Interfaces
//  */
// export interface iFollowDetailsDoc extends Doc {
//   /** The Cosmos address of the user */
//   cosmosAddress: string;
//   /** The number of users that the user is following */
//   followingCount: string | number;
//   /** The number of users that are following the user */
//   followersCount: string | number;
//   /** The followers of the user */
//   followers: string[];
//   /** The following of the user */
//   following: string[];

//   /** The collection ID of the following collection */
//   followingCollectionId: string | number;
// }

// /**
//  * @category Interfaces
//  */
// export interface iProtocolDoc extends iProtocol, Doc {}

// /**
//  * @category Interfaces
//  */
// export interface iUserProtocolCollectionsDoc extends Doc {
//   protocols: {
//     [protocolName: string]: string | number;
//   };
// }

// /**
//  * @category Interfaces
//  */
// export interface iBadgeMetadataDetails {
//   /** The metadata ID for the fetched URI. Metadata IDs map an ID to each unique URI. See BitBadges Docs for more information. */
//   metadataId?: string | number;
//   /** The badge IDs that correspond to the metadata */
//   badgeIds: iUintRange[];
//   /** The metadata fetched by the URI */
//   metadata: iMetadata;
//   /** The URI that the metadata was fetched from */
//   uri?: string;
//   /** Custom data */
//   customData?: string;
//   /** Flag to denote if the metadata is new and should be updated. Used internally. */
//   toUpdate?: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iMetadata {
//   /** The name of the badge or badge collection. */
//   name: string;
//   /** The description of the badge or badge collection. */
//   description: string;
//   /** The image of the badge or badge collection. */
//   image: string;
//   /** The video of the badge or badge collection. If a standard video is used, this should be a link to the video. We will use image as the poster image. If a youtube video is used, we embed it as an iframe. */
//   video?: string;
//   /** The creator of the badge or badge collection. */
//   creator?: string;
//   /** The color of the badge or badge collection. */
//   color?: string;
//   /** The category of the badge or badge collection (e.g. "Education", "Attendance"). */
//   category?: string;
//   /** The external URL of the badge or badge collection. */
//   externalUrl?: string;
//   /** The tags of the badge or badge collection */
//   tags?: string[];

//   /** The socials of the badge or badge collection */
//   socials?: {
//     [key: string]: string;
//   };

//   /** The off-chain transferability info of the badge or badge collection */
//   offChainTransferabilityInfo?: {
//     host: string;
//     assignMethod: string;
//   };

//   /** The attributes of the badge or badge collection */
//   attributes?: {
//     type?: 'date' | 'url';
//     name: string;
//     value: string | number | boolean;
//   }[];

//   /** The block the metadata was fetched at. */
//   fetchedAtBlock?: string | number;
//   /** The time the metadata was fetched. */
//   fetchedAt?: string | number;
//   /** Whether the metadata is currently being updated. */
//   _isUpdating?: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iBitBadgesAddressList extends iAddressListDoc {
//   /** The metadata of the address list. */
//   metadata?: iMetadata;
//   /** The activity of the address list. */
//   listsActivity: iListActivityDoc[];
//   /** The views of the address list. */
//   views: {
//     [viewId: string]: {
//       ids: string[];
//       type: string;
//       pagination: PaginationInfo;
//     };
//   };

//   editClaims: {
//     claimId: string;
//     plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
//   }[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetAddressListsRouteRequestBody {
//   /**
//    * The lists and accompanyin details to fetch. Supports on-chain, off-chain, and reserved lists.
//    */
//   listsToFetch: {
//     listId: string;
//     viewsToFetch?: {
//       viewId: string;
//       viewType: 'listActivity';
//       bookmark: string;
//     }[];
//     fetchPrivateParams?: boolean;
//   }[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetAddressListsRouteSuccessResponse {
//   addressLists: iBitBadgesAddressList[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface UpdateAddressListsRouteRequestBody {
//   /**
//    * New address lists to update.
//    * Requester must be creator of the lists.
//    * Only applicable to off-chain balances.
//    */
//   addressLists: (iAddressList & {
//     //Whether the list is private.
//     private?: boolean;

//     editClaims: {
//       claimId: string;
//       plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
//     }[];

//     viewableWithLink?: boolean;
//   })[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iUpdateAddressListsRouteSuccessResponse {}
// /**
//  * @category API Requests / Responses
//  */

// /**
//  * @category API Requests / Responses
//  */
// export interface DeleteAddressListsRouteRequestBody {
//   /**
//    * The list IDs to delete.
//    */
//   listIds: string[];
// }
// /**
//  * @category API Requests / Responses
//  */
// export interface iDeleteAddressListsRouteSuccessResponse {}
// /**
//  * @category API Requests / Responses
//  */

// /**
//  * @category Interfaces
//  */
// export interface iBitBadgesUserInfo extends iProfileDoc, iAccountDoc {
//   /** The resolved name of the account (e.g. ENS name). */
//   resolvedName?: string;
//   /** The avatar of the account. */
//   avatar?: string;
//   /** The chain of the account. */
//   chain: SupportedChain;
//   /** Indicates whether the account has claimed their airdrop. */
//   airdropped?: boolean;
//   /** A list of badges that the account has collected. Paginated and fetched as needed. To be used in conjunction with views. */
//   collected: iBalanceDoc[];
//   /** A list of transfer activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
//   activity: iTransferActivityDoc[];
//   /** A list of list activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
//   listsActivity: iListActivityDoc[];
//   /** A list of review activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
//   reviews: iReviewDoc[];
//   /** A list of merkle challenge activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
//   merkleChallenges: iMerkleChallengeDoc[];
//   /** A list of approvals tracker activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
//   approvalTrackers: iApprovalTrackerDoc[];
//   /** A list of address lists for the account. Paginated and fetched as needed. To be used in conjunction with views. */
//   addressLists: iBitBadgesAddressList[];
//   /** A list of claim alerts for the account. Paginated and fetched as needed. To be used in conjunction with views. */
//   claimAlerts: iClaimAlertDoc[];
//   /** A list of auth codes for the account. Paginated and fetched as needed. To be used in conjunction with views. */
//   authCodes: iBlockinAuthSignatureDoc[];

//   /** The native address of the account */
//   address: string;

//   /** Indicates whether the account is NSFW. */
//   nsfw?: { [badgeId: string]: string };
//   /** Indicates whether the account has been reported. */
//   reported?: { [badgeId: string]: string };

//   /** The views for this collection and their pagination Doc. Views will only include the doc _ids. Use the pagination to fetch more. To be used in conjunction with activity, announcements, reviews, owners, merkleChallenges, and approvalTrackers. For example, if you want to fetch the activity for a view, you would use the view's pagination to fetch the doc _ids, then use the corresponding activity array to find the matching docs. */
//   views: {
//     [viewId: string]:
//       | {
//           ids: string[];
//           type: string;
//           pagination: PaginationInfo;
//         }
//       | undefined;
//   };

//   /** The alias for the account. */
//   alias?: {
//     collectionId?: string | number;
//     listId?: string;
//   };
// }

// // export interface TestInterface extends iProfileDoc, iAccountDoc {}

// /**
//  * AccountMap is used to store the user information by address.
//  *
//  * @typedef {Object} AccountMap
//  *
//  * @category Indexer
//  */
// export interface AccountMap {
//   [cosmosAddress: string]: iBitBadgesUserInfo | undefined;
// }

// /**
//  * The supported view keys for fetching account details.
//  *
//  * @category API Requests / Responses
//  */
// export type AccountViewKey =
//   | 'createdLists'
//   | 'privateLists'
//   | 'authCodes'
//   | 'transferActivity'
//   | 'reviews'
//   | 'badgesCollected'
//   | 'claimAlerts'
//   | 'allLists'
//   | 'whitelists'
//   | 'blacklists'
//   | 'createdBadges'
//   | 'managingBadges'
//   | 'listsActivity';

// /**
//  * This defines the options for fetching additional account details.
//  *
//  * A view is a way of fetching additional details about an account, and these will be queryable in the response via the `views` property.
//  *
//  * Each view has a bookmark that is used for pagination and must be supplied to get the next page.
//  *
//  * We support the following views:
//  * - `transferActivity` - Fetches the latest activity for the account.
//  * - `latestAnnouncements` - Fetches the latest announcements for the account.
//  * - `reviews` - Fetches the latest reviews for the account.
//  * - `badgesCollected` - Fetches the badges collected by the account sequentially in random order.
//  *
//  * @typedef {Object} AccountFetchDetails
//  *
//  * @property {string} [address] - If present, the account corresponding to the specified address will be fetched. Please only specify one of `address` or `username`.
//  * @property {string} [username] - If present, the account corresponding to the specified username will be fetched. Please only specify one of `address` or `username`.
//  * @property {boolean} [fetchSequence] - If true, the sequence will be fetched from the blockchain.
//  * @property {boolean} [fetchBalance] - If true, the $BADGE balance will be fetched from the blockchain.
//  * @property {boolean} [noExternalCalls] - If true, only fetches local information stored in DB. Nothing external like resolved names, avatars, etc.
//  * @property {Array<{ viewType: string, bookmark: string }>} [viewsToFetch] - An array of views to fetch with associated bookmarks.
//  *
//  * @category API Requests / Responses
//  */
// export type AccountFetchDetails = {
//   address?: string;
//   username?: string;
//   /** If true, we will fetch the sequence from the blockchain. */
//   fetchSequence?: boolean;
//   /** If true, we will fetch the $BADGE balance from the blockchain. */
//   fetchBalance?: boolean;
//   /** If true, we will avoid external API calls. */
//   noExternalCalls?: boolean;
//   /** An array of views to fetch */
//   viewsToFetch?: {
//     /** Unique view ID. Used for pagination. All fetches w/ same ID should be made with same criteria. */
//     viewId: string;
//     /** The base view type to fetch. */
//     viewType: AccountViewKey;
//     /** If defined, we will filter the view to only include the specified collections. */
//     specificCollections?: iBatchBadgeDetails[];
//     /** If defined, we will filter the view to only include the specified lists. */
//     specificLists?: string[];
//     /** Oldest first. By default, we fetch newest */
//     oldestFirst?: boolean;
//     /** A bookmark to pass in for pagination. "" for first request. */
//     bookmark: string;
//   }[];
// };

// /**
//  * @category API Requests / Responses
//  */
// export interface GetAccountsRouteRequestBody {
//   accountsToFetch: AccountFetchDetails[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetAccountsRouteSuccessResponse {
//   accounts: iBitBadgesUserInfo[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetFollowDetailsRouteRequestBody {
//   cosmosAddress: string;

//   followingBookmark?: string;
//   followersBookmark?: string;

//   protocol?: string;
//   activityBookmark?: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetFollowDetailsRouteSuccessResponse extends iFollowDetailsDoc {
//   followersPagination: PaginationInfo;
//   followingPagination: PaginationInfo;

//   activity: iTransferActivityDoc[];
//   activityPagination: PaginationInfo;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface FilterBadgesInCollectionRequestBody {
//   /** The collection ID to filter */
//   collectionId: string | number;
//   /** Limit to specific badge IDs. Leave undefined to not filter by badge ID. */
//   badgeIds?: iUintRange[];
//   /** Limit to specific lists. Leave undefined to not filter by list. */
//   categories?: string[];
//   /** Limit to specific lists. Leave undefined to not filter by list. */
//   tags?: string[];

//   /** mostViewed is a special view that sorts by most viewed badges. May be incompatible with other filters. */
//   mostViewed?: 'daily' | 'allTime' | 'weekly' | 'monthly' | 'yearly';
//   /** Pagination bookmark. Leave undefined or "" for first request. */
//   bookmark?: string;

//   /** Attribute queries */
//   attributes?: {
//     name: string;
//     value: string | number | boolean;
//   }[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iFilterBadgesInCollectionSuccessResponse {
//   badgeIds: iUintRange[];
//   pagination: PaginationInfo;
// }

// /**
//  * Type for pagination information.
//  * @typedef {Object} PaginationInfo
//  * @property {string} bookmark - The bookmark to be used to fetch the next X documents. Initially, bookmark should be '' (empty string) to fetch the first X documents. Each time the next X documents are fetched, the bookmark should be updated to the bookmark returned by the previous fetch.
//  * @property {boolean} hasMore - Indicates whether there are more documents to be fetched. Once hasMore is false, all documents have been fetched.
//  *
//  * @category Indexer
//  */
// export interface PaginationInfo {
//   bookmark: string;
//   hasMore: boolean;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetOwnersForBadgeRouteRequestBody {
//   /**
//    * The pagination bookmark for where to start the request. Bookmarks are obtained via the previous response. "" for first request.
//    */
//   bookmark?: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetOwnersForBadgeRouteSuccessResponse {
//   /**
//    * Represents a list of owners balance details.
//    */
//   owners: iBalanceDoc[];
//   /**
//    * Represents pagination information.
//    */
//   pagination: PaginationInfo;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetBadgeBalanceByAddressRouteRequestBody {}

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetBadgeBalanceByAddressRouteSuccessResponse extends iBalanceDoc {}

// /**
//  * @category API Requests / Responses
//  */
// export interface GetBadgeActivityRouteRequestBody {
//   /**
//    * An optional bookmark for pagination. Bookmarks are obtained via the previous response. "" for first request.
//    */
//   bookmark?: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetBadgeActivityRouteSuccessResponse {
//   /**
//    * Array of transfer activity information.
//    */
//   activity: iTransferActivityDoc[];
//   /**
//    * Pagination information.
//    */
//   pagination: PaginationInfo;
// }

// /**
//  * Defines the options for fetching metadata.
//  *
//  * @typedef {Object} MetadataFetchOptions
//  * @property {boolean} [doNotFetchCollectionMetadata] - If true, collection metadata will not be fetched.
//  * @property {NumberType[] | UintRange[]} [metadataIds] - If present, the metadata corresponding to the specified metadata IDs will be fetched. See documentation for how to determine metadata IDs.
//  * @property {string[]} [uris] - If present, the metadata corresponding to the specified URIs will be fetched.
//  * @property {NumberType[] | UintRange[]} [badgeIds] - If present, the metadata corresponding to the specified badge IDs will be fetched.
//  *
//  * @category API Requests / Responses
//  */
// export interface MetadataFetchOptions {
//   /**
//    * If true, collection metadata will not be fetched.
//    */
//   doNotFetchCollectionMetadata?: boolean;
//   /**
//    * If present, the metadata corresponding to the specified metadata IDs will be fetched.
//    * Metadata IDs are helpful when determining UNQIUE URIs to be fetched.
//    *
//    * If badges 1-10000 all share the same URI, they will have the same single metadata ID.
//    * If badge 1 has a different URI than badges 2-10000, badge 1 will have a different metadata ID than the rest/
//    *
//    * We scan in increasing order of badge IDs, so metadata ID 1 will be for badge 1-X, metadata ID 2 will be for badge X+1-Y, etc.
//    *
//    * ID 0 = Collection metadata fetch
//    * ID 1 = First badge metadata fetch
//    * ID 2 = Second badge metadata fetch (if present)
//    * And so on
//    * Learn more in documentation.
//    */
//   metadataIds?: string | number[] | iUintRange[];
//   /**
//    * If present, the metadata corresponding to the specified URIs will be fetched.
//    */
//   uris?: string[];
//   /**
//    * If present, the metadata corresponding to the specified badge IDs will be fetched.
//    */
//   badgeIds?: string | number[] | iUintRange[];
// }

// /**
//  * Supported view keys for fetching additional collection details.
//  *
//  * @category API Requests / Responses
//  */
// export type CollectionViewKey = 'transferActivity' | 'reviews' | 'owners' | 'amountTrackers' | 'challengeTrackers';

// /**
//  * Defines the options for fetching additional collection details.
//  *
//  * A view is a way of fetching additional details about a collection, and these will be queryable in the response via the `views` property.
//  * Each view has a bookmark that is used for pagination and must be supplied to get the next page.
//  * If the bookmark is not supplied, the first page will be returned.
//  *
//  * We support the following views:
//  * - `transferActivity` - Fetches the latest activity for the collection.
//  * - `latestAnnouncements` - Fetches the latest announcements for the collection.
//  * - `reviews` - Fetches the latest reviews for the collection.
//  * - `owners` - Fetches the owners of the collection sequentially in random order.
//  * - `merkleChallenges` - Fetches the merkle challenges for the collection in random order.
//  * - `approvalTrackers` - Fetches the approvals trackers for the collection in random order.
//  *
//  * @typedef {Object} GetAdditionalCollectionDetailsRequestBody
//  * @property {{ viewType: string, bookmark: string }[]} [viewsToFetch] - If present, the specified views will be fetched.
//  * @property {boolean} [fetchTotalAndMintBalances] - If true, the total and mint balances will be fetched.
//  * @property {string[]} [challengeTrackersToFetch] - If present, the merkle challenges corresponding to the specified merkle challenge IDs will be fetched.
//  * @property {AmountTrackerIdDetails[]} [approvalTrackersToFetch] - If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
//  * @category API Requests / Responses
//  */
// export interface GetAdditionalCollectionDetailsRequestBody {
//   /**
//    * If present, the specified views will be fetched.
//    */
//   viewsToFetch?: {
//     /** The base view type to fetch. */
//     viewType: CollectionViewKey;
//     /** A unique view ID. This is used for pagination. All fetches w/ same ID should be made with same criteria. */
//     viewId: string;
//     /** A bookmark to pass in for pagination. "" for first request. */
//     bookmark: string;
//     /** If defined, we will return the oldest items first. */
//     oldestFirst?: boolean;
//   }[];

//   /**
//    * If true, the total and mint balances will be fetched and will be put in owners[].
//    *
//    * collection.owners.find(x => x.cosmosAddresss === 'Mint')
//    */
//   fetchTotalAndMintBalances?: boolean;
//   /**
//    * If present, the merkle challenges corresponding to the specified merkle challenge IDs will be fetched.
//    */
//   challengeTrackersToFetch?: iChallengeTrackerIdDetails[];
//   /**
//    * If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
//    */
//   approvalTrackersToFetch?: iAmountTrackerIdDetails[];
//   /**
//    * If true, we will append defaults with empty values.
//    */
//   handleAllAndAppendDefaults?: boolean;
//   /**
//    * Fetches private parameters for any claims in addition to public parameters.
//    */
//   fetchPrivateParams?: boolean;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetMetadataForCollectionRequestBody {
//   /**
//    * If present, we will fetch the metadata corresponding to the specified options.
//    *
//    * Consider using pruneMetadataToFetch for filtering out previously fetched metadata.
//    */
//   metadataToFetch?: MetadataFetchOptions;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetCollectionBatchRouteRequestBody {
//   collectionsToFetch: ({
//     /**
//      * The ID of the collection to fetch.
//      */
//     collectionId: string | number;
//   } & GetMetadataForCollectionRequestBody &
//     GetAdditionalCollectionDetailsRequestBody)[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetCollectionBatchRouteSuccessResponse {
//   collections: iBitBadgesCollection[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetCollectionByIdRouteRequestBody extends GetAdditionalCollectionDetailsRequestBody, GetMetadataForCollectionRequestBody {}

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetCollectionByIdRouteSuccessResponse {
//   collection: iBitBadgesCollection;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface RefreshMetadataRouteRequestBody {}

// /**
//  * @category API Requests / Responses
//  */
// export interface iRefreshMetadataRouteSuccessResponse {}
// /**
//  * @category API Requests / Responses
//  */

// /**
//  * @category API Requests / Responses
//  */
// export interface RefreshStatusRouteRequestBody {}

// /**
//  * @category API Requests / Responses
//  */
// export interface iRefreshStatusRouteSuccessResponse {
//   /**
//    * Boolean indicating if the collection is currently in the queue.
//    */
//   inQueue: boolean;
//   /**
//    * Array of error documents corresponding to the collection.
//    */
//   errorDocs: iQueueDoc[];
//   /**
//    * The status information corresponding to the collection.
//    */
//   refreshDoc: iRefreshDoc;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetProtocolsRouteRequestBody {
//   names: string[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetProtocolsRouteSuccessResponse {
//   protocols: iProtocol[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iProtocol {
//   /** The name of the protocol. */
//   name: string;
//   /** The URI of the protocol. */
//   uri: string;
//   /** The custom data of the protocol. */
//   customData: string;
//   /** The cosmos address of the user who created the protocol. */
//   createdBy: string;
//   /** Whether the protocol is frozen or not. */
//   isFrozen: boolean;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetCollectionForProtocolRouteRequestBody {
//   name: string;
//   address: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetCollectionForProtocolRouteSuccessResponse {
//   collectionId: string | number;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetStatusRouteRequestBody {}

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetStatusRouteSuccessResponse {
//   /**
//    * Includes status details about the indexer / blockchain.
//    */
//   status: iStatusDoc;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetSearchRouteRequestBody {
//   /** If true, we will skip all collection queries. */
//   noCollections?: boolean;
//   /** If true, we will skip all account queries. */
//   noAccounts?: boolean;
//   /** If true, we will skip all address list queries. */
//   noAddressLists?: boolean;
//   /** If true, we will skip all badge queries. */
//   noBadges?: boolean;
//   /** If true, we will limit collection results to a single collection. */
//   specificCollectionId?: string | number;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetSearchRouteSuccessResponse {
//   collections: iBitBadgesCollection[];
//   accounts: iBitBadgesUserInfo[];
//   addressLists: iBitBadgesAddressList[];
//   badges: {
//     collection: iBitBadgesCollection;
//     badgeIds: iUintRange[];
//   }[];
// }

// /**
//  * Type to allow specifying codes and passwords for a merkle challenge.
//  *
//  * We only support storing codes and passwords for merkle challenges created by BitBadges via IPFS.
//  * The IPFS CID of the merkle challenge is used to identify the merkle challenge.
//  *
//  * Note that we only support storing a set of codes and passwords once per unique CID.
//  *
//  * @category API Requests / Responses
//  */
// export interface CodesAndPasswords {
//   /**
//    * The IPFS CID of the merkle challenge.
//    */
//   cid: string;
//   codes: string[];
//   password: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetClaimsRouteRequestBody {
//   claimIds: string[];
//   listId?: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetClaimsRouteSuccessResponse {
//   claims: {
//     claimId: string;
//     balancesToSet?: iIncrementedBalances;
//     plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
//     manualDistribution?: boolean;
//   }[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface CheckAndCompleteClaimRouteRequestBody {
//   [pluginId: string]: any;
//   prevCodesOnly?: boolean;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iCheckAndCompleteClaimRouteSuccessResponse {
//   code?: string;
//   prevCodes?: string[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface DeleteReviewRouteRequestBody {
//   /**
//    * The review ID to delete.
//    */
//   reviewId: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iDeleteReviewRouteSuccessResponse {}

// /**
//  * @category API Requests / Responses
//  */

// /**
//  * @category API Requests / Responses
//  */
// export interface AddReviewForCollectionRouteRequestBody {
//   /**
//    * The review text (1 to 2048 characters).
//    */
//   review: string;

//   /**
//    * The star rating (1 to 5).
//    */
//   stars: string | number;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iAddReviewForCollectionRouteSuccessResponse {}

// /**
//  * @category API Requests / Responses
//  */

// /**
//  * @category API Requests / Responses
//  */
// export interface AddReviewForUserRouteRequestBody {
//   /**
//    * The review text (1 to 2048 characters).
//    */
//   review: string;

//   /**
//    * The number of stars (1 to 5) for the review.
//    */
//   stars: string | number;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iAddReviewForUserRouteSuccessResponse {}
// /**
//  * @category API Requests / Responses
//  */

// /**
//  * @category API Requests / Responses
//  */
// export interface UpdateAccountInfoRouteRequestBody {
//   /**
//    * The Discord username.
//    */
//   discord?: string;

//   /**
//    * The Twitter username.
//    */
//   twitter?: string;

//   /**
//    * The GitHub username.
//    */
//   github?: string;

//   /**
//    * The Telegram username.
//    */
//   telegram?: string;

//   /**
//    * The last seen activity timestamp.
//    */
//   seenActivity?: string | number;

//   /**
//    * The README details.
//    */
//   readme?: string;

//   /**
//    * The badges to hide and not view for this profile's portfolio
//    */
//   hiddenBadges?: iBatchBadgeDetails[];

//   /**
//    * The lists to hide and not view for this profile's portfolio
//    */
//   hiddenLists?: string[];

//   /**
//    * An array of custom pages on the user's portolio. Used to customize, sort, and group badges / lists into pages.
//    */
//   customPages?: {
//     badges: iCustomPage[];
//     lists: iCustomListPage[];
//   };

//   /**
//    * The watchlist of badges / lists
//    */
//   watchlists?: {
//     badges: iCustomPage[];
//     lists: iCustomListPage[];
//   };

//   /**
//    * The profile picture URL.
//    */
//   profilePicUrl?: string;

//   /**
//    * The username.
//    */
//   username?: string;

//   /**
//    * The profile picture image file. We will then upload to our CDN.
//    */
//   profilePicImageFile?: any;

//   /**
//    * The notification preferences for the user.
//    */
//   notifications?: {
//     email?: string;
//     antiPhishingCode?: string;
//     preferences?: {};
//   };

//   /**
//    * Approved sign in methods
//    */
//   approvedSignInMethods?: {
//     discord?: {
//       username: string;
//       discriminator?: string;
//       id: string;
//     };
//   };
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iUpdateAccountInfoRouteSuccessResponse {}

// /**
//  * @category API Requests / Responses
//  */

// /**
//  * @category API Requests / Responses
//  */
// export interface AddBalancesToOffChainStorageRouteRequestBody {
//   /**
//    * A map of Cosmos addresses or list IDs -> Balance[].
//    */
//   balances?: iOffChainBalancesMap;

//   /**
//    * The claim details
//    */
//   offChainClaims?: {
//     claimId: string;
//     plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
//     balancesToSet?: iIncrementedBalances;
//   }[];

//   /**
//    * The method for storing balances (ipfs or centralized).
//    */
//   method: 'ipfs' | 'centralized';

//   /**
//    * The collection ID.
//    */
//   collectionId: string | number;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iAddBalancesToOffChainStorageRouteSuccessResponse {
//   /**
//    * The URI of the stored data.
//    */
//   uri?: string;

//   /**
//    * The result object with CID.
//    */
//   result: {
//     cid?: string;
//   };
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface AddMetadataToIpfsRouteRequestBody {
//   /**
//    * The collection metadata to add to IPFS
//    */
//   collectionMetadata?: iMetadata;
//   /**
//    * The badge metadata to add to IPFS
//    */
//   badgeMetadata?: iBadgeMetadataDetails[] | iMetadata[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iAddMetadataToIpfsRouteSuccessResponse {
//   /**
//    * The result for collection metadata.
//    */
//   collectionMetadataResult?: {
//     cid: string;
//   };

//   /**
//    * An array of badge metadata results, if applicable.
//    */
//   badgeMetadataResults: {
//     cid: string;
//   }[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface AddApprovalDetailsToOffChainStorageRouteRequestBody {
//   /**
//    * The name of the approval.
//    */
//   name: string;

//   /**
//    * The description of the approval.
//    */
//   description: string;

//   /**
//    * The challenge details.
//    */
//   challengeDetails?: iChallengeDetails;

//   offChainClaims?: {
//     /**
//      * The plugins for the approval.
//      */
//     plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
//     claimId: string;
//     manualDistribution?: boolean;
//   }[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iAddApprovalDetailsToOffChainStorageRouteSuccessResponse {
//   /**
//    * The result with CID for IPFS.
//    */
//   result: {
//     cid: string;
//   };
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetSignInChallengeRouteRequestBody {
//   /**
//    * The blockchain to be signed in with.
//    */
//   chain: SupportedChain;

//   /**
//    * The user's blockchain address (their native L1 address).
//    */
//   address: string;

//   /**
//    * The number of hours to be signed in for.
//    */
//   hours?: string | number;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetSignInChallengeRouteSuccessResponse {
//   /**
//    * The nonce for the challenge.
//    */
//   nonce: string;

//   /**
//    * The challenge parameters.
//    */
//   params: ChallengeParams<string | number>;

//   /**
//    * The Blockin challenge message to sign.
//    */
//   message: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface VerifySignInRouteRequestBody {
//   /**
//    * The original Blockin message
//    */
//   message: string;

//   /**
//    * The signature of the Blockin message
//    */
//   signature: string;

//   /**
//    * Required for some chains. The public key of the signer.
//    */
//   publicKey?: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iVerifySignInRouteSuccessResponse {}

// /**
//  * @category API Requests / Responses
//  */

// /**
//  * @category API Requests / Responses
//  */
// export interface CheckSignInStatusRequestBody {}

// /**
//  * @category API Requests / Responses
//  */
// export interface iCheckSignInStatusRequestSuccessResponse {
//   /**
//    * Indicates whether the user is signed in.
//    */
//   signedIn: boolean;

//   /**
//    * The Blockin message that was signed.
//    */
//   message: string;

//   /**
//    * Signed in with Discord username and discriminator?
//    */
//   discord?: {
//     username: string;
//     discriminator: string;
//     id: string;
//   };

//   /**
//    * Signed in with Twitter username?
//    */
//   twitter?: {
//     id: string;
//     username: string;
//   };
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface SignOutRequestBody {
//   signOutDiscord: boolean;
//   signOutTwitter: boolean;
//   signOutBlockin: boolean;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iSignOutSuccessResponse {}
// /**
//  * @category API Requests / Responses
//  */

// /**
//  * @category API Requests / Responses
//  */
// export interface GetBrowseCollectionsRouteRequestBody {}

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetBrowseCollectionsRouteSuccessResponse {
//   collections: { [category: string]: iBitBadgesCollection[] };
//   addressLists: { [category: string]: iBitBadgesAddressList[] };
//   profiles: { [category: string]: iBitBadgesUserInfo[] };
//   activity: iTransferActivityDoc[];
//   badges: {
//     [category: string]: {
//       collection: iBitBadgesCollection;
//       badgeIds: iUintRange[];
//     }[];
//   };
// }

// /**
//  * @category API Requests / Responses
//  */
// export type BroadcastTxRouteRequestBody = BroadcastPostBody;

// /**
//  * @category API Requests / Responses
//  */
// export interface iBroadcastTxRouteSuccessResponse {
//   /**
//    * The response from the blockchain for the broadcasted tx.
//    * See Cosmos SDK documentation for what each field means.
//    */
//   tx_response: {
//     code: number;
//     codespace: string;
//     data: string;
//     events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[];
//     gas_wanted: string;
//     gas_used: string;
//     height: string;
//     Doc: string;
//     logs: {
//       events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[];
//     }[];
//     raw_log: string;
//     timestamp: string;
//     tx: object | null;
//     txhash: string;
//   };
// }

// /**
//  * @category API Requests / Responses
//  */
// export type SimulateTxRouteRequestBody = BroadcastPostBody;

// /**
//  * @category API Requests / Responses
//  */
// export interface iSimulateTxRouteSuccessResponse {
//   /**
//    * How much gas was used in the simulation.
//    */
//   gas_info: { gas_used: string; gas_wanted: string };
//   /**
//    * The result of the simulation.
//    */
//   result: {
//     data: string;
//     log: string;
//     events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[];
//   };
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface FetchMetadataDirectlyRouteRequestBody {
//   uris: string[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iFetchMetadataDirectlyRouteSuccessResponse {
//   metadata: iMetadata[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetTokensFromFaucetRouteRequestBody {}

// /**
//  * @category API Requests / Responses
//  */
// export type iGetTokensFromFaucetRouteSuccessResponse = DeliverTxResponse;

// /**
//  * @category API Requests / Responses
//  */
// export interface SendClaimAlertsRouteRequestBody {
//   claimAlerts: {
//     collectionId: string | number;
//     message?: string;
//     recipientAddress: string;
//   }[];
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iSendClaimAlertsRouteSuccessResponse {}

// /**
//  * @category API Requests / Responses
//  */

// /**
//  * information returned by the REST API getAccount route.
//  *
//  * Note this should be converted into AccountDoc or BitBadgesUserInfo before being returned by the BitBadges API for consistency.
//  *
//  * @category API Requests / Responses
//  */
// export interface CosmosAccountResponse {
//   account_number: number;
//   sequence: number;
//   pub_key: {
//     key: string;
//   };
//   address: string;
// }

// /**
//  * Generic route to verify any Blockin request. Does not sign you in with the API. Used for custom Blockin integrations.
//  *
//  * @category API Requests / Responses
//  */
// export interface GenericBlockinVerifyRouteRequestBody extends VerifySignInRouteRequestBody {
//   /**
//    * Additional options for verifying the challenge.
//    */
//   options?: VerifyChallengeOptions;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGenericBlockinVerifyRouteSuccessResponse extends iVerifySignInRouteSuccessResponse {}

// /**
//  * @category API Requests / Responses
//  */
// export interface CreateBlockinAuthCodeRouteRequestBody {
//   name: string;
//   description: string;
//   image: string;

//   message: string;
//   signature: string;
//   publicKey?: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iCreateBlockinAuthCodeRouteSuccessResponse {}

// /**
//  * @category API Requests / Responses
//  */

// /**
//  * @category API Requests / Responses
//  */
// export interface GetBlockinAuthCodeRouteRequestBody {
//   signature: string;
//   options?: VerifyChallengeOptions;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetBlockinAuthCodeRouteSuccessResponse {
//   /**
//    * The corresponding message that was signed to obtain the signature.
//    */
//   message: string;
//   /**
//    * The converted Blockin params fort the message
//    */
//   params: BlockinChallengeParams;
//   /**
//    * Verification response
//    */
//   verificationResponse: {
//     /**
//      * Returns whether the current (message, signature) pair is valid and verified (i.e. signature is valid and any assets are owned).
//      */
//     success: boolean;
//     /**
//      * Returns the response message returned from Blockin verification.
//      */
//     errorMessage?: string;
//   };
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface DeleteBlockinAuthCodeRouteRequestBody {
//   signature: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iDeleteBlockinAuthCodeRouteSuccessResponse {}

// /**
//  * @category API Requests / Responses
//  */

// /**
//  * @category API Requests / Responses
//  */
// export interface GenerateAppleWalletPassRouteRequestBody {
//   name: string;
//   description: string;
//   message: string;
//   signature: string;
// }
// /**
//  * @category API Requests / Responses
//  */
// export interface iGenerateAppleWalletPassRouteSuccessResponse {
//   type: string;
//   data: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface GetClaimAlertsForCollectionRouteRequestBody {
//   collectionId: string | number;
//   bookmark: string;
// }

// /**
//  * @category API Requests / Responses
//  */
// export interface iGetClaimAlertsForCollectionRouteSuccessResponse {
//   claimAlerts: iClaimAlertDoc[];
//   pagination: PaginationInfo;
// }

// declare module 'crypto-addr-codec' {
//   export function b32encode(data: Buffer): string;
//   export function b32decode(data: string): Buffer;
//   export function bs58Encode(data: any): any;
//   export function bs58Decode(data: any): any;
//   export function cashaddrEncode(prefix: any, type: any, hash: any): any;
//   export function cashaddrDecode(str: any): any;
//   export function hex2a(data: any): any;
//   export function codec(data: any): any;
//   export function encodeCheck(type: string, data: Buffer): string;
//   export function decodeCheck(type: string, data: string): Buffer;
//   export function calculateChecksum(data: any): any;

//   // export function xrpCodex(data: any): any;
//   export function ua2hex(data: any): any;
//   export function isValid(data: string): boolean;
//   export function isValidChecksumAddress(address: string, chainId: number | null): boolean;
//   export function stripHexPrefix(address: string): string;
//   export function toChecksumAddress(address: string, chainId: number | null): string;

//   export function eosPublicKey(Q: any, ...args: any[]): any;

//   export function ss58Encode(data: Uint8Array, format: number): string;
//   export function ss58Decode(data: string): Buffer;
// }

// /**
//  * @category Interfaces
//  */
// export interface iOffChainBalancesMap {
//   [cosmosAddressOrListId: string]: iBalance[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iTransferWithIncrements extends iTransfer {
//   /** The number of addresses to send the badges to. This takes priority over toAddresses.length (used when you don't know exact addresses (i.e. you know number of codes)). */
//   toAddressesLength?: string | number;

//   /** The number to increment the badgeIDs by for each transfer. */
//   incrementBadgeIdsBy?: string | number;

//   /** The number to increment the ownershipTimes by for each transfer. */
//   incrementOwnershipTimesBy?: string | number;
// }

// /**
//  * @category Interfaces
//  */
// export interface iBatchBadgeDetails {
//   collectionId: string | number;
//   badgeIds: iUintRange[];
// }

// import { DeliverTxResponse } from '@cosmjs/stargate';
// import { AndGroup, OrGroup, OwnershipRequirements, ChallengeParams, VerifyChallengeOptions } from 'blockin';
// import type MerkleTree from 'merkletreejs';

// /**
//  * LeavesDetails represents details about the leaves of a claims tree.
//  * This is used as helpers for storing leaves and for UI purposes.
//  *
//  * This is used to check if an entered claim value is valid. If the leaves are hashed, then the value entered by the user will be hashed before being checked against the provided leaf values.
//  * If the leaves are not hashed, then the value entered by the user will be checked directly against the provided leaf values.
//  *
//  * IMPORTANT: The leaf values here are to be publicly stored on IPFS, so they should not contain any sensitive information (i.e. codes, passwords, etc.)
//  * Only use this with the non-hashed option when the values do not contain any sensitive information (i.e. a public whitelist of addresses).
//  *
//  * @example Codes
//  * 1. Generate N codes privately
//  * 2. Hash each code
//  * 3. Store the hashed codes publicly on IPFS via this struct
//  * 4. When a user enters a code, we hash it and check if it matches any of the hashed codes. This way, the codes are never stored publicly on IPFS and only known by the generator of the codes.
//  *
//  * @example Whitelist
//  * For storing a public whitelist of addresses (with useCreatorAddressAsLeaf = true), hashing complicates everything because the whitelist can be stored publicly.
//  * 1. Generate N whitelist addresses
//  * 2. Store the addresses publicly on IPFS via this struct
//  * 3. When a user enters an address, we check if it matches any of the addresses.
//  *
//  *
//  * @category Approvals / Transferability
//  * @typedef {Object} LeavesDetails
//  *
//  * @property {string[]} leaves - The values of the leaves
//  * @property {boolean} isHashed - True if the leaves are hashed
//  * @property {string[]} preimages - The preimages of the leaves (only used if isHashed = true). Oftentimes, this is used for secret codes so shoul dnot be present when user-facing.
//  */
// export interface LeavesDetails {
//   leaves: string[];
//   isHashed: boolean;

//   preimages?: string[];
//   seedCode?: string;
// }

// import { Options as MerkleTreeJsOptions } from 'merkletreejs/dist/MerkleTree';
// import { BlockinChallengeParams } from './api-indexer';
// import { BroadcastPostBody } from './node-rest-api';

// /**
//  * @category Interfaces
//  */
// export interface iChallengeDetails {
//   /** The leaves of the Merkle tree with accompanying details */
//   leavesDetails: LeavesDetails;
//   /** The Merkle tree */
//   tree?: MerkleTree;
//   /** The Merkle tree options for how to build it */
//   treeOptions?: MerkleTreeJsOptions;
//   /** The number of leaves in the Merkle tree. This takes priority over leaves.length if defined (used for buffer time between leaf generation and leaf length select) */
//   numLeaves?: string | number;
//   /** The current code being used for the challenge. Used behind the scenes */
//   currCode?: string | number;
// }

// /**
//  * @category Interfaces
//  */
// export interface iApprovalInfoDetails {
//   /** The name of the claim */
//   name: string;

//   /** The description of the claim. This describes how to earn and claim the badge. */
//   description: string;

//   /** The challenge details of the claim / approval */
//   challengeDetails?: iChallengeDetails;

//   offChainClaims?: {
//     /** The plugins of the claim / approval */
//     plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
//     claimId: string;
//     manualDistribution?: boolean;
//   }[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iCosmosCoin {
//   /** The amount of the coin. */
//   amount: string | number;
//   /** The denomination of the coin. */
//   denom: string;
// }

// export interface EIP712Type {
//   name: string;
//   type: string;
// }

// export interface JSONObject {
//   [key: string]: any;
// }

// export interface FlattenPayloadResponse {
//   payload: JSONObject;
//   numMessages: number;
// }

// const TYPE_PREFIX = 'Type';
// const ROOT_PREFIX = '_';
// export const MAX_DUPL_TYPEDEFS = 1000;

// interface ParseJSONParams {
//   types: JSONObject;
//   payload: JSONObject;
//   root: string;
//   prefix: string;
// }

// interface ParseFieldParams {
//   key: string;
//   value: any;
//   isArray?: boolean;
// }

// /**
//  * TxContext is the transaction context for a SignDoc that is independent
//  * from the transaction payload.
//  *
//  * @category Transactions
//  */
// export interface TxContext {
//   chain: Chain;
//   sender: Sender;
//   fee: Fee;
//   memo: string;
// }

// /**
//  * EIP712TypedData represents a signable EIP-712 typed data object,
//  * including both the types and message object.
//  *
//  * @remarks
//  * See the EIP-712 specification for more:
//  * {@link https://eips.ethereum.org/EIPS/eip-712}
//  *
//  * @category Transactions
//  */
// export interface EIP712TypedData {
//   types: object;
//   message: object | object[];
//   domain: object;
//   primaryType: string;
// }

// /**
//  * EI712ToSign represents a signable EIP-712 payload that can be signed using MetaMask or Keplr.
//  *
//  * @remarks
//  * Evmos uses the EIP-712 protocol to wrap Cosmos SDK Transactions for Ethereum signing clients.
//  * EIP-712 payload signatures can be used interchangeably with standard Cosmos SDK signatures.
//  * Learn more about the {@link https://eips.ethereum.org/EIPS/eip-712 | EIP-712 Standard}
//  *
//  * @category Transactions
//  */
// export interface EIP712ToSign {
//   types: object;
//   primaryType: string;
//   domain: {
//     name: string;
//     version: string;
//     chainId: number;
//     verifyingContract: string;
//     salt: string;
//   };
//   message: object;
// }

// /**
//  * Fee represents a Cosmos SDK transaction fee object.
//  *
//  * @remarks
//  * Learn more about fees in Evmos from the
//  * {@link https://docs.cosmos.network/main/basics/gas-fees | Cosmos SDK Fee Docs}
//  * and the {@link https://docs.evmos.org/protocol/concepts/gas-and-fees | Evmos Gas and Fee Docs}
//  *
//  * @category Transactions
//  */
// export interface Fee {
//   amount: string;
//   denom: string;
//   gas: string;
// }

// /**
//  * Sender represents a Cosmos SDK Transaction signer.
//  *
//  * @remarks
//  * A sender object is used to populate the Cosmos SDK's SignerInfo field,
//  * which is used to declare transaction signers.
//  *
//  * @category Transactions
//  */
// export interface Sender {
//   accountAddress: string;
//   sequence: number;
//   accountNumber: number;
//   pubkey: string;
// }

// /**
//  * Chain represents the base chain's chainID.
//  *
//  * @remarks
//  * chainId corresponds to a numerical Ethereum ChainID (e.g. 9001)
//  * cosmosChainId corresponds to a Cosmos SDK string ChainID (e.g. 'evmos_9001-2'
//  *
//  * @category Transactions
//  */
// export interface Chain {
//   chainId: number;
//   cosmosChainId: string;
//   chain: SupportedChain;
// }

// /**
//  * SupportedChain is an enum of all the supported chains.
//  *
//  * Has an UNKNOWN value for when we don't know the chain yet.
//  *
//  * @category Address Utils
//  */
// export enum SupportedChain {
//   BTC = 'Bitcoin',
//   ETH = 'Ethereum',
//   COSMOS = 'Cosmos',
//   SOLANA = 'Solana',
//   UNKNOWN = 'Unknown' //If unknown address, we don't officially know the chain yet.
// }

// /**
//  * NumberType is a type that can be used to represent a number in JavaScript in multiple ways.
//  * Because the blockchain supports numbers > 2^53, we need to use BigInts or strings to represent them.
//  *
//  * NumberType is a union of all the types that can be used to represent a number in JavaScript.
//  *
//  * @category Number Types
//  */
// export type NumberType = bigint | number | string;

// /**
//  * JSPrimitiveNumberType is a type that can be used to represent a number in JavaScript in multiple ways.
//  * Because the blockchain supports numbers > 2^53, we need to use BigInts or strings to represent them.
//  *
//  * JSPrimitiveNumberType is a union of all the types that can be used to represent a number in JavaScript.
//  * This is the same as NumberType, but without BigInts because they are not a primitive.
//  *
//  * @category Number Types
//  */
// export type JSPrimitiveNumberType = string | number;

// /**
//  * @category Interfaces
//  */
// export interface iUserPermissions {
//   /** The list of permissions for updating approved outgoing transfers. */
//   canUpdateOutgoingApprovals: iUserOutgoingApprovalPermission[];
//   /** The list of permissions for updating approved incoming transfers. */
//   canUpdateIncomingApprovals: iUserIncomingApprovalPermission[];
//   /** The permissions for updating auto-approving self-initiated outgoing transfers. If auto-approve is enabled, then the user will be approved by default for all outgoing transfers that are self-initiated. */
//   canUpdateAutoApproveSelfInitiatedOutgoingTransfers: iActionPermission[];
//   /** The permissions for updating auto-approving self-initiated incoming transfers. If auto-approve is enabled, then the user will be approved by default for all incoming transfers that are self-initiated. */
//   canUpdateAutoApproveSelfInitiatedIncomingTransfers: iActionPermission[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iUserOutgoingApprovalPermission {
//   /** The list ID of the to addresses of the approved outgoing transfers. */
//   toListId: string;
//   /** The list ID of the initiatedBy addresses of the approved outgoing transfers. */
//   initiatedByListId: string;
//   /** The transfer times of the approved outgoing transfers. */
//   transferTimes: iUintRange[];
//   /** The badge IDs of the approved outgoing transfers. */
//   badgeIds: iUintRange[];
//   /** The owned times of the approved outgoing transfers. */
//   ownershipTimes: iUintRange[];
//   /** The approval ID of the approved outgoing transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId. */
//   approvalId: string;
//   /** The approval tracker ID of the approved transfers. Can use "All" to represent all IDs, "!trackerId" to represent all IDs except trackerId, or "trackerId" to represent only trackerId. */
//   amountTrackerId: string;
//   /** The challenge tracker ID of the approved transfers. Can use "All" to represent all IDs, "!trackerId" to represent all IDs except trackerId, or "trackerId" to represent only trackerId. */
//   challengeTrackerId: string;
//   /** The permitted times of the approved outgoing transfers. */
//   permanentlyPermittedTimes: iUintRange[];
//   /** The forbidden times of the approved outgoing transfers. */
//   permanentlyForbiddenTimes: iUintRange[];

//   toList: iAddressList;
//   initiatedByList: iAddressList;
// }

// /**
//  * @category Interfaces
//  */
// export interface iUserIncomingApprovalPermission {
//   /** The list ID of the from addresses of the approved incoming transfers. */
//   fromListId: string;
//   /** The list ID of the initiatedBy addresses of the approved incoming transfers. */
//   initiatedByListId: string;
//   /** The transfer times of the approved incoming transfers. */
//   transferTimes: iUintRange[];
//   /** The badge IDs of the approved incoming transfers. */
//   badgeIds: iUintRange[];
//   /** The owned times of the approved incoming transfers. */
//   ownershipTimes: iUintRange[];
//   /** The approval ID of the approved incoming transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId. */
//   approvalId: string;
//   /** The approval tracker ID of the approved transfers. Can use "All" to represent all IDs, "!trackerId" to represent all IDs except trackerId, or "trackerId" to represent only trackerId. */
//   amountTrackerId: string;
//   /** The challenge tracker ID of the approved transfers. Can use "All" to represent all IDs, "!trackerId" to represent all IDs except trackerId, or "trackerId" to represent only trackerId. */
//   challengeTrackerId: string;
//   /** The permitted times of the approved incoming transfers. */
//   permanentlyPermittedTimes: iUintRange[];
//   /** The forbidden times of the approved incoming transfers. */
//   permanentlyForbiddenTimes: iUintRange[];

//   fromList: iAddressList;
//   initiatedByList: iAddressList;
// }

// /**
//  * @category Interfaces
//  */
// export interface iCollectionPermissions {
//   /** The permissions for deleting the collection. */
//   canDeleteCollection: iActionPermission[];
//   /** The permissions for archiving the collection. */
//   canArchiveCollection: iTimedUpdatePermission[];
//   /** The permissions for updating the off-chain balances metadata. */
//   canUpdateOffChainBalancesMetadata: iTimedUpdatePermission[];
//   /** The permissions for updating the standards. */
//   canUpdateStandards: iTimedUpdatePermission[];
//   /** The permissions for updating the custom data. */
//   canUpdateCustomData: iTimedUpdatePermission[];
//   /** The permissions for updating the manager. */
//   canUpdateManager: iTimedUpdatePermission[];
//   /** The permissions for updating the collection metadata. */
//   canUpdateCollectionMetadata: iTimedUpdatePermission[];
//   /** The permissions for creating more badges. */
//   canCreateMoreBadges: iBalancesActionPermission[];
//   /** The permissions for updating the badge metadata. */
//   canUpdateBadgeMetadata: iTimedUpdateWithBadgeIdsPermission[];
//   /** The permissions for updating the collection approved transfers. */
//   canUpdateCollectionApprovals: iCollectionApprovalPermission[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iActionPermission {
//   /** The permitted times of the permission. */
//   permanentlyPermittedTimes: iUintRange[];
//   /** The forbidden times of the permission. */
//   permanentlyForbiddenTimes: iUintRange[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iTimedUpdatePermission {
//   /** The timeline times that the permission applies to. */
//   timelineTimes: iUintRange[];
//   /** The permitted times of the permission. */
//   permanentlyPermittedTimes: iUintRange[];
//   /** The forbidden times of the permission. */
//   permanentlyForbiddenTimes: iUintRange[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iBalancesActionPermission {
//   /** The badge IDs that the permission applies to. */
//   badgeIds: iUintRange[];
//   /** The owned times of the permission. */
//   ownershipTimes: iUintRange[];
//   /** The permitted times of the permission. */
//   permanentlyPermittedTimes: iUintRange[];
//   /** The forbidden times of the permission. */
//   permanentlyForbiddenTimes: iUintRange[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iTimedUpdateWithBadgeIdsPermission {
//   /** The timeline times that the permission applies to. */
//   timelineTimes: iUintRange[];
//   /** The badge IDs that the permission applies to. */
//   badgeIds: iUintRange[];
//   /** The permitted times of the permission. */
//   permanentlyPermittedTimes: iUintRange[];
//   /** The forbidden times of the permission. */
//   permanentlyForbiddenTimes: iUintRange[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iCollectionApprovalPermission {
//   /** The list ID of the from addresses of the approved transfers. */
//   fromListId: string;
//   /** The list ID of the to addresses of the approved transfers. */
//   toListId: string;
//   /** The list ID of the initiatedBy addresses of the approved transfers. */
//   initiatedByListId: string;
//   /** The transfer times of the approved transfers. */
//   transferTimes: iUintRange[];
//   /** The badge IDs of the approved transfers. */
//   badgeIds: iUintRange[];
//   /** The owned times of the approved transfers. */
//   ownershipTimes: iUintRange[];
//   /** The approval ID of the approved transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId. */
//   approvalId: string;
//   /** The approval tracker ID of the approved transfers. Can use "All" to represent all IDs, "!trackerId" to represent all IDs except trackerId, or "trackerId" to represent only trackerId. */
//   amountTrackerId: string;
//   /** The challenge tracker ID of the approved transfers. Can use "All" to represent all IDs, "!trackerId" to represent all IDs except trackerId, or "trackerId" to represent only trackerId. */
//   challengeTrackerId: string;
//   /** The permitted times of this permission. */
//   permanentlyPermittedTimes: iUintRange[];
//   /** The forbidden times of this permission. */
//   permanentlyForbiddenTimes: iUintRange[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iCollectionApprovalPermissionWithDetails extends iCollectionApprovalPermission {
//   toList: iAddressList;
//   fromList: iAddressList;
//   initiatedByList: iAddressList;
// }

// /**
//  * @category Interfaces
//  */
// export interface iCollectionPermissionsWithDetails extends iCollectionPermissions {
//   canUpdateCollectionApprovals: iCollectionApprovalPermissionWithDetails[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iUintRange {
//   /**
//    * The start of the range.
//    */
//   start: string | number;

//   /**
//    * The end of the range, inclusive.
//    */
//   end: string | number;
// }

// /**
//  * @category Interfaces
//  */
// export interface iBadgeMetadata {
//   /**
//    * The URI where to fetch the badge metadata from.
//    */
//   uri: string;

//   /**
//    * The badge IDs corresponding to the URI.
//    */
//   badgeIds: iUintRange[];

//   /**
//    * Arbitrary custom data that can be stored on-chain
//    */
//   customData: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iCollectionMetadata {
//   /**
//    * The URI where to fetch the collection metadata from.
//    */
//   uri: string;

//   /**
//    * Arbitrary custom data that can be stored on-chain
//    */
//   customData: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iOffChainBalancesMetadata {
//   /**
//    * The URI where to fetch the off-chain balances metadata from.
//    */
//   uri: string;

//   /**
//    * Arbitrary custom data that can be stored on-chain
//    */
//   customData: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iMustOwnBadges {
//   /**
//    * The collection ID of the badges to own.
//    */
//   collectionId: string | number;

//   /**
//    * The min/max acceptable amount of badges that must be owned (can be any values, including 0-0).
//    */
//   amountRange: iUintRange;

//   /**
//    * The range of the times that the badges must be owned.
//    */
//   ownershipTimes: iUintRange[];

//   /**
//    * The range of the badge IDs that must be owned.
//    */
//   badgeIds: iUintRange[];

//   /**
//    * Whether or not to override the ownershipTimes with the current time.
//    */
//   overrideWithCurrentTime: boolean;

//   /**
//    * Whether or not the user must own all the specified badges. If false, we will accept if they meet criteria for at least one badge.
//    */
//   mustSatisfyForAllAssets: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iBalance {
//   /**
//    * The amount or balance of the owned badge.
//    */
//   amount: string | number;

//   /**
//    * The badge IDs corresponding to the balance.
//    */
//   badgeIds: iUintRange[];

//   /**
//    * The times that the badge is owned from.
//    */
//   ownershipTimes: iUintRange[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iAddressList {
//   /**
//    * The ID of the address list.
//    */
//   listId: string;

//   /**
//    * The addresses of the address list.
//    */
//   addresses: string[];

//   /**
//    * Whether or not to include ONLY the addresses or include all EXCEPT the addresses.
//    */
//   whitelist: boolean;

//   /**
//    * The URI where to fetch the address list metadata from.
//    */
//   uri: string;

//   /**
//    * Arbitrary custom data that can be stored on-chain.
//    */
//   customData: string;

//   /**
//    * The address that created the address list.
//    */
//   createdBy?: string;

//   /**
//    * The alias cosmos address of the address list.
//    */
//   aliasAddress?: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iTransfer {
//   /**
//    * The address to transfer from.
//    */
//   from: string;

//   /**
//    * The addresses to transfer to.
//    */
//   toAddresses: string[];

//   /**
//    * The balances to transfer.
//    */
//   balances: iBalance[];

//   /**
//    * If specified, we will precalculate from this approval and override the balances. This can only be used when the specified approval has predeterminedBalances set.
//    */
//   precalculateBalancesFromApproval?: iApprovalIdentifierDetails;

//   /**
//    * The merkle proofs that satisfy the mkerkle challenges in the approvals. If the transfer deducts from multiple approvals, we check all the merkle proofs and assert at least one is valid for every challenge.
//    */
//   merkleProofs?: iMerkleProof[];

//   /**
//    * Arbitrary memo for the transfer.
//    */
//   memo?: string;

//   /**
//    * The prioritized approvals to use for the transfer. If specified, we will check these first.
//    */
//   prioritizedApprovals?: iApprovalIdentifierDetails[];

//   /**
//    * Whether or not to only check the prioritized approvals. If false, we will check all approvals with any prioritized first.
//    */
//   onlyCheckPrioritizedApprovals?: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iApprovalIdentifierDetails {
//   /**
//    * The approval ID of the approval.
//    */
//   approvalId: string;

//   /**
//    * The approval level of the approval "collection", "incoming", or "outgoing".
//    */
//   approvalLevel: string;

//   /**
//    * The address of the approval to check. If approvalLevel is "collection", this is blank "".
//    */
//   approverAddress: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iAmountTrackerIdDetails {
//   /**
//    * The collection ID for the approval.
//    */
//   collectionId: string | number;

//   /**
//    * The approval ID of the approval.
//    */
//   amountTrackerId: string;

//   /**
//    * The approval level of the approval "collection", "incoming", or "outgoing".
//    */
//   approvalLevel: string;

//   /**
//    * The address of the approval to check.
//    */
//   approverAddress: string;

//   /**
//    * The type of tracker to check "overall", "to", "from", or "initiatedBy".
//    */
//   trackerType: string;

//   /**
//    * The address to check for the approval.
//    */
//   approvedAddress: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iMerkleChallenge {
//   /**
//    * The root of the merkle tree.
//    */
//   root: string;

//   /**
//    * The expected proof length of the merkle proof.
//    */
//   expectedProofLength: string | number;

//   /**
//    * Whether or not to override any leaf value and use the creator address as the leaf. Used for whitelist trees.
//    */
//   useCreatorAddressAsLeaf: boolean;

//   /**
//    * Whether or not to enforce max uses per leaf. Used to prevent replay attacks.
//    */
//   maxUsesPerLeaf: string | number;

//   /**
//    * The URI where to fetch the merkle challenge metadata from.
//    */
//   uri: string;

//   /**
//    * Arbitrary custom data that can be stored on-chain.
//    */
//   customData: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iMerklePathItem {
//   /**
//    * The aunt of the merkle path item.
//    */
//   aunt: string;

//   /**
//    * Indicates whether the aunt node is on the right side of the path.
//    */
//   onRight: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iMerkleProof {
//   /**
//    * The aunts of the merkle proof.
//    */
//   aunts: iMerklePathItem[];

//   /**
//    * The leaf of the merkle proof. If useCreatorAddressAsLeaf is true, this will be populated with the creator Cosmos address.
//    */
//   leaf: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iTimelineItem {
//   /**
//    * The times of the timeline item. Times in a timeline cannot overlap.
//    */
//   timelineTimes: iUintRange[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iManagerTimeline extends iTimelineItem {
//   /**
//    * The manager of the collection.
//    */
//   manager: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iCollectionMetadataTimeline extends iTimelineItem {
//   /**
//    * The collection metadata.
//    */
//   collectionMetadata: iCollectionMetadata;
// }

// /**
//  * @category Interfaces
//  */
// export interface iBadgeMetadataTimeline extends iTimelineItem {
//   /**
//    * The badge metadata.
//    */
//   badgeMetadata: iBadgeMetadata[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iOffChainBalancesMetadataTimeline extends iTimelineItem {
//   /**
//    * The off-chain balances metadata.
//    */
//   offChainBalancesMetadata: iOffChainBalancesMetadata;
// }

// /**
//  * @category Interfaces
//  */
// export interface iCustomDataTimeline extends iTimelineItem {
//   /**
//    * Arbitrary custom data.
//    */
//   customData: string;
// }

// /**
//  * @category Interfaces
//  */
// export interface iStandardsTimeline extends iTimelineItem {
//   /**
//    * The standards.
//    */
//   standards: string[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iIsArchivedTimeline extends iTimelineItem {
//   /**
//    * Whether the collection is archived.
//    */
//   isArchived: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iUserOutgoingApproval {
//   toListId: string;
//   initiatedByListId: string;
//   toList: iAddressList;
//   initiatedByList: iAddressList;
//   transferTimes: iUintRange[];
//   badgeIds: iUintRange[];
//   ownershipTimes: iUintRange[];
//   approvalId: string;
//   amountTrackerId: string;
//   challengeTrackerId: string;
//   uri?: string;
//   customData?: string;
//   approvalCriteria?: iOutgoingApprovalCriteria;
// }

// /**
//  * @category Interfaces
//  */
// export interface iOutgoingApprovalCriteria {
//   /** The list of must own badges to be approved. */
//   mustOwnBadges?: iMustOwnBadges[];
//   /** The list of merkle challenges that need valid proofs to be approved. */
//   merkleChallenge?: iMerkleChallenge;
//   /** The predetermined balances for each transfer. */
//   predeterminedBalances?: iPredeterminedBalances;
//   /** The maximum approved amounts for this approval. */
//   approvalAmounts?: iApprovalAmounts;
//   /** The max num transfers for this approval. */
//   maxNumTransfers?: iMaxNumTransfers;
//   /** Whether the to address must equal the initiatedBy address. */
//   requireToEqualsInitiatedBy?: boolean;
//   /** Whether the to address must not equal the initiatedBy address. */
//   requireToDoesNotEqualInitiatedBy?: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iPredeterminedBalances {
//   /** Manually define the balances for each transfer. Cannot be used with incrementedBalances. Order number corresponds to the index of the balance in the array. */
//   manualBalances: iManualBalances[];
//   /** Define a starting balance and increment the badge IDs and owned times by a certain amount after each transfer. Cannot be used with manualBalances. Order number corresponds to number of times we increment. */
//   incrementedBalances: iIncrementedBalances;
//   /** The order calculation method. */
//   orderCalculationMethod: iPredeterminedOrderCalculationMethod;
// }

// /**
//  * @category Interfaces
//  */
// export interface iManualBalances {
//   /** The list of balances for each transfer. Order number corresponds to the index of the balance in the array. */
//   balances: iBalance[];
// }

// /**
//  * @category Interfaces
//  */
// export interface iIncrementedBalances {
//   /** The starting balances for each transfer. Order number corresponds to the number of times we increment. */
//   startBalances: iBalance[];
//   /** The amount to increment the badge IDs by after each transfer. */
//   incrementBadgeIdsBy: string | number;
//   /** The amount to increment the owned times by after each transfer. */
//   incrementOwnershipTimesBy: string | number;
// }

// /**
//  * @category Interfaces
//  */
// export interface iPredeterminedOrderCalculationMethod {
//   /** Use the overall number of transfers this approval has been used with as the order number. Ex: If this approval has been used 2 times by ANY address, then the order number for the next transfer will be 3. */
//   useOverallNumTransfers: boolean;
//   /** Use the number of times this approval has been used by each to address as the order number. Ex: If this approval has been used 2 times by to address A, then the order number for the next transfer by to address A will be 3. */
//   usePerToAddressNumTransfers: boolean;
//   /** Use the number of times this approval has been used by each from address as the order number. Ex: If this approval has been used 2 times by from address A, then the order number for the next transfer by from address A will be 3. */
//   usePerFromAddressNumTransfers: boolean;
//   /** Use the number of times this approval has been used by each initiated by address as the order number. Ex: If this approval has been used 2 times by initiated by address A, then the order number for the next transfer by initiated by address A will be 3. */
//   usePerInitiatedByAddressNumTransfers: boolean;
//   /** Use the merkle challenge leaf index as the order number. Must specify ONE merkle challenge with the useLeafIndexForTransferOrder flag set to true. If so, we will use the leaf index of each merkle proof to calculate the order number. This is used to reserve specific balances for specific leaves (such as codes or whitelist address leafs) */
//   useMerkleChallengeLeafIndex: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iApprovalAmounts {
//   /** The overall maximum amount approved for the badgeIDs and ownershipTimes. Running tally that includes all transfers that match this approval. */
//   overallApprovalAmount: string | number;
//   /** The maximum amount approved for the badgeIDs and ownershipTimes for each to address. Running tally that includes all transfers from each unique to address that match this approval. */
//   perToAddressApprovalAmount: string | number;
//   /** The maximum amount approved for the badgeIDs and ownershipTimes for each from address. Running tally that includes all transfers from each unique from address that match this approval. */
//   perFromAddressApprovalAmount: string | number;
//   /** The maximum amount approved for the badgeIDs and ownershipTimes for each initiated by address. Running tally that includes all transfers from each unique initiated by address that match this approval. */
//   perInitiatedByAddressApprovalAmount: string | number;
// }

// /**
//  * @category Interfaces
//  */
// export interface iMaxNumTransfers {
//   /** The overall maximum number of transfers for the badgeIDs and ownershipTimes. Running tally that includes all transfers that match this approval. */
//   overallMaxNumTransfers: string | number;
//   /** The maximum number of transfers for the badgeIDs and ownershipTimes for each to address. Running tally that includes all transfers from each unique to address that match this approval. */
//   perToAddressMaxNumTransfers: string | number;
//   /** The maximum number of transfers for the badgeIDs and ownershipTimes for each from address. Running tally that includes all transfers from each unique from address that match this approval. */
//   perFromAddressMaxNumTransfers: string | number;
//   /** The maximum number of transfers for the badgeIDs and ownershipTimes for each initiated by address. Running tally that includes all transfers from each unique initiated by address that match this approval. */
//   perInitiatedByAddressMaxNumTransfers: string | number;
// }

// /**
//  * @category Interfaces
//  */
// export interface iUserIncomingApproval {
//   /** The list ID for the user(s) who is sending the badges. */
//   fromListId: string;
//   /** The list ID for the user(s) who initiate the transfer. */
//   initiatedByListId: string;
//   /** The times of the transfer transaction. */
//   transferTimes: iUintRange[];
//   /** The badge IDs to be transferred. */
//   badgeIds: iUintRange[];
//   /** The ownership times of the badges being transferred. */
//   ownershipTimes: iUintRange[];
//   /** The ID of the approval. Must not be a duplicate of another approval ID in the same timeline. */
//   approvalId: string;
//   /** The ID of the approval tracker. This is the key used to track tallies. */
//   amountTrackerId: string;
//   /** The ID of the challenge tracker. This is the key used to track used leaves for challenges. */
//   challengeTrackerId: string;
//   /** The URI of the approval. */
//   uri?: string;
//   /** Arbitrary custom data of the approval */
//   customData?: string;
//   /** For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc. */
//   approvalCriteria?: iIncomingApprovalCriteria;

//   fromList: iAddressList;
//   initiatedByList: iAddressList;
// }

// /**
//  * @category Interfaces
//  */
// export interface iIncomingApprovalCriteria {
//   /** The list of must own badges to be approved. */
//   mustOwnBadges?: iMustOwnBadges[];
//   /** The list of merkle challenges that need valid proofs to be approved. */
//   merkleChallenge?: iMerkleChallenge;
//   /** The predetermined balances for each transfer using this approval. */
//   predeterminedBalances?: iPredeterminedBalances;
//   /** The maximum approved amounts for this approval. */
//   approvalAmounts?: iApprovalAmounts;
//   /** The max num transfers for this approval. */
//   maxNumTransfers?: iMaxNumTransfers;
//   /** Whether the from address must equal the initiatedBy address. */
//   requireFromEqualsInitiatedBy?: boolean;
//   /** Whether the from address must not equal the initiatedBy address. */
//   requireFromDoesNotEqualInitiatedBy?: boolean;
// }

// /**
//  * @category Interfaces
//  */
// export interface iCollectionApproval {
//   /** The list ID for the user(s) who is receiving the badges. */
//   toListId: string;
//   /** The list ID for the user(s) who is sending the badges. */
//   fromListId: string;
//   /** The list ID for the user(s) who initiate the transfer. */
//   initiatedByListId: string;
//   /** The times of the transfer transaction. */
//   transferTimes: iUintRange[];
//   /** The badge IDs to be transferred. */
//   badgeIds: iUintRange[];
//   /** The ownership times of the badges being transferred. */
//   ownershipTimes: iUintRange[];
//   /** The ID of the approval. Must not be a duplicate of another approval ID in the same timeline. */
//   approvalId: string;
//   /** The ID of the approval tracker. This is the key used to track tallies. */
//   amountTrackerId: string;
//   /** The ID of the challenge tracker. This is the key used to track used leaves for challenges. */
//   challengeTrackerId: string;
//   /** The URI of the approval. */
//   uri?: string;
//   /** Arbitrary custom data of the approval */
//   customData?: string;
//   /** For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc. */
//   approvalCriteria?: iApprovalCriteria;

//   details?: iApprovalInfoDetails;
//   toList: iAddressList;
//   fromList: iAddressList;
//   initiatedByList: iAddressList;
// }

// /**
//  * @category Interfaces
//  */
// export interface iApprovalCriteria {
//   /** The list of must own badges to be approved. */
//   mustOwnBadges?: iMustOwnBadges[];
//   /** The list of merkle challenges that need valid proofs to be approved. */
//   merkleChallenge?: iMerkleChallenge;
//   /** The predetermined balances for each transfer. */
//   predeterminedBalances?: iPredeterminedBalances;
//   /** The maximum approved amounts for this approval. */
//   approvalAmounts?: iApprovalAmounts;
//   /** The max num transfers for this approval. */
//   maxNumTransfers?: iMaxNumTransfers;
//   /** Whether the to address must equal the initiatedBy address. */
//   requireToEqualsInitiatedBy?: boolean;
//   /** Whether the from address must equal the initiatedBy address. */
//   requireFromEqualsInitiatedBy?: boolean;
//   /** Whether the to address must not equal the initiatedBy address. */
//   requireToDoesNotEqualInitiatedBy?: boolean;
//   /** Whether the from address must not equal the initiatedBy address. */
//   requireFromDoesNotEqualInitiatedBy?: boolean;
//   /** Whether this approval overrides the from address's approved outgoing transfers. */
//   overridesFromOutgoingApprovals?: boolean;
//   /** Whether this approval overrides the to address's approved incoming transfers. */
//   overridesToIncomingApprovals?: boolean;
// }

// /**
//  * This stores everythign about a user's balances for a specific collection ID.
//  * This includes their balances, incoming approvals, outgoing approvals, and permissions.
//  *
//  * @category Interfaces
//  */
// export interface iUserBalanceStore {
//   /** The user's balances. */
//   balances: iBalance[];
//   /** The user's incoming approvals. */
//   incomingApprovals: iUserIncomingApproval[];
//   /** The user's outgoing approvals. */
//   outgoingApprovals: iUserOutgoingApproval[];
//   /** The user's permissions. */
//   userPermissions: iUserPermissions;
//   /** Whether the user's self-initiated outgoing transfers are auto-approved. If not, they must be explicitly approved using the outgoing approvals. */
//   autoApproveSelfInitiatedOutgoingTransfers: boolean;
//   /** Whether the user's self-initiated incoming transfers are auto-approved. If not, they must be explicitly approved using the incoming approvals. */
//   autoApproveSelfInitiatedIncomingTransfers: boolean;
// }
