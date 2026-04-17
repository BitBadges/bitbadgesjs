/**
 * Tests for `verify_ownership` — focused on the shorthand expansion path
 * restored by backlog #0225.
 *
 * The handler makes one network call via `apiClient.verifyOwnership`. We
 * mock that module to capture the `assetOwnershipRequirements` payload and
 * assert the shorthand collapses to the exact `AssetConditionGroup` shape
 * the API expects. No real network traffic.
 */

import { verifyOwnershipSchema, handleVerifyOwnership } from './verifyOwnership.js';

const verifyOwnershipMock = jest.fn();

jest.mock('../../sdk/apiClient.js', () => ({
  verifyOwnership: (req: unknown) => verifyOwnershipMock(req)
}));

describe('verify_ownership — schema', () => {
  it('accepts the bare shorthand: address + collectionId', () => {
    const parsed = verifyOwnershipSchema.safeParse({
      address: 'bb1abcxyz',
      collectionId: '42'
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts full shorthand: collectionId + tokenId + tokenIdEnd + minAmount', () => {
    const parsed = verifyOwnershipSchema.safeParse({
      address: 'bb1abcxyz',
      collectionId: '42',
      tokenId: '1',
      tokenIdEnd: '10',
      minAmount: '5'
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts the advanced form: address + requirements JSON string', () => {
    const parsed = verifyOwnershipSchema.safeParse({
      address: 'bb1abcxyz',
      requirements: '{"assets":[]}'
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a call with neither collectionId nor requirements', () => {
    const parsed = verifyOwnershipSchema.safeParse({
      address: 'bb1abcxyz'
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toMatch(/collectionId.*requirements|requirements.*collectionId/);
    }
  });

  it('rejects a call missing address', () => {
    const parsed = verifyOwnershipSchema.safeParse({
      collectionId: '42'
    });
    expect(parsed.success).toBe(false);
  });
});

describe('verify_ownership — handler shorthand expansion', () => {
  beforeEach(() => {
    verifyOwnershipMock.mockReset();
    verifyOwnershipMock.mockResolvedValue({
      success: true,
      data: { verified: true, details: { mocked: true } }
    });
  });

  it('collectionId only → expands to tokenIds [1,1], amountRange [1, MAX], ownershipTimes [1, MAX]', async () => {
    const res = await handleVerifyOwnership({
      address: 'bb1abcxyzabcxyzabcxyzabcxyzabcxyz',
      collectionId: '42'
    });

    expect(res.success).toBe(true);
    expect(res.verified).toBe(true);
    expect(verifyOwnershipMock).toHaveBeenCalledTimes(1);

    const [callArg] = verifyOwnershipMock.mock.calls[0];
    expect(callArg.assetOwnershipRequirements).toEqual({
      assets: [
        {
          collectionId: '42',
          tokenIds: [{ start: '1', end: '1' }],
          ownershipTimes: [{ start: '1', end: '18446744073709551615' }],
          amountRange: { start: '1', end: '18446744073709551615' }
        }
      ]
    });
  });

  it('explicit tokenId/minAmount override the defaults', async () => {
    await handleVerifyOwnership({
      address: 'bb1abcxyzabcxyzabcxyzabcxyzabcxyz',
      collectionId: '42',
      tokenId: '7',
      minAmount: '5'
    });

    const [callArg] = verifyOwnershipMock.mock.calls[0];
    expect(callArg.assetOwnershipRequirements.assets[0]).toMatchObject({
      collectionId: '42',
      tokenIds: [{ start: '7', end: '7' }],
      amountRange: { start: '5', end: '18446744073709551615' }
    });
  });

  it('tokenIdEnd specifies a token range', async () => {
    await handleVerifyOwnership({
      address: 'bb1abcxyzabcxyzabcxyzabcxyzabcxyz',
      collectionId: '99',
      tokenId: '1',
      tokenIdEnd: '100'
    });

    const [callArg] = verifyOwnershipMock.mock.calls[0];
    expect(callArg.assetOwnershipRequirements.assets[0].tokenIds).toEqual([
      { start: '1', end: '100' }
    ]);
  });

  it('advanced `requirements` JSON is parsed and passed through unchanged', async () => {
    const advanced = {
      $and: [
        {
          assets: [
            {
              collectionId: '1',
              tokenIds: [{ start: '1', end: '1' }],
              ownershipTimes: [{ start: '1', end: '18446744073709551615' }],
              amountRange: { start: '1', end: '18446744073709551615' }
            }
          ]
        }
      ]
    };

    await handleVerifyOwnership({
      address: 'bb1abcxyzabcxyzabcxyzabcxyzabcxyz',
      requirements: JSON.stringify(advanced)
    });

    const [callArg] = verifyOwnershipMock.mock.calls[0];
    expect(callArg.assetOwnershipRequirements).toEqual(advanced);
  });

  it('when both `requirements` and `collectionId` are set, `requirements` wins', async () => {
    const advanced = { assets: [{ collectionId: '999', tokenIds: [], ownershipTimes: [], amountRange: { start: '0', end: '0' } }] };
    await handleVerifyOwnership({
      address: 'bb1abcxyzabcxyzabcxyzabcxyzabcxyz',
      collectionId: '42',
      requirements: JSON.stringify(advanced)
    });

    const [callArg] = verifyOwnershipMock.mock.calls[0];
    // `requirements` takes precedence — collectionId=42 shorthand NOT expanded.
    expect(callArg.assetOwnershipRequirements).toEqual(advanced);
  });

  it('malformed `requirements` JSON returns an error without making the API call', async () => {
    const res = await handleVerifyOwnership({
      address: 'bb1abcxyzabcxyzabcxyzabcxyzabcxyz',
      requirements: 'not-valid-json{'
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Invalid JSON/);
    expect(verifyOwnershipMock).not.toHaveBeenCalled();
  });

  it('neither shorthand nor requirements → error, no API call', async () => {
    const res = await handleVerifyOwnership({
      address: 'bb1abcxyzabcxyzabcxyzabcxyzabcxyz'
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/collectionId.*requirements|requirements.*collectionId/);
    expect(verifyOwnershipMock).not.toHaveBeenCalled();
  });

  it('surfaces API-layer errors back to the caller', async () => {
    verifyOwnershipMock.mockResolvedValue({
      success: false,
      error: 'BITBADGES_API_KEY environment variable not set. Set it to use API query tools.'
    });

    const res = await handleVerifyOwnership({
      address: 'bb1abcxyzabcxyzabcxyzabcxyzabcxyz',
      collectionId: '42'
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/BITBADGES_API_KEY/);
  });
});
