/**
 * Precompile Type Detector
 *
 * Detects the type of BitBadges SDK message and maps it to a known message type enum.
 */

import type {
  MsgUniversalUpdateCollection,
  MsgTransferTokens,
  MsgSetIncomingApproval,
  MsgSetOutgoingApproval,
  MsgDeleteCollection,
  MsgDeleteIncomingApproval,
  MsgDeleteOutgoingApproval,
  MsgCreateDynamicStore,
  MsgUpdateDynamicStore,
  MsgDeleteDynamicStore,
  MsgSetDynamicStoreValue,
  MsgSetCustomData,
  MsgSetIsArchived,
  MsgSetManager,
  MsgSetCollectionMetadata,
  MsgSetStandards,
  MsgCastVote,
  MsgCreateCollection,
  MsgUpdateCollection,
  MsgUpdateUserApprovals,
  MsgCreateAddressLists,
  MsgPurgeApprovals,
  MsgSetValidTokenIds,
  MsgSetTokenMetadata,
  MsgSetCollectionApprovals
} from '@/transactions/messages/bitbadges/tokenization/index.js';
import type {
  MsgCreateBalancerPool,
  MsgJoinPool,
  MsgExitPool,
  MsgSwapExactAmountIn,
  MsgSwapExactAmountInWithIBCTransfer
} from '@/gamm/tx/classes.js';

/**
 * Supported message types that can be converted to precompile calls
 */
export enum MessageType {
  MsgTransferTokens = 'MsgTransferTokens',
  MsgSetIncomingApproval = 'MsgSetIncomingApproval',
  MsgSetOutgoingApproval = 'MsgSetOutgoingApproval',
  MsgDeleteCollection = 'MsgDeleteCollection',
  MsgDeleteIncomingApproval = 'MsgDeleteIncomingApproval',
  MsgDeleteOutgoingApproval = 'MsgDeleteOutgoingApproval',
  MsgCreateDynamicStore = 'MsgCreateDynamicStore',
  MsgUpdateDynamicStore = 'MsgUpdateDynamicStore',
  MsgDeleteDynamicStore = 'MsgDeleteDynamicStore',
  MsgSetDynamicStoreValue = 'MsgSetDynamicStoreValue',
  MsgSetCustomData = 'MsgSetCustomData',
  MsgSetIsArchived = 'MsgSetIsArchived',
  MsgSetManager = 'MsgSetManager',
  MsgSetCollectionMetadata = 'MsgSetCollectionMetadata',
  MsgSetStandards = 'MsgSetStandards',
  MsgCastVote = 'MsgCastVote',
  MsgCreateCollection = 'MsgCreateCollection',
  MsgUpdateCollection = 'MsgUpdateCollection',
  MsgUpdateUserApprovals = 'MsgUpdateUserApprovals',
  MsgCreateAddressLists = 'MsgCreateAddressLists',
  MsgPurgeApprovals = 'MsgPurgeApprovals',
  MsgSetValidTokenIds = 'MsgSetValidTokenIds',
  MsgSetTokenMetadata = 'MsgSetTokenMetadata',
  MsgSetCollectionApprovals = 'MsgSetCollectionApprovals',
  MsgUniversalUpdateCollection = 'MsgUniversalUpdateCollection',
  MsgSend = 'MsgSend',
  MsgCreateBalancerPool = 'MsgCreateBalancerPool',
  MsgJoinPool = 'MsgJoinPool',
  MsgExitPool = 'MsgExitPool',
  MsgSwapExactAmountIn = 'MsgSwapExactAmountIn',
  MsgSwapExactAmountInWithIBCTransfer = 'MsgSwapExactAmountInWithIBCTransfer'
}

/**
 * Union type of all supported SDK messages
 * Note: MsgSend is from proto.cosmos.bank.v1beta1, not bitbadgesjs-sdk
 */
export type SupportedSdkMessage =
  | MsgUniversalUpdateCollection<bigint>
  | MsgTransferTokens<bigint>
  | MsgSetIncomingApproval<bigint>
  | MsgSetOutgoingApproval<bigint>
  | MsgDeleteCollection<bigint>
  | MsgDeleteIncomingApproval
  | MsgDeleteOutgoingApproval
  | MsgCreateDynamicStore
  | MsgUpdateDynamicStore<bigint>
  | MsgDeleteDynamicStore<bigint>
  | MsgSetDynamicStoreValue<bigint>
  | MsgSetCustomData<bigint>
  | MsgSetIsArchived<bigint>
  | MsgSetManager<bigint>
  | MsgSetCollectionMetadata<bigint>
  | MsgSetStandards<bigint>
  | MsgCastVote<bigint>
  | MsgCreateCollection<bigint>
  | MsgUpdateCollection<bigint>
  | MsgUpdateUserApprovals<bigint>
  | MsgCreateAddressLists
  | MsgPurgeApprovals<bigint>
  | MsgSetValidTokenIds<bigint>
  | MsgSetTokenMetadata<bigint>
  | MsgSetCollectionApprovals<bigint>
  | MsgCreateBalancerPool<bigint>
  | MsgJoinPool<bigint>
  | MsgExitPool<bigint>
  | MsgSwapExactAmountIn<bigint>
  | MsgSwapExactAmountInWithIBCTransfer<bigint>
  | { constructor: { name: 'MsgSend' }; toJson(): unknown }; // MsgSend from proto.cosmos.bank.v1beta1 (not exported from bitbadgesjs-sdk types)

/**
 * Detect message type from proto message's typeName
 * This allows us to work with proto messages directly without converting to SDK messages
 */
function detectMessageTypeFromProto(typeName: string): MessageType | null {
  // Map proto type names to MessageType enum
  // Format: "package.MessageName" -> MessageType.MessageName

  // Gamm messages
  if (typeName === 'gamm.v1beta1.MsgSwapExactAmountIn') return MessageType.MsgSwapExactAmountIn;
  if (typeName === 'gamm.v1beta1.MsgSwapExactAmountInWithIBCTransfer') return MessageType.MsgSwapExactAmountInWithIBCTransfer;
  if (typeName === 'gamm.v1beta1.MsgJoinPool') return MessageType.MsgJoinPool;
  if (typeName === 'gamm.v1beta1.MsgExitPool') return MessageType.MsgExitPool;
  if (typeName === 'gamm.poolmodels.balancer.MsgCreateBalancerPool') return MessageType.MsgCreateBalancerPool;

  // Tokenization messages
  if (typeName === 'tokenization.MsgTransferTokens') return MessageType.MsgTransferTokens;
  if (typeName === 'tokenization.MsgSetIncomingApproval') return MessageType.MsgSetIncomingApproval;
  if (typeName === 'tokenization.MsgSetOutgoingApproval') return MessageType.MsgSetOutgoingApproval;
  if (typeName === 'tokenization.MsgDeleteCollection') return MessageType.MsgDeleteCollection;
  if (typeName === 'tokenization.MsgDeleteIncomingApproval') return MessageType.MsgDeleteIncomingApproval;
  if (typeName === 'tokenization.MsgDeleteOutgoingApproval') return MessageType.MsgDeleteOutgoingApproval;
  if (typeName === 'tokenization.MsgCreateDynamicStore') return MessageType.MsgCreateDynamicStore;
  if (typeName === 'tokenization.MsgUpdateDynamicStore') return MessageType.MsgUpdateDynamicStore;
  if (typeName === 'tokenization.MsgDeleteDynamicStore') return MessageType.MsgDeleteDynamicStore;
  if (typeName === 'tokenization.MsgSetDynamicStoreValue') return MessageType.MsgSetDynamicStoreValue;
  if (typeName === 'tokenization.MsgSetCustomData') return MessageType.MsgSetCustomData;
  if (typeName === 'tokenization.MsgSetIsArchived') return MessageType.MsgSetIsArchived;
  if (typeName === 'tokenization.MsgSetManager') return MessageType.MsgSetManager;
  if (typeName === 'tokenization.MsgSetCollectionMetadata') return MessageType.MsgSetCollectionMetadata;
  if (typeName === 'tokenization.MsgSetStandards') return MessageType.MsgSetStandards;
  if (typeName === 'tokenization.MsgCastVote') return MessageType.MsgCastVote;
  if (typeName === 'tokenization.MsgCreateCollection') return MessageType.MsgCreateCollection;
  if (typeName === 'tokenization.MsgUpdateCollection') return MessageType.MsgUpdateCollection;
  if (typeName === 'tokenization.MsgUpdateUserApprovals') return MessageType.MsgUpdateUserApprovals;
  if (typeName === 'tokenization.MsgCreateAddressLists') return MessageType.MsgCreateAddressLists;
  if (typeName === 'tokenization.MsgPurgeApprovals') return MessageType.MsgPurgeApprovals;
  if (typeName === 'tokenization.MsgSetValidTokenIds') return MessageType.MsgSetValidTokenIds;
  if (typeName === 'tokenization.MsgSetTokenMetadata') return MessageType.MsgSetTokenMetadata;
  if (typeName === 'tokenization.MsgSetCollectionApprovals') return MessageType.MsgSetCollectionApprovals;
  if (typeName === 'tokenization.MsgUniversalUpdateCollection') return MessageType.MsgUniversalUpdateCollection;

  // Cosmos messages
  if (typeName === 'cosmos.bank.v1beta1.MsgSend') return MessageType.MsgSend;

  return null;
}

/**
 * Detect the type of a BitBadges SDK message or proto message
 *
 * @param message - The SDK message or proto message to detect
 * @returns The detected message type
 * @throws Error if the message type is not supported
 */
export function detectMessageType(message: SupportedSdkMessage | any): MessageType {
  // First, try to detect from proto message typeName (if it's a proto message)
  if (message && typeof message === 'object' && typeof message.getType === 'function') {
    const typeName = message.getType().typeName;
    const protoType = detectMessageTypeFromProto(typeName);
    if (protoType) {
      return protoType;
    }
  }

  // Fall back to SDK message detection (original logic)
  // Check each message type - order doesn't matter since we only check constructor names
  // Check MsgSend first (from proto.cosmos.bank.v1beta1)
  if (isMsgSend(message)) return MessageType.MsgSend;
  if (isMsgTransferTokens(message)) return MessageType.MsgTransferTokens;
  if (isMsgSetIncomingApproval(message)) return MessageType.MsgSetIncomingApproval;
  if (isMsgSetOutgoingApproval(message)) return MessageType.MsgSetOutgoingApproval;
  if (isMsgUpdateUserApprovals(message)) return MessageType.MsgUpdateUserApprovals;
  if (isMsgDeleteCollection(message)) return MessageType.MsgDeleteCollection;
  if (isMsgDeleteIncomingApproval(message)) return MessageType.MsgDeleteIncomingApproval;
  if (isMsgDeleteOutgoingApproval(message)) return MessageType.MsgDeleteOutgoingApproval;
  if (isMsgCreateDynamicStore(message)) return MessageType.MsgCreateDynamicStore;
  if (isMsgUpdateDynamicStore(message)) return MessageType.MsgUpdateDynamicStore;
  if (isMsgDeleteDynamicStore(message)) return MessageType.MsgDeleteDynamicStore;
  if (isMsgSetDynamicStoreValue(message)) return MessageType.MsgSetDynamicStoreValue;
  if (isMsgSetCustomData(message)) return MessageType.MsgSetCustomData;
  if (isMsgUniversalUpdateCollection(message)) return MessageType.MsgUniversalUpdateCollection;
  if (isMsgSetIsArchived(message)) return MessageType.MsgSetIsArchived;
  if (isMsgSetManager(message)) return MessageType.MsgSetManager;
  if (isMsgSetCollectionMetadata(message)) return MessageType.MsgSetCollectionMetadata;
  if (isMsgSetStandards(message)) return MessageType.MsgSetStandards;
  if (isMsgCastVote(message)) return MessageType.MsgCastVote;
  if (isMsgCreateCollection(message)) return MessageType.MsgCreateCollection;
  if (isMsgUpdateCollection(message)) return MessageType.MsgUpdateCollection;
  if (isMsgCreateAddressLists(message)) return MessageType.MsgCreateAddressLists;
  if (isMsgPurgeApprovals(message)) return MessageType.MsgPurgeApprovals;
  if (isMsgSetValidTokenIds(message)) return MessageType.MsgSetValidTokenIds;
  if (isMsgSetTokenMetadata(message)) return MessageType.MsgSetTokenMetadata;
  if (isMsgSetCollectionApprovals(message)) return MessageType.MsgSetCollectionApprovals;
  if (isMsgCreateBalancerPool(message)) return MessageType.MsgCreateBalancerPool;
  if (isMsgJoinPool(message)) return MessageType.MsgJoinPool;
  if (isMsgExitPool(message)) return MessageType.MsgExitPool;
  if (isMsgSwapExactAmountIn(message)) return MessageType.MsgSwapExactAmountIn;
  if (isMsgSwapExactAmountInWithIBCTransfer(message)) return MessageType.MsgSwapExactAmountInWithIBCTransfer;

  const messageName = (message && typeof message === 'object' && 'constructor' in message)
    ? (message as { constructor?: { name?: string } }).constructor?.name || 'unknown'
    : typeof message;
  throw new Error(
    `Unsupported message type. Got: ${messageName}. Message must be a supported SDK message instance.`
  );
}

// Type guards for each message type

export function isMsgTransferTokens(message: unknown): message is MsgTransferTokens<bigint> {
  if (!message || typeof message !== 'object') return false;
  const msg = message as { constructor?: { name?: string }; toProto?: unknown; collectionId?: unknown; transfers?: unknown };
  return msg.constructor?.name === 'MsgTransferTokens' &&
         typeof msg.toProto === 'function' &&
         'collectionId' in msg &&
         'transfers' in msg;
}

// Type guards for each message type

function createTypeGuard<T>(
  constructorName: string,
  requiredProperties: string[] = []
): (message: unknown) => message is T {
  return (message: unknown): message is T => {
    if (!message || typeof message !== 'object') return false;
    const msg = message as { constructor?: { name?: string }; toProto?: unknown; [key: string]: unknown };
    const hasConstructor = msg.constructor?.name === constructorName;
    const hasToProto = typeof msg.toProto === 'function';
    const hasRequiredProps = requiredProperties.every(prop => prop in msg);
    return hasConstructor && hasToProto && hasRequiredProps;
  };
}

export const isMsgSetIncomingApproval = createTypeGuard<MsgSetIncomingApproval<bigint>>('MsgSetIncomingApproval', ['approvalId']);
export const isMsgSetOutgoingApproval = createTypeGuard<MsgSetOutgoingApproval<bigint>>('MsgSetOutgoingApproval', ['approvalId']);
export const isMsgDeleteCollection = createTypeGuard<MsgDeleteCollection<bigint>>('MsgDeleteCollection', ['collectionId']);
export const isMsgDeleteIncomingApproval = createTypeGuard<MsgDeleteIncomingApproval>('MsgDeleteIncomingApproval', ['approvalId']);
export const isMsgDeleteOutgoingApproval = createTypeGuard<MsgDeleteOutgoingApproval>('MsgDeleteOutgoingApproval', ['approvalId']);
export const isMsgCreateDynamicStore = createTypeGuard<MsgCreateDynamicStore>('MsgCreateDynamicStore', ['storeId']);
export const isMsgUpdateDynamicStore = createTypeGuard<MsgUpdateDynamicStore<bigint>>('MsgUpdateDynamicStore', ['storeId']);
export const isMsgDeleteDynamicStore = createTypeGuard<MsgDeleteDynamicStore<bigint>>('MsgDeleteDynamicStore', ['storeId']);
export const isMsgSetDynamicStoreValue = createTypeGuard<MsgSetDynamicStoreValue<bigint>>('MsgSetDynamicStoreValue', ['storeId']);
export const isMsgSetCustomData = createTypeGuard<MsgSetCustomData<bigint>>('MsgSetCustomData', ['collectionId']);
export const isMsgSetIsArchived = createTypeGuard<MsgSetIsArchived<bigint>>('MsgSetIsArchived', ['collectionId']);
export const isMsgSetManager = createTypeGuard<MsgSetManager<bigint>>('MsgSetManager', ['collectionId']);
export const isMsgSetCollectionMetadata = createTypeGuard<MsgSetCollectionMetadata<bigint>>('MsgSetCollectionMetadata', ['collectionId']);
export const isMsgSetStandards = createTypeGuard<MsgSetStandards<bigint>>('MsgSetStandards', ['collectionId']);
export const isMsgCastVote = createTypeGuard<MsgCastVote<bigint>>('MsgCastVote', ['collectionId']);
export const isMsgCreateCollection = createTypeGuard<MsgCreateCollection<bigint>>('MsgCreateCollection', ['collectionId']);
export const isMsgUpdateCollection = createTypeGuard<MsgUpdateCollection<bigint>>('MsgUpdateCollection', ['collectionId']);
export const isMsgUpdateUserApprovals = createTypeGuard<MsgUpdateUserApprovals<bigint>>('MsgUpdateUserApprovals', ['approvalId']);
export const isMsgCreateAddressLists = createTypeGuard<MsgCreateAddressLists>('MsgCreateAddressLists', ['addressLists']);
export const isMsgPurgeApprovals = createTypeGuard<MsgPurgeApprovals<bigint>>('MsgPurgeApprovals', ['approvalId']);
export const isMsgSetValidTokenIds = createTypeGuard<MsgSetValidTokenIds<bigint>>('MsgSetValidTokenIds', ['collectionId']);
export const isMsgSetTokenMetadata = createTypeGuard<MsgSetTokenMetadata<bigint>>('MsgSetTokenMetadata', ['collectionId']);
export const isMsgSetCollectionApprovals = createTypeGuard<MsgSetCollectionApprovals<bigint>>('MsgSetCollectionApprovals', ['collectionId']);
export const isMsgUniversalUpdateCollection = createTypeGuard<MsgUniversalUpdateCollection<bigint>>('MsgUniversalUpdateCollection', ['collectionId']);
export const isMsgCreateBalancerPool = createTypeGuard<MsgCreateBalancerPool<bigint>>('MsgCreateBalancerPool', ['poolParams']);
export const isMsgJoinPool = createTypeGuard<MsgJoinPool<bigint>>('MsgJoinPool', ['poolId']);
export const isMsgExitPool = createTypeGuard<MsgExitPool<bigint>>('MsgExitPool', ['poolId']);
export const isMsgSwapExactAmountIn = createTypeGuard<MsgSwapExactAmountIn<bigint>>('MsgSwapExactAmountIn', ['routes']);
export const isMsgSwapExactAmountInWithIBCTransfer = createTypeGuard<MsgSwapExactAmountInWithIBCTransfer<bigint>>('MsgSwapExactAmountInWithIBCTransfer', ['routes']);

export function isMsgSend(message: unknown): message is { constructor: { name: 'MsgSend' }; toJson(): unknown } {
  if (!message || typeof message !== 'object') return false;
  const msg = message as { constructor?: { name?: string }; toJson?: unknown };
  return msg.constructor?.name === 'MsgSend' && typeof msg.toJson === 'function';
}
