import { Claims, Transfers, UserBalance } from "bitbadgesjs-proto";
import { getBalanceAfterTransfer, getBalanceAfterTransfers } from "./balances";
import { AccountMap, DistributionDetails, DistributionMethod, ClaimDocumentWithTrees, TransfersExtended } from "./types/types";


/**
 * Returns the claims and transfers to add to the Msg from the given details
 *
 * unmintedBalance is the current unminted balances of all badges in the collection
 * distributionDetails is the distribution details for the new Msg (transfers / claims)
 * collectionId is the collectionId of the collection
 * startClaimId is the claimId to start from (i.e. if we are creating a new claim, we want to start from the next claimId)
 */
export const getClaimsAndTransfersFromDistributionDetails = (unmintedBalance: UserBalance, distributionDetails: DistributionDetails[], accounts: AccountMap, collectionId: number, startClaimId: number) => {
  return {
    claims: getClaimsFromDistributionDetails(unmintedBalance, distributionDetails, collectionId, startClaimId),
    transfers: getTransfersFromDistributionDetails(distributionDetails, accounts),
  }
}

//TODO: Remvoe accountsContext
//From the distributionDetails created in the TxTimeline, we convert all these distributionDetails into a Transfers[]
//Only used if we are sending directly and not utilizing the claims field (i.e. distributionMethod = DirectTransfer)
export const getTransfersFromDistributionDetails = (distributionDetails: DistributionDetails[], accounts: AccountMap) => {
  const transfers: Transfers[] = [];
  for (const distributionDetail of distributionDetails) {
    if (distributionDetail.distributionMethod !== DistributionMethod.DirectTransfer) continue;

    //Fetch account information of recipients
    const toAddresses: number[] = [];
    for (const address of distributionDetail.addresses) {
      const account = accounts[address];
      if (!account) continue;
      const accountNum = account?.accountNumber ? account.accountNumber : -1;

      toAddresses.push(accountNum);
    }


    //If badges are incremented, we create N unique transfers (one to each address).
    //Else, we can create one transfer with N addresses
    if (distributionDetail.incrementIdsBy) {
      const currBadgeIds = JSON.parse(JSON.stringify(distributionDetail.badgeIds))
      for (let i = 0; i < toAddresses.length; i++) {
        transfers.push({
          toAddresses: [toAddresses[i]],
          balances: [{
            balance: Number(distributionDetail.amount),
            badgeIds: JSON.parse(JSON.stringify(currBadgeIds)),
          }],
        })

        for (let j = 0; j < currBadgeIds.length; j++) {
          currBadgeIds[j].start += distributionDetail.incrementIdsBy;
          currBadgeIds[j].end += distributionDetail.incrementIdsBy;
        }
      }
    } else {
      transfers.push({
        toAddresses,
        balances: [{
          balance: distributionDetail.amount,
          badgeIds: distributionDetail.badgeIds,
        }],
      })
    }
  }

  return transfers;
}


//From the distributionDetails created in the TxTimeline, we convert all these distributionDetails into a Claims[]
//Only used if we are sending via claims and not sending directly (i.e. manualSend = false)
export const getClaimsFromDistributionDetails = (balance: UserBalance, distributionDetails: DistributionDetails[], collectionId: number, startClaimId: number) => {
  //We maintain two balances:
  //claimBalance is the max lbalance for each claim (max amount of badges that can be claimed based on parameters)
  //undistributedBalance is the total undistributed balance (balance minus the sum of all claimBalances)
  let undistributedBalance = JSON.parse(JSON.stringify(balance));
  const claims: Claims[] = [];
  const storedClaims: ClaimDocumentWithTrees[] = [];
  for (const distributionDetail of distributionDetails) {
    if (distributionDetail.distributionMethod === DistributionMethod.DirectTransfer) continue;

    let claimBalance = JSON.parse(JSON.stringify(undistributedBalance));
    let maxNumClaims = 0;

    const codesLength = distributionDetail.numCodes ? distributionDetail.numCodes : distributionDetail.codes.length;
    const addressesLength = distributionDetail.addresses.length;

    //Calculate maxNumClaims based on the restrictOptions parameter
    if (distributionDetail.restrictOptions === 0) {
      maxNumClaims = codesLength; //No restrictions per address, so max is number of codes
    } else if (distributionDetail.restrictOptions === 1 || distributionDetail.restrictOptions === 2) {
      //1 = each whitelist index can only be used once
      //2 = each address can only claim once
      if (codesLength > 0 && addressesLength > 0) {
        maxNumClaims = Math.min(codesLength, addressesLength);
      } else if (codesLength > 0) {
        maxNumClaims = codesLength;
      } else if (addressesLength > 0) {
        maxNumClaims = addressesLength;
      }
    }

    //If maxNumClaims is still 0, then it is unlimited claims
    //Else, we calculate the claim details
    if (maxNumClaims > 0) {
      //Create a transfers array for compatibility with getBalanceAfterTransfers
      const transfers: TransfersExtended[] = [
        {
          toAddresses: [],
          toAddressesLength: maxNumClaims,
          balances: [
            {
              badgeIds: distributionDetail.badgeIds,
              balance: distributionDetail.amount
            }
          ],
          incrementIdsBy: distributionDetail.incrementIdsBy,
        }
      ];

      //For all possible claims, deduct from undistributedBalance
      undistributedBalance.balances = getBalanceAfterTransfers(undistributedBalance, transfers).balances;

      //Set claimBalance to what was just deducted in the line above
      for (const balanceObj of undistributedBalance.balances) {
        for (const badgeId of balanceObj.badgeIds) {
          const newBalance = getBalanceAfterTransfer(claimBalance, badgeId.start, badgeId.end, balanceObj.balance, 1);
          claimBalance.balances = newBalance.balances;
        }
      }
    } else {
      //If maxNumClaims is 0, then it is unlimited claims, so we set it to the entire undistributedBalance
      claimBalance = undistributedBalance;
      undistributedBalance = {
        balances: [],
        approvals: [],
      }
    }

    claims.push({
      balances: claimBalance.balances,
      codeRoot: distributionDetail.codeRoot,
      whitelistRoot: distributionDetail.whitelistRoot,
      uri: distributionDetail.uri,
      timeRange: distributionDetail.timeRange,
      restrictOptions: distributionDetail.restrictOptions,
      amount: distributionDetail.amount,
      badgeIds: distributionDetail.badgeIds,
      incrementIdsBy: distributionDetail.incrementIdsBy,
      expectedMerkleProofLength: distributionDetail.codeTree ? distributionDetail.codeTree.getLayerCount() - 1 : 0,
    })

    storedClaims.push({

      balances: claimBalance.balances,
      codeRoot: distributionDetail.codeRoot,
      whitelistRoot: distributionDetail.whitelistRoot,
      uri: distributionDetail.uri,
      timeRange: distributionDetail.timeRange,
      restrictOptions: distributionDetail.restrictOptions,
      amount: distributionDetail.amount,
      badgeIds: distributionDetail.badgeIds,
      incrementIdsBy: distributionDetail.incrementIdsBy,
      expectedMerkleProofLength: distributionDetail.codeTree ? distributionDetail.codeTree.getLayerCount() - 1 : 0,
      addresses: distributionDetail.addresses,
      hashedCodes: distributionDetail.hashedCodes,
      name: distributionDetail.name ? distributionDetail.name : '',
      description: distributionDetail.description ? distributionDetail.description : '',
      hasPassword: distributionDetail.hasPassword ? distributionDetail.hasPassword : false,
      usedClaims: {
        codes: {},
        addresses: {},
        numUsed: 0,
      },
      collectionId,
      claimId: startClaimId,
    })

    startClaimId++;
  }

  return {
    undistributedBalance,
    claims,
    storedClaims,
  }
}
