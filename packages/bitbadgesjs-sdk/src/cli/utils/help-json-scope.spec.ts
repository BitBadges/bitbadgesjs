import { Command } from 'commander';
import { resolveHelpJsonScope } from './help-json-scope.js';

function program(): Command {
  const root = new Command('bb');
  const api = root.command('api');
  const tokens = api.command('tokens');
  tokens.command('get-collection').argument('[collectionId]');
  root.command('account').command('profile').alias('account');
  return root;
}

describe('resolveHelpJsonScope', () => {
  it('returns an empty scope for a bare --help-json', () => {
    expect(resolveHelpJsonScope(program(), ['--help-json'])).toEqual([]);
  });

  it('walks a nested subcommand path', () => {
    const names = resolveHelpJsonScope(program(), ['api', 'tokens', '--help-json']).map((c) => c.name());
    expect(names).toEqual(['api', 'tokens']);
  });

  it('stops at positional arguments', () => {
    const names = resolveHelpJsonScope(program(), ['api', 'tokens', 'get-collection', '1', '--help-json']).map((c) => c.name());
    expect(names).toEqual(['api', 'tokens', 'get-collection']);
  });

  it('resolves aliases', () => {
    const names = resolveHelpJsonScope(program(), ['account', 'account', '--help-json']).map((c) => c.name());
    expect(names).toEqual(['account', 'profile']);
  });

  it('stops at the first flag and ignores unknown commands', () => {
    expect(resolveHelpJsonScope(program(), ['--network', 'api', '--help-json'])).toEqual([]);
    expect(resolveHelpJsonScope(program(), ['nope', '--help-json'])).toEqual([]);
  });
});
