import { btcToCosmos, cosmosToBtc, cosmosToEth, ethToCosmos, solanaToCosmos } from "./converter";
import { Stringify } from "..";
import { ethers } from "ethers";
import { SupportedChain } from "./types/types";
import { BitBadgesUserInfo, convertBitBadgesUserInfo } from "./types/users";


export const MINT_ACCOUNT: BitBadgesUserInfo<bigint> = {
  cosmosAddress: 'Mint',
  ethAddress: 'Mint',
  solAddress: 'Mint',
  btcAddress: 'Mint',
  address: 'Mint',
  chain: SupportedChain.COSMOS,
  pubKeyType: 'secp256k1',
  publicKey: '',
  accountNumber: -1n,
  sequence: 0n,
  collected: [],
  activity: [],
  listsActivity: [],
  announcements: [],
  reviews: [],
  addressLists: [],
  claimAlerts: [],
  merkleChallenges: [],
  approvalTrackers: [],
  authCodes: [],
  seenActivity: 0n,
  createdAt: 0n,
  views: {},
}


export const BLANK_USER_INFO: BitBadgesUserInfo<bigint> = {
  cosmosAddress: '',
  ethAddress: '',
  solAddress: '',
  btcAddress: '',
  address: '',
  chain: SupportedChain.UNKNOWN,
  pubKeyType: '',
  publicKey: '',
  sequence: 0n,
  accountNumber: -1n,
  collected: [],
  activity: [],
  announcements: [],
  claimAlerts: [],
  reviews: [],
  merkleChallenges: [],
  approvalTrackers: [],
  addressLists: [],
  listsActivity: [],
  authCodes: [],
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
    cosmosToEth(address); //throws on failure
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
    } else if (address.startsWith('bc')) {
      bech32Address = btcToCosmos(address);
    }
  }

  return bech32Address;
}


/**
 * Converts an address from a supported chain to a cosmos address. Throws when cannot convert.
 *
 * @param {string} address - The address to convert
 */
export function mustConvertToCosmosAddress(address: string) {
  let bech32Address = convertToCosmosAddress(address);
  if (!bech32Address) throw new Error("Could not convert. Please make sure inputted address is well-formed")


  return bech32Address;
}

/**
 * Converts an address from a supported chain to a Ethereum address. Throws when cannot convert.
 *
 * @param {string} address - The address to convert
 */
export function mustConvertToEthAddress(address: string) {
  let bech32Address = convertToEthAddress(address);
  if (!bech32Address) throw new Error("Could not convert. Please make sure inputted address is well-formed")

  return bech32Address;
}

/**
 * Converts an address from a supported chain to a Bitcoin address. Throws when cannot convert.
 *
 * @param {string} address - The address to convert
 */
export function mustConvertToBtcAddress(address: string) {
  let bech32Address = convertToBtcAddress(address);
  if (!bech32Address) throw new Error("Could not convert. Please make sure inputted address is well-formed")

  return bech32Address;
}

/**
 * Converts an address from a supported chain to an Ethereum address
 * If we are unable to convert the address, we return an empty string
 *
 * @param {string} address - The address to convert
 */
export function convertToEthAddress(address: string) {
  let bech32Address = '';
  try {
    bech32Address = cosmosToEth(convertToCosmosAddress(address));
  } catch { }

  return bech32Address;
}


/**
 * Converts an address from a supported chain to a Bitcoin address
 * If we are unable to convert the address, we return an empty string
 *
 * @param {string} address - The address to convert
 */
export function convertToBtcAddress(address: string) {
  let bech32Address = '';
  try {
    bech32Address = cosmosToBtc(convertToCosmosAddress(address));
  } catch { }

  return bech32Address;
}

/**
 * Goes through the list of supported chains and returns the chain that the address belongs to.
 *
 * @param {string} address - The address to check
 */
export function getChainForAddress(address: string) {
  try {
    cosmosToEth(address); //throws on failure
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
  } else if (address.startsWith('bc')) {
    return SupportedChain.BTC;
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
        cosmosToEth(address); //throws on failure
      } catch {
        isValidAddress = false;
      }
      break;
    // case SupportedChain.SOLANA:
    //   isValidAddress = address.length == 44;
    //   break;
    case SupportedChain.BTC:
      try {

        cosmosToEth(btcToCosmos(address)); //throws on failure
      } catch {
        isValidAddress = false;
      }

      break;
    default:
      isValidAddress = address.length == 44; //Solana address
      break;
  }

  if (address === MINT_ACCOUNT.address) {
    isValidAddress = true;
  }

  return isValidAddress;
}


//Betanet
export const BitBadgesKeplrSuggestBetanetChainInfo = {
  chainId: "bitbadges_1-2",
  chainName: "BitBadges",
  chainSymbolImageUrl: "https://avatars.githubusercontent.com/u/86890740",
  coinImageUrl: "https://avatars.githubusercontent.com/u/86890740",
  rpc: 'https://node.bitbadges.io/rpc',
  rest: 'https://node.bitbadges.io/api',
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: "cosmos",
    bech32PrefixAccPub: "cosmos" + "pub",
    bech32PrefixValAddr: "cosmos" + "valoper",
    bech32PrefixValPub: "cosmos" + "valoperpub",
    bech32PrefixConsAddr: "cosmos" + "valcons",
    bech32PrefixConsPub: "cosmos" + "valconspub",
  },
  currencies: [
    {
      coinDenom: "BADGE",
      coinMinimalDenom: "badge",
      coinDecimals: 0,
      coinGeckoId: "cosmos",
      coinImageUrl: "https://avatars.githubusercontent.com/u/86890740",
    },
  ],
  feeCurrencies: [
    {
      coinDenom: "BADGE",
      coinMinimalDenom: "badge",
      coinDecimals: 0,
      coinGeckoId: "cosmos",
      gasPriceStep: {
        low: 0.000000000001,
        average: 0.000000000001,
        high: 0.000000000001,
      },
      coinImageUrl: "https://avatars.githubusercontent.com/u/86890740",
    },
  ],
  stakeCurrency: {
    coinDenom: "BADGE",
    coinMinimalDenom: "badge",
    coinDecimals: 0,
    coinGeckoId: "cosmos",
    coinImageUrl: "https://avatars.githubusercontent.com/u/86890740",
  }
}