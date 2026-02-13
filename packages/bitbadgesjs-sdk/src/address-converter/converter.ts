import { SupportedChain } from '@/common/types.js';
import { bech32 } from 'bech32';
import { isValidChecksumAddress, stripHexPrefix, toChecksumAddress } from 'crypto-addr-codec';
import { isAddress } from 'web3-validator';

function makeBech32Decoder(currentPrefix: string) {
  return (data: string) => {
    const { prefix, words } = bech32.decode(data);
    if (prefix !== currentPrefix) {
      throw Error('Unrecognised address format');
    }
    return Buffer.from(bech32.fromWords(words));
  };
}

function makeBech32Encoder(prefix: string) {
  return (data: Buffer) => {
    const words = bech32.toWords(data);
    const encodedAddress = bech32.encode(prefix, words);
    return encodedAddress;
  };
}

const bech32Chain = (name: string, prefix: string) => ({
  decoder: makeBech32Decoder(prefix),
  encoder: makeBech32Encoder(prefix),
  name
});

const BITBADGES = bech32Chain('BITBADGES', 'bb');

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

const ethToBitBadges = (ethAddress: string) => {
  const data = ETH.decoder(ethAddress);
  return BITBADGES.encoder(data);
};

const bitbadgesToEth = (bitbadgesAddress: string) => {
  const data = BITBADGES.decoder(bitbadgesAddress);
  return ETH.encoder(data);
};

/**
 * Converts an address from any supported chain to a bech32 formatted address prefixed with `bb`.
 * If we are unable to convert the address, we return an empty string ('').
 *
 * @category Address Utils
 */
export function convertToBitBadgesAddress(address: string) {
  let bech32Address = '';

  if (address.startsWith('bbvaloper')) {
    return address;
  }

  try {
    bitbadgesToEth(address); //throws on failure
    bech32Address = address;
  } catch {
    if (isAddress(address, true)) {
      bech32Address = ethToBitBadges(address);
    } else if (address.startsWith('bb')) {
      try {
        // Validate that it's a valid bech32 address
        BITBADGES.decoder(address);
        bech32Address = address;
      } catch {
        bech32Address = '';
      }
    }
  }

  return bech32Address;
}

/**
 * @category Address Utils
 */
export function getConvertFunctionFromPrefix(prefix: string, withAliasSupport = true) {
  return (address: string) => {
    if (withAliasSupport && ['Mint', 'All', 'Total'].includes(address)) {
      return address;
    }

    if (prefix === 'bb') {
      return convertToBitBadgesAddress(address);
    }

    throw new Error(`Unsupported prefix: ${prefix}`);
  };
}

/**
 * Converts an address from a supported chain to a BitBadges address. Throws when cannot convert.
 *
 * @category Address Utils
 */
export function mustConvertToBitBadgesAddress(address: string) {
  const bech32Address = convertToBitBadgesAddress(address);
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
 * Converts an address from a supported chain to an Ethereum address
 * If we are unable to convert the address, we return an empty string
 *
 * @category Address Utils
 */
export function convertToEthAddress(address: string) {
  try {
    return bitbadgesToEth(convertToBitBadgesAddress(address));
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
  const addr: string = address;
  if (addr.startsWith('0x')) {
    return SupportedChain.ETH;
  } else if (addr.startsWith('bb')) {
    return SupportedChain.COSMOS;
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
 * const valid = isAddressValid('bb1xv9tklw7a7g3ll4ht2cjm6y22p2w7pk8j3w4h6');
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
      isValidAddress = isAddress(address);
      break;
    case SupportedChain.COSMOS:
      try {
        bitbadgesToEth(address); //throws on failure
        isValidAddress = true;
      } catch {
        isValidAddress = false;
      }
      break;
    default:
      break;
  }

  if (address === 'Mint') {
    isValidAddress = true;
  } else if (address.startsWith('bbvaloper')) {
    isValidAddress = true;
  }

  return isValidAddress;
}
