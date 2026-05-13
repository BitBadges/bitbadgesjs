import { findAsset, getAllAssets, loadAssetRegistry, resolveCoinGeckoId, resolveCoinGeckoIds } from './index.js';

describe('asset registry', () => {
  it('exposes the canonical asset list', () => {
    const reg = loadAssetRegistry();
    expect(Array.isArray(reg.assets)).toBe(true);
    expect(reg.assets.length).toBeGreaterThan(0);

    const symbols = reg.assets.map((a) => a.symbol).sort();
    expect(symbols).toContain('BADGE');
    expect(symbols).toContain('ATOM');
    expect(symbols).toContain('USDC');
    expect(symbols).toContain('OSMO');
    expect(symbols).toContain('ETH');
  });

  it('exposes ETH with 18 decimals + ethereum coingecko ID', () => {
    const eth = findAsset('ETH');
    expect(eth?.symbol).toBe('ETH');
    expect(eth?.decimals).toBe(18);
    expect(eth?.coingecko_id).toBe('ethereum');
  });

  it('getAllAssets returns the flat list', () => {
    const all = getAllAssets();
    expect(all).toEqual(loadAssetRegistry().assets);
  });
});

describe('findAsset', () => {
  it('resolves by symbol (uppercase)', () => {
    const atom = findAsset('ATOM');
    expect(atom?.symbol).toBe('ATOM');
    expect(atom?.coingecko_id).toBe('cosmos');
  });

  it('resolves by symbol (case-insensitive)', () => {
    expect(findAsset('atom')?.symbol).toBe('ATOM');
    expect(findAsset('Atom')?.symbol).toBe('ATOM');
  });

  it('resolves by denom', () => {
    expect(findAsset('uatom')?.symbol).toBe('ATOM');
    expect(findAsset('ubadge')?.symbol).toBe('BADGE');
  });

  it('resolves by CoinGecko ID', () => {
    expect(findAsset('cosmos')?.symbol).toBe('ATOM');
    expect(findAsset('osmosis')?.symbol).toBe('OSMO');
    expect(findAsset('usd-coin')?.symbol).toBe('USDC');
  });

  it('returns undefined for unknown input', () => {
    expect(findAsset('FAKETOKEN')).toBeUndefined();
    expect(findAsset('')).toBeUndefined();
    expect(findAsset('   ')).toBeUndefined();
  });
});

describe('resolveCoinGeckoId', () => {
  it('maps symbol → CoinGecko ID', () => {
    expect(resolveCoinGeckoId('ATOM')).toBe('cosmos');
    expect(resolveCoinGeckoId('OSMO')).toBe('osmosis');
    expect(resolveCoinGeckoId('USDC')).toBe('usd-coin');
    expect(resolveCoinGeckoId('BADGE')).toBe('bitbadges');
  });

  it('maps denom → CoinGecko ID', () => {
    expect(resolveCoinGeckoId('uatom')).toBe('cosmos');
    expect(resolveCoinGeckoId('uusdc')).toBe('usd-coin');
  });

  it('passes through valid CoinGecko IDs', () => {
    expect(resolveCoinGeckoId('cosmos')).toBe('cosmos');
    expect(resolveCoinGeckoId('osmosis')).toBe('osmosis');
  });

  it('returns undefined for unknown input', () => {
    expect(resolveCoinGeckoId('FAKETOKEN')).toBeUndefined();
  });
});

describe('resolveCoinGeckoIds', () => {
  it('maps a batch of inputs to deduplicated CoinGecko IDs', () => {
    const out = resolveCoinGeckoIds(['ATOM', 'cosmos', 'uatom', 'OSMO', 'FAKE']);
    expect(out.map((x) => x.id)).toEqual(['cosmos', 'osmosis']);
    // First-input-wins for the original-input mapping:
    expect(out[0].input).toBe('ATOM');
    expect(out[1].input).toBe('OSMO');
  });

  it('drops unresolvable inputs', () => {
    expect(resolveCoinGeckoIds(['FAKE', 'NOPE'])).toEqual([]);
  });
});
