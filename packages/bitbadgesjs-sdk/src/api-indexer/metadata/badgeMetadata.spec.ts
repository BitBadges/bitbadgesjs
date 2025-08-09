import { TokenMetadataDetails } from './badgeMetadata';
import { Metadata } from '../metadata';

describe('TokenMetadataDetails', () => {
  describe('batchUpdateTokenMetadata', () => {
    it('should update existing metadata and add new metadata', () => {
      // Existing metadata
      const existingMetadata = [
        new TokenMetadataDetails({
          tokenIds: [{ start: 1n, end: 5n }],
          metadata: new Metadata({ name: 'Existing Token', description: 'Existing description', image: '' }),
          uri: 'https://example.com/existing',
          customData: 'existing'
        })
      ];

      // New metadata to be added/updated
      const newMetadata = [
        new TokenMetadataDetails({
          tokenIds: [{ start: 3n, end: 7n }],
          metadata: new Metadata({ name: 'Updated Token', description: 'Updated description', image: '' }),
          uri: 'https://example.com/updated',
          customData: 'updated'
        }),
        new TokenMetadataDetails({
          tokenIds: [{ start: 8n, end: 10n }],
          metadata: new Metadata({ name: 'New Token', description: 'New description', image: '' }),
          uri: 'https://example.com/new',
          customData: 'new'
        })
      ];

      const result = TokenMetadataDetails.batchUpdateTokenMetadata(existingMetadata, newMetadata);

      expect(result).toHaveLength(3);

      // Check the updated existing metadata
      expect(result[0].tokenIds[0].start).toBe(1n);
      expect(result[0].tokenIds[0].end).toBe(2n);
      expect(result[0].metadata?.name).toBe('Existing Token');

      // Check the new metadata that partially overlapped with existing
      expect(result[1].tokenIds[0].start).toBe(3n);
      expect(result[1].tokenIds[0].end).toBe(7n);
      expect(result[1].metadata?.name).toBe('Updated Token');

      // Check the completely new metadata
      expect(result[2].tokenIds[0].start).toBe(8n);
      expect(result[2].tokenIds[0].end).toBe(10n);
      expect(result[2].metadata?.name).toBe('New Token');
    });

    it('should handle empty input arrays', () => {
      const result = TokenMetadataDetails.batchUpdateTokenMetadata([], []);
      expect(result).toEqual([]);
    });

    it('should handle updating with empty metadata', () => {
      const existingMetadata = [
        new TokenMetadataDetails({
          tokenIds: [{ start: 1n, end: 5n }],
          metadata: new Metadata({ name: 'Existing Token', description: 'Existing description', image: '' }),
          uri: 'https://example.com/existing',
          customData: 'existing'
        })
      ];

      const newMetadata = [
        new TokenMetadataDetails({
          tokenIds: [{ start: 3n, end: 7n }],
          metadata: undefined,
          uri: 'https://example.com/updated',
          customData: 'updated'
        })
      ];

      const result = TokenMetadataDetails.batchUpdateTokenMetadata(existingMetadata, newMetadata);

      expect(result).toHaveLength(2);
      expect(result[0].tokenIds[0].start).toBe(1n);
      expect(result[0].tokenIds[0].end).toBe(2n);
      expect(result[1].tokenIds[0].start).toBe(3n);
      expect(result[1].tokenIds[0].end).toBe(7n);
      expect(result[1].metadata).toBeUndefined();
    });

    it('should merge overlapping token ranges', () => {
      const existingMetadata = [
        new TokenMetadataDetails({
          tokenIds: [{ start: 1n, end: 5n }],
          metadata: new Metadata({ name: 'Existing Token', description: 'Existing description', image: '' }),
          uri: 'https://example.com/existing',
          customData: 'existing'
        })
      ];

      const newMetadata = [
        new TokenMetadataDetails({
          tokenIds: [
            { start: 4n, end: 6n },
            { start: 8n, end: 10n }
          ],
          metadata: new Metadata({ name: 'New Token', description: 'New description', image: '' }),
          uri: 'https://example.com/new',
          customData: 'new'
        })
      ];

      const result = TokenMetadataDetails.batchUpdateTokenMetadata(existingMetadata, newMetadata);

      expect(result).toHaveLength(2);
      expect(result[0].tokenIds[0].start).toBe(1n);
      expect(result[0].tokenIds[0].end).toBe(3n);
      expect(result[1].tokenIds[0].start).toBe(4n);
      expect(result[1].tokenIds[0].end).toBe(6n);
      expect(result[1].tokenIds[1].start).toBe(8n);
      expect(result[1].tokenIds[1].end).toBe(10n);
      expect(result[1].metadata?.name).toBe('New Token');
    });
  });
});
