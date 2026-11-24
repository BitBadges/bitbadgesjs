import { Coin } from '@/proto/cosmos/base/v1beta1/coin_pb.js';
import { PubKey as SECP256k1 } from '@/proto/cosmos/crypto/secp256k1/keys_pb.js';
import { PubKey as ETHSECP256k1 } from '@/proto/cosmos/evm/crypto/v1/ethsecp256k1/keys_pb.js';
import { SignMode } from '@/proto/cosmos/tx/signing/v1beta1/signing_pb.js';
import { AuthInfo, Fee, ModeInfo, ModeInfo_Single, SignDoc, SignerInfo, TxBody } from '@/proto/cosmos/tx/v1beta1/tx_pb.js';
import { convertProtoMessageToObject } from '@/transactions/amino/objectConverter.js';
import { AminoTypes } from '@/transactions/amino/registry.js';
import type { Any } from '@bufbuild/protobuf';
import { getBytes, sha256 as sha256Hex } from 'ethers';
import { Keccak } from 'sha3';
import { toUint64, type SignHashAlgorithm, type SignerPubKeyType, type Uint64Like } from './common.js';
import { makeSignDoc, serializeSignDoc, StdFee } from './signDoc.js';
import type { MessageGenerated } from './utils.js';
import { createAnyMessage } from './utils.js';
import { DEC_CUSTOMTYPE_FIELDS, UINT_CUSTOMTYPE_FIELDS } from './customtype-fields.generated.js';

export const SIGN_DIRECT = SignMode.DIRECT;
export const LEGACY_AMINO = SignMode.LEGACY_AMINO_JSON;

// Returns a base-64-encoded keccak256 hash of the
// given content bytes.
export function keccak256ToBase64(content: Uint8Array) {
  const hash = new Keccak(256);
  hash.update(Buffer.from(content));
  const bytes = hash.digest('binary');
  return Buffer.from(bytes).toString('base64');
}

/** Type URL written into AuthInfo for a cosmos secp256k1 signer. Verifies sha256(signDoc). */
export const COSMOS_SECP256K1_TYPE_URL = '/cosmos.crypto.secp256k1.PubKey';
/** Type URL written into AuthInfo for an ethsecp256k1 signer. Verifies keccak256(signDoc). */
export const ETH_SECP256K1_TYPE_URL = '/cosmos.evm.crypto.v1.ethsecp256k1.PubKey';

// NIST SHA-256, base64. ethers is already a browser-safe dependency; node:crypto
// is not, and this module is imported by the web SDK via createTransactionPayload.
export function sha256ToBase64(content: Uint8Array) {
  return Buffer.from(getBytes(sha256Hex(content))).toString('base64');
}

export function signHashAlgorithmForPubKey(pubKeyType: SignerPubKeyType): SignHashAlgorithm {
  return pubKeyType === 'ethsecp256k1' ? 'keccak256' : 'sha256';
}

export function signerPubKeyTypeUrl(pubKeyType: SignerPubKeyType): string {
  return pubKeyType === 'ethsecp256k1' ? ETH_SECP256K1_TYPE_URL : COSMOS_SECP256K1_TYPE_URL;
}

/**
 * Digest of a sign document for the pubkey that will verify it.
 * ethsecp256k1 goes through {@link keccak256ToBase64} unchanged.
 * cosmos secp256k1 uses SHA-256, which is what `secp256k1.PubKey.VerifySignature` applies.
 */
export function digestForPubKeyType(content: Uint8Array, pubKeyType: SignerPubKeyType): string {
  if (pubKeyType === 'ethsecp256k1') return keccak256ToBase64(content);
  return sha256ToBase64(content);
}

/**
 * Accept the short names and the AuthInfo type URLs. Empty means the
 * historical default: cosmos secp256k1. Unknown values throw — guessing
 * the wrong hash produces a signature the chain rejects with code 4.
 */
export function normalizeSignerPubKeyType(value: string | undefined | null): SignerPubKeyType {
  if (value == null) return 'secp256k1';
  const trimmed = value.trim();
  if (!trimmed) return 'secp256k1';
  const v = trimmed.replace(/^\//, '').toLowerCase();
  // Check eth first: "ethsecp256k1.pubkey" also ends with "secp256k1.pubkey".
  if (v === 'ethsecp256k1' || v === 'eth_secp256k1' || v.includes('eth_secp256k1') || v.endsWith('ethsecp256k1.pubkey')) {
    return 'ethsecp256k1';
  }
  if (v === 'secp256k1' || v.endsWith('secp256k1.pubkey') || v === 'tendermint/pubkeysecp256k1') {
    return 'secp256k1';
  }
  throw new Error(
    `Unknown signer pubkey type "${value}". Expected secp256k1 (${COSMOS_SECP256K1_TYPE_URL}) or ethsecp256k1 (${ETH_SECP256K1_TYPE_URL}).`
  );
}

// Canonical zero strings the chain emits for unset customtype fields.
// gogoproto's `MarshalAminoJSON` produces these (via the customtype's own
// MarshalJSON) when the Go field holds the type's zero value:
//   - math.Uint{} / math.Int{}        →  "0"
//   - math.LegacyDec{} / Dec / BigDec →  "0.000000000000000000"
// bufbuild proto-es is unaware of the customtype annotation and emits
// `""` for any unset string field. The pruner below restores the chain
// canonical form before computing the keccak that wallets sign.
const UINT_ZERO = '0';
const DEC_ZERO = '0.000000000000000000';

// Recursively strips fields that gogoproto's `MarshalAminoJSON`
// omits via `omitempty`: empty strings, `false` bools, empty arrays,
// `null`, and `undefined`. Empty objects (`{}`) are kept — gogoproto
// emits the field with a struct value even when all inner fields
// dropped to zero (e.g. `senderChecks: {}`).
//
// Customtype string fields (`(gogoproto.customtype) = "Uint" | "Int" |
// "LegacyDec" | …`) are non-`omitempty` on the chain side, so their
// zero value emits as `"0"` or `"0.000000000000000000"` rather than
// being omitted. We coerce `""` → that canonical form before the
// omitempty check using the `UINT_CUSTOMTYPE_FIELDS` and
// `DEC_CUSTOMTYPE_FIELDS` sets generated from the same `.proto`
// sources gogoproto reads (see `customtype-fields.generated.ts`).
//
// Required for EIP-712 typed-data parity. The chain's verifier
// reconstructs the signDoc by re-amino-marshaling the proto messages
// via Go's `MarshalAminoJSON`. If the SDK's typed-data tree carries
// `""` where the chain emits `"0"`, the keccak diverges →
// "signature verification failed".
function pruneAminoEmpties(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(pruneAminoEmpties);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      let pv = pruneAminoEmpties(v);
      if (pv === '') {
        if (UINT_CUSTOMTYPE_FIELDS.has(k)) pv = UINT_ZERO;
        else if (DEC_CUSTOMTYPE_FIELDS.has(k)) pv = DEC_ZERO;
      }
      if (pv === '' || pv === false || pv === null || pv === undefined) continue;
      if (Array.isArray(pv) && pv.length === 0) continue;
      out[k] = pv;
    }
    return out;
  }
  return value;
}

// Converts an array of Protobuf MessageGenerated objects to Amino
// representations using the registry. The customtype-field coercion
// the EIP-712 path needs is driven by static sets generated at build
// time from `.proto` sources (see `customtype-fields.generated.ts`),
// so this function no longer needs caller-supplied class hierarchy info.
export function convertProtoMessagesToAmino(protoMessages: MessageGenerated[]) {
  return protoMessages.map((wrappedProtoMsg) => {
    const protoObject = convertProtoMessageToObject(wrappedProtoMsg.message);
    const aminoMsg = AminoTypes.toAmino(protoObject) as { type: string; value: unknown };
    // Prune omitempty defaults inside `value` to match gogoproto's
    // MarshalAminoJSON output. The wrapper `{type, value}` itself stays
    // as-is — `type` is always non-empty, `value` is always an object.
    return {
      type: aminoMsg.type,
      value: pruneAminoEmpties(aminoMsg.value)
    };
  });
}

// TODO: messages should be typed as proto message. A types package is needed to export that type without problems
export function createBodyWithMultipleMessages(messages: any[], memo: string) {
  const content: Any[] = [];

  messages.forEach((message) => {
    content.push(createAnyMessage(message));
  });

  return new TxBody({
    messages: content,
    memo
  });
}

export function createBody(message: any, memo: string) {
  return createBodyWithMultipleMessages([message], memo);
}

export function createFee(fee: string, denom: string, gasLimit: number) {
  return new Fee({
    amount: [
      new Coin({
        denom,
        amount: fee
      })
    ],
    gasLimit: BigInt(gasLimit)
  });
}

export function createSignerInfo(publicKey: Uint8Array, sequence: Uint64Like, mode: number) {
  const pubkey: MessageGenerated = {
    message: new SECP256k1({
      key: publicKey as Uint8Array<ArrayBuffer>
    }),
    path: 'cosmos.crypto.secp256k1.PubKey'
  };

  const signerInfo = new SignerInfo({
    publicKey: createAnyMessage(pubkey),
    modeInfo: new ModeInfo({
      sum: {
        value: new ModeInfo_Single({
          mode
        }),
        case: 'single'
      }
    }),
    sequence: toUint64(sequence, 'sequence')
  });

  return signerInfo;
}

/**
 * Variant of `createSignerInfo` that wraps the public key as
 * `cosmos.evm.crypto.v1.ethsecp256k1.PubKey` instead of the standard
 * Cosmos `secp256k1.PubKey`. This is required for EIP-712-signed txs:
 * the chain's ante handler dispatches on PubKey type, and only
 * `ethsecp256k1.PubKey.VerifySignature` has the EIP-712 fallback that
 * recognizes signatures over the typed-data hash instead of the raw
 * sign bytes.
 */
export function createSignerInfoEthsecp256k1(publicKey: Uint8Array, sequence: Uint64Like, mode: number) {
  const pubkey: MessageGenerated = {
    message: new ETHSECP256k1({
      key: publicKey as Uint8Array<ArrayBuffer>
    }),
    path: 'cosmos.evm.crypto.v1.ethsecp256k1.PubKey'
  };

  return new SignerInfo({
    publicKey: createAnyMessage(pubkey),
    modeInfo: new ModeInfo({
      sum: {
        value: new ModeInfo_Single({
          mode
        }),
        case: 'single'
      }
    }),
    sequence: toUint64(sequence, 'sequence')
  });
}

export function createAuthInfo(signerInfo: SignerInfo, fee: Fee) {
  return new AuthInfo({
    signerInfos: [signerInfo],
    fee
  });
}

export function createSignDoc(bodyBytes: Uint8Array, authInfoBytes: Uint8Array, chainId: string, accountNumber: Uint64Like) {
  return new SignDoc({
    bodyBytes: bodyBytes as Uint8Array<ArrayBuffer>,
    authInfoBytes: authInfoBytes as Uint8Array<ArrayBuffer>,
    chainId,
    accountNumber: toUint64(accountNumber, 'accountNumber')
  });
}

export function createStdFee(amount: string, denom: string, gasLimit: number) {
  return {
    amount: [
      {
        amount,
        denom
      }
    ],
    gas: gasLimit.toString()
  };
}

export function createStdSignDocFromProto(protoMessages: any[], fee: StdFee, chainId: string, memo: string, sequence: Uint64Like, accountNumber: Uint64Like) {
  const aminoMsgs = convertProtoMessagesToAmino(protoMessages);
  return makeSignDoc(aminoMsgs, fee, chainId, memo, accountNumber, sequence);
}

// Amino JSON bytes that legacyAmino.signBytes hashes. Null when the
// StdSignDoc cannot be generated (types not supported).
function aminoSignDocBytes(
  messages: any,
  memo: string,
  fee: string,
  denom: string,
  gasLimit: number,
  sequence: Uint64Like,
  accountNumber: Uint64Like,
  chainId: string
): Uint8Array | null {
  try {
    const stdFee = createStdFee(fee, denom, gasLimit);
    const stdSignDoc = createStdSignDocFromProto(messages, stdFee, chainId, memo, sequence, accountNumber);
    return serializeSignDoc(stdSignDoc);
  } catch {
    return null;
  }
}

// Returns the hashed digest of the corresponding StdSignDoc.
// If the StdSignDoc cannot be generated (e.g. types are not
// supported), returns an empty string.
// The hash follows the signer pubkey: sha256 for cosmos secp256k1,
// keccak256 for ethsecp256k1 (BB-337).
export function createStdSignDigestFromProto(
  messages: any,
  memo: string,
  fee: string,
  denom: string,
  gasLimit: number,
  sequence: Uint64Like,
  accountNumber: Uint64Like,
  chainId: string,
  pubKeyType: SignerPubKeyType = 'secp256k1'
) {
  const bytes = aminoSignDocBytes(messages, memo, fee, denom, gasLimit, sequence, accountNumber, chainId);
  if (!bytes) return '';
  return digestForPubKeyType(bytes, pubKeyType);
}

export function createTransactionWithMultipleMessages(
  messages: any,
  memo: string,
  fee: string,
  denom: string,
  gasLimit: number,
  pubKey: string,
  sequence: Uint64Like,
  accountNumber: Uint64Like,
  chainId: string,
  // Default matches the AuthInfo this function has always emitted
  // (cosmos.crypto.secp256k1.PubKey). That verifier checks sha256(signDoc).
  // Pass 'ethsecp256k1' to keep the keccak digest and the eth pubkey type.
  // EIP-712 / browser / EVM signing do not read these signBytes.
  pubKeyType: SignerPubKeyType = 'secp256k1'
) {
  const body = createBodyWithMultipleMessages(messages, memo);
  const feeMessage = createFee(fee, denom, gasLimit);
  const pubKeyDecoded = Buffer.from(pubKey, 'base64');
  const hashAlgorithm = signHashAlgorithmForPubKey(pubKeyType);
  const makeSignerInfo = pubKeyType === 'ethsecp256k1' ? createSignerInfoEthsecp256k1 : createSignerInfo;

  const aminoRaw = aminoSignDocBytes(messages, memo, fee, denom, gasLimit, sequence, accountNumber, chainId);
  const aminoSignDocBytesOut = aminoRaw ?? new Uint8Array();
  const aminoSignDigest = aminoRaw ? digestForPubKeyType(aminoRaw, pubKeyType) : '';

  const aminoSignerInfo = makeSignerInfo(new Uint8Array(pubKeyDecoded), sequence, LEGACY_AMINO);
  const aminoAuthInfo = createAuthInfo(aminoSignerInfo, feeMessage);

  const directSignerInfo = makeSignerInfo(new Uint8Array(pubKeyDecoded), sequence, SIGN_DIRECT);
  const directAuthInfo = createAuthInfo(directSignerInfo, feeMessage);
  const directSignDoc = createSignDoc(body.toBinary(), directAuthInfo.toBinary(), chainId, accountNumber);
  const directSignDocBytes = directSignDoc.toBinary();
  const directSignDigest = digestForPubKeyType(directSignDocBytes, pubKeyType);

  return {
    pubKeyType,
    hashAlgorithm,
    legacyAmino: {
      body,
      authInfo: aminoAuthInfo,
      signBytes: aminoSignDigest,
      hashAlgorithm,
      signDocBytes: aminoSignDocBytesOut
    },
    signDirect: {
      body,
      authInfo: directAuthInfo,
      signBytes: directSignDigest,
      hashAlgorithm,
      signDocBytes: directSignDocBytes
    }
  };
}

export function createTransaction(
  message: any,
  memo: string,
  fee: string,
  denom: string,
  gasLimit: number,
  pubKey: string,
  sequence: Uint64Like,
  accountNumber: Uint64Like,
  chainId: string,
  pubKeyType: SignerPubKeyType = 'secp256k1'
) {
  return createTransactionWithMultipleMessages([message], memo, fee, denom, gasLimit, pubKey, sequence, accountNumber, chainId, pubKeyType);
}
