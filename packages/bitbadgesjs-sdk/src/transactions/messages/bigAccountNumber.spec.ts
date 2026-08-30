/**
 * BB-34 — hash-derived account numbers exceed 2^53.
 *
 * Chain v34 (cosmos-sdk 0.54) assigns every NEW account a hash-derived
 * account number, e.g. 11715262360359940575 (a live mainnet account). A JS
 * `number` cannot hold that: Number('11715262360359940575') silently becomes
 * 11715262360359940000, and BigInt-ing it afterwards yields
 * 11715262360359940096n — so every signature built through a number-typed
 * pipeline is invalid. Pre-v34 accounts (small numbers) still work, which
 * masked the bug.
 *
 * These tests pin the exact SignDoc protobuf bytes and amino JSON for the
 * live oversized account number, and that unsafe `number` inputs are
 * rejected loudly instead of silently corrupted.
 */
import { Coin } from '@/proto/cosmos/base/v1beta1/coin_pb.js';
import { MsgSend } from '@/proto/cosmos/bank/v1beta1/tx_pb.js';
import { SignDoc } from '@/proto/cosmos/tx/v1beta1/tx_pb.js';
import { toUint64 } from './common.js';
import { createSignDoc, createStdSignDocFromProto, keccak256ToBase64 } from './transaction.js';
import { makeSignDoc, serializeSignDoc } from './signDoc.js';
import { createTransactionPayload, type TxContext } from './base.js';
import { createProtoMsg } from './utils.js';

// Live post-v34 mainnet account number (a hash-derived assignment observed
// on chain). Deliberately a string literal — the value does not exist as a
// JS number.
const BIG_ACCOUNT = '11715262360359940575';
const BIG_ACCOUNT_BIGINT = 11715262360359940575n;
// What the old number-typed path would have produced.
const CORRUPTED = BigInt(Number(BIG_ACCOUNT)); // 11715262360359940096n
// Unordered-tx nonces in cosmos-sdk 0.54 can be nanosecond timestamps.
const BIG_SEQUENCE = '1756500000000000123';

// Protobuf wire bytes for SignDoc field 4 (account_number, varint):
// tag 0x20 followed by the varint of 11715262360359940575.
const ACCOUNT_FIELD_HEX = '20dfe388febea1becaa201';

const PUBKEY_B64 = 'AgTs0DW1MHVDf6mmnEbmf0mVWmWjNZbjqxRoLnQfH1hK';

function msgSend() {
  return createProtoMsg(
    new MsgSend({
      fromAddress: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
      toAddress: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
      amount: [new Coin({ denom: 'ubadge', amount: '1' })]
    })
  );
}

describe('BB-34 — account numbers larger than 2^53', () => {
  describe('toUint64', () => {
    it('carries string and bigint inputs exactly', () => {
      expect(toUint64(BIG_ACCOUNT)).toBe(BIG_ACCOUNT_BIGINT);
      expect(toUint64(BIG_ACCOUNT_BIGINT)).toBe(BIG_ACCOUNT_BIGINT);
      expect(toUint64(42)).toBe(42n);
      expect(toUint64('0')).toBe(0n);
    });

    it('REJECTS unsafe-integer numbers loudly — they are already corrupted', () => {
      expect(() => toUint64(Number(BIG_ACCOUNT))).toThrow(/safe integer/);
      expect(() => toUint64(2 ** 53)).toThrow(/safe integer/);
    });

    it('REJECTS non-integer and malformed inputs', () => {
      expect(() => toUint64(1.5)).toThrow(/safe integer/);
      expect(() => toUint64(-1)).toThrow();
      expect(() => toUint64('-1')).toThrow(/unsigned integer/);
      expect(() => toUint64('12x3')).toThrow(/unsigned integer/);
      expect(() => toUint64('')).toThrow(/unsigned integer/);
      expect(() => toUint64('1e19')).toThrow(/unsigned integer/);
      expect(() => toUint64(-1n)).toThrow(/uint64/);
      expect(() => toUint64(2n ** 64n)).toThrow(/uint64/);
    });
  });

  describe('SignDoc protobuf path', () => {
    it('encodes the oversized account number byte-exactly', () => {
      const doc = createSignDoc(new Uint8Array([1]), new Uint8Array([2]), 'bitbadges-1', BIG_ACCOUNT);
      const hex = Buffer.from(doc.toBinary()).toString('hex');
      expect(hex).toContain(ACCOUNT_FIELD_HEX);
      expect(SignDoc.fromBinary(doc.toBinary()).accountNumber).toBe(BIG_ACCOUNT_BIGINT);
    });

    it('accepts bigint input identically', () => {
      const doc = createSignDoc(new Uint8Array([1]), new Uint8Array([2]), 'bitbadges-1', BIG_ACCOUNT_BIGINT);
      expect(SignDoc.fromBinary(doc.toBinary()).accountNumber).toBe(BIG_ACCOUNT_BIGINT);
    });

    it('REJECTS the corrupted number form instead of signing garbage', () => {
      // Number(BIG_ACCOUNT) is what pre-fix callers were passing.
      expect(() => createSignDoc(new Uint8Array([1]), new Uint8Array([2]), 'bitbadges-1', Number(BIG_ACCOUNT) as any)).toThrow(/safe integer/);
    });
  });

  describe('amino JSON path', () => {
    it('carries the account number and nanosecond sequence strings exactly', () => {
      const doc = makeSignDoc([], { amount: [{ denom: 'ubadge', amount: '0' }], gas: '400000' }, 'bitbadges-1', '', BIG_ACCOUNT, BIG_SEQUENCE);
      const json = Buffer.from(serializeSignDoc(doc)).toString('utf8');
      expect(json).toContain(`"account_number":"${BIG_ACCOUNT}"`);
      expect(json).toContain(`"sequence":"${BIG_SEQUENCE}"`);
      expect(json).not.toContain(CORRUPTED.toString());
    });

    it('REJECTS unsafe numbers on the amino path too', () => {
      expect(() =>
        makeSignDoc([], { amount: [], gas: '1' }, 'bitbadges-1', '', Number(BIG_ACCOUNT), 0)
      ).toThrow(/safe integer/);
    });
  });

  describe('full payload pipeline', () => {
    const context: TxContext = {
      sender: {
        address: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
        sequence: BIG_SEQUENCE as any,
        accountNumber: BIG_ACCOUNT as any,
        publicKey: PUBKEY_B64
      },
      fee: { amount: '0', denom: 'ubadge', gas: '400000' }
    };

    it('signDirect signBytes hash the uncorrupted SignDoc', () => {
      const payload = createTransactionPayload(context, [msgSend().message]);

      // Independently rebuild the expected SignDoc with the exact bigint.
      const expectedDoc = new SignDoc({
        bodyBytes: payload.signDirect.body.toBinary() as Uint8Array<ArrayBuffer>,
        authInfoBytes: payload.signDirect.authInfo.toBinary() as Uint8Array<ArrayBuffer>,
        chainId: 'bitbadges-1',
        accountNumber: BIG_ACCOUNT_BIGINT
      });
      expect(payload.signDirect.signBytes).toBe(keccak256ToBase64(expectedDoc.toBinary()));

      // And it must NOT equal the digest of the corrupted doc.
      const corruptedDoc = new SignDoc({
        bodyBytes: payload.signDirect.body.toBinary() as Uint8Array<ArrayBuffer>,
        authInfoBytes: payload.signDirect.authInfo.toBinary() as Uint8Array<ArrayBuffer>,
        chainId: 'bitbadges-1',
        accountNumber: CORRUPTED
      });
      expect(payload.signDirect.signBytes).not.toBe(keccak256ToBase64(corruptedDoc.toBinary()));
    });

    it('legacyAmino signBytes hash the exact amino JSON', () => {
      const payload = createTransactionPayload(context, [msgSend().message]);
      const expectedAmino = createStdSignDocFromProto([msgSend()], { amount: [{ denom: 'ubadge', amount: '0' }], gas: '400000' }, 'bitbadges-1', '', BIG_SEQUENCE, BIG_ACCOUNT);
      expect(payload.legacyAmino.signBytes).toBe(keccak256ToBase64(serializeSignDoc(expectedAmino)));
    });

    it('REJECTS a sender whose accountNumber was already Number()-corrupted', () => {
      expect(() =>
        createTransactionPayload({ ...context, sender: { ...context.sender!, accountNumber: Number(BIG_ACCOUNT) } }, [msgSend().message])
      ).toThrow(/safe integer/);
    });
  });
});
