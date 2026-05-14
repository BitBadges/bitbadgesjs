/**
 * Command-tree shape tests for docs.ts + skills.ts.
 *
 * Live GitHub-fetch behavior is exercised in cli-discovery.spec.ts. This
 * spec covers the public surface (single [section] argument + --refresh
 * flag) so refactors that change the agent-facing contract surface here.
 */

import { docsCommand } from './docs.js';

describe('docsCommand shape', () => {
  it('is a flat command (no subcommands)', () => {
    expect(docsCommand.commands.length).toBe(0);
  });

  it('takes [section] positional + --refresh flag', () => {
    const args = (docsCommand as any)._args;
    expect(args.length).toBe(1);
    expect(args[0].name()).toBe('section');
    expect(args[0].required).toBe(false);
    const longs = (docsCommand.options as any[]).map((o) => o.long);
    expect(longs).toContain('--refresh');
  });

  it('includes the navigation cheatsheet (via addHelpText) in outputHelp', () => {
    const chunks: string[] = [];
    const orig = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((s: any) => {
      chunks.push(typeof s === 'string' ? s : s.toString('utf-8'));
      return true;
    }) as any;
    try {
      docsCommand.outputHelp();
    } finally {
      process.stdout.write = orig;
    }
    const help = chunks.join('');
    expect(help).toMatch(/docs <section>\/<subsection>/);
    expect(help).toMatch(/builder-skills/);
  });
});
