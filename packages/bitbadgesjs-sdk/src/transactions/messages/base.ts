import type { AnyMessage, Message } from '@bufbuild/protobuf';
import {
  MsgCreateCollection,
  MsgTransferBadges,
  MsgUniversalUpdateCollection,
  MsgUpdateCollection,
  MsgUpdateUserApprovals
} from '@/proto/badges/tx_pb';
import type { TxBody, AuthInfo, TxRaw } from '@/proto/cosmos/tx/v1beta1/tx_pb';
import type { Chain, Fee, Sender } from './common';
import { createStdFee, createStdSignDocFromProto, createTransactionWithMultipleMessages } from './transaction';
import { SupportedChain } from '@/common/types';
import { generatePostBodyBroadcast } from '@/node-rest-api/broadcast';
import {
  populateUndefinedForMsgUpdateCollection,
  populateUndefinedForMsgUpdateUserApprovals,
  populateUndefinedForMsgTransferBadges,
  populateUndefinedForMsgCreateCollection,
  populateUndefinedForMsgUniversalUpdateCollection
} from '@/transactions/eip712/payload/samples/getSampleMsg';
import { createTxRaw, createTxRawWithExtension } from './txRaw';
import { signatureToWeb3ExtensionBitcoin, signatureToWeb3ExtensionSolana, signatureToWeb3ExtensionEthereum } from './web3Extension';
import { createTypedData } from '@/transactions/eip712/payload/createTypedData';
import type { MessageGenerated } from './utils';

/**
 * TxContext is the transaction context for a SignDoc that is independent
 * from the transaction payload.
 *
 * @category Transactions
 */
export interface TxContext {
  chain: Chain;
  sender: Sender;
  fee: Fee;
  memo: string;
}

/**
 * EIP712TypedData represents a signable EIP-712 typed data object,
 * including both the types and message object.
 *
 * @remarks
 * See the EIP-712 specification for more:
 * {@link https://eips.ethereum.org/EIPS/eip-712}
 *
 * @category Transactions
 */
export interface EIP712TypedData {
  types: object;
  message: object | object[];
  domain: object;
  primaryType: string;
}

/**
 * wrapTypeToArray wraps a generic type or array of said type and returns the object wrapped
 * in an array. This enables our interfaces to indiscriminantly take either pure objects or
 * arrays to easily support wrapping muliple messages.
 */
const wrapTypeToArray = <T>(obj: T | T[]) => {
  return Array.isArray(obj) ? obj : [obj];
};

function createProtoMsg<T extends Message<T> = AnyMessage>(msg: T) {
  return {
    message: msg,
    path: msg.getType().typeName
  };
}

const createEIP712TypedData = (context: TxContext, protoMsgs: MessageGenerated | MessageGenerated[]) => {
  const { fee, sender, chain, memo } = context;
  const protoMsgsArray = wrapTypeToArray(protoMsgs);

  try {
    const stdFee = createStdFee(fee.amount, fee.denom, parseInt(fee.gas, 10));
    const stdSignDoc = createStdSignDocFromProto(protoMsgsArray, stdFee, chain.cosmosChainId, memo, sender.sequence, sender.accountNumber);
    return createTypedData(chain.chainId, stdSignDoc);
  } catch (e) {
    console.log(e);
    throw new Error('Error creating EIP712 typed data');
  }
};

const createCosmosPayload = (
  context: TxContext,
  cosmosPayload: any | any[] // TODO: re-export Protobuf Message type from /proto
) => {
  const { fee, sender, chain, memo } = context;

  const messages = wrapTypeToArray(cosmosPayload);

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
    chain.cosmosChainId
  );
};

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

/**
 * A transaction payload is the payload for a given transaction context and messages. This contains
 * the messages that need to be signed for different chains.
 *
 * For Ethereum, the payload is in EIP-712 format, so the payload.eipToSign is the payload to sign.
 * For Cosmos, the payload can be signed in Amino or Sign Direct format, so the payload.signDirect and
 * payload.legacyAmino are the payloads to sign.
 * For Solana amnd Bitcoin, the payload is in JSON format, so the payload.jsonToSign is the payload to sign.
 *
 * @category Transactions
 */
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
  eipToSign: EIP712TypedData;
  jsonToSign: string;
}

/**
 * createTransactionPayload creates a transaction payload for a given transaction context and messages.
 *
 * It returns the payload in the following format: { signDirect, legacyAmino, eipToSign, jsonToSign }
 * signDirect and legacyAmino are the payloads for signing with the respective signing methods from the Cosmos SDK.
 * eipToSign is the payload to sign for Ethereum EIP-712 signing.
 * jsonToSign is the payload to sign for Solana signing.
 *
 * @category Transactions
 */
export const createTransactionPayload = (context: TxContext, messages: Message | Message[]): TransactionPayload => {
  messages = wrapTypeToArray(messages);

  //Don't do anything with these msgs like setShowJson bc they are simulated messages, not final ones
  let generatedMsgs: MessageGenerated[] = [];
  for (const cosmosMsg of messages) {
    generatedMsgs.push(createProtoMsg(cosmosMsg));
  }
  generatedMsgs = normalizeMessagesIfNecessary(generatedMsgs);

  if (context.sender.accountAddress === '' || !context.sender.accountAddress.startsWith('cosmos')) {
    throw new Error('Account address must be a validly formatted Cosmos address');
  }

  if (context.sender.accountNumber <= 0) {
    throw new Error(
      'Account number must be greater than 0. This means the user is unregistered on the blockchain. Users can be registered by sending them any amount of $BADGE. This is a pre-requisite because the user needs to be able to pay for the transaction fees.'
    );
  }

  if (context.sender.sequence < 0) {
    throw new Error('Sequence must be greater than or equal to 0');
  }

  // Fails for simulations, I believe
  // if (context.sender.pubkey === '') {
  //   throw new Error('Public key must be a validly formatted public key')
  // }

  const eipTxn = createEIP712TypedData(context, generatedMsgs);
  const sortedEipMessage = recursivelySort(eipTxn.message);
  const message = JSON.stringify(sortedEipMessage);

  return {
    signDirect: createCosmosPayload(context, generatedMsgs).signDirect,
    legacyAmino: createCosmosPayload(context, generatedMsgs).legacyAmino,
    eipToSign: createEIP712TypedData(context, generatedMsgs),
    jsonToSign: message
  };
};

//Because the current eip712 and other code doesn't support Msgs with optional / empty fields,
//we need to populate undefined fields with empty default values
const normalizeMessagesIfNecessary = (messages: MessageGenerated[]) => {
  const newMessages = messages.map((msg) => {
    const msgVal = msg.message;

    if (msgVal.getType().typeName === MsgUpdateCollection.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgUpdateCollection(msgVal as MsgUpdateCollection));
    } else if (msgVal.getType().typeName === MsgUpdateUserApprovals.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgUpdateUserApprovals(msgVal as MsgUpdateUserApprovals));
    } else if (msgVal.getType().typeName === MsgTransferBadges.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgTransferBadges(msgVal as MsgTransferBadges));
    } else if (msgVal.getType().typeName === MsgCreateCollection.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgCreateCollection(msgVal as MsgCreateCollection));
    } else if (msgVal.getType().typeName === MsgUniversalUpdateCollection.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgUniversalUpdateCollection(msgVal as MsgUniversalUpdateCollection));
    }

    //MsgCreateAddressLists and MsgDeleteCollection should be fine bc they are all primitive types and required
    //We only normalize if there is a custom type which could be undefined

    return msg;
  });

  return newMessages;
};

function createTxRawBitcoin(
  context: TxContext,
  payload: TransactionPayload,
  signature: string
): {
  message: TxRaw;
  path: string;
} {
  const { chain, sender } = context;

  const txnExtension = signatureToWeb3ExtensionBitcoin(chain, sender, signature);
  // Create the txRaw
  const rawTx = createTxRawWithExtension(payload.legacyAmino.body, payload.legacyAmino.authInfo, txnExtension);

  return rawTx;
}

/**
 * Given the transaction context, payload, and signature, create the raw transaction to be sent to the blockchain.
 * Signatures, context, and payload must be provided and well-formed.
 *
 * This can be sent to BitBadgesApi.broadcastTx, BitBadgesApi.simulateTx, or a node's REST API endpoint
 * using the  `/cosmos/tx/v1beta1/txs` endpoint.
 *
 * See the BitBadges API documentation for more details:
 * https://docs.bitbadges.io/for-developers/create-and-broadcast-txs
 *
 * @category Transactions
 */
export function createTxBroadcastBody(context: TxContext, payload: TransactionPayload, signature: string, solAddress?: string) {
  const chain = context.chain.chain;

  if (chain === SupportedChain.BTC) {
    return createTxBroadcastBodyBitcoin(context, payload, signature);
  } else if (chain === SupportedChain.SOLANA) {
    if (!solAddress) {
      throw new Error('Solana address must be provided');
    }
    return createTxBroadcastBodySolana(context, payload, signature, solAddress);
  } else if (chain === SupportedChain.ETH) {
    return createTxBroadcastBodyEthereum(context, payload, signature);
  } else {
    return createTxBroadcastBodyCosmos(payload, [Uint8Array.from(Buffer.from(signature, 'hex'))]);
  }
}

/**
 * Given the transaction context, payload, and signature, create the raw transaction to be sent to the blockchain.
 */
function createTxBroadcastBodyBitcoin(context: TxContext, payload: TransactionPayload, signature: string) {
  return generatePostBodyBroadcast(createTxRawBitcoin(context, payload, signature));
}

function createTxRawSolana(
  context: TxContext,
  payload: TransactionPayload,
  signature: string,
  solanaAddress: string
): {
  message: TxRaw;
  path: string;
} {
  const { chain, sender } = context;

  const txnExtension = signatureToWeb3ExtensionSolana(chain, sender, signature, solanaAddress);
  // Create the txRaw
  const rawTx = createTxRawWithExtension(payload.legacyAmino.body, payload.legacyAmino.authInfo, txnExtension);

  return rawTx;
}

function createTxBroadcastBodySolana(context: TxContext, payload: TransactionPayload, signature: string, solanaAddress: string) {
  return generatePostBodyBroadcast(createTxRawSolana(context, payload, signature, solanaAddress));
}

function createTxRawEthereum(
  context: TxContext,
  payload: TransactionPayload,
  signature: string
): {
  message: TxRaw;
  path: string;
} {
  const { chain, sender } = context;

  const txnExtension = signatureToWeb3ExtensionEthereum(chain, sender, signature);
  // Create the txRaw
  const rawTx = createTxRawWithExtension(payload.legacyAmino.body, payload.legacyAmino.authInfo, txnExtension);

  return rawTx;
}

function createTxBroadcastBodyEthereum(context: TxContext, payload: TransactionPayload, signature: string) {
  return generatePostBodyBroadcast(createTxRawEthereum(context, payload, signature));
}

function createTxRawCosmos(payload: TransactionPayload, signatures: Uint8Array[]) {
  const simulatedTx = createTxRaw(payload.signDirect.body.toBinary(), payload.signDirect.authInfo.toBinary(), [...signatures]);

  return simulatedTx;
}

function createTxBroadcastBodyCosmos(payload: TransactionPayload, signatures: Uint8Array[]) {
  return generatePostBodyBroadcast(createTxRawCosmos(payload, signatures));
}
