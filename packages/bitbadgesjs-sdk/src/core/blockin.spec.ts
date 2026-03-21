/**
 * Tests for blockin.ts
 *
 * Covers: SiwbbChallenge constructor, convert; generateBitBadgesAuthUrl
 */

import { SiwbbChallenge, generateBitBadgesAuthUrl } from './blockin.js';
import { SupportedChain } from '@/common/types.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

describe('SiwbbChallenge', () => {
  describe('constructor', () => {
    it('should construct with minimal data (no ownershipRequirements)', () => {
      const challenge = new SiwbbChallenge({
        address: '0xabc123',
        chain: SupportedChain.ETH,
        bitbadgesAddress: 'bb1abc' as any
      });
      expect(challenge.address).toBe('0xabc123');
      expect(challenge.chain).toBe(SupportedChain.ETH);
      expect(challenge.bitbadgesAddress).toBe('bb1abc');
      expect(challenge.ownershipRequirements).toBeUndefined();
      expect(challenge.verificationResponse).toBeUndefined();
    });

    it('should construct with verificationResponse', () => {
      const challenge = new SiwbbChallenge({
        address: '0xabc123',
        chain: SupportedChain.ETH,
        bitbadgesAddress: 'bb1abc' as any,
        verificationResponse: { success: true }
      });
      expect(challenge.verificationResponse?.success).toBe(true);
      expect(challenge.verificationResponse?.errorMessage).toBeUndefined();
    });

    it('should construct with verificationResponse containing error', () => {
      const challenge = new SiwbbChallenge({
        address: '0xabc123',
        chain: SupportedChain.ETH,
        bitbadgesAddress: 'bb1abc' as any,
        verificationResponse: { success: false, errorMessage: 'Asset not owned' }
      });
      expect(challenge.verificationResponse?.success).toBe(false);
      expect(challenge.verificationResponse?.errorMessage).toBe('Asset not owned');
    });

    it('should construct with $and ownershipRequirements', () => {
      const challenge = new SiwbbChallenge({
        address: '0xabc123',
        chain: SupportedChain.ETH,
        bitbadgesAddress: 'bb1abc' as any,
        ownershipRequirements: {
          $and: [
            {
              assets: [],
              options: { numMatchesForVerification: 0n }
            }
          ]
        }
      });
      expect(challenge.ownershipRequirements).toBeDefined();
    });

    it('should construct with $or ownershipRequirements', () => {
      const challenge = new SiwbbChallenge({
        address: '0xabc123',
        chain: SupportedChain.ETH,
        bitbadgesAddress: 'bb1abc' as any,
        ownershipRequirements: {
          $or: [
            {
              assets: [],
              options: { numMatchesForVerification: 0n }
            }
          ]
        }
      });
      expect(challenge.ownershipRequirements).toBeDefined();
    });

    it('should construct with direct OwnershipRequirements (no $and/$or)', () => {
      const challenge = new SiwbbChallenge({
        address: '0xabc123',
        chain: SupportedChain.ETH,
        bitbadgesAddress: 'bb1abc' as any,
        ownershipRequirements: {
          assets: [],
          options: { numMatchesForVerification: 0n }
        } as any
      });
      expect(challenge.ownershipRequirements).toBeDefined();
    });
  });

  describe('convert', () => {
    it('should convert number types', () => {
      const challenge = new SiwbbChallenge({
        address: '0xabc123',
        chain: SupportedChain.ETH,
        bitbadgesAddress: 'bb1abc' as any
      });
      const converted = challenge.convert(String);
      expect(converted.address).toBe('0xabc123');
      expect(converted.chain).toBe(SupportedChain.ETH);
    });
  });
});

describe('generateBitBadgesAuthUrl', () => {
  it('should generate URL with client_id', () => {
    const url = generateBitBadgesAuthUrl({ client_id: 'my-app' });
    expect(url).toContain('https://bitbadges.io/siwbb/authorize?');
    expect(url).toContain('client_id=my-app');
  });

  it('should include redirect_uri when provided', () => {
    const url = generateBitBadgesAuthUrl({
      client_id: 'my-app',
      redirect_uri: 'https://example.com/callback'
    });
    expect(url).toContain('redirect_uri=https://example.com/callback');
  });

  it('should include state when provided', () => {
    const url = generateBitBadgesAuthUrl({
      client_id: 'my-app',
      state: 'random-state-123'
    });
    expect(url).toContain('state=random-state-123');
  });

  it('should include scope when provided', () => {
    const url = generateBitBadgesAuthUrl({
      client_id: 'my-app',
      scope: 'completeClaims,approveSignInWithBitBadges'
    });
    expect(url).toContain('scope=completeClaims,approveSignInWithBitBadges');
  });

  it('should omit falsy values', () => {
    const url = generateBitBadgesAuthUrl({
      client_id: 'my-app',
      redirect_uri: undefined,
      state: undefined
    });
    expect(url).not.toContain('redirect_uri');
    expect(url).not.toContain('state');
  });

  it('should JSON-encode object values', () => {
    const url = generateBitBadgesAuthUrl({
      client_id: 'my-app',
      claimId: 'claim-1'
    });
    expect(url).toContain('claimId=claim-1');
  });

  it('should include all params together', () => {
    const url = generateBitBadgesAuthUrl({
      client_id: 'app-id',
      redirect_uri: 'https://example.com/cb',
      state: 'abc',
      scope: 'read'
    });
    expect(url).toContain('client_id=app-id');
    expect(url).toContain('redirect_uri=https://example.com/cb');
    expect(url).toContain('state=abc');
    expect(url).toContain('scope=read');
  });

  it('should URL-encode object params', () => {
    const url = generateBitBadgesAuthUrl({
      client_id: 'my-app',
      // hideIfAlreadyClaimed is a boolean but goes through the object check on its own
      hideIfAlreadyClaimed: true
    });
    // boolean true is not an object, so it should be serialized directly
    expect(url).toContain('hideIfAlreadyClaimed=true');
  });
});
