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
