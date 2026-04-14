/**
 * JSON → proto dispatcher for every tokenization Msg type.
 *
 * This is the single place that knows how to turn an agent-friendly
 * `{ typeUrl, value }` (or `{ "@type", value }`) shape into a proto
 * `Message` instance ready for `createTxBroadcastBody()`. It's used by the
 * indexer's `/api/v0/simulate` JSON fast path so agents can POST raw
 * message JSON instead of having to proto-encode + sign client-side just
 * to dry-run a tx.
 *
 * Covers every `tokenization.Msg*` request type (Create/Update/Universal
 * collection, transfers, per-field setters, user-level approvals, dynamic
 * stores, vote, address lists, etc.). Unknown typeUrls throw a typed error
 * so callers can distinguish "we don't support this message type yet"
 * from a generic encoding failure.
 */

import type { Message } from '@bufbuild/protobuf';

import { MsgCastVote } from './msgCastVote.js';
import { MsgCreateAddressLists } from './msgCreateAddressLists.js';
import { MsgCreateCollection } from './msgCreateCollection.js';
import { MsgCreateDynamicStore } from './msgCreateDynamicStore.js';
import { MsgDeleteCollection } from './msgDeleteCollection.js';
import { MsgDeleteDynamicStore } from './msgDeleteDynamicStore.js';
import { MsgDeleteIncomingApproval } from './msgDeleteIncomingApproval.js';
import { MsgDeleteOutgoingApproval } from './msgDeleteOutgoingApproval.js';
import { MsgPurgeApprovals } from './msgPurgeApprovals.js';
import { MsgSetCollectionApprovals } from './msgSetCollectionApprovals.js';
import { MsgSetCollectionMetadata } from './msgSetCollectionMetadata.js';
import { MsgSetCustomData } from './msgSetCustomData.js';
import { MsgSetDynamicStoreValue } from './msgSetDynamicStoreValue.js';
import { MsgSetIncomingApproval } from './msgSetIncomingApproval.js';
import { MsgSetIsArchived } from './msgSetIsArchived.js';
import { MsgSetManager } from './msgSetManager.js';
import { MsgSetOutgoingApproval } from './msgSetOutgoingApproval.js';
import { MsgSetStandards } from './msgSetStandards.js';
import { MsgSetTokenMetadata } from './msgSetTokenMetadata.js';
import { MsgSetValidTokenIds } from './msgSetValidTokenIds.js';
import { MsgTransferTokens } from './msgTransferTokens.js';
import { MsgUniversalUpdateCollection } from './msgUniversalUpdateCollection.js';
import { MsgUpdateCollection } from './msgUpdateCollection.js';
import { MsgUpdateDynamicStore } from './msgUpdateDynamicStore.js';
import { MsgUpdateUserApprovals } from './msgUpdateUserApprovals.js';

/**
 * Error thrown when `encodeTokenizationMsgFromJson` receives a typeUrl it
 * doesn't know how to build. Callers can catch this specifically to return
 * a nicer "unsupported message type" response to the agent rather than
 * crashing on a generic constructor failure.
 */
export class UnsupportedMessageTypeError extends Error {
  readonly typeUrl: string;
  constructor(typeUrl: string) {
    super(
      `No JSON→proto encoder for typeUrl "${typeUrl}". Supported: every /tokenization.Msg* request type. ` +
        `For other cosmos-sdk modules, proto-encode client-side and POST the tx_bytes instead.`
    );
    this.name = 'UnsupportedMessageTypeError';
    this.typeUrl = typeUrl;
  }
}

/**
 * Error thrown when `encodeTokenizationMsgFromJson` recognized the typeUrl
 * but the wrapper-class constructor threw on the malformed `value` (missing
 * required fields, wrong types, etc.). Wraps the underlying TypeError so
 * agents and HTTP callers see "/tokenization.MsgX: missing field foo"
 * instead of a raw `Cannot read properties of undefined (reading 'foo')`
 * stack trace.
 */
export class InvalidMessageValueError extends Error {
  readonly typeUrl: string;
  readonly cause: unknown;
  constructor(typeUrl: string, cause: unknown) {
    const causeMsg = cause instanceof Error ? cause.message : String(cause);
    super(
      `Invalid value for ${typeUrl}: ${causeMsg}. Check that all required fields are present and shaped correctly.`
    );
    this.name = 'InvalidMessageValueError';
    this.typeUrl = typeUrl;
    this.cause = cause;
  }
}

type Builder = (value: any) => Message;

// typeUrl → wrapper-class constructor. The wrapper classes normalize
// string/number/nested-object inputs and expose `.toProto()` that emits a
// buf-protobuf `Message` suitable for `createTxBroadcastBody()`.
//
// Keep this table in sync with the list in `src/transactions/messages/
// bitbadges/tokenization/index.ts` — there should be one entry per Msg
// request file (response messages are not signable).
const BUILDERS: Record<string, Builder> = {
  '/tokenization.MsgCastVote': (v) => new MsgCastVote(v).toProto(),
  '/tokenization.MsgCreateAddressLists': (v) => new MsgCreateAddressLists(v).toProto(),
  '/tokenization.MsgCreateCollection': (v) => new MsgCreateCollection(v).toProto(),
  '/tokenization.MsgCreateDynamicStore': (v) => new MsgCreateDynamicStore(v).toProto(),
  '/tokenization.MsgDeleteCollection': (v) => new MsgDeleteCollection(v).toProto(),
  '/tokenization.MsgDeleteDynamicStore': (v) => new MsgDeleteDynamicStore(v).toProto(),
  '/tokenization.MsgDeleteIncomingApproval': (v) => new MsgDeleteIncomingApproval(v).toProto(),
  '/tokenization.MsgDeleteOutgoingApproval': (v) => new MsgDeleteOutgoingApproval(v).toProto(),
  '/tokenization.MsgPurgeApprovals': (v) => new MsgPurgeApprovals(v).toProto(),
  '/tokenization.MsgSetCollectionApprovals': (v) => new MsgSetCollectionApprovals(v).toProto(),
  '/tokenization.MsgSetCollectionMetadata': (v) => new MsgSetCollectionMetadata(v).toProto(),
  '/tokenization.MsgSetCustomData': (v) => new MsgSetCustomData(v).toProto(),
  '/tokenization.MsgSetDynamicStoreValue': (v) => new MsgSetDynamicStoreValue(v).toProto(),
  '/tokenization.MsgSetIncomingApproval': (v) => new MsgSetIncomingApproval(v).toProto(),
  '/tokenization.MsgSetIsArchived': (v) => new MsgSetIsArchived(v).toProto(),
  '/tokenization.MsgSetManager': (v) => new MsgSetManager(v).toProto(),
  '/tokenization.MsgSetOutgoingApproval': (v) => new MsgSetOutgoingApproval(v).toProto(),
  '/tokenization.MsgSetStandards': (v) => new MsgSetStandards(v).toProto(),
  '/tokenization.MsgSetTokenMetadata': (v) => new MsgSetTokenMetadata(v).toProto(),
  '/tokenization.MsgSetValidTokenIds': (v) => new MsgSetValidTokenIds(v).toProto(),
  '/tokenization.MsgTransferTokens': (v) => new MsgTransferTokens(v).toProto(),
  '/tokenization.MsgUniversalUpdateCollection': (v) => new MsgUniversalUpdateCollection(v).toProto(),
  '/tokenization.MsgUpdateCollection': (v) => new MsgUpdateCollection(v).toProto(),
  '/tokenization.MsgUpdateDynamicStore': (v) => new MsgUpdateDynamicStore(v).toProto(),
  '/tokenization.MsgUpdateUserApprovals': (v) => new MsgUpdateUserApprovals(v).toProto()
};

/**
 * Turn a single JSON-shaped tokenization message into a proto `Message`.
 *
 * Accepts both `{ typeUrl, value }` (what the builder pipeline emits) and
 * `{ '@type', ... }` (what Cosmos-style Amino JSON uses). Also tolerates
 * the entire value living on the top-level object when `value` is absent.
 *
 * @throws {UnsupportedMessageTypeError} if the typeUrl isn't a known
 *   tokenization request message.
 * @throws {InvalidMessageValueError} if the typeUrl is known but the
 *   wrapper-class constructor crashed on the malformed value (missing
 *   required fields, wrong types). Wraps the underlying TypeError with
 *   the typeUrl baked into the message so agents see context-rich
 *   errors instead of "Cannot read properties of undefined".
 */
export function encodeTokenizationMsgFromJson(msg: any): Message {
  if (!msg || typeof msg !== 'object') {
    throw new Error('encodeTokenizationMsgFromJson: message must be an object');
  }
  const typeUrl: string = msg.typeUrl || msg['@type'] || '';
  if (!typeUrl) {
    throw new Error('encodeTokenizationMsgFromJson: message missing "typeUrl"');
  }
  const builder = BUILDERS[typeUrl];
  if (!builder) {
    throw new UnsupportedMessageTypeError(typeUrl);
  }
  const value = msg.value !== undefined ? msg.value : msg;
  // Reject obviously-wrong value shapes up front so the wrapper class
  // doesn't get a chance to throw a confusing field-access error.
  if (value === null) {
    throw new InvalidMessageValueError(typeUrl, new Error('value cannot be null'));
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidMessageValueError(
      typeUrl,
      new Error(`value must be an object, got ${Array.isArray(value) ? 'array' : typeof value}`)
    );
  }
  try {
    return builder(value);
  } catch (cause) {
    // Wrapper-class constructors crash on missing required fields with
    // raw TypeErrors like "Cannot read properties of undefined (reading
    // 'creator')". Wrap with typed error so agents see a clean
    // "/tokenization.MsgX: <reason>" message.
    if (cause instanceof UnsupportedMessageTypeError || cause instanceof InvalidMessageValueError) {
      throw cause;
    }
    throw new InvalidMessageValueError(typeUrl, cause);
  }
}

/** Convenience wrapper — map an array of JSON messages to proto in one call. */
export function encodeTokenizationMsgsFromJson(msgs: any[]): Message[] {
  return msgs.map((m) => encodeTokenizationMsgFromJson(m));
}

/** List of supported typeUrls. Useful for error messages and tooling. */
export function supportedTokenizationTypeUrls(): string[] {
  return Object.keys(BUILDERS);
}
