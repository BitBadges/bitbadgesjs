import { z } from 'zod';
import { addAliasPath as addAliasPathToSession, getOrCreateSession } from '../../session/sessionState.js';

export const addAliasPathSchema = z.object({
  sessionId: z.string().optional().describe("Session ID for per-request isolation."),
  creatorAddress: z.string().optional(),
  aliasPath: z.object({
    denom: z.string().describe('Base denom symbol (e.g., "uvatom", "uwusdc"). Must only contain a-zA-Z, _, {, }, -. NEVER use raw IBC denom (ibc/...).'),
    symbol: z.string().describe('Same as denom for the base unit.'),
    conversion: z.object({
      sideA: z.object({ amount: z.string() }).describe('IBC coin side. Usually {"amount":"1"}.'),
      sideB: z.array(z.any()).describe('Token side. Usually [{"amount":"1","tokenIds":[{"start":"1","end":"1"}],"ownershipTimes":[{"start":"1","end":"max"}]}].')
    }),
    denomUnits: z.array(z.object({
      decimals: z.string().describe('Decimal places as string. Must match IBC denom decimals (e.g., "6" for ATOM/USDC).'),
      symbol: z.string().describe('Display symbol (e.g., "vATOM", "wUSDC"). Do NOT reuse reserved symbols.'),
      isDefaultDisplay: z.boolean().optional(),
      // PathMetadata only has { uri, customData }. Do NOT add an image
      // field here — images live inside the off-chain JSON at metadata.uri
      // and are handled by the metadata auto-apply flow.
      metadata: z.object({
        uri: z.string().optional().default(''),
        customData: z.string().optional().default('')
      }).optional()
    })).describe('Display units with decimals > 0 ONLY. Base decimals (0) is implicit.'),
    // PathMetadata only has { uri, customData }. See note on denomUnits.
    metadata: z.object({
      uri: z.string().optional().default(''),
      customData: z.string().optional().default('')
    }).optional()
  })
});

export type AddAliasPathInput = z.infer<typeof addAliasPathSchema>;

export const addAliasPathTool = {
  name: 'add_alias_path',
  description: 'Add an alias path for ICS20-backed tokens or liquidity pools. Required for smart tokens. Decimals must match the IBC denom decimals. PathMetadata only has { uri, customData }; set uri to a placeholder like "ipfs://METADATA_ALIAS_<denom>" and put the image/name/description inside the off-chain JSON (the metadata auto-apply flow handles substitution).',
  inputSchema: {
    type: 'object' as const,
    properties: {
      sessionId: { type: 'string', description: 'Session ID.' },
      creatorAddress: { type: 'string' },
      aliasPath: {
        type: 'object',
        description: 'Alias path configuration for ICS20-backed tokens.',
        properties: {
          denom: { type: 'string', description: 'Base denom symbol (e.g., "uvatom", "uwusdc"). Must only contain a-zA-Z, _, {, }. NEVER use raw IBC denom (ibc/...).' },
          symbol: { type: 'string', description: 'Same as denom for the base unit.' },
          conversion: {
            type: 'object',
            description: 'Conversion between IBC coin and token.',
            properties: {
              sideA: {
                type: 'object',
                description: 'IBC coin side.',
                properties: { amount: { type: 'string', description: 'Amount of IBC coin per conversion unit. Usually "1".' } },
                required: ['amount']
              },
              sideB: {
                type: 'array',
                description: 'Token side. Array of Balance objects.',
                items: {
                  type: 'object',
                  properties: {
                    amount: { type: 'string', description: 'Token amount per conversion. Usually "1".' },
                    tokenIds: { type: 'array', items: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' } }, required: ['start', 'end'] } },
                    ownershipTimes: { type: 'array', items: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' } }, required: ['start', 'end'] }, description: 'Usually FOREVER: [{"start":"1","end":"18446744073709551615"}]' }
                  },
                  required: ['amount', 'tokenIds', 'ownershipTimes']
                }
              }
            },
            required: ['sideA', 'sideB']
          },
          denomUnits: {
            type: 'array',
            description: 'Display units with decimals > 0 ONLY. Base decimals (0) is implicit.',
            items: {
              type: 'object',
              properties: {
                decimals: { type: 'string', description: 'Decimal places as string. Must match IBC denom decimals (e.g., "6" for ATOM/USDC).' },
                symbol: { type: 'string', description: 'Display symbol (e.g., "vATOM", "wUSDC"). Do NOT reuse reserved symbols.' },
                isDefaultDisplay: { type: 'boolean', description: 'Whether this is the default display unit.' },
                metadata: {
                  type: 'object',
                  description: 'PathMetadata — ONLY { uri, customData }. No image/name/description at this level.',
                  properties: {
                    uri: { type: 'string', description: 'Placeholder URI like "ipfs://METADATA_ALIAS_<denom>_UNIT_<idx>". The metadata auto-apply flow substitutes real URIs after the off-chain JSON (with image/name/description) is uploaded.' },
                    customData: { type: 'string' }
                  }
                }
              },
              required: ['decimals', 'symbol']
            }
          },
          metadata: {
            type: 'object',
            description: 'Path-level PathMetadata — ONLY { uri, customData }. The image/name/description live inside the off-chain JSON at metadata.uri, not on this proto.',
            properties: {
              uri: { type: 'string', description: 'Placeholder URI like "ipfs://METADATA_ALIAS_<denom>". Substituted by the metadata auto-apply flow.' },
              customData: { type: 'string' }
            }
          }
        },
        required: ['denom', 'symbol', 'conversion', 'denomUnits']
      }
    },
    required: ['aliasPath']
  }
};

export function handleAddAliasPath(input: AddAliasPathInput) {
  // Validate denom and symbol characters
  const VALID_CHARS = /^[a-zA-Z_{}-]+$/;
  const denom = input.aliasPath.denom;
  const symbol = input.aliasPath.symbol;

  if (denom.startsWith('ibc/')) {
    return { success: false, error: `Denom "${denom}" is a raw IBC denom. Use a short symbol like "wuusdc" or "uvault" instead.` };
  }
  if (!VALID_CHARS.test(denom)) {
    return { success: false, error: `Denom "${denom}" contains invalid characters. Only a-zA-Z, _, {, }, - are allowed.` };
  }
  if (symbol && !VALID_CHARS.test(symbol)) {
    return { success: false, error: `Symbol "${symbol}" contains invalid characters. Only a-zA-Z, _, {, }, - are allowed.` };
  }

  // PathMetadata only has { uri, customData }. An `image` field at this
  // level is invalid proto. Strip it from the incoming alias path and
  // from each denomUnit, and ensure every PathMetadata has a placeholder
  // uri the metadata auto-apply flow can substitute. The image the caller
  // passed belongs inside the off-chain JSON at that uri, not on the proto.
  if (input.aliasPath.metadata) {
    const { image: _ignoreImage, ...cleanPathMetadata } = input.aliasPath.metadata as any;
    input.aliasPath.metadata = {
      uri: cleanPathMetadata.uri || `ipfs://METADATA_ALIAS_${denom}`,
      customData: cleanPathMetadata.customData || ''
    };
    void _ignoreImage;
  } else {
    input.aliasPath.metadata = { uri: `ipfs://METADATA_ALIAS_${denom}`, customData: '' };
  }

  if (input.aliasPath.denomUnits && Array.isArray(input.aliasPath.denomUnits)) {
    input.aliasPath.denomUnits = input.aliasPath.denomUnits.map((unit: any, idx: number) => {
      if (!unit.metadata || typeof unit.metadata !== 'object') {
        unit.metadata = { uri: `ipfs://METADATA_ALIAS_${denom}_UNIT_${idx}`, customData: '' };
        return unit;
      }
      const { image: _dropImage, ...cleanUnitMetadata } = unit.metadata as any;
      unit.metadata = {
        uri: cleanUnitMetadata.uri || `ipfs://METADATA_ALIAS_${denom}_UNIT_${idx}`,
        customData: cleanUnitMetadata.customData || ''
      };
      void _dropImage;
      return unit;
    });
  }

  getOrCreateSession(input.sessionId, input.creatorAddress);
  addAliasPathToSession(input.sessionId, input.aliasPath);
  return { success: true, denom: input.aliasPath.denom };
}
