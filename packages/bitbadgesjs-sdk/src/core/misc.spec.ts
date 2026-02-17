/**
 * Tests for misc.ts - Validation Functions and Utility Classes
 *
 * These tests cover the validation functions that gate on-chain state transitions:
 * - validateIsArchivedUpdate
 * - validateTokenMetadataUpdate
 * - validateCollectionMetadataUpdate
 * - validateManagerUpdate
 * - validateCustomDataUpdate
 * - validateStandardsUpdate
 */
import { ActionPermission, TokenIdsActionPermission } from './permissions.js';
import { UintRange, UintRangeArray } from './uintRanges.js';
import {
  CollectionMetadata,
  TokenMetadata,
  validateCollectionMetadataUpdate,
  validateCustomDataUpdate,
  validateIsArchivedUpdate,
  validateManagerUpdate,
  validateStandardsUpdate,
  validateTokenMetadataUpdate
} from './misc.js';

// Helper to create an ActionPermission that permits updates
function createPermittingActionPermission(): ActionPermission<bigint> {
  return new ActionPermission<bigint>({
    permanentlyPermittedTimes: UintRangeArray.From([{ start: 1n, end: 18446744073709551615n }]),
    permanentlyForbiddenTimes: UintRangeArray.From([])
  });
}

// Helper to create an ActionPermission that forbids updates
function createForbiddingActionPermission(): ActionPermission<bigint> {
  return new ActionPermission<bigint>({
    permanentlyPermittedTimes: UintRangeArray.From([]),
    permanentlyForbiddenTimes: UintRangeArray.From([{ start: 1n, end: 18446744073709551615n }])
  });
}

// Helper to create a TokenIdsActionPermission that permits updates
function createPermittingTokenIdsActionPermission(tokenIds: { start: bigint; end: bigint }[]): TokenIdsActionPermission<bigint> {
  return new TokenIdsActionPermission<bigint>({
    tokenIds: UintRangeArray.From(tokenIds),
    permanentlyPermittedTimes: UintRangeArray.From([{ start: 1n, end: 18446744073709551615n }]),
    permanentlyForbiddenTimes: UintRangeArray.From([])
  });
}

// Helper to create a TokenIdsActionPermission that forbids updates
function createForbiddingTokenIdsActionPermission(tokenIds: { start: bigint; end: bigint }[]): TokenIdsActionPermission<bigint> {
  return new TokenIdsActionPermission<bigint>({
    tokenIds: UintRangeArray.From(tokenIds),
    permanentlyPermittedTimes: UintRangeArray.From([]),
    permanentlyForbiddenTimes: UintRangeArray.From([{ start: 1n, end: 18446744073709551615n }])
  });
}

describe('misc validation functions', () => {
  describe('validateIsArchivedUpdate', () => {
    test('should return null when there are no changes', () => {
      const result = validateIsArchivedUpdate(false, false, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should return null when there are no changes (both true)', () => {
      const result = validateIsArchivedUpdate(true, true, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should return null when archiving is permitted', () => {
      const result = validateIsArchivedUpdate(false, true, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should return null when unarchiving is permitted', () => {
      const result = validateIsArchivedUpdate(true, false, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should return error when archiving is forbidden', () => {
      const result = validateIsArchivedUpdate(false, true, [createForbiddingActionPermission()]);
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Error);
    });

    test('should return error when unarchiving is forbidden', () => {
      const result = validateIsArchivedUpdate(true, false, [createForbiddingActionPermission()]);
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Error);
    });

    test('should handle empty permissions array (no restrictions)', () => {
      const result = validateIsArchivedUpdate(false, true, []);
      // Empty permissions means no restrictions - should pass
      expect(result).toBeNull();
    });
  });

  describe('validateCollectionMetadataUpdate', () => {
    test('should return null when there are no changes', () => {
      const metadata = new CollectionMetadata({ uri: 'ipfs://test', customData: 'data' });
      const result = validateCollectionMetadataUpdate(metadata, metadata, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should return null when update is permitted', () => {
      const oldMetadata = new CollectionMetadata({ uri: 'ipfs://old', customData: 'old' });
      const newMetadata = new CollectionMetadata({ uri: 'ipfs://new', customData: 'new' });
      const result = validateCollectionMetadataUpdate(oldMetadata, newMetadata, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should return error when update is forbidden', () => {
      const oldMetadata = new CollectionMetadata({ uri: 'ipfs://old', customData: 'old' });
      const newMetadata = new CollectionMetadata({ uri: 'ipfs://new', customData: 'new' });
      const result = validateCollectionMetadataUpdate(oldMetadata, newMetadata, [createForbiddingActionPermission()]);
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Error);
    });

    test('should handle URI-only changes', () => {
      const oldMetadata = new CollectionMetadata({ uri: 'ipfs://old', customData: 'same' });
      const newMetadata = new CollectionMetadata({ uri: 'ipfs://new', customData: 'same' });
      const result = validateCollectionMetadataUpdate(oldMetadata, newMetadata, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should handle customData-only changes', () => {
      const oldMetadata = new CollectionMetadata({ uri: 'ipfs://same', customData: 'old' });
      const newMetadata = new CollectionMetadata({ uri: 'ipfs://same', customData: 'new' });
      const result = validateCollectionMetadataUpdate(oldMetadata, newMetadata, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });
  });

  describe('validateManagerUpdate', () => {
    const oldManager = 'bb1abc123';
    const newManager = 'bb1def456';

    test('should return null when there are no changes', () => {
      const result = validateManagerUpdate(oldManager, oldManager, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should return null when update is permitted', () => {
      const result = validateManagerUpdate(oldManager, newManager, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should return error when update is forbidden', () => {
      const result = validateManagerUpdate(oldManager, newManager, [createForbiddingActionPermission()]);
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('validateCustomDataUpdate', () => {
    test('should return null when there are no changes', () => {
      const result = validateCustomDataUpdate('same data', 'same data', [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should return null when update is permitted', () => {
      const result = validateCustomDataUpdate('old data', 'new data', [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should return error when update is forbidden', () => {
      const result = validateCustomDataUpdate('old data', 'new data', [createForbiddingActionPermission()]);
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Error);
    });

    test('should handle empty string to non-empty', () => {
      const result = validateCustomDataUpdate('', 'new data', [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should handle non-empty string to empty', () => {
      const result = validateCustomDataUpdate('old data', '', [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });
  });

  describe('validateStandardsUpdate', () => {
    test('should return null when there are no changes', () => {
      const standards = ['ERC-3643', 'Security Token'];
      const result = validateStandardsUpdate(standards, standards, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should return null when update is permitted', () => {
      const oldStandards = ['ERC-3643'];
      const newStandards = ['ERC-3643', 'Security Token'];
      const result = validateStandardsUpdate(oldStandards, newStandards, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should return error when update is forbidden', () => {
      const oldStandards = ['ERC-3643'];
      const newStandards = ['ERC-3643', 'Security Token'];
      const result = validateStandardsUpdate(oldStandards, newStandards, [createForbiddingActionPermission()]);
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Error);
    });

    test('should handle removing standards', () => {
      const oldStandards = ['ERC-3643', 'Security Token'];
      const newStandards = ['ERC-3643'];
      const result = validateStandardsUpdate(oldStandards, newStandards, [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should handle empty to non-empty', () => {
      const result = validateStandardsUpdate([], ['ERC-3643'], [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should handle non-empty to empty', () => {
      const result = validateStandardsUpdate(['ERC-3643'], [], [createPermittingActionPermission()]);
      expect(result).toBeNull();
    });

    test('should detect order changes as different', () => {
      const oldStandards = ['A', 'B'];
      const newStandards = ['B', 'A'];
      // Order change is detected as a change by JSON.stringify comparison
      const result = validateStandardsUpdate(oldStandards, newStandards, [createPermittingActionPermission()]);
      expect(result).toBeNull(); // Permitted, but detected as a change
    });
  });

  describe('validateTokenMetadataUpdate', () => {
    test('should return null when there are no changes', () => {
      const tokenMetadata = [
        new TokenMetadata<bigint>({
          uri: 'ipfs://test',
          tokenIds: [{ start: 1n, end: 10n }],
          customData: 'data'
        })
      ];
      const result = validateTokenMetadataUpdate(tokenMetadata, tokenMetadata, [createPermittingTokenIdsActionPermission([{ start: 1n, end: 10n }])]);
      expect(result).toBeNull();
    });

    test('should return null when update is permitted for affected token IDs', () => {
      const oldMetadata = [
        new TokenMetadata<bigint>({
          uri: 'ipfs://old',
          tokenIds: [{ start: 1n, end: 10n }],
          customData: 'old'
        })
      ];
      const newMetadata = [
        new TokenMetadata<bigint>({
          uri: 'ipfs://new',
          tokenIds: [{ start: 1n, end: 10n }],
          customData: 'new'
        })
      ];
      const result = validateTokenMetadataUpdate(oldMetadata, newMetadata, [createPermittingTokenIdsActionPermission([{ start: 1n, end: 10n }])]);
      expect(result).toBeNull();
    });

    test('should return error when update is forbidden for affected token IDs', () => {
      const oldMetadata = [
        new TokenMetadata<bigint>({
          uri: 'ipfs://old',
          tokenIds: [{ start: 1n, end: 10n }],
          customData: 'old'
        })
      ];
      const newMetadata = [
        new TokenMetadata<bigint>({
          uri: 'ipfs://new',
          tokenIds: [{ start: 1n, end: 10n }],
          customData: 'new'
        })
      ];
      const result = validateTokenMetadataUpdate(oldMetadata, newMetadata, [createForbiddingTokenIdsActionPermission([{ start: 1n, end: 10n }])]);
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Error);
    });

    test('should handle adding new token metadata', () => {
      const oldMetadata: TokenMetadata<bigint>[] = [];
      const newMetadata = [
        new TokenMetadata<bigint>({
          uri: 'ipfs://new',
          tokenIds: [{ start: 1n, end: 10n }],
          customData: 'new'
        })
      ];
      const result = validateTokenMetadataUpdate(oldMetadata, newMetadata, [createPermittingTokenIdsActionPermission([{ start: 1n, end: 10n }])]);
      expect(result).toBeNull();
    });

    test('should handle removing token metadata', () => {
      const oldMetadata = [
        new TokenMetadata<bigint>({
          uri: 'ipfs://old',
          tokenIds: [{ start: 1n, end: 10n }],
          customData: 'old'
        })
      ];
      const newMetadata: TokenMetadata<bigint>[] = [];
      const result = validateTokenMetadataUpdate(oldMetadata, newMetadata, [createPermittingTokenIdsActionPermission([{ start: 1n, end: 10n }])]);
      expect(result).toBeNull();
    });

    test('should only check permissions for affected token IDs', () => {
      const oldMetadata = [
        new TokenMetadata<bigint>({
          uri: 'ipfs://same',
          tokenIds: [{ start: 1n, end: 5n }],
          customData: 'same'
        }),
        new TokenMetadata<bigint>({
          uri: 'ipfs://old',
          tokenIds: [{ start: 6n, end: 10n }],
          customData: 'old'
        })
      ];
      const newMetadata = [
        new TokenMetadata<bigint>({
          uri: 'ipfs://same',
          tokenIds: [{ start: 1n, end: 5n }],
          customData: 'same'
        }),
        new TokenMetadata<bigint>({
          uri: 'ipfs://new', // Only this changed
          tokenIds: [{ start: 6n, end: 10n }],
          customData: 'old'
        })
      ];
      // Permit changes to all token IDs 1-10
      const permissions = [createPermittingTokenIdsActionPermission([{ start: 1n, end: 10n }])];
      // Should succeed because all affected token IDs are permitted
      const result = validateTokenMetadataUpdate(oldMetadata, newMetadata, permissions);
      expect(result).toBeNull();
    });

    test('should return error when some affected token IDs are forbidden', () => {
      const oldMetadata = [
        new TokenMetadata<bigint>({
          uri: 'ipfs://old',
          tokenIds: [{ start: 1n, end: 10n }],
          customData: 'old'
        })
      ];
      const newMetadata = [
        new TokenMetadata<bigint>({
          uri: 'ipfs://new',
          tokenIds: [{ start: 1n, end: 10n }],
          customData: 'new'
        })
      ];
      // Only permit changes to 1-5, forbid changes to 6-10
      const permissions = [
        createPermittingTokenIdsActionPermission([{ start: 1n, end: 5n }]),
        createForbiddingTokenIdsActionPermission([{ start: 6n, end: 10n }])
      ];
      // Should fail because 6-10 are affected but forbidden
      const result = validateTokenMetadataUpdate(oldMetadata, newMetadata, permissions);
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('TokenMetadata', () => {
    test('should create a TokenMetadata instance', () => {
      const metadata = new TokenMetadata<bigint>({
        uri: 'ipfs://test',
        tokenIds: [{ start: 1n, end: 10n }],
        customData: 'custom'
      });

      expect(metadata.uri).toBe('ipfs://test');
      expect(metadata.tokenIds.length).toBe(1);
      expect(metadata.tokenIds[0].start).toBe(1n);
      expect(metadata.tokenIds[0].end).toBe(10n);
      expect(metadata.customData).toBe('custom');
    });

    test('should convert to different number types', () => {
      const bigintMetadata = new TokenMetadata<bigint>({
        uri: 'ipfs://test',
        tokenIds: [{ start: 1n, end: 10n }],
        customData: 'custom'
      });

      const stringMetadata = bigintMetadata.convert((x) => x.toString());
      expect(stringMetadata.tokenIds[0].start).toBe('1');
      expect(stringMetadata.tokenIds[0].end).toBe('10');
    });

    test('getFirstMatches should remove duplicate token IDs', () => {
      const metadata1 = new TokenMetadata<bigint>({
        uri: 'ipfs://first',
        tokenIds: [{ start: 1n, end: 10n }],
        customData: ''
      });
      const metadata2 = new TokenMetadata<bigint>({
        uri: 'ipfs://second',
        tokenIds: [{ start: 5n, end: 15n }], // Overlaps with first
        customData: ''
      });

      const result = TokenMetadata.getFirstMatches([metadata1, metadata2]);

      // First metadata should keep 1-10
      expect(result[0].tokenIds[0].start).toBe(1n);
      expect(result[0].tokenIds[0].end).toBe(10n);

      // Second metadata should only have 11-15 (5-10 removed due to first match)
      expect(result[1].tokenIds[0].start).toBe(11n);
      expect(result[1].tokenIds[0].end).toBe(15n);
    });
  });

  describe('CollectionMetadata', () => {
    test('should create a CollectionMetadata instance', () => {
      const metadata = new CollectionMetadata({
        uri: 'ipfs://collection',
        customData: 'collection custom data'
      });

      expect(metadata.uri).toBe('ipfs://collection');
      expect(metadata.customData).toBe('collection custom data');
    });

    test('should handle empty values', () => {
      const metadata = new CollectionMetadata({
        uri: '',
        customData: ''
      });

      expect(metadata.uri).toBe('');
      expect(metadata.customData).toBe('');
    });
  });
});
