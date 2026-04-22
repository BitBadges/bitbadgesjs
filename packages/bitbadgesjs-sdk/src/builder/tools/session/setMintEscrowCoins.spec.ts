/**
 * Tests for `set_mint_escrow_coins` builder tool.
 *
 * handleSetMintEscrowCoins funds the mint escrow on collection creation and
 * is load-bearing for quest-reward and auto-payout flows. The handler has
 * two non-trivial branches beyond the basic pass-through:
 *
 *   1. AI frequently passes `coins` as a JSON-encoded string instead of a
 *      real array. The handler attempts JSON.parse, falls back to a helpful
 *      error on parse failure.
 *   2. The chain only supports one coin entry in mintEscrowCoinsToTransfer.
 *      The handler rejects arrays of length >1 with a clear error message.
 *
 * These tests cover both branches plus the happy path, session mutation, and
 * sessionId isolation.
 */
import { handleSetMintEscrowCoins } from './setMintEscrowCoins.js';
import { getOrCreateSession, resetAllSessions } from '../../session/sessionState.js';

describe('handleSetMintEscrowCoins', () => {
  beforeEach(() => resetAllSessions());

  describe('happy path', () => {
    it('accepts a single coin entry and writes it to the session', () => {
      const res = handleSetMintEscrowCoins({ coins: [{ denom: 'ubadge', amount: '1000' }] });
      expect(res.success).toBe(true);
      expect(res.coins).toEqual([{ denom: 'ubadge', amount: '1000' }]);
      expect(getOrCreateSession().messages[0].value.mintEscrowCoinsToTransfer).toEqual([{ denom: 'ubadge', amount: '1000' }]);
    });

    it('accepts an empty coin array (no funding)', () => {
      const res = handleSetMintEscrowCoins({ coins: [] });
      expect(res.success).toBe(true);
      expect(res.coins).toEqual([]);
    });

    it('accepts an IBC denom', () => {
      const res = handleSetMintEscrowCoins({
        coins: [{ denom: 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349', amount: '42' }]
      });
      expect(res.success).toBe(true);
    });
  });

  describe('chain constraint: at most one coin entry', () => {
    it('rejects an array with two entries', () => {
      const res = handleSetMintEscrowCoins({
        coins: [
          { denom: 'ubadge', amount: '100' },
          { denom: 'ustake', amount: '200' }
        ]
      } as any);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/at most 1/i);
    });

    it('rejects an array with three entries', () => {
      const res = handleSetMintEscrowCoins({
        coins: [
          { denom: 'a', amount: '1' },
          { denom: 'b', amount: '2' },
          { denom: 'c', amount: '3' }
        ]
      } as any);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/at most 1/i);
    });
  });

  describe('JSON-string coercion (AI quirk)', () => {
    it('parses a JSON array string into an array', () => {
      const res = handleSetMintEscrowCoins({ coins: '[{"denom":"ubadge","amount":"1000"}]' } as any);
      expect(res.success).toBe(true);
      expect(res.coins).toEqual([{ denom: 'ubadge', amount: '1000' }]);
    });

    it('rejects an unparseable JSON string with a helpful error', () => {
      const res = handleSetMintEscrowCoins({ coins: 'not-valid-json' } as any);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/array of \{denom, amount\}/i);
    });

    it('still applies the 1-entry cap after JSON parsing', () => {
      const res = handleSetMintEscrowCoins({
        coins: '[{"denom":"a","amount":"1"},{"denom":"b","amount":"2"}]'
      } as any);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/at most 1/i);
    });
  });

  describe('session mutation', () => {
    it('replaces coins on re-call (set semantics)', () => {
      handleSetMintEscrowCoins({ coins: [{ denom: 'ubadge', amount: '100' }] });
      handleSetMintEscrowCoins({ coins: [{ denom: 'ustake', amount: '200' }] });
      expect(getOrCreateSession().messages[0].value.mintEscrowCoinsToTransfer).toEqual([{ denom: 'ustake', amount: '200' }]);
    });

    it('isolates coins per sessionId', () => {
      handleSetMintEscrowCoins({ sessionId: 'a', coins: [{ denom: 'ubadge', amount: '10' }] });
      handleSetMintEscrowCoins({ sessionId: 'b', coins: [{ denom: 'ustake', amount: '20' }] });
      expect(getOrCreateSession('a').messages[0].value.mintEscrowCoinsToTransfer).toEqual([{ denom: 'ubadge', amount: '10' }]);
      expect(getOrCreateSession('b').messages[0].value.mintEscrowCoinsToTransfer).toEqual([{ denom: 'ustake', amount: '20' }]);
    });
  });
});
