import { QueueDoc } from './docs.js';

const base = {
  _docId: 'collection-index:1',
  uri: 'collection-index:1',
  collectionId: '1',
  loadBalanceId: '0',
  refreshRequestTime: '100',
  numRetries: '0'
};
describe('QueueDoc claim and lease serialization', () => {
  it('preserves generation and claim identity while converting lease timestamps exactly', () => {
    const doc = new QueueDoc({ ...base, queueGeneration: 'generation-2', queueClaimId: 'claim-3', queueLeaseUntil: '9007199254740993' }).convert(
      BigInt
    );
    expect(doc).toMatchObject({ queueGeneration: 'generation-2', queueClaimId: 'claim-3', queueLeaseUntil: 9007199254740993n });
    expect(doc.convert(String)).toMatchObject({ queueGeneration: 'generation-2', queueClaimId: 'claim-3', queueLeaseUntil: '9007199254740993' });
  });
  it('keeps lease fields optional for older queue records', () => {
    const doc = new QueueDoc(base).convert(BigInt);
    expect(doc).toMatchObject({ refreshRequestTime: 100n, numRetries: 0n });
    expect(doc.queueGeneration).toBeUndefined();
    expect(doc.queueClaimId).toBeUndefined();
    expect(doc.queueLeaseUntil).toBeUndefined();
  });
});
