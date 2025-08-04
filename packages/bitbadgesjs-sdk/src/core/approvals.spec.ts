import { ApprovalCriteria, OutgoingApprovalCriteria, IncomingApprovalCriteria, DynamicStoreChallenge } from './approvals.js';
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
