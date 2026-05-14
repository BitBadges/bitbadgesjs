/**
 * Unit tests for completion.ts.
 *
 * The v2 generator walks the full Commander tree and emits a nested
 * case-statement bash script. We construct a small synthetic program
 * with two levels of nesting, an enum option (`argChoices`), a path-
 * hinted option, and a short-flag option — then assert each gets a
 * corresponding completion branch in the emitted script.
 */

import { Command, Option } from 'commander';
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
    // Enum option on root → triggers flag-value branch with the choices.
    root.addOption(new Option('--shell <shell>', 'Target shell').choices(['bash', 'zsh']));
    // Path-hinted option (longName ends with "-file") → triggers `compgen -f`.
    root.option('--output-file <path>', 'Write output to file');
    // Short-flag combo to verify both forms get a completion entry.
    root.option('-q, --quiet', 'Quiet mode');
    return root;
  }

  function runCompletion(args: string[] = []): string {
    const program = makeFixtureProgram();
    const completion = makeCompletionCommand(program);
    const cap = captureStdout();
    try {
      completion.parseAsync(args, { from: 'user' });
    } finally {
      cap.restore();
    }
    return cap.chunks.join('');
  }

  it('registers completion against both `bitbadges-cli` and `bb`', () => {
    const out = runCompletion();
    expect(out).toMatch(/complete -F _bitbadges_cli_complete bitbadges-cli/);
    expect(out).toMatch(/complete -F _bitbadges_cli_complete bb/);
  });

  it('emits a branch for the root (empty key) with top-level subcommands', () => {
    const out = runCompletion();
    // Root branch is keyed on the empty string. Top-level subcommands
    // (`build`, `flat-cmd`) appear in the compgen -W list for the
    // subcommand-completion fallback (the else branch under `if [[ "$cur" == -* ]]`).
    expect(out).toMatch(/''\)[\s\S]*build flat-cmd/);
  });

  it('emits a nested branch for `build` listing its children (vault, nft)', () => {
    const out = runCompletion();
    expect(out).toMatch(/'build'\)[\s\S]*vault nft/);
  });

  it('emits enum value completion for options declared with .choices()', () => {
    const out = runCompletion();
    // The Option `--shell` was declared with choices(['bash', 'zsh']).
    // The script should have a `--shell) COMPREPLY=( compgen -W 'bash zsh' )` line.
    expect(out).toMatch(/--shell\)\s*COMPREPLY=\(\s*\$\(compgen -W 'bash zsh'/);
  });

  it('emits file completion for path-hinted options', () => {
    const out = runCompletion();
    // `--output-file` matches the path heuristic → defer to bash file completion.
    expect(out).toMatch(/--output-file\)\s*COMPREPLY=\(\s*\$\(compgen -f/);
  });

  it('includes both short and long flag forms in the flag-name completion list', () => {
    const out = runCompletion();
    // `-q, --quiet` should put both `-q` and `--quiet` into the flag list.
    const rootBranchMatch = out.match(/''\)[\s\S]*?return ;;/);
    expect(rootBranchMatch).not.toBeNull();
    expect(rootBranchMatch![0]).toMatch(/-q/);
    expect(rootBranchMatch![0]).toMatch(/--quiet/);
  });

  it('accepts bash and zsh shell hints', () => {
    for (const shell of ['bash', 'zsh', 'BASH', 'ZSH']) {
      const out = runCompletion([shell]);
      expect(out).toMatch(/bitbadges-cli completion/);
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
