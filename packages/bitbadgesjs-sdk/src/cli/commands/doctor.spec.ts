/**
 * Command-tree shape tests for doctor.ts.
 *
 * doctor's probes hit the local filesystem, indexer, and MCP bin — full
 * coverage runs in the integration suite. This spec just locks the flag
 * surface so the contract documented in cli-discovery.spec.ts (--json,
 * --with-preview, network selection) stays stable across refactors.
 */

import { doctorCommand } from './doctor.js';

describe('doctorCommand shape', () => {
  it('is a flat command (no subcommands)', () => {
    expect(doctorCommand.commands.length).toBe(0);
  });

  it('exposes envelope output flags + --with-preview + network selectors', () => {
    const longs = (doctorCommand.options as any[]).map((o) => o.long);
    expect(longs).toEqual(
      expect.arrayContaining([
        '--condensed',
        '--output-file',
        '--with-preview',
        '--network',
        '--mainnet',
        '--testnet',
        '--local',
        '--url',
      ]),
    );
  });
});

describe('doctor config file path', () => {
  const originalDir = process.env.BITBADGES_CONFIG_DIR;
  afterEach(() => {
    if (originalDir === undefined) delete process.env.BITBADGES_CONFIG_DIR;
    else process.env.BITBADGES_CONFIG_DIR = originalDir;
  });

  it('resolves the config path from BITBADGES_CONFIG_DIR, like every config read', async () => {
    process.env.BITBADGES_CONFIG_DIR = '/tmp/bb-isolated-agent';
    const { configPath } = await import('../utils/config.js');
    expect(configPath()).toBe('/tmp/bb-isolated-agent/config.json');
  });
});
