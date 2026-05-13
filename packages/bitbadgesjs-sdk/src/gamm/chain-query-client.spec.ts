import { BigIntify, Stringify } from '@/common/string-numbers.js';
import {
  GammChainQueryClient,
  camelToSnakeKey,
  convertCamelToSnake,
  convertSnakeToCamel,
  snakeToCamelKey
} from './chain-query-client.js';

type FetchResponse = Partial<{
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

function makeMockFetch(impl: (url: string, init?: RequestInit) => FetchResponse) {
  return jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    const res = impl(url, init);
    return {
      ok: res.ok ?? true,
      status: res.status ?? 200,
      statusText: res.statusText ?? 'OK',
      json: res.json ?? (async () => ({})),
      text: res.text ?? (async () => '')
    } as Response;
  }) as unknown as typeof fetch;
}

describe('snakeToCamelKey / camelToSnakeKey', () => {
  it('round-trips simple snake_case keys', () => {
    expect(snakeToCamelKey('pool_id')).toBe('poolId');
    expect(snakeToCamelKey('token_out_amount')).toBe('tokenOutAmount');
    expect(snakeToCamelKey('share_in_amount')).toBe('shareInAmount');
    expect(camelToSnakeKey('poolId')).toBe('pool_id');
    expect(camelToSnakeKey('tokenOutAmount')).toBe('token_out_amount');
  });

  it('preserves @-prefixed keys (Cosmos Any.@type)', () => {
    expect(snakeToCamelKey('@type')).toBe('@type');
    expect(camelToSnakeKey('@type')).toBe('@type');
  });

  it('preserves keys without underscores or uppercase letters', () => {
    expect(snakeToCamelKey('address')).toBe('address');
    expect(camelToSnakeKey('address')).toBe('address');
  });
});

describe('convertSnakeToCamel / convertCamelToSnake', () => {
  it('recursively renames object keys', () => {
    const input = {
      pool_id: '1',
      pool_assets: [{ token: { denom: 'ubadge', amount: '100' }, weight: '536870912000000' }],
      pool_params: { swap_fee: '0.003', exit_fee: '0' }
    };
    const camel = convertSnakeToCamel<any>(input);
    expect(camel).toEqual({
      poolId: '1',
      poolAssets: [{ token: { denom: 'ubadge', amount: '100' }, weight: '536870912000000' }],
      poolParams: { swapFee: '0.003', exitFee: '0' }
    });
    expect(convertCamelToSnake(camel)).toEqual(input);
  });

  it('preserves numeric-string fields as strings (no parseInt)', () => {
    const input = { token_out_amount: '12345678901234567890', share_in_amount: '0' };
    const out: any = convertSnakeToCamel(input);
    expect(out.tokenOutAmount).toBe('12345678901234567890');
    expect(typeof out.tokenOutAmount).toBe('string');
    expect(out.shareInAmount).toBe('0');
  });

  it('stringifies bigints when going camel→snake', () => {
    const out: any = convertCamelToSnake({ poolId: 5n });
    expect(out.pool_id).toBe('5');
  });

  it('leaves primitives and arrays of primitives intact', () => {
    expect(convertSnakeToCamel(5)).toBe(5);
    expect(convertSnakeToCamel('hello')).toBe('hello');
    expect(convertSnakeToCamel([1, 2, 3])).toEqual([1, 2, 3]);
    expect(convertSnakeToCamel(null)).toBeNull();
  });
});

describe('GammChainQueryClient', () => {
  describe('getPool', () => {
    it('hits /osmosis/gamm/v1beta1/pools/{poolId} and reconstructs a Pool', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({
          pool: {
            '@type': '/osmosis.gamm.v1beta1.Pool',
            address: 'bb1pooladdr',
            id: '1',
            pool_params: { swap_fee: '0.003000000000000000', exit_fee: '0.000000000000000000' },
            future_pool_governor: '',
            total_shares: { denom: 'gamm/pool/1', amount: '100000000000000000000' },
            pool_assets: [
              { token: { denom: 'ubadge', amount: '1000000' }, weight: '536870912000000' },
              { token: { denom: 'uusdc', amount: '2000000' }, weight: '536870912000000' }
            ],
            total_weight: '1073741824000000'
          }
        })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      const { pool } = await client.getPool({ poolId: 1n });
      const callUrl = (fetchFn as jest.Mock).mock.calls[0][0];
      expect(callUrl).toBe('https://lcd.bitbadges.io/osmosis/gamm/v1beta1/pools/1');
      expect(pool.address).toBe('bb1pooladdr');
      expect(pool.id).toBe(1n);
      expect(pool.poolParams.swapFee).toBe('0.003000000000000000');
      expect(pool.poolParams.exitFee).toBe('0.000000000000000000');
      expect(pool.totalShares.denom).toBe('gamm/pool/1');
      expect(pool.totalShares.amount).toBe(100000000000000000000n);
      expect(pool.poolAssets).toHaveLength(2);
      expect(pool.poolAssets[0].token.denom).toBe('ubadge');
      expect(pool.poolAssets[0].token.amount).toBe(1000000n);
      expect(pool.poolAssets[0].weight).toBe(536870912000000n);
      expect(pool.totalWeight).toBe(1073741824000000n);
    });

    it('encodes pool id passed as a number or string', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({
          pool: {
            address: 'bb1a',
            id: '7',
            pool_params: { swap_fee: '0', exit_fee: '0' },
            total_shares: { denom: 'gamm/pool/7', amount: '0' },
            pool_assets: [],
            total_weight: '0'
          }
        })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      await client.getPool({ poolId: '7' });
      expect((fetchFn as jest.Mock).mock.calls[0][0]).toBe('https://lcd.bitbadges.io/osmosis/gamm/v1beta1/pools/7');
    });
  });

  describe('getPools', () => {
    it('appends pagination params with camel→snake key translation', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({ pools: [], pagination: { next_key: null, total: '0' } })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      const result = await client.getPools({
        pagination: { limit: 10, offset: 0, countTotal: true, reverse: false }
      });
      const callUrl = (fetchFn as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/osmosis/gamm/v1beta1/pools?');
      expect(callUrl).toContain('pagination.limit=10');
      expect(callUrl).toContain('pagination.offset=0');
      expect(callUrl).toContain('pagination.count_total=true');
      expect(callUrl).toContain('pagination.reverse=false');
      expect(result.pools).toEqual([]);
      expect(result.pagination.total).toBe('0');
    });
  });

  describe('getTotalShares', () => {
    it('returns camelCase CosmosCoin', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({ total_shares: { denom: 'gamm/pool/3', amount: '500000000000000000' } })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      const { totalShares } = await client.getTotalShares({ poolId: 3n });
      const callUrl = (fetchFn as jest.Mock).mock.calls[0][0];
      expect(callUrl).toBe('https://lcd.bitbadges.io/osmosis/gamm/v1beta1/pools/3/total_shares');
      expect(totalShares.denom).toBe('gamm/pool/3');
      expect(totalShares.amount).toBe(500000000000000000n);
    });
  });

  describe('getTotalPoolLiquidity', () => {
    it('returns the liquidity coin array', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({
          liquidity: [
            { denom: 'ubadge', amount: '1000000' },
            { denom: 'uusdc', amount: '2000000' }
          ]
        })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      const { liquidity } = await client.getTotalPoolLiquidity({ poolId: 2n });
      expect((fetchFn as jest.Mock).mock.calls[0][0]).toBe('https://lcd.bitbadges.io/osmosis/gamm/v1beta1/pools/2/total_pool_liquidity');
      expect(liquidity).toHaveLength(2);
      expect(liquidity[0].amount).toBe(1000000n);
      expect(liquidity[1].denom).toBe('uusdc');
    });
  });

  describe('getSpotPrice', () => {
    it('encodes base/quote denom as snake_case query params', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({ spot_price: '0.500000000000000000' })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      const { spotPrice } = await client.getSpotPrice({
        poolId: 1n,
        baseAssetDenom: 'ubadge',
        quoteAssetDenom: 'uusdc'
      });
      const callUrl = (fetchFn as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/osmosis/gamm/v1beta1/pools/1/prices?');
      expect(callUrl).toContain('base_asset_denom=ubadge');
      expect(callUrl).toContain('quote_asset_denom=uusdc');
      expect(spotPrice).toBe('0.500000000000000000');
    });
  });

  describe('getTotalLiquidity', () => {
    it('hits the module-level total_liquidity endpoint', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({ liquidity: [{ denom: 'ubadge', amount: '42' }] })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      const { liquidity } = await client.getTotalLiquidity();
      expect((fetchFn as jest.Mock).mock.calls[0][0]).toBe('https://lcd.bitbadges.io/osmosis/gamm/v1beta1/total_liquidity');
      expect(liquidity[0].amount).toBe(42n);
    });
  });

  describe('calcJoinPoolShares', () => {
    it('serializes tokensIn into Cosmos coin format and returns shareOutAmount as NumberType', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({
          share_out_amount: '1000000000000000000',
          tokens_out: [{ denom: 'ubadge', amount: '500' }]
        })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      const result = await client.calcJoinPoolShares({
        poolId: 1n,
        tokensIn: [
          { amount: 1000n, denom: 'ubadge' },
          { amount: '2000', denom: 'uusdc' }
        ]
      });
      const callUrl = (fetchFn as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/osmosis/gamm/v1beta1/pools/1/join_swap_exact_in?');
      expect(callUrl).toContain('tokens_in=1000ubadge');
      expect(callUrl).toContain('tokens_in=2000uusdc');
      expect(result.shareOutAmount).toBe(1000000000000000000n);
      expect(result.tokensOut[0].amount).toBe(500n);
    });
  });

  describe('calcExitPoolCoinsFromShares', () => {
    it('translates shareInAmount → share_in_amount in the URL', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({ tokens_out: [{ denom: 'ubadge', amount: '100' }, { denom: 'uusdc', amount: '200' }] })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      const { tokensOut } = await client.calcExitPoolCoinsFromShares({ poolId: 1n, shareInAmount: 1_000_000n });
      const callUrl = (fetchFn as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/osmosis/gamm/v1beta1/pools/1/exit_swap_share_amount_in?');
      expect(callUrl).toContain('share_in_amount=1000000');
      expect(tokensOut).toHaveLength(2);
      expect(tokensOut[0].amount).toBe(100n);
    });
  });

  describe('calcJoinPoolNoSwapShares', () => {
    it('serializes tokens_in and returns sharesOut', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({
          tokens_out: [{ denom: 'ubadge', amount: '50' }],
          shares_out: '99'
        })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      const result = await client.calcJoinPoolNoSwapShares({
        poolId: 4n,
        tokensIn: [{ amount: 50n, denom: 'ubadge' }]
      });
      const callUrl = (fetchFn as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/osmosis/gamm/v1beta1/pools/4/join_pool_no_swap?');
      expect(callUrl).toContain('tokens_in=50ubadge');
      expect(result.sharesOut).toBe(99n);
      expect(result.tokensOut[0].amount).toBe(50n);
    });
  });

  describe('estimateSwapExactAmountIn', () => {
    it('encodes routes.pool_id and routes.token_out_denom', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({ token_out_amount: '987654321' })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      const result = await client.estimateSwapExactAmountIn({
        sender: 'bb1sender',
        poolId: 1n,
        tokenIn: '1000ubadge',
        routes: [{ poolId: 1n, tokenOutDenom: 'uusdc' }]
      });
      const callUrl = (fetchFn as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/osmosis/gamm/v1beta1/1/estimate/swap_exact_amount_in?');
      expect(callUrl).toContain('sender=bb1sender');
      expect(callUrl).toContain('token_in=1000ubadge');
      expect(callUrl).toContain('routes.pool_id=1');
      expect(callUrl).toContain('routes.token_out_denom=uusdc');
      expect(result.tokenOutAmount).toBe(987654321n);
    });
  });

  describe('estimateSwapExactAmountOut', () => {
    it('encodes routes.pool_id and routes.token_in_denom', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({ token_in_amount: '12345' })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      const result = await client.estimateSwapExactAmountOut({
        sender: 'bb1sender',
        poolId: 2n,
        routes: [{ poolId: 2n, tokenInDenom: 'ubadge' }],
        tokenOut: '999uusdc'
      });
      const callUrl = (fetchFn as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/osmosis/gamm/v1beta1/2/estimate/swap_exact_amount_out?');
      expect(callUrl).toContain('sender=bb1sender');
      expect(callUrl).toContain('token_out=999uusdc');
      expect(callUrl).toContain('routes.pool_id=2');
      expect(callUrl).toContain('routes.token_in_denom=ubadge');
      expect(result.tokenInAmount).toBe(12345n);
    });
  });

  describe('convertFunction', () => {
    it('Stringify keeps numeric responses as strings', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({ total_shares: { denom: 'gamm/pool/9', amount: '12345' } })
      }));
      const client = new GammChainQueryClient<string>({
        baseUrl: 'https://lcd.bitbadges.io',
        fetchFn,
        convertFunction: Stringify
      });
      const { totalShares } = await client.getTotalShares({ poolId: 9n });
      expect(typeof totalShares.amount).toBe('string');
      expect(totalShares.amount).toBe('12345');
    });

    it('default BigIntify produces bigints', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({ total_shares: { denom: 'gamm/pool/10', amount: '7' } })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn, convertFunction: BigIntify });
      const { totalShares } = await client.getTotalShares({ poolId: 10n });
      expect(typeof totalShares.amount).toBe('bigint');
      expect(totalShares.amount).toBe(7n);
    });
  });

  describe('error handling', () => {
    it('throws a descriptive error on non-OK responses', async () => {
      const fetchFn = makeMockFetch(() => ({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => '{"code":5,"message":"pool not found"}'
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io', fetchFn });
      await expect(client.getPool({ poolId: 9999n })).rejects.toThrow(/GET .* failed with 404 Not Found/);
    });

    it('strips a trailing slash from baseUrl', async () => {
      const fetchFn = makeMockFetch(() => ({
        json: async () => ({ liquidity: [] })
      }));
      const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io/', fetchFn });
      await client.getTotalLiquidity();
      expect((fetchFn as jest.Mock).mock.calls[0][0]).toBe('https://lcd.bitbadges.io/osmosis/gamm/v1beta1/total_liquidity');
    });
  });
});
