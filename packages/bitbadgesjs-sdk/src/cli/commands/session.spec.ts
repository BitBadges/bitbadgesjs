/**
 * Unit tests for session.ts — the inspect / dump / reset surface that
 * agents fall through to when a builder run aborts mid-flow.
 *
 * Behavior is covered by the integration suite. This spec locks the
 * command-tree shape so refactors that drop a subcommand can't ship
 * without updating cli-local-state.spec.ts.
 */

import { sessionCommand } from './session.js';

describe('sessionCommand shape', () => {
  it('exposes list + show + reset subcommands', () => {
    const names = sessionCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['list', 'reset', 'show']);
  });

  it('show + reset take <id>', () => {
    for (const verb of ['show', 'reset']) {
      const c = sessionCommand.commands.find((cmd) => cmd.name() === verb)!;
      expect((c as any)._args.map((a: any) => a.name())).toEqual(['id']);
    }
  });
});
