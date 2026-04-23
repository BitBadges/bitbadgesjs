/**
 * Covers the placeholder-art post-step that replaced the old default-
 * logo fallback. When the LLM leaves IMAGE_N strings unresolved, we
 * now generate one piece of art (seeded by the collection name) and
 * reuse it for every placeholder. Real URIs (http/https/ipfs/data)
 * are never touched.
 */

import { handleGetTransaction } from './getTransaction.js';
import {
  resetAllSessions,
  getOrCreateSession,
  setCollectionMetadata,
  setTokenMetadata
} from '../../session/sessionState.js';

function placeholdersOf(transaction: any): Record<string, any> {
  return transaction?.messages?.[0]?.value?._meta?.metadataPlaceholders ?? {};
}

function firstImage(transaction: any): string | undefined {
  const ph = placeholdersOf(transaction);
  for (const entry of Object.values(ph)) {
    const img = (entry as any)?.image;
    if (typeof img === 'string') return img;
  }
  return undefined;
}

function setupSession(sid: string, collectionName = 'Test Collection', image = 'IMAGE_1') {
  getOrCreateSession(sid, 'bb1test');
  setCollectionMetadata(sid, collectionName, 'Test description.', image);
}

describe('handleGetTransaction — placeholder-art post-step', () => {
  beforeEach(() => resetAllSessions());

  it('replaces an unresolved IMAGE_N on the collection with a generated data URI', () => {
    setupSession('ses_t1', 'Cosmic Pass', 'IMAGE_1');
    const { transaction } = handleGetTransaction({ sessionId: 'ses_t1', creatorAddress: 'bb1test' });
    const img = firstImage(transaction);
    expect(typeof img).toBe('string');
    expect(img!.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('never overwrites an already-resolved ipfs:// image', () => {
    const realUri = 'ipfs://QmRealImage123';
    setupSession('ses_t2', 'Already Uploaded', realUri);
    const { transaction } = handleGetTransaction({ sessionId: 'ses_t2', creatorAddress: 'bb1test' });
    expect(firstImage(transaction)).toBe(realUri);
  });

  it('never overwrites an already-resolved https:// image', () => {
    const realUri = 'https://example.com/image.png';
    setupSession('ses_t3', 'Uploaded Web', realUri);
    const { transaction } = handleGetTransaction({ sessionId: 'ses_t3', creatorAddress: 'bb1test' });
    expect(firstImage(transaction)).toBe(realUri);
  });

  it('never overwrites a pre-baked data: URI (e.g. LLM called generate_placeholder_art itself)', () => {
    const preBaked =
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
    setupSession('ses_t4', 'Pre-Baked', preBaked);
    const { transaction } = handleGetTransaction({ sessionId: 'ses_t4', creatorAddress: 'bb1test' });
    expect(firstImage(transaction)).toBe(preBaked);
  });

  it('uses ONE generated art URI for every unresolved IMAGE_N in the transaction', () => {
    const sid = 'ses_t5';
    getOrCreateSession(sid, 'bb1test');
    setCollectionMetadata(sid, 'Shared Art Collection', 'desc.', 'IMAGE_1');
    setTokenMetadata(sid, [{ start: '1', end: '5' }], 'Token A', 'desc.', 'IMAGE_2');
    setTokenMetadata(sid, [{ start: '6', end: '10' }], 'Token B', 'desc.', 'IMAGE_3');

    const { transaction } = handleGetTransaction({ sessionId: sid, creatorAddress: 'bb1test' });
    const uris = Object.values(placeholdersOf(transaction))
      .map((p: any) => p?.image)
      .filter((v: any): v is string => typeof v === 'string');

    expect(uris.length).toBeGreaterThanOrEqual(3); // 1 collection + 2 token metadata rows
    for (const uri of uris) {
      expect(uri.startsWith('data:image/svg+xml;base64,')).toBe(true);
    }
    // Generated ONCE, reused across collection + all tokens.
    expect(new Set(uris).size).toBe(1);
  });

  it('never emits the old BitBadges default logo', () => {
    setupSession('ses_t6', 'Should Not Use Logo', 'IMAGE_1');
    const { transaction } = handleGetTransaction({ sessionId: 'ses_t6', creatorAddress: 'bb1test' });
    expect(JSON.stringify(transaction)).not.toContain('QmNTpizCkY5tcMpPMf1kkn7Y5YxFQo3oT54A9oKP5ijP9E');
  });

  it('seeds art generation with the collection name — same name → same art across calls', () => {
    setupSession('ses_t7a', 'Identical Name', 'IMAGE_1');
    setupSession('ses_t7b', 'Identical Name', 'IMAGE_1');
    const r1 = handleGetTransaction({ sessionId: 'ses_t7a', creatorAddress: 'bb1test' });
    const r2 = handleGetTransaction({ sessionId: 'ses_t7b', creatorAddress: 'bb1test' });
    const img1 = firstImage(r1.transaction);
    const img2 = firstImage(r2.transaction);
    expect(img1).toBeDefined();
    expect(img1).toBe(img2);
    expect(img1!.startsWith('data:')).toBe(true);
  });

  it('different collection names → different art', () => {
    setupSession('ses_t7c', 'First Collection', 'IMAGE_1');
    setupSession('ses_t7d', 'Second Collection', 'IMAGE_1');
    const r1 = handleGetTransaction({ sessionId: 'ses_t7c', creatorAddress: 'bb1test' });
    const r2 = handleGetTransaction({ sessionId: 'ses_t7d', creatorAddress: 'bb1test' });
    expect(firstImage(r1.transaction)).not.toBe(firstImage(r2.transaction));
  });

  it('no-op when there are no IMAGE_N strings to fill', () => {
    setupSession('ses_t8', 'All Real', 'https://example.com/x.png');
    const { transaction } = handleGetTransaction({ sessionId: 'ses_t8', creatorAddress: 'bb1test' });
    const stringified = JSON.stringify(transaction);
    expect(stringified).not.toMatch(/"IMAGE_\d+"/);
    expect(stringified).not.toContain('data:image/svg+xml;base64');
  });

  // ---------- B: defensive scrub of the legacy default logo --------
  it('scrubs the legacy BitBadges default-logo URI even when LLM wrote it directly', () => {
    const legacyLogo = 'ipfs://QmNTpizCkY5tcMpPMf1kkn7Y5YxFQo3oT54A9oKP5ijP9E';
    setupSession('ses_t9', 'Prompt Cache Residue', legacyLogo);
    const { transaction } = handleGetTransaction({ sessionId: 'ses_t9', creatorAddress: 'bb1test' });
    const img = firstImage(transaction);
    expect(img).not.toBe(legacyLogo);
    expect(img!.startsWith('data:image/svg+xml;base64,')).toBe(true);
    expect(JSON.stringify(transaction)).not.toContain('QmNTpizCkY5tcMpPMf1kkn7Y5YxFQo3oT54A9oKP5ijP9E');
  });

  // ---------- C: fill empty-string images on non-approval sidecar --
  it('fills empty-string images on non-approval sidecar entries with generated art', () => {
    const sid = 'ses_t10';
    getOrCreateSession(sid, 'bb1test');
    setCollectionMetadata(sid, 'Empty Image Collection', 'desc.', '');
    const { transaction } = handleGetTransaction({ sessionId: sid, creatorAddress: 'bb1test' });
    const placeholders = placeholdersOf(transaction);
    // Collection entry should have been filled.
    const nonEmptyImages = Object.values(placeholders)
      .map((p: any) => p?.image)
      .filter((v) => typeof v === 'string' && v.length > 0);
    expect(nonEmptyImages.length).toBeGreaterThan(0);
    expect(nonEmptyImages[0].startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('leaves APPROVAL sidecar entries with empty image untouched', () => {
    const sid = 'ses_t11';
    getOrCreateSession(sid, 'bb1test');
    setCollectionMetadata(sid, 'Approval Leaves Alone', 'desc.', 'IMAGE_1');
    // Simulate an approval placeholder that the builder would write —
    // convention is `ipfs://METADATA_APPROVAL_<id>` with image="" by
    // protocol rule. We inject one directly into the session's msg
    // body to exercise the code path.
    const raw = require('../../session/sessionState.js').getTransaction(sid, 'bb1test');
    const body = raw.messages[0].value;
    body._meta = body._meta || { metadataPlaceholders: {} };
    body._meta.metadataPlaceholders['ipfs://METADATA_APPROVAL_demo1'] = {
      name: 'Demo Approval',
      description: 'Demo approval description.',
      image: ''
    };
    const { transaction } = handleGetTransaction({ sessionId: sid, creatorAddress: 'bb1test' });
    const placeholders = placeholdersOf(transaction);
    // Approval entry's empty image survives untouched.
    const approvalImg = placeholders['ipfs://METADATA_APPROVAL_demo1']?.image;
    expect(approvalImg).toBe('');
    // But the collection's unresolved IMAGE_1 still got filled.
    const colImg = placeholders['ipfs://METADATA_COLLECTION']?.image;
    expect(colImg?.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('one piece of art is reused even when the fills cross both passes (IMAGE_N + empty-string)', () => {
    const sid = 'ses_t12';
    getOrCreateSession(sid, 'bb1test');
    setCollectionMetadata(sid, 'Mixed Fill', 'desc.', 'IMAGE_1');
    setTokenMetadata(sid, [{ start: '1', end: '3' }], 'Token', 'desc.', '');
    const { transaction } = handleGetTransaction({ sessionId: sid, creatorAddress: 'bb1test' });
    const placeholders = placeholdersOf(transaction);
    const imgs = Object.values(placeholders)
      .map((p: any) => p?.image)
      .filter((v: any): v is string => typeof v === 'string' && v.length > 0);
    expect(imgs.length).toBeGreaterThanOrEqual(2);
    expect(new Set(imgs).size).toBe(1); // same art across both fills
  });
});
