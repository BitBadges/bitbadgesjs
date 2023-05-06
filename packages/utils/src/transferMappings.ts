import { Addresses, IdRange, TransferMapping } from "bitbadgesjs-proto";
import { GO_MAX_UINT_64 } from "./constants";
import { insertRangeToIdRanges, removeIdsFromIdRange, searchIdRangesForId } from "./idRanges";
import { TransferMappingWithUnregisteredUsers } from "./types/types";
import { BitBadgesUserInfo } from "./types/api";

/**
 * Checks if a transfer mapping spans all possible IDs.
 *
 * Examples include specifying a non-transferable disallowed transfers.
 */
export const isTransferMappingFull = (transfersMapping: TransferMapping[]) => {
  return transfersMapping.length === 1 && transfersMapping[0].to.accountIds.length === 1 &&
    transfersMapping[0].to.accountIds[0].start == 0 &&
    transfersMapping[0].to.accountIds[0].end == GO_MAX_UINT_64 &&
    transfersMapping[0].from.accountIds.length === 1 &&
    transfersMapping[0].from.accountIds[0].start == 0 &&
    transfersMapping[0].from.accountIds[0].end == GO_MAX_UINT_64
}


/**
 * Returns the TransferMapping[] corresponding to a non-transferable collection.
 */
export const getNonTransferableDisallowedTransfers = () => {
  const disallowedTransfers: TransferMapping[] = [JSON.parse(JSON.stringify(AllAddressesTransferMapping))]
  return disallowedTransfers;
}

/**
 * Returns the TransferMapping[] spanning all possible IDs.
 *
 * Note this is read-only with Object.freeze().
 */
export const AllAddressesTransferMapping: TransferMapping = Object.freeze({
  from: {
    accountIds: [
      {
        start: 0,
        end: GO_MAX_UINT_64
      }
    ],
    options: 0,
  },
  to: {
    accountIds: [
      {
        start: 0,
        end: GO_MAX_UINT_64
      }
    ],
    options: 0,
  },
})

/**
 * Checks if a specific account is in the given address mapping.
 */
export const isAccountInAddressMapping = (addresses: Addresses, connectedUser: BitBadgesUserInfo, managerAccountNumber: number) => {
  let isApproved = false;
  if (addresses.options === 2 && connectedUser.accountNumber === managerAccountNumber) {
    //exclude manager and we are the manager
    isApproved = false;
  } else {
    if (addresses.options === 1) {
      //include manager and we are the manager
      if (connectedUser.accountNumber === managerAccountNumber) {
        isApproved = true;
      }
    }

    for (const idRange of addresses.accountIds) {
      if (idRange.start <= connectedUser.accountNumber && idRange.end >= connectedUser.accountNumber) {
        isApproved = true;
      }
    }
  }

  return isApproved;
}

/**
 * Checks if a specific account is in the given transfer mapping.
 */
export const getMatchingAddressesFromTransferMapping = (mapping: TransferMapping[], toAddresses: BitBadgesUserInfo[], connectedUser: BitBadgesUserInfo, managerAccountNumber: number) => {
  const matchingAddresses: any[] = [];
  for (const address of toAddresses) {
    for (const transfer of mapping) {
      const fromIsApproved = isAccountInAddressMapping(transfer.from, connectedUser, managerAccountNumber);
      const toIsApproved = isAccountInAddressMapping(transfer.to, connectedUser, managerAccountNumber);

      if (fromIsApproved && toIsApproved) {
        matchingAddresses.push(address);
      }
    }
  }

  return matchingAddresses;
}


/**
 * Updates the transfer mapping with the given account number.
 *
 * If remove is true, we remove the account number from the transfer mapping.
 * Else, we insert the account number into the transfer mapping.
 *
 * This is typically used when managing transfer mappings for a just-registered user.
 */
export const updateTransferMappingAccountNums = (accountNumber: number, remove: boolean, transferMappingAddresses: Addresses) => {
  let newAccountNums: IdRange[] = [];

  if (remove) {
    for (const idRange of transferMappingAddresses.accountIds) {
      newAccountNums.push(...removeIdsFromIdRange({ start: accountNumber, end: accountNumber }, idRange));
    }
    transferMappingAddresses.accountIds = newAccountNums;
  } else {
    if (transferMappingAddresses.accountIds.length == 0) {
      transferMappingAddresses.accountIds.push({ start: accountNumber, end: accountNumber });
    } else {
      const [_idx, found] = searchIdRangesForId(accountNumber, transferMappingAddresses.accountIds);
      if (!found) {
        //Since they were previously unregistered, we assume there is no way it can already be in accountNums
        transferMappingAddresses.accountIds = insertRangeToIdRanges({ start: accountNumber, end: accountNumber }, transferMappingAddresses.accountIds);
      }
    }
  }

  return transferMappingAddresses;
}


/**
 * This will need a rewrite and will be deprecated soon.
 *
 * Handles the logic for the transfer mapping select on the frontend with support for unregistered users.
 */
export const getTransferMappingForSelectOptions = (isFromMapping: boolean, unregistered: string[], users: BitBadgesUserInfo[], all: boolean, none: boolean, everyoneExcept: boolean) => {
  let transferMapping: TransferMappingWithUnregisteredUsers | undefined;
  const accountNums: IdRange[] = [];
  for (const user of users) {
    if (user.accountNumber === -1) {
      //To be added/removed when registered
      unregistered.push(user.cosmosAddress);
      continue;
    } else {
      accountNums.push({
        start: user.accountNumber,
        end: user.accountNumber
      })
    }
  }

  if (!none) {
    transferMapping = {
      from: {
        accountIds: all || everyoneExcept ? [{
          start: 0,
          end: GO_MAX_UINT_64
        }] : accountNums,
        options: 0,
      },
      to: {
        accountIds: [{
          start: 0,
          end: GO_MAX_UINT_64
        }],
        options: 0,
      },
      removeFromUsers: false,
      removeToUsers: false,
      fromUnregisteredUsers: unregistered,
      toUnregisteredUsers: [],
    }
  } else if (none) {
    transferMapping = undefined;
  }

  let shouldRemoveAddresses = everyoneExcept && users.length > 0;

  if (shouldRemoveAddresses) {
    if (!transferMapping) return;

    transferMapping.removeFromUsers = true;

    for (const user of users) {
      for (let i = 0; i < transferMapping.from.accountIds.length; i++) {
        transferMapping.from.accountIds = [...transferMapping.from.accountIds.slice(0, i), ...removeIdsFromIdRange({ start: user.accountNumber, end: user.accountNumber }, transferMapping.from.accountIds[i]), ...transferMapping.from.accountIds.slice(i + 1)];
      }
    }
  }

  if (isFromMapping) {
    return transferMapping;
  } else {
    if (!transferMapping) return;

    return {
      ...transferMapping,
      from: transferMapping?.to,
      to: transferMapping?.from,
      removeFromUsers: transferMapping?.removeToUsers,
      removeToUsers: transferMapping?.removeFromUsers,
      fromUnregisteredUsers: transferMapping?.toUnregisteredUsers,
      toUnregisteredUsers: transferMapping?.fromUnregisteredUsers,
    }
  }
}
