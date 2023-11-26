import * as web3 from '../proto/ethereum/web3_pb'
import * as web3Sol from '../proto/solana/web3_pb'

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
