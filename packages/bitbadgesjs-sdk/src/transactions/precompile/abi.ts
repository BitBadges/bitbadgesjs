/**
 * Precompile Address and ABI Configuration
 *
 * Address and ABI for the tokenization precompile on BitBadges chain.
 * All precompile methods accept a single JSON string parameter.
 */

import { precompileAbiData } from './abi-data.js';

const precompileAbi = precompileAbiData;

/**
 * Tokenization precompile contract address
 */
export const TOKENIZATION_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000001001';

/**
 * Bank precompile contract address (Cosmos EVM default)
 * Read-only precompile for querying balances and supply
 * Address: 0x0000000000000000000000000000000000000804
 * Note: Does NOT support sending tokens (MsgSend) - only queries
 */
export const BANK_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000804';

/**
 * SendManager precompile contract address (for MsgSend transactions)
 * Custom BitBadges precompile that enables sending native Cosmos coins from EVM
 * Address: 0x0000000000000000000000000000000000001003
 * Note: Uses JSON string encoding (same pattern as tokenization precompile)
 *       Supports both standard coins and alias denoms (e.g., badgeslp:...)
 */
export const SENDMANAGER_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000001003';

/**
 * Gamm precompile contract address (for liquidity pool operations)
 * Custom BitBadges precompile that enables interacting with liquidity pools from EVM
 * Address: 0x0000000000000000000000000000000000001002
 * Note: Uses JSON string encoding (same pattern as tokenization precompile)
 *       Supports pool creation, joining, exiting, and swapping
 */
export const GAMM_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000001002';

/**
 * Precompile ABI (Application Binary Interface)
 *
 * This ABI defines all available functions on the tokenization precompile.
 * All transaction methods accept a single `string msgJson` parameter.
 * Query methods are included but not used (we use Cosmos queries instead).
 */
export const PRECOMPILE_ABI = precompileAbi.abi;

/**
 * Type for the precompile ABI
 */
export type PrecompileAbi = typeof PRECOMPILE_ABI;

