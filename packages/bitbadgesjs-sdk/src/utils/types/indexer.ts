import { ClaimAlertDoc, TransferActivityDoc } from "./activity";
import { AccountDoc, BalanceDoc, MerkleChallengeDoc, CollectionDoc, QueueDoc, RefreshDoc, ApprovalTrackerDoc, AddressListDoc, PasswordDoc, ProtocolDoc, UserProtocolCollectionsDoc } from "./db";

/**
 * DocsCache is used by the indexer to cache documents in memory to avoid having to fetch and write to the database each time.
 * Typically, all docs in the cache is cleared and written to the DB after each block is processed.
 *
 * @category API / Indexer
 * @typedef {Object} DocsCache
 *
 * @property {AccountDocs} accounts - The accounts cache.
 * @property {CollectionDocs} collections - The collections cache.
 * @property {BalanceDocs} balances - The balances cache.
 * @property {MerkleChallengeDocs} merkleChallenges - The claims cache.
 * @property {ActivityDoc[]} activityToAdd - The activity documents to add to the database.
 * @property {QueueDoc[]} queueDocsToAdd - The queue documents to add to the database.
 * @property {RefreshDocs} refreshes - The refreshes cache.
 * @property {ApprovalTrackerDocs} approvalTrackers - The approvals trackers cache.
 * @property {AddressListsDocs} addressLists - The address lists cache.
 * @property {PasswordDocs} passwordDocs - The password documents cache.
 * @property {ClaimAlertDoc[]} claimAlertsToAdd - The claim alerts to add to the database.
 */
export interface DocsCache {
  accounts: AccountDocs;
  collections: CollectionDocs;
  balances: BalanceDocs;
  merkleChallenges: MerkleChallengeDocs;
  refreshes: RefreshDocs;
  approvalTrackers: ApprovalTrackerDocs;
  addressLists: AddressListsDocs;
  queueDocsToAdd: (QueueDoc<bigint>)[];
  activityToAdd: (TransferActivityDoc<bigint>)[];
  claimAlertsToAdd: (ClaimAlertDoc<bigint>)[];
  passwordDocs: PasswordDocs;

  protocols: {
    [protocolName: string]: ProtocolDoc<bigint> | undefined;
  }
  userProtocolCollections: {
    [cosmosAddress: string]: (UserProtocolCollectionsDoc<bigint>) | undefined;
  }
}

/**
 * PasswordDocs is a map of collectionId to collection documents.
 *
 * @category API / Indexer
 * @typedef {Object} PasswordDocs
 */
export interface PasswordDocs {
  [id: string]: (PasswordDoc<bigint>) | undefined;
}

/**
 * CollectionDocs is a map of collectionId to collection documents.
 *
 * @category API / Indexer
 * @typedef {Object} CollectionDocs
 */
export interface CollectionDocs {
  [id: string]: (CollectionDoc<bigint>) | undefined;
}

/**
 * RefreshDocs is a map of collectionId to refresh documents.
 *
 * @category API / Indexer
 */
export interface RefreshDocs {
  [id: string]: (RefreshDoc<bigint>) | undefined;
}

/**
 * AccountDocs is a map of cosmosAddress to account documents.
 *
 * @category API / Indexer
 * @typedef {Object} AccountDocs
 */
export interface AccountDocs {
  [cosmosAddress: string]: (AccountDoc<bigint>) | undefined;
}

/**
 * BalanceDocs is a map of partitionedId to balance documents.
 * The partitionedId is the collectionId and the cosmosAddress joined by a dash (e.g. "1-cosmos1ux...").
 *
 * @category API / Indexer
 * @typedef {Object} BalanceDocs
 */
export interface BalanceDocs {
  [partitionedId: string]: (BalanceDoc<bigint>) | undefined;
}

/**
 * MerkleChallengeDocs is a map of partitionedId to claim documents.
 * The partitionedId is the collectionId and the claimId joined by a dash (e.g. "1-1").
 *
 * @category API / Indexer
 * @typedef {Object} MerkleChallengeDocs
 */
export interface MerkleChallengeDocs {
  [partitionedId: string]: (MerkleChallengeDoc<bigint>) | undefined;
}

/**
 * ApprovalTrackerDocs is a map of partitionedId to approvals tracker documents.
 *
 * The partitionedId is the collectionId and a random identifier string joined by a dash (e.g. "1-abc123").
 * Queries should look up by the ApprovalIdDetails, such as $eq approvalId, approvalLevel, and so on.
 *
 * @category API / Indexer
 */
export interface ApprovalTrackerDocs {
  [partitionedId: string]: (ApprovalTrackerDoc<bigint>) | undefined;
}

/**
 * AddressListsDocs is a map of listId to address list documents.
 *
 * @category API / Indexer
 * @typedef {Object} AddressListsDocs
 * @property {AddressListDoc} [listId] - The list Id for the list.
 */
export interface AddressListsDocs {
  [listId: string]: (AddressListDoc<bigint>) | undefined;
}