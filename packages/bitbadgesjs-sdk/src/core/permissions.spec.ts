/**
 * Tests for permissions.ts
 *
 * Covers: ActionPermission, TokenIdsActionPermission, CollectionApprovalPermission,
 * CollectionApprovalPermissionWithDetails, UserPermissions, UserPermissionsWithDetails,
 * CollectionPermissions, CollectionPermissionsWithDetails, UserOutgoingApprovalPermission,
 * UserIncomingApprovalPermission, and the validate/check logic.
 */

import { genTestAddress } from './addressLists.spec.js';
import { AddressList } from './addressLists.js';
import {
  ActionPermission,
  TokenIdsActionPermission,
  CollectionApprovalPermission,
  CollectionApprovalPermissionWithDetails,
  CollectionPermissions,
  CollectionPermissionsWithDetails,
  UserPermissions,
  UserPermissionsWithDetails,
  UserOutgoingApprovalPermission,
  UserOutgoingApprovalPermissionWithDetails,
  UserIncomingApprovalPermission,
  UserIncomingApprovalPermissionWithDetails
} from './permissions.js';
import { UintRange, UintRangeArray } from './uintRanges.js';
import { BigIntify, Stringify } from '../common/string-numbers.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Helper: create a "full range" UintRangeArray
const fullRange = () => UintRangeArray.From([{ start: 1n, end: 18446744073709551615n }]);

// Helper: create a default AddressList (all addresses)
const allAddresses = () =>
  new AddressList({
    listId: 'All',
    addresses: [],
    whitelist: false,
    uri: '',
    customData: '',
    createdBy: ''
  });

// Helper: create a specific address list (whitelist with given addresses)
const whitelistOf = (addresses: string[]) =>
  new AddressList({
    listId: 'custom',
    addresses,
    whitelist: true,
    uri: '',
    customData: '',
    createdBy: ''
  });

describe('ActionPermission', () => {
  describe('construction', () => {
    it('should create an instance with empty times', () => {
      const perm = new ActionPermission({
        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: []
      });
      expect(perm).toBeTruthy();
      expect(perm.permanentlyPermittedTimes.length).toBe(0);
      expect(perm.permanentlyForbiddenTimes.length).toBe(0);
    });

    it('should create an instance with permitted times', () => {
      const perm = new ActionPermission({
        permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
        permanentlyForbiddenTimes: []
      });
      expect(perm.permanentlyPermittedTimes.length).toBe(1);
      expect(perm.permanentlyPermittedTimes[0].start).toBe(1n);
      expect(perm.permanentlyPermittedTimes[0].end).toBe(100n);
    });

    it('should create an instance with forbidden times', () => {
      const perm = new ActionPermission({
        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: [{ start: 1n, end: 18446744073709551615n }]
      });
      expect(perm.permanentlyForbiddenTimes.length).toBe(1);
    });
  });

  describe('castToUniversalPermission', () => {
    it('should cast to universal permission with all uses flags false', () => {
      const perm = new ActionPermission({
        permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
        permanentlyForbiddenTimes: []
      });
      const universal = perm.castToUniversalPermission();
      expect(universal.usesTokenIds).toBe(false);
      expect(universal.usesTimelineTimes).toBe(false);
      expect(universal.usesTransferTimes).toBe(false);
      expect(universal.usesToList).toBe(false);
      expect(universal.usesFromList).toBe(false);
      expect(universal.usesInitiatedByList).toBe(false);
      expect(universal.usesOwnershipTimes).toBe(false);
      expect(universal.usesApprovalIdList).toBe(false);
    });

    it('should preserve permitted/forbidden times in cast', () => {
      const perm = new ActionPermission({
        permanentlyPermittedTimes: [{ start: 10n, end: 20n }],
        permanentlyForbiddenTimes: [{ start: 30n, end: 40n }]
      });
      const universal = perm.castToUniversalPermission();
      expect(universal.permanentlyPermittedTimes[0].start).toBe(10n);
      expect(universal.permanentlyPermittedTimes[0].end).toBe(20n);
      expect(universal.permanentlyForbiddenTimes[0].start).toBe(30n);
      expect(universal.permanentlyForbiddenTimes[0].end).toBe(40n);
    });
  });

  describe('validateUpdate', () => {
    it('should allow identical permissions (no change)', () => {
      const perms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const err = ActionPermission.validateUpdate(perms, perms);
      expect(err).toBeNull();
    });

    it('should allow adding new permissions that were not previously defined', () => {
      const oldPerms: ActionPermission<bigint>[] = [];
      const newPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const err = ActionPermission.validateUpdate(oldPerms, newPerms);
      expect(err).toBeNull();
    });

    it('should reject removing previously defined permissions', () => {
      const oldPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const newPerms: ActionPermission<bigint>[] = [];
      // Old had permitted times but new does not — should fail
      // (The first-match-only logic + universal permission validation catches this)
      const err = ActionPermission.validateUpdate(oldPerms, newPerms);
      // When old permissions exist but new is empty, the old permitted times disappear
      // This should be an error
      expect(err).not.toBeNull();
    });

    it('should reject changing permanently permitted times to forbidden', () => {
      const oldPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const newPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 100n }]
        })
      ];
      const err = ActionPermission.validateUpdate(oldPerms, newPerms);
      expect(err).not.toBeNull();
    });

    it('should reject changing permanently forbidden times to permitted', () => {
      const oldPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 100n }]
        })
      ];
      const newPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const err = ActionPermission.validateUpdate(oldPerms, newPerms);
      expect(err).not.toBeNull();
    });

    it('should allow extending permitted times (adding more times)', () => {
      const oldPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 50n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const newPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const err = ActionPermission.validateUpdate(oldPerms, newPerms);
      expect(err).toBeNull();
    });

    it('should allow extending forbidden times (adding more times)', () => {
      const oldPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 50n }]
        })
      ];
      const newPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 100n }]
        })
      ];
      const err = ActionPermission.validateUpdate(oldPerms, newPerms);
      expect(err).toBeNull();
    });

    it('should reject shrinking permitted times', () => {
      const oldPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const newPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 50n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const err = ActionPermission.validateUpdate(oldPerms, newPerms);
      expect(err).not.toBeNull();
    });

    it('should reject shrinking forbidden times', () => {
      const oldPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 100n }]
        })
      ];
      const newPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 50n }]
        })
      ];
      const err = ActionPermission.validateUpdate(oldPerms, newPerms);
      expect(err).not.toBeNull();
    });
  });

  describe('check', () => {
    it('should return null when no permissions are defined (neutral)', () => {
      const err = ActionPermission.check([]);
      expect(err).toBeNull();
    });

    it('should return null when action is permanently permitted at current time', () => {
      const now = BigInt(Date.now());
      const perms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: now + 1000000n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const err = ActionPermission.check(perms, now);
      expect(err).toBeNull();
    });

    it('should return error when action is permanently forbidden at given time', () => {
      const checkTime = 50n;
      const perms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 100n }]
        })
      ];
      const err = ActionPermission.check(perms, checkTime);
      expect(err).not.toBeNull();
      expect(err!.message).toContain('forbidden');
    });

    it('should return null when action is forbidden at a different time', () => {
      const checkTime = 200n;
      const perms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 100n }]
        })
      ];
      const err = ActionPermission.check(perms, checkTime);
      expect(err).toBeNull();
    });

    it('should return error when forbidden covers all time', () => {
      const perms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 18446744073709551615n }]
        })
      ];
      const err = ActionPermission.check(perms, 500n);
      expect(err).not.toBeNull();
    });
  });
});

describe('TokenIdsActionPermission', () => {
  describe('construction', () => {
    it('should create an instance with token IDs and times', () => {
      const perm = new TokenIdsActionPermission({
        tokenIds: [{ start: 1n, end: 10n }],
        permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
        permanentlyForbiddenTimes: []
      });
      expect(perm).toBeTruthy();
      expect(perm.tokenIds.length).toBe(1);
      expect(perm.tokenIds[0].start).toBe(1n);
      expect(perm.tokenIds[0].end).toBe(10n);
    });
  });

  describe('castToUniversalPermission', () => {
    it('should set usesTokenIds to true', () => {
      const perm = new TokenIdsActionPermission({
        tokenIds: [{ start: 1n, end: 10n }],
        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: []
      });
      const universal = perm.castToUniversalPermission();
      expect(universal.usesTokenIds).toBe(true);
      expect(universal.usesTimelineTimes).toBe(false);
      expect(universal.usesTransferTimes).toBe(false);
    });
  });

  describe('validateUpdate', () => {
    it('should allow identical permissions', () => {
      const perms = [
        new TokenIdsActionPermission({
          tokenIds: [{ start: 1n, end: 10n }],
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const err = TokenIdsActionPermission.validateUpdate(perms, perms);
      expect(err).toBeNull();
    });

    it('should reject removing a permission with tokenIds', () => {
      const oldPerms = [
        new TokenIdsActionPermission({
          tokenIds: [{ start: 1n, end: 10n }],
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const newPerms: TokenIdsActionPermission<bigint>[] = [];
      const err = TokenIdsActionPermission.validateUpdate(oldPerms, newPerms);
      expect(err).not.toBeNull();
    });

    it('should reject changing permitted to forbidden for same token IDs', () => {
      const oldPerms = [
        new TokenIdsActionPermission({
          tokenIds: [{ start: 1n, end: 10n }],
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const newPerms = [
        new TokenIdsActionPermission({
          tokenIds: [{ start: 1n, end: 10n }],
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 100n }]
        })
      ];
      const err = TokenIdsActionPermission.validateUpdate(oldPerms, newPerms);
      expect(err).not.toBeNull();
    });
  });

  describe('check', () => {
    it('should return null when no permissions forbid the action', () => {
      const perms = [
        new TokenIdsActionPermission({
          tokenIds: [{ start: 1n, end: 10n }],
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ];
      const err = TokenIdsActionPermission.check(
        [{ tokenIds: UintRangeArray.From([{ start: 1n, end: 5n }]) }],
        perms,
        50n
      );
      expect(err).toBeNull();
    });

    it('should return error when forbidden for the requested token IDs', () => {
      const perms = [
        new TokenIdsActionPermission({
          tokenIds: [{ start: 1n, end: 10n }],
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 18446744073709551615n }]
        })
      ];
      const err = TokenIdsActionPermission.check(
        [{ tokenIds: UintRangeArray.From([{ start: 5n, end: 5n }]) }],
        perms,
        50n
      );
      expect(err).not.toBeNull();
      expect(err!.message).toContain('forbidden');
    });

    it('should return null when checking token IDs not covered by forbidden permission', () => {
      const perms = [
        new TokenIdsActionPermission({
          tokenIds: [{ start: 1n, end: 10n }],
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 18446744073709551615n }]
        })
      ];
      // Token ID 20 is not in the permission's tokenIds range (1-10),
      // so the first-match-only won't produce a forbidden entry for it
      const err = TokenIdsActionPermission.check(
        [{ tokenIds: UintRangeArray.From([{ start: 20n, end: 20n }]) }],
        perms,
        50n
      );
      expect(err).toBeNull();
    });
  });
});

describe('CollectionApprovalPermissionWithDetails', () => {
  const makeApprovalPerm = (opts: {
    permitted?: [bigint, bigint][];
    forbidden?: [bigint, bigint][];
    tokenIds?: [bigint, bigint][];
    transferTimes?: [bigint, bigint][];
    ownershipTimes?: [bigint, bigint][];
  }) => {
    return new CollectionApprovalPermissionWithDetails({
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'All',
      tokenIds: (opts.tokenIds || [[1n, 18446744073709551615n]]).map(([s, e]) => ({ start: s, end: e })),
      transferTimes: (opts.transferTimes || [[1n, 18446744073709551615n]]).map(([s, e]) => ({ start: s, end: e })),
      ownershipTimes: (opts.ownershipTimes || [[1n, 18446744073709551615n]]).map(([s, e]) => ({ start: s, end: e })),
      permanentlyPermittedTimes: (opts.permitted || []).map(([s, e]) => ({ start: s, end: e })),
      permanentlyForbiddenTimes: (opts.forbidden || []).map(([s, e]) => ({ start: s, end: e })),
      fromList: allAddresses(),
      toList: allAddresses(),
      initiatedByList: allAddresses()
    });
  };

  describe('construction', () => {
    it('should create an instance with all fields', () => {
      const perm = makeApprovalPerm({ permitted: [[1n, 100n]] });
      expect(perm).toBeTruthy();
      expect(perm.fromList).toBeTruthy();
      expect(perm.toList).toBeTruthy();
      expect(perm.initiatedByList).toBeTruthy();
    });
  });

  describe('castToUniversalPermission', () => {
    it('should set all uses flags to true', () => {
      const perm = makeApprovalPerm({});
      const universal = perm.castToUniversalPermission();
      expect(universal.usesTokenIds).toBe(true);
      expect(universal.usesTransferTimes).toBe(true);
      expect(universal.usesOwnershipTimes).toBe(true);
      expect(universal.usesToList).toBe(true);
      expect(universal.usesFromList).toBe(true);
      expect(universal.usesInitiatedByList).toBe(true);
      expect(universal.usesApprovalIdList).toBe(true);
    });
  });

  describe('validateUpdate', () => {
    it('should allow identical approval permissions', () => {
      const perms = [makeApprovalPerm({ permitted: [[1n, 100n]] })];
      const err = CollectionApprovalPermission.validateUpdate(perms, perms);
      expect(err).toBeNull();
    });

    it('should reject removing approval permissions', () => {
      const oldPerms = [makeApprovalPerm({ permitted: [[1n, 100n]] })];
      const newPerms: CollectionApprovalPermissionWithDetails<bigint>[] = [];
      const err = CollectionApprovalPermission.validateUpdate(oldPerms, newPerms);
      expect(err).not.toBeNull();
    });

    it('should reject changing permitted to forbidden for approvals', () => {
      const oldPerms = [makeApprovalPerm({ permitted: [[1n, 100n]] })];
      const newPerms = [makeApprovalPerm({ forbidden: [[1n, 100n]] })];
      const err = CollectionApprovalPermission.validateUpdate(oldPerms, newPerms);
      expect(err).not.toBeNull();
    });

    it('should allow extending permitted times for approvals', () => {
      const oldPerms = [makeApprovalPerm({ permitted: [[1n, 50n]] })];
      const newPerms = [makeApprovalPerm({ permitted: [[1n, 100n]] })];
      const err = CollectionApprovalPermission.validateUpdate(oldPerms, newPerms);
      expect(err).toBeNull();
    });
  });

  describe('check', () => {
    it('should return null when approvals are permitted', () => {
      const perms = [makeApprovalPerm({ permitted: [[1n, 18446744073709551615n]] })];
      const err = CollectionApprovalPermission.check(
        [
          {
            tokenIds: UintRangeArray.From([{ start: 1n, end: 10n }]),
            ownershipTimes: fullRange(),
            transferTimes: fullRange(),
            toList: allAddresses(),
            fromList: allAddresses(),
            initiatedByList: allAddresses(),
            approvalIdList: allAddresses()
          }
        ],
        perms,
        50n
      );
      expect(err).toBeNull();
    });

    it('should return error when approvals are forbidden', () => {
      const perms = [makeApprovalPerm({ forbidden: [[1n, 18446744073709551615n]] })];
      const err = CollectionApprovalPermission.check(
        [
          {
            tokenIds: UintRangeArray.From([{ start: 1n, end: 10n }]),
            ownershipTimes: fullRange(),
            transferTimes: fullRange(),
            toList: allAddresses(),
            fromList: allAddresses(),
            initiatedByList: allAddresses(),
            approvalIdList: allAddresses()
          }
        ],
        perms,
        50n
      );
      expect(err).not.toBeNull();
      expect(err!.message).toContain('forbidden');
    });

    it('should return null when checking at a time outside forbidden range', () => {
      const perms = [makeApprovalPerm({ forbidden: [[1n, 100n]] })];
      const err = CollectionApprovalPermission.check(
        [
          {
            tokenIds: UintRangeArray.From([{ start: 1n, end: 10n }]),
            ownershipTimes: fullRange(),
            transferTimes: fullRange(),
            toList: allAddresses(),
            fromList: allAddresses(),
            initiatedByList: allAddresses(),
            approvalIdList: allAddresses()
          }
        ],
        perms,
        200n
      );
      expect(err).toBeNull();
    });
  });
});

describe('UserPermissions', () => {
  describe('construction', () => {
    it('should create an instance with empty arrays', () => {
      const perms = UserPermissions.InitEmpty();
      expect(perms).toBeTruthy();
      expect(perms.canUpdateOutgoingApprovals.length).toBe(0);
      expect(perms.canUpdateIncomingApprovals.length).toBe(0);
      expect(perms.canUpdateAutoApproveSelfInitiatedOutgoingTransfers.length).toBe(0);
      expect(perms.canUpdateAutoApproveSelfInitiatedIncomingTransfers.length).toBe(0);
      expect(perms.canUpdateAutoApproveAllIncomingTransfers.length).toBe(0);
    });
  });

  describe('validateUpdate', () => {
    it('should allow empty to empty update', () => {
      const makeEmpty = () =>
        new UserPermissionsWithDetails({
          canUpdateOutgoingApprovals: [],
          canUpdateIncomingApprovals: [],
          canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
          canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
          canUpdateAutoApproveAllIncomingTransfers: []
        });
      const err = UserPermissions.validateUpdate(makeEmpty(), makeEmpty());
      expect(err).toBeNull();
    });

    it('should reject removing auto-approve permission', () => {
      const oldPerms = new UserPermissionsWithDetails({
        canUpdateOutgoingApprovals: [],
        canUpdateIncomingApprovals: [],
        canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [
          new ActionPermission({
            permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
            permanentlyForbiddenTimes: []
          })
        ],
        canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
        canUpdateAutoApproveAllIncomingTransfers: []
      });
      const newPerms = new UserPermissionsWithDetails({
        canUpdateOutgoingApprovals: [],
        canUpdateIncomingApprovals: [],
        canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
        canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
        canUpdateAutoApproveAllIncomingTransfers: []
      });
      const err = UserPermissions.validateUpdate(oldPerms, newPerms);
      expect(err).not.toBeNull();
    });
  });
});

describe('CollectionPermissions', () => {
  describe('construction', () => {
    it('should create via InitEmpty', () => {
      const perms = CollectionPermissions.InitEmpty();
      expect(perms).toBeTruthy();
      expect(perms.canDeleteCollection.length).toBe(0);
      expect(perms.canArchiveCollection.length).toBe(0);
      expect(perms.canUpdateStandards.length).toBe(0);
      expect(perms.canUpdateCustomData.length).toBe(0);
      expect(perms.canUpdateManager.length).toBe(0);
      expect(perms.canUpdateCollectionMetadata.length).toBe(0);
      expect(perms.canUpdateValidTokenIds.length).toBe(0);
      expect(perms.canUpdateTokenMetadata.length).toBe(0);
      expect(perms.canUpdateCollectionApprovals.length).toBe(0);
      expect(perms.canAddMoreAliasPaths.length).toBe(0);
      expect(perms.canAddMoreCosmosCoinWrapperPaths.length).toBe(0);
    });

    it('should construct with permissions', () => {
      const perms = new CollectionPermissions({
        canDeleteCollection: [
          new ActionPermission({
            permanentlyPermittedTimes: [],
            permanentlyForbiddenTimes: [{ start: 1n, end: 18446744073709551615n }]
          })
        ],
        canArchiveCollection: [],
        canUpdateStandards: [],
        canUpdateCustomData: [],
        canUpdateManager: [],
        canUpdateCollectionMetadata: [],
        canUpdateValidTokenIds: [],
        canUpdateTokenMetadata: [],
        canUpdateCollectionApprovals: [],
        canAddMoreAliasPaths: [],
        canAddMoreCosmosCoinWrapperPaths: []
      });
      expect(perms.canDeleteCollection.length).toBe(1);
    });

    // Regression coverage for backlog #0327 — partial session state
    // (e.g. from the MCP builder's incremental set_permissions tool)
    // used to crash with `TypeError: undefined is not an object
    // (evaluating 'msg.canDeleteCollection.map')`. Missing `canX`
    // arrays should now default to `[]`.
    it('defaults missing canX arrays to [] instead of throwing', () => {
      // Cast to any — intentionally exercising the partial-input
      // behavior the wrapper-class contract is supposed to tolerate.
      const perms = new CollectionPermissions({
        canArchiveCollection: [
          new ActionPermission({
            permanentlyPermittedTimes: [],
            permanentlyForbiddenTimes: [{ start: 1n, end: 100n }]
          })
        ]
        // All other canX fields omitted on purpose.
      } as any);
      expect(perms.canArchiveCollection.length).toBe(1);
      expect(perms.canDeleteCollection).toEqual([]);
      expect(perms.canUpdateStandards).toEqual([]);
      expect(perms.canUpdateCustomData).toEqual([]);
      expect(perms.canUpdateManager).toEqual([]);
      expect(perms.canUpdateCollectionMetadata).toEqual([]);
      expect(perms.canUpdateValidTokenIds).toEqual([]);
      expect(perms.canUpdateTokenMetadata).toEqual([]);
      expect(perms.canUpdateCollectionApprovals).toEqual([]);
      expect(perms.canAddMoreAliasPaths).toEqual([]);
      expect(perms.canAddMoreCosmosCoinWrapperPaths).toEqual([]);
    });

    it('accepts an entirely empty object without throwing', () => {
      const perms = new CollectionPermissions({} as any);
      expect(perms.canDeleteCollection).toEqual([]);
      expect(perms.canAddMoreCosmosCoinWrapperPaths).toEqual([]);
    });

    it('CollectionPermissionsWithDetails mirrors the same guard', () => {
      const perms = new CollectionPermissionsWithDetails({} as any);
      expect(perms.canDeleteCollection).toEqual([]);
      expect(perms.canUpdateCollectionApprovals).toEqual([]);
    });
  });

  describe('validateUpdate', () => {
    it('should allow identical collection permissions', () => {
      const makePerms = () =>
        new CollectionPermissionsWithDetails({
          canDeleteCollection: [
            new ActionPermission({
              permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
              permanentlyForbiddenTimes: []
            })
          ],
          canArchiveCollection: [],
          canUpdateStandards: [],
          canUpdateCustomData: [],
          canUpdateManager: [],
          canUpdateCollectionMetadata: [],
          canUpdateValidTokenIds: [],
          canUpdateTokenMetadata: [],
          canUpdateCollectionApprovals: [],
          canAddMoreAliasPaths: [],
          canAddMoreCosmosCoinWrapperPaths: []
        });
      const err = CollectionPermissionsWithDetails.validateUpdate(makePerms(), makePerms());
      expect(err).toBeNull();
    });

    it('should reject removing canDeleteCollection permission', () => {
      const oldPerms = new CollectionPermissionsWithDetails({
        canDeleteCollection: [
          new ActionPermission({
            permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
            permanentlyForbiddenTimes: []
          })
        ],
        canArchiveCollection: [],
        canUpdateStandards: [],
        canUpdateCustomData: [],
        canUpdateManager: [],
        canUpdateCollectionMetadata: [],
        canUpdateValidTokenIds: [],
        canUpdateTokenMetadata: [],
        canUpdateCollectionApprovals: [],
        canAddMoreAliasPaths: [],
        canAddMoreCosmosCoinWrapperPaths: []
      });
      const newPerms = new CollectionPermissionsWithDetails({
        canDeleteCollection: [],
        canArchiveCollection: [],
        canUpdateStandards: [],
        canUpdateCustomData: [],
        canUpdateManager: [],
        canUpdateCollectionMetadata: [],
        canUpdateValidTokenIds: [],
        canUpdateTokenMetadata: [],
        canUpdateCollectionApprovals: [],
        canAddMoreAliasPaths: [],
        canAddMoreCosmosCoinWrapperPaths: []
      });
      const err = CollectionPermissionsWithDetails.validateUpdate(oldPerms, newPerms);
      expect(err).not.toBeNull();
    });

    it('should reject changing canUpdateManager from permitted to forbidden', () => {
      const oldPerms = new CollectionPermissionsWithDetails({
        canDeleteCollection: [],
        canArchiveCollection: [],
        canUpdateStandards: [],
        canUpdateCustomData: [],
        canUpdateManager: [
          new ActionPermission({
            permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
            permanentlyForbiddenTimes: []
          })
        ],
        canUpdateCollectionMetadata: [],
        canUpdateValidTokenIds: [],
        canUpdateTokenMetadata: [],
        canUpdateCollectionApprovals: [],
        canAddMoreAliasPaths: [],
        canAddMoreCosmosCoinWrapperPaths: []
      });
      const newPerms = new CollectionPermissionsWithDetails({
        canDeleteCollection: [],
        canArchiveCollection: [],
        canUpdateStandards: [],
        canUpdateCustomData: [],
        canUpdateManager: [
          new ActionPermission({
            permanentlyPermittedTimes: [],
            permanentlyForbiddenTimes: [{ start: 1n, end: 100n }]
          })
        ],
        canUpdateCollectionMetadata: [],
        canUpdateValidTokenIds: [],
        canUpdateTokenMetadata: [],
        canUpdateCollectionApprovals: [],
        canAddMoreAliasPaths: [],
        canAddMoreCosmosCoinWrapperPaths: []
      });
      const err = CollectionPermissionsWithDetails.validateUpdate(oldPerms, newPerms);
      expect(err).not.toBeNull();
    });

    it('should allow all-empty to all-empty', () => {
      const makeEmpty = () =>
        new CollectionPermissionsWithDetails({
          canDeleteCollection: [],
          canArchiveCollection: [],
          canUpdateStandards: [],
          canUpdateCustomData: [],
          canUpdateManager: [],
          canUpdateCollectionMetadata: [],
          canUpdateValidTokenIds: [],
          canUpdateTokenMetadata: [],
          canUpdateCollectionApprovals: [],
          canAddMoreAliasPaths: [],
          canAddMoreCosmosCoinWrapperPaths: []
        });
      const err = CollectionPermissionsWithDetails.validateUpdate(makeEmpty(), makeEmpty());
      expect(err).toBeNull();
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// UserOutgoingApprovalPermission
// ──────────────────────────────────────────────────────────────────────────────
describe('UserOutgoingApprovalPermission', () => {
  const makeOutgoing = (permitted: [bigint, bigint][] = [], forbidden: [bigint, bigint][] = []) =>
    new UserOutgoingApprovalPermission({
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'All',
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      tokenIds: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
      permanentlyPermittedTimes: permitted.map(([s, e]) => ({ start: s, end: e })),
      permanentlyForbiddenTimes: forbidden.map(([s, e]) => ({ start: s, end: e }))
    });

  describe('construction', () => {
    it('should create with all required fields', () => {
      const perm = makeOutgoing([[1n, 100n]]);
      expect(perm).toBeTruthy();
      expect(perm.toListId).toBe('All');
      expect(perm.initiatedByListId).toBe('All');
      expect(perm.approvalId).toBe('All');
      expect(perm.transferTimes.length).toBe(1);
      expect(perm.tokenIds.length).toBe(1);
      expect(perm.ownershipTimes.length).toBe(1);
      expect(perm.permanentlyPermittedTimes.length).toBe(1);
    });
  });

  describe('convert', () => {
    it('should convert number type to string', () => {
      const perm = makeOutgoing([[1n, 50n]]);
      const stringified = perm.convert(Stringify);
      expect(stringified.tokenIds[0].start).toBe('1');
      expect(stringified.tokenIds[0].end).toBe('18446744073709551615');
      expect(stringified.permanentlyPermittedTimes[0].start).toBe('1');
      expect(stringified.permanentlyPermittedTimes[0].end).toBe('50');
    });
  });

  describe('toProto / fromProto', () => {
    it('should round-trip through proto', () => {
      const perm = makeOutgoing([[10n, 200n]]);
      const proto = perm.toProto();
      expect(proto).toBeTruthy();
      const restored = UserOutgoingApprovalPermission.fromProto(proto, BigIntify);
      expect(restored.toListId).toBe('All');
      expect(restored.permanentlyPermittedTimes[0].start).toBe(10n);
      expect(restored.permanentlyPermittedTimes[0].end).toBe(200n);
    });
  });

  describe('fromJson / fromJsonString', () => {
    it('should round-trip through JSON', () => {
      const perm = makeOutgoing([[5n, 50n]]);
      const jsonVal = perm.toProto().toJson();
      const restored = UserOutgoingApprovalPermission.fromJson(jsonVal, BigIntify);
      expect(restored.permanentlyPermittedTimes[0].start).toBe(5n);
    });

    it('should round-trip through JSON string', () => {
      const perm = makeOutgoing([], [[1n, 100n]]);
      const jsonStr = perm.toProto().toJsonString();
      const restored = UserOutgoingApprovalPermission.fromJsonString(jsonStr, BigIntify);
      expect(restored.permanentlyForbiddenTimes[0].start).toBe(1n);
      expect(restored.permanentlyForbiddenTimes[0].end).toBe(100n);
    });
  });

  describe('castToCollectionApprovalPermission', () => {
    it('should cast to CollectionApprovalPermission with given fromListId', () => {
      const perm = makeOutgoing([[1n, 100n]]);
      const addr = genTestAddress();
      const casted = perm.castToCollectionApprovalPermission(addr);
      expect(casted.fromListId).toBe(addr);
    });
  });

  describe('toBech32Addresses', () => {
    it('should convert listIds to bech32', () => {
      const perm = makeOutgoing();
      // 'bb' is the supported BitBadges bech32 prefix; 'All' is a reserved list ID
      expect(() => perm.toBech32Addresses('bb')).not.toThrow();
    });
  });

  describe('validateUpdate', () => {
    it('should allow identical outgoing permissions', () => {
      const makeWithDetails = (permitted: [bigint, bigint][]) =>
        new UserOutgoingApprovalPermissionWithDetails({
          toListId: 'All',
          initiatedByListId: 'All',
          approvalId: 'All',
          transferTimes: [{ start: 1n, end: 18446744073709551615n }],
          tokenIds: [{ start: 1n, end: 18446744073709551615n }],
          ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
          permanentlyPermittedTimes: permitted.map(([s, e]) => ({ start: s, end: e })),
          permanentlyForbiddenTimes: [],
          toList: allAddresses(),
          initiatedByList: allAddresses()
        });

      const perms = [makeWithDetails([[1n, 100n]])];
      const err = UserOutgoingApprovalPermission.validateUpdate(perms, perms);
      expect(err).toBeNull();
    });

    it('should reject removing outgoing permission', () => {
      const makeWithDetails = () =>
        new UserOutgoingApprovalPermissionWithDetails({
          toListId: 'All',
          initiatedByListId: 'All',
          approvalId: 'All',
          transferTimes: [{ start: 1n, end: 18446744073709551615n }],
          tokenIds: [{ start: 1n, end: 18446744073709551615n }],
          ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: [],
          toList: allAddresses(),
          initiatedByList: allAddresses()
        });

      const err = UserOutgoingApprovalPermission.validateUpdate([makeWithDetails()], []);
      expect(err).not.toBeNull();
    });
  });

  describe('check', () => {
    it('should return null when outgoing approval is permitted', () => {
      const perm = new UserOutgoingApprovalPermissionWithDetails({
        toListId: 'All',
        initiatedByListId: 'All',
        approvalId: 'All',
        transferTimes: [{ start: 1n, end: 18446744073709551615n }],
        tokenIds: [{ start: 1n, end: 18446744073709551615n }],
        ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
        permanentlyPermittedTimes: [{ start: 1n, end: 18446744073709551615n }],
        permanentlyForbiddenTimes: [],
        toList: allAddresses(),
        initiatedByList: allAddresses()
      });

      const err = UserOutgoingApprovalPermission.check(
        [
          {
            tokenIds: UintRangeArray.From([{ start: 1n, end: 5n }]),
            ownershipTimes: fullRange(),
            transferTimes: fullRange(),
            toList: allAddresses(),
            fromList: allAddresses(),
            initiatedByList: allAddresses(),
            approvalIdList: allAddresses(),
            amountTrackerIdList: allAddresses(),
            challengeTrackerIdList: allAddresses()
          }
        ],
        [perm],
        50n
      );
      expect(err).toBeNull();
    });

    it('should return error when outgoing approval is forbidden', () => {
      const perm = new UserOutgoingApprovalPermissionWithDetails({
        toListId: 'All',
        initiatedByListId: 'All',
        approvalId: 'All',
        transferTimes: [{ start: 1n, end: 18446744073709551615n }],
        tokenIds: [{ start: 1n, end: 18446744073709551615n }],
        ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: [{ start: 1n, end: 18446744073709551615n }],
        toList: allAddresses(),
        initiatedByList: allAddresses()
      });

      const err = UserOutgoingApprovalPermission.check(
        [
          {
            tokenIds: UintRangeArray.From([{ start: 1n, end: 5n }]),
            ownershipTimes: fullRange(),
            transferTimes: fullRange(),
            toList: allAddresses(),
            fromList: allAddresses(),
            initiatedByList: allAddresses(),
            approvalIdList: allAddresses(),
            amountTrackerIdList: allAddresses(),
            challengeTrackerIdList: allAddresses()
          }
        ],
        [perm],
        50n
      );
      expect(err).not.toBeNull();
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// UserIncomingApprovalPermission
// ──────────────────────────────────────────────────────────────────────────────
describe('UserIncomingApprovalPermission', () => {
  const makeIncoming = (permitted: [bigint, bigint][] = [], forbidden: [bigint, bigint][] = []) =>
    new UserIncomingApprovalPermission({
      fromListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'All',
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      tokenIds: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
      permanentlyPermittedTimes: permitted.map(([s, e]) => ({ start: s, end: e })),
      permanentlyForbiddenTimes: forbidden.map(([s, e]) => ({ start: s, end: e }))
    });

  describe('construction', () => {
    it('should create with all required fields', () => {
      const perm = makeIncoming([[1n, 100n]]);
      expect(perm).toBeTruthy();
      expect(perm.fromListId).toBe('All');
      expect(perm.initiatedByListId).toBe('All');
      expect(perm.approvalId).toBe('All');
      expect(perm.permanentlyPermittedTimes.length).toBe(1);
    });
  });

  describe('convert', () => {
    it('should convert to string type', () => {
      const perm = makeIncoming([[1n, 50n]]);
      const stringified = perm.convert(Stringify);
      expect(stringified.tokenIds[0].start).toBe('1');
      expect(stringified.permanentlyPermittedTimes[0].end).toBe('50');
    });
  });

  describe('toProto / fromProto', () => {
    it('should round-trip through proto', () => {
      const perm = makeIncoming([[10n, 200n]]);
      const proto = perm.toProto();
      const restored = UserIncomingApprovalPermission.fromProto(proto, BigIntify);
      expect(restored.fromListId).toBe('All');
      expect(restored.permanentlyPermittedTimes[0].start).toBe(10n);
    });
  });

  describe('fromJson / fromJsonString', () => {
    it('should round-trip through JSON', () => {
      const perm = makeIncoming([[5n, 50n]]);
      const jsonVal = perm.toProto().toJson();
      const restored = UserIncomingApprovalPermission.fromJson(jsonVal, BigIntify);
      expect(restored.permanentlyPermittedTimes[0].start).toBe(5n);
    });

    it('should round-trip through JSON string', () => {
      const perm = makeIncoming([], [[1n, 100n]]);
      const jsonStr = perm.toProto().toJsonString();
      const restored = UserIncomingApprovalPermission.fromJsonString(jsonStr, BigIntify);
      expect(restored.permanentlyForbiddenTimes[0].start).toBe(1n);
    });
  });

  describe('castToCollectionApprovalPermission', () => {
    it('should cast to CollectionApprovalPermission with given toListId', () => {
      const perm = makeIncoming([[1n, 100n]]);
      const addr = genTestAddress();
      const casted = perm.castToCollectionApprovalPermission(addr);
      expect(casted.toListId).toBe(addr);
    });
  });

  describe('toBech32Addresses', () => {
    it('should not throw when converting reserved list IDs', () => {
      const perm = makeIncoming();
      expect(() => perm.toBech32Addresses('bb')).not.toThrow();
    });
  });

  describe('validateUpdate', () => {
    it('should allow identical incoming permissions', () => {
      const makeWithDetails = () =>
        new UserIncomingApprovalPermissionWithDetails({
          fromListId: 'All',
          initiatedByListId: 'All',
          approvalId: 'All',
          transferTimes: [{ start: 1n, end: 18446744073709551615n }],
          tokenIds: [{ start: 1n, end: 18446744073709551615n }],
          ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: [],
          fromList: allAddresses(),
          initiatedByList: allAddresses()
        });

      const perms = [makeWithDetails()];
      const err = UserIncomingApprovalPermission.validateUpdate(perms, perms);
      expect(err).toBeNull();
    });

    it('should reject removing incoming permission', () => {
      const makeWithDetails = () =>
        new UserIncomingApprovalPermissionWithDetails({
          fromListId: 'All',
          initiatedByListId: 'All',
          approvalId: 'All',
          transferTimes: [{ start: 1n, end: 18446744073709551615n }],
          tokenIds: [{ start: 1n, end: 18446744073709551615n }],
          ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: [],
          fromList: allAddresses(),
          initiatedByList: allAddresses()
        });

      const err = UserIncomingApprovalPermission.validateUpdate([makeWithDetails()], []);
      expect(err).not.toBeNull();
    });
  });

  describe('check', () => {
    it('should return null when incoming approval is permitted', () => {
      const perm = new UserIncomingApprovalPermissionWithDetails({
        fromListId: 'All',
        initiatedByListId: 'All',
        approvalId: 'All',
        transferTimes: [{ start: 1n, end: 18446744073709551615n }],
        tokenIds: [{ start: 1n, end: 18446744073709551615n }],
        ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
        permanentlyPermittedTimes: [{ start: 1n, end: 18446744073709551615n }],
        permanentlyForbiddenTimes: [],
        fromList: allAddresses(),
        initiatedByList: allAddresses()
      });

      const err = UserIncomingApprovalPermission.check(
        [
          {
            tokenIds: fullRange(),
            ownershipTimes: fullRange(),
            transferTimes: fullRange(),
            toList: allAddresses(),
            fromList: allAddresses(),
            initiatedByList: allAddresses(),
            approvalIdList: allAddresses(),
            amountTrackerIdList: allAddresses(),
            challengeTrackerIdList: allAddresses()
          }
        ],
        [perm],
        50n
      );
      expect(err).toBeNull();
    });

    it('should return error when incoming approval is forbidden', () => {
      const perm = new UserIncomingApprovalPermissionWithDetails({
        fromListId: 'All',
        initiatedByListId: 'All',
        approvalId: 'All',
        transferTimes: [{ start: 1n, end: 18446744073709551615n }],
        tokenIds: [{ start: 1n, end: 18446744073709551615n }],
        ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: [{ start: 1n, end: 18446744073709551615n }],
        fromList: allAddresses(),
        initiatedByList: allAddresses()
      });

      const err = UserIncomingApprovalPermission.check(
        [
          {
            tokenIds: fullRange(),
            ownershipTimes: fullRange(),
            transferTimes: fullRange(),
            toList: allAddresses(),
            fromList: allAddresses(),
            initiatedByList: allAddresses(),
            approvalIdList: allAddresses(),
            amountTrackerIdList: allAddresses(),
            challengeTrackerIdList: allAddresses()
          }
        ],
        [perm],
        50n
      );
      expect(err).not.toBeNull();
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// CollectionPermissions - fromProto / fromJson / toBech32Addresses
// ──────────────────────────────────────────────────────────────────────────────
describe('CollectionPermissions - serialization', () => {
  const makeEmpty = () =>
    CollectionPermissions.InitEmpty();

  describe('convert', () => {
    it('should convert all fields when they contain data (covers map bodies in convert)', () => {
      const perms = new CollectionPermissions({
        canDeleteCollection: [new ActionPermission({ permanentlyPermittedTimes: [{ start: 1n, end: 50n }], permanentlyForbiddenTimes: [] })],
        canArchiveCollection: [new ActionPermission({ permanentlyPermittedTimes: [{ start: 2n, end: 3n }], permanentlyForbiddenTimes: [] })],
        canUpdateStandards: [new ActionPermission({ permanentlyPermittedTimes: [{ start: 4n, end: 5n }], permanentlyForbiddenTimes: [] })],
        canUpdateCustomData: [new ActionPermission({ permanentlyPermittedTimes: [{ start: 6n, end: 7n }], permanentlyForbiddenTimes: [] })],
        canUpdateManager: [new ActionPermission({ permanentlyPermittedTimes: [{ start: 8n, end: 9n }], permanentlyForbiddenTimes: [] })],
        canUpdateCollectionMetadata: [new ActionPermission({ permanentlyPermittedTimes: [{ start: 10n, end: 11n }], permanentlyForbiddenTimes: [] })],
        canUpdateValidTokenIds: [new TokenIdsActionPermission({ tokenIds: [{ start: 1n, end: 5n }], permanentlyPermittedTimes: [{ start: 1n, end: 10n }], permanentlyForbiddenTimes: [] })],
        canUpdateTokenMetadata: [new TokenIdsActionPermission({ tokenIds: [{ start: 6n, end: 10n }], permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [{ start: 1n, end: 100n }] })],
        canUpdateCollectionApprovals: [],
        canAddMoreAliasPaths: [new ActionPermission({ permanentlyPermittedTimes: [{ start: 20n, end: 30n }], permanentlyForbiddenTimes: [] })],
        canAddMoreCosmosCoinWrapperPaths: [new ActionPermission({ permanentlyPermittedTimes: [{ start: 40n, end: 50n }], permanentlyForbiddenTimes: [] })]
      });

      const converted = perms.convert(Stringify);
      expect(converted.canDeleteCollection[0].permanentlyPermittedTimes[0].start).toBe('1');
      expect(converted.canArchiveCollection[0].permanentlyPermittedTimes[0].start).toBe('2');
      expect(converted.canUpdateStandards[0].permanentlyPermittedTimes[0].start).toBe('4');
      expect(converted.canUpdateCustomData[0].permanentlyPermittedTimes[0].start).toBe('6');
      expect(converted.canUpdateManager[0].permanentlyPermittedTimes[0].start).toBe('8');
      expect(converted.canUpdateCollectionMetadata[0].permanentlyPermittedTimes[0].start).toBe('10');
      expect(converted.canUpdateValidTokenIds[0].tokenIds[0].start).toBe('1');
      expect(converted.canUpdateTokenMetadata[0].permanentlyForbiddenTimes[0].start).toBe('1');
      expect(converted.canAddMoreAliasPaths[0].permanentlyPermittedTimes[0].start).toBe('20');
      expect(converted.canAddMoreCosmosCoinWrapperPaths[0].permanentlyPermittedTimes[0].start).toBe('40');
    });
  });

  describe('toProto / fromProto', () => {
    it('should round-trip empty permissions through proto', () => {
      const perms = makeEmpty();
      const proto = perms.toProto();
      const restored = CollectionPermissions.fromProto(proto, BigIntify);
      expect(restored).toBeTruthy();
      expect(restored.canDeleteCollection.length).toBe(0);
      expect(restored.canUpdateManager.length).toBe(0);
    });

    it('should round-trip permissions with data through proto', () => {
      const perms = new CollectionPermissions({
        canDeleteCollection: [
          new ActionPermission({
            permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
            permanentlyForbiddenTimes: []
          })
        ],
        canArchiveCollection: [],
        canUpdateStandards: [],
        canUpdateCustomData: [],
        canUpdateManager: [
          new ActionPermission({
            permanentlyPermittedTimes: [],
            permanentlyForbiddenTimes: [{ start: 1n, end: 50n }]
          })
        ],
        canUpdateCollectionMetadata: [],
        canUpdateValidTokenIds: [
          new TokenIdsActionPermission({
            tokenIds: [{ start: 1n, end: 10n }],
            permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
            permanentlyForbiddenTimes: []
          })
        ],
        canUpdateTokenMetadata: [],
        canUpdateCollectionApprovals: [],
        canAddMoreAliasPaths: [],
        canAddMoreCosmosCoinWrapperPaths: []
      });

      const proto = perms.toProto();
      const restored = CollectionPermissions.fromProto(proto, BigIntify);

      expect(restored.canDeleteCollection.length).toBe(1);
      expect(restored.canDeleteCollection[0].permanentlyPermittedTimes[0].start).toBe(1n);
      expect(restored.canDeleteCollection[0].permanentlyPermittedTimes[0].end).toBe(100n);
      expect(restored.canUpdateManager.length).toBe(1);
      expect(restored.canUpdateManager[0].permanentlyForbiddenTimes[0].start).toBe(1n);
      expect(restored.canUpdateValidTokenIds.length).toBe(1);
      expect(restored.canUpdateValidTokenIds[0].tokenIds[0].start).toBe(1n);
    });
  });

  describe('fromJson / fromJsonString', () => {
    it('should round-trip through JSON', () => {
      const perms = new CollectionPermissions({
        canDeleteCollection: [
          new ActionPermission({
            permanentlyPermittedTimes: [{ start: 10n, end: 20n }],
            permanentlyForbiddenTimes: []
          })
        ],
        canArchiveCollection: [],
        canUpdateStandards: [],
        canUpdateCustomData: [],
        canUpdateManager: [],
        canUpdateCollectionMetadata: [],
        canUpdateValidTokenIds: [],
        canUpdateTokenMetadata: [],
        canUpdateCollectionApprovals: [],
        canAddMoreAliasPaths: [],
        canAddMoreCosmosCoinWrapperPaths: []
      });

      const jsonVal = perms.toProto().toJson();
      const restored = CollectionPermissions.fromJson(jsonVal, BigIntify);
      expect(restored.canDeleteCollection[0].permanentlyPermittedTimes[0].start).toBe(10n);
    });

    it('should round-trip through JSON string', () => {
      const perms = makeEmpty();
      const jsonStr = perms.toProto().toJsonString();
      const restored = CollectionPermissions.fromJsonString(jsonStr, BigIntify);
      expect(restored.canDeleteCollection.length).toBe(0);
    });
  });

  describe('toBech32Addresses', () => {
    it('should run without throwing for empty permissions', () => {
      const perms = makeEmpty();
      expect(() => perms.toBech32Addresses('bb')).not.toThrow();
    });

    it('should convert collection approval permission addresses', () => {
      const perms = new CollectionPermissions({
        canDeleteCollection: [],
        canArchiveCollection: [],
        canUpdateStandards: [],
        canUpdateCustomData: [],
        canUpdateManager: [],
        canUpdateCollectionMetadata: [],
        canUpdateValidTokenIds: [],
        canUpdateTokenMetadata: [],
        canUpdateCollectionApprovals: [
          new CollectionApprovalPermission({
            fromListId: 'All',
            toListId: 'All',
            initiatedByListId: 'All',
            approvalId: 'All',
            transferTimes: [{ start: 1n, end: 18446744073709551615n }],
            tokenIds: [{ start: 1n, end: 18446744073709551615n }],
            ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
            permanentlyPermittedTimes: [],
            permanentlyForbiddenTimes: []
          })
        ],
        canAddMoreAliasPaths: [],
        canAddMoreCosmosCoinWrapperPaths: []
      });

      expect(() => perms.toBech32Addresses('bb')).not.toThrow();
    });
  });

  describe('validateUpdate - more permission types', () => {
    const makePerms = (opts: {
      canUpdateValidTokenIds?: TokenIdsActionPermission<bigint>[];
      canUpdateCollectionApprovals?: CollectionApprovalPermissionWithDetails<bigint>[];
    }) =>
      new CollectionPermissionsWithDetails({
        canDeleteCollection: [],
        canArchiveCollection: [],
        canUpdateStandards: [],
        canUpdateCustomData: [],
        canUpdateManager: [],
        canUpdateCollectionMetadata: [],
        canUpdateValidTokenIds: opts.canUpdateValidTokenIds || [],
        canUpdateTokenMetadata: [],
        canUpdateCollectionApprovals: opts.canUpdateCollectionApprovals || [],
        canAddMoreAliasPaths: [],
        canAddMoreCosmosCoinWrapperPaths: []
      });

    it('should reject removing canUpdateValidTokenIds permission', () => {
      const oldPerms = makePerms({
        canUpdateValidTokenIds: [
          new TokenIdsActionPermission({
            tokenIds: [{ start: 1n, end: 10n }],
            permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
            permanentlyForbiddenTimes: []
          })
        ]
      });
      const newPerms = makePerms({});
      const err = CollectionPermissionsWithDetails.validateUpdate(oldPerms, newPerms);
      expect(err).not.toBeNull();
    });

    it('should allow adding canUpdateValidTokenIds when previously empty', () => {
      const oldPerms = makePerms({});
      const newPerms = makePerms({
        canUpdateValidTokenIds: [
          new TokenIdsActionPermission({
            tokenIds: [{ start: 1n, end: 10n }],
            permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
            permanentlyForbiddenTimes: []
          })
        ]
      });
      const err = CollectionPermissionsWithDetails.validateUpdate(oldPerms, newPerms);
      expect(err).toBeNull();
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// CollectionApprovalPermission - fromProto / fromJson / fromJsonString / toBech32
// ──────────────────────────────────────────────────────────────────────────────
describe('CollectionApprovalPermission - serialization', () => {
  const makeApprovalBase = (permitted: [bigint, bigint][] = [], forbidden: [bigint, bigint][] = []) =>
    new CollectionApprovalPermission({
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'All',
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      tokenIds: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
      permanentlyPermittedTimes: permitted.map(([s, e]) => ({ start: s, end: e })),
      permanentlyForbiddenTimes: forbidden.map(([s, e]) => ({ start: s, end: e }))
    });

  it('should round-trip through proto', () => {
    const perm = makeApprovalBase([[10n, 50n]]);
    const proto = perm.toProto();
    const restored = CollectionApprovalPermission.fromProto(proto, BigIntify);
    expect(restored.fromListId).toBe('All');
    expect(restored.permanentlyPermittedTimes[0].start).toBe(10n);
    expect(restored.permanentlyPermittedTimes[0].end).toBe(50n);
  });

  it('should round-trip through JSON', () => {
    const perm = makeApprovalBase([[5n, 100n]]);
    const jsonVal = perm.toProto().toJson();
    const restored = CollectionApprovalPermission.fromJson(jsonVal, BigIntify);
    expect(restored.permanentlyPermittedTimes[0].start).toBe(5n);
  });

  it('should round-trip through JSON string', () => {
    const perm = makeApprovalBase([], [[1n, 200n]]);
    const jsonStr = perm.toProto().toJsonString();
    const restored = CollectionApprovalPermission.fromJsonString(jsonStr, BigIntify);
    expect(restored.permanentlyForbiddenTimes[0].start).toBe(1n);
    expect(restored.permanentlyForbiddenTimes[0].end).toBe(200n);
  });

  it('should toBech32Addresses without throwing', () => {
    const perm = makeApprovalBase();
    expect(() => perm.toBech32Addresses('bb')).not.toThrow();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// TokenIdsActionPermission - fromProto / fromJson / fromJsonString
// ──────────────────────────────────────────────────────────────────────────────
describe('TokenIdsActionPermission - serialization', () => {
  const makePerm = (permitted: [bigint, bigint][] = [], forbidden: [bigint, bigint][] = []) =>
    new TokenIdsActionPermission({
      tokenIds: [{ start: 1n, end: 100n }],
      permanentlyPermittedTimes: permitted.map(([s, e]) => ({ start: s, end: e })),
      permanentlyForbiddenTimes: forbidden.map(([s, e]) => ({ start: s, end: e }))
    });

  it('should round-trip through proto', () => {
    const perm = makePerm([[1n, 50n]]);
    const proto = perm.toProto();
    const restored = TokenIdsActionPermission.fromProto(proto, BigIntify);
    expect(restored.tokenIds[0].start).toBe(1n);
    expect(restored.tokenIds[0].end).toBe(100n);
    expect(restored.permanentlyPermittedTimes[0].start).toBe(1n);
    expect(restored.permanentlyPermittedTimes[0].end).toBe(50n);
  });

  it('should round-trip through JSON', () => {
    const perm = makePerm([[5n, 80n]]);
    const jsonVal = perm.toProto().toJson();
    const restored = TokenIdsActionPermission.fromJson(jsonVal, BigIntify);
    expect(restored.permanentlyPermittedTimes[0].end).toBe(80n);
  });

  it('should round-trip through JSON string', () => {
    const perm = makePerm([], [[10n, 20n]]);
    const jsonStr = perm.toProto().toJsonString();
    const restored = TokenIdsActionPermission.fromJsonString(jsonStr, BigIntify);
    expect(restored.permanentlyForbiddenTimes[0].start).toBe(10n);
    expect(restored.permanentlyForbiddenTimes[0].end).toBe(20n);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// ActionPermission - fromProto / fromJson / fromJsonString
// ──────────────────────────────────────────────────────────────────────────────
describe('ActionPermission - serialization', () => {
  it('should round-trip through proto', () => {
    const perm = new ActionPermission({
      permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
      permanentlyForbiddenTimes: [{ start: 200n, end: 300n }]
    });
    const proto = perm.toProto();
    const restored = ActionPermission.fromProto(proto, BigIntify);
    expect(restored.permanentlyPermittedTimes[0].start).toBe(1n);
    expect(restored.permanentlyPermittedTimes[0].end).toBe(100n);
    expect(restored.permanentlyForbiddenTimes[0].start).toBe(200n);
  });

  it('should round-trip through JSON', () => {
    const perm = new ActionPermission({
      permanentlyPermittedTimes: [{ start: 5n, end: 50n }],
      permanentlyForbiddenTimes: []
    });
    const jsonVal = perm.toProto().toJson();
    const restored = ActionPermission.fromJson(jsonVal, BigIntify);
    expect(restored.permanentlyPermittedTimes[0].start).toBe(5n);
  });

  it('should round-trip through JSON string', () => {
    const perm = new ActionPermission({
      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [{ start: 1n, end: 10n }]
    });
    const jsonStr = perm.toProto().toJsonString();
    const restored = ActionPermission.fromJsonString(jsonStr, BigIntify);
    expect(restored.permanentlyForbiddenTimes[0].end).toBe(10n);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// UserPermissions - fromProto / toBech32Addresses
// ──────────────────────────────────────────────────────────────────────────────
describe('UserPermissions - serialization', () => {
  it('should round-trip empty permissions through proto', () => {
    const perms = UserPermissions.InitEmpty();
    const proto = perms.toProto();
    const restored = UserPermissions.fromProto(proto, BigIntify);
    expect(restored.canUpdateOutgoingApprovals.length).toBe(0);
    expect(restored.canUpdateIncomingApprovals.length).toBe(0);
  });

  it('should round-trip full UserPermissions with actual data through proto (covers fromProto map bodies)', () => {
    const perms = new UserPermissions({
      canUpdateOutgoingApprovals: [
        new UserOutgoingApprovalPermission({
          toListId: 'All',
          initiatedByListId: 'All',
          approvalId: 'All',
          transferTimes: [{ start: 1n, end: 100n }],
          tokenIds: [{ start: 1n, end: 10n }],
          ownershipTimes: [{ start: 1n, end: 100n }],
          permanentlyPermittedTimes: [{ start: 1n, end: 50n }],
          permanentlyForbiddenTimes: []
        })
      ],
      canUpdateIncomingApprovals: [
        new UserIncomingApprovalPermission({
          fromListId: 'All',
          initiatedByListId: 'All',
          approvalId: 'All',
          transferTimes: [{ start: 1n, end: 100n }],
          tokenIds: [{ start: 1n, end: 10n }],
          ownershipTimes: [{ start: 1n, end: 100n }],
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 50n }]
        })
      ],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 10n }]
        })
      ],
      canUpdateAutoApproveAllIncomingTransfers: [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 10n, end: 20n }],
          permanentlyForbiddenTimes: []
        })
      ]
    });

    const proto = perms.toProto();
    const restored = UserPermissions.fromProto(proto, BigIntify);

    expect(restored.canUpdateOutgoingApprovals.length).toBe(1);
    expect(restored.canUpdateOutgoingApprovals[0].permanentlyPermittedTimes[0].start).toBe(1n);
    expect(restored.canUpdateIncomingApprovals.length).toBe(1);
    expect(restored.canUpdateIncomingApprovals[0].permanentlyForbiddenTimes[0].start).toBe(1n);
    expect(restored.canUpdateAutoApproveSelfInitiatedOutgoingTransfers.length).toBe(1);
    expect(restored.canUpdateAutoApproveSelfInitiatedOutgoingTransfers[0].permanentlyPermittedTimes[0].end).toBe(100n);
    expect(restored.canUpdateAutoApproveSelfInitiatedIncomingTransfers.length).toBe(1);
    expect(restored.canUpdateAutoApproveAllIncomingTransfers.length).toBe(1);
    expect(restored.canUpdateAutoApproveAllIncomingTransfers[0].permanentlyPermittedTimes[0].start).toBe(10n);
  });

  it('should round-trip through JSON', () => {
    const perms = UserPermissions.InitEmpty();
    const jsonVal = perms.toProto().toJson();
    const restored = UserPermissions.fromJson(jsonVal, BigIntify);
    expect(restored).toBeTruthy();
  });

  it('should round-trip through JSON string', () => {
    const perms = UserPermissions.InitEmpty();
    const jsonStr = perms.toProto().toJsonString();
    const restored = UserPermissions.fromJsonString(jsonStr, BigIntify);
    expect(restored).toBeTruthy();
  });

  it('should toBech32Addresses without throwing on empty permissions', () => {
    const perms = UserPermissions.InitEmpty();
    expect(() => perms.toBech32Addresses('bb')).not.toThrow();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// UserPermissionsWithDetails - constructor map bodies
// ──────────────────────────────────────────────────────────────────────────────
describe('UserPermissionsWithDetails - constructor with data', () => {
  it('should map all arrays when constructed with non-empty data (covers constructor map bodies)', () => {
    const makeOutgoingWithDetails = () =>
      new UserOutgoingApprovalPermissionWithDetails({
        toListId: 'All',
        initiatedByListId: 'All',
        approvalId: 'All',
        transferTimes: [{ start: 1n, end: 100n }],
        tokenIds: [{ start: 1n, end: 10n }],
        ownershipTimes: [{ start: 1n, end: 100n }],
        permanentlyPermittedTimes: [{ start: 1n, end: 50n }],
        permanentlyForbiddenTimes: [],
        toList: allAddresses(),
        initiatedByList: allAddresses()
      });

    const makeIncomingWithDetails = () =>
      new UserIncomingApprovalPermissionWithDetails({
        fromListId: 'All',
        initiatedByListId: 'All',
        approvalId: 'All',
        transferTimes: [{ start: 1n, end: 100n }],
        tokenIds: [{ start: 1n, end: 10n }],
        ownershipTimes: [{ start: 1n, end: 100n }],
        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: [{ start: 1n, end: 50n }],
        fromList: allAddresses(),
        initiatedByList: allAddresses()
      });

    const perms = new UserPermissionsWithDetails({
      canUpdateOutgoingApprovals: [makeOutgoingWithDetails()],
      canUpdateIncomingApprovals: [makeIncomingWithDetails()],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [
        new ActionPermission({ permanentlyPermittedTimes: [{ start: 1n, end: 100n }], permanentlyForbiddenTimes: [] })
      ],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [
        new ActionPermission({ permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [{ start: 1n, end: 10n }] })
      ],
      canUpdateAutoApproveAllIncomingTransfers: [
        new ActionPermission({ permanentlyPermittedTimes: [{ start: 10n, end: 20n }], permanentlyForbiddenTimes: [] })
      ]
    });

    expect(perms.canUpdateOutgoingApprovals.length).toBe(1);
    expect(perms.canUpdateOutgoingApprovals[0].toList).toBeDefined();
    expect(perms.canUpdateIncomingApprovals.length).toBe(1);
    expect(perms.canUpdateIncomingApprovals[0].fromList).toBeDefined();
    expect(perms.canUpdateAutoApproveSelfInitiatedOutgoingTransfers.length).toBe(1);
    expect(perms.canUpdateAutoApproveSelfInitiatedIncomingTransfers.length).toBe(1);
    expect(perms.canUpdateAutoApproveAllIncomingTransfers.length).toBe(1);
  });

  it('should convert UserPermissionsWithDetails using convert()', () => {
    const perms = new UserPermissionsWithDetails({
      canUpdateOutgoingApprovals: [
        new UserOutgoingApprovalPermissionWithDetails({
          toListId: 'All',
          initiatedByListId: 'All',
          approvalId: 'All',
          transferTimes: [{ start: 1n, end: 100n }],
          tokenIds: [{ start: 1n, end: 10n }],
          ownershipTimes: [{ start: 1n, end: 100n }],
          permanentlyPermittedTimes: [{ start: 1n, end: 50n }],
          permanentlyForbiddenTimes: [],
          toList: allAddresses(),
          initiatedByList: allAddresses()
        })
      ],
      canUpdateIncomingApprovals: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
      canUpdateAutoApproveAllIncomingTransfers: []
    });

    const converted = perms.convert(Stringify);
    expect(converted.canUpdateOutgoingApprovals[0].tokenIds[0].start).toBe('1');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// CollectionApprovalPermissionWithDetails - clone and convert
// ──────────────────────────────────────────────────────────────────────────────
describe('CollectionApprovalPermissionWithDetails - clone and convert', () => {
  it('should clone successfully', () => {
    const perm = new CollectionApprovalPermissionWithDetails({
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 100n }],
      permanentlyPermittedTimes: [{ start: 1n, end: 50n }],
      permanentlyForbiddenTimes: [],
      fromList: allAddresses(),
      toList: allAddresses(),
      initiatedByList: allAddresses()
    });

    const cloned = perm.clone();
    expect(cloned).toBeTruthy();
    expect(cloned.fromListId).toBe('All');
  });

  it('should convert to string type', () => {
    const perm = new CollectionApprovalPermissionWithDetails({
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 100n }],
      permanentlyPermittedTimes: [{ start: 5n, end: 50n }],
      permanentlyForbiddenTimes: [],
      fromList: allAddresses(),
      toList: allAddresses(),
      initiatedByList: allAddresses()
    });

    const converted = perm.convert(Stringify);
    expect(converted.permanentlyPermittedTimes[0].start).toBe('5');
    expect(converted.tokenIds[0].start).toBe('1');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// UserIncomingApprovalPermissionWithDetails - clone, convert, castToCollectionApproval
// ──────────────────────────────────────────────────────────────────────────────
describe('UserIncomingApprovalPermissionWithDetails - clone and convert', () => {
  const makeIncomingWithDetails = () =>
    new UserIncomingApprovalPermissionWithDetails({
      fromListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 100n }],
      permanentlyPermittedTimes: [{ start: 1n, end: 50n }],
      permanentlyForbiddenTimes: [],
      fromList: allAddresses(),
      initiatedByList: allAddresses()
    });

  it('should clone successfully', () => {
    const perm = makeIncomingWithDetails();
    const cloned = perm.clone();
    expect(cloned).toBeTruthy();
    expect(cloned.fromListId).toBe('All');
    expect(cloned.fromList).toBeDefined();
  });

  it('should convert to string type', () => {
    const perm = makeIncomingWithDetails();
    const converted = perm.convert(Stringify);
    expect(converted.tokenIds[0].start).toBe('1');
    expect(converted.permanentlyPermittedTimes[0].start).toBe('1');
  });

  it('should castToCollectionApprovalPermission with toList set', () => {
    const perm = makeIncomingWithDetails();
    const addr = genTestAddress();
    const casted = perm.castToCollectionApprovalPermission(addr);
    expect(casted.toListId).toBe(addr);
    expect(casted.toList).toBeDefined();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// UserOutgoingApprovalPermissionWithDetails - clone, convert, castToCollectionApproval
// ──────────────────────────────────────────────────────────────────────────────
describe('UserOutgoingApprovalPermissionWithDetails - clone and convert', () => {
  const makeOutgoingWithDetails = () =>
    new UserOutgoingApprovalPermissionWithDetails({
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 100n }],
      permanentlyPermittedTimes: [{ start: 1n, end: 50n }],
      permanentlyForbiddenTimes: [],
      toList: allAddresses(),
      initiatedByList: allAddresses()
    });

  it('should clone successfully', () => {
    const perm = makeOutgoingWithDetails();
    const cloned = perm.clone();
    expect(cloned).toBeTruthy();
    expect(cloned.toListId).toBe('All');
    expect(cloned.toList).toBeDefined();
  });

  it('should convert to string type', () => {
    const perm = makeOutgoingWithDetails();
    const converted = perm.convert(Stringify);
    expect(converted.tokenIds[0].start).toBe('1');
    expect(converted.permanentlyPermittedTimes[0].start).toBe('1');
  });

  it('should castToCollectionApprovalPermission with fromList set', () => {
    const perm = makeOutgoingWithDetails();
    const addr = genTestAddress();
    const casted = perm.castToCollectionApprovalPermission(addr);
    expect(casted.fromListId).toBe(addr);
    expect(casted.fromList).toBeDefined();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// checkNotForbiddenForAllOverlaps - extended error message branches
// (tests the timeline/transfer/ownership/list error string building in CollectionApprovalPermission.check)
// ──────────────────────────────────────────────────────────────────────────────
describe('CollectionApprovalPermission.check - extended error messages', () => {
  it('should include timeline times in error message when usesLists=true and forbidden', () => {
    // This hits the usesTimelineTimes / usesTransferTimes / usesOwnershipTimes / usesToLists branches
    const addr = genTestAddress();

    const perm = new CollectionApprovalPermissionWithDetails({
      fromListId: 'All',
      toListId: addr,
      initiatedByListId: 'All',
      approvalId: 'All',
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      tokenIds: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [{ start: 1n, end: 18446744073709551615n }],
      fromList: allAddresses(),
      toList: whitelistOf([addr]),
      initiatedByList: allAddresses()
    });

    const err = CollectionApprovalPermission.check(
      [
        {
          tokenIds: UintRangeArray.From([{ start: 1n, end: 5n }]),
          ownershipTimes: fullRange(),
          transferTimes: fullRange(),
          toList: whitelistOf([addr]),
          fromList: allAddresses(),
          initiatedByList: allAddresses(),
          approvalIdList: allAddresses()
        }
      ],
      [perm],
      50n
    );
    expect(err).not.toBeNull();
    expect(err!.message).toContain('forbidden');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// validateUniversalPermissionUpdate (in permissions.ts) - multiple errors & combined
// ──────────────────────────────────────────────────────────────────────────────
describe('validateUniversalPermissionUpdate - multiple missing and combined error', () => {
  it('should mention count when multiple permissions are missing', () => {
    // Two distinct old permissions, neither present in new → error mentions "along with N more"
    const makeSimpleWithDetails = (tokenStart: bigint, tokenEnd: bigint) =>
      new CollectionApprovalPermissionWithDetails({
        fromListId: 'All',
        toListId: 'All',
        initiatedByListId: 'All',
        approvalId: 'All',
        transferTimes: [{ start: 1n, end: 1n }],
        tokenIds: [{ start: tokenStart, end: tokenEnd }],
        ownershipTimes: [{ start: 1n, end: 1n }],
        permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
        permanentlyForbiddenTimes: [],
        fromList: allAddresses(),
        toList: allAddresses(),
        initiatedByList: allAddresses()
      });

    const oldPerms = [makeSimpleWithDetails(1n, 5n), makeSimpleWithDetails(10n, 15n)];
    const newPerms: CollectionApprovalPermissionWithDetails<bigint>[] = [];

    const err = CollectionApprovalPermission.validateUpdate(oldPerms, newPerms);
    expect(err).not.toBeNull();
    // When multiple permissions are removed, error should mention "(along with N more)"
    expect(err!.message).toMatch(/along with|found in old/);
  });

  it('should produce combined permitted+forbidden error when both are being removed', () => {
    // Old has both permitted AND forbidden times explicitly set; new removes both
    const makeApprovalWithBoth = (permitted: [bigint, bigint][], forbidden: [bigint, bigint][]) =>
      new CollectionApprovalPermissionWithDetails({
        fromListId: 'All',
        toListId: 'All',
        initiatedByListId: 'All',
        approvalId: 'All',
        transferTimes: [{ start: 1n, end: 1n }],
        tokenIds: [{ start: 1n, end: 10n }],
        ownershipTimes: [{ start: 1n, end: 1n }],
        permanentlyPermittedTimes: permitted.map(([s, e]) => ({ start: s, end: e })),
        permanentlyForbiddenTimes: forbidden.map(([s, e]) => ({ start: s, end: e })),
        fromList: allAddresses(),
        toList: allAddresses(),
        initiatedByList: allAddresses()
      });

    const oldPerms = [makeApprovalWithBoth([[1n, 50n]], [[51n, 100n]])];
    // New perm covers same range but drops both permitted and forbidden → both changed
    const newPerms = [makeApprovalWithBoth([], [])];

    const err = CollectionApprovalPermission.validateUpdate(oldPerms, newPerms);
    expect(err).not.toBeNull();
    // Should mention removing previously allowed times
    expect(err!.message).toMatch(/allowed|disApproved/i);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// getPermissionString branches via ActionPermission error messages
// (whitelist=true paths, address listing in error strings)
// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
// CollectionPermissionsWithDetails - constructor with canUpdateCollectionApprovals data
// ──────────────────────────────────────────────────────────────────────────────
describe('CollectionPermissionsWithDetails - constructor with canUpdateCollectionApprovals', () => {
  it('should map canUpdateCollectionApprovals to CollectionApprovalPermissionWithDetails (covers lines 1014-1023)', () => {
    const perms = new CollectionPermissionsWithDetails({
      canDeleteCollection: [],
      canArchiveCollection: [],
      canUpdateStandards: [],
      canUpdateCustomData: [],
      canUpdateManager: [],
      canUpdateCollectionMetadata: [],
      canUpdateValidTokenIds: [],
      canUpdateTokenMetadata: [],
      canUpdateCollectionApprovals: [
        new CollectionApprovalPermissionWithDetails({
          fromListId: 'All',
          toListId: 'All',
          initiatedByListId: 'All',
          approvalId: 'All',
          transferTimes: [{ start: 1n, end: 18446744073709551615n }],
          tokenIds: [{ start: 1n, end: 18446744073709551615n }],
          ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: [],
          fromList: allAddresses(),
          toList: allAddresses(),
          initiatedByList: allAddresses()
        })
      ],
      canAddMoreAliasPaths: [],
      canAddMoreCosmosCoinWrapperPaths: []
    });

    expect(perms.canUpdateCollectionApprovals.length).toBe(1);
    expect(perms.canUpdateCollectionApprovals[0].fromList).toBeDefined();
    expect(perms.canUpdateCollectionApprovals[0].permanentlyPermittedTimes[0].start).toBe(1n);
  });

  it('should clone CollectionPermissionsWithDetails', () => {
    const perms = new CollectionPermissionsWithDetails({
      canDeleteCollection: [],
      canArchiveCollection: [],
      canUpdateStandards: [],
      canUpdateCustomData: [],
      canUpdateManager: [],
      canUpdateCollectionMetadata: [],
      canUpdateValidTokenIds: [],
      canUpdateTokenMetadata: [],
      canUpdateCollectionApprovals: [],
      canAddMoreAliasPaths: [],
      canAddMoreCosmosCoinWrapperPaths: []
    });

    const cloned = perms.clone();
    expect(cloned).toBeTruthy();
  });

  it('should convert CollectionPermissionsWithDetails (covers line 1019)', () => {
    const perms = new CollectionPermissionsWithDetails({
      canDeleteCollection: [],
      canArchiveCollection: [],
      canUpdateStandards: [],
      canUpdateCustomData: [],
      canUpdateManager: [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ],
      canUpdateCollectionMetadata: [],
      canUpdateValidTokenIds: [],
      canUpdateTokenMetadata: [],
      canUpdateCollectionApprovals: [
        new CollectionApprovalPermissionWithDetails({
          fromListId: 'All',
          toListId: 'All',
          initiatedByListId: 'All',
          approvalId: 'All',
          transferTimes: [{ start: 1n, end: 18446744073709551615n }],
          tokenIds: [{ start: 1n, end: 18446744073709551615n }],
          ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
          permanentlyPermittedTimes: [{ start: 5n, end: 50n }],
          permanentlyForbiddenTimes: [],
          fromList: allAddresses(),
          toList: allAddresses(),
          initiatedByList: allAddresses()
        })
      ],
      canAddMoreAliasPaths: [],
      canAddMoreCosmosCoinWrapperPaths: []
    });

    const converted = perms.convert(Stringify);
    expect(converted.canUpdateManager[0].permanentlyPermittedTimes[0].start).toBe('1');
    expect(converted.canUpdateCollectionApprovals[0].permanentlyPermittedTimes[0].start).toBe('5');
  });
});

describe('getPermissionString branches - whitelist and address listing', () => {
  it('should produce error message with whitelist address info when whitelist=true', () => {
    const addr1 = genTestAddress();
    const addr2 = genTestAddress();

    // We need an approval permission with whitelist=true lists so it shows in error
    const makeWithWhitelist = () =>
      new CollectionApprovalPermissionWithDetails({
        fromListId: 'All',
        toListId: 'whitelist-test',
        initiatedByListId: 'All',
        approvalId: 'All',
        transferTimes: [{ start: 1n, end: 1n }],
        tokenIds: [{ start: 1n, end: 5n }],
        ownershipTimes: [{ start: 1n, end: 1n }],
        permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
        permanentlyForbiddenTimes: [],
        fromList: whitelistOf([addr1, addr2]),  // whitelist=true, 2 addresses → triggers whitelist branch
        toList: whitelistOf([addr1, addr2]),
        initiatedByList: whitelistOf([addr1, addr2])
      });

    const oldPerms = [makeWithWhitelist()];
    const newPerms: CollectionApprovalPermissionWithDetails<bigint>[] = [];

    // Removing old permission triggers getPermissionString with whitelist=true lists
    const err = CollectionApprovalPermission.validateUpdate(oldPerms, newPerms);
    expect(err).not.toBeNull();
    // Error message should include the permission string
    expect(err!.message).toContain('found in old permissions');
  });
});

describe('UserOutgoingApprovalPermission', () => {
  const makeOutgoingPerm = (opts: { permitted?: [bigint, bigint][]; forbidden?: [bigint, bigint][] }) => {
    return new UserOutgoingApprovalPermissionWithDetails({
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'All',
      tokenIds: [{ start: 1n, end: 18446744073709551615n }],
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
      permanentlyPermittedTimes: (opts.permitted || []).map(([s, e]) => ({ start: s, end: e })),
      permanentlyForbiddenTimes: (opts.forbidden || []).map(([s, e]) => ({ start: s, end: e })),
      toList: allAddresses(),
      initiatedByList: allAddresses()
    });
  };

  describe('construction', () => {
    it('should create an instance', () => {
      const perm = makeOutgoingPerm({ permitted: [[1n, 100n]] });
      expect(perm).toBeTruthy();
      expect(perm.toListId).toBe('All');
      expect(perm.initiatedByListId).toBe('All');
    });
  });

  describe('castToCollectionApprovalPermission', () => {
    it('should cast with a valid address for from field', () => {
      const perm = makeOutgoingPerm({});
      const addr = genTestAddress();
      const castedPerm = perm.castToCollectionApprovalPermission(addr);
      expect(castedPerm).toBeTruthy();
      expect(castedPerm.fromListId).toBe(addr);
    });

    it('should throw when using invalid dummy address "0x"', () => {
      const perm = makeOutgoingPerm({});
      expect(() => perm.castToCollectionApprovalPermission('0x')).toThrow('Invalid address list ID');
    });
  });

  describe('validateUpdate', () => {
    it('should allow identical outgoing approval permissions', () => {
      const perms = [makeOutgoingPerm({ permitted: [[1n, 100n]] })];
      const result = UserOutgoingApprovalPermission.validateUpdate(perms, perms);
      expect(result).toBeNull();
    });

    it('should reject shrinking permitted times', () => {
      const oldPerms = [makeOutgoingPerm({ permitted: [[1n, 100n]] })];
      const newPerms = [makeOutgoingPerm({ permitted: [[1n, 50n]] })];
      const result = UserOutgoingApprovalPermission.validateUpdate(oldPerms, newPerms);
      expect(result).not.toBeNull();
    });
  });
});

describe('UserIncomingApprovalPermission', () => {
  const makeIncomingPerm = (opts: { permitted?: [bigint, bigint][]; forbidden?: [bigint, bigint][] }) => {
    return new UserIncomingApprovalPermissionWithDetails({
      fromListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'All',
      tokenIds: [{ start: 1n, end: 18446744073709551615n }],
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],
      permanentlyPermittedTimes: (opts.permitted || []).map(([s, e]) => ({ start: s, end: e })),
      permanentlyForbiddenTimes: (opts.forbidden || []).map(([s, e]) => ({ start: s, end: e })),
      fromList: allAddresses(),
      initiatedByList: allAddresses()
    });
  };

  describe('construction', () => {
    it('should create an instance', () => {
      const perm = makeIncomingPerm({ permitted: [[1n, 100n]] });
      expect(perm).toBeTruthy();
      expect(perm.fromListId).toBe('All');
    });
  });

  describe('castToCollectionApprovalPermission', () => {
    it('should cast with a valid address for to field', () => {
      const perm = makeIncomingPerm({});
      const addr = genTestAddress();
      const castedPerm = perm.castToCollectionApprovalPermission(addr);
      expect(castedPerm).toBeTruthy();
      expect(castedPerm.toListId).toBe(addr);
    });

    it('should throw when using invalid dummy address "0x"', () => {
      const perm = makeIncomingPerm({});
      expect(() => perm.castToCollectionApprovalPermission('0x')).toThrow('Invalid address list ID');
    });
  });

  describe('validateUpdate', () => {
    it('should allow identical incoming approval permissions', () => {
      const perms = [makeIncomingPerm({ permitted: [[1n, 100n]] })];
      const result = UserIncomingApprovalPermission.validateUpdate(perms, perms);
      expect(result).toBeNull();
    });

    it('should reject changing permitted to forbidden', () => {
      const oldPerms = [makeIncomingPerm({ permitted: [[1n, 100n]] })];
      const newPerms = [makeIncomingPerm({ forbidden: [[1n, 100n]] })];
      const result = UserIncomingApprovalPermission.validateUpdate(oldPerms, newPerms);
      expect(result).not.toBeNull();
    });

    it('should allow extending forbidden times', () => {
      const oldPerms = [makeIncomingPerm({ forbidden: [[1n, 50n]] })];
      const newPerms = [makeIncomingPerm({ forbidden: [[1n, 100n]] })];
      const result = UserIncomingApprovalPermission.validateUpdate(oldPerms, newPerms);
      expect(result).toBeNull();
    });
  });
});

describe('Permissions edge cases', () => {
  describe('Multiple permissions - first match only semantics', () => {
    it('should use first match when multiple action permissions overlap', () => {
      // First permission forbids time 1-50, second permits 1-100
      // First-match-only means time 1-50 is forbidden (from first match),
      // time 51-100 is permitted (from second match)
      const perms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 50n }]
        }),
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: []
        })
      ];

      // Time 25 should be forbidden (first match)
      const err1 = ActionPermission.check(perms, 25n);
      expect(err1).not.toBeNull();

      // Time 75 should be permitted (second match takes effect)
      const err2 = ActionPermission.check(perms, 75n);
      expect(err2).toBeNull();
    });
  });

  describe('convert method', () => {
    it('should convert ActionPermission number types', () => {
      const perm = new ActionPermission({
        permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
        permanentlyForbiddenTimes: []
      });
      const converted = perm.convert((val) => val.toString());
      expect(converted.permanentlyPermittedTimes[0].start).toBe('1');
      expect(converted.permanentlyPermittedTimes[0].end).toBe('100');
    });

    it('should convert TokenIdsActionPermission number types', () => {
      const perm = new TokenIdsActionPermission({
        tokenIds: [{ start: 1n, end: 10n }],
        permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
        permanentlyForbiddenTimes: []
      });
      const converted = perm.convert((val) => val.toString());
      expect(converted.tokenIds[0].start).toBe('1');
      expect(converted.tokenIds[0].end).toBe('10');
      expect(converted.permanentlyPermittedTimes[0].start).toBe('1');
    });

    it('should convert CollectionPermissions number types', () => {
      const perms = new CollectionPermissions({
        canDeleteCollection: [
          new ActionPermission({
            permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
            permanentlyForbiddenTimes: []
          })
        ],
        canArchiveCollection: [],
        canUpdateStandards: [],
        canUpdateCustomData: [],
        canUpdateManager: [],
        canUpdateCollectionMetadata: [],
        canUpdateValidTokenIds: [],
        canUpdateTokenMetadata: [],
        canUpdateCollectionApprovals: [],
        canAddMoreAliasPaths: [],
        canAddMoreCosmosCoinWrapperPaths: []
      });
      const converted = perms.convert((val) => val.toString());
      expect(converted.canDeleteCollection[0].permanentlyPermittedTimes[0].start).toBe('1');
    });
  });

  describe('toBech32Addresses', () => {
    it('should convert UserOutgoingApprovalPermission list IDs to bech32', () => {
      const addr = genTestAddress();
      const perm = new UserOutgoingApprovalPermission({
        toListId: addr,
        initiatedByListId: 'All',
        approvalId: 'test',
        tokenIds: [{ start: 1n, end: 10n }],
        transferTimes: [{ start: 1n, end: 100n }],
        ownershipTimes: [{ start: 1n, end: 100n }],
        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: []
      });
      const converted = perm.toBech32Addresses('bb');
      expect(converted).toBeTruthy();
      // The toListId should still be valid
      expect(typeof converted.toListId).toBe('string');
    });

    it('should convert UserIncomingApprovalPermission list IDs to bech32', () => {
      const addr = genTestAddress();
      const perm = new UserIncomingApprovalPermission({
        fromListId: addr,
        initiatedByListId: 'All',
        approvalId: 'test',
        tokenIds: [{ start: 1n, end: 10n }],
        transferTimes: [{ start: 1n, end: 100n }],
        ownershipTimes: [{ start: 1n, end: 100n }],
        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: []
      });
      const converted = perm.toBech32Addresses('bb');
      expect(converted).toBeTruthy();
      expect(typeof converted.fromListId).toBe('string');
    });
  });

  describe('Frozen permissions (all-time forbidden)', () => {
    it('should permanently freeze an action by forbidding all times', () => {
      const perms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 18446744073709551615n }]
        })
      ];

      // Check at various times - all should be forbidden
      for (const time of [1n, 100n, 1000000n, 18446744073709551615n]) {
        const err = ActionPermission.check(perms, time);
        expect(err).not.toBeNull();
      }
    });

    it('should not be possible to unfreeze a permanently frozen permission', () => {
      const frozenPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 18446744073709551615n }]
        })
      ];

      // Try to update to unfrozen
      const unfrozenPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 18446744073709551615n }],
          permanentlyForbiddenTimes: []
        })
      ];

      const err = ActionPermission.validateUpdate(frozenPerms, unfrozenPerms);
      expect(err).not.toBeNull();
    });

    it('should not be possible to remove forbidden times from a frozen permission', () => {
      const frozenPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 18446744073709551615n }]
        })
      ];

      const partiallyUnfrozenPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 100n }]
        })
      ];

      const err = ActionPermission.validateUpdate(frozenPerms, partiallyUnfrozenPerms);
      expect(err).not.toBeNull();
    });
  });

  describe('Permanently permitted permissions (all-time permitted)', () => {
    it('should permanently allow an action by permitting all times', () => {
      const perms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 18446744073709551615n }],
          permanentlyForbiddenTimes: []
        })
      ];

      // Check at various times - all should be permitted
      for (const time of [1n, 100n, 1000000n]) {
        const err = ActionPermission.check(perms, time);
        expect(err).toBeNull();
      }
    });

    it('should not be possible to revoke a permanently permitted permission', () => {
      const permittedPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 18446744073709551615n }],
          permanentlyForbiddenTimes: []
        })
      ];

      const revokedPerms = [
        new ActionPermission({
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [{ start: 1n, end: 18446744073709551615n }]
        })
      ];

      const err = ActionPermission.validateUpdate(permittedPerms, revokedPerms);
      expect(err).not.toBeNull();
    });
  });

  describe('Mixed permitted and forbidden times', () => {
    it('should handle non-overlapping permitted and forbidden time ranges', () => {
      const perms = [
        new ActionPermission({
          permanentlyPermittedTimes: [{ start: 1n, end: 100n }],
          permanentlyForbiddenTimes: [{ start: 101n, end: 200n }]
        })
      ];

      // Permitted range
      const err1 = ActionPermission.check(perms, 50n);
      expect(err1).toBeNull();

      // Forbidden range
      const err2 = ActionPermission.check(perms, 150n);
      expect(err2).not.toBeNull();
    });
  });
});
