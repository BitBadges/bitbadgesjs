import { getBalanceAfterTransfer, getBalanceAfterTransfers } from "./balances";
import { AccountMap, BitBadgesUserInfo, ClaimItem, ClaimItemWithTrees, Claims, TransfersExtended, UserBalance } from "./types";

//From the claimItems created in the TxTimeline, we convert all these claimItems into a TransfersExtended[]
//Only used if we are sending directly and not utilizing the claims field
export const getTransfersFromClaimItems = (claimItems: ClaimItem[], accounts: AccountMap) => {
    const transfers: TransfersExtended[] = [];
    for (const claimItem of claimItems) {
        //Fetch account information of recipients
        const toAddresses: number[] = [];
        const toAddressesInfo: BitBadgesUserInfo[] = [];
        for (const address of claimItem.addresses) {
            const accountNum = accounts[address].accountNumber ? accounts[address].accountNumber : -1;

            toAddresses.push(accountNum);
            toAddressesInfo.push(accounts[address]);
        }

        //If badges are incremented, we create N unique transfers (one to each address). 
        //Else, we can create one transfer with N addresses
        if (claimItem.incrementIdsBy && claimItem.numIncrements) {
            const currBadgeIds = JSON.parse(JSON.stringify(claimItem.badgeIds))
            for (let i = 0; i < toAddresses.length; i++) {
                transfers.push({
                    toAddresses: [toAddresses[i]],
                    toAddressInfo: [toAddressesInfo[i]],
                    numCodes: 0,
                    balances: [{
                        balance: Number(claimItem.amount),
                        badgeIds: JSON.parse(JSON.stringify(currBadgeIds)),
                    }],
                    numIncrements: 0,
                    incrementBy: 0,
                })

                for (let j = 0; j < currBadgeIds.length; j++) {
                    currBadgeIds[j].start += claimItem.incrementIdsBy;
                    currBadgeIds[j].end += claimItem.incrementIdsBy;
                }
            }
        } else {
            transfers.push({
                toAddresses,
                toAddressInfo: toAddressesInfo,
                numCodes: claimItem.codes.length,
                balances: [{
                    balance: claimItem.amount,
                    badgeIds: claimItem.badgeIds,
                }],
                numIncrements: claimItem.numIncrements,
                incrementBy: claimItem.incrementIdsBy,
                password: claimItem.password,
            })
        }
    }

    return transfers;
}


//From the claimItems created in the TxTimeline, we convert all these claimItems into a Claims[]
//Only used if we are sending via claims and not sending directly
export const getClaimsFromClaimItems = (balance: UserBalance, claimItems: ClaimItemWithTrees[]) => {
    //We maintain two balances: 
    //claimBalance is the max lbalance for each claim (max amount of badges that can be claimed based on parameters)
    //undistributedBalance is the total undistributed balance (balance minus the sum of all claimBalances)

    let undistributedBalance = JSON.parse(JSON.stringify(balance));

    const claims: Claims[] = [];

    for (const claimItem of claimItems) {
        let claimBalance = JSON.parse(JSON.stringify(undistributedBalance));
        let maxNumClaims = 0;
        const codesLength = claimItem.numCodes ? claimItem.numCodes : claimItem.codes.length;
        const addressesLength = claimItem.addresses.length;

        //Calculate maxNumClaims based on the restrictOptions parameter
        if (claimItem.restrictOptions === 0) {
            maxNumClaims = codesLength; //No restrictions per address, so max is number of codes
        } else if (claimItem.restrictOptions === 1 || claimItem.restrictOptions === 2) {
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
                    toAddresses: [0],
                    balances: [
                        {
                            badgeIds: claimItem.badgeIds,
                            balance: claimItem.amount
                        }
                    ],
                    numIncrements: maxNumClaims,
                    incrementBy: claimItem.incrementIdsBy,
                    numCodes: claimItem.numCodes,
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
            codeRoot: claimItem.codeRoot,
            whitelistRoot: claimItem.whitelistRoot,
            uri: claimItem.uri,
            timeRange: claimItem.timeRange,
            restrictOptions: claimItem.restrictOptions,
            amount: claimItem.amount,
            badgeIds: claimItem.badgeIds,
            incrementIdsBy: claimItem.incrementIdsBy,
            expectedMerkleProofLength: claimItem.codeTree.getLayerCount() - 1,
        })
    }

    return {
        undistributedBalance,
        claims
    }
}