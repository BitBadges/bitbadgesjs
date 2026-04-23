import { z } from 'zod';
import { addAliasPath as addAliasPathToSession, getOrCreateSession, getMsgPlaceholders } from '../../session/sessionState.js';

export const addAliasPathSchema = z.object({
  sessionId: z.string().optional().describe("Session ID for per-request isolation."),
  creatorAddress: z.string().optional(),
  // Off-chain metadata for the path-level placeholder URI. These are stored
  // in the session's metadataPlaceholders sidecar (NOT on the proto) and
  // referenced by metadata.uri. The metadata auto-apply flow uploads the
  // sidecar entries as off-chain JSON and substitutes the placeholder URIs.
  pathName: z.string().optional().describe('Display name for this alias path (off-chain metadata). Stored in metadataPlaceholders sidecar.'),
  pathDescription: z.string().optional().describe('1-2 sentence description for this alias path (off-chain metadata).'),
  pathImage: z.string().optional().describe('Image value for this alias path (off-chain metadata). Accepts IMAGE_N, https://, ipfs://, or data:image/svg+xml;base64,... (from generate_placeholder_art). Reusing the collection image here is fine.'),
  // Optional per-denomUnit display content. Indexed by unit position. Same
  // routing — sidecar only, not the proto.
  denomUnitName: z.string().optional().describe('Display name for the default denom unit (off-chain).'),
  denomUnitDescription: z.string().optional().describe('Description for the default denom unit (off-chain).'),
  denomUnitImage: z.string().optional().describe('Image value for the default denom unit (off-chain). Accepts IMAGE_N, https://, ipfs://, or data:image/svg+xml;base64,... (from generate_placeholder_art). Reusing the collection image here is fine.'),
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
  description: 'Add an alias path for ICS20-backed tokens or liquidity pools. Required for smart tokens. Decimals must match the IBC denom decimals. PathMetadata on-chain only has { uri, customData }; pass pathName / pathDescription / pathImage (and denomUnitName / Description / Image) as TOP-LEVEL params and they will be routed into the off-chain metadataPlaceholders sidecar keyed by an auto-generated placeholder URI.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      sessionId: { type: 'string', description: 'Session ID.' },
      creatorAddress: { type: 'string' },
      pathName: { type: 'string', description: 'Display name for the alias path. Stored off-chain in metadataPlaceholders.' },
      pathDescription: { type: 'string', description: '1-2 sentence description for the alias path. Off-chain.' },
      pathImage: { type: 'string', description: 'Image URL or IMAGE_N placeholder for the alias path. Off-chain.' },
      denomUnitName: { type: 'string', description: 'Display name for the default denom unit. Off-chain.' },
      denomUnitDescription: { type: 'string', description: 'Description for the default denom unit. Off-chain.' },
      denomUnitImage: { type: 'string', description: 'Image URL or IMAGE_N placeholder for the default denom unit. Off-chain.' },
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
  // Chain iterates `for _, denomUnit := range path.DenomUnits` and rejects
  // any entry with decimals.IsZero() — "denom unit decimals cannot be 0".
  // An EMPTY denomUnits[] is valid (loop body never runs) and means "only
  // the base denom/symbol with 0 implicit decimals, no display units."
  // Catch explicit zero-decimal entries locally so the LLM sees a clear
  // actionable message instead of a chain-level 500 that burns a retry.
  const denomUnits = input.aliasPath.denomUnits;
  if (Array.isArray(denomUnits)) {
    for (const [idx, unit] of denomUnits.entries()) {
      const dec = (unit as any)?.decimals;
      if (dec === undefined || dec === null || String(dec) === '0' || String(dec) === '') {
        return {
          success: false,
          error: `denomUnits[${idx}].decimals must be > 0 (got "${dec}"). Base decimals (0) is implicit in denom/symbol — don't add a denomUnit entry for it. To declare a display unit, pick an exponent like "6" for fungible tokens. To skip display units entirely, pass denomUnits: [].`
        };
      }
    }
  }

  // PathMetadata only has { uri, customData }. An `image` field at this
  // level is invalid proto. Strip any inbound `image` field and ensure
  // every PathMetadata has a placeholder uri the metadata auto-apply flow
  // can substitute. We then route any image/name/description the caller
  // passed (either via the new top-level params or, defensively, via the
  // legacy nested-on-metadata shape) into the session's metadataPlaceholders
  // sidecar. Nothing about the image goes onto the on-chain proto.
  let legacyPathImage: string | undefined;
  let legacyPathName: string | undefined;
  let legacyPathDescription: string | undefined;
  if (input.aliasPath.metadata) {
    const { image, name, description, ...cleanPathMetadata } = input.aliasPath.metadata as any;
    legacyPathImage = typeof image === 'string' ? image : undefined;
    legacyPathName = typeof name === 'string' ? name : undefined;
    legacyPathDescription = typeof description === 'string' ? description : undefined;
    input.aliasPath.metadata = {
      uri: cleanPathMetadata.uri || `ipfs://METADATA_ALIAS_${denom}`,
      customData: cleanPathMetadata.customData || ''
    };
  } else {
    input.aliasPath.metadata = { uri: `ipfs://METADATA_ALIAS_${denom}`, customData: '' };
  }
  const pathUri = input.aliasPath.metadata!.uri as string;

  // Track the default denom unit URI so we can attach off-chain metadata to
  // the right placeholder.
  let defaultUnitUri: string | undefined;
  let legacyUnitImage: string | undefined;
  let legacyUnitName: string | undefined;
  let legacyUnitDescription: string | undefined;
  if (input.aliasPath.denomUnits && Array.isArray(input.aliasPath.denomUnits)) {
    input.aliasPath.denomUnits = input.aliasPath.denomUnits.map((unit: any, idx: number) => {
      if (!unit.metadata || typeof unit.metadata !== 'object') {
        unit.metadata = { uri: `ipfs://METADATA_ALIAS_${denom}_UNIT_${idx}`, customData: '' };
      } else {
        const { image, name, description, ...cleanUnitMetadata } = unit.metadata as any;
        if (unit.isDefaultDisplay || idx === 0) {
          if (typeof image === 'string') legacyUnitImage = image;
          if (typeof name === 'string') legacyUnitName = name;
          if (typeof description === 'string') legacyUnitDescription = description;
        }
        unit.metadata = {
          uri: cleanUnitMetadata.uri || `ipfs://METADATA_ALIAS_${denom}_UNIT_${idx}`,
          customData: cleanUnitMetadata.customData || ''
        };
      }
      if ((unit.isDefaultDisplay || idx === 0) && !defaultUnitUri) {
        defaultUnitUri = unit.metadata.uri;
      }
      return unit;
    });
  }

  // Persist the alias path itself into session state.
  const session = getOrCreateSession(input.sessionId, input.creatorAddress);
  addAliasPathToSession(input.sessionId, input.aliasPath);
  const placeholders = getMsgPlaceholders(session);

  // Route off-chain metadata into the per-msg metadataPlaceholders sidecar
  // at `messages[0].value._meta.metadataPlaceholders`. Top-level params
  // win over legacy nested-on-metadata fields if both are set.
  const pathName = input.pathName ?? legacyPathName;
  const pathDescription = input.pathDescription ?? legacyPathDescription;
  const pathImage = input.pathImage ?? legacyPathImage;
  if (pathName || pathDescription || pathImage) {
    placeholders[pathUri] = {
      name: pathName || placeholders[pathUri]?.name || `${denom} alias path`,
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

  return { success: true, denom: input.aliasPath.denom };
}
