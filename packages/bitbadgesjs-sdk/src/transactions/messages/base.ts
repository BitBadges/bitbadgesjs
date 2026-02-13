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
import { normalizeMessagesIfNecessary, createProtoMsg } from './utils.js';
import { convertMessageToPrecompileCall, convertMessagesToExecuteMultiple, areAllTokenizationMessages, type SupportedSdkMessage, detectMessageType, evmToCosmosAddress } from '../precompile/index.js';

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
   * Required if you want to generate Cosmos payloads (signDirect, legacyAmino).
   * If only evmAddress is provided, Cosmos payloads will not be generated.
   *
   * Public key is required for Cosmos signatures.
   */
  sender?: {
    address: NativeAddress;
    sequence: number;
    accountNumber: number;
    publicKey: string;
  };

  fee: Fee;
  memo?: string;
  /**
   * Optional EVM address for precompile conversion. If provided, payload will include evmTx field.
   *
   * Behavior:
   * - If only evmAddress is provided: Only evmTx will be generated (no Cosmos payloads)
   * - If only sender is provided: Only Cosmos payloads will be generated (no evmTx)
   * - If both are provided: Both Cosmos payloads and evmTx will be generated
   */
  evmAddress?: string;
}

/**
 * wrapTypeToArray wraps a generic type or array of said type and returns the object wrapped
 * in an array. This enables our interfaces to indiscriminantly take either pure objects or
 * arrays to easily support wrapping muliple messages.
 */
const wrapTypeToArray = <T>(obj: T | T[]) => {
  return Array.isArray(obj) ? obj : [obj];
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
    sender.pubkey,
    sender.sequence,
    sender.accountNumber,
    chain.cosmosChainId
  );
};

/**
 * A transaction payload is the payload for a given transaction context and messages.
 * For Cosmos, the payload can be signed in Amino or Sign Direct format, so the payload.signDirect and
 * payload.legacyAmino are the payloads to sign.
 *
 * If evmAddress is provided in TxContext, the payload will also include evmTx field with EVM transaction details.
 *
 * @category Transactions
 */
export interface TransactionPayload {
  /** Cosmos Sign Direct payload. Present when sender is provided in TxContext. */
  signDirect: {
    body: TxBody;
    authInfo: AuthInfo;
    signBytes: string;
  };
  /** Cosmos Legacy Amino payload. Present when sender is provided in TxContext. */
  legacyAmino: {
    body: TxBody;
    authInfo: AuthInfo;
    signBytes: string;
  };
  /** Optional EVM transaction details. Present when evmAddress is provided in TxContext and messages are supported. */
  evmTx?: {
    /** Precompile contract address (0x1001 for tokenization, 0x1002 for gamm, 0x1003 for sendmanager) */
    to: string;
    /** Encoded function call data (ready to send in a transaction) */
    data: string;
    /** Transaction value (always "0" for precompiles) */
    value: string;
    /** Function name (for debugging/logging) */
    functionName: string;
  };
}

const wrapExternalTxContext = (context: TxContext): LegacyTxContext | null => {
  // If no sender is provided, we can't create Cosmos payloads
  if (!context.sender) {
    return null;
  }

  // Determine chain from sender address or evmAddress
  let addressForChainDetection = context.sender.address;
  if (!addressForChainDetection && context.evmAddress) {
    // Convert EVM address to Cosmos address for chain detection
    try {
      addressForChainDetection = evmToCosmosAddress(context.evmAddress, 'bb');
    } catch {
      // If conversion fails, default to COSMOS
      addressForChainDetection = '';
    }
  }

  const chain = addressForChainDetection ? getChainForAddress(addressForChainDetection) : SupportedChain.COSMOS;
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
 * It returns the payload in the following format: { signDirect?, legacyAmino?, evmTx? }
 *
 * Behavior:
 * - If only sender is provided: Only Cosmos payloads (signDirect, legacyAmino) will be generated
 * - If only evmAddress is provided: Only evmTx will be generated (no Cosmos payloads)
 * - If both are provided: Both Cosmos payloads and evmTx will be generated
 *
 * signDirect and legacyAmino are the payloads for signing with the respective signing methods from the Cosmos SDK.
 * evmTx is included if evmAddress is provided in context and messages are supported for precompile conversion.
 *
 * @param context - Transaction context. Must include either sender (for Cosmos) or evmAddress (for EVM), or both
 * @param messages - Messages to include in the transaction. Can be proto messages (with getType()) or SDK messages (with toProto())
 * @param sdkMessagesForEvm - Optional: Original SDK messages for EVM conversion. If not provided, will try to use messages parameter.
 * @throws {Error} If neither sender nor evmAddress is provided
 *
 * @category Transactions
 */
export const createTransactionPayload = (
  context: TxContext,
  messages: Message | Message[],
  sdkMessagesForEvm?: any | any[]
): TransactionPayload => {
  // Validate that at least one of sender or evmAddress is provided
  if (!context.sender && !context.evmAddress) {
    throw new Error('Either sender or evmAddress must be provided in TxContext');
  }

  const txContext: LegacyTxContext | null = wrapExternalTxContext(context);

  return createTransactionPayloadFromTxContext(txContext, messages, context.evmAddress, sdkMessagesForEvm);
};

const createTransactionPayloadFromTxContext = (
  txContext: LegacyTxContext | null,
  messages: Message | Message[],
  evmAddress?: string,
  sdkMessagesForEvm?: any | any[]
): TransactionPayload => {
  messages = wrapTypeToArray(messages);

  // Generate Cosmos payloads only if sender is provided
  let cosmosPayload: { signDirect?: TransactionPayload['signDirect']; legacyAmino?: TransactionPayload['legacyAmino'] } = {};

  if (txContext) {
    //Don't do anything with these msgs like setShowJson bc they are simulated messages, not final ones
    let generatedMsgs: MessageGenerated[] = [];
    for (const cosmosMsg of messages) {
      generatedMsgs.push(createProtoMsg(cosmosMsg));
    }
    generatedMsgs = normalizeMessagesIfNecessary(generatedMsgs);

    const payload = createCosmosPayload(txContext, generatedMsgs);
    cosmosPayload = {
      signDirect: payload.signDirect,
      legacyAmino: payload.legacyAmino
    };
  }

  // Generate EVM transaction only if evmAddress is provided
  let evmTx: TransactionPayload['evmTx'] | undefined;
  if (evmAddress) {
    try {
      // Use SDK messages for EVM conversion if provided, otherwise try to use the messages parameter
      const messagesArray = sdkMessagesForEvm
        ? wrapTypeToArray(sdkMessagesForEvm)
        : wrapTypeToArray(messages);

      // Check if all messages are supported for precompile conversion
      // Actually try to detect the message type to ensure it's a supported SDK message
      let allSupported = true;
      for (const msg of messagesArray) {
        try {
          // Try to detect message type using the actual detection function
          // This ensures the message is a proper SDK message instance, not just a proto message
          detectMessageType(msg as SupportedSdkMessage);
        } catch {
          // If detection fails, message is not supported for EVM conversion
          allSupported = false;
          break;
        }
      }

      if (allSupported && messagesArray.length > 0) {
        // Handle multiple messages - use executeMultiple if all are tokenization messages
        if (messagesArray.length > 1 && areAllTokenizationMessages(messagesArray as SupportedSdkMessage[])) {
          const result = convertMessagesToExecuteMultiple(messagesArray as SupportedSdkMessage[], evmAddress);
          evmTx = {
            to: result.precompileAddress,
            data: result.data,
            value: '0',
            functionName: result.functionName
          };
        } else if (messagesArray.length === 1) {
          // Single message - use standard conversion
          const result = convertMessageToPrecompileCall(messagesArray[0] as SupportedSdkMessage, evmAddress);
          evmTx = {
            to: result.precompileAddress,
            data: result.data,
            value: '0',
            functionName: result.functionName
          };
        }
      }
    } catch (error) {
      // Log warning but don't fail payload creation (allows Cosmos fallback)
      console.warn('Failed to convert messages to EVM precompile calls:', error);
      // evmTx remains undefined, payload will work for Cosmos-only
    }
  }

  // Return payload with only the fields that were generated
  if (!txContext) {
    // If only EVM, we still need to return the structure but Cosmos fields won't be used
    if (!evmTx) {
      throw new Error('No payload could be generated. Provide either sender (for Cosmos) or evmAddress (for EVM).');
    }
    // Return minimal structure - caller should only use evmTx
    // We need to create dummy Cosmos payloads to satisfy the interface
    // In practice, these won't be used when only evmTx is present
    return {
      signDirect: {
        body: {} as TxBody,
        authInfo: {} as AuthInfo,
        signBytes: ''
      },
      legacyAmino: {
        body: {} as TxBody,
        authInfo: {} as AuthInfo,
        signBytes: ''
      },
      evmTx
    };
  }

  return {
    ...cosmosPayload,
    ...(evmTx && { evmTx })
  } as TransactionPayload;
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
  if (!txContext.sender) {
    throw new Error('sender is required for createTxBroadcastBody (Cosmos transaction broadcasting)');
  }

  const context = wrapExternalTxContext(txContext);
  if (!context) {
    throw new Error('Failed to create transaction context. sender is required for Cosmos transactions.');
  }

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
