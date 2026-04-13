/**
 * Top-level JSON → proto dispatcher.
 *
 * Agents (and anything else that wants to simulate a tx without writing
 * SDK code) POST `{ typeUrl, value }` JSON. This dispatcher turns each
 * message into a proto `Message` that `createTxBroadcastBody()` can then
 * wrap into the `tx_bytes` the Cosmos LCD simulate endpoint expects.
 *
 * Tiers:
 *
 *   1. **Tokenization** — every `tokenization.Msg*` request type. Lives in
 *      its own self-contained dispatcher at
 *      `bitbadges/tokenization/fromJson.ts` so the most common agent flow
 *      (build → simulate) has the tightest coverage. This file delegates
 *      to it for any typeUrl with a `.Msg*Collection` / `.Msg*Approval` /
 *      etc. shape.
 *
 *   2. **Cosmos baseline** — the day-to-day Cosmos SDK messages the
 *      frontend TxModal already knows how to build: bank send, staking
 *      (delegate/undelegate/redelegate), distribution (withdraw reward),
 *      IBC transfer, authz (grant/revoke/exec). Hand-registered below.
 *
 *   3. **Everything else** — gamm, cosmos.group, wasmx, cosmwasm, maps,
 *      anchor, managersplitter. Not registered yet; unsupported typeUrls
 *      raise `UnsupportedMessageTypeError` so callers can either fall
 *      back to client-side proto-encoding + tx_bytes upload or open an
 *      issue to add coverage.
 *
 * The dispatcher is intentionally read-only — no state, no side effects,
 * no network. Call it from anywhere (indexer, CLI, tests) and it gives
 * you a `Message` instance.
 */

import type { Message } from '@bufbuild/protobuf';

import * as bank from '@/proto/cosmos/bank/v1beta1/index.js';
import * as staking from '@/proto/cosmos/staking/v1beta1/index.js';
import * as distribution from '@/proto/cosmos/distribution/v1beta1/index.js';
import * as authz from '@/proto/cosmos/authz/v1beta1/index.js';
import * as ibc from '@/proto/ibc/index.js';

import {
  encodeTokenizationMsgFromJson,
  supportedTokenizationTypeUrls,
  UnsupportedMessageTypeError
} from './bitbadges/tokenization/fromJson.js';

export { UnsupportedMessageTypeError } from './bitbadges/tokenization/fromJson.js';

type Builder = (value: any) => Message;

// ---------------------------------------------------------------------------
// Cosmos baseline — registered below tokenization so a typeUrl that somehow
// collides would prefer the tokenization path (there is no actual overlap;
// tokenization lives under `/tokenization.*` and cosmos lives under
// `/cosmos.*` / `/ibc.*`).
// ---------------------------------------------------------------------------

/**
 * Normalize each Cosmos `Coin.amount` field to a string. The proto class
 * expects string amounts; agents often pass numbers/BigInts. We walk the
 * coin arrays up front so the builder entries below don't each have to
 * repeat the same normalization.
 */
const coinStr = (c: any) => ({ amount: String(c.amount), denom: c.denom });
const coinsStr = (arr: any[]) => (Array.isArray(arr) ? arr.map(coinStr) : arr);

const COSMOS_BUILDERS: Record<string, Builder> = {
  // ── cosmos.bank ────────────────────────────────────────────────────────
  '/cosmos.bank.v1beta1.MsgSend': (v) =>
    new bank.MsgSend({
      fromAddress: v.fromAddress,
      toAddress: v.toAddress,
      amount: coinsStr(v.amount)
    }),

  // ── cosmos.staking ─────────────────────────────────────────────────────
  '/cosmos.staking.v1beta1.MsgDelegate': (v) =>
    new staking.MsgDelegate({
      delegatorAddress: v.delegatorAddress,
      validatorAddress: v.validatorAddress,
      amount: coinStr(v.amount)
    }),
  '/cosmos.staking.v1beta1.MsgUndelegate': (v) =>
    new staking.MsgUndelegate({
      delegatorAddress: v.delegatorAddress,
      validatorAddress: v.validatorAddress,
      amount: coinStr(v.amount)
    }),
  '/cosmos.staking.v1beta1.MsgBeginRedelegate': (v) =>
    new staking.MsgBeginRedelegate({
      delegatorAddress: v.delegatorAddress,
      validatorSrcAddress: v.validatorSrcAddress,
      validatorDstAddress: v.validatorDstAddress,
      amount: coinStr(v.amount)
    }),

  // ── cosmos.distribution ────────────────────────────────────────────────
  '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward': (v) =>
    new distribution.MsgWithdrawDelegatorReward({
      delegatorAddress: v.delegatorAddress,
      validatorAddress: v.validatorAddress
    }),

  // ── cosmos.authz ───────────────────────────────────────────────────────
  // MsgGrant/MsgExec wrap inner messages as binary payloads. We pass them
  // through as-is; callers that want to nest additional messages inside
  // must pre-encode them. The frontend's TxModal does the same — it walks
  // ProtoTypeRegistry and binarizes — but that path belongs on the client.
  '/cosmos.authz.v1beta1.MsgGrant': (v) => new authz.MsgGrant(v),
  '/cosmos.authz.v1beta1.MsgRevoke': (v) => new authz.MsgRevoke(v),
  '/cosmos.authz.v1beta1.MsgExec': (v) => new authz.MsgExec(v),

  // ── ibc ────────────────────────────────────────────────────────────────
  '/ibc.applications.transfer.v1.MsgTransfer': (v) =>
    new ibc.MsgTransfer({
      sourcePort: v.sourcePort,
      sourceChannel: v.sourceChannel,
      token: v.token ? coinStr(v.token) : undefined,
      sender: v.sender,
      receiver: v.receiver,
      timeoutHeight: v.timeoutHeight,
      timeoutTimestamp: v.timeoutTimestamp != null ? BigInt(v.timeoutTimestamp) : undefined,
      memo: v.memo
    })
};

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

/**
 * Turn a single JSON-shaped message into a proto `Message`. Accepts both
 * `{ typeUrl, value }` and `{ "@type", ... }`; values can live either on
 * `.value` or directly on the top-level object.
 *
 * @throws {UnsupportedMessageTypeError} if the typeUrl isn't in either
 *   the tokenization tier or the Cosmos baseline tier.
 */
export function encodeMsgFromJson(msg: any): Message {
  if (!msg || typeof msg !== 'object') {
    throw new Error('encodeMsgFromJson: message must be an object');
  }
  const typeUrl: string = msg.typeUrl || msg['@type'] || '';
  if (!typeUrl) {
    throw new Error('encodeMsgFromJson: message missing "typeUrl"');
  }

  // Tokenization tier — the 95% path for BitBadges agents.
  if (typeUrl.startsWith('/tokenization.')) {
    return encodeTokenizationMsgFromJson(msg);
  }

  // Cosmos baseline tier.
  const builder = COSMOS_BUILDERS[typeUrl];
  if (builder) {
    const value = msg.value !== undefined ? msg.value : msg;
    return builder(value);
  }

  throw new UnsupportedMessageTypeError(typeUrl);
}

/** Convenience wrapper — proto-encode an entire `messages[]` array. */
export function encodeMsgsFromJson(msgs: any[]): Message[] {
  return msgs.map((m) => encodeMsgFromJson(m));
}

/** All supported typeUrls across both tiers. Useful for error reporting. */
export function supportedJsonTypeUrls(): string[] {
  return [...supportedTokenizationTypeUrls(), ...Object.keys(COSMOS_BUILDERS)];
}
