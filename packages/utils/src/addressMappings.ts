import { AddressMapping } from 'bitbadgesjs-proto'
import { convertToCosmosAddress, isAddressValid } from './chains'

/**
 * Checks if a specific account is in the given address mapping.
 *
 * @category Address Mappings
 */
export const isInAddressMapping = (
  addressesMapping: AddressMapping,
  addressToCheck: string,
) => {
  let found = addressesMapping.addresses.includes(addressToCheck)

  if (!addressesMapping.includeAddresses) {
    found = !found
  }

  return found
}

/**
 * Removes all addresses from one address mapping from another. Returns a new mapping.
 *
 * Returned mapping has ID "", so if you want to store it on the blockchain, you must set this with a unique ID.
 *
 * @category Address Mappings
 */
export function removeAddressMappingFromAddressMapping(
  addressesToRemove: AddressMapping,
  addressMapping: AddressMapping,
) {
  let duplicates = []
  let inToRemoveButNotMapping = []
  let inMappingButNotToRemove = []

  for (let address of addressesToRemove.addresses) {
    // Check if address is in addressMapping.addresses
    let found = addressMapping.addresses.includes(address)

    if (found) {
      duplicates.push(address)
    } else {
      inToRemoveButNotMapping.push(address)
    }
  }

  for (let address of addressMapping.addresses) {
    // Check if address is in addressesToRemove.addresses
    let found = addressesToRemove.addresses.includes(address)

    if (!found) {
      inMappingButNotToRemove.push(address)
    }
  }

  let removed: AddressMapping = {
    addresses: [],
    includeAddresses: false,
    mappingId: '',
    uri: '',
    customData: '',
    createdBy: '',
  }
  let remaining: AddressMapping = {
    addresses: [],
    includeAddresses: false,
    mappingId: '',
    uri: '',
    customData: '',
    createdBy: '',
  }

  if (addressesToRemove.includeAddresses && addressMapping.includeAddresses) {
    // Case 1
    removed.includeAddresses = true
    removed.addresses = duplicates

    remaining.includeAddresses = true
    remaining.addresses = inMappingButNotToRemove
  } else if (
    !addressesToRemove.includeAddresses &&
    addressMapping.includeAddresses
  ) {
    // Case 2
    removed.includeAddresses = true
    removed.addresses = inMappingButNotToRemove

    remaining.includeAddresses = true
    remaining.addresses = duplicates
  } else if (
    addressesToRemove.includeAddresses &&
    !addressMapping.includeAddresses
  ) {
    // Case 3
    removed.includeAddresses = true
    removed.addresses = inToRemoveButNotMapping

    remaining.includeAddresses = false
    remaining.addresses = [
      ...inMappingButNotToRemove,
      ...inToRemoveButNotMapping,
      ...duplicates,
    ]
  } else if (
    !addressesToRemove.includeAddresses &&
    !addressMapping.includeAddresses
  ) {
    // Case 4
    removed.includeAddresses = false
    removed.addresses = [
      ...inMappingButNotToRemove,
      ...inToRemoveButNotMapping,
      ...duplicates,
    ]

    remaining.includeAddresses = true
    remaining.addresses = inToRemoveButNotMapping
  }

  return [remaining, removed]
}

/**
 * @category Address Mappings
 */
export function isAddressMappingEmpty(mapping: AddressMapping) {
  return mapping.addresses.length === 0 && mapping.includeAddresses
}

/**
 * @category Address Mappings
 */
export function invertAddressMapping(mapping: AddressMapping) {
  mapping.includeAddresses = !mapping.includeAddresses
  return mapping
}

/**
 * Returns the tracker mapping for a tracker ID mapping. Little different logic because tracker ID mappings can only be reserved IDs (no storage)
 * and can be nonvalid addresses
 * @param {string} trackerMappingId - The mapping ID to get the address mapping for
 *
 * @category Address Mappings
 */
export function getReservedTrackerMapping(trackerMappingId: string) {
  return getReservedMapping(trackerMappingId, true)
}

/**
 * Returns the address mapping for a mapping ID, if it is a reserved ID (i.e. Mint, Manager, All, None, validly formatted address, ...)
 *
 * @param {string} addressMappingId - The mapping ID to get the address mapping for
 *
 * @category Address Mappings
 */
export function getReservedAddressMapping(
  addressMappingId: string,
): AddressMapping {
  return getReservedMapping(addressMappingId)
}

function getReservedMapping(
  addressMappingId: string,
  allowAliases?: boolean,
): AddressMapping {
  let inverted = false
  let addressMapping: AddressMapping | undefined = undefined

  if (addressMappingId[0] === '!' && !addressMappingId.startsWith('!(')) {
    inverted = true
    addressMappingId = addressMappingId.slice(1)
  } else if (addressMappingId.startsWith('!(') && addressMappingId.endsWith(')')) {
    inverted = true
    addressMappingId = addressMappingId.slice(2, -1)
  }

  if (addressMappingId === 'Mint') {
    addressMapping = {
      mappingId: 'Mint',
      addresses: ['Mint'],
      includeAddresses: true,
      uri: '',
      customData: '',
      createdBy: '',
    }
  } else if (addressMappingId.startsWith('AllWithout')) {
    addressMapping = {
      mappingId: addressMappingId,
      addresses: [],
      includeAddresses: false,
      uri: '',
      customData: '',
      createdBy: '',
    }

    const addresses = addressMappingId.slice(10).split(':')

    for (let address of addresses) {
      addressMapping.addresses.push(address)
    }
  } else if (addressMappingId === 'AllWithMint' || addressMappingId === 'All') {
    addressMapping = {
      mappingId: addressMappingId,
      addresses: [],
      includeAddresses: false,
      uri: '',
      customData: '',
      createdBy: '',
    }
  } else if (addressMappingId === 'None') {
    addressMapping = {
      mappingId: 'None',
      addresses: [],
      includeAddresses: true,
      uri: '',
      customData: '',
      createdBy: '',
    }
  } else {
    //split by :
    const addressesToCheck = addressMappingId.split(':')
    let allAreValid = true
    //For tracker IDs, we allow aliasses(aka non valid addresses)
    if (!allowAliases) {
      for (let address of addressesToCheck) {
        if (address != 'Mint' && !convertToCosmosAddress(address)) {
          allAreValid = false
        }
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
      }
    }
  }

  if (inverted && addressMapping) {
    addressMapping.includeAddresses = !addressMapping.includeAddresses
  }

  if (!addressMapping) {
    throw new Error(`Invalid address mapping ID: ${addressMappingId}`)
  }

  return addressMapping
}

/**
 * Generates a mapping ID for a given address mapping.
 *
 * @param {AddressMapping} addressMapping - The address mapping to generate the ID for
 *
 * @category Address Mappings
 */
export const generateReservedMappingId = (
  addressMapping: AddressMapping,
): string => {
  let mappingId = ''

  // Logic to determine the mappingId based on the properties of addressMapping
  if (addressMapping.includeAddresses) {
    if (addressMapping.addresses.length > 0) {
      const addresses = addressMapping.addresses
        .map((x) => (isAddressValid(x) ? convertToCosmosAddress(x) : x))
        .join(':')
      mappingId = `${addresses}`
    } else {
      mappingId = 'None'
    }
  } else {
    if (addressMapping.addresses.length > 0) {
      const addresses = addressMapping.addresses
        .map((x) => (isAddressValid(x) ? convertToCosmosAddress(x) : x))
        .join(':')
      mappingId = `!(${addresses})`
    } else {
      mappingId = 'All'
    }
  }

  return mappingId
}
