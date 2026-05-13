/**
 * Command-tree shape tests for price.ts. The action handler is an HTTP
 * call — real-network smoke lives in the integration suite. This spec
 * locks the public CLI surface (args + options + descriptions) so we
 * notice regressions without spinning up the subprocess.
 *
 * Also asserts the response-shape consistency invariant — `bb price ATOM`
 * (aliased symbol) and `bb price cosmos` (raw CoinGecko ID) must both
 * emit the nested `{ prices, aliasedFrom }` envelope. Symbol callers got
 * the nested shape; raw-ID callers used to get a flat shape — the action
 * handler is now hard-coded to always emit nested, with empty
 * `aliasedFrom` when nothing was rewritten.
 */

import axios from 'axios';
import { priceCommand } from './price.js';

describe('priceCommand shape', () => {
  it('takes a variadic <coin-ids...> argument', () => {
    const args = (priceCommand as any)._args;
    expect(args.length).toBe(1);
    expect(args[0].name()).toBe('coin-ids');
    expect(args[0].variadic).toBe(true);
    expect(args[0].required).toBe(true);
  });

  it('exposes the documented options', () => {
    const longFlags = (priceCommand.options as any[]).map((o) => o.long);
    expect(longFlags).toEqual(
      expect.arrayContaining(['--vs-currency', '--include-24h-change', '--include-24h-vol', '--output-file', '--format', '--json'])
    );
  });

  it('defaults --vs-currency to usd', () => {
    const vs = (priceCommand.options as any[]).find((o) => o.long === '--vs-currency');
    expect(vs.defaultValue).toBe('usd');
  });

  it('boolean flags default to false', () => {
    for (const long of ['--include-24h-change', '--include-24h-vol']) {
      const opt = (priceCommand.options as any[]).find((o) => o.long === long);
      expect(opt.defaultValue).toBe(false);
    }
  });

  it('description mentions CoinGecko + symbol/registry resolution', () => {
    const desc = priceCommand.description();
    expect(desc).toMatch(/CoinGecko/i);
    expect(desc).toMatch(/symbol|registry/i);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Response-shape invariant. Mocks axios so we don't hit CoinGecko in unit
// tests. Verifies both aliased-symbol and raw-CG-ID paths produce the same
// nested `{ prices, aliasedFrom }` envelope (regression guard for the
// "shape drift" bug surfaced by the e2e smoke).
// ───────────────────────────────────────────────────────────────────────────
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('price action emits a consistent { prices, aliasedFrom } envelope', () => {
  let stdout: string;
  let stderr: string;
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;
  let exitCode: number | undefined;

  beforeEach(() => {
    stdout = '';
    stderr = '';
    exitCode = undefined;
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
      stdout += chunk;
      return true;
    });
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation((chunk: any) => {
      stderr += chunk;
      return true;
    });
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      exitCode = code;
      // Throw to short-circuit the action — Commander's parse continues otherwise.
      throw new Error(`__exit_${code}__`);
    }) as any);
    mockedAxios.get.mockResolvedValue({ data: { cosmos: { usd: 2 } } } as any);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    exitSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('aliased symbol (ATOM) emits nested prices + aliasedFrom map', async () => {
    await priceCommand.parseAsync(['node', 'price', 'ATOM']);
    const payload = JSON.parse(stdout);
    expect(payload.ok).toBe(true);
    expect(payload.data).toMatchObject({
      prices: { cosmos: { usd: 2 } },
      aliasedFrom: { cosmos: 'ATOM' }
    });
  });

  it('raw CoinGecko ID (cosmos) emits nested prices + empty aliasedFrom (consistent shape)', async () => {
    await priceCommand.parseAsync(['node', 'price', 'cosmos']);
    const payload = JSON.parse(stdout);
    expect(payload.ok).toBe(true);
    expect(payload.data).toMatchObject({
      prices: { cosmos: { usd: 2 } },
      aliasedFrom: {}
    });
    expect(payload.data).toHaveProperty('aliasedFrom');
    expect(payload.data).not.toHaveProperty('usd'); // legacy flat shape gone
  });
});
