import { Command } from 'commander';
import { addApprovalIdOption, resolveApprovalId } from './approval-id-options.js';

const longFlags = (cmd: Command) => (cmd as any).options.map((o: any) => o.long);

describe('addApprovalIdOption', () => {
  test('adds --approval-id', () => {
    const cmd = addApprovalIdOption(new Command('a'));
    expect(longFlags(cmd)).toContain('--approval-id');
  });
  test('idempotent — does not clobber a pre-declared flag', () => {
    const cmd = new Command('b').option('--approval-id <id>', 'preexisting');
    addApprovalIdOption(cmd);
    expect((cmd as any)._findOption('--approval-id').description).toBe('preexisting');
  });
});

describe('resolveApprovalId', () => {
  test('returns the pinned id verbatim when provided', () => {
    expect(resolveApprovalId({ approvalId: 'my-fixed-id' })).toBe('my-fixed-id');
  });
  test('generates a fresh 32-hex-char id when not pinned', () => {
    const a = resolveApprovalId({});
    const b = resolveApprovalId({});
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toBe(b);
  });
});
