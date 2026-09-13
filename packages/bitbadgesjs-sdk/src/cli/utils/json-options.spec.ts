import { Command } from 'commander';
import { allowJsonInsteadOfRequiredOptions } from './json-options.js';

function fixture() {
  const action = jest.fn();
  const command = new Command('build')
    .requiredOption('--recipient <address>')
    .requiredOption('--amount <number>')
    .option('--json <input>')
    .exitOverride()
    .configureOutput({ writeErr: () => undefined })
    .action(action);
  allowJsonInsteadOfRequiredOptions(command);
  return { command, action };
}

describe('JSON builder input alternative', () => {
  it('accepts complete JSON without redundant individual flags', async () => {
    const { command, action } = fixture();
    await command.parseAsync(['--json', '{"recipient":"demo","amount":5}'], { from: 'user' });
    expect(action).toHaveBeenCalled();
    expect(command.opts().json).toBe('{"recipient":"demo","amount":5}');
  });

  it('still rejects missing mandatory fields in flag mode', async () => {
    const { command, action } = fixture();
    await expect(command.parseAsync(['--amount', '5'], { from: 'user' })).rejects.toMatchObject({ code: 'commander.missingMandatoryOption' });
    expect(action).not.toHaveBeenCalled();
  });

  it('rejects an empty JSON source instead of falling through to incomplete flags', async () => {
    const { command, action } = fixture();
    await expect(command.parseAsync(['--json', ''], { from: 'user' })).rejects.toMatchObject({ code: 'commander.invalidArgument' });
    expect(action).not.toHaveBeenCalled();
  });

  it('accepts complete flags and preserves Commander missing-value validation', async () => {
    const { command, action } = fixture();
    await command.parseAsync(['--recipient', 'demo', '--amount', '5'], { from: 'user' });
    expect(action).toHaveBeenCalled();
    await expect(fixture().command.parseAsync(['--json'], { from: 'user' })).rejects.toMatchObject({ code: 'commander.optionMissingArgument' });
  });
});
