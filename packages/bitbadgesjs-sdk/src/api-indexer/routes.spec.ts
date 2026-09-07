import { BitBadgesAPI } from './BitBadgesApi';
import { BitBadgesApiRoutes } from './requests/routes';

/**
 * These two routes were wrong against the live indexer: `getPlugin` built a
 * path the API answers with 404, and `checkClaimSuccess` called a route the
 * indexer removed. Both are exercised by the frontend, so pin the shapes.
 */
describe('BitBadgesApiRoutes', () => {
  it('builds the singular plugin path the indexer serves', () => {
    // The indexer registers `/api/:version/plugin/:pluginId`; the plural form
    // is only used for search, fetch, create, update and delete.
    expect(BitBadgesApiRoutes.GetPluginRoute('my-plugin')).toBe('/api/v0/plugin/my-plugin');
  });

  it('no longer exposes a builder for the removed claim-success route', () => {
    expect((BitBadgesApiRoutes as unknown as Record<string, unknown>).CheckClaimSuccessRoute).toBeUndefined();
  });
});

describe('checkClaimSuccess', () => {
  const api = new BitBadgesAPI<bigint>({ apiKey: 'test', convertFunction: (x: unknown) => BigInt(x as string) } as any);

  it('reads the successful attempts for one address', async () => {
    const getClaimAttempts = jest.spyOn(api, 'getClaimAttempts').mockResolvedValue({
      docs: [{ claimNumber: 0 }, { claimNumber: 3 }],
      total: 2
    } as any);

    const res = await api.checkClaimSuccess('claim-1', 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d');

    expect(getClaimAttempts).toHaveBeenCalledWith('claim-1', { address: 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d' });
    expect(res.successCount).toBe(2);
    expect(res.claimNumbers).toEqual([0, 3]);
  });

  it('reports no successes when the address has none', async () => {
    jest.spyOn(api, 'getClaimAttempts').mockResolvedValue({ docs: [], total: 0 } as any);
    const res = await api.checkClaimSuccess('claim-1', 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d');
    expect(res.successCount).toBe(0);
    expect(res.claimNumbers).toEqual([]);
  });

  it('falls back to the page length when the response carries no total', async () => {
    // `total` is omitted on bookmarked pages.
    jest.spyOn(api, 'getClaimAttempts').mockResolvedValue({ docs: [{ claimNumber: 7 }] } as any);
    const res = await api.checkClaimSuccess('claim-1', 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d');
    expect(res.successCount).toBe(1);
    expect(res.claimNumbers).toEqual([7]);
  });
});
