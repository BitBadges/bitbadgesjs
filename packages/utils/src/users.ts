import { AccountResponse } from "./db";
import { BitBadgesUserInfo } from "./types";

export function convertToBitBadgesUserInfo(
    accountInfo: AccountResponse
): BitBadgesUserInfo {
    return {
        accountNumber: accountInfo.account_number ? accountInfo.account_number : -1,
        address: accountInfo.address,
        cosmosAddress: accountInfo.cosmosAddress,
        chain: accountInfo.chain,
        name: accountInfo.name,
        avatar: accountInfo.avatar,
        discord: accountInfo.discord,
        twitter: accountInfo.twitter,
        github: accountInfo.github,
        telegram: accountInfo.telegram,
    };
}