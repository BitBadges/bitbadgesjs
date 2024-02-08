import * as web3 from '../proto/ethereum/web3_pb'
import * as web3Sol from '../proto/solana/web3_pb'
import * as web3Btc from '../proto/bitcoin/web3_pb'

/**
 * This function is used to create a web3 extension for an Ethereum EIP712 transaction.
 * We use extensions to tell the chain to parse and check the signatures using EIP712 format instead of the default format.
 *
 * @param chainId The chain id of the chain you are using. For mainnet (bitbadges_1-1, this is 1). For testnets / betanet (bitbadges_1-2, this is 2 and so on).
 * @param feePayer The Cosmos address of the fee payer.
 * @param feePayerSig The signature of the signed EIP message. Must resolve to the fee payer address.
 *
 * See documentation for more details:
 */
export function createWeb3Extension(
  chainId: number | bigint,
  feePayer: string,
  feePayerSig: Uint8Array,
) {
  const message = new web3.ExtensionOptionsWeb3Tx({
    typedDataChainId: BigInt(chainId),
    feePayer: feePayer,
    feePayerSig: feePayerSig,
  })
  return {
    message,
    path: message.getType().typeName,
  }
}


/**
 * This function is used to create a web3 extension for a Solana transaction.
 *
 * @param chainId The chain id of the chain you are using. For mainnet (bitbadges_1-1, this is 1). For testnets / betanet (bitbadges_1-2, this is 2 and so on).
 * @param feePayer The mapped Cosmos address of the fee payer. This is the address that signed the transaction. Use solanaToCosmos(...)
 * @param feePayerSig The signature of the signed message. Must resolve to the fee payer address.
 * @param solanaAddress The address of the Solana account. Must map to the Cosmos address for feePayer.
 *
 * See documentation for more details:
 */
export function createWeb3ExtensionSolana(
  chainId: number | bigint,
  feePayer: string,
  feePayerSig: Uint8Array,
  solanaAddress: string,
) {
  const message = new web3Sol.ExtensionOptionsWeb3TxSolana({
    typedDataChainId: BigInt(chainId),
    feePayer: feePayer,
    feePayerSig: feePayerSig,
    chain: "Solana",
    solAddress: solanaAddress,
  })
  return {
    message,
    path: message.getType().typeName,
  }
}


/**
 * This function is used to create a web3 extension for a Bitcoin transaction.
 *
 * @param chainId The chain id of the chain you are using. For mainnet (bitbadges_1-1, this is 1). For testnets / betanet (bitbadges_1-2, this is 2 and so on).
 * @param feePayer The mapped Cosmos address of the fee payer. This is the address that signed the transaction. Use solanaToCosmos(...)
 * @param feePayerSig The signature of the signed message. Must resolve to the fee payer address.
 *
 * See documentation for more details:
 */
export function createWeb3ExtensionBitcoin(
  chainId: number | bigint,
  feePayer: string,
  feePayerSig: Uint8Array,
) {
  const message = new web3Btc.ExtensionOptionsWeb3TxBitcoin({
    typedDataChainId: BigInt(chainId),
    feePayer: feePayer,
    feePayerSig: feePayerSig,
    chain: "Bitcoin",
  })
  return {
    message,
    path: message.getType().typeName,
  }
}
