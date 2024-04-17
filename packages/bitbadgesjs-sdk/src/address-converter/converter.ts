import { isValidChecksumAddress, stripHexPrefix, toChecksumAddress } from 'crypto-addr-codec';
import { bech32 } from 'bech32';
import { sha256 } from '@cosmjs/crypto';
import { ethers } from 'ethers';
import { SupportedChain } from '@/common/types';
import bs58 from 'bs58';

const BITCOIN_WITNESS_VERSION_SEPARATOR_BYTE = 0;

function makeChecksummedHexDecoder(chainId?: number) {
  return (data: string) => {
    const stripped = stripHexPrefix(data);
    if (!isValidChecksumAddress(data, chainId || null) && stripped !== stripped.toLowerCase() && stripped !== stripped.toUpperCase()) {
      throw Error('Invalid address checksum');
    }
    return Buffer.from(stripHexPrefix(data), 'hex');
  };
}

function makeChecksummedHexEncoder(chainId?: number) {
  return (data: Buffer) => toChecksumAddress(data.toString('hex'), chainId || null);
}

const hexChecksumChain = (name: string, chainId?: number) => ({
  decoder: makeChecksummedHexDecoder(chainId),
  encoder: makeChecksummedHexEncoder(chainId),
  name
});

const ETH = hexChecksumChain('ETH');

function makeBech32Encoder(prefix: string) {
  return (data: Buffer) => {
    const words = bech32.toWords(data);
    const wordsToEncode = prefix == 'bc' ? [BITCOIN_WITNESS_VERSION_SEPARATOR_BYTE, ...words] : words;
    const encodedAddress = bech32.encode(prefix, wordsToEncode);

    return encodedAddress;
  };
}

function makeBech32Decoder(currentPrefix: string) {
  return (data: string) => {
    const { prefix, words } = bech32.decode(data);
    if (prefix !== currentPrefix) {
      throw Error('Unrecognised address format');
    }
    if (prefix == 'bc') {
      //remove witness version separator byte
      words.shift();
    }

    return Buffer.from(bech32.fromWords(words));
  };
}

const bech32Chain = (name: string, prefix: string) => ({
  decoder: makeBech32Decoder(prefix),
  encoder: makeBech32Encoder(prefix),
  name
});

const COSMOS = bech32Chain('COSMOS', 'cosmos');

const ethToCosmos = (ethAddress: string) => {
  const data = ETH.decoder(ethAddress);
  return COSMOS.encoder(data);
};

const cosmosToEth = (cosmosAddress: string) => {
  const data = COSMOS.decoder(cosmosAddress);
  return ETH.encoder(data);
};

const BTC = bech32Chain('BTC', 'bc');

const btcToCosmos = (btcAddress: string) => {
  const data = BTC.decoder(btcAddress);
  return COSMOS.encoder(data);
};

const cosmosToBtc = (cosmosAddress: string) => {
  const data = COSMOS.decoder(cosmosAddress);
  return BTC.encoder(data);
};

//Note this is only one way due to how Solana addresses are
//We can't convert from Cosmos to Solana bc Solana to Cosmsos is a hash + truncate, so we cannot reverse a hash

const solanaToCosmos = (solanaAddress: string) => {
  const solanaPublicKeyBuffer = bs58.decode(solanaAddress);
  const hash = sha256(solanaPublicKeyBuffer);
  const truncatedHash = hash.slice(0, 20);
  const bech32Address = bech32.encode('cosmos', bech32.toWords(truncatedHash));
  return bech32Address;
};

/**
 * Converts an address from any supported chain to a Cosmos formatted address.
 * If we are unable to convert the address, we return an empty string ('').
 *
 * @category Address Utils
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
 * Converts an address from a supported chain to a Cosmos address. Throws when cannot convert.
 *
 * @category Address Utils
 */
export function mustConvertToCosmosAddress(address: string) {
  const bech32Address = convertToCosmosAddress(address);
  if (!bech32Address) throw new Error('Could not convert. Please make sure inputted address is well-formed');

  return bech32Address;
}

/**
 * Converts an address from a supported chain to a Ethereum address. Throws when cannot convert.
 *
 * @category Address Utils
 */
export function mustConvertToEthAddress(address: string) {
  const bech32Address = convertToEthAddress(address);
  if (!bech32Address) throw new Error('Could not convert. Please make sure inputted address is well-formed');

  return bech32Address;
}

/**
 * Converts an address from a supported chain to a Bitcoin address. Throws when cannot convert.
 *
 *@category Address Utils
 */
export function mustConvertToBtcAddress(address: string) {
  const bech32Address = convertToBtcAddress(address);
  if (!bech32Address) throw new Error('Could not convert. Please make sure inputted address is well-formed');

  return bech32Address;
}

/**
 * Converts an address from a supported chain to an Ethereum address
 * If we are unable to convert the address, we return an empty string
 *
 * @category Address Utils
 */
export function convertToEthAddress(address: string) {
  try {
    return cosmosToEth(convertToCosmosAddress(address));
  } catch {
    return '';
  }
}

/**
 * Converts an address from a supported chain to a Bitcoin address
 * If we are unable to convert the address, we return an empty string
 *
 * @category Address Utils
 */
export function convertToBtcAddress(address: string) {
  try {
    return cosmosToBtc(convertToCosmosAddress(address));
  } catch {
    return '';
  }
}

/**
 * Goes through the list of supported chains and returns the chain that the address belongs to.
 *
 * @category Address Utils
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

  const addr: string = address;
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
 * @category Address Utils
 */
export function getAbbreviatedAddress(address: string) {
  const isMintAddress = address === 'Mint';
  if (isMintAddress) return 'Mint';
  if (address.length == 0) return '...';
  if (address.length < 13) return address;

  return address.substring(0, 10) + '...' + address.substring(address.length - 4, address.length);
}

/**
 * Checks if an address is validly formatted. If a chain is not provided, we will try to determine the chain from the address.
 *
 * @category Address Utils
 *
 * @example
 * ```ts
 * const valid = isAddressValid('cosmos1xv9tklw7a7g3ll4ht2cjm6y22p2w7pk8j3w4h6');
 * console.log(valid);
 * ```
 */
export function isAddressValid(address: string, chain?: SupportedChain) {
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
    // TODO:
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

  if (address === 'Mint') {
    isValidAddress = true;
  }

  return isValidAddress;
}
