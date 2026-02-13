/**
 * Precompile Helper Utilities
 *
 * Shared helper functions for converting between SDK types and precompile formats.
 */

import { ethers } from 'ethers';
import { bech32 } from 'bech32';
import type { UintRange } from '@/core/uintRanges.js';

/**
 * Validation Errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate EVM address format
 *
 * @param address - The EVM address to validate (optional)
 * @throws {ValidationError} If address is provided but invalid
 */
export function validateEvmAddress(address: string | undefined): void {
  if (address && !ethers.isAddress(address)) {
    throw new ValidationError(`Invalid EVM address: ${address}`);
  }
}

/**
 * Validate that a message object has the required structure
 *
 * @param message - The message to validate
 * @throws {ValidationError} If message is invalid
 */
export function validateMessage(message: unknown): void {
  if (!message || typeof message !== 'object') {
    throw new ValidationError('Message must be an object');
  }

  const msg = message as any;
  if (typeof msg.toProto !== 'function' && typeof msg.toJson !== 'function') {
    throw new ValidationError('Message must have toProto() or toJson() method');
  }
}

/**
 * Convert EVM address to Cosmos bech32 address
 *
 * @param evmAddress - The EVM address (0x...)
 * @param prefix - The bech32 prefix (default: 'bb')
 * @returns The Cosmos bech32 address
 * @throws {Error} If address conversion fails
 */
export function evmToCosmosAddress(evmAddress: string, prefix: string = 'bb'): string {
  try {
    const addressBytes = ethers.getBytes(evmAddress);
    const words = bech32.toWords(addressBytes);
    return bech32.encode(prefix, words);
  } catch (error) {
    throw new Error(`Failed to convert EVM address to Cosmos: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert Cosmos bech32 address to EVM address
 *
 * @param cosmosAddress - The Cosmos bech32 address
 * @returns The EVM address (0x...)
 * @throws {Error} If address conversion fails
 */
export function cosmosToEvmAddress(cosmosAddress: string): string {
  try {
    const { words } = bech32.decode(cosmosAddress);
    const addressBytes = new Uint8Array(bech32.fromWords(words));
    return ethers.getAddress(ethers.hexlify(addressBytes));
  } catch (error) {
    throw new Error(`Failed to convert Cosmos address to EVM: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert UintRange array from SDK format to JSON format (strings for bigint values)
 *
 * @param ranges - Array of UintRange from SDK (can be string or bigint)
 * @returns Array of {start: string, end: string} for JSON serialization
 */
export function convertUintRanges(
  ranges: UintRange<string | bigint>[]
): Array<{ start: string; end: string }> {
  return ranges.map(range => ({
    start: bigintToString(range.start),
    end: bigintToString(range.end)
  }));
}

/**
 * Convert a value to bigint, handling string or bigint inputs
 *
 * @param value - The value to convert
 * @param defaultValue - Default value if value is null/undefined
 * @returns The bigint value
 */
export function convertBigInt(value: string | bigint | number | null | undefined, defaultValue: bigint = 0n): bigint {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'bigint') {
    return value;
  }
  return BigInt(value);
}

/**
 * Convert a bigint value to string for JSON serialization
 *
 * @param value - The value to convert (bigint, string, or number)
 * @returns String representation of the value
 */
export function bigintToString(value: bigint | string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
}

/**
 * Recursively convert all bigint values in an object to strings for JSON serialization
 *
 * @param obj - The object to convert
 * @returns Object with all bigint values converted to strings
 */
export function convertBigIntsToStrings(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntsToStrings);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertBigIntsToStrings(obj[key]);
      }
    }
    return result;
  }

  return obj;
}
