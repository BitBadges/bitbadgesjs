import { createWeb3Extension, createWeb3ExtensionSolana } from '../../'
import { Chain, Sender } from './common'

/**
 * This function is used to convert a signature to a web3 extension for an Ethereum EIP712 transaction.
 * We use extensions to tell the chain to parse and check the signatures using EIP712 format instead of the default format.
 *
 * @param chain - The details of the chain you are using.
 * @param sender - The sender details for the transaction. sender.accountAddress must be the mapped Cosmos address of the Ethereum address.
 * @param hexFormattedSignature - The signature of the signed EIP message. Must resolve to the address in sender.accountAddress.
 */
export function signatureToWeb3Extension(
  chain: Chain,
  sender: Sender,
  hexFormattedSignature: string,
) {
  let signature = hexFormattedSignature
  const temp = hexFormattedSignature.split('0x')
  if (temp.length === 2) {
    [, signature] = temp
  }

  return createWeb3Extension(
    chain.chainId,
    sender.accountAddress,
    Uint8Array.from(Buffer.from(signature, 'hex')),
  )
}

/**
 *This function is used to convert a signature to a web3 extension for a Solana transaction.
 *
 * @param chain - The details of the chain you are using.
 * @param sender - The sender details for the transaction. sender.accountAddress must be the mapped Cosmos address of the Solana address.
 * @param hexFormattedSignature - The signature of the signed message. Must resolve to the fee payer address.
 * @param solanaAddress - The address of the Solana account. Must map to the Cosmos address in sender.accountAddress.
 */
export function signatureToWeb3ExtensionSolana(
  chain: Chain,
  sender: Sender,
  hexFormattedSignature: string,
  solanaAddress: string,
) {
  let signature = hexFormattedSignature
  const temp = hexFormattedSignature.split('0x')
  if (temp.length === 2) {
    [, signature] = temp
  }

  return createWeb3ExtensionSolana(
    chain.chainId,
    sender.accountAddress,
    Uint8Array.from(Buffer.from(signature, 'hex')),
    solanaAddress,
  )
}
