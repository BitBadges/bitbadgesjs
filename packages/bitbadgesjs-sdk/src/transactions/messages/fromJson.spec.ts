/**
 * Tests for the top-level JSON → proto dispatcher used by the indexer's
 * simulate endpoint JSON fast path. We verify:
 *   - Every tokenization typeUrl round-trips into a proto Message with
 *     non-empty `toBinary()` output (sanity — the wrapper class accepted
 *     the JSON and serialized something non-trivial).
 *   - Cosmos baseline tier (bank/staking/distribution/ibc/authz) dispatches.
 *   - Unsupported typeUrls throw `UnsupportedMessageTypeError` with the
 *     typeUrl exposed on the error.
 *   - `{ typeUrl, value }` and `{ "@type", ...fields }` shapes both work.
 *   - `encodeMsgsFromJson` batch helper walks arrays.
 */

import {
  encodeMsgFromJson,
  encodeMsgsFromJson,
  supportedJsonTypeUrls,
  UnsupportedMessageTypeError
} from './fromJson.js';
import {
  encodeTokenizationMsgFromJson,
  supportedTokenizationTypeUrls
} from './bitbadges/tokenization/fromJson.js';

// Minimal valid-enough values per tokenization msg type. These don't need
// to be chain-valid — they just need to satisfy the wrapper-class
// constructors so `.toProto()` succeeds.
const TOKENIZATION_FIXTURES: Record<string, any> = {
  '/tokenization.MsgCreateCollection': { creator: 'bb1abc' },
  '/tokenization.MsgUpdateCollection': { creator: 'bb1abc', collectionId: '42' },
  '/tokenization.MsgUniversalUpdateCollection': { creator: 'bb1abc', collectionId: '0' },
  '/tokenization.MsgDeleteCollection': { creator: 'bb1abc', collectionId: '42' },
  '/tokenization.MsgTransferTokens': { creator: 'bb1abc', collectionId: '42', transfers: [] },
  '/tokenization.MsgCreateAddressLists': { creator: 'bb1abc', addressLists: [] },
  '/tokenization.MsgUpdateUserApprovals': { creator: 'bb1abc', collectionId: '42' },
  '/tokenization.MsgSetIncomingApproval': {
    creator: 'bb1abc',
    collectionId: '42',
    approval: {
      approvalId: 'test',
      fromListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [{ start: '1', end: '18446744073709551615' }],
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: [{ start: '1', end: '18446744073709551615' }]
    }
  },
  '/tokenization.MsgDeleteIncomingApproval': { creator: 'bb1abc', collectionId: '42', approvalId: 'test' },
  '/tokenization.MsgSetOutgoingApproval': {
    creator: 'bb1abc',
    collectionId: '42',
    approval: {
      approvalId: 'test',
      toListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [{ start: '1', end: '18446744073709551615' }],
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: [{ start: '1', end: '18446744073709551615' }]
    }
  },
  '/tokenization.MsgDeleteOutgoingApproval': { creator: 'bb1abc', collectionId: '42', approvalId: 'test' },
  '/tokenization.MsgPurgeApprovals': { creator: 'bb1abc', collectionId: '42', purgeExpired: true },
  '/tokenization.MsgCreateDynamicStore': { creator: 'bb1abc' },
  '/tokenization.MsgUpdateDynamicStore': { creator: 'bb1abc', storeId: '1' },
  '/tokenization.MsgDeleteDynamicStore': { creator: 'bb1abc', storeId: '1' },
  '/tokenization.MsgSetDynamicStoreValue': { creator: 'bb1abc', storeId: '1', address: 'bb1abc', value: true },
  '/tokenization.MsgSetValidTokenIds': { creator: 'bb1abc', collectionId: '42' },
  '/tokenization.MsgSetManager': { creator: 'bb1abc', collectionId: '42', manager: 'bb1new' },
  '/tokenization.MsgSetCollectionMetadata': {
    creator: 'bb1abc',
    collectionId: '42',
    collectionMetadata: { uri: 'ipfs://test', customData: '' }
  },
  '/tokenization.MsgSetTokenMetadata': { creator: 'bb1abc', collectionId: '42', tokenMetadata: [] },
  '/tokenization.MsgSetCustomData': { creator: 'bb1abc', collectionId: '42', customData: 'hello' },
  '/tokenization.MsgSetStandards': { creator: 'bb1abc', collectionId: '42', standards: [] },
  '/tokenization.MsgSetCollectionApprovals': { creator: 'bb1abc', collectionId: '42', collectionApprovals: [] },
  '/tokenization.MsgSetIsArchived': { creator: 'bb1abc', collectionId: '42', isArchived: false },
  '/tokenization.MsgCastVote': {
    creator: 'bb1abc',
    collectionId: '42',
    approvalLevel: 'collection',
    approverAddress: '',
    approvalId: 'test',
    proposalId: 'prop1',
    yesWeight: '1'
  }
};

describe('encodeTokenizationMsgFromJson — tokenization tier', () => {
  it('covers every typeUrl exported from supportedTokenizationTypeUrls()', () => {
    const exported = supportedTokenizationTypeUrls().sort();
    const fixtured = Object.keys(TOKENIZATION_FIXTURES).sort();
    expect(fixtured).toEqual(exported);
  });

  it.each(Object.entries(TOKENIZATION_FIXTURES))(
    'round-trips %s to a non-empty proto binary',
    (typeUrl, value) => {
      const proto = encodeTokenizationMsgFromJson({ typeUrl, value });
      const bin = proto.toBinary();
      expect(bin).toBeInstanceOf(Uint8Array);
      // Every encoded Msg with a creator field is at least a few bytes.
      expect(bin.length).toBeGreaterThan(0);
    }
  );

  it('throws UnsupportedMessageTypeError for unknown tokenization typeUrls', () => {
    expect(() =>
      encodeTokenizationMsgFromJson({ typeUrl: '/tokenization.MsgTotallyFake', value: {} })
    ).toThrow(UnsupportedMessageTypeError);
  });

  it('surfaces the offending typeUrl on the error', () => {
    try {
      encodeTokenizationMsgFromJson({ typeUrl: '/tokenization.MsgFake', value: {} });
      fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(UnsupportedMessageTypeError);
      expect((err as UnsupportedMessageTypeError).typeUrl).toBe('/tokenization.MsgFake');
    }
  });
});

describe('encodeMsgFromJson — top-level dispatcher', () => {
  it('routes /tokenization.* through the tokenization tier', () => {
    const proto = encodeMsgFromJson({
      typeUrl: '/tokenization.MsgCreateCollection',
      value: { creator: 'bb1abc' }
    });
    expect(proto).toBeDefined();
    expect(proto.toBinary().length).toBeGreaterThan(0);
  });

  it('routes /cosmos.bank.v1beta1.MsgSend through the cosmos tier', () => {
    const proto = encodeMsgFromJson({
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: 'bb1abc',
        toAddress: 'bb1def',
        amount: [{ denom: 'ubadge', amount: '1000' }]
      }
    });
    expect(proto.toBinary().length).toBeGreaterThan(0);
  });

  it('handles staking MsgDelegate with BigInt amounts (coerced to string)', () => {
    const proto = encodeMsgFromJson({
      typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
      value: {
        delegatorAddress: 'bb1abc',
        validatorAddress: 'bbvaloper1xyz',
        amount: { amount: 1000000, denom: 'ubadge' }
      }
    });
    expect(proto.toBinary().length).toBeGreaterThan(0);
  });

  it('handles IBC MsgTransfer', () => {
    const proto = encodeMsgFromJson({
      typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
      value: {
        sourcePort: 'transfer',
        sourceChannel: 'channel-0',
        token: { amount: '1000', denom: 'ubadge' },
        sender: 'bb1abc',
        receiver: 'cosmos1def',
        timeoutTimestamp: '9999999999999'
      }
    });
    expect(proto.toBinary().length).toBeGreaterThan(0);
  });

  it('accepts { "@type", ...fields } Amino-style shape', () => {
    const proto = encodeMsgFromJson({
      '@type': '/tokenization.MsgCreateCollection',
      creator: 'bb1abc'
    });
    expect(proto.toBinary().length).toBeGreaterThan(0);
  });

  it('throws UnsupportedMessageTypeError for cosmos modules we do not yet cover', () => {
    expect(() =>
      encodeMsgFromJson({ typeUrl: '/cosmos.gov.v1.MsgSubmitProposal', value: {} })
    ).toThrow(UnsupportedMessageTypeError);
  });

  it('throws for missing typeUrl', () => {
    expect(() => encodeMsgFromJson({ value: { creator: 'bb1abc' } })).toThrow(/missing "typeUrl"/);
  });

  it('throws for non-object input', () => {
    expect(() => encodeMsgFromJson(null as any)).toThrow(/must be an object/);
    expect(() => encodeMsgFromJson('string' as any)).toThrow(/must be an object/);
  });
});

describe('encodeMsgsFromJson — batch', () => {
  it('walks an array and returns one Message per input', () => {
    const msgs = [
      { typeUrl: '/tokenization.MsgCreateCollection', value: { creator: 'bb1abc' } },
      {
        typeUrl: '/tokenization.MsgTransferTokens',
        value: { creator: 'bb1abc', collectionId: '42', transfers: [] }
      }
    ];
    const protos = encodeMsgsFromJson(msgs);
    expect(protos).toHaveLength(2);
    expect(protos.every((p) => p.toBinary().length > 0)).toBe(true);
  });

  it('propagates UnsupportedMessageTypeError from any element', () => {
    const msgs = [
      { typeUrl: '/tokenization.MsgCreateCollection', value: { creator: 'bb1abc' } },
      { typeUrl: '/cosmos.gov.v1.MsgSubmitProposal', value: {} }
    ];
    expect(() => encodeMsgsFromJson(msgs)).toThrow(UnsupportedMessageTypeError);
  });
});

describe('supportedJsonTypeUrls', () => {
  it('includes the full tokenization tier plus the cosmos baseline', () => {
    const all = supportedJsonTypeUrls();
    // Tokenization tier present in full
    for (const t of supportedTokenizationTypeUrls()) {
      expect(all).toContain(t);
    }
    // A few cosmos baseline entries
    expect(all).toContain('/cosmos.bank.v1beta1.MsgSend');
    expect(all).toContain('/cosmos.staking.v1beta1.MsgDelegate');
    expect(all).toContain('/cosmos.authz.v1beta1.MsgExec');
    expect(all).toContain('/ibc.applications.transfer.v1.MsgTransfer');
  });

  it('the count reflects the advertised surface (25 tokenization + 8 cosmos baseline)', () => {
    expect(supportedTokenizationTypeUrls().length).toBe(25);
    // Cosmos tier: bank(1) + staking(3) + distribution(1) + authz(3) + ibc(1) = 9
    expect(supportedJsonTypeUrls().length).toBe(25 + 9);
  });
});
