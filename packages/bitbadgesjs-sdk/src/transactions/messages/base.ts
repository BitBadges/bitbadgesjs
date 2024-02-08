import { Message } from '@bufbuild/protobuf'
import {
  MessageGenerated,
  SupportedChain,
  createProtoMsg,
  createTxRaw,
  createTxRawWithExtension,
  createTypedData,
  generatePostBodyBroadcast,
  signatureToWeb3Extension,
  signatureToWeb3ExtensionBitcoin,
  signatureToWeb3ExtensionSolana,
} from '../..'
import { populateUndefinedForMsgCreateCollection, populateUndefinedForMsgTransferBadges, populateUndefinedForMsgUniversalUpdateCollection, populateUndefinedForMsgUpdateCollection, populateUndefinedForMsgUpdateUserApprovals } from '../../eip712/payload/samples/getSampleMsg'
import { MsgCreateCollection, MsgTransferBadges, MsgUniversalUpdateCollection, MsgUpdateCollection, MsgUpdateUserApprovals } from '../../proto/badges/tx_pb'
import { TxBody, AuthInfo, TxRaw } from '../../proto/cosmos/tx/v1beta1/tx_pb'
import { Chain, Fee, Sender } from './common.js'
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
  domain: object
  primaryType: string
}

/**
 * wrapTypeToArray wraps a generic type or array of said type and returns the object wrapped
 * in an array. This enables our interfaces to indiscriminantly take either pure objects or
 * arrays to easily support wrapping muliple messages.
 */
const wrapTypeToArray = <T>(obj: T | T[]) => {
  return Array.isArray(obj) ? obj : [obj]
}


const createEIP712TypedData = (
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
    chain.chain === SupportedChain.ETH ? 'ethsecp256' : chain.chain === SupportedChain.SOLANA ? 'ed25519' : 'secp256k1',
    sender.pubkey,
    sender.sequence,
    sender.accountNumber,
    chain.cosmosChainId,
  )
}

function recursivelySort(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(recursivelySort);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj)
      .sort()
      .reduce((result, key) => {
        result[key] = recursivelySort(obj[key] as any);
        return result;
      }, {} as any);
  }
  return obj as any;
}

export interface TransactionPayload {
  legacyAmino: {
    body: TxBody;
    authInfo: AuthInfo;
    signBytes: string;
  };
  signDirect: {
    body: TxBody;
    authInfo: AuthInfo;
    signBytes: string;
  };
  eipToSign: EIP712TypedData
  jsonToSign: string
}

/**
 * createTransactionPayload creates a transaction payload for a given transaction context and messages.
 *
 * It returns the payload in the following format: { signDirect, legacyAmino, eipToSign, jsonToSign }
 * signDirect and legacyAmino are the payloads for signing with the respective signing methods from the Cosmos SDK.
 * eipToSign is the payload to sign for Ethereum EIP-712 signing.
 * jsonToSign is the payload to sign for Solana signing.
 *
 * @param {TxContext} context - The transaction context.
 * @param {MessageGenerated | MessageGenerated[]} messages - The message(s) to create the transaction payload for.
 */
export const createTransactionPayload = (
  context: TxContext,
  messages: Message | Message[],
): TransactionPayload => {
  messages = wrapTypeToArray(messages)

  //Don't do anything with these msgs like setShowJson bc they are simulated messages, not final ones
  let generatedMsgs: MessageGenerated[] = []
  for (const cosmosMsg of messages) {
    generatedMsgs.push(createProtoMsg(cosmosMsg));
  }
  generatedMsgs = normalizeMessagesIfNecessary(generatedMsgs)


  if (context.sender.accountAddress === '' || !context.sender.accountAddress.startsWith('cosmos')) {
    throw new Error('Account address must be a validly formatted Cosmos address')
  }

  if (context.sender.accountNumber <= 0) {
    throw new Error('Account number must be greater than 0. This means the user is unregistered on the blockchain. Users can be registered by sending them any amount of $BADGE. This is a pre-requisite because the user needs to be able to pay for the transaction fees.')
  }

  if (context.sender.sequence < 0) {
    throw new Error('Sequence must be greater than or equal to 0')
  }

  // if (context.sender.pubkey === '') {
  //   throw new Error('Public key must be a validly formatted public key')
  // }

  const eipTxn = createEIP712TypedData(context, generatedMsgs)
  const sortedEipMessage = recursivelySort(eipTxn.message);
  const message = JSON.stringify(sortedEipMessage);

  return {
    signDirect: createCosmosPayload(context, generatedMsgs).signDirect,
    legacyAmino: createCosmosPayload(context, generatedMsgs).legacyAmino,
    eipToSign: createEIP712TypedData(context, generatedMsgs),
    jsonToSign: message,
  }
}

//Because the current eip712 and other code doesn't support Msgs with optional / empty fields,
//we need to populate undefined fields with empty default values
const normalizeMessagesIfNecessary = (messages: MessageGenerated[]) => {
  const newMessages = messages.map((msg) => {
    const msgVal = msg.message;

    if (msgVal.getType().typeName === MsgUpdateCollection.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgUpdateCollection(msgVal as MsgUpdateCollection))
    } else if (msgVal.getType().typeName === MsgUpdateUserApprovals.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgUpdateUserApprovals(msgVal as MsgUpdateUserApprovals))
    } else if (msgVal.getType().typeName === MsgTransferBadges.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgTransferBadges(msgVal as MsgTransferBadges))
    } else if (msgVal.getType().typeName === MsgCreateCollection.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgCreateCollection(msgVal as MsgCreateCollection))
    } else if (msgVal.getType().typeName === MsgUniversalUpdateCollection.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgUniversalUpdateCollection(msgVal as MsgUniversalUpdateCollection))
    }

    //MsgCreateAddressLists and MsgDeleteCollection should be fine bc they are all primitive types and required
    //We only normalize if there is a custom type which could be undefined

    return msg
  })

  return newMessages;
}

export function createTxRawBitcoin(context: TxContext, payload: TransactionPayload, signature: string): {
  message: TxRaw;
  path: string;
} {
  const { chain, sender } = context;

  let txnExtension = signatureToWeb3ExtensionBitcoin(chain, sender, signature);
  // Create the txRaw
  let rawTx = createTxRawWithExtension(
    payload.legacyAmino.body,
    payload.legacyAmino.authInfo,
    txnExtension
  );

  return rawTx;
}

export function createTxBroadcastBodyBitcoin(context: TxContext, payload: TransactionPayload, signature: string) {
  return generatePostBodyBroadcast(createTxRawBitcoin(context, payload, signature));
}

export function createTxRawSolana(context: TxContext, payload: TransactionPayload, signature: string, solanaAddress: string): {
  message: TxRaw;
  path: string;
} {
  const { chain, sender } = context;

  let txnExtension = signatureToWeb3ExtensionSolana(chain, sender, signature, solanaAddress)
  // Create the txRaw
  let rawTx = createTxRawWithExtension(
    payload.legacyAmino.body,
    payload.legacyAmino.authInfo,
    txnExtension
  );

  return rawTx;
}

export function createTxBroadcastBodySolana(context: TxContext, payload: TransactionPayload, signature: string, solanaAddress: string) {
  return generatePostBodyBroadcast(createTxRawSolana(context, payload, signature, solanaAddress));
}

export function createTxRawEthereum(context: TxContext, payload: TransactionPayload, signature: string): {
  message: TxRaw;
  path: string;
} {
  const { chain, sender } = context;

  let txnExtension = signatureToWeb3Extension(chain, sender, signature);
  // Create the txRaw
  let rawTx = createTxRawWithExtension(
    payload.legacyAmino.body,
    payload.legacyAmino.authInfo,
    txnExtension
  );

  return rawTx;
}

export function createTxBroadcastBodyEthereum(context: TxContext, payload: TransactionPayload, signature: string) {
  return generatePostBodyBroadcast(createTxRawEthereum(context, payload, signature));
}

export function createTxRawCosmos(payload: TransactionPayload, signatures: Uint8Array[]) {
  const simulatedTx = createTxRaw(
    payload.signDirect.body.toBinary(),
    payload.signDirect.authInfo.toBinary(),
    [
      ...signatures,
    ],
  )

  return simulatedTx;
}

export function createTxBroadcastBodyCosmos(payload: TransactionPayload, signatures: Uint8Array[]) {
  return generatePostBodyBroadcast(createTxRawCosmos(payload, signatures));
}
