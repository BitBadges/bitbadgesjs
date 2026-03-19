/**
 * Tests for approval-utils.ts
 *
 * Covers: appendAllIncomingTransfersApproval, appendSelfInitiatedIncomingApproval,
 * appendSelfInitiatedOutgoingApproval, getNonMintApprovals, getMintApprovals
 */

import { genTestAddress } from './addressLists.spec.js';
import { AddressList } from './addressLists.js';
import { CollectionApprovalWithDetails, UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails } from './approvals.js';
import {
  appendAllIncomingTransfersApproval,
  appendSelfInitiatedIncomingApproval,
  appendSelfInitiatedOutgoingApproval,
  getNonMintApprovals,
  getMintApprovals
} from './approval-utils.js';
import { UintRange } from './uintRanges.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const makeCollectionApproval = (opts: {
  fromListId?: string;
  toListId?: string;
  approvalId?: string;
}): CollectionApprovalWithDetails<bigint> => {
  const fromListId = opts.fromListId || 'All';
  const toListId = opts.toListId || 'All';

  return new CollectionApprovalWithDetails({
    fromListId,
    toListId,
    initiatedByListId: 'All',
    approvalId: opts.approvalId || 'test-approval',
    fromList: AddressList.getReservedAddressList(fromListId),
    toList: AddressList.getReservedAddressList(toListId),
    initiatedByList: AddressList.AllAddresses(),
    transferTimes: [UintRange.FullRange()],
    tokenIds: [UintRange.FullRange()],
    ownershipTimes: [UintRange.FullRange()],
    version: 0n
  });
};

describe('appendAllIncomingTransfersApproval', () => {
  it('should prepend the all-incoming-transfers approval to empty list', () => {
    const result = appendAllIncomingTransfersApproval([]);
    expect(result.length).toBe(1);
    expect(result[0].approvalId).toBe('all-incoming-transfers');
    expect(result[0].fromListId).toBe('All');
    expect(result[0].initiatedByListId).toBe('All');
  });

  it('should prepend to existing approvals (first position)', () => {
    const existing = [
      new UserIncomingApprovalWithDetails({
        fromListId: 'All',
        fromList: AddressList.AllAddresses(),
        initiatedByList: AddressList.AllAddresses(),
        initiatedByListId: 'All',
        transferTimes: [UintRange.FullRange()],
        ownershipTimes: [UintRange.FullRange()],
        tokenIds: [UintRange.FullRange()],
        approvalId: 'existing-approval',
        version: 0n
      })
    ];

    const result = appendAllIncomingTransfersApproval(existing);
    expect(result.length).toBe(2);
    expect(result[0].approvalId).toBe('all-incoming-transfers');
    expect(result[1].approvalId).toBe('existing-approval');
  });

  it('should have full range transfer/ownership/token times', () => {
    const result = appendAllIncomingTransfersApproval([]);
    const approval = result[0];
    expect(approval.transferTimes[0].start).toBe(1n);
    expect(approval.transferTimes[0].end).toBe(18446744073709551615n);
    expect(approval.ownershipTimes[0].start).toBe(1n);
    expect(approval.tokenIds[0].start).toBe(1n);
  });
});

describe('appendSelfInitiatedIncomingApproval', () => {
  it('should prepend self-initiated-incoming approval with user address', () => {
    const userAddress = genTestAddress();
    const result = appendSelfInitiatedIncomingApproval([], userAddress);
    expect(result.length).toBe(1);
    expect(result[0].approvalId).toBe('self-initiated-incoming');
    expect(result[0].initiatedByListId).toBe(userAddress);
    expect(result[0].fromListId).toBe('All');
  });

  it('should return unmodified list when userAddress is Mint', () => {
    const existing = [
      new UserIncomingApprovalWithDetails({
        fromListId: 'All',
        fromList: AddressList.AllAddresses(),
        initiatedByList: AddressList.AllAddresses(),
        initiatedByListId: 'All',
        transferTimes: [UintRange.FullRange()],
        ownershipTimes: [UintRange.FullRange()],
        tokenIds: [UintRange.FullRange()],
        approvalId: 'existing',
        version: 0n
      })
    ];

    const result = appendSelfInitiatedIncomingApproval(existing, 'Mint');
    expect(result.length).toBe(1);
    expect(result[0].approvalId).toBe('existing');
  });

  it('should return unmodified list when userAddress is Total', () => {
    const result = appendSelfInitiatedIncomingApproval([], 'Total');
    expect(result.length).toBe(0);
  });

  it('should prepend to front of existing approvals', () => {
    const userAddress = genTestAddress();
    const existing = [
      new UserIncomingApprovalWithDetails({
        fromListId: 'All',
        fromList: AddressList.AllAddresses(),
        initiatedByList: AddressList.AllAddresses(),
        initiatedByListId: 'All',
        transferTimes: [UintRange.FullRange()],
        ownershipTimes: [UintRange.FullRange()],
        tokenIds: [UintRange.FullRange()],
        approvalId: 'after',
        version: 0n
      })
    ];

    const result = appendSelfInitiatedIncomingApproval(existing, userAddress);
    expect(result.length).toBe(2);
    expect(result[0].approvalId).toBe('self-initiated-incoming');
    expect(result[1].approvalId).toBe('after');
  });
});

describe('appendSelfInitiatedOutgoingApproval', () => {
  it('should prepend self-initiated-outgoing approval with user address', () => {
    const userAddress = genTestAddress();
    const result = appendSelfInitiatedOutgoingApproval([], userAddress);
    expect(result.length).toBe(1);
    expect(result[0].approvalId).toBe('self-initiated-outgoing');
    expect(result[0].initiatedByListId).toBe(userAddress);
    expect(result[0].toListId).toBe('All');
  });

  it('should return unmodified list when userAddress is Mint', () => {
    const result = appendSelfInitiatedOutgoingApproval([], 'Mint');
    expect(result.length).toBe(0);
  });

  it('should return unmodified list when userAddress is Total', () => {
    const result = appendSelfInitiatedOutgoingApproval([], 'Total');
    expect(result.length).toBe(0);
  });

  it('should prepend to front of existing approvals', () => {
    const userAddress = genTestAddress();
    const existing = [
      new UserOutgoingApprovalWithDetails({
        toListId: 'All',
        initiatedByListId: 'All',
        toList: AddressList.AllAddresses(),
        initiatedByList: AddressList.AllAddresses(),
        transferTimes: [UintRange.FullRange()],
        ownershipTimes: [UintRange.FullRange()],
        tokenIds: [UintRange.FullRange()],
        approvalId: 'existing-outgoing',
        version: 0n
      })
    ];

    const result = appendSelfInitiatedOutgoingApproval(existing, userAddress);
    expect(result.length).toBe(2);
    expect(result[0].approvalId).toBe('self-initiated-outgoing');
    expect(result[1].approvalId).toBe('existing-outgoing');
  });
});

describe('getNonMintApprovals', () => {
  it('should return approvals that do not have Mint in fromList', () => {
    const approvals = [
      makeCollectionApproval({ fromListId: 'All', approvalId: 'all-approval' }),
      makeCollectionApproval({ fromListId: 'Mint', approvalId: 'mint-only' })
    ];

    const result = getNonMintApprovals(approvals);

    // 'All' includes Mint, so it gets changed to '!Mint'
    // 'Mint' only includes Mint, so it gets removed
    expect(result.length).toBe(1);
    expect(result[0].fromListId).toBe('!Mint');
  });

  it('should return empty array when all approvals are Mint-only', () => {
    const approvals = [makeCollectionApproval({ fromListId: 'Mint', approvalId: 'mint-only' })];

    const result = getNonMintApprovals(approvals);
    expect(result.length).toBe(0);
  });

  it('should pass through approvals that do not include Mint', () => {
    const addr = genTestAddress();
    const approval = new CollectionApprovalWithDetails({
      fromListId: addr,
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'non-mint',
      fromList: new AddressList({
        listId: addr,
        addresses: [addr],
        whitelist: true,
        uri: '',
        customData: ''
      }),
      toList: AddressList.AllAddresses(),
      initiatedByList: AddressList.AllAddresses(),
      transferTimes: [UintRange.FullRange()],
      tokenIds: [UintRange.FullRange()],
      ownershipTimes: [UintRange.FullRange()],
      version: 0n
    });

    const result = getNonMintApprovals([approval]);
    expect(result.length).toBe(1);
    expect(result[0].approvalId).toBe('non-mint');
  });

  it('should handle empty input', () => {
    const result = getNonMintApprovals([]);
    expect(result.length).toBe(0);
  });
});

describe('getMintApprovals', () => {
  it('should return only approvals that have Mint in fromList', () => {
    const approvals = [
      makeCollectionApproval({ fromListId: 'All', approvalId: 'includes-mint' }),
      makeCollectionApproval({ fromListId: 'Mint', approvalId: 'mint-only' })
    ];

    const result = getMintApprovals(approvals);

    // 'All' includes Mint => returned with fromListId = 'Mint'
    // 'Mint' includes Mint => returned with fromListId = 'Mint'
    expect(result.length).toBe(2);
    for (const r of result) {
      expect(r.fromListId).toBe('Mint');
    }
  });

  it('should return empty array when no approvals include Mint', () => {
    const addr = genTestAddress();
    const approval = new CollectionApprovalWithDetails({
      fromListId: addr,
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'no-mint',
      fromList: new AddressList({
        listId: addr,
        addresses: [addr],
        whitelist: true,
        uri: '',
        customData: ''
      }),
      toList: AddressList.AllAddresses(),
      initiatedByList: AddressList.AllAddresses(),
      transferTimes: [UintRange.FullRange()],
      tokenIds: [UintRange.FullRange()],
      ownershipTimes: [UintRange.FullRange()],
      version: 0n
    });

    const result = getMintApprovals([approval]);
    expect(result.length).toBe(0);
  });

  it('should handle empty input', () => {
    const result = getMintApprovals([]);
    expect(result.length).toBe(0);
  });
});
