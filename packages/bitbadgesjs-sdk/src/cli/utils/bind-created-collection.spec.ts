import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  bindPlaceholderCollectionIdInJsonFile,
  bindPlaceholderCollectionIdInValue,
  bundleNeedsCreatedCollectionBind,
  createdCollectionIdFromEvents,
  isPlaceholderCollectionId,
  messageCreatesCollection,
  messageReferencesPlaceholderCollection
} from './bind-created-collection.js';

const CREATE = {
  typeUrl: '/tokenization.MsgCreateCollection',
  value: { creator: 'bb1alice' }
};

const TRANSFER_ZERO = {
  typeUrl: '/tokenization.MsgTransferTokens',
  value: { creator: 'bb1alice', collectionId: '0', transfers: [] }
};

const TRANSFER_SEVEN = {
  typeUrl: '/tokenization.MsgTransferTokens',
  value: { creator: 'bb1alice', collectionId: '7', transfers: [] }
};

describe('isPlaceholderCollectionId', () => {
  it('accepts the string, number, and bigint shapes the SDK uses', () => {
    expect(isPlaceholderCollectionId('0')).toBe(true);
    expect(isPlaceholderCollectionId(0)).toBe(true);
    expect(isPlaceholderCollectionId(0n)).toBe(true);
    expect(isPlaceholderCollectionId(' 0 ')).toBe(true);
    expect(isPlaceholderCollectionId('7')).toBe(false);
    expect(isPlaceholderCollectionId(7)).toBe(false);
    expect(isPlaceholderCollectionId(undefined)).toBe(false);
    expect(isPlaceholderCollectionId(undefined, true)).toBe(true);
  });
});

describe('bundleNeedsCreatedCollectionBind', () => {
  it('is true for create-collection followed by a transfer with collectionId "0"', () => {
    // When --with-keyring splits the bundle into sequential txs, "0" on
    // follow-up messages would resolve to the newest collection globally
    // rather than the one created in the first transaction.
    expect(bundleNeedsCreatedCollectionBind([CREATE, TRANSFER_ZERO])).toBe(true);
  });

  it('is true when the create is a universal-update with collectionId 0', () => {
    expect(
      bundleNeedsCreatedCollectionBind([
        { typeUrl: '/tokenization.MsgUniversalUpdateCollection', value: { collectionId: '0' } },
        TRANSFER_ZERO
      ])
    ).toBe(true);
  });

  it('is false when the later transfer already names a real collection', () => {
    expect(bundleNeedsCreatedCollectionBind([CREATE, TRANSFER_SEVEN])).toBe(false);
  });

  it('is false for a transfer-only bundle that uses "0" with no create', () => {
    expect(bundleNeedsCreatedCollectionBind([TRANSFER_ZERO])).toBe(false);
  });

  it('is false for a bounty accept (vote + transfer) with an explicit collection id', () => {
    expect(
      bundleNeedsCreatedCollectionBind([
        {
          typeUrl: '/tokenization.MsgCastVote',
          value: { collection_id: '7', approval_id: 'accept' }
        },
        TRANSFER_SEVEN
      ])
    ).toBe(false);
  });

  it('is true when a later MsgUpdateCollection uses collectionId 0 after a create', () => {
    expect(
      bundleNeedsCreatedCollectionBind([
        CREATE,
        { typeUrl: '/tokenization.MsgUpdateCollection', value: { collectionId: '0' } }
      ])
    ).toBe(true);
  });

  it('is true when a later update-user-approvals uses collectionId 0 after a create', () => {
    expect(
      bundleNeedsCreatedCollectionBind([
        CREATE,
        { typeUrl: '/tokenization.MsgUpdateUserApprovals', value: { collectionId: 0 } }
      ])
    ).toBe(true);
  });
});

describe('messageCreatesCollection / messageReferencesPlaceholderCollection', () => {
  it('treats MsgCreateCollection as a create and MsgTransferTokens with "0" as a reference', () => {
    expect(messageCreatesCollection(CREATE.typeUrl, CREATE.value)).toBe(true);
    expect(messageReferencesPlaceholderCollection(TRANSFER_ZERO.typeUrl, TRANSFER_ZERO.value)).toBe(true);
    expect(messageReferencesPlaceholderCollection(TRANSFER_SEVEN.typeUrl, TRANSFER_SEVEN.value)).toBe(false);
  });
});

describe('bindPlaceholderCollectionIdInValue', () => {
  it('rewrites collectionId "0" and leaves an explicit id alone', () => {
    const zero: Record<string, unknown> = { collectionId: '0', transfers: [] };
    expect(bindPlaceholderCollectionIdInValue(zero, '42')).toBe(true);
    expect(zero.collectionId).toBe('42');

    const explicit: Record<string, unknown> = { collectionId: '7', transfers: [] };
    expect(bindPlaceholderCollectionIdInValue(explicit, '42')).toBe(false);
    expect(explicit.collectionId).toBe('7');
  });

  it('rewrites snake_case collection_id placeholders used by positional msgs', () => {
    const vote: Record<string, unknown> = { collection_id: '0', approval_id: 'accept' };
    expect(bindPlaceholderCollectionIdInValue(vote, '99')).toBe(true);
    expect(vote.collection_id).toBe('99');
  });
});

describe('bindPlaceholderCollectionIdInJsonFile', () => {
  it('rewrites a transfer msg file in place and is a no-op when the id is already set', () => {
    const file = path.join(os.tmpdir(), `bb-bind-test-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify({ collectionId: '0', transfers: [] }, null, 2) + '\n');
    expect(bindPlaceholderCollectionIdInJsonFile(file, '42')).toBe(true);
    expect(JSON.parse(fs.readFileSync(file, 'utf-8'))).toEqual({ collectionId: '42', transfers: [] });
    expect(bindPlaceholderCollectionIdInJsonFile(file, '99')).toBe(false);
    expect(JSON.parse(fs.readFileSync(file, 'utf-8')).collectionId).toBe('42');
    fs.unlinkSync(file);
  });
});

describe('createdCollectionIdFromEvents', () => {
  it('reads collectionId from a universal_update_collection event and skips "0"', () => {
    const events = [
      {
        type: 'message',
        attributes: [
          { key: 'msg_type', value: 'universal_update_collection' },
          { key: 'collectionId', value: '0' }
        ]
      },
      {
        type: 'message',
        attributes: [
          { key: 'msg_type', value: 'universal_update_collection' },
          { key: 'collectionId', value: '42' }
        ]
      }
    ];
    expect(createdCollectionIdFromEvents(events)).toBe('42');
  });

  it('returns undefined when no non-zero collectionId is present', () => {
    expect(createdCollectionIdFromEvents(undefined)).toBeUndefined();
    expect(
      createdCollectionIdFromEvents([{ type: 'message', attributes: [{ key: 'collectionId', value: '0' }] }])
    ).toBeUndefined();
  });

  it('strips legacy quoted attribute keys and values', () => {
    expect(
      createdCollectionIdFromEvents([
        { type: 'message', attributes: [{ key: '"collectionId"', value: '"13"' }] }
      ])
    ).toBe('13');
  });
});
