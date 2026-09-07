/**
 * Canonical normalization for "a transaction the user handed us on the CLI".
 *
 * Every command that takes a tx accepts the same three shapes, because they
 * are the three things our own tooling produces:
 *
 *   1. `{ messages: [{ typeUrl, value }, ...] }` — a tx body
 *   2. `{ typeUrl, value }`                      — a single Msg
 *   3. `{ ok, data, warnings, hint, error }`     — a `bb build` envelope
 *
 * (3) matters most. `bb build … --output-file tx.json` writes the envelope and
 * then tells the user to run `bb check tx.json` / `bb simulate tx.json` /
 * `bb preview tx.json`. Commands that did not unwrap it rejected the exact
 * file we told the user to create. Piping hid the bug, because stdout carries
 * the bare msg.
 *
 * A failed envelope (`ok: false`) is passed through untouched so the caller's
 * shape check reports it, rather than us silently previewing a null `data`.
 */
export function ensureTxWrapper(input: any): any {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input.messages)) return input;
  if (typeof input.typeUrl === 'string' && input.value) return { messages: [input] };
  if (input.ok === true && input.data && typeof input.data === 'object') {
    return ensureTxWrapper(input.data);
  }
  return input;
}

/**
 * Human-readable description of what we actually got, for shape errors.
 * Agents recover far better from "object with keys [a, b]" than from "invalid".
 */
export function describeShape(value: any): string {
  if (value == null) return String(value);
  if (Array.isArray(value)) return `array (length ${value.length})`;
  if (typeof value === 'object') return `object with keys [${Object.keys(value).join(', ')}]`;
  return typeof value;
}
