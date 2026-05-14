/**
 * Unit tests for config.ts.
 *
 * Behavior is covered by cli-local-state.spec.ts. This spec locks the
 * command-tree shape — refactors that drop a verb fail before the
 * integration suite runs.
 */

import { configCommand } from './config.js';

describe('configCommand shape', () => {
  it('exposes show + set + unset subcommands', () => {
    const names = configCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['set', 'show', 'unset']);
  });

  it('set takes <key> <value>', () => {
    const c = configCommand.commands.find((cmd) => cmd.name() === 'set')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['key', 'value']);
  });

  it('unset takes <key>', () => {
    const c = configCommand.commands.find((cmd) => cmd.name() === 'unset')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['key']);
  });
});
