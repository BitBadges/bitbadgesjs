/**
 * Tests for prompt assembly — buildSystemPrompt, fix prompt,
 * export prompt, cache boundaries on userContent.
 */

import {
  buildSystemPrompt,
  BUILDER_SYSTEM_PROMPT_FOR_EXPORT,
  DOMAIN_KNOWLEDGE,
  SECURITY_SECTION,
  WORKFLOW_NEW_BUILD,
  WORKFLOW_UPDATE,
  WORKFLOW_REFINEMENT,
  getSystemPromptHash,
  findMatchingErrorPatterns,
  buildFixPrompt,
  assemblePromptParts,
  assembleExportPrompt
} from './prompt.js';
import type { PromptContext } from './types.js';

// A small marker we can use to detect that the "Output Format" section only
// lives in the export prompt — the tool-calling prompts describe a different workflow.
const OUTPUT_FORMAT_HEADER = '## Output Format';

function baseCtx(overrides: Partial<PromptContext> = {}): PromptContext {
  return {
    creatorAddress: 'bb1test',
    prompt: 'make an NFT collection',
    selectedSkills: [],
    promptSkillIds: [],
    isRefinement: false,
    isUpdate: false,
    ...overrides
  };
}

describe('buildSystemPrompt', () => {
  it('create mode returns a string with the new-build workflow + security + domain knowledge', () => {
    const sys = buildSystemPrompt('create');
    expect(typeof sys).toBe('string');
    expect(sys).toContain(SECURITY_SECTION);
    expect(sys).toContain(DOMAIN_KNOWLEDGE);
    expect(sys).toContain(WORKFLOW_NEW_BUILD);
    expect(sys).toContain('BitBadges AI Builder');
    // Create-mode intro text
    expect(sys).toContain('construct token collections');
  });

  it('update mode swaps in the update workflow', () => {
    const sys = buildSystemPrompt('update');
    expect(sys).toContain(WORKFLOW_UPDATE);
    expect(sys).toContain(SECURITY_SECTION);
    expect(sys).toContain(DOMAIN_KNOWLEDGE);
    // Update intro
    expect(sys).toContain('editing an existing on-chain collection');
    // Update mode should NOT include the other workflows' unique steps.
    expect(sys).not.toContain(WORKFLOW_NEW_BUILD);
    expect(sys).not.toContain(WORKFLOW_REFINEMENT);
  });

  it('refine mode swaps in the refinement workflow', () => {
    const sys = buildSystemPrompt('refine');
    expect(sys).toContain(WORKFLOW_REFINEMENT);
    expect(sys).toContain('refining a collection that was already built');
  });

  it('create mode does NOT contain the update/refine intros', () => {
    const sys = buildSystemPrompt('create');
    expect(sys).not.toContain('editing an existing on-chain collection');
    expect(sys).not.toContain('refining a collection that was already built');
  });

  it('none of the tool-calling system prompts include the Output Format section', () => {
    for (const mode of ['create', 'update', 'refine'] as const) {
      const sys = buildSystemPrompt(mode);
      expect(sys).not.toContain(OUTPUT_FORMAT_HEADER);
    }
  });
});

describe('BUILDER_SYSTEM_PROMPT_FOR_EXPORT', () => {
  it('contains the Output Format section', () => {
    expect(BUILDER_SYSTEM_PROMPT_FOR_EXPORT).toContain(OUTPUT_FORMAT_HEADER);
  });

  it('matches DOMAIN_KNOWLEDGE', () => {
    expect(BUILDER_SYSTEM_PROMPT_FOR_EXPORT).toContain(DOMAIN_KNOWLEDGE);
  });

  it('contains the security section too', () => {
    expect(BUILDER_SYSTEM_PROMPT_FOR_EXPORT).toContain(SECURITY_SECTION);
  });
});

describe('getSystemPromptHash', () => {
  it('is 12 hex chars', () => {
    const h = getSystemPromptHash('some system prompt');
    expect(h).toMatch(/^[0-9a-f]{12}$/);
  });

  it('is deterministic across calls', () => {
    const a = getSystemPromptHash('deterministic');
    const b = getSystemPromptHash('deterministic');
    expect(a).toBe(b);
  });

  it('different input → different hash (usually)', () => {
    const a = getSystemPromptHash('foo');
    const b = getSystemPromptHash('bar');
    expect(a).not.toBe(b);
  });

  it('handles empty string', () => {
    const h = getSystemPromptHash('');
    expect(h).toMatch(/^[0-9a-f]{12}$/);
  });
});

describe('findMatchingErrorPatterns', () => {
  it('matches "insufficient balance" to ≥1 pattern', () => {
    const matches = findMatchingErrorPatterns('insufficient balance on account');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('case-insensitive matching', () => {
    const lower = findMatchingErrorPatterns('insufficient balance');
    const upper = findMatchingErrorPatterns('INSUFFICIENT BALANCE');
    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBeGreaterThan(0);
  });

  it('empty input returns empty array', () => {
    expect(findMatchingErrorPatterns('')).toEqual([]);
  });

  it('no-match input returns empty array', () => {
    // A string that shouldn't trigger any pattern
    expect(findMatchingErrorPatterns('zzzz no real error zzzz').length).toBe(0);
  });
});

describe('buildFixPrompt', () => {
  it('contains the error list, fix attempt header, and guidance sections', () => {
    const errors = ['insufficient balance', 'UintRange missing start'];
    const advisory: string[] = [];
    const out = buildFixPrompt(errors, advisory, 1, 3);

    expect(out).toContain('fix attempt 1/3');
    expect(out).toContain('insufficient balance');
    expect(out).toContain('UintRange missing start');
    expect(out).toContain('Known fixes'); // from the error-pattern registry
    expect(out).toContain('validate_transaction');
    expect(out).toContain('simulate_transaction');
  });

  it('omits the advisory section when advisoryNotes is empty', () => {
    const out = buildFixPrompt(['insufficient balance'], [], 2, 3);
    expect(out).not.toContain('Advisory findings');
  });

  it('includes advisory section when advisoryNotes has entries', () => {
    const out = buildFixPrompt(['insufficient balance'], ['consider locking approvals'], 2, 3);
    expect(out).toContain('Advisory findings');
    expect(out).toContain('consider locking approvals');
  });
});

describe('assemblePromptParts', () => {
  it('create mode with no skills returns 1 user content block (no cache)', async () => {
    const parts = await assemblePromptParts(baseCtx());
    expect(parts.userContent.length).toBe(1);
    expect(parts.userContent[0].cache_control).toBeUndefined();
    expect(parts.userContent[0].text.length).toBeGreaterThan(0);
    expect(parts.communitySkillsIncluded).toEqual([]);
  });

  it('create mode with selectedSkills returns 2 blocks with cache_control on the first', async () => {
    const parts = await assemblePromptParts(baseCtx({ selectedSkills: ['nft-collection'] }));
    expect(parts.userContent.length).toBe(2);
    expect(parts.userContent[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(parts.userContent[1].cache_control).toBeUndefined();
    // First block should contain the skill content
    expect(parts.userContent[0].text).toContain('nft-collection');
  });

  it('skill ordering is canonicalized (sorted) regardless of input order', async () => {
    const a = await assemblePromptParts(baseCtx({ selectedSkills: ['nft-collection', 'fungible-token'] }));
    const b = await assemblePromptParts(baseCtx({ selectedSkills: ['fungible-token', 'nft-collection'] }));
    expect(a.userContent[0].text).toBe(b.userContent[0].text);
    // dynamicTail also contains the sorted skills list in the header
    expect(a.userContent[1].text).toBe(b.userContent[1].text);
    // Sorted — fungible-token before nft-collection alphabetically
    const idxF = a.userContent[0].text.indexOf('fungible-token');
    const idxN = a.userContent[0].text.indexOf('nft-collection');
    expect(idxF).toBeGreaterThanOrEqual(0);
    expect(idxN).toBeGreaterThan(idxF);
  });

  it('returns a systemPrompt appropriate to the mode', async () => {
    const create = await assemblePromptParts(baseCtx());
    expect(create.systemPrompt).toContain(WORKFLOW_NEW_BUILD);

    const update = await assemblePromptParts(baseCtx({ isUpdate: true, existingCollectionId: '1' }));
    expect(update.systemPrompt).toContain(WORKFLOW_UPDATE);

    const refine = await assemblePromptParts(baseCtx({ isRefinement: true }));
    expect(refine.systemPrompt).toContain(WORKFLOW_REFINEMENT);
  });

  it('userMessage is non-empty', async () => {
    const parts = await assemblePromptParts(baseCtx());
    expect(parts.userMessage.length).toBeGreaterThan(0);
    expect(parts.userMessage).toContain('make an NFT collection');
  });
});

describe('assembleExportPrompt', () => {
  it('returns { prompt, communitySkillsIncluded }', async () => {
    const result = await assembleExportPrompt(baseCtx());
    expect(result).toHaveProperty('prompt');
    expect(result).toHaveProperty('communitySkillsIncluded');
    expect(Array.isArray(result.communitySkillsIncluded)).toBe(true);
  });

  it('prompt contains both the export system prompt AND the user request', async () => {
    const result = await assembleExportPrompt(baseCtx({ prompt: 'mint 100 quest tokens' }));
    expect(result.prompt).toContain(OUTPUT_FORMAT_HEADER);
    expect(result.prompt).toContain('mint 100 quest tokens');
  });

  it('export prompt contains the full Output Format spec', async () => {
    const result = await assembleExportPrompt(baseCtx());
    expect(result.prompt).toContain(OUTPUT_FORMAT_HEADER);
    expect(result.prompt).toContain('metadataPlaceholders');
  });
});
