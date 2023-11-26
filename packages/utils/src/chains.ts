import { COSMOS, ethToCosmos, solanaToCosmos } from "./converter";
import { Stringify } from "bitbadgesjs-proto";
import { ethers } from "ethers";
import { SupportedChain } from "./types/types";
import { BitBadgesUserInfo, convertBitBadgesUserInfo } from "./types/users";


export const MINT_ACCOUNT: BitBadgesUserInfo<bigint> = {
  _id: 'Mint',
  cosmosAddress: 'Mint',
  ethAddress: 'Mint',
  solAddress: 'Mint',
  address: 'Mint',
  chain: SupportedChain.COSMOS,
  publicKey: '',
  accountNumber: -1n,
  sequence: 0n,
  collected: [],
  activity: [],
  announcements: [],
  reviews: [],
  addressMappings: [],
  claimAlerts: [],
  merkleChallenges: [],
  approvalsTrackers: [],
  seenActivity: 0n,
  createdAt: 0n,
  views: {},
}


export const BLANK_USER_INFO: BitBadgesUserInfo<bigint> = {
  _id: '',
  cosmosAddress: '',
  ethAddress: '',
  solAddress: 'Mint',
  address: '',
  chain: SupportedChain.UNKNOWN,
  publicKey: '',
  sequence: 0n,
  accountNumber: -1n,
  collected: [],
  activity: [],
  announcements: [],
  claimAlerts: [],
  reviews: [],
  merkleChallenges: [],
  approvalsTrackers: [],
  addressMappings: [],
  seenActivity: 0n,
  createdAt: 0n,
  views: {},
}


export const s_MINT_ACCOUNT: BitBadgesUserInfo<string> = convertBitBadgesUserInfo(MINT_ACCOUNT, Stringify);

export const s_BLANK_USER_INFO: BitBadgesUserInfo<string> = convertBitBadgesUserInfo(BLANK_USER_INFO, Stringify);

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
    } else if (address.length == 44) {
      try {
        // Decode the base58 Solana public key
        return solanaToCosmos(address);
      } catch {
        bech32Address = '';
      }
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
  } else if (address.length == 44) {
    return SupportedChain.SOLANA;
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
    // case SupportedChain.SOLANA:
    //   isValidAddress = address.length == 44;
    //   break;
    default:
      isValidAddress = address.length == 44; //Solana address
      break;
  }

  if (address === MINT_ACCOUNT.address) {
    isValidAddress = true;
  }

  return isValidAddress;
}
