/**
 * Command-tree shape tests for address.ts.
 *
 * Behavior is also exercised live in `cli-core.spec.ts`. These specs lock
 * the public CLI surface so refactors that drop/rename a subcommand fail
 * before the integration suite runs.
 */

import { addressCommand } from './address.js';

describe('addressCommand shape', () => {
  it('exposes convert + validate subcommands', () => {
    const names = addressCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['convert', 'validate']);
  });

  it('convert takes <address> and supports --to', () => {
    const c = addressCommand.commands.find((cmd) => cmd.name() === 'convert')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['address']);
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--to']));
  });

  it('validate takes <address>', () => {
    const c = addressCommand.commands.find((cmd) => cmd.name() === 'validate')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['address']);
  });
});
