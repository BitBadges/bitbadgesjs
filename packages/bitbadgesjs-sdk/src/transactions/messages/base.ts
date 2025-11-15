import { convertToBitBadgesAddress, getChainForAddress } from '@/address-converter/converter.js';
import type { NativeAddress } from '@/api-indexer/docs-types/interfaces.js';
import { MAINNET_CHAIN_DETAILS, TESTNET_CHAIN_DETAILS } from '@/common/constants.js';
import { SupportedChain } from '@/common/types.js';
import { generatePostBodyBroadcast } from '@/node-rest-api/broadcast.js';
import {
  MsgCreateAddressLists,
  MsgCreateCollection,
  MsgCreateDynamicStore,
  MsgDecrementStoreValue,
  MsgDeleteCollection,
  MsgDeleteDynamicStore,
  MsgDeleteIncomingApproval,
  MsgDeleteOutgoingApproval,
  MsgIncrementStoreValue,
  MsgPurgeApprovals,
  MsgSetTokenMetadata,
  MsgSetCollectionApprovals,
  MsgSetCollectionMetadata,
  MsgSetCustomData,
  MsgSetDynamicStoreValue,
  MsgSetIncomingApproval,
  MsgSetIsArchived,
  MsgSetManager,
  MsgSetOutgoingApproval,
  MsgSetStandards,
  MsgSetValidTokenIds,
  MsgTransferTokens,
  MsgUniversalUpdateCollection,
  MsgUpdateCollection,
  MsgUpdateDynamicStore,
  MsgUpdateUserApprovals
} from '@/proto/badges/tx_pb.js';
import {
  MsgCreateManagerSplitter,
  MsgDeleteManagerSplitter,
  MsgExecuteUniversalUpdateCollection,
  MsgUpdateManagerSplitter
} from '@/proto/managersplitter/tx_pb.js';
import { type AuthInfo, type TxBody, type TxRaw } from '@/proto/cosmos/tx/v1beta1/tx_pb.js';
import { MsgCreateBalancerPool } from '@/proto/gamm/poolmodels/balancer/tx_pb.js';
import {
  MsgExitPool,
  MsgExitSwapExternAmountOut,
  MsgExitSwapShareAmountIn,
  MsgJoinPool,
  MsgJoinSwapExternAmountIn,
  MsgJoinSwapShareAmountOut,
  MsgSwapExactAmountIn,
  MsgSwapExactAmountInWithIBCTransfer,
  MsgSwapExactAmountOut
} from '@/proto/gamm/v1beta1/tx_pb.js';
import { createTypedData } from '@/transactions/eip712/payload/createTypedData.js';
import {
  populateUndefinedForMsgCreateAddressLists,
  populateUndefinedForMsgCreateBalancerPool,
  populateUndefinedForMsgCreateCollection,
  populateUndefinedForMsgCreateDynamicStore,
  populateUndefinedForMsgCreateManagerSplitter,
  populateUndefinedForMsgDecrementStoreValue,
  populateUndefinedForMsgDeleteCollection,
  populateUndefinedForMsgDeleteDynamicStore,
  populateUndefinedForMsgDeleteIncomingApproval,
  populateUndefinedForMsgDeleteManagerSplitter,
  populateUndefinedForMsgDeleteOutgoingApproval,
  populateUndefinedForMsgExecuteUniversalUpdateCollection,
  populateUndefinedForMsgExitPool,
  populateUndefinedForMsgExitSwapExternAmountOut,
  populateUndefinedForMsgExitSwapShareAmountIn,
  populateUndefinedForMsgIncrementStoreValue,
  populateUndefinedForMsgJoinPool,
  populateUndefinedForMsgJoinSwapExternAmountIn,
  populateUndefinedForMsgJoinSwapShareAmountOut,
  populateUndefinedForMsgPurgeApprovals,
  populateUndefinedForMsgSetTokenMetadata,
  populateUndefinedForMsgSetCollectionApprovals,
  populateUndefinedForMsgSetCollectionMetadata,
  populateUndefinedForMsgSetCustomData,
  populateUndefinedForMsgSetDynamicStoreValue,
  populateUndefinedForMsgSetIncomingApproval,
  populateUndefinedForMsgSetIsArchived,
  populateUndefinedForMsgSetManager,
  populateUndefinedForMsgSetOutgoingApproval,
  populateUndefinedForMsgSetStandards,
  populateUndefinedForMsgSetValidTokenIds,
  populateUndefinedForMsgSwapExactAmountIn,
  populateUndefinedForMsgSwapExactAmountInWithIBCTransfer,
  populateUndefinedForMsgSwapExactAmountOut,
  populateUndefinedForMsgTransferTokens,
  populateUndefinedForMsgUniversalUpdateCollection,
  populateUndefinedForMsgUpdateCollection,
  populateUndefinedForMsgUpdateDynamicStore,
  populateUndefinedForMsgUpdateManagerSplitter,
  populateUndefinedForMsgUpdateUserApprovals
} from '@/transactions/eip712/payload/samples/getSampleMsg.js';
import type { AnyMessage, Message } from '@bufbuild/protobuf';
import bs58 from 'bs58';
import CryptoJS from 'crypto-js';
import elliptic from 'elliptic';
import { SigningKey, getBytes, hashMessage } from 'ethers';
import type { Chain, Fee, Sender } from './common.js';
import { createStdFee, createStdSignDocFromProto, createTransactionWithMultipleMessages } from './transaction.js';
import { createTxRaw, createTxRawWithExtension } from './txRaw.js';
import type { MessageGenerated } from './utils.js';
import { signatureToWeb3ExtensionBitcoin, signatureToWeb3ExtensionEthereum, signatureToWeb3ExtensionSolana } from './web3Extension.js';

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
   * Details about the sender of this transaction. Address should be in their NATIVE format.
   * We use this to determine the approach.
   *
   * Public key is ONLY needed for Cosmos based signatures.
   */
  sender: {
    address: NativeAddress;
    sequence: number;
    accountNumber: number;
    publicKey?: string;
  };

  fee: Fee;
  memo?: string;
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

const createEIP712TypedData = (context: LegacyTxContext, protoMsgs: MessageGenerated | MessageGenerated[]) => {
  const { fee, sender, chain, memo } = context;
  const protoMsgsArray = wrapTypeToArray(protoMsgs);

  try {
    const stdFee = createStdFee(fee.amount, fee.denom, parseInt(fee.gas, 10));
    const stdSignDoc = createStdSignDocFromProto(protoMsgsArray, stdFee, chain.cosmosChainId, memo, sender.sequence, sender.accountNumber);
    return createTypedData(chain.chainId, stdSignDoc);
  } catch (e) {
    console.log(e);
    throw new Error('Error creating typed data');
  }
};

const createCosmosPayload = (context: LegacyTxContext, cosmosPayload: any | any[]) => {
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
      .sort((a, b) => {
        // Compare character by character, prioritizing capitals over lowercase
        // This matches proto marshal's byte-order comparison
        const minLength = Math.min(a.length, b.length);
        for (let i = 0; i < minLength; i++) {
          const charA = a.charCodeAt(i);
          const charB = b.charCodeAt(i);
          if (charA !== charB) {
            return charA - charB;
          }
        }
        // If all characters match up to minLength, shorter string comes first
        return a.length - b.length;
      })
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
  txnString: string;
  txnJson: Record<string, any>;
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
    throw new Error(
      'Account number must be greater than 0. This means the user is unregistered on the blockchain. Users can be registered by sending them any amount of BADGE.'
    );
  }

  if (txContext.sender.sequence < 0) {
    throw new Error('Sequence must be greater than or equal to 0');
  }

  return txContext;
};

/**
 * createTransactionPayload creates a transaction payload for a given transaction context and messages.
 *
 * It returns the payload in the following format: { signDirect, legacyAmino, txnString }
 * signDirect and legacyAmino are the payloads for signing with the respective signing methods from the Cosmos SDK.
 * txnString is the human-readable string to sign for Ethereum, Solana, and Bitcoin.
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

  const eipTxn = createEIP712TypedData(txContext, generatedMsgs);
  let sortedEipMessage = recursivelySort(eipTxn.message);

  // For certain messages, we need to post-process for JSON stringification to work properly
  sortedEipMessage = postProcessMessagesForJsonStringification(sortedEipMessage);
  sortedEipMessage = recursivelySort(sortedEipMessage);

  const message = JSON.stringify(sortedEipMessage);
  const sha256Message = CryptoJS.SHA256(message).toString();
  const humanReadableMessage = 'This is a BitBadges transaction with the content hash: ' + sha256Message;

  return {
    signDirect: createCosmosPayload(txContext, generatedMsgs).signDirect,
    legacyAmino: createCosmosPayload(txContext, generatedMsgs).legacyAmino,
    txnString: humanReadableMessage,
    txnJson: sortedEipMessage
  };
};

const convertDurationToJson = (duration: string) => {
  //We need to convert from the "100s" format to "100000000000" format
  let numStr = '';
  let unitStr = '';
  for (const char of duration) {
    if (!isNaN(Number(char))) {
      numStr += char;
    } else {
      unitStr += char;
    }
  }

  const valueNum = BigInt(numStr);
  const unit = unitStr.toLowerCase();
  if (unit === 's') {
    return (valueNum * BigInt(1000000000)).toString();
  } else if (unit === 'ms') {
    return (valueNum * BigInt(1000000)).toString();
  } else if (unit === 'us') {
    return (valueNum * BigInt(1000)).toString();
  } else if (unit === 'ns') {
    return valueNum.toString();
  } else {
    throw new Error('Invalid duration unit');
  }
};

// Certain fields get serialized differently in typescript vs on-chain
export const postProcessMessagesForJsonStringification = (sortedMsgObj: any) => {
  const entries: [string, any][] = Object.entries(sortedMsgObj);
  for (const [key, value] of entries) {
    if (key.startsWith('msg')) {
      const msgType = value.type;
      const msgValue = value.value;
      if (msgType === 'cosmos-sdk/MsgCreateGroupPolicy') {
        sortedMsgObj[key].value = {
          ...msgValue,
          decision_policy: {
            ...msgValue.decision_policy,
            value: {
              ...msgValue.decision_policy.value,
              windows: {
                voting_period: convertDurationToJson(msgValue.decision_policy.value.windows.voting_period),
                min_execution_period: convertDurationToJson(msgValue.decision_policy.value.windows.min_execution_period)
              }
            }
          }
        };
      } else if (msgType === 'cosmos-sdk/MsgCreateGroupWithPolicy') {
        sortedMsgObj[key].value = {
          ...msgValue,
          decision_policy: {
            ...msgValue.decision_policy,
            value: {
              ...msgValue.decision_policy.value,
              windows: {
                voting_period: convertDurationToJson(msgValue.decision_policy.value.windows.voting_period),
                min_execution_period: convertDurationToJson(msgValue.decision_policy.value.windows.min_execution_period)
              }
            }
          }
        };
      } else if (msgType === 'cosmos-sdk/MsgUpdateGroupDecisionPolicy') {
        sortedMsgObj[key].value = {
          ...msgValue,
          decision_policy: {
            ...msgValue.decision_policy,
            value: {
              ...msgValue.decision_policy.value,
              windows: {
                voting_period: convertDurationToJson(msgValue.decision_policy.value.windows.voting_period),
                min_execution_period: convertDurationToJson(msgValue.decision_policy.value.windows.min_execution_period)
              }
            }
          }
        };
      }
    }
  }

  return sortedMsgObj;
};

//Because the current and other code doesn't support Msgs with optional / empty fields,
//we need to populate undefined fields with empty default values
export const normalizeMessagesIfNecessary = (messages: MessageGenerated[]) => {
  const newMessages = messages.map((msg) => {
    const msgVal = msg.message;

    if (msgVal.getType().typeName === MsgUpdateCollection.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgUpdateCollection(msgVal as MsgUpdateCollection));
    } else if (msgVal.getType().typeName === MsgUpdateUserApprovals.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgUpdateUserApprovals(msgVal as MsgUpdateUserApprovals));
    } else if (msgVal.getType().typeName === MsgTransferTokens.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgTransferTokens(msgVal as MsgTransferTokens));
    } else if (msgVal.getType().typeName === MsgCreateCollection.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgCreateCollection(msgVal as MsgCreateCollection));
    } else if (msgVal.getType().typeName === MsgUniversalUpdateCollection.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgUniversalUpdateCollection(msgVal as MsgUniversalUpdateCollection));
    } else if (msgVal.getType().typeName === MsgCreateAddressLists.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgCreateAddressLists(msgVal as MsgCreateAddressLists));
    } else if (msgVal.getType().typeName === MsgCreateDynamicStore.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgCreateDynamicStore(msgVal as MsgCreateDynamicStore));
    } else if (msgVal.getType().typeName === MsgDeleteCollection.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgDeleteCollection(msgVal as MsgDeleteCollection));
    } else if (msgVal.getType().typeName === MsgDeleteDynamicStore.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgDeleteDynamicStore(msgVal as MsgDeleteDynamicStore));
    } else if (msgVal.getType().typeName === MsgDecrementStoreValue.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgDecrementStoreValue(msgVal as MsgDecrementStoreValue));
    } else if (msgVal.getType().typeName === MsgIncrementStoreValue.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgIncrementStoreValue(msgVal as MsgIncrementStoreValue));
    } else if (msgVal.getType().typeName === MsgSetDynamicStoreValue.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSetDynamicStoreValue(msgVal as MsgSetDynamicStoreValue));
    } else if (msgVal.getType().typeName === MsgUpdateDynamicStore.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgUpdateDynamicStore(msgVal as MsgUpdateDynamicStore));
    } else if (msgVal.getType().typeName === MsgDeleteIncomingApproval.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgDeleteIncomingApproval(msgVal as MsgDeleteIncomingApproval));
    } else if (msgVal.getType().typeName === MsgDeleteOutgoingApproval.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgDeleteOutgoingApproval(msgVal as MsgDeleteOutgoingApproval));
    } else if (msgVal.getType().typeName === MsgPurgeApprovals.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgPurgeApprovals(msgVal as MsgPurgeApprovals));
    } else if (msgVal.getType().typeName === MsgSetIncomingApproval.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSetIncomingApproval(msgVal as MsgSetIncomingApproval));
    } else if (msgVal.getType().typeName === MsgSetOutgoingApproval.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSetOutgoingApproval(msgVal as MsgSetOutgoingApproval));
    } else if (msgVal.getType().typeName === MsgSetValidTokenIds.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSetValidTokenIds(msgVal as MsgSetValidTokenIds));
    } else if (msgVal.getType().typeName === MsgSetManager.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSetManager(msgVal as MsgSetManager));
    } else if (msgVal.getType().typeName === MsgSetCollectionMetadata.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSetCollectionMetadata(msgVal as MsgSetCollectionMetadata));
    } else if (msgVal.getType().typeName === MsgSetTokenMetadata.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSetTokenMetadata(msgVal as MsgSetTokenMetadata));
    } else if (msgVal.getType().typeName === MsgSetCustomData.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSetCustomData(msgVal as MsgSetCustomData));
    } else if (msgVal.getType().typeName === MsgSetStandards.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSetStandards(msgVal as MsgSetStandards));
    } else if (msgVal.getType().typeName === MsgSetCollectionApprovals.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSetCollectionApprovals(msgVal as MsgSetCollectionApprovals));
    } else if (msgVal.getType().typeName === MsgSetIsArchived.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSetIsArchived(msgVal as MsgSetIsArchived));
    } else if (msgVal.getType().typeName === MsgJoinPool.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgJoinPool(msgVal as MsgJoinPool));
    } else if (msgVal.getType().typeName === MsgExitPool.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgExitPool(msgVal as MsgExitPool));
    } else if (msgVal.getType().typeName === MsgSwapExactAmountIn.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSwapExactAmountIn(msgVal as MsgSwapExactAmountIn));
    } else if (msgVal.getType().typeName === MsgSwapExactAmountInWithIBCTransfer.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSwapExactAmountInWithIBCTransfer(msgVal as MsgSwapExactAmountInWithIBCTransfer));
    } else if (msgVal.getType().typeName === MsgSwapExactAmountOut.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSwapExactAmountOut(msgVal as MsgSwapExactAmountOut));
    } else if (msgVal.getType().typeName === MsgJoinSwapExternAmountIn.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgJoinSwapExternAmountIn(msgVal as MsgJoinSwapExternAmountIn));
    } else if (msgVal.getType().typeName === MsgJoinSwapShareAmountOut.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgJoinSwapShareAmountOut(msgVal as MsgJoinSwapShareAmountOut));
    } else if (msgVal.getType().typeName === MsgExitSwapShareAmountIn.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgExitSwapShareAmountIn(msgVal as MsgExitSwapShareAmountIn));
    } else if (msgVal.getType().typeName === MsgExitSwapExternAmountOut.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgExitSwapExternAmountOut(msgVal as MsgExitSwapExternAmountOut));
    } else if (msgVal.getType().typeName === MsgCreateBalancerPool.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgCreateBalancerPool(msgVal as MsgCreateBalancerPool));
    } else if (msgVal.getType().typeName === MsgCreateManagerSplitter.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgCreateManagerSplitter(msgVal as MsgCreateManagerSplitter));
    } else if (msgVal.getType().typeName === MsgUpdateManagerSplitter.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgUpdateManagerSplitter(msgVal as MsgUpdateManagerSplitter));
    } else if (msgVal.getType().typeName === MsgDeleteManagerSplitter.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgDeleteManagerSplitter(msgVal as MsgDeleteManagerSplitter));
    } else if (msgVal.getType().typeName === MsgExecuteUniversalUpdateCollection.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgExecuteUniversalUpdateCollection(msgVal as MsgExecuteUniversalUpdateCollection));
    }

    //MsgCreateAddressLists and MsgDeleteCollection should be fine bc they are all primitive types and required
    //We only normalize if there is a custom type which could be undefined

    return msg;
  });

  return newMessages;
};

function createTxRawBitcoin(
  context: LegacyTxContext,
  payload: TransactionPayload,
  signature: string
): {
  message: TxRaw;
  path: string;
} {
  const { chain, sender } = context;

  const txnExtension = signatureToWeb3ExtensionBitcoin(chain, sender, signature);
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
export function createTxBroadcastBody(txContext: TxContext, messages: Message | Message[], signature: string, solAddress?: string) {
  const context = wrapExternalTxContext(txContext);
  const chain = context.chain.chain;

  const isCosmosSignature = chain === SupportedChain.COSMOS;
  if (isCosmosSignature && !context.sender.pubkey) {
    throw new Error('Public key must be provided for Cosmos signatures');
  }

  if (chain === SupportedChain.BTC) {
    return createTxBroadcastBodyBitcoin(context, messages, signature);
  } else if (chain === SupportedChain.SOLANA) {
    if (!solAddress) {
      throw new Error('Solana address must be provided');
    }
    return createTxBroadcastBodySolana(context, messages, signature, solAddress);
  } else if (chain === SupportedChain.ETH) {
    return createTxBroadcastBodyEthereum(context, messages, signature);
  } else {
    return createTxBroadcastBodyCosmos(createTransactionPayload(txContext, messages), [Uint8Array.from(Buffer.from(signature, 'hex'))]);
  }
}

/**
 * Given the transaction context, payload, and signature, create the raw transaction to be sent to the blockchain.
 */
function createTxBroadcastBodyBitcoin(context: LegacyTxContext, messages: Message | Message[], signature: string) {
  const publicKey = signature.slice(-66); //BIP322 appends the public key to the signature

  const base64PublicKey = Buffer.from(publicKey, 'hex').toString('base64');

  context.sender.pubkey = base64PublicKey;

  return generatePostBodyBroadcast(
    createTxRawBitcoin(
      {
        ...context,
        sender: {
          ...context.sender,
          pubkey: base64PublicKey
        }
      },
      createTransactionPayloadFromTxContext(context, messages),
      signature
    )
  );
}

function createTxRawSolana(
  context: LegacyTxContext,
  payload: TransactionPayload,
  signature: string,
  solanaAddress: string
): {
  message: TxRaw;
  path: string;
} {
  const { chain } = context;
  const txnExtension = signatureToWeb3ExtensionSolana(chain, context.sender, signature, solanaAddress);

  const rawTx = createTxRawWithExtension(payload.legacyAmino.body, payload.legacyAmino.authInfo, txnExtension);
  return rawTx;
}

function createTxBroadcastBodySolana(context: LegacyTxContext, messages: Message | Message[], signature: string, solanaAddress: string) {
  if (!solanaAddress) {
    throw new Error('Solana address must be provided');
  }

  //Pre: get provider from Phantom wallet

  const solanaPublicKeyBase58 = solanaAddress;
  const solanaPublicKeyBuffer = bs58.decode(solanaPublicKeyBase58);
  const publicKeyToSet = Buffer.from(solanaPublicKeyBuffer).toString('base64');

  context.sender.pubkey = publicKeyToSet;

  return generatePostBodyBroadcast(createTxRawSolana(context, createTransactionPayloadFromTxContext(context, messages), signature, solanaAddress));
}

function createTxRawEthereum(
  context: LegacyTxContext,
  payload: TransactionPayload,
  signature: string
): {
  message: TxRaw;
  path: string;
} {
  const { chain, sender } = context;

  const txnExtension = signatureToWeb3ExtensionEthereum(chain, sender, signature);
  const rawTx = createTxRawWithExtension(payload.legacyAmino.body, payload.legacyAmino.authInfo, txnExtension);

  return rawTx;
}

const compressSecp256Pubkey = (pubkey: Uint8Array) => {
  switch (pubkey.length) {
    case 33:
      return pubkey;
    case 65:
      const secp256k1 = new elliptic.ec('secp256k1');
      return Uint8Array.from(secp256k1.keyFromPublic(pubkey).getPublic(true, 'array'));
    default:
      throw new Error('Invalid pubkey length');
  }
};

function createTxBroadcastBodyEthereum(context: LegacyTxContext, messages: Message | Message[], signature: string) {
  let publicKey = '';
  if (signature) {
    const msgHash = hashMessage(createTransactionPayloadFromTxContext(context, messages).txnString);
    const msgHashBytes = getBytes(msgHash);
    const pubKey = SigningKey.recoverPublicKey(msgHashBytes, signature);

    const pubKeyHex = pubKey.substring(2);
    const compressedPublicKey = compressSecp256Pubkey(new Uint8Array(Buffer.from(pubKeyHex, 'hex')));
    const base64PubKey = Buffer.from(compressedPublicKey).toString('base64');
    publicKey = base64PubKey;
  }

  context.sender.pubkey = publicKey;

  return generatePostBodyBroadcast(createTxRawEthereum(context, createTransactionPayloadFromTxContext(context, messages), signature));
}

function createTxRawCosmos(payload: TransactionPayload, signatures: Uint8Array[]) {
  const simulatedTx = createTxRaw(payload.signDirect.body.toBinary(), payload.signDirect.authInfo.toBinary(), [...signatures]);

  return simulatedTx;
}

function createTxBroadcastBodyCosmos(payload: TransactionPayload, signatures: Uint8Array[]) {
  return generatePostBodyBroadcast(createTxRawCosmos(payload, signatures));
}
