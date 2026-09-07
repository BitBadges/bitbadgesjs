import { z } from 'zod';
import { setCollectionMetadata as setCollectionMetadataInSession, getOrCreateSession } from '../../session/sessionState.js';

export const setCollectionMetadataSchema = z.object({
  sessionId: z.string().optional().describe("Session ID for per-request isolation."),
  creatorAddress: z.string().optional(),
  name: z.string().describe('Collection name. Must be specific and user-facing (e.g., "Premium Membership", "5 ATOM Monthly Subscription").'),
  description: z.string().describe('Collection description. 1-2 sentences, specific, ends with a period.'),
  image: z.string().describe('Image. Leave it as an empty string "" when the user gave you no art — get_transaction fills blanks with a deterministic SVG seeded by the collection name. Otherwise: IMAGE_N (only if the request listed IMAGE_N placeholders), an https:// URL, an ipfs:// URI, or a data:image/... URI.')
});

export type SetCollectionMetadataInput = z.infer<typeof setCollectionMetadataSchema>;

export const setCollectionMetadataTool = {
  name: 'set_collection_metadata',
  description: 'Set collection metadata (name, description, image). Auto-creates a metadata placeholder URI. Names and descriptions must be specific and user-facing.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      sessionId: { type: 'string', description: 'Session ID.' },
      creatorAddress: { type: 'string' },
      name: { type: 'string', description: 'Collection name. Specific and user-facing.' },
      description: { type: 'string', description: '1-2 sentences, ends with period.' },
      image: { type: 'string', allowEmpty: true, description: 'Image. Leave it as an empty string "" when the user gave you no art — get_transaction fills blanks with a deterministic SVG seeded by the collection name. Otherwise: IMAGE_N (only if the request listed IMAGE_N placeholders), an https:// URL, an ipfs:// URI, or a data:image/... URI.' }
    },
    required: ['name', 'description', 'image']
  }
};

export function handleSetCollectionMetadata(input: SetCollectionMetadataInput) {
  getOrCreateSession(input.sessionId, input.creatorAddress);
  setCollectionMetadataInSession(input.sessionId, input.name, input.description, input.image);
  return { success: true };
}
