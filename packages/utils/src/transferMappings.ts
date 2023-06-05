import { b_AddressesMapping, b_TransferMapping } from "bitbadgesjs-proto";

//TODO: Handle the cases with IncludeManager = true and 'Mint'

/**
 * Checks if a transfer mapping spans all possible IDs.
 *
 * Examples include specifying a non-transferable disallowed transfers.
 *
 * @param {b_TransferMapping[]} transfersMapping - The transfer mapping to check.
 */
export const isTransferMappingFull = (transfersMapping: b_TransferMapping[]) => {
  return transfersMapping.length === 1 && transfersMapping[0].to.addresses.length === 0 &&
    transfersMapping[0].to.includeOnlySpecified == false &&
    transfersMapping[0].to.managerOptions == 0n &&
    transfersMapping[0].from.addresses.length === 0 &&
    transfersMapping[0].from.includeOnlySpecified == false &&
    transfersMapping[0].from.managerOptions == 0n;
}

/**
 * Returns the b_TransferMapping[] corresponding to a non-transferable collection.
 * Only the Mint account is allowed to transfer out.
 */
export const getNonTransferableTransferMapping = () => {
  const mapping: b_TransferMapping = JSON.parse(JSON.stringify(AllAddressesTransferMapping));
  mapping.to.includeOnlySpecified = true;
  mapping.to.addresses = ['Mint'];

  const allowedTransfers: b_TransferMapping[] = [mapping]
  return allowedTransfers;
}

/**
 * Returns the b_TransferMapping[] corresponding to a transferable collection.
 */
export const getTransferableTransferMapping = () => {
  const mapping: b_TransferMapping = JSON.parse(JSON.stringify(AllAddressesTransferMapping));
  const allowedTransfers: b_TransferMapping[] = [mapping]
  return allowedTransfers;
}

/**
 * Returns the b_TransferMapping spanning all possible addresses.
 *
 * Note this is read-only with Object.freeze().
 */
export const AllAddressesTransferMapping: b_TransferMapping = Object.freeze({
  from: {
    addresses: [],
    includeOnlySpecified: false,
    managerOptions: 0n,
  },
  to: {
    addresses: [],
    includeOnlySpecified: false,
    managerOptions: 0n,
  },
})

/**
 * Checks if a specific account is in the given address mapping.
 */
export const isAccountInAddressMapping = (_addressesMapping: b_AddressesMapping, addressToCheck: string, managerAddress?: string) => {
  const addressesMapping: b_AddressesMapping = JSON.parse(JSON.stringify(_addressesMapping));
  let isApproved = false;

  if (addressesMapping.managerOptions == 2n && managerAddress) {
    addressesMapping.addresses = addressesMapping.addresses.filter((address) => address !== managerAddress);
  } else if (addressesMapping.managerOptions == 1n && managerAddress) {
    addressesMapping.addresses.push(managerAddress);
  }

  for (const address of addressesMapping.addresses) {
    if (address === addressToCheck) {
      isApproved = true;
    }
  }

  if (addressesMapping.includeOnlySpecified) {
    isApproved = !isApproved;
  }

  return isApproved;
}

/**
 * Checks if specific (from, to) address pairs are in the given transfer mapping.
 *
 * @param {b_TransferMapping[]} mapping - The transfer mapping to check.
 * @param {string[]} toAddresses - The addresses to check if they are in the to transfer mapping.
 * @param {string} fromAddressToCheck - The address to check if it is in the from transfer mapping.
 * @param {string} managerAddress - The manager address to use for the transfer mapping.
 */
export const getValidTransfersForTransferMapping = (mapping: b_TransferMapping[], fromAddressToCheck: string, toAddresses: string[], managerAddress: string) => {
  const matchingAddresses: any[] = [];
  for (const address of toAddresses) {
    for (const transfer of mapping) {
      const fromIsApproved = isAccountInAddressMapping(transfer.from, fromAddressToCheck, managerAddress);
      const toIsApproved = isAccountInAddressMapping(transfer.to, address, managerAddress);

      if (fromIsApproved && toIsApproved) {
        matchingAddresses.push(address);
      }
    }
  }

  return matchingAddresses;
}
