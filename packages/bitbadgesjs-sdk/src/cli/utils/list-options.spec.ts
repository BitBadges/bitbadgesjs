import { Command } from 'commander';
import { appendQuery, addListOptions, resolvePageQuery } from './list-options.js';

const longFlags = (cmd: Command) => (cmd as any).options.map((o: any) => o.long);

describe('appendQuery (shared — was duplicated in 5 command files)', () => {
  test('omits empty/undefined/null params', () => {
    expect(appendQuery('/x', { a: '1', b: undefined, c: '', d: 0 })).toBe('/x?a=1&d=0');
  });
  test('no params → path unchanged', () => {
    expect(appendQuery('/x', { a: undefined })).toBe('/x');
  });
  test('respects an existing query string', () => {
    expect(appendQuery('/x?z=9', { a: '1' })).toBe('/x?z=9&a=1');
  });
});

describe('addListOptions', () => {
  test('always adds --bookmark; opt-in for the rest', () => {
    const cmd = addListOptions(new Command('a'), { group: 'List' });
    expect(longFlags(cmd)).toEqual(['--bookmark']);
  });
  test('opt-in flags + endpoint-specific sort-direction name', () => {
    const a = addListOptions(new Command('a'), { group: 'G', limit: true, sortBy: 'x', sortDir: 'sortOrder' });
    expect(longFlags(a)).toEqual(expect.arrayContaining(['--bookmark', '--limit', '--sort-by', '--sort-order']));
    const b = addListOptions(new Command('b'), { group: 'G', sortDir: 'sortDirection' });
    expect(longFlags(b)).toContain('--sort-direction');
    expect(longFlags(b)).not.toContain('--sort-order');
  });
  test('idempotent — does not clobber a pre-declared flag', () => {
    const cmd = new Command('c').option('--bookmark <b>', 'preexisting');
    addListOptions(cmd, { group: 'G' });
    expect((cmd as any)._findOption('--bookmark').description).toBe('preexisting');
  });
});

describe('resolvePageQuery', () => {
  test('only emits keys that are set', () => {
    expect(resolvePageQuery({ bookmark: 'bk', sortOrder: 'asc' })).toEqual({ bookmark: 'bk', sortOrder: 'asc' });
    expect(resolvePageQuery({})).toEqual({});
    expect(resolvePageQuery({ oldestFirst: true })).toEqual({ oldestFirst: 'true' });
  });
});
