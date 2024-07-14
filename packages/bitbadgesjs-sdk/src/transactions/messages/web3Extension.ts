import type { Chain, Sender } from './common.js';
import * as web3 from '@/proto/ethereum/web3_pb.js';
import * as web3Sol from '@/proto/solana/web3_pb.js';
import * as web3Btc from '@/proto/bitcoin/web3_pb.js';

/**
 * This function is used to convert a signature to a web3 extension for an Ethereum EIP712 transaction.
 * We use extensions to tell the chain to parse and check the signatures using EIP712 format instead of the default format.
 *
 * @param chain - The details of the chain you are using.
 * @param sender - The sender details for the transaction. sender.accountAddress must be the mapped Cosmos address of the Ethereum address.
 * @param hexFormattedSignature - The signature of the signed EIP message. Must resolve to the address in sender.accountAddress.
 */
export function signatureToWeb3ExtensionEthereum(chain: Chain, sender: Sender, hexFormattedSignature: string) {
  let signature = hexFormattedSignature;
  const temp = hexFormattedSignature.split('0x');
  if (temp.length === 2) {
    [, signature] = temp;
  }

  return createWeb3ExtensionEthereum(chain.chainId, sender.accountAddress, Uint8Array.from(Buffer.from(signature, 'hex')));
}

/**
 *This function is used to convert a signature to a web3 extension for a Solana transaction.
 *
 * @param chain - The details of the chain you are using.
 * @param sender - The sender details for the transaction. sender.accountAddress must be the mapped Cosmos address of the Solana address.
 * @param hexFormattedSignature - The signature of the signed message. Must resolve to the fee payer address.
 * @param solanaAddress - The address of the Solana account. Must map to the Cosmos address in sender.accountAddress.
 */
export function signatureToWeb3ExtensionSolana(chain: Chain, sender: Sender, hexFormattedSignature: string, solanaAddress: string) {
  let signature = hexFormattedSignature;
  const temp = hexFormattedSignature.split('0x');
  if (temp.length === 2) {
    [, signature] = temp;
  }

  return createWeb3ExtensionSolana(chain.chainId, sender.accountAddress, Uint8Array.from(Buffer.from(signature, 'hex')), solanaAddress);
}

/**
 *This function is used to convert a signature to a web3 extension for a Bitcoin transaction.
 *
 * @param chain - The details of the chain you are using.
 * @param sender - The sender details for the transaction. sender.accountAddress must be the mapped Cosmos address of the Bitcoin address.
 * @param hexFormattedSignature - The signature of the signed message. Must resolve to the fee payer address.
 */
export function signatureToWeb3ExtensionBitcoin(chain: Chain, sender: Sender, hexFormattedSignature: string) {
  let signature = hexFormattedSignature;
  const temp = hexFormattedSignature.split('0x');
  if (temp.length === 2) {
    [, signature] = temp;
  }

  return createWeb3ExtensionBitcoin(chain.chainId, sender.accountAddress, Uint8Array.from(Buffer.from(signature, 'hex')));
}

/**
 * This function is used to create a web3 extension for an Ethereum EIP712 transaction.
 * We use extensions to tell the chain to parse and check the signatures using EIP712 format instead of the default format.
 *
 * @param chainId The chain id of the chain you are using. For mainnet (bitbadges_1-1, this is 1). For testnets (bitbadges_1-2, this is 2 and so on).
 * @param feePayer The Cosmos address of the fee payer.
 * @param feePayerSig The signature of the signed EIP message. Must resolve to the fee payer address.
 *
 * See documentation for more details:
 */
export function createWeb3ExtensionEthereum(chainId: number | bigint, feePayer: string, feePayerSig: Uint8Array) {
  const message = new web3.ExtensionOptionsWeb3Tx({
    typedDataChainId: BigInt(chainId),
    feePayer: feePayer,
    feePayerSig: feePayerSig
  });
  return {
    message,
    path: message.getType().typeName
  };
}

/**
 * This function is used to create a web3 extension for a Solana transaction.
 *
 * @param chainId The chain id of the chain you are using. For mainnet (bitbadges_1-1, this is 1). For testnets (bitbadges_1-2, this is 2 and so on).
 * @param feePayer The mapped Cosmos address of the fee payer. This is the address that signed the transaction. Use solanaToCosmos(...)
 * @param feePayerSig The signature of the signed message. Must resolve to the fee payer address.
 * @param solanaAddress The address of the Solana account. Must map to the Cosmos address for feePayer.
 *
 * See documentation for more details:
 */
export function createWeb3ExtensionSolana(chainId: number | bigint, feePayer: string, feePayerSig: Uint8Array, solanaAddress: string) {
  const message = new web3Sol.ExtensionOptionsWeb3TxSolana({
    typedDataChainId: BigInt(chainId),
    feePayer: feePayer,
    feePayerSig: feePayerSig,
    chain: 'Solana',
    solAddress: solanaAddress
  });
  return {
    message,
    path: message.getType().typeName
  };
}

/**
 * This function is used to create a web3 extension for a Bitcoin transaction.
 *
 * @param chainId The chain id of the chain you are using. For mainnet (bitbadges_1-1, this is 1). For testnets (bitbadges_1-2, this is 2 and so on).
 * @param feePayer The mapped Cosmos address of the fee payer. This is the address that signed the transaction. Use solanaToCosmos(...)
 * @param feePayerSig The signature of the signed message. Must resolve to the fee payer address.
 *
 * See documentation for more details:
 */
export function createWeb3ExtensionBitcoin(chainId: number | bigint, feePayer: string, feePayerSig: Uint8Array) {
  const message = new web3Btc.ExtensionOptionsWeb3TxBitcoin({
    typedDataChainId: BigInt(chainId),
    feePayer: feePayer,
    feePayerSig: feePayerSig,
    chain: 'Bitcoin'
  });
  return {
    message,
    path: message.getType().typeName
  };
}
