/**
 * Browser handoff for the dev-first builder: a tool (CLI, MCP, agent) builds
 * the transaction; bitbadges.io only reviews + signs it. Two carriers the
 * frontend accepts on /mint/local-builder and /update/local-builder/:id:
 *   - `#tx=<base64url JSON>` hash  (offline, client-side only)
 *   - `?code=prv_xxxxxxxx`          (short link via the preview endpoint)
 */
import { buildHandoffUrl, buildReviewUrlFromCode, detectExistingCollectionId, encodeTxForHash } from './handoff.js';

const createTx = { messages: [{ typeUrl: '/tokenization.MsgCreateCollection', value: { collectionId: '0', name: 'Café ☕' } }] };
const updateTx = { messages: [{ typeUrl: '/tokenization.MsgUpdateCollection', value: { collectionId: '42' } }] };

describe('encodeTxForHash', () => {
  it('emits base64url (no + / =) that the frontend decodes back to the same JSON', () => {
    const encoded = encodeTxForHash(createTx);
    expect(encoded).not.toMatch(/[+/=]/);
    const decoded = JSON.parse(Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    expect(decoded).toEqual(createTx);
  });
});

describe('detectExistingCollectionId', () => {
  it('returns the collectionId of an update, and undefined for creates / non-collection msgs', () => {
    expect(detectExistingCollectionId(updateTx)).toBe('42');
    expect(detectExistingCollectionId(createTx)).toBeUndefined();
    expect(detectExistingCollectionId({ messages: [{ typeUrl: '/tokenization.MsgUniversalUpdateCollection', value: { collectionId: 7 } }] })).toBe(
      '7'
    );
    expect(detectExistingCollectionId({ messages: [{ typeUrl: '/cosmos.bank.v1beta1.MsgSend', value: { collectionId: '9' } }] })).toBeUndefined();
    expect(detectExistingCollectionId({ messages: [] })).toBeUndefined();
  });
});

describe('buildHandoffUrl', () => {
  it('routes creates to /mint/local-builder and updates to /update/local-builder/:id, trimming trailing slashes', () => {
    expect(buildHandoffUrl('https://bitbadges.io/', createTx)).toBe(`https://bitbadges.io/mint/local-builder#tx=${encodeTxForHash(createTx)}`);
    expect(buildHandoffUrl('https://testnet.bitbadges.io', updateTx)).toBe(
      `https://testnet.bitbadges.io/update/local-builder/42#tx=${encodeTxForHash(updateTx)}`
    );
  });
});

describe('buildReviewUrlFromCode', () => {
  it('builds the short-link form with the same routing', () => {
    expect(buildReviewUrlFromCode('https://bitbadges.io', 'prv_a1b2c3d4', createTx)).toBe(
      'https://bitbadges.io/mint/local-builder?code=prv_a1b2c3d4'
    );
    expect(buildReviewUrlFromCode('https://bitbadges.io', 'prv_a1b2c3d4', updateTx)).toBe(
      'https://bitbadges.io/update/local-builder/42?code=prv_a1b2c3d4'
    );
  });
});
