/**
 * Command-tree shape tests for dynamic-stores.ts. Locks the subcommand
 * surface and required flags. Tx-emission and indexer-fetch behavior is
 * smoke-tested via the binary; structural correctness here.
 */

import { dynamicStoresCommand } from './dynamic-stores.js';

describe('dynamicStoresCommand shape', () => {
  it('exposes the documented subcommands', () => {
    const names = dynamicStoresCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'activity',
      'add',
      'batch',
      'create',
      'delete',
      'get-value',
      'list-values',
      'remove',
      'search',
      'set-value',
      'show',
      'update'
    ]);
  });

  it('create / update / delete / set-value / add / remove all require --creator', () => {
    for (const verb of ['create', 'update', 'delete', 'set-value', 'add', 'remove']) {
      const c = dynamicStoresCommand.commands.find((cmd) => cmd.name() === verb)!;
      const required = (c.options as any[]).filter((o) => o.required).map((o) => o.long);
      expect(required).toContain('--creator');
    }
  });

  it('update / delete / set-value / add / remove / show / get-value / list-values take <store-id>', () => {
    for (const verb of ['update', 'delete', 'set-value', 'add', 'remove', 'show', 'get-value', 'list-values']) {
      const c = dynamicStoresCommand.commands.find((cmd) => cmd.name() === verb)!;
      const args = (c as any)._args.map((a: any) => a.name());
      expect(args[0]).toBe('store-id');
    }
  });

  it('add / remove take variadic <addresses...>', () => {
    for (const verb of ['add', 'remove']) {
      const c = dynamicStoresCommand.commands.find((cmd) => cmd.name() === verb)!;
      const args = (c as any)._args;
      expect(args[args.length - 1].variadic).toBe(true);
    }
  });

  it('batch takes variadic <store-ids...>', () => {
    const c = dynamicStoresCommand.commands.find((cmd) => cmd.name() === 'batch')!;
    const args = (c as any)._args;
    expect(args[0].variadic).toBe(true);
  });

  it('set-value takes <store-id> <address> <value>', () => {
    const c = dynamicStoresCommand.commands.find((cmd) => cmd.name() === 'set-value')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['store-id', 'address', 'value']);
  });

  it('get-value takes <store-id> <address>', () => {
    const c = dynamicStoresCommand.commands.find((cmd) => cmd.name() === 'get-value')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['store-id', 'address']);
  });

  it('search takes <query>', () => {
    const c = dynamicStoresCommand.commands.find((cmd) => cmd.name() === 'search')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['query']);
  });

  it('read commands accept network flags', () => {
    for (const verb of ['show', 'get-value', 'list-values', 'batch', 'activity', 'search']) {
      const c = dynamicStoresCommand.commands.find((cmd) => cmd.name() === verb)!;
      const longs = (c.options as any[]).map((o) => o.long);
      expect(longs).toEqual(expect.arrayContaining(['--testnet', '--local', '--url', '--api-key']));
    }
  });
});
