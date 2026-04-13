/**
 * Tests for the centralized tool dispatch in `callTool` — specifically the
 * pre-flight argument validator and the Zod-error formatter that round 4
 * added to catch LLM-agent footguns:
 *
 *   - missing required field → handler crashes with "Cannot read properties
 *     of undefined" instead of "Missing required field 'X'"
 *   - typo'd arg key → handler silently treats as missing, agent thinks
 *     the call succeeded but state never got set
 *   - Zod errors → raw JSON dump that's hard for both humans and LLMs to
 *     parse
 *
 * The validator is generic — it walks the tool's JSON Schema `inputSchema`
 * and uses `required` + `additionalProperties: false`. Tests below exercise
 * a representative sample of real registered tools rather than mocks, so
 * any wiring drift surfaces here.
 */

import { callTool, toolRegistry } from './registry.js';

describe('callTool — pre-flight arg validation', () => {
  describe('missing required field', () => {
    it('generate_unique_id with no prefix → friendly error, not "undefined_xxx"', async () => {
      const res = await callTool('generate_unique_id', {});
      expect(res.isError).toBe(true);
      expect(res.text).toMatch(/Missing required field/);
      expect(res.text).toMatch(/prefix/);
      expect(res.result).toBeNull();
    });

    it('generate_unique_id with empty-string prefix → rejected (not "undefined_xxx")', async () => {
      const res = await callTool('generate_unique_id', { prefix: '' });
      expect(res.isError).toBe(true);
      expect(res.text).toMatch(/Missing required field/);
    });

    it('query_balance with no args → friendly error listing both required fields', async () => {
      const res = await callTool('query_balance', {});
      expect(res.isError).toBe(true);
      expect(res.text).toMatch(/Missing required fields?/);
      expect(res.text).toMatch(/collectionId/);
      expect(res.text).toMatch(/address/);
    });

    it('query_balance with one of two required → flags the missing one in the "Missing:" line', async () => {
      const res = await callTool('query_balance', { collectionId: '42' });
      expect(res.isError).toBe(true);
      // The error message has two parts: "Missing required field: address."
      // and "Expected: collectionId, address" (full required list). Check
      // that `address` shows up in the missing list.
      expect(res.text).toMatch(/Missing required field: address/);
    });

    it('set_valid_token_ids with sessionId only → flags missing tokenIds', async () => {
      const res = await callTool('set_valid_token_ids', { sessionId: 'spec-test' });
      expect(res.isError).toBe(true);
      expect(res.text).toMatch(/tokenIds/);
    });

    it('set_valid_token_ids with truly-wrong key → catches via missing-required path', async () => {
      // LLM agents typo arg names; the validator should refuse the call
      // before the handler crashes / silently succeeds.
      const res = await callTool('set_valid_token_ids', {
        sessionId: 'spec-test',
        badgeIds: [{ start: '1', end: '10' }] // wrong key
      });
      expect(res.isError).toBe(true);
      expect(res.text).toMatch(/tokenIds/);
    });
  });

  describe('unknown tool', () => {
    it('returns isError without crashing', async () => {
      const res = await callTool('totally_fake_tool_xxx', { foo: 'bar' });
      expect(res.isError).toBe(true);
      expect(res.text).toMatch(/Unknown tool/);
      expect(res.result).toBeNull();
    });
  });

  describe('happy path', () => {
    it('get_current_timestamp with no args → succeeds (no required fields)', async () => {
      const res = await callTool('get_current_timestamp', {});
      expect(res.isError).toBeFalsy();
      expect(res.result).not.toBeNull();
    });

    it('generate_unique_id with valid prefix → succeeds', async () => {
      const res = await callTool('generate_unique_id', { prefix: 'spec-test' });
      expect(res.isError).toBeFalsy();
      expect((res.result as any).success).toBe(true);
      expect((res.result as any).ids[0]).toMatch(/^spec-test_[a-f0-9]+$/);
    });
  });

  describe('coverage sanity', () => {
    it('all 51+ registered tools have an inputSchema', () => {
      // If a tool slips into the registry without an inputSchema, the
      // validator silently passes through and the handler is unguarded.
      // Catch the regression here.
      const missing: string[] = [];
      for (const [name, entry] of Object.entries(toolRegistry)) {
        const schema = (entry as any).tool?.inputSchema;
        if (!schema || typeof schema !== 'object') {
          missing.push(name);
        }
      }
      expect(missing).toEqual([]);
    });
  });
});
