/**
 * Tool: convert_address
 * Convert between ETH (0x) and BitBadges (bb1) address formats.
 *
 * Thin wrapper over the SDK's canonical address helpers in
 * `src/address-converter/converter.ts`. Do not reimplement bech32 here —
 * keeping one source of truth guarantees the MCP tool agrees with the rest
 * of the SDK (and therefore with the indexer and chain) on checksum rules,
 * aliases (`Mint`), and `bbvaloper` handling.
 */

import { z } from 'zod';
import { convertToBitBadgesAddress, convertToEthAddress, getChainForAddress } from '../../../address-converter/converter.js';
import { SupportedChain } from '../../../common/types.js';

export const convertAddressSchema = z.object({
  address: z.string().describe('The address to convert (0x... or bb1...)'),
  targetFormat: z.enum(['eth', 'bitbadges']).optional().describe('Target format: "eth" for 0x or "bitbadges" for bb1. Auto-detected if omitted.')
});

export type ConvertAddressInput = z.infer<typeof convertAddressSchema>;

export interface ConvertAddressResult {
  success: boolean;
  originalAddress?: string;
  convertedAddress?: string;
  originalFormat?: string;
  targetFormat?: string;
  error?: string;
}

export const convertAddressTool = {
  name: 'convert_address',
  description: 'Convert between ETH (0x) and BitBadges (bb1) address formats',
  inputSchema: {
    type: 'object' as const,
    properties: {
      address: {
        type: 'string',
        description: 'The address to convert (0x... or bb1...)'
      },
      targetFormat: {
        type: 'string',
        enum: ['eth', 'bitbadges'],
        description: 'Target format: "eth" for 0x or "bitbadges" for bb1'
      }
    },
    required: ['address']
  }
};

function chainToFormat(chain: SupportedChain): 'eth' | 'bitbadges' | 'unknown' {
  if (chain === SupportedChain.ETH) return 'eth';
  if (chain === SupportedChain.COSMOS) return 'bitbadges';
  return 'unknown';
}

export function handleConvertAddress(input: ConvertAddressInput): ConvertAddressResult {
  try {
    const { address } = input;

    const chain = getChainForAddress(address);
    const sourceFormat = chainToFormat(chain);

    if (sourceFormat === 'unknown') {
      return {
        success: false,
        error: `Unknown address format: "${address}". Expected 0x... (ETH) or bb1... (BitBadges)`
      };
    }

    const targetFormat = input.targetFormat ?? (sourceFormat === 'eth' ? 'bitbadges' : 'eth');

    const converted = targetFormat === 'eth' ? convertToEthAddress(address) : convertToBitBadgesAddress(address);

    if (!converted) {
      return {
        success: false,
        error: `Failed to convert address "${address}" to ${targetFormat}. Check format and checksum.`
      };
    }

    return {
      success: true,
      originalAddress: address,
      convertedAddress: converted,
      originalFormat: sourceFormat,
      targetFormat
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to convert address: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
