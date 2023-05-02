import Nano from "nano";
import { StoredBadgeCollection, BadgeMetadata, IdRange, ActivityItem } from "./types";
import { Coin } from "@cosmjs/stargate";

export interface AccountDocument {
  address: string,
  cosmosAddress: string,
  account_number: number,
  pub_key: string,
  sequence: number,
  chain: string,
  discord?: string
  twitter?: string
  github?: string
  telegram?: string
  seenActivity?: number
  name?: string
  readme?: string
}

export interface MetadataDocument {
  metadata: BadgeMetadata
  badgeIds: IdRange[]
  isCollection: boolean
  id: number | 'collection'
  uri: string
}

export interface PasswordDocument {
  password: string
  codes: string[]
  currCode: number
  claimedUsers: {
    [cosmosAddress: string]: number
  }
  cid: string
  docClaimedByCollection: boolean
  claimId: number
  collectionId: number
}

export interface AccountDocs {
  [id: string]: AccountDocument & Nano.DocumentGetResponse;
}

export interface CollectionDocs {
  [id: string]: StoredBadgeCollection & Nano.DocumentGetResponse;
}

export interface MetadataDocs {
  [partitionedId: string]: MetadataDocument & Nano.DocumentGetResponse;
}

export interface Docs {
  accounts: AccountDocs;
  collections: CollectionDocs;
  metadata: MetadataDocs;
  accountNumbersMap: {
    [cosmosAddress: string]: number;
  }
  activityToAdd: ActivityItem[]
}

export interface AccountResponse extends AccountDocument {
  resolvedName?: string
  avatar?: string
  balance?: Coin
  airdropped?: boolean
}
