import { convertToBitBadgesAddress, getChainForAddress } from '@/address-converter/converter.js';
import type { NativeAddress } from '@/api-indexer/docs-types/interfaces.js';
import { MAINNET_CHAIN_DETAILS, TESTNET_CHAIN_DETAILS } from '@/common/constants.js';
import { SupportedChain } from '@/common/types.js';
import { generatePostBodyBroadcast } from '@/node-rest-api/broadcast.js';
import { type AuthInfo, type TxBody } from '@/proto/cosmos/tx/v1beta1/tx_pb.js';
import type { AnyMessage, Message } from '@bufbuild/protobuf';
import type { Chain, Fee, Sender } from './common.js';
import { createTransactionWithMultipleMessages } from './transaction.js';
import { createTxRaw } from './txRaw.js';
import type { MessageGenerated } from './utils.js';

interface LegacyTxContext {
  chain: Chain;
  sender: Sender;
  fee: Fee;
  memo: string;
}

/**
 * LegacyTxContext is the transaction context for the transaction payload.
 *
 * @category Transactions
 */
export interface TxContext {
  /** Use the BitBadges testnet? Usee mainnet by default. */
  testnet?: boolean;
  /** Override the chain ID to a custom value. Uses BitBadges mainnet by default. */
  chainIdOverride?: string;

  /**
   * Details about the sender of this transaction. Address must be a BitBadges address (bb-prefixed).
   *
   * Public key is required for Cosmos signatures.
   */
  sender: {
    address: NativeAddress;
    sequence: number;
    accountNumber: number;
    publicKey: string;
  };

  fee: Fee;
  memo?: string;
}

/**
 * wrapTypeToArray wraps a generic type or array of said type and returns the object wrapped
 * in an array. This enables our interfaces to indiscriminantly take either pure objects or
 * arrays to easily support wrapping muliple messages.
 */
const wrapTypeToArray = (obj: T | T[]) => {
  return Array.isArray(obj) ? obj : [obj];
};

function createProtoMsg<T extends Message = AnyMessage>(msg: T) {
  return {
    message: msg,
    path: msg.getType().typeName
  };
}

const createCosmosPayload = (context: LegacyTxContext, cosmosPayload: any | any[]) => {
  const { fee, sender, chain, memo } = context;

  const messages = wrapTypeToArray(cosmosPayload);

  return createTransactionWithMultipleMessages(messages, memo, fee.amount, fee.denom, parseInt(fee.gas, 10), sender.pubkey, sender.sequence, sender.accountNumber, chain.cosmosChainId);
};

/**
 * A transaction payload is the payload for a given transaction context and messages.
 * For Cosmos, the payload can be signed in Amino or Sign Direct format, so the payload.signDirect and
 * payload.legacyAmino are the payloads to sign.
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
}

const wrapExternalTxContext = (context: TxContext): LegacyTxContext => {
  const chain = getChainForAddress(context.sender.address);
  let cosmosChainId = context.testnet ? TESTNET_CHAIN_DETAILS.cosmosChainId : MAINNET_CHAIN_DETAILS.cosmosChainId;
  let chainId = context.testnet ? TESTNET_CHAIN_DETAILS.chainId : MAINNET_CHAIN_DETAILS.chainId;
  if (context.chainIdOverride) {
    chainId = Number(context.chainIdOverride.split('-')[1]);
    cosmosChainId = context.chainIdOverride;
  }

  const txContext: LegacyTxContext = {
    chain: { chain, cosmosChainId, chainId },
    sender: {
      accountAddress: convertToBitBadgesAddress(context.sender.address),
      pubkey: context.sender.publicKey || '',
      sequence: context.sender.sequence,
      accountNumber: context.sender.accountNumber
    },
    fee: context.fee,
    memo: context.memo || ''
  };

  if (txContext.sender.accountAddress === '' || !txContext.sender.accountAddress.startsWith('bb')) {
    throw new Error('Account address must be a validly formatted BitBadges address');
  }

  if (txContext.sender.accountNumber <= 0) {
    throw new Error('Account number must be greater than 0. This means the user is unregistered on the blockchain. Users can be registered by sending them any amount of BADGE.');
  }

  if (txContext.sender.sequence < 0) {
    throw new Error('Sequence must be greater than or equal to 0');
  }

  return txContext;
};

/**
 * createTransactionPayload creates a transaction payload for a given transaction context and messages.
 *
 * It returns the payload in the following format: { signDirect, legacyAmino }
 * signDirect and legacyAmino are the payloads for signing with the respective signing methods from the Cosmos SDK.
 *
 * @category Transactions
 */
export const createTransactionPayload = (context: TxContext, messages: Message | Message[]): TransactionPayload => {
  const txContext: LegacyTxContext = wrapExternalTxContext(context);

  return createTransactionPayloadFromTxContext(txContext, messages);
};

const createTransactionPayloadFromTxContext = (txContext: LegacyTxContext, messages: Message | Message[]) => {
  messages = wrapTypeToArray(messages);

  //Don't do anything with these msgs like setShowJson bc they are simulated messages, not final ones
  let generatedMsgs: MessageGenerated[] = [];
  for (const cosmosMsg of messages) {
    generatedMsgs.push(createProtoMsg(cosmosMsg));
  }
  generatedMsgs = normalizeMessagesIfNecessary(generatedMsgs);

  return {
    signDirect: createCosmosPayload(txContext, generatedMsgs).signDirect,
    legacyAmino: createCosmosPayload(txContext, generatedMsgs).legacyAmino
  };
};

//Because the current and other code doesn't support Msgs with optional / empty fields,
//we need to populate undefined fields with empty default values
export const normalizeMessagesIfNecessary = (messages: MessageGenerated[]) => {
  const newMessages = messages.map((msg) => {
    const msgVal = msg.message;
    return createProtoMsg(msgVal);
  });

  return newMessages;
};

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
export function createTxBroadcastBody(txContext: TxContext, messages: Message | Message[], signature: string) {
  const context = wrapExternalTxContext(txContext);
  const chain = context.chain.chain;

  const isCosmosSignature = chain === SupportedChain.COSMOS;
  if (isCosmosSignature && !context.sender.pubkey) {
    throw new Error('Public key must be provided for Cosmos signatures');
  }

  return createTxBroadcastBodyCosmos(createTransactionPayload(txContext, messages), [Uint8Array.from(Buffer.from(signature, 'hex'))]);
}

function createTxRawCosmos(payload: TransactionPayload, signatures: Uint8Array[]) {
  const simulatedTx = createTxRaw(payload.signDirect.body.toBinary(), payload.signDirect.authInfo.toBinary(), [...signatures]);

  return simulatedTx;
}

function createTxBroadcastBodyCosmos(payload: TransactionPayload, signatures: Uint8Array[]) {
  return generatePostBodyBroadcast(createTxRawCosmos(payload, signatures));
}
