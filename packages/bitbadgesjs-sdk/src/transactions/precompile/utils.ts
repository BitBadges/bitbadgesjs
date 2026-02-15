/**
 * Precompile Utilities
 *
 * Converts BitBadges SDK message types to EVM precompile function calls.
 * All precompile methods accept a single JSON string parameter.
 */

import { ethers } from 'ethers';
import { TOKENIZATION_PRECOMPILE_ADDRESS, BANK_PRECOMPILE_ADDRESS, SENDMANAGER_PRECOMPILE_ADDRESS, GAMM_PRECOMPILE_ADDRESS } from './abi.js';
import { validateEvmAddress, validateMessage } from './helpers.js';
import {
  convertCastVote,
  convertCreateAddressLists,
  convertCreateCollection,
  convertCreateDynamicStore,
  convertDeleteCollection,
  convertDeleteDynamicStore,
  convertDeleteIncomingApproval,
  convertDeleteOutgoingApproval,
  convertPurgeApprovals,
  convertSetCollectionApprovals,
  convertSetCollectionMetadata,
  convertSetCustomData,
  convertSetDynamicStoreValue,
  convertSetIncomingApproval,
  convertSetIsArchived,
  convertSetManager,
  convertSetOutgoingApproval,
  convertSetStandards,
  convertSetTokenMetadata,
  convertSetValidTokenIds,
  convertTransferTokens,
  convertUniversalUpdateCollection,
  convertUpdateCollection,
  convertUpdateDynamicStore,
  convertUpdateUserApprovals,
  convertMsgSend,
  convertMsgCreateBalancerPool,
  convertMsgJoinPool,
  convertMsgExitPool,
  convertMsgSwapExactAmountIn,
  convertMsgSwapExactAmountInWithIBCTransfer,
  PrecompileFunctionParams
} from './data-converter.js';
import { mapMessageToFunction } from './function-mapper.js';
import type { SupportedSdkMessage } from './type-detector.js';
import { detectMessageType, MessageType } from './type-detector.js';

// Re-export for convenience
export { TOKENIZATION_PRECOMPILE_ADDRESS, BANK_PRECOMPILE_ADDRESS, SENDMANAGER_PRECOMPILE_ADDRESS, GAMM_PRECOMPILE_ADDRESS };

/**
 * Set of Gamm message types that use the Gamm precompile (0x1002)
 */
const GAMM_MESSAGE_TYPES = new Set<MessageType>([
  MessageType.MsgCreateBalancerPool,
  MessageType.MsgJoinPool,
  MessageType.MsgExitPool,
  MessageType.MsgSwapExactAmountIn,
  MessageType.MsgSwapExactAmountInWithIBCTransfer
]);

/**
 * Check if a message type is a Gamm message (uses Gamm precompile)
 *
 * @param messageType - The message type to check
 * @returns true if the message type is a Gamm message
 */
export function isGammMessage(messageType: MessageType): boolean {
  return GAMM_MESSAGE_TYPES.has(messageType);
}

/**
 * Result of converting a message to a precompile function call
 */
export interface PrecompileCallResult {
  /** The function name to call on the precompile */
  functionName: string;
  /** The encoded function data (ready to send in a transaction) */
  data: string;
  /** The JSON message string (for debugging/logging) */
  jsonMsg: string;
  /** The precompile contract address (0x1001 for tokenization, 0x1002 for gamm, 0x1003 for sendmanager) */
  precompileAddress: string;
}

/**
 * Error thrown when encoding a precompile call fails
 */
export class PrecompileEncodingError extends Error {
  constructor(
    public readonly functionName: string,
    public readonly originalError: Error,
    public readonly messageData?: string
  ) {
    const dataPreview = messageData
      ? ` (data preview: ${messageData.substring(0, 100)}...)`
      : '';
    super(
      `Failed to encode precompile call for ${functionName}: ${originalError.message}${dataPreview}`
    );
    this.name = 'PrecompileEncodingError';
  }
}

/**
 * Convert a BitBadges SDK message to a precompile function call
 *
 * @param message - The SDK message (any supported message type)
 * @param evmAddress - The EVM address of the caller (for address conversion)
 * @returns The function name, encoded data, and precompile address for the precompile call
 * @throws {PrecompileEncodingError} If encoding fails
 *
 * @example
 * ```typescript
 * const msg = new MsgCreateCollection({...});
 * const result = convertMessageToPrecompileCall(msg, '0x1234...');
 * // result.functionName = 'createCollection'
 * // result.data = '0x...' (encoded function call with JSON string)
 * // result.precompileAddress = '0x1001' (tokenization precompile)
 * ```
 */
export function convertMessageToPrecompileCall(
  message: SupportedSdkMessage | any, // Accept both SDK and proto messages
  evmAddress?: string
): PrecompileCallResult {
  // Validate inputs
  validateMessage(message);
  validateEvmAddress(evmAddress);

  // Step 1: Detect the message type
  const messageType = detectMessageType(message);

  // Step 2: Determine precompile address and function name
  // MsgSend uses SendManager precompile (0x1003) with JSON string encoding
  // Gamm messages use Gamm precompile (0x1002) with JSON string encoding
  // All other messages use Tokenization precompile (0x1001) with JSON string encoding
  let precompileAddress: string;
  let functionName: string;

  if (messageType === MessageType.MsgSend) {
    // Use SendManager precompile for MsgSend
    // This precompile uses JSON string encoding (same pattern as tokenization precompile)
    precompileAddress = SENDMANAGER_PRECOMPILE_ADDRESS;
    functionName = mapMessageToFunction(messageType); // Returns 'send'
  } else if (isGammMessage(messageType)) {
    // Use Gamm precompile for Gamm messages
    // This precompile uses JSON string encoding (same pattern as tokenization precompile)
    precompileAddress = GAMM_PRECOMPILE_ADDRESS;
    functionName = mapMessageToFunction(messageType);
  } else {
    // Tokenization precompile uses JSON string encoding
    precompileAddress = TOKENIZATION_PRECOMPILE_ADDRESS;
    functionName = mapMessageToFunction(messageType);
  }

  // Step 3: Convert message data to JSON object
  const jsonObject = convertMessageToJsonObject(messageType, message, evmAddress);

  // Step 4: Stringify JSON and encode as single string parameter
  // All precompiles accept protobuf JSON format
  // sender is automatically set from msg.sender, so we omit it
  try {
    const jsonMsg = JSON.stringify(jsonObject);
    const functionSignature = `function ${functionName}(string)`;
    const iface = new ethers.Interface([functionSignature]);
    const data = iface.encodeFunctionData(functionName, [jsonMsg]);

    return {
      functionName,
      data,
      jsonMsg,
      precompileAddress
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error : new Error(String(error));
    throw new PrecompileEncodingError(functionName, errorMessage, JSON.stringify(jsonObject).substring(0, 200));
  }
}

/**
 * Check if all messages in an array are tokenization messages
 * Tokenization messages use TOKENIZATION_PRECOMPILE_ADDRESS (not SendManager or Gamm)
 *
 * @param messages - Array of SDK messages to check
 * @returns true if all messages are tokenization messages, false otherwise
 */
export function areAllTokenizationMessages(messages: unknown[]): boolean {
  if (messages.length === 0) {
    return false;
  }

  for (const message of messages) {
    try {
      const messageType = detectMessageType(message as SupportedSdkMessage);

      // Check if message uses tokenization precompile (not SendManager or Gamm)
      if (messageType === MessageType.MsgSend || isGammMessage(messageType)) {
        return false;
      }
    } catch {
      // If we can't detect the message type, it's not a tokenization message
      return false;
    }
  }

  return true;
}

/**
 * MessageInput structure for executeMultiple
 */
interface MessageInput {
  messageType: string;
  msgJson: string;
}

/**
 * Convert multiple tokenization messages to executeMultiple precompile call
 *
 * @param messages - Array of tokenization SDK messages
 * @param evmAddress - The EVM address of the caller (for address conversion)
 * @returns The encoded data and precompile address for the executeMultiple call
 * @throws {PrecompileEncodingError} If encoding fails
 * @throws {Error} If any message is not a tokenization message
 */
export function convertMessagesToExecuteMultiple(
  messages: (SupportedSdkMessage | any)[], // Accept both SDK and proto messages
  evmAddress?: string
): PrecompileCallResult {
  // Validate inputs
  if (!Array.isArray(messages)) {
    throw new Error('Messages must be an array');
  }

  if (messages.length === 0) {
    throw new Error('Cannot convert empty message array to executeMultiple');
  }

  validateEvmAddress(evmAddress);

  // Validate each message
  for (const message of messages) {
    validateMessage(message);
  }

  // Verify all messages are tokenization messages
  if (!areAllTokenizationMessages(messages)) {
    throw new Error('All messages must be tokenization messages to use executeMultiple');
  }

  // Convert each message to MessageInput format
  const messageInputs: MessageInput[] = messages.map((message) => {
    const messageType = detectMessageType(message);
    const functionName = mapMessageToFunction(messageType);

    // Convert message to JSON object
    const jsonObject = convertMessageToJsonObject(messageType, message, evmAddress);
    const jsonMsg = JSON.stringify(jsonObject);

    return {
      messageType: functionName,
      msgJson: jsonMsg
    };
  });

  // Encode executeMultiple call
  // Function signature: executeMultiple((string,string)[])
  // The struct is encoded as a tuple array
  try {
    const functionSignature = 'function executeMultiple((string,string)[])';
    const iface = new ethers.Interface([functionSignature]);

    // Convert MessageInput[] to tuple array format for encoding
    const tupleArray = messageInputs.map((input) => [input.messageType, input.msgJson]);
    const data = iface.encodeFunctionData('executeMultiple', [tupleArray]);

    return {
      functionName: 'executeMultiple',
      data,
      jsonMsg: JSON.stringify(messageInputs), // For debugging
      precompileAddress: TOKENIZATION_PRECOMPILE_ADDRESS
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error : new Error(String(error));
    throw new PrecompileEncodingError('executeMultiple', errorMessage, JSON.stringify(messageInputs).substring(0, 200));
  }
}

/**
 * Convert message to JSON object based on message type
 */
function convertMessageToJsonObject(
  messageType: MessageType,
  message: SupportedSdkMessage | any, // Accept both SDK and proto messages
  evmAddress?: string
): PrecompileFunctionParams {
  switch (messageType) {
    case MessageType.MsgSend:
      return convertMsgSend(message as any, evmAddress);
    case MessageType.MsgTransferTokens:
      return convertTransferTokens(message as any, evmAddress);
    case MessageType.MsgSetIncomingApproval:
      return convertSetIncomingApproval(message as any, evmAddress);
    case MessageType.MsgSetOutgoingApproval:
      return convertSetOutgoingApproval(message as any, evmAddress);
    case MessageType.MsgDeleteCollection:
      return convertDeleteCollection(message as any, evmAddress);
    case MessageType.MsgDeleteIncomingApproval:
      return convertDeleteIncomingApproval(message as any, evmAddress);
    case MessageType.MsgDeleteOutgoingApproval:
      return convertDeleteOutgoingApproval(message as any, evmAddress);
    case MessageType.MsgCreateDynamicStore:
      return convertCreateDynamicStore(message as any, evmAddress);
    case MessageType.MsgUpdateDynamicStore:
      return convertUpdateDynamicStore(message as any, evmAddress);
    case MessageType.MsgDeleteDynamicStore:
      return convertDeleteDynamicStore(message as any, evmAddress);
    case MessageType.MsgSetDynamicStoreValue:
      return convertSetDynamicStoreValue(message as any, evmAddress);
    case MessageType.MsgSetCustomData:
      return convertSetCustomData(message as any, evmAddress);
    case MessageType.MsgSetIsArchived:
      return convertSetIsArchived(message as any, evmAddress);
    case MessageType.MsgSetManager:
      return convertSetManager(message as any, evmAddress);
    case MessageType.MsgSetCollectionMetadata:
      return convertSetCollectionMetadata(message as any, evmAddress);
    case MessageType.MsgSetStandards:
      return convertSetStandards(message as any, evmAddress);
    case MessageType.MsgCastVote:
      return convertCastVote(message as any, evmAddress);
    case MessageType.MsgCreateCollection:
      return convertCreateCollection(message as any, evmAddress);
    case MessageType.MsgUpdateCollection:
      return convertUpdateCollection(message as any, evmAddress);
    case MessageType.MsgUpdateUserApprovals:
      return convertUpdateUserApprovals(message as any, evmAddress);
    case MessageType.MsgCreateAddressLists:
      return convertCreateAddressLists(message as any, evmAddress);
    case MessageType.MsgPurgeApprovals:
      return convertPurgeApprovals(message as any, evmAddress);
    case MessageType.MsgSetValidTokenIds:
      return convertSetValidTokenIds(message as any, evmAddress);
    case MessageType.MsgSetTokenMetadata:
      return convertSetTokenMetadata(message as any, evmAddress);
    case MessageType.MsgSetCollectionApprovals:
      return convertSetCollectionApprovals(message as any, evmAddress);
    case MessageType.MsgUniversalUpdateCollection:
      return convertUniversalUpdateCollection(message as any, evmAddress);
    case MessageType.MsgCreateBalancerPool:
      return convertMsgCreateBalancerPool(message as any, evmAddress);
    case MessageType.MsgJoinPool:
      return convertMsgJoinPool(message as any, evmAddress);
    case MessageType.MsgExitPool:
      return convertMsgExitPool(message as any, evmAddress);
    case MessageType.MsgSwapExactAmountIn:
      return convertMsgSwapExactAmountIn(message as any, evmAddress);
    case MessageType.MsgSwapExactAmountInWithIBCTransfer:
      return convertMsgSwapExactAmountInWithIBCTransfer(message as any, evmAddress);
    default:
      throw new Error(`Unsupported message type: ${messageType}`);
  }
}
