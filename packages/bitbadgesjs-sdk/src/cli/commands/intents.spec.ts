import { intentsCommand } from './intents.js';

describe('intentsCommand shape', () => {
  it('exposes list/show/create/fill/cancel', () => {
    const names = intentsCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['cancel', 'create', 'fill', 'list', 'show']);
  });

  it('create requires --creator + --pay-denom + --pay-amount + --receive-denom + --receive-amount', () => {
    const create = intentsCommand.commands.find((c) => c.name() === 'create');
    const required = (create! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    for (const flag of ['--creator', '--pay-denom', '--pay-amount', '--receive-denom', '--receive-amount']) {
      expect(required).toContain(flag);
    }
  });

  it('fill + cancel + show take an approval-id argument', () => {
    for (const verb of ['fill', 'cancel', 'show']) {
      const c = intentsCommand.commands.find((cmd) => cmd.name() === verb);
      expect((c! as any)._args.map((a: any) => a.name())).toEqual(['approval-id']);
    }
  });

  it('every subcommand exposes --collection-id for per-network override', () => {
    for (const c of intentsCommand.commands) {
      const flagNames = (c as any).options.map((o: any) => o.long);
      expect(flagNames).toContain('--collection-id');
    }
  });
});
