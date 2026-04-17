/**
 * Tests for `generate_unique_id`.
 *
 * The LLM builder calls this whenever it creates a new approval or tracker —
 * the suffix is a cryptographically-random 4-byte hex so that two parallel
 * builder sessions don't collide on approvalId (which would cause on-chain
 * conflicts).
 *
 * Because the output is random, tests focus on:
 *   - shape of each generated id (`{prefix}_{8 hex chars}`)
 *   - bounds clamping (count clamped to [1, 20])
 *   - default count behavior when omitted
 *   - uniqueness across a large batch (collision probability vanishingly low)
 *
 * NOTE: 4-byte hex has a 2^32 collision space, so within a single batch of
 * 20 ids a collision is astronomically unlikely but theoretically possible.
 * The uniqueness assertion uses a Set size check and is expected to hold in
 * normal runs — flaky failures here would indicate a bug in randomBytes().
 */

import { handleGenerateUniqueId as _handle } from './generateUniqueId.js';

// Thin wrapper so tests can omit `count` (Zod's `.default(1)` makes the
// inferred input type require it, but the runtime accepts undefined).
const handleGenerateUniqueId = (input: { prefix: string; count?: number }) =>
  _handle(input as any);

describe('handleGenerateUniqueId', () => {
  describe('shape of output', () => {
    it('returns success=true and an array of ids', () => {
      const res = handleGenerateUniqueId({ prefix: 'public-mint' });
      expect(res.success).toBe(true);
      expect(Array.isArray(res.ids)).toBe(true);
      expect(res.ids.length).toBeGreaterThan(0);
    });

    it('returns exactly 1 id when count is omitted (default)', () => {
      const res = handleGenerateUniqueId({ prefix: 'public-mint' });
      expect(res.ids).toHaveLength(1);
    });

    it('each id matches `{prefix}_{8 lowercase hex chars}`', () => {
      const res = handleGenerateUniqueId({ prefix: 'subscription-mint' });
      for (const id of res.ids) {
        expect(id).toMatch(/^subscription-mint_[0-9a-f]{8}$/);
      }
    });

    it('preserves the prefix verbatim including hyphens and casing', () => {
      const res = handleGenerateUniqueId({ prefix: 'MyCustomPrefix-With-Hyphens' });
      expect(res.ids[0].startsWith('MyCustomPrefix-With-Hyphens_')).toBe(true);
    });

    it('returns an instructive `note` string so the agent knows how to use the ids', () => {
      const res = handleGenerateUniqueId({ prefix: 'x' });
      expect(res.note).toMatch(/approval/i);
    });
  });

  describe('count parameter', () => {
    it('returns exactly `count` ids when count is in range', () => {
      const res = handleGenerateUniqueId({ prefix: 'x', count: 5 });
      expect(res.ids).toHaveLength(5);
    });

    it('clamps count=0 up to 1 (minimum)', () => {
      const res = handleGenerateUniqueId({ prefix: 'x', count: 0 });
      expect(res.ids).toHaveLength(1);
    });

    it('clamps a negative count up to 1', () => {
      const res = handleGenerateUniqueId({ prefix: 'x', count: -100 });
      expect(res.ids).toHaveLength(1);
    });

    it('clamps count=21 down to 20 (maximum)', () => {
      const res = handleGenerateUniqueId({ prefix: 'x', count: 21 });
      expect(res.ids).toHaveLength(20);
    });

    it('clamps very large count down to 20', () => {
      const res = handleGenerateUniqueId({ prefix: 'x', count: 10_000 });
      expect(res.ids).toHaveLength(20);
    });

    it('accepts count=1 and count=20 exactly at the bounds', () => {
      expect(handleGenerateUniqueId({ prefix: 'x', count: 1 }).ids).toHaveLength(1);
      expect(handleGenerateUniqueId({ prefix: 'x', count: 20 }).ids).toHaveLength(20);
    });
  });

  describe('uniqueness', () => {
    it('a single batch of 20 has all unique suffixes (collisions would indicate an RNG bug)', () => {
      const res = handleGenerateUniqueId({ prefix: 'x', count: 20 });
      const suffixes = res.ids.map(id => id.split('_')[1]);
      expect(new Set(suffixes).size).toBe(20);
    });

    it('successive calls return different suffixes', () => {
      const a = handleGenerateUniqueId({ prefix: 'x' }).ids[0];
      const b = handleGenerateUniqueId({ prefix: 'x' }).ids[0];
      expect(a).not.toBe(b);
    });

    it('cross-batch uniqueness holds across 10 calls of 20 ids each (~200 samples)', () => {
      const all: string[] = [];
      for (let i = 0; i < 10; i++) {
        all.push(...handleGenerateUniqueId({ prefix: 'x', count: 20 }).ids);
      }
      expect(new Set(all).size).toBe(all.length);
    });
  });
});
