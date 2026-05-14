/**
 * Command-tree shape tests for gen-pub-key.ts.
 *
 * Live indexer / chain-LCD / signature-recovery paths are out of scope for
 * a unit test (covered by cli-core.spec.ts integration). This spec locks
 * the public flag surface so refactors that drop --print-message,
 * --no-lookup, --signature, --message can't silently land.
 */

import { genPubKeyCommand } from './gen-pub-key.js';

describe('genPubKeyCommand shape', () => {
  it('is a flat command (no subcommands)', () => {
    expect(genPubKeyCommand.commands.length).toBe(0);
  });

  it('exposes the documented flag surface', () => {
    const longs = (genPubKeyCommand.options as any[]).map((o) => o.long);
    expect(longs).toEqual(
      expect.arrayContaining([
        '--address',
        '--signature',
        '--message',
        '--print-message',
        '--no-lookup',
        '--network',
        '--mainnet',
        '--testnet',
        '--local',
        '--url',
      ]),
    );
  });
});
