
import {
  isValidChecksumAddress,
  stripHexPrefix,
  toChecksumAddress,
} from 'crypto-addr-codec'
import { bech32 } from 'bech32'
import { sha256 } from '@cosmjs/crypto';

const bs58 = require('bs58');

const BITCOIN_WITNESS_VERSION_SEPARATOR_BYTE = 0;

function makeChecksummedHexDecoder(chainId?: number) {
  return (data: string) => {
    const stripped = stripHexPrefix(data)
    if (
      !isValidChecksumAddress(data, chainId || null) &&
      stripped !== stripped.toLowerCase() &&
      stripped !== stripped.toUpperCase()
    ) {
      throw Error('Invalid address checksum')
    }
    return Buffer.from(stripHexPrefix(data), 'hex')
  }
}

function makeChecksummedHexEncoder(chainId?: number) {
  return (data: Buffer) =>
    toChecksumAddress(data.toString('hex'), chainId || null)
}

const hexChecksumChain = (name: string, chainId?: number) => ({
  decoder: makeChecksummedHexDecoder(chainId),
  encoder: makeChecksummedHexEncoder(chainId),
  name,
})

const ETH = hexChecksumChain('ETH')

function makeBech32Encoder(prefix: string) {
  return (data: Buffer) => {
    const words = bech32.toWords(data)
    const wordsToEncode = prefix == 'bc' ? [BITCOIN_WITNESS_VERSION_SEPARATOR_BYTE, ...words] : words;
    const encodedAddress = bech32.encode(prefix, wordsToEncode)

    return encodedAddress
  }
}

function makeBech32Decoder(currentPrefix: string) {
  return (data: string) => {
    const { prefix, words } = bech32.decode(data)
    if (prefix !== currentPrefix) {
      throw Error('Unrecognised address format')
    }
    if (prefix == 'bc') {
      //remove witness version separator byte
      words.shift();
    }

    return Buffer.from(bech32.fromWords(words))
  }
}

const bech32Chain = (name: string, prefix: string) => ({
  decoder: makeBech32Decoder(prefix),
  encoder: makeBech32Encoder(prefix),
  name,
})

const COSMOS = bech32Chain('COSMOS', 'cosmos')

//Converts an eth address to its corresponding cosmos address (bech32)
export const ethToCosmos = (ethAddress: string) => {
  const data = ETH.decoder(ethAddress)
  return COSMOS.encoder(data)
}

//Converts a cosmos address to its corresponding eth address (hex)
export const cosmosToEth = (cosmosAddress: string) => {
  const data = COSMOS.decoder(cosmosAddress)
  return ETH.encoder(data)
}

const BTC = bech32Chain('BTC', 'bc')

//Converts a btc address to its corresponding cosmos address (bech32)
export const btcToCosmos = (btcAddress: string) => {
  const data = BTC.decoder(btcAddress)
  return COSMOS.encoder(data)
}

//Converts a cosmos address to its corresponding btc address (bech32)
export const cosmosToBtc = (cosmosAddress: string) => {
  const data = COSMOS.decoder(cosmosAddress)
  return BTC.encoder(data)
}

//Note this is only one way due to how Solana addresses are
//We can't convert from Cosmos to Solana bc Solana to Cosmsos is a hash + truncate, so we cannot reverse a hash


//Converts a solana address to its corresponding cosmos address (bech32)
export const solanaToCosmos = (solanaAddress: string) => {
  const solanaPublicKeyBuffer = bs58.decode(solanaAddress);
  const hash = sha256(solanaPublicKeyBuffer);
  const truncatedHash = hash.slice(0, 20);
  const bech32Address = bech32.encode('cosmos', bech32.toWords(truncatedHash))
  return bech32Address;
}

//Converts a solana address to its corresponding eth address (hex)
export const solanaToEth = (solanaAddress: string) => {
  return cosmosToEth(solanaToCosmos(solanaAddress));
}
