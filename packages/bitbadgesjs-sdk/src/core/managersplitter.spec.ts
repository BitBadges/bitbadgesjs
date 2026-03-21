/**
 * Tests for managersplitter.ts
 *
 * Covers: PermissionCriteria constructor, convert, toProto, fromProto, fromJson, fromJsonString,
 * ManagerSplitterPermissions constructor, convert, toProto, fromProto, fromJson, fromJsonString
 */

import { PermissionCriteria, ManagerSplitterPermissions } from './managersplitter.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

describe('PermissionCriteria', () => {
  describe('constructor', () => {
    it('should construct with approved addresses', () => {
      const pc = new PermissionCriteria({ approvedAddresses: ['bb1abc', 'bb1def'] });
      expect(pc.approvedAddresses).toEqual(['bb1abc', 'bb1def']);
    });

    it('should default to empty array when approvedAddresses is undefined', () => {
      const pc = new PermissionCriteria({ approvedAddresses: undefined as any });
      expect(pc.approvedAddresses).toEqual([]);
    });

    it('should construct with empty array', () => {
      const pc = new PermissionCriteria({ approvedAddresses: [] });
      expect(pc.approvedAddresses).toEqual([]);
    });
  });

  describe('getNumberFieldNames', () => {
    it('should return empty array', () => {
      const pc = new PermissionCriteria({ approvedAddresses: [] });
      expect(pc.getNumberFieldNames()).toEqual([]);
    });
  });

  describe('convert', () => {
    it('should return a deep copy (no number fields)', () => {
      const pc = new PermissionCriteria({ approvedAddresses: ['bb1abc'] });
      const converted = pc.convert(String);
      expect(converted.approvedAddresses).toEqual(['bb1abc']);
      // Modifying converted should not affect original
      converted.approvedAddresses.push('bb1new');
      expect(pc.approvedAddresses.length).toBe(1);
    });
  });

  describe('toProto / fromProto round-trip', () => {
    it('should survive proto round-trip with addresses', () => {
      const pc = new PermissionCriteria({ approvedAddresses: ['bb1abc', 'bb1def'] });
      const proto = pc.toProto();
      const restored = PermissionCriteria.fromProto(proto);
      expect(restored.approvedAddresses).toEqual(['bb1abc', 'bb1def']);
    });

    it('should survive proto round-trip with empty addresses', () => {
      const pc = new PermissionCriteria({ approvedAddresses: [] });
      const proto = pc.toProto();
      const restored = PermissionCriteria.fromProto(proto);
      expect(restored.approvedAddresses).toEqual([]);
    });
  });

  describe('fromJson / fromJsonString', () => {
    it('should construct from JSON value', () => {
      const json = { approvedAddresses: ['bb1test'] };
      const pc = PermissionCriteria.fromJson(json);
      expect(pc.approvedAddresses).toEqual(['bb1test']);
    });

    it('should construct from JSON string', () => {
      const jsonStr = JSON.stringify({ approvedAddresses: ['bb1test', 'bb1other'] });
      const pc = PermissionCriteria.fromJsonString(jsonStr);
      expect(pc.approvedAddresses).toEqual(['bb1test', 'bb1other']);
    });
  });
});

describe('ManagerSplitterPermissions', () => {
  describe('constructor', () => {
    it('should construct with all permissions set', () => {
      const perms = new ManagerSplitterPermissions({
        canDeleteCollection: { approvedAddresses: ['bb1admin'] },
        canArchiveCollection: { approvedAddresses: ['bb1admin'] },
        canUpdateStandards: { approvedAddresses: [] },
        canUpdateCustomData: { approvedAddresses: ['bb1a', 'bb1b'] },
        canUpdateManager: { approvedAddresses: ['bb1admin'] },
        canUpdateCollectionMetadata: undefined,
        canUpdateValidTokenIds: undefined,
        canUpdateTokenMetadata: undefined,
        canUpdateCollectionApprovals: { approvedAddresses: ['bb1admin'] }
      });

      expect(perms.canDeleteCollection?.approvedAddresses).toEqual(['bb1admin']);
      expect(perms.canUpdateStandards?.approvedAddresses).toEqual([]);
      expect(perms.canUpdateCustomData?.approvedAddresses).toEqual(['bb1a', 'bb1b']);
      expect(perms.canUpdateCollectionMetadata).toBeUndefined();
      expect(perms.canUpdateValidTokenIds).toBeUndefined();
      expect(perms.canUpdateTokenMetadata).toBeUndefined();
    });

    it('should construct with all permissions undefined', () => {
      const perms = new ManagerSplitterPermissions({});
      expect(perms.canDeleteCollection).toBeUndefined();
      expect(perms.canArchiveCollection).toBeUndefined();
      expect(perms.canUpdateManager).toBeUndefined();
    });
  });

  describe('getNumberFieldNames', () => {
    it('should return empty array', () => {
      const perms = new ManagerSplitterPermissions({});
      expect(perms.getNumberFieldNames()).toEqual([]);
    });
  });

  describe('convert', () => {
    it('should return a deep copy', () => {
      const perms = new ManagerSplitterPermissions({
        canDeleteCollection: { approvedAddresses: ['bb1admin'] }
      });
      const converted = perms.convert(String);
      expect(converted.canDeleteCollection?.approvedAddresses).toEqual(['bb1admin']);
    });
  });

  describe('toProto / fromProto round-trip', () => {
    it('should survive proto round-trip with all permissions set', () => {
      const perms = new ManagerSplitterPermissions({
        canDeleteCollection: { approvedAddresses: ['bb1admin'] },
        canArchiveCollection: { approvedAddresses: ['bb1archive'] },
        canUpdateStandards: { approvedAddresses: [] },
        canUpdateCustomData: { approvedAddresses: ['bb1data'] },
        canUpdateManager: { approvedAddresses: ['bb1mgr'] },
        canUpdateCollectionMetadata: { approvedAddresses: ['bb1meta'] },
        canUpdateValidTokenIds: { approvedAddresses: ['bb1tok'] },
        canUpdateTokenMetadata: { approvedAddresses: ['bb1tmeta'] },
        canUpdateCollectionApprovals: { approvedAddresses: ['bb1appr'] }
      });
      const proto = perms.toProto();
      const restored = ManagerSplitterPermissions.fromProto(proto);

      expect(restored.canDeleteCollection?.approvedAddresses).toEqual(['bb1admin']);
      expect(restored.canArchiveCollection?.approvedAddresses).toEqual(['bb1archive']);
      expect(restored.canUpdateStandards?.approvedAddresses).toEqual([]);
      expect(restored.canUpdateCustomData?.approvedAddresses).toEqual(['bb1data']);
      expect(restored.canUpdateManager?.approvedAddresses).toEqual(['bb1mgr']);
      expect(restored.canUpdateCollectionMetadata?.approvedAddresses).toEqual(['bb1meta']);
      expect(restored.canUpdateValidTokenIds?.approvedAddresses).toEqual(['bb1tok']);
      expect(restored.canUpdateTokenMetadata?.approvedAddresses).toEqual(['bb1tmeta']);
      expect(restored.canUpdateCollectionApprovals?.approvedAddresses).toEqual(['bb1appr']);
    });

    it('should survive proto round-trip with all permissions undefined', () => {
      const perms = new ManagerSplitterPermissions({});
      const proto = perms.toProto();
      const restored = ManagerSplitterPermissions.fromProto(proto);

      expect(restored.canDeleteCollection).toBeUndefined();
      expect(restored.canArchiveCollection).toBeUndefined();
      expect(restored.canUpdateStandards).toBeUndefined();
      expect(restored.canUpdateCustomData).toBeUndefined();
      expect(restored.canUpdateManager).toBeUndefined();
      expect(restored.canUpdateCollectionMetadata).toBeUndefined();
      expect(restored.canUpdateValidTokenIds).toBeUndefined();
      expect(restored.canUpdateTokenMetadata).toBeUndefined();
      expect(restored.canUpdateCollectionApprovals).toBeUndefined();
    });
  });

  describe('fromJson / fromJsonString', () => {
    it('should construct from JSON value', () => {
      const json = {
        canDeleteCollection: { approvedAddresses: ['bb1admin'] }
      };
      const perms = ManagerSplitterPermissions.fromJson(json);
      expect(perms.canDeleteCollection?.approvedAddresses).toEqual(['bb1admin']);
    });

    it('should construct from JSON string', () => {
      const jsonStr = JSON.stringify({
        canUpdateManager: { approvedAddresses: ['bb1mgr'] },
        canUpdateCollectionApprovals: { approvedAddresses: ['bb1a', 'bb1b'] }
      });
      const perms = ManagerSplitterPermissions.fromJsonString(jsonStr);
      expect(perms.canUpdateManager?.approvedAddresses).toEqual(['bb1mgr']);
      expect(perms.canUpdateCollectionApprovals?.approvedAddresses).toEqual(['bb1a', 'bb1b']);
    });

    it('should handle empty JSON', () => {
      const perms = ManagerSplitterPermissions.fromJson({});
      expect(perms.canDeleteCollection).toBeUndefined();
    });
  });
});
