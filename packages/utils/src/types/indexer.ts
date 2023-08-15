import Nano from "nano";
import { TransferActivityInfoBase } from "./activity";
import { AccountDoc, BalanceDoc, MerkleChallengeDoc, CollectionDoc, QueueInfoBase, RefreshDoc, ApprovalsTrackerDoc, AddressMappingDoc } from "./db";

/**
 * @category API / Indexer
 */
export type BlankDocument = Nano.Document; // Alias for Nano.Document to make it clear that this is a blank document and has no other details.

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
 * @property {MerkleChallengeDocs} claims - The claims cache.
 * @property {ActivityInfoBase[]} activityToAdd - The activity documents to add to the database.
 * @property {QueueInfoBase[]} queueDocsToAdd - The queue documents to add to the database.
 * @property {RefreshDocs} refreshes - The refreshes cache.
 * @property {ApprovalsTrackerDocs} approvalsTrackers - The approvals trackers cache.
 * @property {AddressMappingsDocs} addressMappings - The address mappings cache.
 */
export interface DocsCache {
  accounts: AccountDocs;
  collections: CollectionDocs;
  balances: BalanceDocs;
  merkleChallenges: MerkleChallengeDocs;
  refreshes: RefreshDocs;
  approvalsTrackers: ApprovalsTrackerDocs;
  addressMappings: AddressMappingsDocs;
  queueDocsToAdd: (QueueInfoBase<bigint> & Nano.MaybeIdentifiedDocument)[];
  activityToAdd: (TransferActivityInfoBase<bigint> & Nano.MaybeIdentifiedDocument)[]
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
 * ApprovalsTrackerDocs is a map of partitionedId to approvals tracker documents.
 *
 * The partitionedId is the collectionId and a random identifier string joined by a dash (e.g. "1-abc123").
 * Queries should look up by the ApprovalIdDetails, such as $eq approvalId, approvalLevel, and so on.
 *
 * @category API / Indexer
 */
export interface ApprovalsTrackerDocs {
  [partitionedId: string]: (ApprovalsTrackerDoc<bigint>) | undefined;
}

/**
 * AddressMappingsDocs is a map of mappingId to address mapping documents.
 *
 * @category API / Indexer
 * @typedef {Object} AddressMappingsDocs
 * @property {AddressMappingDoc} [mappingId] - The mapping Id for the mapping.
 */
export interface AddressMappingsDocs {
  [mappingId: string]: (AddressMappingDoc) | undefined;
}
