import { handleBuildClaim } from './buildClaim.js';

describe('claim builder input contract', () => {
  it.each([
    { claimType: 'must-own-tokens' },
    { maxUses: 0 },
    { maxUses: 1.5 },
    { refunds: true },
    { password: 'ignored-by-open' },
    { claimType: 'code-gated', numCodes: 10001 }
  ])('rejects unsupported or ambiguous claim inputs %j', (override) => {
    const result = handleBuildClaim({ claimType: 'open', name: 'Example', maxUses: 2, ...override } as any);
    expect(result.success).toBe(false);
    expect(result.claim).toBeUndefined();
    expect(result.error).toBeTruthy();
  });

  it.each(['open', 'code-gated', 'password-gated', 'whitelist-gated'] as const)('builds %s without mutating input', (claimType) => {
    const input = {
      claimType, name: 'Example', maxUses: 2,
      ...(claimType === 'password-gated' ? { password: 'test-only' } : {}),
      ...(claimType === 'whitelist-gated' ? { whitelist: ['0x3333333333333333333333333333333333333333'] } : {})
    };
    const before = JSON.stringify(input);
    const result = handleBuildClaim(input);
    expect(result.success).toBe(true);
    expect(result.claim).toBeDefined();
    expect(JSON.stringify(input)).toBe(before);
    if (claimType === 'code-gated') expect(new Set(result.codes).size).toBe(2);
  });
});
