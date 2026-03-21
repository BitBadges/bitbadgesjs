/**
 * Tests for permission-utils.ts
 *
 * Covers: getPermissionVariablesFromName for all PermissionNameString values.
 */

import { ActionPermissionUsedFlags, ApprovalPermissionUsedFlags, TokenIdsActionPermissionUsedFlags } from './overlaps.js';
import { ActionPermission, CollectionApprovalPermission, TokenIdsActionPermission } from './permissions.js';
import { getPermissionVariablesFromName, PermissionNameString } from './permission-utils.js';

describe('getPermissionVariablesFromName', () => {
  describe('flags assignment', () => {
    const actionFlagNames: PermissionNameString[] = [
      'canDeleteCollection',
      'canArchiveCollection',
      'canUpdateStandards',
      'canUpdateCustomData',
      'canUpdateManager',
      'canUpdateCollectionMetadata',
      'canUpdateAutoApproveSelfInitiatedOutgoingTransfers',
      'canUpdateAutoApproveSelfInitiatedIncomingTransfers',
      'canUpdateAutoApproveAllIncomingTransfers',
      'canAddMoreAliasPaths',
      'canAddMoreCosmosCoinWrapperPaths'
    ];

    for (const name of actionFlagNames) {
      it(`should return ActionPermissionUsedFlags for "${name}"`, () => {
        const result = getPermissionVariablesFromName(name);
        expect(result.flags).toBe(ActionPermissionUsedFlags);
      });
    }

    it('should return TokenIdsActionPermissionUsedFlags for "canUpdateValidTokenIds"', () => {
      const result = getPermissionVariablesFromName('canUpdateValidTokenIds');
      expect(result.flags).toBe(TokenIdsActionPermissionUsedFlags);
    });

    it('should return TokenIdsActionPermissionUsedFlags for "canUpdateTokenMetadata"', () => {
      const result = getPermissionVariablesFromName('canUpdateTokenMetadata');
      expect(result.flags).toBe(TokenIdsActionPermissionUsedFlags);
    });

    it('should return ApprovalPermissionUsedFlags for "canUpdateCollectionApprovals"', () => {
      const result = getPermissionVariablesFromName('canUpdateCollectionApprovals');
      expect(result.flags).toBe(ApprovalPermissionUsedFlags);
    });
  });

  describe('validatePermissionUpdateFunction assignment', () => {
    it('should return ActionPermission.validateUpdate for canDeleteCollection', () => {
      const result = getPermissionVariablesFromName('canDeleteCollection');
      expect(result.validatePermissionUpdateFunction).toBe(ActionPermission.validateUpdate);
    });

    it('should return ActionPermission.validateUpdate for canArchiveCollection', () => {
      const result = getPermissionVariablesFromName('canArchiveCollection');
      expect(result.validatePermissionUpdateFunction).toBe(ActionPermission.validateUpdate);
    });

    it('should return ActionPermission.validateUpdate for canUpdateManager', () => {
      const result = getPermissionVariablesFromName('canUpdateManager');
      expect(result.validatePermissionUpdateFunction).toBe(ActionPermission.validateUpdate);
    });

    it('should return TokenIdsActionPermission.validateUpdate for canUpdateValidTokenIds', () => {
      const result = getPermissionVariablesFromName('canUpdateValidTokenIds');
      expect(result.validatePermissionUpdateFunction).toBe(TokenIdsActionPermission.validateUpdate);
    });

    it('should return TokenIdsActionPermission.validateUpdate for canUpdateTokenMetadata', () => {
      const result = getPermissionVariablesFromName('canUpdateTokenMetadata');
      expect(result.validatePermissionUpdateFunction).toBe(TokenIdsActionPermission.validateUpdate);
    });

    it('should return CollectionApprovalPermission.validateUpdate for canUpdateCollectionApprovals', () => {
      const result = getPermissionVariablesFromName('canUpdateCollectionApprovals');
      expect(result.validatePermissionUpdateFunction).toBe(CollectionApprovalPermission.validateUpdate);
    });

    it('should return ActionPermission.validateUpdate for auto-approve permissions', () => {
      for (const name of [
        'canUpdateAutoApproveSelfInitiatedOutgoingTransfers',
        'canUpdateAutoApproveSelfInitiatedIncomingTransfers',
        'canUpdateAutoApproveAllIncomingTransfers'
      ] as PermissionNameString[]) {
        const result = getPermissionVariablesFromName(name);
        expect(result.validatePermissionUpdateFunction).toBe(ActionPermission.validateUpdate);
      }
    });

    it('should return ActionPermission.validateUpdate for canAddMoreAliasPaths', () => {
      const result = getPermissionVariablesFromName('canAddMoreAliasPaths');
      expect(result.validatePermissionUpdateFunction).toBe(ActionPermission.validateUpdate);
    });

    it('should return ActionPermission.validateUpdate for canAddMoreCosmosCoinWrapperPaths', () => {
      const result = getPermissionVariablesFromName('canAddMoreCosmosCoinWrapperPaths');
      expect(result.validatePermissionUpdateFunction).toBe(ActionPermission.validateUpdate);
    });
  });

  describe('question assignment', () => {
    it('should return correct question for canDeleteCollection', () => {
      const result = getPermissionVariablesFromName('canDeleteCollection');
      expect(result.question).toBe('Can delete the collection?');
    });

    it('should return correct question for canArchiveCollection', () => {
      const result = getPermissionVariablesFromName('canArchiveCollection');
      expect(result.question).toBe('Can archive the collection?');
    });

    it('should return correct question for canUpdateManager', () => {
      const result = getPermissionVariablesFromName('canUpdateManager');
      expect(result.question).toBe('Can update the manager?');
    });

    it('should return correct question for canUpdateCollectionApprovals', () => {
      const result = getPermissionVariablesFromName('canUpdateCollectionApprovals');
      expect(result.question).toBe('Can update collection approvals?');
    });

    it('should return correct question for canUpdateValidTokenIds', () => {
      const result = getPermissionVariablesFromName('canUpdateValidTokenIds');
      expect(result.question).toBe('Can create more tokens?');
    });

    it('should return correct question for canAddMoreAliasPaths', () => {
      const result = getPermissionVariablesFromName('canAddMoreAliasPaths');
      expect(result.question).toBe('Can add more alias paths?');
    });

    it('should return correct question for canAddMoreCosmosCoinWrapperPaths', () => {
      const result = getPermissionVariablesFromName('canAddMoreCosmosCoinWrapperPaths');
      expect(result.question).toBe('Can add more cosmos coin wrapper paths?');
    });
  });

  describe('validateFunction assignment', () => {
    it('should have a validateFunction for canArchiveCollection', () => {
      const result = getPermissionVariablesFromName('canArchiveCollection');
      expect(result.validateFunction).toBeDefined();
    });

    it('should have a validateFunction for canUpdateStandards', () => {
      const result = getPermissionVariablesFromName('canUpdateStandards');
      expect(result.validateFunction).toBeDefined();
    });

    it('should have a validateFunction for canUpdateCustomData', () => {
      const result = getPermissionVariablesFromName('canUpdateCustomData');
      expect(result.validateFunction).toBeDefined();
    });

    it('should have a validateFunction for canUpdateManager', () => {
      const result = getPermissionVariablesFromName('canUpdateManager');
      expect(result.validateFunction).toBeDefined();
    });

    it('should have a validateFunction for canUpdateCollectionMetadata', () => {
      const result = getPermissionVariablesFromName('canUpdateCollectionMetadata');
      expect(result.validateFunction).toBeDefined();
    });

    it('should have a validateFunction for canUpdateTokenMetadata', () => {
      const result = getPermissionVariablesFromName('canUpdateTokenMetadata');
      expect(result.validateFunction).toBeDefined();
    });

    it('should have a validateFunction for canUpdateCollectionApprovals', () => {
      const result = getPermissionVariablesFromName('canUpdateCollectionApprovals');
      expect(result.validateFunction).toBeDefined();
    });

    it('should have undefined validateFunction for canDeleteCollection', () => {
      const result = getPermissionVariablesFromName('canDeleteCollection');
      expect(result.validateFunction).toBeUndefined();
    });

    it('should have undefined validateFunction for canUpdateValidTokenIds', () => {
      const result = getPermissionVariablesFromName('canUpdateValidTokenIds');
      expect(result.validateFunction).toBeUndefined();
    });

    it('should have undefined validateFunction for auto-approve permissions', () => {
      for (const name of [
        'canUpdateAutoApproveSelfInitiatedOutgoingTransfers',
        'canUpdateAutoApproveSelfInitiatedIncomingTransfers',
        'canUpdateAutoApproveAllIncomingTransfers'
      ] as PermissionNameString[]) {
        const result = getPermissionVariablesFromName(name);
        expect(result.validateFunction).toBeUndefined();
      }
    });
  });

  describe('return shape', () => {
    it('should always return an object with flags, question, validateFunction, and validatePermissionUpdateFunction', () => {
      const allNames: PermissionNameString[] = [
        'canDeleteCollection',
        'canArchiveCollection',
        'canUpdateTokenMetadata',
        'canUpdateCollectionMetadata',
        'canUpdateValidTokenIds',
        'canUpdateCollectionApprovals',
        'canUpdateAutoApproveSelfInitiatedIncomingTransfers',
        'canUpdateAutoApproveSelfInitiatedOutgoingTransfers',
        'canUpdateAutoApproveAllIncomingTransfers',
        'canUpdateStandards',
        'canUpdateCustomData',
        'canUpdateManager',
        'canAddMoreAliasPaths',
        'canAddMoreCosmosCoinWrapperPaths'
      ];

      for (const name of allNames) {
        const result = getPermissionVariablesFromName(name);
        expect(result).toHaveProperty('flags');
        expect(result).toHaveProperty('question');
        expect(result).toHaveProperty('validateFunction');
        expect(result).toHaveProperty('validatePermissionUpdateFunction');
        expect(typeof result.question).toBe('string');
        expect(result.question.length).toBeGreaterThan(0);
      }
    });
  });
});
