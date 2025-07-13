import { ApprovalCriteria, OutgoingApprovalCriteria, IncomingApprovalCriteria, DynamicStoreChallenge } from './approvals.js';
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
