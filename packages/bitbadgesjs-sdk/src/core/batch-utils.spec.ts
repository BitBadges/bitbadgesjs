import { BatchTokenDetailsArray } from './batch-utils.js';

// Setup BigInt serialization for Jest
if (typeof BigInt !== 'undefined') {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

describe('BatchTokenDetails', () => {
  it('should create an instance', () => {
    expect(
      BatchTokenDetailsArray.From([
        {
          collectionId: '1',
          tokenIds: [{ start: 1n, end: 10000n }]
        }
      ])
    ).toBeTruthy();
  });

  it('should convert', () => {
    const batchTokenDetails = BatchTokenDetailsArray.From([
      {
        collectionId: '1',
        tokenIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(batchTokenDetails.convert((item) => item.toString())).toBeTruthy();
  });

  it('should add', () => {
    const batchTokenDetails = BatchTokenDetailsArray.From([
      {
        collectionId: '1',
        tokenIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    batchTokenDetails.add([
      {
        collectionId: '1',
        tokenIds: [{ start: 10001n, end: 20000n }]
      }
    ]);

    expect(batchTokenDetails.length).toEqual(1);
    expect(batchTokenDetails[0].tokenIds.length).toEqual(1);
    expect(batchTokenDetails[0].tokenIds[0].start).toEqual(1n);
    expect(batchTokenDetails[0].tokenIds[0].end).toEqual(20000n);
  });

  it('should remove', () => {
    const batchTokenDetails = BatchTokenDetailsArray.From([
      {
        collectionId: '1',
        tokenIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    batchTokenDetails.remove([
      {
        collectionId: '1',
        tokenIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(batchTokenDetails.length).toEqual(0);

    batchTokenDetails.push({
      collectionId: '1',
      tokenIds: [{ start: 1n, end: 10000n }]
    });

    batchTokenDetails.remove([
      {
        collectionId: '1',
        tokenIds: [{ start: 10001n, end: 20000n }]
      }
    ]);

    expect(batchTokenDetails.length).toEqual(1);
  });

  it('should isSubsetOf', () => {
    const batchTokenDetails = BatchTokenDetailsArray.From([
      {
        collectionId: '1',
        tokenIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(
      batchTokenDetails.isSubsetOf([
        {
          collectionId: '1',
          tokenIds: [{ start: 1n, end: 10000n }]
        }
      ])
    ).toBeTruthy();
  });

  it('should is not SubsetOf', () => {
    const batchTokenDetails = BatchTokenDetailsArray.From([
      {
        collectionId: '1',
        tokenIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(
      batchTokenDetails.isSubsetOf([
        {
          collectionId: '1',
          tokenIds: [{ start: 10001n, end: 20000n }]
        }
      ])
    ).toBeFalsy();
  });

  it('should noneIn', () => {
    const batchTokenDetails = BatchTokenDetailsArray.From([
      {
        collectionId: '1',
        tokenIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(
      batchTokenDetails.noneIn([
        {
          collectionId: '1',
          tokenIds: [{ start: 10001n, end: 20000n }]
        }
      ])
    ).toBeTruthy();
  });

  it('should not noneIn', () => {
    const batchTokenDetails = BatchTokenDetailsArray.From([
      {
        collectionId: '1',
        tokenIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(
      batchTokenDetails.noneIn([
        {
          collectionId: '1',
          tokenIds: [{ start: 1n, end: 10000n }]
        }
      ])
    ).toBeFalsy();
  });

  it('should getPage', () => {
    const batchTokenDetails = BatchTokenDetailsArray.From([
      {
        collectionId: '1',
        tokenIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(batchTokenDetails.getPage(1, 25)[0].tokenIds[0].start === 1n).toBeTruthy();
    expect(batchTokenDetails.getPage(1, 25)[0].tokenIds[0].end === 25n).toBeTruthy();
    expect(batchTokenDetails.getPage(1, 25)[0].collectionId === '1').toBeTruthy();
  });

  it('should getPage - newest', () => {
    const batchTokenDetails = BatchTokenDetailsArray.From([
      {
        collectionId: '1',
        tokenIds: [{ start: 1n, end: 10000n }]
      }
    ]);

    expect(batchTokenDetails.getPage(1, 25, 'newest')[0].tokenIds[0].start === 9976n).toBeTruthy();
    expect(batchTokenDetails.getPage(1, 25, 'newest')[0].tokenIds[0].end === 10000n).toBeTruthy();
    expect(batchTokenDetails.getPage(1, 25, 'newest')[0].collectionId === '1').toBeTruthy();
  });
});
