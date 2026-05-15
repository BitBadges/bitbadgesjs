import { Command } from 'commander';
import * as fs from 'fs';
import { readStringOrFile, addMessageOptions } from './message-options.js';

const longFlags = (cmd: Command) => (cmd as any).options.map((o: any) => o.long);

describe('readStringOrFile', () => {
  test('inline string wins', () => {
    expect(readStringOrFile('hello', '/nope')).toBe('hello');
  });
  test('reads a file when no inline', () => {
    const p = `/tmp/msg-opts-spec-${process.pid}.txt`;
    fs.writeFileSync(p, 'from-file');
    try {
      expect(readStringOrFile(undefined, p)).toBe('from-file');
    } finally {
      fs.unlinkSync(p);
    }
  });
  test('neither → undefined (caller layers its own fallback)', () => {
    expect(readStringOrFile(undefined, undefined)).toBeUndefined();
    expect(readStringOrFile('', '')).toBeUndefined();
  });
});

describe('addMessageOptions', () => {
  test('adds the pair, tagged into the caller group, with caller descriptions', () => {
    const cmd = addMessageOptions(new Command('a'), { group: 'Auth', messageDesc: 'the challenge' });
    expect(longFlags(cmd)).toEqual(expect.arrayContaining(['--message', '--message-file']));
    expect((cmd as any)._findOption('--message').description).toBe('the challenge');
  });
  test('idempotent — does not clobber a pre-declared flag', () => {
    const cmd = new Command('b').option('--message <t>', 'preexisting');
    addMessageOptions(cmd, { group: 'G' });
    expect((cmd as any)._findOption('--message').description).toBe('preexisting');
  });
});
