import { ApprovalCriteria, OutgoingApprovalCriteria, IncomingApprovalCriteria, DynamicStoreChallenge, CollectionApproval } from './approvals.js';
import { ETHSignatureChallenge } from './misc.js';
import { BigIntify, Stringify } from '../common/string-numbers.js';

describe('DynamicStoreChallenges', () => {
  it('should create DynamicStoreChallenge instances', () => {
    const challenge = new DynamicStoreChallenge({
      storeId: 123n
    });

    expect(challenge.storeId).toBe(123n);
    expect(challenge.toProto().storeId).toBe('123');
  });

  it('should convert DynamicStoreChallenge between number types', () => {
    const challenge = new DynamicStoreChallenge({
      storeId: 123n
    });

    const converted = challenge.convert(Stringify);
    expect(converted.storeId).toBe('123');
  });

  it('should include dynamicStoreChallenges in ApprovalCriteria', () => {
    const criteria = new ApprovalCriteria({
      dynamicStoreChallenges: [{ storeId: 1n }, { storeId: 2n }]
    });

    expect(criteria.dynamicStoreChallenges).toHaveLength(2);
    expect(criteria.dynamicStoreChallenges![0].storeId).toBe(1n);
    expect(criteria.dynamicStoreChallenges![1].storeId).toBe(2n);
  });

  it('should include dynamicStoreChallenges in OutgoingApprovalCriteria', () => {
    const criteria = new OutgoingApprovalCriteria({
      dynamicStoreChallenges: [{ storeId: 1n }, { storeId: 2n }]
    });

    expect(criteria.dynamicStoreChallenges).toHaveLength(2);
    expect(criteria.dynamicStoreChallenges![0].storeId).toBe(1n);
    expect(criteria.dynamicStoreChallenges![1].storeId).toBe(2n);
  });

  it('should include dynamicStoreChallenges in IncomingApprovalCriteria', () => {
    const criteria = new IncomingApprovalCriteria({
      dynamicStoreChallenges: [{ storeId: 1n }, { storeId: 2n }]
    });

    expect(criteria.dynamicStoreChallenges).toHaveLength(2);
    expect(criteria.dynamicStoreChallenges![0].storeId).toBe(1n);
    expect(criteria.dynamicStoreChallenges![1].storeId).toBe(2n);
  });

  it('should convert approval criteria with dynamicStoreChallenges', () => {
    const criteria = new ApprovalCriteria({
      dynamicStoreChallenges: [{ storeId: 1n }, { storeId: 2n }]
    });

    const converted = criteria.convert(Stringify);
    expect(converted.dynamicStoreChallenges).toHaveLength(2);
    expect(converted.dynamicStoreChallenges![0].storeId).toBe('1');
    expect(converted.dynamicStoreChallenges![1].storeId).toBe('2');
  });

  it('should cast OutgoingApprovalCriteria to ApprovalCriteria with dynamicStoreChallenges', () => {
    const outgoingCriteria = new OutgoingApprovalCriteria({
      dynamicStoreChallenges: [{ storeId: 1n }, { storeId: 2n }]
    });

    const casted = outgoingCriteria.castToCollectionApprovalCriteria();
    expect(casted.dynamicStoreChallenges).toHaveLength(2);
    expect(casted.dynamicStoreChallenges![0].storeId).toBe(1n);
    expect(casted.dynamicStoreChallenges![1].storeId).toBe(2n);
  });

  it('should cast IncomingApprovalCriteria to ApprovalCriteria with dynamicStoreChallenges', () => {
    const incomingCriteria = new IncomingApprovalCriteria({
      dynamicStoreChallenges: [{ storeId: 1n }, { storeId: 2n }]
    });

    const casted = incomingCriteria.castToCollectionApprovalCriteria();
    expect(casted.dynamicStoreChallenges).toHaveLength(2);
    expect(casted.dynamicStoreChallenges![0].storeId).toBe(1n);
    expect(casted.dynamicStoreChallenges![1].storeId).toBe(2n);
  });
});

describe('ETHSignatureChallenges', () => {
  it('should create ETHSignatureChallenge instances', () => {
    const ethSignatureChallenge = new ETHSignatureChallenge({
      signer: '0x1234567890123456789012345678901234567890',
      challengeTrackerId: 'test-tracker',
      uri: 'https://example.com',
      customData: 'test-data'
    });

    expect(ethSignatureChallenge.signer).toBe('0x1234567890123456789012345678901234567890');
    expect(ethSignatureChallenge.challengeTrackerId).toBe('test-tracker');
    expect(ethSignatureChallenge.uri).toBe('https://example.com');
    expect(ethSignatureChallenge.customData).toBe('test-data');
  });

  it('should convert ETHSignatureChallenge between number types', () => {
    const ethSignatureChallenge = new ETHSignatureChallenge({
      signer: '0x1234567890123456789012345678901234567890',
      challengeTrackerId: 'test-tracker',
      uri: 'https://example.com',
      customData: 'test-data'
    });

    // ETHSignatureChallenge doesn't have number fields, so conversion should be a no-op
    const converted = ethSignatureChallenge.convert(BigIntify);
    expect(converted.signer).toBe('0x1234567890123456789012345678901234567890');
    expect(converted.challengeTrackerId).toBe('test-tracker');
    expect(converted.uri).toBe('https://example.com');
    expect(converted.customData).toBe('test-data');
  });

  it('should include ethSignatureChallenges in ApprovalCriteria', () => {
    const approvalCriteria = new ApprovalCriteria({
      ethSignatureChallenges: [
        new ETHSignatureChallenge({
          signer: '0x1234567890123456789012345678901234567890',
          challengeTrackerId: 'test-tracker',
          uri: 'https://example.com',
          customData: 'test-data'
        })
      ]
    });

    expect(approvalCriteria.ethSignatureChallenges).toBeDefined();
    expect(approvalCriteria.ethSignatureChallenges?.length).toBe(1);
    expect(approvalCriteria.ethSignatureChallenges?.[0].signer).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should include ethSignatureChallenges in OutgoingApprovalCriteria', () => {
    const outgoingApprovalCriteria = new OutgoingApprovalCriteria({
      ethSignatureChallenges: [
        new ETHSignatureChallenge({
          signer: '0x1234567890123456789012345678901234567890',
          challengeTrackerId: 'test-tracker',
          uri: 'https://example.com',
          customData: 'test-data'
        })
      ]
    });

    expect(outgoingApprovalCriteria.ethSignatureChallenges).toBeDefined();
    expect(outgoingApprovalCriteria.ethSignatureChallenges?.length).toBe(1);
    expect(outgoingApprovalCriteria.ethSignatureChallenges?.[0].signer).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should include ethSignatureChallenges in IncomingApprovalCriteria', () => {
    const incomingApprovalCriteria = new IncomingApprovalCriteria({
      ethSignatureChallenges: [
        new ETHSignatureChallenge({
          signer: '0x1234567890123456789012345678901234567890',
          challengeTrackerId: 'test-tracker',
          uri: 'https://example.com',
          customData: 'test-data'
        })
      ]
    });

    expect(incomingApprovalCriteria.ethSignatureChallenges).toBeDefined();
    expect(incomingApprovalCriteria.ethSignatureChallenges?.length).toBe(1);
    expect(incomingApprovalCriteria.ethSignatureChallenges?.[0].signer).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should convert approval criteria with ethSignatureChallenges', () => {
    const approvalCriteria = new ApprovalCriteria({
      ethSignatureChallenges: [
        new ETHSignatureChallenge({
          signer: '0x1234567890123456789012345678901234567890',
          challengeTrackerId: 'test-tracker',
          uri: 'https://example.com',
          customData: 'test-data'
        })
      ]
    });

    const converted = approvalCriteria.convert(BigIntify);
    expect(converted.ethSignatureChallenges).toBeDefined();
    expect(converted.ethSignatureChallenges?.length).toBe(1);
    expect(converted.ethSignatureChallenges?.[0].signer).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should cast OutgoingApprovalCriteria to ApprovalCriteria with ethSignatureChallenges', () => {
    const outgoingApprovalCriteria = new OutgoingApprovalCriteria({
      ethSignatureChallenges: [
        new ETHSignatureChallenge({
          signer: '0x1234567890123456789012345678901234567890',
          challengeTrackerId: 'test-tracker',
          uri: 'https://example.com',
          customData: 'test-data'
        })
      ]
    });

    const approvalCriteria = outgoingApprovalCriteria.castToCollectionApprovalCriteria();
    expect(approvalCriteria.ethSignatureChallenges).toBeDefined();
    expect(approvalCriteria.ethSignatureChallenges?.length).toBe(1);
    expect(approvalCriteria.ethSignatureChallenges?.[0].signer).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should cast IncomingApprovalCriteria to ApprovalCriteria with ethSignatureChallenges', () => {
    const incomingApprovalCriteria = new IncomingApprovalCriteria({
      ethSignatureChallenges: [
        new ETHSignatureChallenge({
          signer: '0x1234567890123456789012345678901234567890',
          challengeTrackerId: 'test-tracker',
          uri: 'https://example.com',
          customData: 'test-data'
        })
      ]
    });

    const approvalCriteria = incomingApprovalCriteria.castToCollectionApprovalCriteria();
    expect(approvalCriteria.ethSignatureChallenges).toBeDefined();
    expect(approvalCriteria.ethSignatureChallenges?.length).toBe(1);
    expect(approvalCriteria.ethSignatureChallenges?.[0].signer).toBe('0x1234567890123456789012345678901234567890');
  });
});

/**
 * allowBackedMinting guardrail documentation tests (backlog #0101)
 *
 * These tests document the chain-enforced validation rules for ApprovalCriteria
 * when allowBackedMinting is true. The SDK freely constructs these objects — the
 * guardrails are enforced on-chain at tx submission. Comments describe what the
 * chain will accept or reject.
 *
 * Chain rules (enforced server-side):
 *   - allowBackedMinting: true requires mustPrioritize: true
 *   - Exactly one of fromListId or toListId must be set to the exact backing address
 *     (not "All", not a combined list)
 *   - Backing pattern  : fromListId = backingAddress, toListId = "All"
 *   - Unbacking pattern: fromListId = "!Mint:<backingAddress>", toListId = backingAddress
 *   - Any other combination is rejected by the chain
 */
describe('allowBackedMinting guardrails', () => {
  const backingAddress = 'cosmos1abcdefghijklmnopqrstuvwxyz0123456789ab';

  it('case 1 (INVALID per chain): allowBackedMinting true with mustPrioritize false — chain rejects this', () => {
    // Chain rule: allowBackedMinting requires mustPrioritize to be true.
    // Without mustPrioritize the approval can be bypassed by ordering, so the
    // chain refuses to accept such a transaction.
    const criteria = new ApprovalCriteria({
      allowBackedMinting: true,
      mustPrioritize: false
    });

    expect(criteria.allowBackedMinting).toBe(true);
    expect(criteria.mustPrioritize).toBe(false);
    // Document the invalid combination — chain will reject this approval.
  });

  it('case 2 (VALID): backing pattern — fromListId = backingAddress, toListId = "All"', () => {
    // This is the canonical minting (backing) pattern.
    // The backing address mints tokens outward to any recipient.
    // Chain accepts: allowBackedMinting=true, mustPrioritize=true,
    //   fromListId = exact backing address, toListId = "All".
    const criteria = new ApprovalCriteria({
      allowBackedMinting: true,
      mustPrioritize: true
    });

    const approval = new CollectionApproval({
      fromListId: backingAddress,
      toListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [],
      tokenIds: [],
      ownershipTimes: [],
      approvalId: 'backed-minting-approval',
      version: 0n,
      approvalCriteria: criteria
    });

    expect(approval.approvalCriteria?.allowBackedMinting).toBe(true);
    expect(approval.approvalCriteria?.mustPrioritize).toBe(true);
    expect(approval.fromListId).toBe(backingAddress);
    expect(approval.toListId).toBe('All');
    // Chain accepts this combination — backing address sends to anyone.
  });

  it('case 3 (VALID): unbacking pattern — fromListId = "!Mint:<backingAddress>", toListId = backingAddress', () => {
    // This is the canonical redeeming (unbacking) pattern.
    // Any non-Mint address returns tokens to the backing address.
    // Chain accepts: allowBackedMinting=true, mustPrioritize=true,
    //   fromListId = "!Mint:<backingAddress>" (all except Mint + backing), toListId = exact backing address.
    const fromListId = `!Mint:${backingAddress}`;

    const criteria = new ApprovalCriteria({
      allowBackedMinting: true,
      mustPrioritize: true
    });

    const approval = new CollectionApproval({
      fromListId: fromListId,
      toListId: backingAddress,
      initiatedByListId: 'All',
      transferTimes: [],
      tokenIds: [],
      ownershipTimes: [],
      approvalId: 'backed-unbacking-approval',
      version: 0n,
      approvalCriteria: criteria
    });

    expect(approval.approvalCriteria?.allowBackedMinting).toBe(true);
    expect(approval.approvalCriteria?.mustPrioritize).toBe(true);
    expect(approval.fromListId).toBe(fromListId);
    expect(approval.toListId).toBe(backingAddress);
    // Chain accepts this combination — anyone (except Mint/backing) sends back to backing address.
  });

  it('case 4 (INVALID per chain): fromListId = "All", toListId = "All" — neither is exact backing address', () => {
    // Chain rule: exactly one of fromListId or toListId must equal the exact backing address.
    // When both are "All" the backing address is not identified, so the chain rejects this.
    const criteria = new ApprovalCriteria({
      allowBackedMinting: true,
      mustPrioritize: true
    });

    const approval = new CollectionApproval({
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [],
      tokenIds: [],
      ownershipTimes: [],
      approvalId: 'backed-minting-invalid-all',
      version: 0n,
      approvalCriteria: criteria
    });

    expect(approval.approvalCriteria?.allowBackedMinting).toBe(true);
    expect(approval.approvalCriteria?.mustPrioritize).toBe(true);
    expect(approval.fromListId).toBe('All');
    expect(approval.toListId).toBe('All');
    // Document the invalid combination — chain will reject this approval because
    // neither list is pinned to the exact backing address.
  });

  it('case 5 (INVALID per chain): fromListId = backingAddress, toListId = backingAddress — both are backing address', () => {
    // Chain rule: exactly ONE of fromListId/toListId should be the backing address, not both.
    // If both equal the backing address the approval is ambiguous (backing or unbacking?)
    // and the chain rejects it.
    const criteria = new ApprovalCriteria({
      allowBackedMinting: true,
      mustPrioritize: true
    });

    const approval = new CollectionApproval({
      fromListId: backingAddress,
      toListId: backingAddress,
      initiatedByListId: 'All',
      transferTimes: [],
      tokenIds: [],
      ownershipTimes: [],
      approvalId: 'backed-minting-invalid-both',
      version: 0n,
      approvalCriteria: criteria
    });

    expect(approval.approvalCriteria?.allowBackedMinting).toBe(true);
    expect(approval.approvalCriteria?.mustPrioritize).toBe(true);
    expect(approval.fromListId).toBe(backingAddress);
    expect(approval.toListId).toBe(backingAddress);
    // Document the invalid combination — chain will reject this approval because
    // both lists are the backing address (ambiguous direction).
  });
});
