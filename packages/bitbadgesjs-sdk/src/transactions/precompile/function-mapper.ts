/**
 * Precompile Function Mapper
 * 
 * Maps BitBadges SDK message types to their corresponding precompile function names.
 */

import { MessageType } from './type-detector.js';

/**
 * Available precompile functions (nonpayable only - queries excluded)
 */
export enum PrecompileFunction {
  TransferTokens = 'transferTokens',
  SetIncomingApproval = 'setIncomingApproval',
  SetOutgoingApproval = 'setOutgoingApproval',
  DeleteCollection = 'deleteCollection',
  DeleteIncomingApproval = 'deleteIncomingApproval',
  DeleteOutgoingApproval = 'deleteOutgoingApproval',
  CreateDynamicStore = 'createDynamicStore',
  UpdateDynamicStore = 'updateDynamicStore',
  DeleteDynamicStore = 'deleteDynamicStore',
  SetDynamicStoreValue = 'setDynamicStoreValue',
  SetCustomData = 'setCustomData',
  SetIsArchived = 'setIsArchived',
  SetManager = 'setManager',
  SetCollectionMetadata = 'setCollectionMetadata',
  SetStandards = 'setStandards',
  CastVote = 'castVote',
  CreateCollection = 'createCollection',
  UpdateCollection = 'updateCollection',
  UpdateUserApprovals = 'updateUserApprovals',
  CreateAddressLists = 'createAddressLists',
  PurgeApprovals = 'purgeApprovals',
  SetValidTokenIds = 'setValidTokenIds',
  SetTokenMetadata = 'setTokenMetadata',
  SetCollectionApprovals = 'setCollectionApprovals',
  UniversalUpdateCollection = 'universalUpdateCollection',
  Send = 'send',
  CreatePool = 'createPool',
  JoinPool = 'joinPool',
  ExitPool = 'exitPool',
  SwapExactAmountIn = 'swapExactAmountIn',
  SwapExactAmountInWithIBCTransfer = 'swapExactAmountInWithIBCTransfer',
  // Staking precompile functions (use typed ABI parameters)
  Delegate = 'delegate',
  Undelegate = 'undelegate',
  Redelegate = 'redelegate',
  CancelUnbondingDelegation = 'cancelUnbondingDelegation',
  // Distribution precompile functions (use typed ABI parameters)
  WithdrawDelegatorRewards = 'withdrawDelegatorRewards',
  ClaimRewards = 'claimRewards'
}

/**
 * Map SDK message class names to precompile function names
 */
const MESSAGE_TO_FUNCTION_MAP: Record<MessageType, PrecompileFunction> = {
  [MessageType.MsgTransferTokens]: PrecompileFunction.TransferTokens,
  [MessageType.MsgSetIncomingApproval]: PrecompileFunction.SetIncomingApproval,
  [MessageType.MsgSetOutgoingApproval]: PrecompileFunction.SetOutgoingApproval,
  [MessageType.MsgDeleteCollection]: PrecompileFunction.DeleteCollection,
  [MessageType.MsgDeleteIncomingApproval]: PrecompileFunction.DeleteIncomingApproval,
  [MessageType.MsgDeleteOutgoingApproval]: PrecompileFunction.DeleteOutgoingApproval,
  [MessageType.MsgCreateDynamicStore]: PrecompileFunction.CreateDynamicStore,
  [MessageType.MsgUpdateDynamicStore]: PrecompileFunction.UpdateDynamicStore,
  [MessageType.MsgDeleteDynamicStore]: PrecompileFunction.DeleteDynamicStore,
  [MessageType.MsgSetDynamicStoreValue]: PrecompileFunction.SetDynamicStoreValue,
  [MessageType.MsgSetCustomData]: PrecompileFunction.SetCustomData,
  [MessageType.MsgSetIsArchived]: PrecompileFunction.SetIsArchived,
  [MessageType.MsgSetManager]: PrecompileFunction.SetManager,
  [MessageType.MsgSetCollectionMetadata]: PrecompileFunction.SetCollectionMetadata,
  [MessageType.MsgSetStandards]: PrecompileFunction.SetStandards,
  [MessageType.MsgCastVote]: PrecompileFunction.CastVote,
  [MessageType.MsgCreateCollection]: PrecompileFunction.CreateCollection,
  [MessageType.MsgUpdateCollection]: PrecompileFunction.UpdateCollection,
  [MessageType.MsgUpdateUserApprovals]: PrecompileFunction.UpdateUserApprovals,
  [MessageType.MsgCreateAddressLists]: PrecompileFunction.CreateAddressLists,
  [MessageType.MsgPurgeApprovals]: PrecompileFunction.PurgeApprovals,
  [MessageType.MsgSetValidTokenIds]: PrecompileFunction.SetValidTokenIds,
  [MessageType.MsgSetTokenMetadata]: PrecompileFunction.SetTokenMetadata,
  [MessageType.MsgSetCollectionApprovals]: PrecompileFunction.SetCollectionApprovals,
  [MessageType.MsgUniversalUpdateCollection]: PrecompileFunction.UniversalUpdateCollection,
  [MessageType.MsgSend]: PrecompileFunction.Send,
  [MessageType.MsgCreateBalancerPool]: PrecompileFunction.CreatePool,
  [MessageType.MsgJoinPool]: PrecompileFunction.JoinPool,
  [MessageType.MsgExitPool]: PrecompileFunction.ExitPool,
  [MessageType.MsgSwapExactAmountIn]: PrecompileFunction.SwapExactAmountIn,
  [MessageType.MsgSwapExactAmountInWithIBCTransfer]: PrecompileFunction.SwapExactAmountInWithIBCTransfer,
  // Staking messages
  [MessageType.MsgDelegate]: PrecompileFunction.Delegate,
  [MessageType.MsgUndelegate]: PrecompileFunction.Undelegate,
  [MessageType.MsgBeginRedelegate]: PrecompileFunction.Redelegate,
  [MessageType.MsgCancelUnbondingDelegation]: PrecompileFunction.CancelUnbondingDelegation,
  // Distribution messages
  [MessageType.MsgWithdrawDelegatorReward]: PrecompileFunction.WithdrawDelegatorRewards,
  [MessageType.MsgClaimRewards]: PrecompileFunction.ClaimRewards
};

/**
 * Map a message type to its corresponding precompile function name
 * 
 * @param messageType - The detected message type
 * @returns The precompile function name to call
 * @throws Error if the message type has no corresponding function
 */
export function mapMessageToFunction(
  messageType: MessageType
): PrecompileFunction {
  const functionName = MESSAGE_TO_FUNCTION_MAP[messageType];
  
  if (!functionName) {
    throw new Error(
      `No precompile function mapping found for message type: ${messageType}`
    );
  }
  
  return functionName;
}

