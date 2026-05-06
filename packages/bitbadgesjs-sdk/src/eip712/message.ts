/**
 * Flattens an Amino StdSignDoc-shaped object so each message gets a
 * dedicated field (`msg0`, `msg1`, ...) instead of living inside a
 * single `msgs` array.
 *
 * Mirrors `cosmos/evm/ethereum/eip712/message.go::FlattenPayloadMessages`.
 * The reason for flattening is that EIP-712 cannot represent a single
 * field whose elements have heterogeneous schemas — splitting them out
 * as named siblings sidesteps that.
 */
const PAYLOAD_MSGS_FIELD = 'msgs';

export function msgFieldForIndex(i: number): string {
  return `msg${i}`;
}

export interface FlattenedPayload {
  /** The flattened JSON object with msg0/msg1/... and no `msgs`. */
  payload: Record<string, unknown>;
  numPayloadMsgs: number;
}

export function flattenPayloadMessages(payload: Record<string, unknown>): FlattenedPayload {
  if (!isPlainObject(payload)) {
    throw new Error('eip712: payload must be a JSON object');
  }

  const rawMsgs = payload[PAYLOAD_MSGS_FIELD];
  if (rawMsgs == null) {
    throw new Error('eip712: no `msgs` field in payload');
  }
  if (!Array.isArray(rawMsgs)) {
    throw new Error('eip712: `msgs` field must be an array');
  }

  // Shallow-clone so we don't mutate the caller's StdSignDoc object.
  const flattened: Record<string, unknown> = { ...payload };
  delete flattened[PAYLOAD_MSGS_FIELD];

  for (let i = 0; i < rawMsgs.length; i++) {
    const field = msgFieldForIndex(i);
    if (field in flattened) {
      throw new Error(`eip712: malformed payload — unexpected key collision at field ${field}`);
    }
    const msg = rawMsgs[i];
    if (!isPlainObject(msg)) {
      throw new Error(`eip712: msg at index ${i} is not a JSON object`);
    }
    flattened[field] = msg;
  }

  return { payload: flattened, numPayloadMsgs: rawMsgs.length };
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
