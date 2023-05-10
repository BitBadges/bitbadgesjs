import { Balance, Transfer } from "bitbadgesjs-proto";
import { subtractBalancesForIdRanges } from "./balances";
import { TransferWithIncrements } from "./types/transfers";


/**
 * Converts a TransferWithIncrements[] to a Transfer[].
 *
 * Note that if there are N increments, this will create N transfers.
 *
 * @param {TransferWithIncrements[]} transfersWithIncrements - The list of transfers with increments.
 */
export const getTransfersFromTransfersWithIncrements = (transfersWithIncrements: TransferWithIncrements[]) => {
  const transfers: Transfer[] = [];
  for (const transferExtended of transfersWithIncrements) {
    const { toAddressesLength, incrementIdsBy, ...transfer } = transferExtended;
    const length = toAddressesLength ? Number(toAddressesLength) : transfer.toAddresses.length;

    //If badges are incremented, we create N unique transfers (one to each address).
    //Else, we can create one transfer with N addresses
    if (incrementIdsBy) {
      const currBalances = JSON.parse(JSON.stringify(transfer.balances))
      for (let i = 0; i < length; i++) {
        transfers.push({
          toAddresses: [transfer.toAddresses[i]],
          balances: JSON.parse(JSON.stringify(currBalances)),
        })

        for (let j = 0; j < currBalances.length; j++) {
          for (const badgeId of currBalances[j].badgeIds) {
            badgeId.start += incrementIdsBy;
            badgeId.end += incrementIdsBy;
          }
        }
      }
    } else {
      transfers.push(transfer);
    }
  }

  return transfers;
}

/**
 * Returns the post balance after a transfer of x(amountToTransfer * numRecipients) from startBadgeId to endBadgeId
 *
 * @param {Balance[]} balance - The balance to subtract from.
 * @param {bigint} startBadgeId - The start badge ID to subtract from.
 * @param {bigint} endBadgeId - The end badge ID to subtract from.
 * @param {bigint} amountToTransfer - The amount to subtract.
 * @param {bigint} numRecipients - The number of recipients to subtract from.
 */
export const getBalanceAfterTransfer = (balance: Balance[], startBadgeId: bigint, endBadgeId: bigint, amountToTransfer: bigint, numRecipients: bigint) => {
  const balanceCopy: Balance[] = JSON.parse(JSON.stringify(balance)); //need a deep copy of the balance to not mess up calculations

  const newBalance = subtractBalancesForIdRanges({
    balances: balanceCopy,
    approvals: [],
  }, [{ start: startBadgeId, end: endBadgeId }], amountToTransfer * numRecipients);
  return newBalance.balances;
}

/**
 * Returns the balance after a set of TransferWithIncrements[].
 *
 * @param {Balance[]} startBalance - The balance to subtract from.
 * @param {TransferWithIncrements[]} transfers - The transfers that are being sent.
 */
export const getBalancesAfterTransfers = (startBalance: Balance[], transfers: TransferWithIncrements[]) => {
  let endBalances: Balance[] = JSON.parse(JSON.stringify(startBalance)); //need a deep copy of the balance to not mess up calculations
  for (const transfer of transfers) {
    for (const balance of transfer.balances) {

      //toAddressesLength takes priority
      const _numRecipients = transfer.toAddressesLength ? transfer.toAddressesLength : transfer.toAddresses ? transfer.toAddresses.length : 0;
      const numRecipients = BigInt(_numRecipients);

      const badgeIds = JSON.parse(JSON.stringify(balance.badgeIds));

      //If incrementIdsBy is not set, then we are not incrementing badgeIds and we can just batch calculate the balance
      if (!transfer.incrementIdsBy) {
        for (const badgeId of badgeIds) {
          endBalances = getBalanceAfterTransfer(endBalances, badgeId.start, badgeId.end, balance.amount, numRecipients);
        }
      } else {
        //If incrementIdsBy is set, then we need to increment the badgeIds after each transfer
        //TODO: This is not efficient, we should be able to LeetCode optimize this somehow. Imagine a claim with 100000000 possible claims.
        for (let i = 0; i < numRecipients; i++) {
          for (const badgeId of badgeIds) {
            endBalances = getBalanceAfterTransfer(endBalances, badgeId.start, badgeId.end, balance.amount, 1n);
            badgeId.start += transfer.incrementIdsBy || 0;
            badgeId.end += transfer.incrementIdsBy || 0;
          }
        }
      }
    }
  }

  return endBalances;
}



// //From the DistributionItem created in the TxTimeline, we convert all these DistributionItem into a Claims[]
// //Only used if we are sending via claims and not sending directly (i.e. manualSend = false)
// export const getClaimsFromDistributionItem = (balance: UserBalance, DistributionItem: DistributionItem[], collectionId: number, startClaimId: number) => {

//   //We maintain two balances:
//   //claimBalance is the max lbalance for each claim (max amount of badges that can be claimed based on parameters)
//   //undistributedBalance is the total undistributed balance (balance minus the sum of all claimBalances)
//   let undistributedBalance = JSON.parse(JSON.stringify(balance));
//   const claims: Claim[] = [];
//   const storedClaims: ClaimWithDetails[] = [];
//   for (const distributionDetail of DistributionItem) {
//     if (distributionDetail.distributionMethod === DistributionMethod.DirectTransfer) continue;

//     let claimBalance = JSON.parse(JSON.stringify(undistributedBalance));
//     let maxNumClaims = 0;

//     const codesLength = distributionDetail.numCodes ? distributionDetail.numCodes : distributionDetail.codes.length;
//     const addressesLength = distributionDetail.addresses.length;

//     if (distributionDetail.limitOnePerAddress) {


//       //Calculate maxNumClaims based on the restrictOptions parameter
//       if (distributionDetail.restrictOptions === 0) {
//         maxNumClaims = codesLength; //No restrictions per address, so max is number of codes
//       } else if (distributionDetail.restrictOptions === 1 || distributionDetail.restrictOptions === 2) {
//         //1 = each whitelist index can only be used once
//         //2 = each address can only claim once
//         if (codesLength > 0 && addressesLength > 0) {
//           maxNumClaims = Math.min(codesLength, addressesLength);
//         } else if (codesLength > 0) {
//           maxNumClaims = codesLength;
//         } else if (addressesLength > 0) {
//           maxNumClaims = addressesLength;
//         }
//       }

//       //If maxNumClaims is still 0, then it is unlimited claims
//       //Else, we calculate the claim details
//       if (maxNumClaims > 0) {
//         //Create a transfers array for compatibility with getBalanceAfterTransfers
//         const transfers: TransferWithIncrements[] = [
//           {
//             toAddresses: [],
//             toAddressesLength: maxNumClaims,
//             balances: [
//               {
//                 badgeIds: distributionDetail.badgeIds,
//                 amount: distributionDetail.amount
//               }
//             ],
//             incrementIdsBy: distributionDetail.incrementIdsBy,
//           }
//         ];

//         //For all possible claims, deduct from undistributedBalance
//         undistributedBalance.balances = getBalanceAfterTransfers(undistributedBalance, transfers).balances;

//         //Set claimBalance to what was just deducted in the line above
//         for (const balanceObj of undistributedBalance.balances) {
//           for (const badgeId of balanceObj.badgeIds) {
//             const newBalance = getBalanceAfterTransfer(claimBalance, badgeId.start, badgeId.end, balanceObj.balance, 1);
//             claimBalance.balances = newBalance.balances;
//           }
//         }
//       } else {
//         //If maxNumClaims is 0, then it is unlimited claims, so we set it to the entire undistributedBalance
//         claimBalance = undistributedBalance;
//         undistributedBalance = {
//           balances: [],
//           approvals: [],
//         }
//       }

//       claims.push({
//         balances: claimBalance.balances,
//         codeRoot: distributionDetail.codeRoot,
//         whitelistRoot: distributionDetail.whitelistRoot,
//         uri: distributionDetail.uri,
//         timeRange: distributionDetail.timeRange,
//         limitOnePerAddress: distributionDetail.limitOnePerAddress,
//         amount: distributionDetail.amount,
//         badgeIds: distributionDetail.badgeIds,
//         incrementIdsBy: distributionDetail.incrementIdsBy,
//         expectedCodeProofLength: distributionDetail.codeTree ? distributionDetail.codeTree.getLayerCount() - 1 : 0,
//       })

//       storedClaims.push({

//         balances: claimBalance.balances,
//         codeRoot: distributionDetail.codeRoot,
//         whitelistRoot: distributionDetail.whitelistRoot,
//         uri: distributionDetail.uri,
//         timeRange: distributionDetail.timeRange,
//         limitOnePerAddress: distributionDetail.limitOnePerAddress,
//         amount: distributionDetail.amount,
//         badgeIds: distributionDetail.badgeIds,
//         incrementIdsBy: distributionDetail.incrementIdsBy,
//         expectedCodeProofLength: distributionDetail.codeTree ? distributionDetail.codeTree.getLayerCount() - 1 : 0,
//         addresses: distributionDetail.addresses,
//         hashedCodes: distributionDetail.hashedCodes,
//         name: distributionDetail.name ? distributionDetail.name : '',
//         description: distributionDetail.description ? distributionDetail.description : '',
//         hasPassword: distributionDetail.hasPassword ? distributionDetail.hasPassword : false,
//         usedClaims: {
//           codes: {},
//           addresses: {},
//           numUsed: 0,
//         },
//         collectionId,
//         claimId: startClaimId,
//       })

//       startClaimId++;
//     }

//     return {
//       undistributedBalance,
//       claims,
//       storedClaims,
//     }
//   }
