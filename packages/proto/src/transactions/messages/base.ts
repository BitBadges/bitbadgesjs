import {
  MessageGenerated,
  createTypedData,
} from '../../'
import { Chain, Fee, Sender, SupportedChain } from './common.js'
import {
  createStdFee,
  createStdSignDocFromProto,
  createTransactionWithMultipleMessages
} from './transaction'

/**
 * TxContext is the transaction context for a SignDoc that is independent
 * from the transaction payload.
 */
export interface TxContext {
  chain: Chain
  sender: Sender
  fee: Fee
  memo: string
}

/**
 * EIP712TypedData represents a signable EIP-712 typed data object,
 * including both the types and message object.
 *
 * @remarks
 * See the EIP-712 specification for more:
 * {@link https://eips.ethereum.org/EIPS/eip-712}
 */
export interface EIP712TypedData {
  types: object
  message: object | object[]
}

/**
 * wrapTypeToArray wraps a generic type or array of said type and returns the object wrapped
 * in an array. This enables our interfaces to indiscriminantly take either pure objects or
 * arrays to easily support wrapping muliple messages.
 */
const wrapTypeToArray = <T>(obj: T | T[]) => {
  return Array.isArray(obj) ? obj : [obj]
}


export const createEIP712TypedData = (
  context: TxContext,
  protoMsgs: MessageGenerated | MessageGenerated[],
) => {
  const { fee, sender, chain, memo } = context
  const protoMsgsArray = wrapTypeToArray(protoMsgs)

  try {
    const stdFee = createStdFee(fee.amount, fee.denom, parseInt(fee.gas, 10))
    const stdSignDoc = createStdSignDocFromProto(
      protoMsgsArray,
      stdFee,
      chain.cosmosChainId,
      memo,
      sender.sequence,
      sender.accountNumber,
    )
    return createTypedData(chain.chainId, stdSignDoc)
  } catch (e) {
    console.log(e)
    throw new Error('Error creating EIP712 typed data')
  }
}


const createCosmosPayload = (
  context: TxContext,
  cosmosPayload: any | any[], // TODO: re-export Protobuf Message type from /proto
) => {
  const { fee, sender, chain, memo } = context

  const messages = wrapTypeToArray(cosmosPayload)

  return createTransactionWithMultipleMessages(
    messages,
    memo,
    fee.amount,
    fee.denom,
    parseInt(fee.gas, 10),
    chain.chain === SupportedChain.ETH ? 'ethsecp256' : 'secp256k1',
    sender.pubkey,
    sender.sequence,
    sender.accountNumber,
    chain.cosmosChainId,
  )
}

export const createTransactionPayload = (
  context: TxContext,
  messages: MessageGenerated | MessageGenerated[],
) => {
  return {
    signDirect: createCosmosPayload(context, messages).signDirect,
    legacyAmino: createCosmosPayload(context, messages).legacyAmino,
    eipToSign: createEIP712TypedData(context, messages),
  }
}
