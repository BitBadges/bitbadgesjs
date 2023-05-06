import { Balance, UserBalance } from "bitbadgesjs-proto";
import { getBalancesForIdRanges, subtractBalancesForIdRanges } from "./balances-gpt";
import { searchIdRangesForId } from "./idRanges";
import { TransfersExtended } from "./types/types";

/**
 * Creates a blank balance object with no balances or approvals
 */
export const getBlankBalance = () => {
  const blankBalance: UserBalance = {
    balances: [],
    approvals: [],
  }
  return blankBalance;
}

/**
 * Returns the post balance after a transfer of x(amountToTransfer * numRecipients) from startBadgeId to endBadgeId
 */
export const getBalanceAfterTransfer = (balance: UserBalance, startBadgeId: number, endBadgeId: number, amountToTransfer: number, numRecipients: number) => {
  const balanceCopy = JSON.parse(JSON.stringify(balance)); //need a deep copy of the balance to not mess up calculations
  const newBalance = subtractBalancesForIdRanges(balanceCopy, [{ start: startBadgeId, end: endBadgeId }], amountToTransfer * numRecipients);
  return newBalance;
}

/**
 * Returns the balance after a set of transfers
 *
 * transfers is a TransfersExtended[] so it supports incrementing badgeIds
 */
export const getBalanceAfterTransfers = (balance: UserBalance, transfers: TransfersExtended[]) => {
  let postBalance: UserBalance = JSON.parse(JSON.stringify(balance)); //need a deep copy of the balance to not mess up calculations

  for (const transfer of transfers) {
    for (const balance of transfer.balances) {

      //toAddressesLength takes priority
      const numRecipients = transfer.toAddressesLength ? transfer.toAddressesLength : transfer.toAddresses ? transfer.toAddresses.length : 0;
      const badgeIds = JSON.parse(JSON.stringify(balance.badgeIds));

      //If incrementIdsBy is not set, then we are not incrementing badgeIds and we can just batch calculate the balance
      if (!transfer.incrementIdsBy) {
        for (const badgeId of badgeIds) {
          postBalance = getBalanceAfterTransfer(postBalance, badgeId.start, badgeId.end, balance.balance, numRecipients);
        }
      } else {
        //If incrementIdsBy is set, then we need to increment the badgeIds after each transfer
        //TODO: This is not efficient, we should be able to LeetCode optimize this somehow
        for (let i = 0; i < numRecipients; i++) {
          for (const badgeId of badgeIds) {
            postBalance = getBalanceAfterTransfer(postBalance, badgeId.start, badgeId.end, balance.balance, 1);
            badgeId.start += transfer.incrementIdsBy || 0;
            badgeId.end += transfer.incrementIdsBy || 0;
          }
        }
      }
    }
  }

  return postBalance;
}

/**
 * Find the balance / supply of a specific badgeId within a set of balances.
 *
 * Returns x0 if not found
 */
export const getSupplyByBadgeId = (badgeId: number, balances: Balance[]) => {
  for (const balance of balances) {
    const [_idx, found] = searchIdRangesForId(badgeId, balance.badgeIds);
    if (found) {
      return balance.balance;
    }
  }
  return 0;
}


/**
 * Check if a user is approved to transfer a set of balances
 *
 * fromBalance is the sender account's balance information
 * transferredBadges are the badges being transferred
 * txSenderAccountNumber is the account number of the tx sender (the one who needs to be approved)
 */
export function checkIfApproved(fromBalance: UserBalance, txSenderAccountNumber: number, transferredBadges: Balance[]) {
  let isApproved = true;
  const approval = fromBalance.approvals.find((approval) => approval.address === txSenderAccountNumber);

  //if no approvals found or no balances found in the approval, then we are not approved
  if (!approval || (approval && approval.balances.length === 0)) {
    isApproved = false;
  } else {
    //check if we have enough balance for each badge
    for (const balance of transferredBadges) {
      const approvalBalances = getBalancesForIdRanges(balance.badgeIds, approval?.balances || []);

      if (approvalBalances.length === 0) {
        isApproved = false;
      } else {
        for (const approvalBalance of approvalBalances) {
          if (approvalBalance.balance < balance.balance) {
            isApproved = false;
            break;
          }
        }
      }
    }
  }

  return isApproved;
}
