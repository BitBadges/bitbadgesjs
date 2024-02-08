import { AddressList } from '..'
import { convertToCosmosAddress, isAddressValid } from './chains'

/**
 * Checks if a specific account is in the given address list.
 *
 * @category Address Lists
 */
export const isInAddressList = (
  addressesList: AddressList,
  addressToCheck: string,
) => {
  let found = addressesList.addresses.includes(addressToCheck)

  if (!addressesList.whitelist) {
    found = !found
  }

  return found
}

/**
 * Removes all addresses from one address list from another. Returns a new list.
 *
 * Returned list has ID "", so if you want to store it on the blockchain, you must set this with a unique ID.
 *
 * @category Address Lists
 */
export function removeAddressListFromAddressList(
  addressesToRemove: AddressList,
  addressList: AddressList,
) {
  let duplicates = []
  let inToRemoveButNotList = []
  let inListButNotToRemove = []

  for (let address of addressesToRemove.addresses) {
    // Check if address is in addressList.addresses
    let found = addressList.addresses.includes(address)

    if (found) {
      duplicates.push(address)
    } else {
      inToRemoveButNotList.push(address)
    }
  }

  for (let address of addressList.addresses) {
    // Check if address is in addressesToRemove.addresses
    let found = addressesToRemove.addresses.includes(address)

    if (!found) {
      inListButNotToRemove.push(address)
    }
  }

  let removed: AddressList = {
    addresses: [],
    whitelist: false,
    listId: '',
    uri: '',
    customData: '',
    createdBy: '',
  }
  let remaining: AddressList = {
    addresses: [],
    whitelist: false,
    listId: '',
    uri: '',
    customData: '',
    createdBy: '',
  }

  if (addressesToRemove.whitelist && addressList.whitelist) {
    // Case 1
    removed.whitelist = true
    removed.addresses = duplicates

    remaining.whitelist = true
    remaining.addresses = inListButNotToRemove
  } else if (
    !addressesToRemove.whitelist &&
    addressList.whitelist
  ) {
    // Case 2
    removed.whitelist = true
    removed.addresses = inListButNotToRemove

    remaining.whitelist = true
    remaining.addresses = duplicates
  } else if (
    addressesToRemove.whitelist &&
    !addressList.whitelist
  ) {
    // Case 3
    removed.whitelist = true
    removed.addresses = inToRemoveButNotList

    remaining.whitelist = false
    remaining.addresses = [
      ...inListButNotToRemove,
      ...inToRemoveButNotList,
      ...duplicates,
    ]
  } else if (
    !addressesToRemove.whitelist &&
    !addressList.whitelist
  ) {
    // Case 4
    removed.whitelist = false
    removed.addresses = [
      ...inListButNotToRemove,
      ...inToRemoveButNotList,
      ...duplicates,
    ]

    remaining.whitelist = true
    remaining.addresses = inToRemoveButNotList
  }

  return [remaining, removed]
}

/**
 * @category Address Lists
 */
export function isAddressListEmpty(list: AddressList) {
  return list.addresses.length === 0 && list.whitelist
}

/**
 * @category Address Lists
 */
export function invertAddressList(list: AddressList) {
  list.whitelist = !list.whitelist
  return list
}

/**
 * Returns the tracker list for a tracker ID list. Little different logic because tracker ID lists can only be reserved IDs (no storage)
 * and can be nonvalid addresses
 * @param {string} trackerListId - The list ID to get the address list for
 *
 * @category Address Lists
 */
export function getReservedTrackerList(trackerListId: string) {
  return getReservedList(trackerListId, true)
}

/**
 * Returns the address list for a list ID, if it is a reserved ID (i.e. Mint, Manager, All, None, validly formatted address, ...)
 *
 * @param {string} addressListId - The list ID to get the address list for
 *
 * @category Address Lists
 */
export function getReservedAddressList(
  addressListId: string,
): AddressList {
  return getReservedList(addressListId)
}

function getReservedList(
  addressListId: string,
  allowAliases?: boolean,
): AddressList {
  let inverted = false
  let addressList: AddressList | undefined = undefined
  let addressListIdCopy = addressListId

  if (addressListId[0] === '!' && !addressListId.startsWith('!(')) {
    inverted = true
    addressListId = addressListId.slice(1)
  } else if (addressListId.startsWith('!(') && addressListId.endsWith(')')) {
    inverted = true
    addressListId = addressListId.slice(2, -1)
  }

  if (addressListId === 'Mint') {
    addressList = {
      listId: 'Mint',
      addresses: ['Mint'],
      whitelist: true,
      uri: '',
      customData: '',
      createdBy: '',
    }
  } else if (addressListId.startsWith('AllWithout')) {
    addressList = {
      listId: addressListId,
      addresses: [],
      whitelist: false,
      uri: '',
      customData: '',
      createdBy: '',
    }

    const addresses = addressListId.slice(10).split(':')

    for (let address of addresses) {
      addressList.addresses.push(address)
    }
  } else if (addressListId === 'AllWithMint' || addressListId === 'All') {
    addressList = {
      listId: addressListId,
      addresses: [],
      whitelist: false,
      uri: '',
      customData: '',
      createdBy: '',
    }
  } else if (addressListId === 'None') {
    addressList = {
      listId: 'None',
      addresses: [],
      whitelist: true,
      uri: '',
      customData: '',
      createdBy: '',
    }
  } else {
    //split by :
    const addressesToCheck = addressListId.split(':')
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
      addressList = {
        listId: addressListId,
        addresses: addressesToCheck,
        whitelist: true,
        uri: '',
        customData: '',
        createdBy: '',
      }
    }
  }

  if (inverted && addressList) {
    addressList.whitelist = !addressList.whitelist
  }

  if (!addressList) {
    throw new Error(`Invalid address list ID: ${addressListId}`)
  }

  return {
    ...addressList,
    listId: addressListIdCopy,
  }
}

/**
 * Generates a list ID for a given address list.
 *
 * @param {AddressList} addressList - The address list to generate the ID for
 *
 * @category Address Lists
 */
export const generateReservedListId = (
  addressList: AddressList,
): string => {
  let listId = ''

  // Logic to determine the listId based on the properties of addressList
  if (addressList.whitelist) {
    if (addressList.addresses.length > 0) {
      const addresses = addressList.addresses
        .map((x) => (isAddressValid(x) ? convertToCosmosAddress(x) : x))
        .join(':')
      listId = `${addresses}`
    } else {
      listId = 'None'
    }
  } else {
    if (addressList.addresses.length > 0) {
      const addresses = addressList.addresses
        .map((x) => (isAddressValid(x) ? convertToCosmosAddress(x) : x))
        .join(':')
      listId = `!(${addresses})`
    } else {
      listId = 'All'
    }
  }

  return listId
}
