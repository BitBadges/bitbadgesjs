import Nano from "nano";
import { ActivityItem } from "./activity";
import { Account, BalanceDocument, ClaimDocument, Collection, QueueItem, RefreshDocument } from "./db";

/**
 * DocsCache is used by the indexer to cache documents in memory to avoid having to fetch and write to the database each time.
 * Typically, all docs in the cache is cleared and written to the DB after each block is processed.
 *
 * @typedef {Object} DocsCache
 * @property {AccountDocs} accounts - The accounts cache.
 * @property {CollectionDocs} collections - The collections cache.
 * @property {BalanceDocs} balances - The balances cache.
 * @property {ClaimDocs} claims - The claims cache.
 * @property {ActivityItem[]} activityToAdd - The activity documents to add to the database.
 * @property {QueueItem[]} queueDocsToAdd - The queue documents to add to the database.
 */
export interface DocsCache {
  accounts: AccountDocs;
  collections: CollectionDocs;
  balances: BalanceDocs;
  claims: ClaimDocs;
  refreshes: RefreshDocs;
  queueDocsToAdd: QueueItem[];
  activityToAdd: ActivityItem[];
}

/**
 * CollectionDocs is a map of collectionId to collection documents.
 *
 * @typedef {Object} CollectionDocs
 */
export interface CollectionDocs {
  [id: string]: (Collection & Nano.DocumentGetResponse) | { _id: string };
}

export interface RefreshDocs {
  [id: string]: (RefreshDocument & Nano.DocumentGetResponse) | { _id: string };
}

/**
 * AccountDocs is a map of cosmosAddress to account documents.
 *
 * @typedef {Object} AccountDocs
 */
export interface AccountDocs {
  [cosmosAddress: string]: (Account & Nano.DocumentGetResponse) | { _id: string };
}

/**
 * BalanceDocs is a map of partitionedId to balance documents.
 * The partitionedId is the collectionId and the cosmosAddress joined by a dash (e.g. "1-cosmos1ux...").
 *
 * @typedef {Object} BalanceDocs
 */
export interface BalanceDocs {
  [partitionedId: string]: (BalanceDocument & Nano.DocumentGetResponse) | (BalanceDocument & { _id: string });
}

/**
 * ClaimDocs is a map of partitionedId to claim documents.
 * The partitionedId is the collectionId and the claimId joined by a dash (e.g. "1-1").
 *
 * @typedef {Object} ClaimDocs
 */
export interface ClaimDocs {
  [partitionedId: string]: (ClaimDocument & Nano.DocumentGetResponse) | { _id: string };
}