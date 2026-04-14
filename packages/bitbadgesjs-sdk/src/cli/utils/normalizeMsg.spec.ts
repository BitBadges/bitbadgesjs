/**
 * Tests for the Universal → Create/Update narrowing helpers.
 *
 * Rules under test (locked against `proto/tokenization/tx.proto`):
 *   - Create: no `collectionId`, no `updateXxxTimeline` flags, keeps
 *     `defaultBalances` + `invariants`.
 *   - Update: requires non-zero `collectionId` + flags, must not set
 *     `defaultBalances` or `invariants`.
 *   - Universal: superset — passes through unchanged when it's already
 *     wearing the Universal typeUrl.
 */

import {
  isCollectionMsg,
  normalizeToCreateOrUpdate,
  coerceToUniversal,
  normalizeTxMessages
} from './normalizeMsg.js';

const UNIVERSAL = '/tokenization.MsgUniversalUpdateCollection';
const CREATE = '/tokenization.MsgCreateCollection';
const UPDATE = '/tokenization.MsgUpdateCollection';
const TRANSFER = '/tokenization.MsgTransferTokens';

const UPDATE_FLAGS = [
  'updateValidTokenIds',
  'updateCollectionPermissions',
  'updateManager',
  'updateCollectionMetadata',
  'updateTokenMetadata',
  'updateCustomData',
  'updateCollectionApprovals',
  'updateStandards',
  'updateIsArchived'
];

describe('isCollectionMsg', () => {
  it('returns true for all three collection msg typeUrls', () => {
    expect(isCollectionMsg({ typeUrl: UNIVERSAL })).toBe(true);
    expect(isCollectionMsg({ typeUrl: CREATE })).toBe(true);
    expect(isCollectionMsg({ typeUrl: UPDATE })).toBe(true);
  });

  it('returns false for non-collection msgs', () => {
    expect(isCollectionMsg({ typeUrl: TRANSFER })).toBe(false);
    expect(isCollectionMsg({ typeUrl: '/cosmos.bank.v1beta1.MsgSend' })).toBe(false);
  });

  it('returns false for malformed input', () => {
    expect(isCollectionMsg(null)).toBe(false);
    expect(isCollectionMsg(undefined)).toBe(false);
    expect(isCollectionMsg({})).toBe(false);
    expect(isCollectionMsg({ typeUrl: null })).toBe(false);
    expect(isCollectionMsg({ typeUrl: 42 })).toBe(false);
  });

  it('matches non-slash-prefixed typeUrls that end with the collection suffix', () => {
    // Amino / @type style sometimes drops the leading slash.
    expect(isCollectionMsg({ typeUrl: 'tokenization.MsgCreateCollection' })).toBe(true);
    expect(isCollectionMsg({ typeUrl: 'tokenization.MsgUpdateCollection' })).toBe(true);
  });

  it('REJECTS foreign-module typeUrls that share the suffix (security regression)', () => {
    // Caught in round 4 sweep. Without the namespace check, ANY module
    // with a MsgCreateCollection / MsgUpdateCollection / MsgUniversalUpdateCollection
    // would silently get rewritten as a tokenization message.
    expect(isCollectionMsg({ typeUrl: '/myext.MsgCreateCollection' })).toBe(false);
    expect(isCollectionMsg({ typeUrl: '/somethingelse.MsgUpdateCollection' })).toBe(false);
    expect(isCollectionMsg({ typeUrl: '/totally.fake.MsgUniversalUpdateCollection' })).toBe(false);
  });

  it('trims whitespace before matching (stdin-pipe regression)', () => {
    // Caught in round 4 sweep. JSON files with trailing newlines or
    // stdin pipes leave whitespace on string fields; without trimming
    // the whole coercion path was silently bypassed.
    expect(isCollectionMsg({ typeUrl: ' /tokenization.MsgCreateCollection ' })).toBe(true);
    expect(isCollectionMsg({ typeUrl: '/tokenization.MsgCreateCollection\n' })).toBe(true);
    expect(isCollectionMsg({ typeUrl: '\t/tokenization.MsgUpdateCollection' })).toBe(true);
  });
});

describe('normalizeToCreateOrUpdate', () => {
  const baseUniversalValue = () => ({
    creator: 'bb1abc',
    collectionId: '0',
    defaultBalances: { autoApproveAllIncomingTransfers: true },
    invariants: { maxSupplyPerId: '1' },
    updateValidTokenIds: true,
    validTokenIds: [{ start: '1', end: '1' }],
    updateCollectionPermissions: true,
    collectionPermissions: {},
    updateManager: true,
    manager: 'bb1abc',
    updateCollectionMetadata: true,
    collectionMetadata: { uri: 'ipfs://METADATA_COLLECTION', customData: '' },
    updateTokenMetadata: true,
    tokenMetadata: [],
    updateCustomData: false,
    customData: '',
    updateCollectionApprovals: true,
    collectionApprovals: [],
    updateStandards: true,
    standards: [],
    updateIsArchived: false,
    isArchived: false
  });

  it('collectionId=="0" narrows to MsgCreateCollection and strips flags + collectionId', () => {
    const msg = { typeUrl: UNIVERSAL, value: baseUniversalValue() };
    const out = normalizeToCreateOrUpdate(msg);

    expect(out.typeUrl).toBe(CREATE);
    expect(out.value.collectionId).toBeUndefined();
    for (const flag of UPDATE_FLAGS) {
      expect(out.value).not.toHaveProperty(flag);
    }
    // Keeps defaultBalances + invariants (create-only fields).
    expect(out.value.defaultBalances).toEqual({ autoApproveAllIncomingTransfers: true });
    expect(out.value.invariants).toEqual({ maxSupplyPerId: '1' });
    // Preserves the rest.
    expect(out.value.creator).toBe('bb1abc');
    expect(out.value.collectionMetadata.uri).toBe('ipfs://METADATA_COLLECTION');
  });

  it('missing collectionId is treated as a new collection (Create)', () => {
    const value = baseUniversalValue();
    delete (value as any).collectionId;
    const out = normalizeToCreateOrUpdate({ typeUrl: UNIVERSAL, value });
    expect(out.typeUrl).toBe(CREATE);
  });

  it('non-zero collectionId narrows to MsgUpdateCollection and strips defaultBalances + invariants', () => {
    const value = { ...baseUniversalValue(), collectionId: '42' };
    const out = normalizeToCreateOrUpdate({ typeUrl: UNIVERSAL, value });

    expect(out.typeUrl).toBe(UPDATE);
    expect(out.value.collectionId).toBe('42');
    // Update must not carry these.
    expect(out.value.defaultBalances).toBeUndefined();
    expect(out.value.invariants).toBeUndefined();
    // Flags preserved so the chain knows what to mutate.
    expect(out.value.updateValidTokenIds).toBe(true);
    expect(out.value.updateCollectionMetadata).toBe(true);
  });

  it('does not mutate the input object', () => {
    const msg = { typeUrl: UNIVERSAL, value: baseUniversalValue() };
    const snapshot = JSON.stringify(msg);
    normalizeToCreateOrUpdate(msg);
    expect(JSON.stringify(msg)).toBe(snapshot);
  });

  it('passes Create and Update msgs through unchanged', () => {
    const create = { typeUrl: CREATE, value: { creator: 'bb1abc' } };
    const update = { typeUrl: UPDATE, value: { creator: 'bb1abc', collectionId: '5' } };
    expect(normalizeToCreateOrUpdate(create)).toEqual(create);
    expect(normalizeToCreateOrUpdate(update)).toEqual(update);
  });

  it('leaves non-collection msgs untouched', () => {
    const transfer = { typeUrl: TRANSFER, value: { creator: 'bb1abc', transfers: [] } };
    expect(normalizeToCreateOrUpdate(transfer)).toEqual(transfer);
  });

  it('handles null / undefined / non-object gracefully', () => {
    expect(normalizeToCreateOrUpdate(null)).toBe(null);
    expect(normalizeToCreateOrUpdate(undefined)).toBe(undefined);
    expect(normalizeToCreateOrUpdate('string' as any)).toBe('string');
  });

  it('treats empty-string and whitespace collectionId as new (Create)', () => {
    // Round 4 regression: '' and '  0  ' used to fall into the Update
    // branch, producing a useless `collectionId: ''` that the chain
    // would reject with a confusing error.
    const base = {
      typeUrl: UNIVERSAL,
      value: { creator: 'bb1abc', collectionId: '', defaultBalances: { x: 1 } }
    };
    expect(normalizeToCreateOrUpdate(base).typeUrl).toBe(CREATE);

    const ws = {
      typeUrl: UNIVERSAL,
      value: { creator: 'bb1abc', collectionId: '   0   ', defaultBalances: { x: 1 } }
    };
    expect(normalizeToCreateOrUpdate(ws).typeUrl).toBe(CREATE);
  });

  it('coerces numeric collectionId to string and routes correctly', () => {
    // Round 4 regression: number 0 was treated as Update, number 5 was
    // emitted as a number (downstream proto encoders expect strings).
    const newColl = { typeUrl: UNIVERSAL, value: { creator: 'bb1abc', collectionId: 0, defaultBalances: { x: 1 } } };
    expect(normalizeToCreateOrUpdate(newColl).typeUrl).toBe(CREATE);

    const existing = { typeUrl: UNIVERSAL, value: { creator: 'bb1abc', collectionId: 5 } };
    const out = normalizeToCreateOrUpdate(existing);
    expect(out.typeUrl).toBe(UPDATE);
    expect(out.value.collectionId).toBe('5');
    expect(typeof out.value.collectionId).toBe('string');
  });

  it('REJECTS foreign-module Universal typeUrls (security regression)', () => {
    const foreign = {
      typeUrl: '/myext.MsgUniversalUpdateCollection',
      value: { creator: 'bb1abc', collectionId: '0' }
    };
    // Should pass through unchanged (not normalize foreign messages).
    expect(normalizeToCreateOrUpdate(foreign).typeUrl).toBe('/myext.MsgUniversalUpdateCollection');
  });
});

describe('coerceToUniversal', () => {
  it('Create → Universal fills in collectionId="0" and sets every update flag to true', () => {
    const create = {
      typeUrl: CREATE,
      value: { creator: 'bb1abc', defaultBalances: { autoApproveAllIncomingTransfers: true } }
    };
    const out = coerceToUniversal(create);
    expect(out.typeUrl).toBe(UNIVERSAL);
    expect(out.value.collectionId).toBe('0');
    for (const flag of UPDATE_FLAGS) {
      expect(out.value[flag]).toBe(true);
    }
    expect(out.value.defaultBalances).toEqual({ autoApproveAllIncomingTransfers: true });
  });

  it('Update → Universal rewrites typeUrl but preserves fields', () => {
    const update = {
      typeUrl: UPDATE,
      value: {
        creator: 'bb1abc',
        collectionId: '42',
        updateManager: true,
        manager: 'bb1new'
      }
    };
    const out = coerceToUniversal(update);
    expect(out.typeUrl).toBe(UNIVERSAL);
    expect(out.value.collectionId).toBe('42');
    expect(out.value.manager).toBe('bb1new');
  });

  it('Universal → Universal is a no-op', () => {
    const msg = { typeUrl: UNIVERSAL, value: { creator: 'bb1abc', collectionId: '0' } };
    expect(coerceToUniversal(msg).typeUrl).toBe(UNIVERSAL);
  });

  it('leaves non-collection msgs alone', () => {
    const transfer = { typeUrl: TRANSFER, value: {} };
    expect(coerceToUniversal(transfer)).toEqual(transfer);
  });
});

describe('normalizeTxMessages', () => {
  it('normalizes every collection msg in a tx body, leaves transfers alone', () => {
    const tx = {
      messages: [
        { typeUrl: UNIVERSAL, value: { creator: 'bb1abc', collectionId: '0', defaultBalances: {} } },
        { typeUrl: TRANSFER, value: { creator: 'bb1abc', transfers: [] } }
      ]
    };
    const out = normalizeTxMessages(tx);
    expect(out.messages[0].typeUrl).toBe(CREATE);
    expect(out.messages[1].typeUrl).toBe(TRANSFER);
  });

  it('handles [Create, Transfer, Transfer] auto-mint shape — Create untouched, transfers untouched', () => {
    const tx = {
      messages: [
        { typeUrl: CREATE, value: { creator: 'bb1abc' } },
        { typeUrl: TRANSFER, value: { creator: 'bb1abc', transfers: [] } },
        { typeUrl: TRANSFER, value: { creator: 'bb1abc', transfers: [] } }
      ]
    };
    const out = normalizeTxMessages(tx);
    expect(out.messages.map((m: any) => m.typeUrl)).toEqual([CREATE, TRANSFER, TRANSFER]);
  });

  it('returns tx unchanged if messages array is missing', () => {
    expect(normalizeTxMessages({} as any)).toEqual({});
  });
});
