import { Command } from 'commander';
import { addExpiryOption, resolveExpiry } from './expiry-options.js';

const longFlags = (cmd: Command) => (cmd as any).options.map((o: any) => o.long);

describe('addExpiryOption', () => {
  test('adds canonical --expiration + hidden deprecated --expiry alias', () => {
    const cmd = addExpiryOption(new Command('a'));
    expect(longFlags(cmd)).toEqual(expect.arrayContaining(['--expiration', '--expiry']));
    const expiry = (cmd as any)._findOption('--expiry');
    expect(expiry.description).toMatch(/deprecated alias/i);
  });
  test('idempotent — does not clobber a pre-declared flag', () => {
    const cmd = new Command('b').option('--expiration <w>', 'preexisting');
    addExpiryOption(cmd);
    expect((cmd as any)._findOption('--expiration').description).toBe('preexisting');
  });
});

describe('resolveExpiry', () => {
  test('prefers --expiration, parses a duration', () => {
    const ms = Number(resolveExpiry({ expiration: '1h' }, 999));
    expect(ms).toBeGreaterThan(Date.now() + 59 * 60 * 1000);
    expect(ms).toBeLessThan(Date.now() + 61 * 60 * 1000);
  });
  test('falls back to deprecated --expiry when --expiration absent', () => {
    expect(resolveExpiry({ expiry: '1748140800000' }, 999)).toBe(1748140800000n);
  });
  test('default = now + defaultMs when neither set', () => {
    const before = Date.now();
    const v = Number(resolveExpiry({}, 5000));
    expect(v).toBeGreaterThanOrEqual(before + 5000);
    expect(v).toBeLessThan(before + 5000 + 2000);
  });
});
