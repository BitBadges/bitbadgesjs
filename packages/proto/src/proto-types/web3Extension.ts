import * as web3 from '../proto/ethermint/web3_pb'

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
    path: 'ethermint.ExtensionOptionsWeb3Tx',
  }
}
