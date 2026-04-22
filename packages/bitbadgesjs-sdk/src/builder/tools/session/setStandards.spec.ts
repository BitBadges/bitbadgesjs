/**
 * Tests for `set_standards` builder tool.
 *
 * handleSetStandards sets the collection's `standards` array. Beyond pushing
 * the value into the session, it does one piece of soft validation: if a
 * standard is not in the KNOWN_STANDARDS whitelist AND it doesn't look like
 * a dynamic qualifier (contains ":", e.g. `NFTPricingDenom:ubadge`), the
 * handler attaches a `warnings` array so the model can fix typos without
 * blocking the call (custom standards are still allowed).
 *
 * These tests verify:
 *   - known standards pass silently (no warnings key)
 *   - unknown standards produce a warning each
 *   - dynamic standards (ListView:*, NFTPricingDenom:*, DefaultDisplayCurrency:*)
 *     are never warned about
 *   - the session state is mutated correctly on every branch
 */
import { handleSetStandards } from './setStandards.js';
import { getOrCreateSession, resetAllSessions } from '../../session/sessionState.js';

describe('handleSetStandards', () => {
  beforeEach(() => resetAllSessions());

  describe('whitelist pass-through', () => {
    it('accepts a known single standard with no warnings', () => {
      const res = handleSetStandards({ standards: ['NFTs'] });
      expect(res.success).toBe(true);
      expect(res.standards).toEqual(['NFTs']);
      expect(res).not.toHaveProperty('warnings');
    });

    it('accepts multiple known standards', () => {
      const res = handleSetStandards({
        standards: ['NFTs', 'NFTMarketplace', 'Tradable']
      });
      expect(res.success).toBe(true);
      expect(res).not.toHaveProperty('warnings');
    });

    it('accepts known smart-token combo', () => {
      const res = handleSetStandards({ standards: ['Smart Token', 'AI Agent Vault'] });
      expect(res.success).toBe(true);
      expect(res).not.toHaveProperty('warnings');
    });

    it('accepts an empty standards array', () => {
      const res = handleSetStandards({ standards: [] });
      expect(res.success).toBe(true);
      expect(res.standards).toEqual([]);
    });
  });

  describe('dynamic qualifiers (contain ":")', () => {
    it('does not warn about NFTPricingDenom:ubadge', () => {
      const res = handleSetStandards({
        standards: ['NFTs', 'NFTPricingDenom:ubadge']
      });
      expect(res).not.toHaveProperty('warnings');
    });

    it('does not warn about ListView:something', () => {
      const res = handleSetStandards({
        standards: ['ListView:mycustomview']
      });
      expect(res).not.toHaveProperty('warnings');
    });

    it('does not warn about DefaultDisplayCurrency:usd', () => {
      const res = handleSetStandards({ standards: ['DefaultDisplayCurrency:usd'] });
      expect(res).not.toHaveProperty('warnings');
    });
  });

  describe('unknown standards produce warnings', () => {
    it('warns for a single typo standard', () => {
      const res: any = handleSetStandards({ standards: ['NFT'] }); // missing trailing 's'
      expect(res.success).toBe(true);
      expect(res.warnings).toBeDefined();
      expect(res.warnings).toHaveLength(1);
      expect(res.warnings[0]).toMatch(/"NFT".*not a recognized standard/i);
    });

    it('warns once per unknown entry in a mixed array', () => {
      const res: any = handleSetStandards({
        standards: ['NFTs', 'Bogus', 'Smart Token', 'AlsoBogus']
      });
      expect(res.warnings).toHaveLength(2);
      expect(res.warnings[0]).toMatch(/Bogus/);
      expect(res.warnings[1]).toMatch(/AlsoBogus/);
    });

    it('still writes unknown standards into the session (custom allowed)', () => {
      handleSetStandards({ standards: ['CustomStandard'] });
      expect(getOrCreateSession().messages[0].value.standards).toEqual(['CustomStandard']);
    });
  });

  describe('session mutation', () => {
    it('flips updateStandards=true', () => {
      handleSetStandards({ standards: ['NFTs'] });
      expect(getOrCreateSession().messages[0].value.updateStandards).toBe(true);
    });

    it('replaces standards on re-call', () => {
      handleSetStandards({ standards: ['NFTs'] });
      handleSetStandards({ standards: ['Fungible Tokens'] });
      expect(getOrCreateSession().messages[0].value.standards).toEqual(['Fungible Tokens']);
    });

    it('isolates by sessionId', () => {
      handleSetStandards({ sessionId: 'a', standards: ['NFTs'] });
      handleSetStandards({ sessionId: 'b', standards: ['Subscriptions'] });
      expect(getOrCreateSession('a').messages[0].value.standards).toEqual(['NFTs']);
      expect(getOrCreateSession('b').messages[0].value.standards).toEqual(['Subscriptions']);
    });
  });
});
