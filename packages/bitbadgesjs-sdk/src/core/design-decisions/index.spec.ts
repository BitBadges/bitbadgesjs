/**
 * Tests for runDesignChecks and the per-category modules.
 *
 * Covers the informational ✓/✗/n-a contract. These are NOT the same
 * thing as review items — there is no "fix" workflow, just a pure read
 * of the collection's shape.
 */

import {
  runDesignChecks,
  standardsDecisions,
  supplyDecisions,
  transferabilityDecisions,
  backingDecisions
} from './index.js';
import type { DesignDecision } from '../review-types.js';

function findByCode(decisions: DesignDecision[], code: string): DesignDecision | undefined {
  return decisions.find((d) => d.code === code);
}

// ---------------------------------------------------------------------------
// runDesignChecks — orchestrator
// ---------------------------------------------------------------------------

describe('runDesignChecks — smoke', () => {
  it('returns a structured result for an empty-ish collection', () => {
    const result = runDesignChecks({ collectionApprovals: [], standards: [] });
    expect(Array.isArray(result.decisions)).toBe(true);
    expect(result.decisions.length).toBeGreaterThan(0);
    const { pass, fail, na } = result.summary;
    expect(pass + fail + na).toBe(result.decisions.length);
  });

  it('swallows individual check failures without killing the run', () => {
    // Malformed collection — the standards check walks arrays that
    // won't exist here. We just assert no throw.
    expect(() => runDesignChecks({ standards: 'not-an-array', collectionApprovals: null })).not.toThrow();
  });

  it('unwraps a transaction envelope like normalizeForReview does', () => {
    const inner = { standards: [], collectionApprovals: [] };
    const result = runDesignChecks({ messages: [{ value: inner }] });
    expect(result.decisions.length).toBeGreaterThan(0);
  });

  it('accepts non-object input without crashing', () => {
    expect(() => runDesignChecks(null)).not.toThrow();
    expect(() => runDesignChecks(undefined)).not.toThrow();
    expect(() => runDesignChecks(42)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// standards
// ---------------------------------------------------------------------------

describe('standardsDecisions', () => {
  it('returns n/a for every unclaimed standard', () => {
    const out = standardsDecisions({ standards: [], collectionApprovals: [] });
    expect(out.length).toBeGreaterThan(0);
    for (const d of out) {
      expect(d.category).toBe('standards');
      expect(d.status).toBe('n/a');
    }
  });

  it('returns fail when a standard is claimed but protocol does not match', () => {
    // Claim Quests but give it invalid validTokenIds — the Quest
    // protocol requires exactly [{1,1}].
    const out = standardsDecisions({
      standards: ['Quests'],
      validTokenIds: [{ start: 1n, end: 5n }],
      collectionApprovals: []
    });
    const quest = findByCode(out, 'design.standards.quest');
    expect(quest).toBeDefined();
    expect(quest!.status).toBe('fail');
  });

  it('returns pass for a canonical Quest collection', () => {
    const out = standardsDecisions({
      standards: ['Quests'],
      validTokenIds: [{ start: 1n, end: 1n }],
      collectionApprovals: []
    });
    const quest = findByCode(out, 'design.standards.quest');
    expect(quest).toBeDefined();
    expect(quest!.status).toBe('pass');
  });

  it('only reads `standards[]` — not arbitrary text fields', () => {
    const out = standardsDecisions({
      standards: [],
      collectionMetadata: { name: 'Quests' }, // trap: name contains the standard
      collectionApprovals: []
    });
    const quest = findByCode(out, 'design.standards.quest');
    expect(quest!.status).toBe('n/a');
  });
});

// ---------------------------------------------------------------------------
// supply
// ---------------------------------------------------------------------------

describe('supplyDecisions', () => {
  it('pass when maxSupplyPerId > 0', () => {
    const out = supplyDecisions({ invariants: { maxSupplyPerId: 100n } });
    expect(findByCode(out, 'design.supply.has_cap')!.status).toBe('pass');
  });

  it('fail when maxSupplyPerId is missing', () => {
    const out = supplyDecisions({ invariants: {} });
    expect(findByCode(out, 'design.supply.has_cap')!.status).toBe('fail');
  });

  it('fail when maxSupplyPerId is 0', () => {
    const out = supplyDecisions({ invariants: { maxSupplyPerId: 0n } });
    expect(findByCode(out, 'design.supply.has_cap')!.status).toBe('fail');
  });

  it('accepts stringified bigints (post-normalize some callers may pass strings)', () => {
    const out = supplyDecisions({ invariants: { maxSupplyPerId: '500' } });
    expect(findByCode(out, 'design.supply.has_cap')!.status).toBe('pass');
  });
});

// ---------------------------------------------------------------------------
// transferability
// ---------------------------------------------------------------------------

describe('transferabilityDecisions', () => {
  it('pass "non-transferable" when no post-mint non-burn approval exists', () => {
    const out = transferabilityDecisions({
      collectionApprovals: [
        { fromListId: 'Mint', toListId: 'All' }
      ],
      invariants: {}
    });
    expect(findByCode(out, 'design.transferability.non_transferable')!.status).toBe('pass');
  });

  it('fail "non-transferable" when a holder-to-holder approval exists', () => {
    const out = transferabilityDecisions({
      collectionApprovals: [
        { fromListId: 'Mint', toListId: 'All' },
        { fromListId: 'All', toListId: 'All' }
      ],
      invariants: {}
    });
    expect(findByCode(out, 'design.transferability.non_transferable')!.status).toBe('fail');
  });

  it('pass "non-transferable" when the only non-mint approval is a burn', () => {
    const out = transferabilityDecisions({
      collectionApprovals: [
        { fromListId: 'Mint', toListId: 'All' },
        { fromListId: 'All', toListId: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv' }
      ],
      invariants: {}
    });
    expect(findByCode(out, 'design.transferability.non_transferable')!.status).toBe('pass');
  });

  it('pass "no forceful transfers" when the invariant is true', () => {
    const out = transferabilityDecisions({
      collectionApprovals: [],
      invariants: { noForcefulPostMintTransfers: true }
    });
    expect(findByCode(out, 'design.transferability.no_forceful_transfers')!.status).toBe('pass');
  });

  it('fail "no forceful transfers" when the collection is transferable and the invariant is false', () => {
    const out = transferabilityDecisions({
      collectionApprovals: [
        { fromListId: 'All', toListId: 'All' }
      ],
      invariants: {}
    });
    expect(findByCode(out, 'design.transferability.no_forceful_transfers')!.status).toBe('fail');
  });

  it('n/a "no forceful transfers" when the collection is non-transferable and invariant is unset', () => {
    // Non-transferable + invariant off — the check would be a misleading
    // `fail` (no post-mint transfers exist to be forceful about), so it
    // should soften to `n/a` rather than alarm the reviewer.
    const out = transferabilityDecisions({
      collectionApprovals: [{ fromListId: 'Mint', toListId: 'All' }],
      invariants: {}
    });
    expect(findByCode(out, 'design.transferability.non_transferable')!.status).toBe('pass');
    expect(findByCode(out, 'design.transferability.no_forceful_transfers')!.status).toBe('n/a');
  });
});

// ---------------------------------------------------------------------------
// backing
// ---------------------------------------------------------------------------

describe('backingDecisions', () => {
  it('n/a when no wrapper paths are configured', () => {
    const out = backingDecisions({ cosmosCoinWrapperPaths: [] });
    expect(findByCode(out, 'design.backing.cosmos_coin_wrapper')!.status).toBe('n/a');
  });

  it('pass when at least one wrapper path is configured', () => {
    const out = backingDecisions({
      cosmosCoinWrapperPaths: [{ denom: 'ubadge', symbol: 'BADGE' }]
    });
    const d = findByCode(out, 'design.backing.cosmos_coin_wrapper')!;
    expect(d.status).toBe('pass');
    expect(d.evidence).toContain('ubadge');
  });

  it('also reads cosmosCoinWrapperPathsToAdd (Msg-shape alias)', () => {
    const out = backingDecisions({
      cosmosCoinWrapperPathsToAdd: [{ denom: 'u', symbol: 'X' }]
    });
    expect(findByCode(out, 'design.backing.cosmos_coin_wrapper')!.status).toBe('pass');
  });
});
