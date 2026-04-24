/**
 * Tests for `set_permissions` builder tool.
 *
 * handleSetPermissions is how collection permissions are frozen/unfrozen at
 * creation. It has three meaningful branches:
 *
 *   1. `preset` string -> materialize one of three canned permission sets
 *      (fully-immutable, manager-controlled, locked-approvals). Custom
 *      `permissions` keys merged on top still win.
 *   2. `permissions` object only -> pass-through (plus neutral fill for
 *      any of the 11 required keys that are missing).
 *   3. Neither supplied -> default to `locked-approvals`.
 *
 * The handler also runs shape validation on every entry of every key:
 * non-array value, non-object entry, empty object, or a record missing BOTH
 * permanentlyPermittedTimes and permanentlyForbiddenTimes are rejected with
 * a helpful error.
 */
import { handleSetPermissions } from './setPermissions.js';
import { getOrCreateSession, resetAllSessions } from '../../session/sessionState.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];
const FROZEN_ACTION = [{ permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER }];
const REQUIRED_KEYS = [
  'canDeleteCollection', 'canArchiveCollection', 'canUpdateStandards', 'canUpdateCustomData',
  'canUpdateManager', 'canUpdateCollectionMetadata', 'canUpdateValidTokenIds',
  'canUpdateTokenMetadata', 'canUpdateCollectionApprovals', 'canAddMoreAliasPaths',
  'canAddMoreCosmosCoinWrapperPaths'
];

describe('handleSetPermissions', () => {
  beforeEach(() => resetAllSessions());

  describe('preset behavior', () => {
    it('applies the fully-immutable preset — every key frozen', () => {
      const res = handleSetPermissions({ preset: 'fully-immutable' });
      expect(res.success).toBe(true);
      expect(res.preset).toBe('fully-immutable');

      const perms = getOrCreateSession().messages[0].value.collectionPermissions;
      // Every required key is non-empty (frozen)
      for (const key of REQUIRED_KEYS) {
        expect(Array.isArray(perms[key])).toBe(true);
        expect(perms[key].length).toBeGreaterThan(0);
      }
      expect(perms.canDeleteCollection).toEqual(FROZEN_ACTION);
    });

    it('applies the manager-controlled preset — only delete frozen', () => {
      const res = handleSetPermissions({ preset: 'manager-controlled' });
      expect(res.success).toBe(true);

      const perms = getOrCreateSession().messages[0].value.collectionPermissions;
      expect(perms.canDeleteCollection).toEqual(FROZEN_ACTION);
      // All others neutral (empty array)
      expect(perms.canArchiveCollection).toEqual([]);
      expect(perms.canUpdateStandards).toEqual([]);
      expect(perms.canUpdateCollectionApprovals).toEqual([]);
      expect(perms.canUpdateManager).toEqual([]);
    });

    it('applies the locked-approvals preset — approvals + supply + delete frozen, metadata neutral', () => {
      const res = handleSetPermissions({ preset: 'locked-approvals' });
      expect(res.success).toBe(true);

      const perms = getOrCreateSession().messages[0].value.collectionPermissions;
      // Frozen fields
      expect(perms.canDeleteCollection.length).toBeGreaterThan(0);
      expect(perms.canUpdateStandards.length).toBeGreaterThan(0);
      expect(perms.canUpdateManager.length).toBeGreaterThan(0);
      expect(perms.canUpdateValidTokenIds.length).toBeGreaterThan(0);
      expect(perms.canUpdateCollectionApprovals.length).toBeGreaterThan(0);
      expect(perms.canAddMoreAliasPaths.length).toBeGreaterThan(0);
      expect(perms.canAddMoreCosmosCoinWrapperPaths.length).toBeGreaterThan(0);
      // Metadata neutral (editable)
      expect(perms.canArchiveCollection).toEqual([]);
      expect(perms.canUpdateCustomData).toEqual([]);
      expect(perms.canUpdateCollectionMetadata).toEqual([]);
      expect(perms.canUpdateTokenMetadata).toEqual([]);
    });

    it('defaults to locked-approvals when neither preset nor permissions is provided', () => {
      const res = handleSetPermissions({});
      expect(res.success).toBe(true);
      expect(res.preset).toBe('custom'); // preset undefined -> reports "custom"

      const perms = getOrCreateSession().messages[0].value.collectionPermissions;
      expect(perms.canUpdateCollectionApprovals.length).toBeGreaterThan(0);
      expect(perms.canUpdateCollectionMetadata).toEqual([]);
    });

    it('allows a custom override on top of a preset', () => {
      // Start from fully-immutable, then force canUpdateCollectionMetadata neutral
      const res = handleSetPermissions({
        preset: 'fully-immutable',
        permissions: { canUpdateCollectionMetadata: [] }
      });
      expect(res.success).toBe(true);

      const perms = getOrCreateSession().messages[0].value.collectionPermissions;
      expect(perms.canUpdateCollectionMetadata).toEqual([]); // overridden
      expect(perms.canDeleteCollection).toEqual(FROZEN_ACTION); // preserved
    });

    it('reports preset name (or "custom") in the response', () => {
      expect(handleSetPermissions({ preset: 'locked-approvals' }).preset).toBe('locked-approvals');
      expect(handleSetPermissions({ permissions: { canDeleteCollection: [] } }).preset).toBe('custom');
      expect(handleSetPermissions({}).preset).toBe('custom');
    });
  });

  describe('custom permissions', () => {
    it('pass-through when only permissions supplied', () => {
      const custom = {
        canDeleteCollection: FROZEN_ACTION,
        canArchiveCollection: []
      };
      const res = handleSetPermissions({ permissions: custom as any });
      expect(res.success).toBe(true);

      const perms = getOrCreateSession().messages[0].value.collectionPermissions;
      expect(perms.canDeleteCollection).toEqual(FROZEN_ACTION);
      expect(perms.canArchiveCollection).toEqual([]);
    });

    it('auto-fills all 11 required keys with neutral [] when missing from custom permissions', () => {
      const res = handleSetPermissions({
        permissions: { canDeleteCollection: FROZEN_ACTION } as any
      });
      expect(res.success).toBe(true);

      const perms = getOrCreateSession().messages[0].value.collectionPermissions;
      for (const key of REQUIRED_KEYS) {
        expect(key in perms).toBe(true);
      }
      // Supplied key preserved
      expect(perms.canDeleteCollection).toEqual(FROZEN_ACTION);
      // Non-supplied keys neutral
      expect(perms.canArchiveCollection).toEqual([]);
      expect(perms.canUpdateStandards).toEqual([]);
    });

    it('writes updateCollectionPermissions=true to the session', () => {
      handleSetPermissions({ preset: 'locked-approvals' });
      const value = getOrCreateSession().messages[0].value;
      expect(value.updateCollectionPermissions).toBe(true);
    });
  });

  describe('validation errors', () => {
    it('rejects a permission value that is not an array', () => {
      const res = handleSetPermissions({
        permissions: { canDeleteCollection: 'not-an-array' as any } as any
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/canDeleteCollection/);
      expect(res.error).toMatch(/must be an array/i);
    });

    it('rejects a permission value that is an object (not an array)', () => {
      const res = handleSetPermissions({
        permissions: { canDeleteCollection: { foo: 'bar' } as any } as any
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/must be an array/i);
    });

    it('rejects a permission array entry that is null', () => {
      const res = handleSetPermissions({
        permissions: { canDeleteCollection: [null] as any } as any
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/\[0\]/);
      expect(res.error).toMatch(/must be an object/i);
    });

    it('rejects a permission array entry that is a primitive', () => {
      const res = handleSetPermissions({
        permissions: { canDeleteCollection: ['oops'] as any } as any
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/must be an object/i);
    });

    it('rejects an empty object entry with a helpful hint', () => {
      const res = handleSetPermissions({
        permissions: { canDeleteCollection: [{}] as any } as any
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/empty object/i);
      expect(res.error).toMatch(/permanentlyPermittedTimes|permanentlyForbiddenTimes/);
    });

    it('rejects an entry that is missing BOTH permanentlyPermittedTimes and permanentlyForbiddenTimes', () => {
      const res = handleSetPermissions({
        permissions: { canDeleteCollection: [{ tokenIds: FOREVER }] as any } as any
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/missing permanentlyPermittedTimes and permanentlyForbiddenTimes/i);
    });

    it('accepts an entry with only permanentlyPermittedTimes (one of the two is enough)', () => {
      const res = handleSetPermissions({
        permissions: {
          canDeleteCollection: [{ permanentlyPermittedTimes: FOREVER }] as any
        } as any
      });
      expect(res.success).toBe(true);
    });

    it('accepts an entry with only permanentlyForbiddenTimes', () => {
      const res = handleSetPermissions({
        permissions: {
          canDeleteCollection: [{ permanentlyForbiddenTimes: FOREVER }] as any
        } as any
      });
      expect(res.success).toBe(true);
    });

    it('error name prefix includes the array index of the offending entry', () => {
      const res = handleSetPermissions({
        permissions: {
          canDeleteCollection: [
            { permanentlyForbiddenTimes: FOREVER },
            {} // <-- offender at [1]
          ] as any
        } as any
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/\[1\]/);
    });
  });

  describe('session state', () => {
    it('replaces permissions on re-call (set semantics)', () => {
      handleSetPermissions({ preset: 'fully-immutable' });
      handleSetPermissions({ preset: 'manager-controlled' });
      const perms = getOrCreateSession().messages[0].value.collectionPermissions;
      // Manager-controlled leaves approvals neutral
      expect(perms.canUpdateCollectionApprovals).toEqual([]);
    });

    it('isolates permissions per sessionId', () => {
      handleSetPermissions({ sessionId: 'a', preset: 'fully-immutable' });
      handleSetPermissions({ sessionId: 'b', preset: 'manager-controlled' });
      const a = getOrCreateSession('a').messages[0].value.collectionPermissions;
      const b = getOrCreateSession('b').messages[0].value.collectionPermissions;
      expect(a.canUpdateCollectionMetadata.length).toBeGreaterThan(0); // frozen
      expect(b.canUpdateCollectionMetadata).toEqual([]); // neutral
    });

    it('auto-creates session with creatorAddress when supplied', () => {
      handleSetPermissions({ sessionId: 'c', creatorAddress: 'bb1creator', preset: 'locked-approvals' });
      const s = getOrCreateSession('c');
      expect(s.messages[0].value.creator).toBe('bb1creator');
    });
  });
});
