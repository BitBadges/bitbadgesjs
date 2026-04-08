import { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import { GO_MAX_UINT_64 } from '@/common/math.js';

export interface AuctionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateAuctionCollection = (collection: Readonly<iCollectionDoc<bigint>>): AuctionValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Standard includes "Auction"
  if (!collection.standards?.includes('Auction')) errors.push('Missing "Auction" standard');

  // 2. validTokenIds = exactly [{1,1}]
  const vt = collection.validTokenIds;
  if (!vt || vt.length !== 1 || vt[0].start !== 1n || vt[0].end !== 1n) {
    errors.push('validTokenIds must be exactly [{start: 1, end: 1}]');
  }

  // 3. 1-2 approvals (mint-to-winner + optional burn)
  const approvals = collection.collectionApprovals;
  if (approvals.length === 0 || approvals.length > 2) {
    errors.push(`Expected 1-2 approvals, found ${approvals.length}`);
  }

  // 4. Find mint-to-winner approval
  const mintApproval = approvals.find((a) => a.fromListId === 'Mint');
  if (!mintApproval) {
    errors.push('Missing mint-to-winner approval (fromListId: "Mint")');
    return { valid: false, errors, warnings };
  }

  const ac = mintApproval.approvalCriteria;

  // 5. maxNumTransfers = 1
  if (!ac?.maxNumTransfers || ac.maxNumTransfers.overallMaxNumTransfers !== 1n) {
    errors.push('Mint-to-winner overallMaxNumTransfers must be 1');
  }

  // 6. overridesFromOutgoingApprovals
  if (!ac?.overridesFromOutgoingApprovals) {
    errors.push('Mint-to-winner must have overridesFromOutgoingApprovals=true');
  }

  // 7. initiatedByListId != 'All' (restricted seller)
  if (mintApproval.initiatedByListId === 'All') {
    errors.push('Mint-to-winner initiatedByListId must restrict to seller (not "All")');
  }

  // 8. transferTimes must be bounded (not GO_MAX_UINT_64)
  const tt = mintApproval.transferTimes;
  if (tt && tt.length > 0) {
    const end = tt[0].end;
    if (end >= GO_MAX_UINT_64) {
      errors.push('Mint-to-winner transferTimes must have a bounded end date (not max uint64)');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const doesCollectionFollowAuctionProtocol = (collection: Readonly<iCollectionDoc<bigint>>): boolean => {
  return validateAuctionCollection(collection).valid;
};
