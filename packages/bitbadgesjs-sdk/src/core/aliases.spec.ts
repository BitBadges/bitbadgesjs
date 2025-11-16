import { deriveIntermediateSender } from './aliases.js';

describe('deriveIntermediateSender', () => {
  it('should produce consistent bech32 addresses', () => {
    const channel = 'channel-0';
    const originalSender = 'cosmos1abc123';
    const bech32Prefix = 'cosmos';

    const result = deriveIntermediateSender(channel, originalSender, bech32Prefix);

    // Verify it's a valid bech32 address (prefix1 + base32 encoded data)
    // A 32-byte hash encoded in bech32 produces ~58 chars after the prefix1 separator
    expect(result).toMatch(/^cosmos1[a-z0-9]+$/);
    expect(result).toBeTruthy();
    expect(result.startsWith('cosmos1')).toBe(true);
    expect(result.length).toBeGreaterThan(45); // Should be around 65 chars for 32-byte hash
  });

  it('should produce different addresses for different channels', () => {
    const originalSender = 'cosmos1abc123';
    const bech32Prefix = 'cosmos';

    const result1 = deriveIntermediateSender('channel-0', originalSender, bech32Prefix);
    const result2 = deriveIntermediateSender('channel-1', originalSender, bech32Prefix);

    expect(result1).not.toBe(result2);
  });

  it('should produce different addresses for different senders', () => {
    const channel = 'channel-0';
    const bech32Prefix = 'cosmos';

    const result1 = deriveIntermediateSender(channel, 'cosmos1abc123', bech32Prefix);
    const result2 = deriveIntermediateSender(channel, 'cosmos1def456', bech32Prefix);

    expect(result1).not.toBe(result2);
  });

  it('should handle different bech32 prefixes', () => {
    const channel = 'channel-0';
    const originalSender = 'cosmos1abc123';

    const cosmosResult = deriveIntermediateSender(channel, originalSender, 'cosmos');
    const bbResult = deriveIntermediateSender(channel, originalSender, 'bb');

    expect(cosmosResult).toMatch(/^cosmos1[a-z0-9]+$/);
    expect(bbResult).toMatch(/^bb1[a-z0-9]+$/);
    expect(cosmosResult).not.toBe(bbResult);
    expect(cosmosResult.startsWith('cosmos1')).toBe(true);
    expect(bbResult.startsWith('bb1')).toBe(true);
  });

  it('should produce deterministic results', () => {
    const channel = 'channel-0';
    const originalSender = 'cosmos1abc123';
    const bech32Prefix = 'cosmos';

    const result1 = deriveIntermediateSender(channel, originalSender, bech32Prefix);
    const result2 = deriveIntermediateSender(channel, originalSender, bech32Prefix);

    expect(result1).toBe(result2);
  });

  it('should handle addresses without 0x prefix', () => {
    const channel = 'channel-0';
    const originalSender = 'cosmos1abc123'; // No 0x prefix
    const bech32Prefix = 'cosmos';

    const result = deriveIntermediateSender(channel, originalSender, bech32Prefix);

    expect(result).toMatch(/^cosmos1[a-z0-9]+$/);
    expect(result).not.toContain('0x');
    expect(result.startsWith('cosmos1')).toBe(true);
  });
});
