import { Balance, UserBalance } from "bitbadgesjs-proto";
import { getBalancesForIdRanges } from "./balances";

/**
 * Checks if a user has enough approval balances for a transfer on behalf of another user.
 *
 * @param {UserBalance} fromBalance - The balance of the user who is sending the badges.
 * @param {string} txSender - The address of the user who is attempting to transfer on behalf of another user. The one to check if they are approved.
 * @param {Balance[]} transferredBadges - The list of balances and badge IDs that are being transferred.
 */
export function checkIfApproved(fromBalance: UserBalance<bigint>, txSender: string, transferredBadges: Balance<bigint>[]) {
  let isApproved = true;
  const approval = fromBalance.approvals.find((approval) => approval.address === txSender);

  //if no approvals found or no balances found in the approval, then we are not approved
  if (!approval || (approval && approval.balances.length === 0)) {
    isApproved = false;
  } else {
    //check if we have enough balance for each badge
    for (const balance of transferredBadges) {
      const approvalBalances = getBalancesForUintRanges(balance.badgeIds, approval?.balances || []);

      if (approvalBalances.length === 0) {
        isApproved = false;
      } else {
        for (const approvalBalance of approvalBalances) {
          if (approvalBalance.amount < balance.amount) {
            isApproved = false;
            break;
          }
        }
      }
    }
  }

  return isApproved;
}
