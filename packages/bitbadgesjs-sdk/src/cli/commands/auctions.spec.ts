/**
 * Command-tree shape tests for auctions.ts. Helpers/validators are
 * exercised in core/auctions.spec.ts; this spec guards the surface so
 * accidental flag drift / subcommand rename surfaces in unit CI rather
 * than only at live-chain integration time.
 */

import { auctionsCommand } from './auctions.js';

describe('auctionsCommand shape', () => {
  it('exposes the documented subcommand verbs', () => {
    const names = auctionsCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'accept-bid',
      'build',
      'cancel-bid',
      'list',
      'place-bid',
      'show',
      'status'
    ]);
  });

  it('place-bid requires --creator, --amount, --denom', () => {
    const cmd = auctionsCommand.commands.find((c) => c.name() === 'place-bid');
    expect(cmd).toBeDefined();
    const required = (cmd! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    for (const f of ['--creator', '--amount', '--denom']) expect(required).toContain(f);
  });

  it('place-bid + cancel-bid + accept-bid + show + status take <collection-id>', () => {
    for (const verb of ['place-bid', 'cancel-bid', 'accept-bid', 'show', 'status']) {
      const c = auctionsCommand.commands.find((cmd) => cmd.name() === verb);
      expect((c! as any)._args[0].name()).toBe('collection-id');
    }
  });

  it('cancel-bid takes <approval-id> as second positional', () => {
    const c = auctionsCommand.commands.find((cmd) => cmd.name() === 'cancel-bid');
    expect((c! as any)._args.map((a: any) => a.name())).toEqual(['collection-id', 'approval-id']);
  });

  it('accept-bid requires --creator + --bidder', () => {
    const cmd = auctionsCommand.commands.find((c) => c.name() === 'accept-bid');
    const required = (cmd! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--creator');
    expect(required).toContain('--bidder');
  });

  it('list exposes --open filter', () => {
    const list = auctionsCommand.commands.find((c) => c.name() === 'list');
    const flagNames = (list! as any).options.map((o: any) => o.long);
    expect(flagNames).toContain('--open');
  });

  it('every action-emitting verb exposes --output-file + --condensed', () => {
    for (const verb of ['place-bid', 'cancel-bid', 'accept-bid', 'show', 'status', 'list']) {
      const c = auctionsCommand.commands.find((cmd) => cmd.name() === verb);
      const flagNames = (c! as any).options.map((o: any) => o.long);
      expect(flagNames).toContain('--output-file');
      expect(flagNames).toContain('--condensed');
    }
  });

  it('build alias is registered and points at `bb build auction`', () => {
    const build = auctionsCommand.commands.find((c) => c.name() === 'build');
    expect(build).toBeDefined();
    expect(build!.description()).toMatch(/Alias for `bb build auction`/);
  });
});
