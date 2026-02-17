/**
 * Precompile Data Converter
 * 
 * Converts BitBadges SDK message data to JSON format for precompile functions.
 * Uses the SDK's built-in .toProto().toJson() methods for simplicity.
 */

import type {
  MsgCastVote,
  MsgCreateAddressLists,
  MsgCreateCollection,
  MsgCreateDynamicStore,
  MsgDeleteCollection,
  MsgDeleteDynamicStore,
  MsgDeleteIncomingApproval,
  MsgDeleteOutgoingApproval,
  MsgPurgeApprovals,
  MsgSetCollectionApprovals,
  MsgSetCollectionMetadata,
  MsgSetCustomData,
  MsgSetDynamicStoreValue,
  MsgSetIncomingApproval,
  MsgSetIsArchived,
  MsgSetManager,
  MsgSetOutgoingApproval,
  MsgSetStandards,
  MsgSetTokenMetadata,
  MsgSetValidTokenIds,
  MsgTransferTokens,
  MsgUniversalUpdateCollection,
  MsgUpdateCollection,
  MsgUpdateDynamicStore,
  MsgUpdateUserApprovals
} from '@/transactions/messages/bitbadges/tokenization/index.js';
import type {
  MsgCreateBalancerPool,
  MsgJoinPool,
  MsgExitPool,
  MsgSwapExactAmountIn,
  MsgSwapExactAmountInWithIBCTransfer
} from '@/gamm/tx/classes.js';

/**
 * Type for JSON message objects (matches Cosmos SDK message structure without creator field)
 */
export type PrecompileFunctionParams = Record<string, any>;

/**
 * Convert SDK message to JSON format for precompile
 * Removes the creator field and ensures addresses are in bb bech32 format
 */
function convertMessageToJson(msg: any): PrecompileFunctionParams {
  // Handle SDK messages with toProto() method
  if (typeof msg.toProto === 'function') {
    const proto = msg.toProto();
    const json = proto.toJson();
    
    // Remove creator field (set by chain from msg.sender)
    const { creator: _creator, ...jsonWithoutCreator } = json;
    
    return jsonWithoutCreator;
  }
  
  // Handle proto objects that already have toJson() method
  if (typeof msg.toJson === 'function') {
    const json = msg.toJson();
    
    // Remove creator field (set by chain from msg.sender)
    const { creator: _creator, ...jsonWithoutCreator } = json;
    
    return jsonWithoutCreator;
  }
  
  // If it's already a plain object, just remove creator field
  const { creator: _creator, ...jsonWithoutCreator } = msg;
  return jsonWithoutCreator;
}

/**
 * Convert message with address conversion to bb bech32 format
 */
function convertMessageWithAddresses(msg: any): PrecompileFunctionParams {
  const msgWithBech32Addresses = (msg as any).toBech32Addresses?.('bb') || msg;
  return convertMessageToJson(msgWithBech32Addresses);
}

// ============================================================================
// Converter Functions
// ============================================================================

export function convertTransferTokens(
  msg: MsgTransferTokens<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageWithAddresses(msg);
}

export function convertSetIncomingApproval(
  msg: MsgSetIncomingApproval<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageWithAddresses(msg);
}

export function convertSetOutgoingApproval(
  msg: MsgSetOutgoingApproval<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageWithAddresses(msg);
}

export function convertDeleteCollection(
  msg: MsgDeleteCollection<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageToJson(msg);
}

export function convertDeleteIncomingApproval(
  msg: MsgDeleteIncomingApproval,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageToJson(msg);
}

export function convertDeleteOutgoingApproval(
  msg: MsgDeleteOutgoingApproval,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageToJson(msg);
}

export function convertCreateDynamicStore(
  msg: MsgCreateDynamicStore,
  _evmAddress?: string
): PrecompileFunctionParams {
  // Ensure all required fields are present with explicit values
  let json: Record<string, any>;
  
  // Handle SDK messages with toProto() method
  if (typeof msg.toProto === 'function') {
    const proto = msg.toProto();
    json = proto.toJson() as Record<string, any>;
  } else if (typeof msg.toJson === 'function') {
    // Handle proto objects that already have toJson() method
    json = msg.toJson() as Record<string, any>;
  } else {
    // If it's already a plain object, use it directly
    json = msg as Record<string, any>;
  }
  
  const { creator: _creator, ...jsonWithoutCreator } = json;
  
  return {
    defaultValue: jsonWithoutCreator.defaultValue ?? false,
    uri: jsonWithoutCreator.uri ?? '',
    customData: jsonWithoutCreator.customData ?? ''
  };
}

export function convertUpdateDynamicStore(
  msg: MsgUpdateDynamicStore<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageToJson(msg);
}

export function convertDeleteDynamicStore(
  msg: MsgDeleteDynamicStore<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageToJson(msg);
}

export function convertSetDynamicStoreValue(
  msg: MsgSetDynamicStoreValue<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageWithAddresses(msg);
}

export function convertSetCustomData(
  msg: MsgSetCustomData<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageToJson(msg);
}

export function convertSetIsArchived(
  msg: MsgSetIsArchived<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageToJson(msg);
}

export function convertSetManager(
  msg: MsgSetManager<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageWithAddresses(msg);
}

export function convertSetCollectionMetadata(
  msg: MsgSetCollectionMetadata<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageToJson(msg);
}

export function convertSetStandards(
  msg: MsgSetStandards<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageToJson(msg);
}

export function convertCastVote(
  msg: MsgCastVote<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageWithAddresses(msg);
}

export function convertCreateCollection(
  msg: MsgCreateCollection<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageWithAddresses(msg);
}

export function convertUpdateCollection(
  msg: MsgUpdateCollection<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageWithAddresses(msg);
}

export function convertUpdateUserApprovals(
  msg: MsgUpdateUserApprovals<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageWithAddresses(msg);
}

export function convertCreateAddressLists(
  msg: MsgCreateAddressLists,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageWithAddresses(msg);
}

export function convertPurgeApprovals(
  msg: MsgPurgeApprovals<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageWithAddresses(msg);
}

export function convertSetValidTokenIds(
  msg: MsgSetValidTokenIds<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageToJson(msg);
}

export function convertSetTokenMetadata(
  msg: MsgSetTokenMetadata<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageToJson(msg);
}

export function convertSetCollectionApprovals(
  msg: MsgSetCollectionApprovals<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageToJson(msg);
}

export function convertUniversalUpdateCollection(
  msg: MsgUniversalUpdateCollection<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  return convertMessageWithAddresses(msg);
}

/**
 * Convert MsgSend to JSON format for SendManager precompile
 * Note: from_address is automatically set from msg.sender, so we omit it
 * MsgSend is from proto.cosmos.bank.v1beta1, not bitbadgesjs-sdk
 * 
 * The SendManager precompile accepts MsgSendWithAliasRouting protobuf JSON format,
 * which is compatible with standard MsgSend format (to_address, amount).
 * Supports both standard denoms (e.g., "ubadge") and alias denoms (e.g., "badgeslp:...").
 */
export function convertMsgSend(
  msg: any,
  _evmAddress?: string
): PrecompileFunctionParams {
  // Handle proto messages with toJson() method
  // Proto messages typically return snake_case field names (to_address, from_address)
  let json: Record<string, any>;
  
  if (typeof msg.toJson === 'function') {
    json = msg.toJson() as Record<string, any>;
  } else if (typeof msg.toProto === 'function') {
    const proto = msg.toProto();
    json = proto.toJson() as Record<string, any>;
  } else {
    // If it's already a plain object, use it directly
    json = msg as Record<string, any>;
  }
  
  // For SendManager precompile, we need to:
  // 1. Remove from_address (automatically set from msg.sender on-chain)
  // 2. Keep to_address and amount
  // 3. Handle both snake_case (to_address) and camelCase (toAddress) field names
  // 4. Supports both standard denoms and alias denoms (e.g., badgeslp:...)
  const result: PrecompileFunctionParams = {
    to_address: json.to_address || json.toAddress,
    amount: json.amount || []
  };
  
  // Ensure amount is in the correct format (array of { denom, amount })
  // Amount values should be strings
  if (result.amount && Array.isArray(result.amount)) {
    result.amount = result.amount.map((coin: any) => ({
      denom: coin.denom,
      amount: typeof coin.amount === 'string' ? coin.amount : String(coin.amount)
    }));
  }
  
  // Validate required fields
  if (!result.to_address) {
    throw new Error('MsgSend missing required field: to_address');
  }
  if (!result.amount || !Array.isArray(result.amount) || result.amount.length === 0) {
    throw new Error('MsgSend missing required field: amount (must be non-empty array)');
  }
  
  return result;
}

/**
 * Convert Cosmos Dec (scaled integer) to decimal string format for precompile
 * Cosmos SDK uses integers with 18 decimal places of precision (1e18 scale)
 * Precompile expects decimal strings between 0 and 1 (e.g., "0.003" for 0.3%)
 * 
 * @param cosmosDec - The fee as a Cosmos Dec string (e.g., "3000000000000000" for 0.003)
 * @returns The fee as a decimal string (e.g., "0.003")
 */
function cosmosDecToDecimalString(cosmosDec: string | number | bigint): string {
  if (!cosmosDec || cosmosDec === '0' || cosmosDec === 0 || cosmosDec === 0n) {
    return '0';
  }
  
  // Convert to string and handle bigint
  const decStr = typeof cosmosDec === 'bigint' ? cosmosDec.toString() : String(cosmosDec);
  
  // If it's already a decimal string (contains '.'), validate and return
  if (decStr.includes('.')) {
    const num = parseFloat(decStr);
    if (isNaN(num) || num < 0 || num >= 1) {
      return '0';
    }
    // Return normalized (remove trailing zeros)
    return num.toString();
  }
  
  // Convert from scaled integer (1e18 scale) to decimal
  try {
    const scaledValue = BigInt(decStr);
    const scale = BigInt(1e18);
    
    // If the value is 0, return '0'
    if (scaledValue === 0n) {
      return '0';
    }
    
    // If value >= scale, it's >= 1.0, which is invalid for fees
    if (scaledValue >= scale) {
      return '0';
    }
    
    // Convert to decimal: format as 18-digit decimal string
    // Pad the scaled value to 18 digits (representing 18 decimal places)
    const scaledStr = scaledValue.toString();
    const paddedStr = scaledStr.padStart(18, '0');
    
    // Remove trailing zeros from the decimal part
    const trimmedDecimal = paddedStr.replace(/0+$/, '');
    
    // If all digits were zeros, return '0'
    if (trimmedDecimal === '') {
      return '0';
    }
    
    // Format as "0.XXX" where XXX is the trimmed decimal part
    return `0.${trimmedDecimal}`;
  } catch (error) {
    // If conversion fails, return '0'
    console.warn('Failed to convert Cosmos Dec to decimal string:', cosmosDec, error);
    return '0';
  }
}

/**
 * Convert MsgCreateBalancerPool to JSON format for Gamm precompile
 * Note: sender is automatically set from msg.sender, so we omit it
 * 
 * IMPORTANT: The Go protobuf-generated structs expect snake_case field names,
 * but the SDK's toJson() outputs camelCase. We must manually convert to snake_case.
 * 
 * IMPORTANT: swap_fee and exit_fee must be decimal strings between 0 and 1
 * (e.g., "0.003" for 0.3%), not scaled integers.
 */
export function convertMsgCreateBalancerPool(
  msg: MsgCreateBalancerPool<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  // Get the message as a plain object (handles both SDK message and plain object)
  let msgObj: any;
  if (typeof msg.toProto === 'function') {
    const proto = msg.toProto();
    msgObj = proto.toJson();
  } else if (typeof msg.toJson === 'function') {
    msgObj = msg.toJson();
  } else {
    msgObj = msg;
  }
  
  // Convert camelCase to snake_case for Go protobuf compatibility
  // Note: sender is automatically set from msg.sender by precompile, so we omit it
  const poolParams = msgObj.pool_params || msgObj.poolParams;
  const poolAssets = (msgObj.pool_assets || msgObj.poolAssets || []).map((asset: any) => {
    const token = asset.token || {};
    return {
      token: {
        denom: token.denom || '',
        amount: token.amount?.toString() || '0'
      },
      weight: asset.weight?.toString() || '0'
    };
  });
  
  // Convert Cosmos Dec format to decimal string for precompile
  const swapFeeRaw = poolParams?.swap_fee || poolParams?.swapFee || '0';
  const exitFeeRaw = poolParams?.exit_fee || poolParams?.exitFee || '0';
  
  const result: PrecompileFunctionParams = {
    pool_params: poolParams ? {
      swap_fee: cosmosDecToDecimalString(swapFeeRaw),
      exit_fee: cosmosDecToDecimalString(exitFeeRaw)
    } : undefined,
    pool_assets: poolAssets
  };
  
  // Remove undefined fields
  if (!result.pool_params) {
    delete result.pool_params;
  }
  
  return result;
}

/**
 * Convert MsgJoinPool to JSON format for Gamm precompile
 * Note: sender is automatically set from msg.sender, so we omit it
 * 
 * IMPORTANT: The Go protobuf-generated structs expect snake_case field names,
 * but the SDK's toJson() outputs camelCase. We must manually convert to snake_case.
 */
export function convertMsgJoinPool(
  msg: MsgJoinPool<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  // Get the message as a plain object (handles both SDK message and plain object)
  let msgObj: any;
  if (typeof msg.toProto === 'function') {
    const proto = msg.toProto();
    msgObj = proto.toJson();
  } else if (typeof msg.toJson === 'function') {
    msgObj = msg.toJson();
  } else {
    msgObj = msg;
  }
  
  // Convert camelCase to snake_case for Go protobuf compatibility
  // Note: sender is automatically set from msg.sender by precompile, so we omit it
  // pool_id must be a number (uint64), not a string
  const poolId = msgObj.pool_id ?? msgObj.poolId;
  const poolIdNum = typeof poolId === 'string' ? parseInt(poolId, 10) : (typeof poolId === 'number' ? poolId : (typeof poolId === 'bigint' ? Number(poolId) : 0));
  
  const tokenInMaxs = (msgObj.token_in_maxs || msgObj.tokenInMaxs || []).map((token: any) => ({
    denom: token.denom || '',
    amount: token.amount?.toString() || '0'
  }));
  
  const result: PrecompileFunctionParams = {
    pool_id: poolIdNum,
    share_out_amount: (msgObj.share_out_amount || msgObj.shareOutAmount)?.toString() || '0',
    token_in_maxs: tokenInMaxs
  };
  
  return result;
}

/**
 * Convert MsgExitPool to JSON format for Gamm precompile
 * Note: sender is automatically set from msg.sender, so we omit it
 * 
 * IMPORTANT: The Go protobuf-generated structs expect snake_case field names,
 * but the SDK's toJson() outputs camelCase. We must manually convert to snake_case.
 */
export function convertMsgExitPool(
  msg: MsgExitPool<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  // Get the message as a plain object (handles both SDK message and plain object)
  let msgObj: any;
  if (typeof msg.toProto === 'function') {
    const proto = msg.toProto();
    msgObj = proto.toJson();
  } else if (typeof msg.toJson === 'function') {
    msgObj = msg.toJson();
  } else {
    msgObj = msg;
  }
  
  // Convert camelCase to snake_case for Go protobuf compatibility
  // Note: sender is automatically set from msg.sender by precompile, so we omit it
  // pool_id must be a number (uint64), not a string
  const poolId = msgObj.pool_id ?? msgObj.poolId;
  const poolIdNum = typeof poolId === 'string' ? parseInt(poolId, 10) : (typeof poolId === 'number' ? poolId : (typeof poolId === 'bigint' ? Number(poolId) : 0));
  
  const tokenOutMins = (msgObj.token_out_mins || msgObj.tokenOutMins || []).map((token: any) => ({
    denom: token.denom || '',
    amount: token.amount?.toString() || '0'
  }));
  
  const result: PrecompileFunctionParams = {
    pool_id: poolIdNum,
    share_in_amount: (msgObj.share_in_amount || msgObj.shareInAmount)?.toString() || '0',
    token_out_mins: tokenOutMins
  };
  
  return result;
}

/**
 * Convert MsgSwapExactAmountIn to JSON format for Gamm precompile
 * Note: sender is automatically set from msg.sender, so we omit it
 * 
 * IMPORTANT: The Go protobuf-generated structs expect snake_case field names,
 * but the SDK's toJson() outputs camelCase. We must manually convert to snake_case.
 */
export function convertMsgSwapExactAmountIn(
  msg: MsgSwapExactAmountIn<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  // Get the message as a plain object (handles both SDK message and plain object)
  let msgObj: any;
  if (typeof msg.toProto === 'function') {
    const proto = msg.toProto();
    msgObj = proto.toJson();
  } else if (typeof msg.toJson === 'function') {
    msgObj = msg.toJson();
  } else {
    msgObj = msg;
  }
  
  // Convert camelCase to snake_case for Go protobuf compatibility
  // Note: sender is automatically set from msg.sender by precompile, so we omit it
  const routes = (msgObj.routes || []).map((route: any) => {
    // pool_id must be a number (uint64), not a string
    const poolId = route.pool_id ?? route.poolId;
    const poolIdNum = typeof poolId === 'string' ? parseInt(poolId, 10) : (typeof poolId === 'number' ? poolId : (typeof poolId === 'bigint' ? Number(poolId) : 0));
    
    return {
      pool_id: poolIdNum,
      token_out_denom: route.token_out_denom || route.tokenOutDenom || ''
    };
  });
  
  const result: PrecompileFunctionParams = {
    routes,
    token_in: {
      denom: (msgObj.token_in?.denom || msgObj.tokenIn?.denom) || '',
      amount: (msgObj.token_in?.amount || msgObj.tokenIn?.amount)?.toString() || '0'
    },
    token_out_min_amount: (msgObj.token_out_min_amount || msgObj.tokenOutMinAmount)?.toString() || '0'
  };
  
  // Only include affiliates if present and non-empty
  if (msgObj.affiliates && Array.isArray(msgObj.affiliates) && msgObj.affiliates.length > 0) {
    result.affiliates = msgObj.affiliates.map((affiliate: any) => ({
      basis_points_fee: affiliate.basis_points_fee || affiliate.basisPointsFee?.toString() || '0',
      address: affiliate.address || ''
    }));
  }
  
  return result;
}

/**
 * Convert MsgSwapExactAmountInWithIBCTransfer to JSON format for Gamm precompile
 * Note: sender is automatically set from msg.sender, so we omit it
 * 
 * IMPORTANT: The Go protobuf-generated structs expect snake_case field names,
 * but the SDK's toJson() outputs camelCase. We must manually convert to snake_case.
 */
export function convertMsgSwapExactAmountInWithIBCTransfer(
  msg: MsgSwapExactAmountInWithIBCTransfer<bigint>,
  _evmAddress?: string
): PrecompileFunctionParams {
  // Get the message as a plain object (handles both SDK message and plain object)
  let msgObj: any;
  if (typeof msg.toProto === 'function') {
    const proto = msg.toProto();
    msgObj = proto.toJson();
  } else if (typeof msg.toJson === 'function') {
    msgObj = msg.toJson();
  } else {
    msgObj = msg;
  }
  
  // Convert camelCase to snake_case for Go protobuf compatibility
  // Note: sender is automatically set from msg.sender by precompile, so we omit it
  const routes = (msgObj.routes || []).map((route: any) => {
    // pool_id must be a number (uint64), not a string
    const poolId = route.pool_id ?? route.poolId;
    const poolIdNum = typeof poolId === 'string' ? parseInt(poolId, 10) : (typeof poolId === 'number' ? poolId : (typeof poolId === 'bigint' ? Number(poolId) : 0));
    
    return {
      pool_id: poolIdNum,
      token_out_denom: route.token_out_denom || route.tokenOutDenom || ''
    };
  });
  
  const result: PrecompileFunctionParams = {
    routes,
    token_in: {
      denom: (msgObj.token_in?.denom || msgObj.tokenIn?.denom) || '',
      amount: (msgObj.token_in?.amount || msgObj.tokenIn?.amount)?.toString() || '0'
    },
    token_out_min_amount: (msgObj.token_out_min_amount || msgObj.tokenOutMinAmount)?.toString() || '0'
  };
  
  // Only include affiliates if present and non-empty
  if (msgObj.affiliates && Array.isArray(msgObj.affiliates) && msgObj.affiliates.length > 0) {
    result.affiliates = msgObj.affiliates.map((affiliate: any) => ({
      basis_points_fee: affiliate.basis_points_fee || affiliate.basisPointsFee?.toString() || '0',
      address: affiliate.address || ''
    }));
  }
  
  // Handle IBC transfer info if present
  if (msgObj.ibcTransferInfo || msgObj.ibc_transfer_info) {
    const ibcInfo = msgObj.ibcTransferInfo || msgObj.ibc_transfer_info;
    result.ibc_transfer_info = {
      source_channel: ibcInfo.source_channel || ibcInfo.sourceChannel || '',
      receiver: ibcInfo.receiver || ibcInfo.receiver_address || '',
      timeout_timestamp: ibcInfo.timeout_timestamp || ibcInfo.timeoutTimestamp?.toString() || '0',
      memo: ibcInfo.memo || ''
    };
  }

  return result;
}

// ============================================================================
// Staking Precompile Converter Functions
// ============================================================================

/**
 * Parameters for staking precompile typed ABI calls
 * These are NOT JSON-encoded - they are passed as typed parameters
 */
export interface StakingPrecompileParams {
  delegatorAddress: string;
  validatorAddress: string;
  amount: bigint;
  // For redelegate
  validatorSrcAddress?: string;
  validatorDstAddress?: string;
  // For cancelUnbondingDelegation
  creationHeight?: bigint;
}

/**
 * Parameters for distribution precompile typed ABI calls
 */
export interface DistributionPrecompileParams {
  delegatorAddress: string;
  validatorAddress?: string;
  maxRetrieve?: number;
}

/**
 * Convert MsgDelegate to staking precompile parameters
 * Note: The staking precompile uses typed ABI parameters (not JSON string)
 * Amount should be in abadge (18 decimals via precisebank)
 */
export function convertMsgDelegate(msg: any, evmAddress?: string): StakingPrecompileParams {
  let msgObj: any;

  if (typeof msg.toJson === 'function') {
    msgObj = msg.toJson();
  } else if (typeof msg.toProto === 'function') {
    msgObj = msg.toProto().toJson();
  } else {
    msgObj = msg;
  }

  // Get amount - convert from ubadge (9 decimals) to abadge (18 decimals) if needed
  const amountStr = msgObj.amount?.amount || msgObj.amount || '0';
  const amount = BigInt(amountStr);

  return {
    delegatorAddress: evmAddress || msgObj.delegatorAddress || msgObj.delegator_address || '',
    validatorAddress: msgObj.validatorAddress || msgObj.validator_address || '',
    amount
  };
}

/**
 * Convert MsgUndelegate to staking precompile parameters
 */
export function convertMsgUndelegate(msg: any, evmAddress?: string): StakingPrecompileParams {
  let msgObj: any;

  if (typeof msg.toJson === 'function') {
    msgObj = msg.toJson();
  } else if (typeof msg.toProto === 'function') {
    msgObj = msg.toProto().toJson();
  } else {
    msgObj = msg;
  }

  const amountStr = msgObj.amount?.amount || msgObj.amount || '0';
  const amount = BigInt(amountStr);

  return {
    delegatorAddress: evmAddress || msgObj.delegatorAddress || msgObj.delegator_address || '',
    validatorAddress: msgObj.validatorAddress || msgObj.validator_address || '',
    amount
  };
}

/**
 * Convert MsgBeginRedelegate to staking precompile parameters
 */
export function convertMsgBeginRedelegate(msg: any, evmAddress?: string): StakingPrecompileParams {
  let msgObj: any;

  if (typeof msg.toJson === 'function') {
    msgObj = msg.toJson();
  } else if (typeof msg.toProto === 'function') {
    msgObj = msg.toProto().toJson();
  } else {
    msgObj = msg;
  }

  const amountStr = msgObj.amount?.amount || msgObj.amount || '0';
  const amount = BigInt(amountStr);

  return {
    delegatorAddress: evmAddress || msgObj.delegatorAddress || msgObj.delegator_address || '',
    validatorAddress: '', // Not used for redelegate
    validatorSrcAddress: msgObj.validatorSrcAddress || msgObj.validator_src_address || '',
    validatorDstAddress: msgObj.validatorDstAddress || msgObj.validator_dst_address || '',
    amount
  };
}

/**
 * Convert MsgCancelUnbondingDelegation to staking precompile parameters
 */
export function convertMsgCancelUnbondingDelegation(msg: any, evmAddress?: string): StakingPrecompileParams {
  let msgObj: any;

  if (typeof msg.toJson === 'function') {
    msgObj = msg.toJson();
  } else if (typeof msg.toProto === 'function') {
    msgObj = msg.toProto().toJson();
  } else {
    msgObj = msg;
  }

  const amountStr = msgObj.amount?.amount || msgObj.amount || '0';
  const amount = BigInt(amountStr);
  const creationHeight = BigInt(msgObj.creationHeight || msgObj.creation_height || '0');

  return {
    delegatorAddress: evmAddress || msgObj.delegatorAddress || msgObj.delegator_address || '',
    validatorAddress: msgObj.validatorAddress || msgObj.validator_address || '',
    amount,
    creationHeight
  };
}

/**
 * Convert MsgWithdrawDelegatorReward to distribution precompile parameters
 */
export function convertMsgWithdrawDelegatorReward(msg: any, evmAddress?: string): DistributionPrecompileParams {
  let msgObj: any;

  if (typeof msg.toJson === 'function') {
    msgObj = msg.toJson();
  } else if (typeof msg.toProto === 'function') {
    msgObj = msg.toProto().toJson();
  } else {
    msgObj = msg;
  }

  return {
    delegatorAddress: evmAddress || msgObj.delegatorAddress || msgObj.delegator_address || '',
    validatorAddress: msgObj.validatorAddress || msgObj.validator_address || ''
  };
}

/**
 * Convert MsgClaimRewards to distribution precompile parameters
 * Note: This is a custom message type for the claimRewards convenience function
 * which claims rewards from multiple validators at once
 */
export function convertMsgClaimRewards(msg: any, evmAddress?: string): DistributionPrecompileParams {
  let msgObj: any;

  if (typeof msg.toJson === 'function') {
    msgObj = msg.toJson();
  } else if (typeof msg.toProto === 'function') {
    msgObj = msg.toProto().toJson();
  } else {
    msgObj = msg;
  }

  return {
    delegatorAddress: evmAddress || msgObj.delegatorAddress || msgObj.delegator_address || '',
    maxRetrieve: msgObj.maxRetrieve || msgObj.max_retrieve || 10 // Default to 10 validators
  };
}

