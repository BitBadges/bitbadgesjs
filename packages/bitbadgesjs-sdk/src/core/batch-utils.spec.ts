import { BatchBadgeDetailsArray } from './batch-utils.js';

// Setup BigInt serialization for Jest
if (typeof BigInt !== 'undefined') {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

describe('BatchBadgeDetails', () => {
  it('should create an instance', () => {
    expect(
      BatchBadgeDetailsArray.From<bigint>([
        {
          collectionId: '1',
          badgeIds: [{ start: 1n, end: 10000n }]
        }
      ])
    ).toBeTruthy();
  });

  it('should convert', () => {
    const batchBadgeDetails = BatchBadgeDetailsArray.From<bigint>([
      {
        collectionId: '1',
        badgeIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(batchBadgeDetails.convert((item) => item.toString())).toBeTruthy();
  });

  it('should add', () => {
    const batchBadgeDetails = BatchBadgeDetailsArray.From<bigint>([
      {
        collectionId: '1',
        badgeIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    batchBadgeDetails.add([
      {
        collectionId: '1',
        badgeIds: [{ start: 10001n, end: 20000n }]
      }
    ]);

    expect(batchBadgeDetails.length).toEqual(1);
    expect(batchBadgeDetails[0].badgeIds.length).toEqual(1);
    expect(batchBadgeDetails[0].badgeIds[0].start).toEqual(1n);
    expect(batchBadgeDetails[0].badgeIds[0].end).toEqual(20000n);
  });

  it('should remove', () => {
    const batchBadgeDetails = BatchBadgeDetailsArray.From<bigint>([
      {
        collectionId: '1',
        badgeIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    batchBadgeDetails.remove([
      {
        collectionId: '1',
        badgeIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(batchBadgeDetails.length).toEqual(0);

    batchBadgeDetails.push({
      collectionId: '1',
      badgeIds: [{ start: 1n, end: 10000n }]
    });

    batchBadgeDetails.remove([
      {
        collectionId: '1',
        badgeIds: [{ start: 10001n, end: 20000n }]
      }
    ]);

    expect(batchBadgeDetails.length).toEqual(1);
  });

  it('should isSubsetOf', () => {
    const batchBadgeDetails = BatchBadgeDetailsArray.From<bigint>([
      {
        collectionId: '1',
        badgeIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(
      batchBadgeDetails.isSubsetOf([
        {
          collectionId: '1',
          badgeIds: [{ start: 1n, end: 10000n }]
        }
      ])
    ).toBeTruthy();
  });

  it('should is not SubsetOf', () => {
    const batchBadgeDetails = BatchBadgeDetailsArray.From<bigint>([
      {
        collectionId: '1',
        badgeIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(
      batchBadgeDetails.isSubsetOf([
        {
          collectionId: '1',
          badgeIds: [{ start: 10001n, end: 20000n }]
        }
      ])
    ).toBeFalsy();
  });

  it('should noneIn', () => {
    const batchBadgeDetails = BatchBadgeDetailsArray.From<bigint>([
      {
        collectionId: '1',
        badgeIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(
      batchBadgeDetails.noneIn([
        {
          collectionId: '1',
          badgeIds: [{ start: 10001n, end: 20000n }]
        }
      ])
    ).toBeTruthy();
  });

  it('should not noneIn', () => {
    const batchBadgeDetails = BatchBadgeDetailsArray.From<bigint>([
      {
        collectionId: '1',
        badgeIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(
      batchBadgeDetails.noneIn([
        {
          collectionId: '1',
          badgeIds: [{ start: 1n, end: 10000n }]
        }
      ])
    ).toBeFalsy();
  });

  it('should getPage', () => {
    const batchBadgeDetails = BatchBadgeDetailsArray.From<bigint>([
      {
        collectionId: '1',
        badgeIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(batchBadgeDetails.getPage(1, 25)[0].badgeIds[0].start === 1n).toBeTruthy();
    expect(batchBadgeDetails.getPage(1, 25)[0].badgeIds[0].end === 25n).toBeTruthy();
    expect(batchBadgeDetails.getPage(1, 25)[0].collectionId === '1').toBeTruthy();
  });

  it('should getPage - newest', () => {
    const batchBadgeDetails = BatchBadgeDetailsArray.From<bigint>([
      {
        collectionId: '1',
        badgeIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(batchBadgeDetails.getPage(1, 25, 'newest')[0].badgeIds[0].start === 9976n).toBeTruthy();
    expect(batchBadgeDetails.getPage(1, 25, 'newest')[0].badgeIds[0].end === 10000n).toBeTruthy();
    expect(batchBadgeDetails.getPage(1, 25, 'newest')[0].collectionId === '1').toBeTruthy();
  });
});
