import { AddressMapping } from "bitbadgesjs-proto";
import { convertToCosmosAddress } from "./chains";

/**
 * Checks if a specific account is in the given address mapping.
 *
 * @category Address Mappings
 */
export const isInAddressMapping = (addressesMapping: AddressMapping, addressToCheck: string) => {
  let found = addressesMapping.addresses.includes(addressToCheck);

  if (!addressesMapping.includeAddresses) {
    found = !found;
  }

  return found;
}

/**
 * Removes all addresses from one address mapping from another. Returns a new mapping.
 *
 * Returned mapping has ID "", so if you want to store it on the blockchain, you must set this with a unique ID.
 *
 * @category Address Mappings
 */
export function removeAddressMappingFromAddressMapping(mappingToRemove: AddressMapping, addressMapping: AddressMapping) {
  let duplicates = [];
  let inToRemoveButNotMapping = [];
  let inMappingButNotToRemove = [];

  for (let address of mappingToRemove.addresses) {
    // Check if address is in addressMapping.addresses
    let found = addressMapping.addresses.includes(address);

    if (found) {
      duplicates.push(address);
    } else {
      inToRemoveButNotMapping.push(address);
    }
  }

  for (let address of addressMapping.addresses) {
    // Check if address is in mappingToRemove.addresses
    let found = mappingToRemove.addresses.includes(address);

    if (!found) {
      inMappingButNotToRemove.push(address);
    }
  }

  let removed: AddressMapping = { addresses: [], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" };
  let remaining: AddressMapping = { addresses: [], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" };

  if (mappingToRemove.includeAddresses && addressMapping.includeAddresses) {
    // Case 1
    removed.includeAddresses = true;
    removed.addresses = duplicates;

    remaining.includeAddresses = true;
    remaining.addresses = inMappingButNotToRemove;
  } else if (!mappingToRemove.includeAddresses && addressMapping.includeAddresses) {
    // Case 2
    removed.includeAddresses = true;
    removed.addresses = inMappingButNotToRemove;

    remaining.includeAddresses = true;
    remaining.addresses = duplicates;
  } else if (mappingToRemove.includeAddresses && !addressMapping.includeAddresses) {
    // Case 3
    removed.includeAddresses = true;
    removed.addresses = inToRemoveButNotMapping;

    remaining.includeAddresses = false;
    remaining.addresses = [...inMappingButNotToRemove, ...inToRemoveButNotMapping, ...duplicates];
  } else if (!mappingToRemove.includeAddresses && !addressMapping.includeAddresses) {
    // Case 4
    removed.includeAddresses = false;
    removed.addresses = [...inMappingButNotToRemove, ...inToRemoveButNotMapping, ...duplicates];

    remaining.includeAddresses = true;
    remaining.addresses = inToRemoveButNotMapping;
  }

  return [remaining, removed];
}
/**
 * @category Address Mappings
 */
export function isAddressMappingEmpty(mapping: AddressMapping) {
  return mapping.addresses.length === 0 && mapping.includeAddresses;
}

/**
 * @category Address Mappings
 */
export function invertAddressMapping(mapping: AddressMapping) {
  mapping.includeAddresses = !mapping.includeAddresses;
  return mapping;
}

/**
 * Returns the address mapping for a mapping ID, if it is a reserved ID (i.e. Mint, Manager, All, None, validly formatted address, ...)
 *
 * @param {string} addressMappingId - The mapping ID to get the address mapping for
 * @param {string} managerAddress - The manager address to use for the Manager mapping ID
 *
 * @category Address Mappings
 */
export function getReservedAddressMapping(addressMappingId: string): AddressMapping {
  let inverted = false;
  let addressMapping: AddressMapping | undefined = undefined;

  if (addressMappingId[0] === '!') {
    inverted = true;
    addressMappingId = addressMappingId.slice(1);
  }

  if (addressMappingId === 'Mint') {
    addressMapping = {
      mappingId: 'Mint',
      addresses: ['Mint'],
      includeAddresses: true,
      uri: '',
      customData: '',
      createdBy: '',
    };
  }

  if (addressMappingId.startsWith('AllWithout')) {
    addressMapping = {
      mappingId: addressMappingId,
      addresses: [],
      includeAddresses: false,
      uri: '',
      customData: '',
      createdBy: '',
    };

    const addresses = addressMappingId.slice(10).split(':');

    for (let address of addresses) {
      addressMapping.addresses.push(address);
    }
  }

  if (addressMappingId === 'AllWithMint' || addressMappingId === 'All') {
    addressMapping = {
      mappingId: addressMappingId,
      addresses: [],
      includeAddresses: false,
      uri: '',
      customData: '',
      createdBy: '',
    };
  }

  if (addressMappingId === 'None') {
    addressMapping = {
      mappingId: 'None',
      addresses: [],
      includeAddresses: true,
      uri: '',
      customData: '',
      createdBy: '',
    };
  }

  //split by :
  const addressesToCheck = addressMappingId.split(':');
  let allAreValid = true;
  for (let address of addressesToCheck) {
    if (address != "Mint" && !convertToCosmosAddress(address)) {
      allAreValid = false;
    }
  }

  if (allAreValid) {
    addressMapping = {
      mappingId: addressMappingId,
      addresses: addressesToCheck,
      includeAddresses: true,
      uri: '',
      customData: '',
      createdBy: '',
    };
  }

  if (inverted && addressMapping) {
    addressMapping.includeAddresses = !addressMapping.includeAddresses;
  }

  if (!addressMapping) {
    throw new Error(`Invalid address mapping ID: ${addressMappingId}`);
  }

  return addressMapping;
}
