import { protoTxNamespace } from '../../'

export interface EIPToSign {
  types: object
  primaryType: string
  domain: {
    name: string
    version: string
    chainId: number
    verifyingContract: string //address
    salt: string //bytes32
  }
  message: object
}
export interface Fee {
  amount: string
  denom: string
  gas: string
}

export interface Sender {
  accountAddress: string
  sequence: number
  accountNumber: number
  pubkey: string
}

/**
 * SupportedChain is an enum of all the supported chains.
 * Currently, we only support Ethereum and Cosmos.
 *
 * Has an UNKNOWN value for when we don't know the chain yet.
 *
 * @typedef {string} SupportedChain
 *
 * @category API / Indexer
 */
export enum SupportedChain {
  ETH = 'Ethereum',
  COSMOS = 'Cosmos',
}


export interface Chain {
  chainId: number
  cosmosChainId: string
  chain: SupportedChain
}
export interface TxGenerated {
  signDirect: {
    body: protoTxNamespace.txn.TxBody
    authInfo: protoTxNamespace.txn.AuthInfo
    signBytes: string
  }
  legacyAmino: {
    body: protoTxNamespace.txn.TxBody
    authInfo: protoTxNamespace.txn.AuthInfo
    signBytes: string
  }
  eipToSign: EIPToSign
}
