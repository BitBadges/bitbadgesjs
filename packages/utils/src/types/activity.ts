import { Balance } from "bitbadgesjs-proto";

/**
 * ActivityItem is the base type for all activity items
 * method is the type of activity (e.g. "Review", "Transfer", "Announcement", "Mint")
 * timestamp is the timestamp of the activity (via Date.now())
 * block is the block number of the activity
*/
export interface ActivityItem {
  method: string;
  timestamp: number;
  block: number;
}

/**
 * ReviewActivityItem is the type for review activity items
 * method = "Review"
 *
 * review is the review text (max 2048 characters)
 * stars is the number of stars given (1-5)
 * fromAddress is the address of the user who gave the review
 *
 * Only one of collectionId or cosmosAddress will be present:
 * collectionId is the collection ID of the collection that was reviewed
 * reviewedAddress is the cosmos address of the user who gave the review
 *
 * We use the cosmos address instead of the account number because reviews
 * can be given to users who have not yet registered on the chain
 */
export interface ReviewActivityItem extends ActivityItem {
  review: string;
  stars: number;
  from: string;
  collectionId?: number;
  reviewedAddress?: string;
}

/**
 * AnnouncementActivityItem is the type for announcement activity items
 * method = "Announcement"
 *
 * announcement is the announcement text (max 2048 characters)
 * from is the address of the user who made the announcement
 * collectionId is the collection ID of the collection that was announced
 *
 * Will be broadcasted to all users who have collected a badge from the collection
 *
 * We use the cosmos address instead of the account number because in the future,
 * we may want to allow users to make announcements before they have collected a badge
 * or registered on the chain.
 */
export interface AnnouncementActivityItem extends ActivityItem {
  announcement: string;
  from: string;
  collectionId: number;
}

/**
 * TransferActivityItem is the type for transfer activity items
 * method = "Transfer" or "Mint" or "Claim"
 *
 * to is the list of account numbers that received the transfer
 * from is the list of account numbers that sent the transfer ('Mint' is used as a special address when minting or claiming)
 * balances is the list of balances and badge IDs that were transferred
 * collectionId is the collection ID of the collection that was transferred
 * claimId is the claim ID of the claim (if method = "Claim")
 *
 * Was debating whether to use cosmosAddresses or accountNumbers, but decided
 * to use accountNumbers because that is how transfers are on the blockchain.
 *
 * Note: This is okay because if an address does not have an account number,
 * it will not have received any badges yet.
 */
export interface TransferActivityItem extends ActivityItem {
  to: number[];
  from: (number | 'Mint')[];
  balances: Balance[];
  collectionId: number;
  claimId?: number;
}
