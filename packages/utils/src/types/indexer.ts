import Nano from "nano";
import { TransferActivityInfoBase } from "./activity";
import { AccountDoc, BalanceDoc, ClaimDoc, CollectionDoc, QueueInfoBase, RefreshDoc } from "./db";

export type BlankDocument = Nano.Document; // Alias for Nano.Document to make it clear that this is a blank document and has no other details.

/**
 * DocsCache is used by the indexer to cache documents in memory to avoid having to fetch and write to the database each time.
 * Typically, all docs in the cache is cleared and written to the DB after each block is processed.
 *
 * @typedef {Object} DocsCache
 * @property {AccountDocs} accounts - The accounts cache.
 * @property {CollectionDocs} collections - The collections cache.
 * @property {BalanceDocs} balances - The balances cache.
 * @property {ClaimDocs} claims - The claims cache.
 * @property {ActivityInfoBase[]} activityToAdd - The activity documents to add to the database.
 * @property {QueueInfoBase[]} queueDocsToAdd - The queue documents to add to the database.
 */
export interface DocsCache {
  accounts: AccountDocs;
  collections: CollectionDocs;
  balances: BalanceDocs;
  claims: ClaimDocs;
  refreshes: RefreshDocs;
  queueDocsToAdd: (QueueInfoBase<bigint> & Nano.MaybeIdentifiedDocument)[];
  activityToAdd: (TransferActivityInfoBase<bigint> & Nano.MaybeIdentifiedDocument)[]
}

/**
 * CollectionDocs is a map of collectionId to collection documents.
 *
 * @typedef {Object} CollectionDocs
 */
export interface CollectionDocs {
  [id: string]: (CollectionDoc<bigint>) | undefined;
}

export interface RefreshDocs {
  [id: string]: (RefreshDoc<bigint>) | undefined;
}

/**
 * AccountDocs is a map of cosmosAddress to account documents.
 *
 * @typedef {Object} AccountDocs
 */
export interface AccountDocs {
  [cosmosAddress: string]: (AccountDoc<bigint>) | undefined;
}

/**
 * BalanceDocs is a map of partitionedId to balance documents.
 * The partitionedId is the collectionId and the cosmosAddress joined by a dash (e.g. "1-cosmos1ux...").
 *
 * @typedef {Object} BalanceDocs
 */
export interface BalanceDocs {
  [partitionedId: string]: (BalanceDoc<bigint>); //Note no undefined here because we auto-supply an empty balance doc w/ balance = 0 if missing
}

/**
 * ClaimDocs is a map of partitionedId to claim documents.
 * The partitionedId is the collectionId and the claimId joined by a dash (e.g. "1-1").
 *
 * @typedef {Object} ClaimDocs
 */
export interface ClaimDocs {
  [partitionedId: string]: (ClaimDoc<bigint>) | undefined;
}
