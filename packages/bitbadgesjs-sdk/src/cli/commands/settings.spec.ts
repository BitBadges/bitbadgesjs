/**
 * Unit tests for settings.ts.
 *
 * Behavior is covered by cli-local-state.spec.ts. This spec locks the
 * command-tree shape — refactors that drop a verb fail before the
 * integration suite runs.
 *
 * Renamed from `config` to `settings` for CLI v2 (#0399). The old
 * top-level `bb config ...` form is registered as a deprecated alias
 * in cli/index.ts for one release.
 */

import { settingsCommand } from './settings.js';

describe('settingsCommand shape', () => {
  it('command name is `settings`', () => {
    expect(settingsCommand.name()).toBe('settings');
  });

  it('exposes show + set + unset subcommands', () => {
    const names = settingsCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['set', 'show', 'unset']);
  });

  it('set takes <key> <value>', () => {
    const c = settingsCommand.commands.find((cmd) => cmd.name() === 'set')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['key', 'value']);
  });

  it('unset takes <key>', () => {
    const c = settingsCommand.commands.find((cmd) => cmd.name() === 'unset')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['key']);
  });
});
