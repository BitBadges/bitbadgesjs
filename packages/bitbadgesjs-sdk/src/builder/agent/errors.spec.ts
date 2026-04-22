/**
 * Tests for typed error classes. The load-bearing contract is:
 * `instanceof` dispatch must work from a consumer's catch block,
 * even if they only have the parent `BitBadgesAgentError` type in
 * scope — that relies on the `Object.setPrototypeOf` fix in each
 * constructor.
 */

import {
  BitBadgesAgentError,
  ValidationFailedError,
  QuotaExceededError,
  AnthropicAuthError,
  AbortedError,
  PeerDependencyError,
  SimulationError
} from './errors.js';

describe('BitBadgesAgentError — base class', () => {
  it('has name, code, statusCode, and is an instanceof Error', () => {
    const e = new BitBadgesAgentError('boom');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(BitBadgesAgentError);
    expect(e.name).toBe('BitBadgesAgentError');
    expect(e.code).toBe('BITBADGES_AGENT_ERROR');
    expect(e.statusCode).toBe(500);
    expect(e.message).toBe('boom');
  });

  it('accepts custom code and statusCode', () => {
    const e = new BitBadgesAgentError('x', 'MY_CODE', 418);
    expect(e.code).toBe('MY_CODE');
    expect(e.statusCode).toBe(418);
  });
});

describe('ValidationFailedError', () => {
  const errors = [
    { code: 'validation', message: 'bad field', path: 'msg[0].x', fixHint: 'set to foo' },
    { code: 'standards', message: 'wrong shape' }
  ];
  const tx = { messages: [] };
  const advisory = ['consider locking approvals', 'set title'];

  it('carries errors, transaction, and advisoryNotes', () => {
    const e = new ValidationFailedError(errors, tx, advisory);
    expect(e.errors).toEqual(errors);
    expect(e.transaction).toBe(tx);
    expect(e.advisoryNotes).toEqual(advisory);
  });

  it('instanceof dispatch — is both ValidationFailedError and BitBadgesAgentError', () => {
    const e = new ValidationFailedError(errors, tx);
    expect(e).toBeInstanceOf(ValidationFailedError);
    expect(e).toBeInstanceOf(BitBadgesAgentError);
    expect(e).toBeInstanceOf(Error);
  });

  it('code/statusCode are VALIDATION_FAILED / 400', () => {
    const e = new ValidationFailedError(errors, tx);
    expect(e.code).toBe('VALIDATION_FAILED');
    expect(e.statusCode).toBe(400);
  });

  it('advisoryNotes defaults to empty array', () => {
    const e = new ValidationFailedError(errors, tx);
    expect(e.advisoryNotes).toEqual([]);
  });

  it('message summarizes errors', () => {
    const e = new ValidationFailedError(errors, tx);
    expect(e.message).toContain('2 errors');
    expect(e.message).toContain('bad field');
    expect(e.message).toContain('wrong shape');
  });

  it('singular "error" vs plural "errors" in message', () => {
    const single = new ValidationFailedError([errors[0]], tx);
    expect(single.message).toMatch(/1 error:/);
    expect(single.message).not.toMatch(/errors:/);
  });
});

describe('QuotaExceededError', () => {
  it('carries tokensUsed and tokenCap', () => {
    const e = new QuotaExceededError(1_600_000, 1_500_000);
    expect(e.tokensUsed).toBe(1_600_000);
    expect(e.tokenCap).toBe(1_500_000);
  });

  it('instanceof dispatch — both QuotaExceededError and BitBadgesAgentError', () => {
    const e = new QuotaExceededError(100, 50);
    expect(e).toBeInstanceOf(QuotaExceededError);
    expect(e).toBeInstanceOf(BitBadgesAgentError);
  });

  it('code/statusCode are QUOTA_EXCEEDED / 402', () => {
    const e = new QuotaExceededError(1, 1);
    expect(e.code).toBe('QUOTA_EXCEEDED');
    expect(e.statusCode).toBe(402);
  });

  it('message contains both numbers', () => {
    const e = new QuotaExceededError(1234, 5678);
    expect(e.message).toContain('1234');
    expect(e.message).toContain('5678');
  });
});

describe('AbortedError', () => {
  it('carries partialTokens (default 0)', () => {
    const a = new AbortedError();
    expect(a.partialTokens).toBe(0);
    const b = new AbortedError(12345);
    expect(b.partialTokens).toBe(12345);
  });

  it('instanceof dispatch — both AbortedError and BitBadgesAgentError', () => {
    const e = new AbortedError();
    expect(e).toBeInstanceOf(AbortedError);
    expect(e).toBeInstanceOf(BitBadgesAgentError);
  });

  it('code/statusCode are ABORTED / 499', () => {
    const e = new AbortedError(0);
    expect(e.code).toBe('ABORTED');
    expect(e.statusCode).toBe(499);
  });
});

describe('AnthropicAuthError', () => {
  it('includes optional detail in the message', () => {
    expect(new AnthropicAuthError().message).toMatch(/Anthropic authentication failed/);
    expect(new AnthropicAuthError('401 from anthropic').message).toMatch(/401 from anthropic/);
  });

  it('instanceof dispatch', () => {
    const e = new AnthropicAuthError();
    expect(e).toBeInstanceOf(AnthropicAuthError);
    expect(e).toBeInstanceOf(BitBadgesAgentError);
  });
});

describe('PeerDependencyError', () => {
  it('relays its detail as the message', () => {
    const e = new PeerDependencyError('@anthropic-ai/sdk not found');
    expect(e.message).toBe('@anthropic-ai/sdk not found');
  });

  it('instanceof dispatch', () => {
    const e = new PeerDependencyError('x');
    expect(e).toBeInstanceOf(PeerDependencyError);
    expect(e).toBeInstanceOf(BitBadgesAgentError);
  });
});

describe('SimulationError', () => {
  it('carries optional detail', () => {
    const e = new SimulationError('out of gas');
    expect(e.detail).toBe('out of gas');
    expect(e.message).toMatch(/out of gas/);
  });

  it('default message when no detail', () => {
    const e = new SimulationError();
    expect(e.message).toMatch(/unknown error/);
  });

  it('instanceof dispatch', () => {
    const e = new SimulationError('x');
    expect(e).toBeInstanceOf(SimulationError);
    expect(e).toBeInstanceOf(BitBadgesAgentError);
  });
});

describe('instanceof discrimination in a catch block', () => {
  function categorize(err: unknown): string {
    if (err instanceof QuotaExceededError) return 'quota';
    if (err instanceof ValidationFailedError) return 'validation';
    if (err instanceof AbortedError) return 'aborted';
    if (err instanceof BitBadgesAgentError) return 'agent';
    return 'other';
  }

  it('dispatches to the right branch for each subclass', () => {
    expect(categorize(new QuotaExceededError(1, 1))).toBe('quota');
    expect(categorize(new ValidationFailedError([], null))).toBe('validation');
    expect(categorize(new AbortedError(0))).toBe('aborted');
    expect(categorize(new AnthropicAuthError())).toBe('agent');
    expect(categorize(new Error('raw'))).toBe('other');
  });
});
