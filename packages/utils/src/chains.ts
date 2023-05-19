import { COSMOS, ethToCosmos } from "bitbadgesjs-address-converter";
import { SupportedChain } from "./types/types";
import { ethers } from "ethers";
import { BitBadgesUserInfo, s_BitBadgesUserInfo } from "./types/api";


export const MINT_ACCOUNT: BitBadgesUserInfo = {
  cosmosAddress: 'Mint',
  accountNumber: -1n,
  address: 'Mint',
  chain: SupportedChain.COSMOS,
  collected: [],
  activity: [],
  announcements: [],
  reviews: [],
  seenActivity: 0n,
  createdAt: 0n,
  pagination: {
    activity: {
      bookmark: '',
      hasMore: false
    },
    announcements: {
      bookmark: '',
      hasMore: false
    },
    collected: {
      bookmark: '',
      hasMore: false
    },
    reviews: {
      bookmark: '',
      hasMore: false
    },
  }
}

export const s_MINT_ACCOUNT: s_BitBadgesUserInfo = {
  cosmosAddress: 'Mint',
  accountNumber: "-1",
  address: 'Mint',
  chain: SupportedChain.COSMOS,
  collected: [],
  activity: [],
  announcements: [],
  reviews: [],
  seenActivity: "0",
  createdAt: "0",
  pagination: {
    activity: {
      bookmark: '',
      hasMore: false
    },
    announcements: {
      bookmark: '',
      hasMore: false
    },
    collected: {
      bookmark: '',
      hasMore: false
    },
    reviews: {
      bookmark: '',
      hasMore: false
    },
  }
}

export const s_BLANK_USER_INFO: s_BitBadgesUserInfo = {
  cosmosAddress: '',
  accountNumber: "-1",
  address: '',
  chain: SupportedChain.UNKNOWN,
  collected: [],
  activity: [],
  announcements: [],
  reviews: [],
  seenActivity: "0",
  createdAt: "0",
  pagination: {
    activity: {
      bookmark: '',
      hasMore: false
    },
    announcements: {
      bookmark: '',
      hasMore: false
    },
    collected: {
      bookmark: '',
      hasMore: false
    },
    reviews: {
      bookmark: '',
      hasMore: false
    },
  }
}

/**
 * Converts an address from a supported chain to a cosmos address
 * If we are unable to convert the address, we return an empty string
 *
 * @param {string} address - The address to convert
 */
export function convertToCosmosAddress(address: string) {
  let bech32Address = '';
  try {
    COSMOS.decoder(address);
    bech32Address = address;
  } catch {
    if (ethers.utils.isAddress(address)) {
      bech32Address = ethToCosmos(address);
    }
  }

  return bech32Address;
}

/**
 * Goes through the list of supported chains and returns the chain that the address belongs to.
 *
 * @param {string} address - The address to check
 */
export function getChainForAddress(address: string) {
  try {
    COSMOS.decoder(address);
    return SupportedChain.COSMOS;
  } catch {
    if (ethers.utils.isAddress(address)) {
      return SupportedChain.ETH;
    }
  }

  let addr: string = address;
  if (addr.startsWith('0x')) {
    return SupportedChain.ETH;
  } else if (addr.startsWith('cosmos')) {
    return SupportedChain.COSMOS;
  }

  return SupportedChain.UNKNOWN;
}

/**
 * Gets an abbreviated display address
 *
 * @param {string} address - The address to abbreviate
 */
export function getAbbreviatedAddress(address: string) {
  let isMintAddress = address === MINT_ACCOUNT.address;
  if (isMintAddress) return 'Mint';
  if (address.length == 0) return '...';
  if (address.length < 13) return address;

  return address.substring(0, 10) + '...' + address.substring(address.length - 4, address.length);
}


/**
 * Checks if an address is validly formatted.
 *
 * If chain is not provided, we will try to determine the chain from the address.
 *
 * @param {string} address - The address to check
 * @param {string} chain - The chain to check the address against (optional)
 */
export function isAddressValid(address: string, chain?: string) {
  let isValidAddress = true;

  if (chain == undefined || chain == SupportedChain.UNKNOWN) {
    chain = getChainForAddress(address);
  }

  switch (chain) {
    case SupportedChain.ETH:
    case SupportedChain.UNKNOWN:
      isValidAddress = ethers.utils.isAddress(address);
      break;
    case SupportedChain.COSMOS:
      try {
        COSMOS.decoder(address);
      } catch {
        isValidAddress = false;
      }
      break;
    default:
      isValidAddress = false;
      break;
  }

  if (address === MINT_ACCOUNT.address) {
    isValidAddress = true;
  }

  return isValidAddress;
}
