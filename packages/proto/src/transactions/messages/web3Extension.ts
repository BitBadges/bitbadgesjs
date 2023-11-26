import { createWeb3Extension, createWeb3ExtensionSolana } from '../../'
import { Chain, Sender } from './common'

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
