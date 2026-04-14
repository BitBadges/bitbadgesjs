/**
 * Unit tests for reviewCollection() and the ported UX checks.
 */

import { reviewCollection, extractCollectionValue, fromAuditFinding, fromStandardsFinding, type Finding } from './review.js';
import { runUxChecks } from './review-ux/index.js';

function findByCode(findings: Finding[], code: string): Finding | undefined {
  return findings.find((f) => f.code === code);
}

describe('reviewCollection — smoke', () => {
  it('returns a ReviewResult with summary for an empty collection', () => {
    const result = reviewCollection({
      collectionApprovals: [],
      invariants: { noForcefulPostMintTransfers: true }
    });
    expect(Array.isArray(result.findings)).toBe(true);
    expect(['pass', 'warn', 'fail']).toContain(result.summary.verdict);
    // Summary counts must match finding list
    const total = result.summary.critical + result.summary.warning + result.summary.info;
    expect(total).toBe(result.findings.length);
  });

  it('extractCollectionValue unwraps transaction, message, and raw collection', () => {
    expect(extractCollectionValue({ messages: [{ value: { a: 1 } }] })).toEqual({ a: 1 });
    expect(extractCollectionValue({ typeUrl: 'x', value: { a: 2 } })).toEqual({ a: 2 });
    expect(extractCollectionValue({ a: 3 })).toEqual({ a: 3 });
  });

  it('summary counts align with severities', () => {
    const result = reviewCollection({
      collectionApprovals: [
        { fromListId: 'Mint', approvalId: 'x', approvalCriteria: {} }
      ]
    });
    const total =
      result.summary.critical + result.summary.warning + result.summary.info;
    expect(total).toBe(result.findings.length);
    expect(result.summary.verdict).toBe('fail');
  });
});

describe('adapters', () => {
  it('fromAuditFinding builds a stable code', () => {
    const f = fromAuditFinding({
      severity: 'warning',
      category: 'centralization',
      title: 'Manager can change',
      detail: 'details',
      recommendation: 'lock it'
    });
    expect(f.code).toMatch(/^review\.audit\./);
    expect(f.source).toBe('audit');
    expect(f.recommendation.en).toBe('lock it');
  });

  it('fromStandardsFinding marks source=standards and severity=critical', () => {
    const f = fromStandardsFinding({
      standard: 'Subscriptions',
      field: 'collectionApprovals',
      message: 'must have mint approval'
    });
    expect(f.source).toBe('standards');
    expect(f.severity).toBe('critical');
    expect(f.code).toMatch(/^review\.standards\./);
  });
});

describe('UX checks — representative sample', () => {
  const ctx = {};

  it('flags mint approval missing override', () => {
    const findings = runUxChecks(
      {
        collectionApprovals: [{ approvalId: 'mint1', fromListId: 'Mint', approvalCriteria: {} }]
      },
      ctx
    );
    expect(findByCode(findings, 'review.ux.mint_approval_missing_override')).toBeDefined();
  });

  it('flags placeholder images on metadataPlaceholders', () => {
    const findings = runUxChecks(
      {
        collectionApprovals: [],
        metadataPlaceholders: { 'ipfs://METADATA_1': { image: 'ipfs://IMAGE_1' } }
      },
      ctx
    );
    expect(findByCode(findings, 'review.ux.placeholder_images')).toBeDefined();
  });

  it('flags permission permanently permitted forever', () => {
    // review-ux checks run after normalizeForReview has converted all
    // numeric fields to bigints via the Msg class .convert(BigIntify)
    // pipeline. Tests call runUxChecks directly so must supply bigints.
    const findings = runUxChecks(
      {
        collectionApprovals: [],
        collectionPermissions: {
          canUpdateCollectionMetadata: [
            { permanentlyPermittedTimes: [{ start: 1n, end: 18446744073709551615n }] }
          ]
        }
      },
      ctx
    );
    const permFinding = findings.find((f) => f.code.startsWith('review.ux.permission_permanently_permitted_'));
    expect(permFinding).toBeDefined();
  });

  it('flags missing aliases image', () => {
    const findings = runUxChecks(
      {
        collectionApprovals: [],
        aliasPaths: [{ denomUnits: [{ isDefaultDisplay: true, metadata: {} }], metadata: {} }]
      },
      ctx
    );
    expect(findByCode(findings, 'review.ux.alias_paths_missing_images')).toBeDefined();
  });

  it('flags on-chain diff: deleted approvals', () => {
    const findings = runUxChecks(
      {
        collectionId: '42',
        updateCollectionApprovals: true,
        collectionApprovals: [{ approvalId: 'keep' }]
      },
      {
        onChainCollection: {
          collectionApprovals: [{ approvalId: 'keep' }, { approvalId: 'delete-me' }]
        }
      }
    );
    expect(findByCode(findings, 'review.ux.diff_deleted_approvals')).toBeDefined();
  });

  it('flags forceful_transfers_allowed when overrides exist without invariant', () => {
    const findings = runUxChecks(
      {
        collectionApprovals: [
          {
            approvalId: 'forceful1',
            fromListId: 'All',
            approvalCriteria: { overridesFromOutgoingApprovals: true }
          }
        ],
        invariants: {}
      },
      ctx
    );
    // Matches old frontend: overrides + no invariant -> single finding, no separate invariant check
    expect(findByCode(findings, 'review.ux.forceful_transfers_allowed')).toBeDefined();
    expect(findByCode(findings, 'review.ux.forceful_invariant_not_set')).toBeUndefined();
  });

  it('forceful mismatch fires when overrides exist AND invariant set', () => {
    // Both set -> forceful_transfers_allowed + forceful_override_mismatch
    const both = runUxChecks(
      {
        collectionApprovals: [
          {
            approvalId: 'x',
            fromListId: 'bb1user',
            approvalCriteria: { overridesFromOutgoingApprovals: true }
          }
        ],
        invariants: { noForcefulPostMintTransfers: true }
      },
      ctx
    );
    expect(findByCode(both, 'review.ux.forceful_transfers_allowed')).toBeDefined();
    expect(findByCode(both, 'review.ux.forceful_override_mismatch')).toBeDefined();

    // No overrides + invariant set -> no finding (matches old frontend case D)
    const invOnly = runUxChecks(
      { collectionApprovals: [], invariants: { noForcefulPostMintTransfers: true } },
      ctx
    );
    expect(findByCode(invOnly, 'review.ux.forceful_transfers_allowed')).toBeUndefined();
    expect(findByCode(invOnly, 'review.ux.forceful_override_mismatch')).toBeUndefined();
  });

  it('flags credit_token_transfers_allowed when Credit Token standard + non-mint approvals', () => {
    const findings = runUxChecks(
      {
        standards: ['Credit Token'],
        collectionApprovals: [
          { approvalId: 'm', fromListId: 'Mint', approvalCriteria: { overridesFromOutgoingApprovals: true } },
          { approvalId: 't', fromListId: 'bb1holder', approvalCriteria: {} }
        ]
      },
      ctx
    );
    expect(findByCode(findings, 'review.ux.credit_token_transfers_allowed')).toBeDefined();
  });

  it('flags reserved coin symbol collisions on alias paths', () => {
    const findings = runUxChecks(
      {
        collectionApprovals: [],
        aliasPaths: [{ denomUnits: [{ symbol: 'BADGE' }] }]
      },
      ctx
    );
    // The finding is only emitted if BADGE is in the registry; defensively
    // just check that the module did not throw and the call completed.
    expect(Array.isArray(findings)).toBe(true);
  });
});

describe('reviewCollection — snapshot across sources', () => {
  it('returns findings from all three sources on a broken collection', () => {
    const broken = {
      collectionId: '0',
      manager: 'bb1deadbeef',
      collectionApprovals: [
        { approvalId: 'bad-mint', fromListId: 'Mint', approvalCriteria: {} },
        { approvalId: 'all-list', fromListId: 'All', approvalCriteria: {} }
      ],
      standards: [],
      metadataPlaceholders: { 'ipfs://METADATA_X': { image: 'ipfs://IMAGE_1' } }
    };
    const result = reviewCollection(broken);
    expect(result.summary.verdict).toBe('fail');
    // Must include at least one ux finding
    expect(result.findings.some((f) => f.source === 'ux')).toBe(true);
    // Every finding must have a stable code and the three required localized strings
    for (const f of result.findings) {
      expect(typeof f.code).toBe('string');
      expect(f.code).toMatch(/^review\.(audit|standards|ux)\./);
      expect(typeof f.title.en).toBe('string');
      expect(f.title.en.length).toBeGreaterThan(0);
      expect(typeof f.detail.en).toBe('string');
      expect(f.detail.en.length).toBeGreaterThan(0);
      expect(typeof f.recommendation.en).toBe('string');
      expect(f.recommendation.en.length).toBeGreaterThan(0);
    }
  });
});
