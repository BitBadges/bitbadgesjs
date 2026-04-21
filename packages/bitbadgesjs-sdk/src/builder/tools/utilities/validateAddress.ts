/**
 * Tool: validate_address
 * Check if an address is valid and detect its chain type.
 *
 * Thin wrapper over the SDK's canonical address helpers in
 * `src/address-converter/converter.ts`. This guarantees the MCP tool applies
 * the same checksum and prefix rules as the rest of the SDK (and therefore
 * as the indexer and chain).
 */

import { z } from 'zod';
import {
  convertToBitBadgesAddress,
  getChainForAddress,
  isAddressValid
} from '../../../address-converter/converter.js';
import { SupportedChain } from '../../../common/types.js';

export const validateAddressSchema = z.object({
  address: z.string().describe('The address to validate')
});

export type ValidateAddressInput = z.infer<typeof validateAddressSchema>;

export interface ValidateAddressResult {
  success: boolean;
  valid: boolean;
  chain?: 'eth' | 'cosmos' | 'unknown';
  normalized?: string;
  details?: {
    prefix?: string;
    length?: number;
    format?: string;
  };
  error?: string;
}

export const validateAddressTool = {
  name: 'validate_address',
  description: 'Check if an address is valid and detect its chain type',
  inputSchema: {
    type: 'object' as const,
    properties: {
      address: {
        type: 'string',
        description: 'The address to validate'
      }
    },
    required: ['address']
  }
};

function chainLabel(chain: SupportedChain): 'eth' | 'cosmos' | 'unknown' {
  if (chain === SupportedChain.ETH) return 'eth';
  if (chain === SupportedChain.COSMOS) return 'cosmos';
  return 'unknown';
}

export function handleValidateAddress(input: ValidateAddressInput): ValidateAddressResult {
  try {
    const { address } = input;

    if (!address || address.trim() === '') {
      return {
        success: true,
        valid: false,
        chain: 'unknown',
        error: 'Address is empty'
      };
    }

    const chain = getChainForAddress(address);
    const chainName = chainLabel(chain);

    if (chain === SupportedChain.UNKNOWN) {
      return {
        success: true,
        valid: false,
        chain: 'unknown',
        details: {
          length: address.length,
          format: 'unknown'
        },
        error: 'Address format not recognized. Expected 0x... (ETH) or bb1... (BitBadges)'
      };
    }

    const valid = isAddressValid(address, chain);

    if (chain === SupportedChain.ETH) {
      return {
        success: true,
        valid,
        chain: chainName,
        normalized: valid ? address.toLowerCase() : undefined,
        details: {
          prefix: '0x',
          length: address.length,
          format: 'ethereum'
        }
      };
    }

    // COSMOS: derive canonical bb1 form via the SDK helper so `bbvaloper` and
    // other bb-prefixed addresses are normalized consistently.
    const canonical = valid ? convertToBitBadgesAddress(address) : '';
    const prefix = address.startsWith('bbvaloper') ? 'bbvaloper' : address.startsWith('bb') ? 'bb' : undefined;
    return {
      success: true,
      valid,
      chain: chainName,
      normalized: valid ? (canonical || address.toLowerCase()) : undefined,
      details: {
        prefix,
        length: address.length,
        format: 'bech32'
      }
    };
  } catch (error) {
    return {
      success: false,
      valid: false,
      error: `Failed to validate address: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
