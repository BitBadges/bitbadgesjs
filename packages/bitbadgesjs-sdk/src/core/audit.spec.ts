import { auditCollection } from './audit';

const FOREVER = [{ start: '1', end: '18446744073709551615' }];

/** A CollectionApprovalPermission covering every scope field the proto defines, forbidden forever. */
const blanketLock = {
  fromListId: 'All',
  toListId: 'All',
  initiatedByListId: 'All',
  transferTimes: FOREVER,
  tokenIds: FOREVER,
  ownershipTimes: FOREVER,
  approvalId: 'All',
  permanentlyPermittedTimes: [],
  permanentlyForbiddenTimes: FOREVER
};

const transferApproval = {
  approvalId: 'transfer',
  fromListId: 'AllWithoutMint',
  toListId: 'All',
  initiatedByListId: 'All',
  transferTimes: FOREVER,
  tokenIds: FOREVER,
  ownershipTimes: FOREVER,
  approvalCriteria: {}
};

function collectionWith(canUpdateCollectionApprovals: unknown[]) {
  return {
    collectionApprovals: [transferApproval],
    collectionPermissions: { canUpdateCollectionApprovals },
    validTokenIds: FOREVER
  };
}

describe('auditCollection: canUpdateCollectionApprovals blanket lock', () => {
  const title = 'Post-mint transfer approvals can be modified';

  it('flags neutral permissions as mutable transferability', () => {
    const result = auditCollection({ collection: collectionWith([]) });
    expect(result.findings.some((f) => f.title === title)).toBe(true);
  });

  it('recognises a full-scope forever lock built from the proto fields only', () => {
    // The permission proto has no amountTrackerId / challengeTrackerId. A lock
    // that sets every real scope field to its wildcard must count as blanket.
    const result = auditCollection({ collection: collectionWith([blanketLock]) });
    expect(result.findings.some((f) => f.title === title)).toBe(false);
  });

  it('does not treat a Mint-scoped lock as blanket', () => {
    const result = auditCollection({ collection: collectionWith([{ ...blanketLock, fromListId: 'Mint' }]) });
    expect(result.findings.some((f) => f.title === title)).toBe(true);
  });
});

describe('auditCollection: scoped locks decide mutability per flow', () => {
  const mintTitle = 'Mint approvals can be modified — UNLIMITED SUPPLY RISK';
  const mintApproval = { ...transferApproval, approvalId: 'mint', fromListId: 'Mint' };
  const collection = (canUpdateCollectionApprovals: unknown[]) => ({
    collectionApprovals: [mintApproval, transferApproval],
    collectionPermissions: { canUpdateCollectionApprovals },
    validTokenIds: FOREVER
  });

  it('a transfer-scoped lock leaves the mint approval mutable', () => {
    const result = auditCollection({ collection: collection([{ ...blanketLock, fromListId: 'AllWithoutMint' }]) });
    expect(result.findings.some((f) => f.title === mintTitle)).toBe(true);
  });

  it('a Mint-scoped lock silences the mint finding only', () => {
    const result = auditCollection({ collection: collection([{ ...blanketLock, fromListId: 'Mint' }]) });
    expect(result.findings.some((f) => f.title === mintTitle)).toBe(false);
    expect(result.findings.some((f) => f.title === 'Post-mint transfer approvals can be modified')).toBe(true);
  });
});
