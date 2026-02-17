/**
 * Precompile Utilities - Main Export
 *
 * This module provides a unified interface for converting BitBadges SDK messages
 * to EVM precompile function calls. All precompile methods accept a single JSON string parameter.
 *
 * @example
 * ```typescript
 * import { convertMessageToPrecompileCall, TOKENIZATION_PRECOMPILE_ADDRESS } from 'bitbadgesjs-sdk';
 *
 * const msg = new MsgCreateCollection({...});
 * const { functionName, data, jsonMsg } = convertMessageToPrecompileCall(msg, evmAddress);
 *
 * // Send transaction
 * await provider.sendTransaction({
 *   to: TOKENIZATION_PRECOMPILE_ADDRESS,
 *   data: data
 * });
 * ```
 */

export {
  convertMessageToPrecompileCall,
  convertMessagesToExecuteMultiple,
  areAllTokenizationMessages,
  isGammMessage,
  isStakingMessage,
  isDistributionMessage,
  TOKENIZATION_PRECOMPILE_ADDRESS,
  BANK_PRECOMPILE_ADDRESS,
  SENDMANAGER_PRECOMPILE_ADDRESS,
  GAMM_PRECOMPILE_ADDRESS,
  STAKING_PRECOMPILE_ADDRESS,
  DISTRIBUTION_PRECOMPILE_ADDRESS,
  PrecompileEncodingError
} from './utils.js';

export type { PrecompileCallResult } from './utils.js';
export { PRECOMPILE_ABI, type PrecompileAbi } from './abi.js';
export { stakingPrecompileAbiData, distributionPrecompileAbiData } from './abi-data.js';

export type { PrecompileFunctionParams, StakingPrecompileParams, DistributionPrecompileParams } from './data-converter.js';
export { PrecompileFunction, mapMessageToFunction } from './function-mapper.js';
export {
  MessageType,
  detectMessageType,
  type SupportedSdkMessage,
  isMsgDelegate,
  isMsgUndelegate,
  isMsgBeginRedelegate,
  isMsgCancelUnbondingDelegation,
  isMsgWithdrawDelegatorReward,
  isMsgClaimRewards
} from './type-detector.js';
export {
  evmToCosmosAddress,
  cosmosToEvmAddress,
  convertUintRanges,
  convertBigInt,
  bigintToString,
  convertBigIntsToStrings,
  validateEvmAddress,
  validateMessage,
  ValidationError
} from './helpers.js';
