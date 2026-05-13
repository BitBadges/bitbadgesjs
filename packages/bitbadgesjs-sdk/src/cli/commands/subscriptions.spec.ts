/**
 * Command-tree shape tests for subscriptions.ts. Underlying helpers are
 * exercised in core/subscriptions.spec.ts; this spec guards the surface.
 */

import { subscriptionsCommand } from './subscriptions.js';

describe('subscriptionsCommand shape', () => {
  it('exposes the documented subcommand verbs', () => {
    const names = subscriptionsCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'build',
      'cancel',
      'charge-due',
      'claim',
      'enable-renewal',
      'list',
      'status',
      'subscribe'
    ]);
  });

  it('charge-due requires --creator and accepts --tier + --dry-run', () => {
    const cmd = subscriptionsCommand.commands.find((c) => c.name() === 'charge-due');
    expect(cmd).toBeDefined();
    const required = (cmd! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--creator');
    const flagNames = (cmd! as any).options.map((o: any) => o.long);
    expect(flagNames).toContain('--tier');
    expect(flagNames).toContain('--dry-run');
  });

  it('tx-build subcommands require --creator', () => {
    for (const verb of ['claim', 'enable-renewal', 'cancel', 'subscribe']) {
      const c = subscriptionsCommand.commands.find((cmd) => cmd.name() === verb);
      expect(c).toBeDefined();
      const required = (c! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
      expect(required).toContain('--creator');
    }
  });

  it('status requires --address', () => {
    const status = subscriptionsCommand.commands.find((c) => c.name() === 'status');
    const required = (status! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--address');
  });

  it('tx-build verbs take --tier as an optional flag', () => {
    for (const verb of ['claim', 'enable-renewal', 'cancel', 'subscribe']) {
      const c = subscriptionsCommand.commands.find((cmd) => cmd.name() === verb);
      const flagNames = (c! as any).options.map((o: any) => o.long);
      expect(flagNames).toContain('--tier');
    }
  });

  it('enable-renewal + subscribe take --tip (tip-on-top)', () => {
    for (const verb of ['enable-renewal', 'subscribe']) {
      const c = subscriptionsCommand.commands.find((cmd) => cmd.name() === verb);
      const flagNames = (c! as any).options.map((o: any) => o.long);
      expect(flagNames).toContain('--tip');
    }
  });

  it('build alias is registered and points at `bb build subscription`', () => {
    const build = subscriptionsCommand.commands.find((c) => c.name() === 'build');
    expect(build).toBeDefined();
    expect(build!.description()).toMatch(/Alias for `bb build subscription`/);
  });
});
