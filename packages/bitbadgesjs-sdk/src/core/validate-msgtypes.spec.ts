/**
 * Tests for the validation passes added this session:
 *
 *   1. All three collection typeUrls accepted (Create / Update / Universal)
 *   2. Update-specific rules:
 *      - must have non-zero collectionId
 *      - must NOT set defaultBalances
 *      - must NOT set invariants (genesis-only)
 *   3. Create accepts missing collectionId + missing update flags without
 *      firing spurious errors (constructor check implies flags=true)
 *   4. User-level approval msg branches:
 *      - MsgUpdateUserApprovals
 *      - MsgSetIncomingApproval / MsgSetOutgoingApproval
 *      - MsgDeleteIncoming/OutgoingApproval (approvalId required)
 *   5. Approval-level gating: collection-only rules (Mint override,
 *      subscriptions, backing-address warning) are skipped when the level
 *      is 'outgoing' or 'incoming'.
 */

import { validateTransaction, validateApprovals, type ValidationIssue } from './validate.js';

const CREATE = '/tokenization.MsgCreateCollection';
const UPDATE = '/tokenization.MsgUpdateCollection';
const UNIVERSAL = '/tokenization.MsgUniversalUpdateCollection';

const baseCreatorValue = () => ({
  creator: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpdguex7'
});

// Minimal field shapes to keep validateMsgConstructorFields happy.
const MIN_COLLECTION_VALUE = () => ({
  ...baseCreatorValue(),
  validTokenIds: [],
  standards: [],
  collectionApprovals: [],
  tokenMetadata: [],
  aliasPathsToAdd: [],
  cosmosCoinWrapperPathsToAdd: [],
  mintEscrowCoinsToTransfer: []
});

function wrap(typeUrl: string, value: any) {
  return { messages: [{ typeUrl, value }] };
}

describe('validateTransaction — all three collection typeUrls accepted', () => {
  it('MsgCreateCollection with minimal valid value is clean', () => {
    const result = validateTransaction(wrap(CREATE, MIN_COLLECTION_VALUE()));
    expect(result.valid).toBe(true);
  });

  it('MsgUpdateCollection with non-zero collectionId is clean', () => {
    const result = validateTransaction(
      wrap(UPDATE, { ...MIN_COLLECTION_VALUE(), collectionId: '42' })
    );
    expect(result.valid).toBe(true);
  });

  it('MsgUniversalUpdateCollection with collectionId still works (legacy path)', () => {
    const result = validateTransaction(
      wrap(UNIVERSAL, { ...MIN_COLLECTION_VALUE(), collectionId: '0' })
    );
    expect(result.valid).toBe(true);
  });
});

describe('MsgUpdateCollection — Update-specific rules', () => {
  const minUpdate = () => ({ ...MIN_COLLECTION_VALUE(), collectionId: '42' });

  it('requires non-zero collectionId', () => {
    const result = validateTransaction(
      wrap(UPDATE, { ...MIN_COLLECTION_VALUE(), collectionId: '0' })
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => /non-zero "collectionId"/.test(i.message))).toBe(true);
  });

  it('rejects defaultBalances (create-only)', () => {
    const result = validateTransaction(
      wrap(UPDATE, { ...minUpdate(), defaultBalances: { autoApproveAllIncomingTransfers: true } })
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => /defaultBalances/.test(i.message) && /create-only/.test(i.message))).toBe(true);
  });

  it('rejects invariants (genesis-only)', () => {
    const result = validateTransaction(
      wrap(UPDATE, { ...minUpdate(), invariants: { maxSupplyPerId: '1' } })
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => /invariants/.test(i.message) && /genesis/.test(i.message))).toBe(true);
  });
});

describe('MsgCreateCollection — no spurious errors for missing update flags', () => {
  it('does not complain about missing collectionId', () => {
    const value = MIN_COLLECTION_VALUE(); // no collectionId
    const result = validateTransaction(wrap(CREATE, value));
    // Errors must not reference collectionId at all (Create omits it).
    const collectionIdErrors = result.issues.filter(
      (i) => i.severity === 'error' && /collectionId/.test(i.message)
    );
    expect(collectionIdErrors).toEqual([]);
  });

  it('does not complain about missing updateXxxTimeline flags', () => {
    const result = validateTransaction(wrap(CREATE, MIN_COLLECTION_VALUE()));
    const flagErrors = result.issues.filter(
      (i) => i.severity === 'error' && /updateValidTokenIds|updateCollectionApprovals/.test(i.message)
    );
    expect(flagErrors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// User-level approval msg branches
// ---------------------------------------------------------------------------

const USER_APPROVALS = '/tokenization.MsgUpdateUserApprovals';
const SET_INCOMING = '/tokenization.MsgSetIncomingApproval';
const SET_OUTGOING = '/tokenization.MsgSetOutgoingApproval';
const DELETE_INCOMING = '/tokenization.MsgDeleteIncomingApproval';
const DELETE_OUTGOING = '/tokenization.MsgDeleteOutgoingApproval';

describe('user-level approval msg validation', () => {
  it('MsgUpdateUserApprovals: requires creator and non-zero collectionId', () => {
    const result = validateTransaction(
      wrap(USER_APPROVALS, { collectionId: '0' })
    );
    expect(result.valid).toBe(false);
    const msgs = result.issues.map((i) => i.message).join('\n');
    expect(msgs).toMatch(/creator/);
    expect(msgs).toMatch(/non-zero "collectionId"/);
  });

  it('MsgUpdateUserApprovals: runs validateApprovals on outgoingApprovals', () => {
    // Approval missing required approvalId — should be flagged.
    const result = validateTransaction(
      wrap(USER_APPROVALS, {
        creator: 'bb1abc',
        collectionId: '42',
        updateOutgoingApprovals: true,
        outgoingApprovals: [
          {
            // approvalId intentionally missing
            toListId: 'All',
            initiatedByListId: 'All',
            transferTimes: [{ start: '1', end: '2' }],
            tokenIds: [{ start: '1', end: '1' }],
            ownershipTimes: [{ start: '1', end: '2' }]
          }
        ]
      })
    );
    expect(result.issues.some((i) => /approvalId/.test(i.message))).toBe(true);
  });

  it('MsgSetIncomingApproval: wraps single approval into array and validates', () => {
    const result = validateTransaction(
      wrap(SET_INCOMING, {
        creator: 'bb1abc',
        collectionId: '42',
        approval: {
          // approvalId intentionally missing
          fromListId: 'All',
          initiatedByListId: 'All'
        }
      })
    );
    expect(result.issues.some((i) => /approvalId/.test(i.message))).toBe(true);
  });

  it('MsgSetOutgoingApproval: missing approval object raises error', () => {
    const result = validateTransaction(
      wrap(SET_OUTGOING, { creator: 'bb1abc', collectionId: '42' })
    );
    expect(result.issues.some((i) => /"approval" object/.test(i.message))).toBe(true);
  });

  it.each([DELETE_INCOMING, DELETE_OUTGOING])(
    '%s: requires non-empty approvalId',
    (typeUrl) => {
      const result = validateTransaction(
        wrap(typeUrl, { creator: 'bb1abc', collectionId: '42', approvalId: '' })
      );
      expect(result.issues.some((i) => /approvalId/.test(i.message))).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// Approval-level gating
// ---------------------------------------------------------------------------

describe('validateApprovals — level-aware collection-only rules', () => {
  // A Mint approval that does NOT set overridesFromOutgoingApprovals.
  // At collection level this should fire "Mint approvals MUST have …".
  // At outgoing/incoming level it should NOT fire because
  // OutgoingApprovalCriteria / IncomingApprovalCriteria don't have that
  // field in the proto at all.
  const mintApprovalWithoutOverride = {
    approvalId: 'mint-1',
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    approvalCriteria: {}
  };

  it('collection level: flags missing overridesFromOutgoingApprovals on Mint', () => {
    const issues: ValidationIssue[] = [];
    validateApprovals([mintApprovalWithoutOverride], 'path', issues, undefined, 'collection');
    expect(issues.some((i) => /overridesFromOutgoingApprovals/.test(i.message))).toBe(true);
  });

  it('outgoing level: does NOT fire Mint override rule', () => {
    const issues: ValidationIssue[] = [];
    validateApprovals([mintApprovalWithoutOverride], 'path', issues, undefined, 'outgoing');
    expect(issues.some((i) => /overridesFromOutgoingApprovals/.test(i.message))).toBe(false);
  });

  it('incoming level: does NOT fire Mint override rule either', () => {
    const issues: ValidationIssue[] = [];
    validateApprovals([mintApprovalWithoutOverride], 'path', issues, undefined, 'incoming');
    expect(issues.some((i) => /overridesFromOutgoingApprovals/.test(i.message))).toBe(false);
  });

  it('approvalId requirement fires at every level', () => {
    const noId = { fromListId: 'All', toListId: 'All', initiatedByListId: 'All' };
    for (const level of ['collection', 'outgoing', 'incoming'] as const) {
      const issues: ValidationIssue[] = [];
      validateApprovals([noId], 'path', issues, undefined, level);
      expect(issues.some((i) => /approvalId/.test(i.message))).toBe(true);
    }
  });

  it('toListId "Mint" is rejected at every level', () => {
    const bad = { approvalId: 'x', toListId: 'Mint', initiatedByListId: 'All' };
    for (const level of ['collection', 'outgoing', 'incoming'] as const) {
      const issues: ValidationIssue[] = [];
      validateApprovals([bad], 'path', issues, undefined, level);
      expect(issues.some((i) => /toListId cannot be "Mint"/.test(i.message))).toBe(true);
    }
  });
});
