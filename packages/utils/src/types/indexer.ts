import { CollectionDocument, AccountDocument, MetadataDocument, BalanceDocument, ClaimDocument } from "./db";
import { ActivityItem } from "./activity";
import Nano from "nano";

/**
 * DocsCache is an oject to store a map of documents in memory
 *
 * Within the indexer, we cache the documents in memory to avoid having to fetch and write to the database each time
 * Typically, the cache is cleared after each block is processed
 */
export interface DocsCache {
  accounts: AccountDocs;
  collections: CollectionDocs;
  metadata: MetadataDocs;
  balances: BalanceDocs;
  claims: ClaimDocs;
  accountNumbersMap: { [cosmosAddress: string]: number | undefined };
  activityToAdd: ActivityItem[]
}

export interface CollectionDocs {
  [id: string]: (CollectionDocument & Nano.DocumentGetResponse) | { _id: string };
}

export interface AccountDocs {
  [cosmosAddress: string]: (AccountDocument & Nano.DocumentGetResponse) | { _id: string };
}

//Partitioned by collectionId-metadataId
export interface MetadataDocs {
  [partitionedId: string]: (MetadataDocument & Nano.DocumentGetResponse) | { _id: string };
}

//Partitioned by collectionId-accountNumber
export interface BalanceDocs {
  [partitionedId: string]: (BalanceDocument & Nano.DocumentGetResponse) | (BalanceDocument & { _id: string });
}

//Partitioned by collectionId-claimId
export interface ClaimDocs {
  [partitionedId: string]: (ClaimDocument & Nano.DocumentGetResponse) | { _id: string };
}
