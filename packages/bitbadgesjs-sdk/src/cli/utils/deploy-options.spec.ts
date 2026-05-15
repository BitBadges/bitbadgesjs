import { Command } from 'commander';
import { addDeployOptions, isDeployRequested, runEmitOrDeploy } from './deploy-options.js';

const longFlags = (cmd: Command) => (cmd as any).options.map((o: any) => o.long);

describe('addDeployOptions', () => {
  test('attaches the standardized concise deploy flag set', () => {
    const cmd = addDeployOptions(new Command('x'));
    const flags = longFlags(cmd);
    for (const f of ['--browser', '--burner', '--sign-only', '--frontend-url', '--no-open',
      '--timeout', '--expected-address', '--fund', '--fee', '--fee-denom', '--gas',
      '--new', '--reuse', '--non-interactive', '--poll-timeout']) {
      expect(flags).toContain(f);
    }
    // Concise names only — the old verbose forms must be gone.
    expect(flags).not.toContain('--deploy-with-browser');
    expect(flags).not.toContain('--deploy-with-burner');
  });

  test('is idempotent / does not clobber a pre-declared flag', () => {
    const cmd = new Command('y').option('--gas <n>', 'preexisting', '999');
    addDeployOptions(cmd);
    const gas = (cmd as any)._findOption('--gas');
    expect(gas.description).toBe('preexisting'); // not overwritten
    // and a second pass doesn't throw a commander duplicate-flag error
    expect(() => addDeployOptions(cmd)).not.toThrow();
  });
});

describe('isDeployRequested', () => {
  test('true only when --browser or --burner is set', () => {
    expect(isDeployRequested({})).toBe(false);
    expect(isDeployRequested({ signOnly: true, timeout: '60' })).toBe(false);
    expect(isDeployRequested({ browser: true })).toBe(true);
    expect(isDeployRequested({ burner: true })).toBe(true);
  });
});

describe('runEmitOrDeploy', () => {
  test('no deploy flag → emits the msg verbatim (pipe-to-bb-deploy path)', async () => {
    const msg = { typeUrl: '/tokenization.MsgTransferTokens', value: { a: 1 } };
    const seen: any[] = [];
    await runEmitOrDeploy(msg, {}, { emit: (m) => seen.push(m) });
    expect(seen).toEqual([msg]);
  });
});
