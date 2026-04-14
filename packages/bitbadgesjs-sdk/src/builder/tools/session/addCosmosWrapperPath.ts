/**
 * add_cosmos_wrapper_path — Add a Cosmos coin wrapper path for wrapping tokens to ICS20.
 *
 * Cosmos Wrapper Paths create a 1:1 mapping between BitBadges tokens and a NEW ICS20 denom.
 * This mints/burns a custom-generated ICS20 denomination — NOT wrapping to an existing coin.
 *
 * Wrapping: Send tokens to wrapper address → tokens burned, ICS20 coins minted
 * Unwrapping: Send ICS20 coins back → coins burned, tokens minted
 *
 * This is an ADVANCED feature. Most use cases should use:
 * - Smart tokens (1:1 backed by existing USDC/ATOM) for IBC compatibility
 * - Liquidity pools for swappability
 * - coinTransfers for simple payments
 *
 * Wrapper paths are for cases like: use time-vesting logic → then wrap to ICS20 for IBC transfer.
 *
 * IMPORTANT: Approvals targeting the wrapper address must have allowSpecialWrapping: true
 * and mustPrioritize: true. The wrapper address is auto-generated from the denom.
 */

import { z } from 'zod';
import { addCosmosWrapperPath as addCosmosWrapperPathToSession, getOrCreateSession, getMsgPlaceholders } from '../../session/sessionState.js';

const VALID_CHARS = /^[a-zA-Z_{}-]+$/;

export const addCosmosWrapperPathSchema = z.object({
  sessionId: z.string().optional().describe("Session ID for per-request isolation."),
  creatorAddress: z.string().optional(),
  // Off-chain metadata for the path-level placeholder URI. Stored in the
  // session's metadataPlaceholders sidecar and referenced by metadata.uri.
  // The metadata auto-apply flow uploads the sidecar entries as off-chain
  // JSON and substitutes the placeholder URIs.
  pathName: z.string().optional().describe('Display name for this wrapper path (off-chain metadata).'),
  pathDescription: z.string().optional().describe('1-2 sentence description for this wrapper path (off-chain metadata).'),
  pathImage: z.string().optional().describe('Image URL or IMAGE_N placeholder for this wrapper path (off-chain metadata).'),
  denomUnitName: z.string().optional().describe('Display name for the default denom unit (off-chain).'),
  denomUnitDescription: z.string().optional().describe('Description for the default denom unit (off-chain).'),
  denomUnitImage: z.string().optional().describe('Image URL or IMAGE_N placeholder for the default denom unit (off-chain).'),
  wrapperPath: z.object({
    denom: z.string().describe('Custom denom for the wrapped ICS20 coin (e.g., "utoken", "uwrapped"). Must only contain a-zA-Z, _, {, }, -. This creates a NEW denom — do NOT use an existing IBC denom.'),
    symbol: z.string().describe('Symbol for the base unit. Usually same as denom.'),
    conversion: z.object({
      sideA: z.object({
        amount: z.string().describe('Amount of wrapped coin per conversion unit. Usually "1".')
      }),
      sideB: z.array(z.any()).describe('Balances[] defining which tokens participate. Each: { amount: "1", tokenIds: [{start,end}], ownershipTimes: [{start,end}] }.')
    }),
    denomUnits: z.array(z.object({
      decimals: z.string().describe('Display decimals for this unit (e.g., "6"). Min 1, max 18.'),
      symbol: z.string().describe('Display symbol (e.g., "TOKEN"). Must only contain a-zA-Z, _, {, }, -.'),
      isDefaultDisplay: z.boolean().optional().describe('Whether this is the default display unit.'),
      // PathMetadata only has { uri, customData }. Image/name/description
      // live inside the off-chain JSON at metadata.uri and are handled by
      // the metadata auto-apply flow.
      metadata: z.object({
        uri: z.string().optional().default(''),
        customData: z.string().optional().default('')
      }).optional()
    })).describe('Denomination units for display. At least one with isDefaultDisplay: true required.'),
    allowOverrideWithAnyValidToken: z.boolean().optional().default(false).describe('If true, users can choose any valid token ID to wrap. If false (default), must match exact tokenIds in conversion.'),
    // PathMetadata only has { uri, customData }. See note on denomUnits.
    metadata: z.object({
      uri: z.string().optional().default(''),
      customData: z.string().optional().default('')
    }).optional()
  })
});

export type AddCosmosWrapperPathInput = z.infer<typeof addCosmosWrapperPathSchema>;

export const addCosmosWrapperPathTool = {
  name: 'add_cosmos_wrapper_path',
  description: 'Add a Cosmos coin wrapper path for wrapping BitBadges tokens to a NEW ICS20 denomination. This mints/burns a custom ICS20 coin — NOT wrapping to an existing coin like USDC. ADVANCED: most use cases should use smart tokens (backed by existing coins), liquidity pools, or coinTransfers instead. Approvals for the wrapper address need allowSpecialWrapping: true and mustPrioritize: true. PathMetadata on-chain only has { uri, customData }; pass pathName / pathDescription / pathImage (and denomUnitName / Description / Image) as TOP-LEVEL params and they will be routed into the off-chain metadataPlaceholders sidecar.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      sessionId: { type: 'string', description: 'Session ID.' },
      creatorAddress: { type: 'string' },
      pathName: { type: 'string', description: 'Display name for the wrapper path. Stored off-chain in metadataPlaceholders.' },
      pathDescription: { type: 'string', description: '1-2 sentence description for the wrapper path. Off-chain.' },
      pathImage: { type: 'string', description: 'Image URL or IMAGE_N placeholder for the wrapper path. Off-chain.' },
      denomUnitName: { type: 'string', description: 'Display name for the default denom unit. Off-chain.' },
      denomUnitDescription: { type: 'string', description: 'Description for the default denom unit. Off-chain.' },
      denomUnitImage: { type: 'string', description: 'Image URL or IMAGE_N placeholder for the default denom unit. Off-chain.' },
      wrapperPath: {
        type: 'object',
        description: 'Wrapper path config. Denom creates a NEW ICS20 coin. Wrapper address is auto-generated from denom.',
        properties: {
          denom: { type: 'string', description: 'Custom denom (e.g., "utoken"). Creates NEW ICS20 coin — NOT an existing one. Must only contain a-zA-Z, _, {, }, -.' },
          symbol: { type: 'string', description: 'Base unit symbol. Usually same as denom.' },
          conversion: {
            type: 'object',
            description: 'Conversion between wrapped ICS20 coin and token.',
            properties: {
              sideA: {
                type: 'object',
                description: 'Wrapped ICS20 coin side.',
                properties: { amount: { type: 'string', description: 'Amount of wrapped coin per conversion unit. Usually "1".' } },
                required: ['amount']
              },
              sideB: {
                type: 'array',
                description: 'Token side. Array of Balance objects defining which tokens participate.',
                items: {
                  type: 'object',
                  properties: {
                    amount: { type: 'string', description: 'Token amount. Usually "1".' },
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
            description: 'Display units. At least one with isDefaultDisplay: true recommended.',
            items: {
              type: 'object',
              properties: {
                decimals: { type: 'string', description: 'Display decimals (e.g., "6"). Min 1, max 18.' },
                symbol: { type: 'string', description: 'Display symbol (e.g., "TOKEN"). Must only contain a-zA-Z, _, {, }, -.' },
                isDefaultDisplay: { type: 'boolean', description: 'Whether this is the default display unit.' },
                metadata: {
                  type: 'object',
                  description: 'PathMetadata — ONLY { uri, customData }. No image/name/description at this level.',
                  properties: {
                    uri: { type: 'string', description: 'Placeholder URI like "ipfs://METADATA_WRAPPER_<denom>_UNIT_<idx>". Substituted by the metadata auto-apply flow.' },
                    customData: { type: 'string' }
                  }
                }
              },
              required: ['decimals', 'symbol']
            }
          },
          allowOverrideWithAnyValidToken: { type: 'boolean', description: 'If true, users can choose any valid token ID to wrap. Default false.' },
          metadata: {
            type: 'object',
            description: 'Path-level PathMetadata — ONLY { uri, customData }. Image/name/description live inside the off-chain JSON at metadata.uri.',
            properties: {
              uri: { type: 'string', description: 'Placeholder URI like "ipfs://METADATA_WRAPPER_<denom>". Substituted by the metadata auto-apply flow.' },
              customData: { type: 'string' }
            }
          }
        },
        required: ['denom', 'symbol', 'conversion', 'denomUnits']
      }
    },
    required: ['wrapperPath']
  }
};

export function handleAddCosmosWrapperPath(input: AddCosmosWrapperPathInput) {
  const denom = input.wrapperPath.denom;
  const symbol = input.wrapperPath.symbol;

  // Validate denom and symbol characters
  if (denom.startsWith('ibc/')) {
    return { success: false, error: `Denom "${denom}" is an IBC denom. Wrapper paths create NEW denoms — use a custom symbol like "utoken" or "uwrapped".` };
  }
  if (!VALID_CHARS.test(denom)) {
    return { success: false, error: `Denom "${denom}" contains invalid characters. Only a-zA-Z, _, {, }, - are allowed.` };
  }
  if (symbol && !VALID_CHARS.test(symbol)) {
    return { success: false, error: `Symbol "${symbol}" contains invalid characters. Only a-zA-Z, _, {, }, - are allowed.` };
  }

  // PathMetadata only has { uri, customData }. Strip any inbound `image`
  // (or other invalid fields) and ensure every PathMetadata has a
  // placeholder uri the metadata auto-apply flow can substitute. Then
  // route off-chain metadata into the session's metadataPlaceholders
  // sidecar — NEVER onto the proto.
  let legacyPathImage: string | undefined;
  let legacyPathName: string | undefined;
  let legacyPathDescription: string | undefined;
  if (input.wrapperPath.metadata) {
    const { image, name, description, ...cleanPathMetadata } = input.wrapperPath.metadata as any;
    legacyPathImage = typeof image === 'string' ? image : undefined;
    legacyPathName = typeof name === 'string' ? name : undefined;
    legacyPathDescription = typeof description === 'string' ? description : undefined;
    input.wrapperPath.metadata = {
      uri: cleanPathMetadata.uri || `ipfs://METADATA_WRAPPER_${denom}`,
      customData: cleanPathMetadata.customData || ''
    };
  } else {
    input.wrapperPath.metadata = { uri: `ipfs://METADATA_WRAPPER_${denom}`, customData: '' };
  }
  const pathUri = input.wrapperPath.metadata!.uri as string;

  let defaultUnitUri: string | undefined;
  let legacyUnitImage: string | undefined;
  let legacyUnitName: string | undefined;
  let legacyUnitDescription: string | undefined;
  if (input.wrapperPath.denomUnits && Array.isArray(input.wrapperPath.denomUnits)) {
    input.wrapperPath.denomUnits = input.wrapperPath.denomUnits.map((unit: any, idx: number) => {
      if (!unit.metadata || typeof unit.metadata !== 'object') {
        unit.metadata = { uri: `ipfs://METADATA_WRAPPER_${denom}_UNIT_${idx}`, customData: '' };
      } else {
        const { image, name, description, ...cleanUnitMetadata } = unit.metadata as any;
        if (unit.isDefaultDisplay || idx === 0) {
          if (typeof image === 'string') legacyUnitImage = image;
          if (typeof name === 'string') legacyUnitName = name;
          if (typeof description === 'string') legacyUnitDescription = description;
        }
        unit.metadata = {
          uri: cleanUnitMetadata.uri || `ipfs://METADATA_WRAPPER_${denom}_UNIT_${idx}`,
          customData: cleanUnitMetadata.customData || ''
        };
      }
      if ((unit.isDefaultDisplay || idx === 0) && !defaultUnitUri) {
        defaultUnitUri = unit.metadata.uri;
      }
      return unit;
    });
  }

  const session = getOrCreateSession(input.sessionId, input.creatorAddress);
  addCosmosWrapperPathToSession(input.sessionId, input.wrapperPath);
  const placeholders = getMsgPlaceholders(session);

  const pathName = input.pathName ?? legacyPathName;
  const pathDescription = input.pathDescription ?? legacyPathDescription;
  const pathImage = input.pathImage ?? legacyPathImage;
  if (pathName || pathDescription || pathImage) {
    placeholders[pathUri] = {
      name: pathName || placeholders[pathUri]?.name || `${denom} wrapper path`,
      description: pathDescription || placeholders[pathUri]?.description || '',
      image: pathImage || placeholders[pathUri]?.image || ''
    };
  }
  const unitName = input.denomUnitName ?? legacyUnitName;
  const unitDescription = input.denomUnitDescription ?? legacyUnitDescription;
  const unitImage = input.denomUnitImage ?? legacyUnitImage;
  if (defaultUnitUri && (unitName || unitDescription || unitImage)) {
    placeholders[defaultUnitUri] = {
      name: unitName || placeholders[defaultUnitUri]?.name || `${denom} default unit`,
      description: unitDescription || placeholders[defaultUnitUri]?.description || '',
      image: unitImage || placeholders[defaultUnitUri]?.image || ''
    };
  }

  return {
    success: true,
    denom: input.wrapperPath.denom,
    note: 'Wrapper address is auto-generated from the denom. You must create approvals with allowSpecialWrapping: true and mustPrioritize: true targeting the wrapper address. Use generate_wrapper_address to get the address.'
  };
}
