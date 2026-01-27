import { SupportedChain } from '@/common/types.js';
import { bech32 } from 'bech32';

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

/**
 * Converts an address to a bech32 formatted address prefixed with `bb`.
 * Only accepts addresses that already start with `bb` or `bbvaloper`.
 * If the address is not a valid BitBadges address, we return an empty string ('').
 *
 * @category Address Utils
 */
export function convertToBitBadgesAddress(address: string) {
  if (address.startsWith('bbvaloper')) {
    return address;
  }

  if (address.startsWith('bb')) {
    try {
      // Validate that it's a valid bech32 address
      BITBADGES.decoder(address);
      return address;
    } catch {
      return '';
    }
  }

  return '';
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
 * Returns the chain that the address belongs to.
 * Only Cosmos (bb-prefixed) addresses are supported.
 *
 * @category Address Utils
 */
export function getChainForAddress(address: string) {
  if (address.startsWith('bb')) {
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
 * Only Cosmos (bb-prefixed) addresses are supported.
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
  if (address === 'Mint') {
    return true;
  }

  //TODO:
  if (address.startsWith('bbvaloper')) {
    return true;
  }

  if (chain == undefined || chain == SupportedChain.UNKNOWN) {
    chain = getChainForAddress(address);
  }

  if (chain === SupportedChain.COSMOS) {
    try {
      BITBADGES.decoder(address);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
