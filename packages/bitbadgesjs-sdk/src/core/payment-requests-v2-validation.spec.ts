import { BitBadgesCollection } from '../api-indexer/BitBadgesCollection.js';
import { AddressList } from './addressLists.js';
import { MsgUniversalUpdateCollection } from '../transactions/messages/bitbadges/tokenization/msgUniversalUpdateCollection.js';
import { verifyStandardsCompliance } from '../api-indexer/verify-standards.js';
import { buildPaymentRequestV2, buildPaymentRequestV2PayMsg, validatePaymentRequestV2Collection } from './payment-requests-v2.js';
import chainFixture from './payment-requests-v2.chain-fixture.json';

function indexedCollection() {
  function enrich(value: any): any {
    if (Array.isArray(value)) return value.map(enrich);
    if (!value || typeof value !== 'object') return value;
    const result = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, enrich(entry)]));
    for (const list of ['fromList', 'toList', 'initiatedByList'])
      if (typeof value[`${list}Id`] === 'string') result[list] = AddressList.getReservedAddressList(value[`${list}Id`]);
    return result;
  }
  return new BitBadgesCollection({
    ...enrich(chainFixture),
    _docId: '1',
    createdBlock: '1',
    createdTimestamp: '1',
    updateHistory: [],
    activity: [],
    owners: [],
    challengeTrackers: [],
    approvalTrackers: [],
    listings: [],
    claims: [],
    views: {}
  }).convert(BigInt);
}
const terms = JSON.parse(chainFixture.customData).paymentRequest;
const obligation = terms.obligations[0];
const payer = obligation.payer.addresses[0];
const creation = () => buildPaymentRequestV2({ ...terms, uri: 'https://example.com/invoice.json' }).value;

describe('payment request collection boundaries', () => {
  it('binds the payment target to the actual indexed SDK collection', () => {
    const collection = indexedCollection();
    const id = String(collection.collectionId);
    expect(buildPaymentRequestV2PayMsg(payer, id, collection, obligation.id).value.collectionId).toBe(id);
    expect(() => buildPaymentRequestV2PayMsg(payer, String(collection.collectionId + 1n), collection, obligation.id)).toThrow(/collection.*ID/i);
  });
  it.each([undefined, '0', 0n, -1, '1.5', '01', Number.MAX_SAFE_INTEGER + 1, '18446744073709551616'])(
    'rejects an invalid source collection ID %s',
    (collectionId) => {
      expect(() => buildPaymentRequestV2PayMsg(payer, '1', { ...chainFixture, collectionId }, obligation.id)).toThrow();
    }
  );
  it.each(['1', 1, 1n])('accepts matching canonical collection ID %s', (collectionId) => {
    expect(buildPaymentRequestV2PayMsg(payer, '1', { ...chainFixture, collectionId }, obligation.id).value.collectionId).toBe('1');
  });
  it('preserves creation validation without an indexed ID but refuses payment from a draft', () => {
    const draft = creation();
    expect(validatePaymentRequestV2Collection(draft).valid).toBe(true);
    expect(() => buildPaymentRequestV2PayMsg(payer, '1', draft, obligation.id)).toThrow();
    const { collectionId, ...doc } = chainFixture;
    expect(validatePaymentRequestV2Collection(doc).valid).toBe(true);
  });
  it('rejects archived indexed SDK collections', () => {
    const collection = indexedCollection();
    collection.isArchived = true;
    expect(validatePaymentRequestV2Collection(collection).valid).toBe(false);
    expect(verifyStandardsCompliance(collection).valid).toBe(false);
    expect(() => buildPaymentRequestV2PayMsg(payer, String(collection.collectionId), collection, obligation.id)).toThrow();
  });
  it.each(['archive', 'escrow'])('rejects unsupported %s in a protobuf-round-tripped creation message', (field) => {
    const draft = creation();
    if (field === 'archive') draft.isArchived = true;
    else draft.mintEscrowCoinsToTransfer = [{ denom: 'ubadge', amount: '1' }];
    const message = MsgUniversalUpdateCollection.fromProto(new MsgUniversalUpdateCollection(draft).toProto(), BigInt);
    expect(validatePaymentRequestV2Collection(message).valid).toBe(false);
    expect(verifyStandardsCompliance(message).valid).toBe(false);
  });
});
