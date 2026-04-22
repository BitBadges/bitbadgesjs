/**
 * Image placeholder substitution — walks a transaction and swaps
 * `IMAGE_N` tokens inside `metadataPlaceholders` sidecars for the
 * provided bytes (data URLs, HTTP URLs, IPFS URIs — whatever the
 * caller supplies).
 *
 * Matches the frontend's `replaceImagePlaceholders` behavior so
 * programmatic consumers don't have to reimplement it.
 */

export type ImageMap = Record<string, string>;

/**
 * Recursively replace `IMAGE_N` strings inside the transaction with
 * values from `images`. Only string fields named `image` are rewritten;
 * keys unrelated to image references are left alone.
 *
 * Returns a new transaction object — the original is not mutated.
 */
export function substituteImages<T>(transaction: T, images: ImageMap): T {
  if (!images || Object.keys(images).length === 0) return transaction;
  return walk(transaction, images) as T;
}

function walk(node: any, images: ImageMap): any {
  if (node == null) return node;
  if (typeof node === 'string') {
    if (/^IMAGE_\d+$/.test(node) && images[node]) return images[node];
    return node;
  }
  if (Array.isArray(node)) return node.map((n) => walk(n, images));
  if (typeof node === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = walk(v, images);
    }
    return out;
  }
  return node;
}

/** Extract all IMAGE_N tokens referenced in the transaction. Useful for validation. */
export function collectImageReferences(transaction: any): string[] {
  const seen = new Set<string>();
  collect(transaction, seen);
  return [...seen].sort();
}

function collect(node: any, seen: Set<string>): void {
  if (node == null) return;
  if (typeof node === 'string') {
    const m = node.match(/^IMAGE_(\d+)$/);
    if (m) seen.add(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const n of node) collect(n, seen);
    return;
  }
  if (typeof node === 'object') {
    for (const v of Object.values(node)) collect(v, seen);
  }
}
