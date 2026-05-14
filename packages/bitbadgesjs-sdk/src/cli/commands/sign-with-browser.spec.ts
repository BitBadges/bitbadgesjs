/**
 * Command-tree shape tests for sign-with-browser.ts.
 *
 * The browser-bridge handshake is exercised live in the integration suite
 * (and gated on a real browser). This spec just locks the flag surface so
 * refactors that drop --no-open / --port / --expected-address can't ship
 * without updating that suite.
 */

import { signWithBrowserCommand } from './sign-with-browser.js';

describe('signWithBrowserCommand shape', () => {
  it('is a flat command (no subcommands)', () => {
    expect(signWithBrowserCommand.commands.length).toBe(0);
  });

  it('takes [input] positional arg', () => {
    const args = (signWithBrowserCommand as any)._args;
    expect(args.length).toBe(1);
    expect(args[0].name()).toBe('input');
    expect(args[0].required).toBe(false);
  });

  it('exposes the documented flag surface', () => {
    const longs = (signWithBrowserCommand.options as any[]).map((o) => o.long);
    expect(longs).toEqual(
      expect.arrayContaining([
        '--message',
        '--message-file',
        '--expected-address',
        '--frontend-url',
        '--no-open',
        '--timeout',
        '--port',
        '--network',
        '--mainnet',
        '--testnet',
        '--local',
        '--url',
      ]),
    );
  });
});
