import { z } from 'zod';
import {
  generatePlaceholderArt,
  type PlaceholderArtStyle,
  type PlaceholderArtVibe
} from '../../generators/placeholder-art/index.js';

const STYLE_VALUES = [
  'auto',
  'gradient-mono',
  'geometric-tile',
  'letterform',
  'orbital',
  'mesh',
  'glyph'
] as const;

const VIBE_VALUES = ['playful', 'serious', 'tech', 'organic'] as const;

export const generatePlaceholderArtSchema = z.object({
  seed: z
    .string()
    .describe(
      'Deterministic seed — usually the asset name (e.g. "Premium Membership"). Same seed + options always produces the same art.'
    ),
  style: z
    .enum(STYLE_VALUES)
    .optional()
    .describe(
      'Visual style. "auto" (default) picks from the seed hash, optionally biased by `vibe`. Others pin a specific preset.'
    ),
  symbol: z
    .string()
    .max(3)
    .optional()
    .describe(
      'Up to 3-character monogram to overlay (presets that use one). Omit to derive initials from the seed.'
    ),
  vibe: z
    .enum(VIBE_VALUES)
    .optional()
    .describe(
      'Optional stylistic bias used when `style === "auto"`. Ignored if an explicit style is set.'
    ),
  paletteName: z
    .string()
    .optional()
    .describe('Pin a specific palette by name (e.g. "emerald"). Omit to hash-pick.')
});

export type GeneratePlaceholderArtToolInput = z.infer<typeof generatePlaceholderArtSchema>;

export const generatePlaceholderArtTool = {
  name: 'generate_placeholder_art',
  description:
    'Generate a deterministic SVG placeholder image as a data: URI. Use when the user has NOT supplied an image for the asset — drop the returned `imageUri` directly into the `image` field of set_collection_metadata / set_token_metadata / alias path helpers. Do NOT wrap the URI in IMAGE_N — it IS the final value. Prefer calling this over using the BitBadges default logo for unnamed assets.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      seed: {
        type: 'string',
        description: 'Deterministic seed — usually the asset name.'
      },
      style: {
        type: 'string',
        enum: STYLE_VALUES as unknown as string[],
        description:
          '"auto" (default) picks via hash + vibe. Others pin a specific preset.'
      },
      symbol: {
        type: 'string',
        maxLength: 3,
        description: 'Up to 3-character monogram overlay. Omit to derive from seed.'
      },
      vibe: {
        type: 'string',
        enum: VIBE_VALUES as unknown as string[],
        description: 'Auto-style bias: playful | serious | tech | organic.'
      },
      paletteName: {
        type: 'string',
        description: 'Pin a named palette (e.g. "emerald"). Omit to hash-pick.'
      }
    },
    required: ['seed']
  }
};

export function handleGeneratePlaceholderArt(input: GeneratePlaceholderArtToolInput) {
  const result = generatePlaceholderArt({
    seed: input.seed,
    style: input.style as PlaceholderArtStyle | undefined,
    symbol: input.symbol,
    vibe: input.vibe as PlaceholderArtVibe | undefined,
    paletteName: input.paletteName
  });
  // Intentionally omit `svg` from the tool result — the minified SVG
  // is ~1-2 KB of noise in the LLM's context. The agent only needs
  // `imageUri` to proceed.
  return {
    success: true,
    imageUri: result.imageUri,
    style: result.style,
    palette: result.palette.name,
    symbol: result.symbol,
    bytes: result.bytes
  };
}
