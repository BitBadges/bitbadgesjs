/**
 * Command-tree shape tests for price.ts. The action handler is an HTTP
 * call — real-network smoke lives in the integration suite. This spec
 * locks the public CLI surface (args + options + descriptions) so we
 * notice regressions without spinning up the subprocess.
 */

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
