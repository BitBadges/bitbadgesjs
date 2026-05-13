/**
 * Unit tests for completion.ts.
 *
 * Generates a bash/zsh completion script by walking a Commander program's
 * command tree. We construct a tiny synthetic program here so the test
 * stays decoupled from the real top-level CLI (which evolves with every
 * verb add/rename).
 */

import { Command } from 'commander';
import { makeCompletionCommand } from './completion.js';

describe('makeCompletionCommand', () => {
  const captureStdout = () => {
    const chunks: string[] = [];
    const orig = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((s: any) => {
      chunks.push(typeof s === 'string' ? s : s.toString('utf-8'));
      return true;
    }) as any;
    return {
      chunks,
      restore: () => {
        process.stdout.write = orig;
      },
    };
  };

  const captureStderr = () => {
    const chunks: string[] = [];
    const orig = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((s: any) => {
      chunks.push(typeof s === 'string' ? s : s.toString('utf-8'));
      return true;
    }) as any;
    return {
      chunks,
      restore: () => {
        process.stderr.write = orig;
      },
    };
  };

  function makeFixtureProgram(): Command {
    const root = new Command('test-cli');
    const sub = root.command('build');
    sub.command('vault');
    sub.command('nft');
    root.command('flat-cmd');
    return root;
  }

  it('emits a bash-compatible script with top-level names + nested case entries', async () => {
    const program = makeFixtureProgram();
    const completion = makeCompletionCommand(program);
    const cap = captureStdout();
    try {
      await completion.parseAsync([], { from: 'user' });
    } finally {
      cap.restore();
    }
    const out = cap.chunks.join('');
    // Top-level names enumerated
    expect(out).toMatch(/build flat-cmd/);
    // Nested subcommands for `build`
    expect(out).toMatch(/build\)\s*COMPREPLY=.+vault nft/);
    // Bash completion bookkeeping
    expect(out).toMatch(/complete -F _bitbadges_cli_completions/);
  });

  it('accepts bash and zsh shell hints', async () => {
    for (const shell of ['bash', 'zsh', 'BASH', 'ZSH']) {
      const program = makeFixtureProgram();
      const completion = makeCompletionCommand(program);
      const cap = captureStdout();
      try {
        await completion.parseAsync([shell], { from: 'user' });
      } finally {
        cap.restore();
      }
      expect(cap.chunks.join('')).toMatch(/bitbadges-cli completion/);
    }
  });

  it('rejects unknown shells with exit code 2', async () => {
    const program = makeFixtureProgram();
    const completion = makeCompletionCommand(program);
    const errCap = captureStderr();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit__:${code}`);
    }) as any);
    try {
      await expect(completion.parseAsync(['fish'], { from: 'user' })).rejects.toThrow(
        /__exit__:2/,
      );
      expect(errCap.chunks.join('')).toMatch(/Unknown shell "fish"/);
    } finally {
      errCap.restore();
      exitSpy.mockRestore();
    }
  });
});
