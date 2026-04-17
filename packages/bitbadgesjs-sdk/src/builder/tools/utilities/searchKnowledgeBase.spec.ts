/**
 * Tests for `search_knowledge_base`.
 *
 * Builds an in-memory index from the embedded docs/recipes/learnings/etc.,
 * scores each section against the query, and returns the top 10. We don't
 * assert exact scores (the resource text changes over time) — we assert
 * behavioral invariants that must hold regardless of what content lands in
 * the resources at any given commit.
 */

import { handleSearchKnowledgeBase } from './searchKnowledgeBase.js';

describe('handleSearchKnowledgeBase', () => {
  describe('empty / trivial queries', () => {
    it('returns success=false with no results when every query term is ≤1 char', () => {
      const res = handleSearchKnowledgeBase({ query: 'a' });
      // Single char gets filtered out by `t.length > 1`, so the effective
      // query term list is empty → success=false path.
      expect(res.success).toBe(false);
      expect(res.results).toEqual([]);
      expect(res.totalMatches).toBe(0);
    });

    it('returns success=false for an empty string query', () => {
      const res = handleSearchKnowledgeBase({ query: '' });
      expect(res.success).toBe(false);
      expect(res.results).toEqual([]);
    });

    it('returns success=false for whitespace-only query', () => {
      const res = handleSearchKnowledgeBase({ query: '   ' });
      expect(res.success).toBe(false);
    });
  });

  describe('matching + ranking', () => {
    it('finds at least one result for a known domain term ("approval")', () => {
      const res = handleSearchKnowledgeBase({ query: 'approval' });
      expect(res.success).toBe(true);
      expect(res.results.length).toBeGreaterThan(0);
      expect(res.totalMatches).toBeGreaterThan(0);
    });

    it('results are sorted by descending relevance', () => {
      const res = handleSearchKnowledgeBase({ query: 'approval transfer' });
      expect(res.results.length).toBeGreaterThan(1);
      for (let i = 0; i + 1 < res.results.length; i++) {
        expect(res.results[i].relevance).toBeGreaterThanOrEqual(res.results[i + 1].relevance);
      }
    });

    it('returns at most 10 results (even when totalMatches is higher)', () => {
      const res = handleSearchKnowledgeBase({ query: 'the' });
      expect(res.results.length).toBeLessThanOrEqual(10);
      if (res.totalMatches > 10) {
        expect(res.results.length).toBe(10);
      }
    });

    it('each result includes source, section, content, and relevance', () => {
      const res = handleSearchKnowledgeBase({ query: 'approval' });
      for (const r of res.results) {
        expect(typeof r.source).toBe('string');
        expect(typeof r.section).toBe('string');
        expect(typeof r.content).toBe('string');
        expect(typeof r.relevance).toBe('number');
        expect(r.relevance).toBeGreaterThan(0);
      }
    });

    it('truncates content that exceeds 1500 chars and appends [truncated]', () => {
      // Use a very common query so we get back big chunks of docs
      const res = handleSearchKnowledgeBase({ query: 'approval' });
      const truncated = res.results.filter(r => r.content.includes('...[truncated]'));
      if (truncated.length > 0) {
        for (const r of truncated) {
          // 1500 + length of "\n...[truncated]" suffix
          expect(r.content.length).toBeLessThanOrEqual(1500 + 20);
        }
      }
      // We don't assert that truncation happened — depends on resource content.
    });
  });

  describe('category filter', () => {
    it('category="errors" returns only error-category sources', () => {
      const res = handleSearchKnowledgeBase({ query: 'gas', category: 'errors' });
      if (res.success) {
        for (const r of res.results) {
          expect(r.source).toMatch(/^errors/);
        }
      }
    });

    it('category="rules" returns only rule sources', () => {
      const res = handleSearchKnowledgeBase({ query: 'approval', category: 'rules' });
      if (res.success) {
        for (const r of res.results) {
          expect(r.source).toMatch(/^rules/);
        }
      }
    });

    it('category="recipes" returns only recipe sources', () => {
      const res = handleSearchKnowledgeBase({ query: 'mint', category: 'recipes' });
      if (res.success) {
        for (const r of res.results) {
          expect(r.source).toMatch(/^recipes/);
        }
      }
    });

    it('category="docs" returns only docs-category sources (docs/* or workflows)', () => {
      // The index maps `getWorkflowsContent()` to source="workflows" but
      // category="docs", so docs-filtered results can include workflows too.
      const res = handleSearchKnowledgeBase({ query: 'approval', category: 'docs' });
      if (res.success) {
        for (const r of res.results) {
          expect(r.source === 'workflows' || r.source.startsWith('docs')).toBe(true);
        }
      }
    });

    it('category="all" is equivalent to omitting the filter', () => {
      const withAll = handleSearchKnowledgeBase({ query: 'approval', category: 'all' });
      const without = handleSearchKnowledgeBase({ query: 'approval' });
      expect(withAll.totalMatches).toBe(without.totalMatches);
    });

    it('category filter reduces totalMatches relative to "all"', () => {
      const all = handleSearchKnowledgeBase({ query: 'approval', category: 'all' });
      const errors = handleSearchKnowledgeBase({ query: 'approval', category: 'errors' });
      // errors is a strict subset → totalMatches must be ≤ all
      expect(errors.totalMatches).toBeLessThanOrEqual(all.totalMatches);
    });
  });

  describe('query semantics', () => {
    it('splits multi-word queries on whitespace and only counts terms of length > 1', () => {
      const longOnly = handleSearchKnowledgeBase({ query: 'approval' });
      const withOneCharNoise = handleSearchKnowledgeBase({ query: 'approval a x z' });
      // Single-char terms are filtered out, so totalMatches should match.
      expect(withOneCharNoise.totalMatches).toBe(longOnly.totalMatches);
    });

    it('scoring is case-insensitive', () => {
      const lower = handleSearchKnowledgeBase({ query: 'approval' });
      const upper = handleSearchKnowledgeBase({ query: 'APPROVAL' });
      // Same results, same total. (Individual scores should match too but we
      // only assert totalMatches to avoid coupling to scorer internals.)
      expect(upper.totalMatches).toBe(lower.totalMatches);
    });

    it('regex-special characters in query do not throw (they are escaped)', () => {
      // scoreRelevance does `termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
      // so these inputs must not blow up.
      const malicious = ['.', '*', '(', '[', '\\', '$', '{', '}', '|', '?', '^'];
      for (const m of malicious) {
        // Pair with a real word so queryTerms isn't empty
        const res = handleSearchKnowledgeBase({ query: `approval ${m}${m}` });
        expect(typeof res.success).toBe('boolean');
      }
    });
  });

  describe('no-match query', () => {
    // NOTE — this test documents a known BUG (see backlog/0223):
    // `scoreRelevance` applies a +2/+2 "short section" bonus unconditionally,
    // even when the query terms don't match the section at all. As a result,
    // any query returns every short section in the knowledge base with a
    // non-zero relevance. This test pins the current (wrong) behavior so
    // we'll know when it changes. When the bug is fixed, flip this to
    // `expect(res.success).toBe(false)`.
    it('BUG: short sections always match (pins current behavior — see backlog/0223)', () => {
      const res = handleSearchKnowledgeBase({
        query: 'zxqvwmplqr xqzvmrjkwh qrstvwxyzz'
      });
      // Current behavior: short sections score +2 or +4 even with zero keyword hits.
      expect(res.totalMatches).toBeGreaterThan(0);
      for (const r of res.results) {
        // Every "match" here should be short — that's the only reason it scored.
        expect(r.content.length).toBeLessThan(500);
        // Max possible from the short-section bonus: 4 (2 for <500, 2 for <200)
        expect(r.relevance).toBeLessThanOrEqual(4);
      }
    });
  });
});
