/**
 * Browser handoff for the dev-first builder.
 *
 * A tool (CLI, MCP client, programmatic agent) builds the transaction; the
 * bitbadges.io frontend only receives, reviews, and signs it. The frontend's
 * `/mint/local-builder` and `/update/local-builder/:id` pages accept two
 * carriers, both produced here:
 *
 *   - `#tx=<base64url JSON>` — offline, never leaves the browser.
 *   - `?code=prv_xxxxxxxx`   — short link backed by the indexer's
 *     `/api/v0/builder/preview` store (1 hour TTL).
 */

const COLLECTION_MSG_RE = /\.Msg(Universal)?(Create|Update)Collection$/;

function toBase64Url(json: string): string {
  return Buffer.from(json, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function encodeTxForHash(tx: object): string {
  return toBase64Url(JSON.stringify(tx));
}

/**
 * For update transactions, the collection being updated (so the frontend can
 * diff against on-chain state). `undefined` for creates and non-collection
 * messages.
 */
export function detectExistingCollectionId(tx: any): string | undefined {
  const msgs = Array.isArray(tx?.messages) ? tx.messages : [];
  for (const msg of msgs) {
    if (typeof msg?.typeUrl !== 'string' || !COLLECTION_MSG_RE.test(msg.typeUrl)) continue;
    const id = msg?.value?.collectionId;
    const s = id === undefined || id === null ? '' : String(id);
    if (s && s !== '0') return s;
  }
  return undefined;
}

function reviewPath(tx: any): string {
  const existing = detectExistingCollectionId(tx);
  return existing ? `/update/local-builder/${existing}` : '/mint/local-builder';
}

function trimBase(frontendBase: string): string {
  return frontendBase.replace(/\/+$/, '');
}

/** Review-and-sign URL carrying the whole transaction in the URL hash. */
export function buildHandoffUrl(frontendBase: string, tx: any): string {
  return `${trimBase(frontendBase)}${reviewPath(tx)}#tx=${encodeTxForHash(tx)}`;
}

/** Review-and-sign URL for a `prv_` code from the preview endpoint. */
export function buildReviewUrlFromCode(frontendBase: string, code: string, tx: any): string {
  return `${trimBase(frontendBase)}${reviewPath(tx)}?code=${encodeURIComponent(code)}`;
}

/** Read-only preview URL (no signing) for a `prv_` code. */
export function buildPreviewUrlFromCode(frontendBase: string, code: string): string {
  return `${trimBase(frontendBase)}/builder/preview?code=${encodeURIComponent(code)}`;
}
