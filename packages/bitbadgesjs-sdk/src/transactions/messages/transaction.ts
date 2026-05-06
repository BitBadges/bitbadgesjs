import { Coin } from '@/proto/cosmos/base/v1beta1/coin_pb.js';
import { PubKey as SECP256k1 } from '@/proto/cosmos/crypto/secp256k1/keys_pb.js';
import { PubKey as ETHSECP256k1 } from '@/proto/cosmos/evm/crypto/v1/ethsecp256k1/keys_pb.js';
import { SignMode } from '@/proto/cosmos/tx/signing/v1beta1/signing_pb.js';
import { AuthInfo, Fee, ModeInfo, ModeInfo_Single, SignDoc, SignerInfo, TxBody } from '@/proto/cosmos/tx/v1beta1/tx_pb.js';
import { convertProtoMessageToObject } from '@/transactions/amino/objectConverter.js';
import { AminoTypes } from '@/transactions/amino/registry.js';
import type { Any } from '@bufbuild/protobuf';
import { Keccak } from 'sha3';
import { makeSignDoc, serializeSignDoc, StdFee } from './signDoc.js';
import type { MessageGenerated } from './utils.js';
import { createAnyMessage, dropEmptyProtoSubMessages } from './utils.js';
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
    // Drop effectively-empty sub-messages from the proto BEFORE
    // converting to amino JSON so the typed-data tree we sign matches
    // what the chain reconstructs from the broadcast wire bytes (which
    // also have these dropped — see `createAnyMessage`).
    dropEmptyProtoSubMessages(wrappedProtoMsg.message);
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

export function createSignerInfo(publicKey: Uint8Array, sequence: number, mode: number) {
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
    sequence: BigInt(sequence)
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
export function createSignerInfoEthsecp256k1(publicKey: Uint8Array, sequence: number, mode: number) {
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
    sequence: BigInt(sequence)
  });
}

export function createAuthInfo(signerInfo: SignerInfo, fee: Fee) {
  return new AuthInfo({
    signerInfos: [signerInfo],
    fee
  });
}

export function createSignDoc(bodyBytes: Uint8Array, authInfoBytes: Uint8Array, chainId: string, accountNumber: number) {
  return new SignDoc({
    bodyBytes: bodyBytes as Uint8Array<ArrayBuffer>,
    authInfoBytes: authInfoBytes as Uint8Array<ArrayBuffer>,
    chainId,
    accountNumber: BigInt(accountNumber)
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

export function createStdSignDocFromProto(protoMessages: any[], fee: StdFee, chainId: string, memo: string, sequence: number, accountNumber: number) {
  const aminoMsgs = convertProtoMessagesToAmino(protoMessages);
  return makeSignDoc(aminoMsgs, fee, chainId, memo, accountNumber, sequence);
}

// Returns the hashed digest of the corresponding StdSignDoc.
// If the StdSignDoc cannot be generated (e.g. types are not
// supported), returns an empty string.
export function createStdSignDigestFromProto(
  messages: any,
  memo: string,
  fee: string,
  denom: string,
  gasLimit: number,
  sequence: number,
  accountNumber: number,
  chainId: string
) {
  try {
    const stdFee = createStdFee(fee, denom, gasLimit);
    const stdSignDoc = createStdSignDocFromProto(messages, stdFee, chainId, memo, sequence, accountNumber);

    return keccak256ToBase64(serializeSignDoc(stdSignDoc));
  } catch {
    return '';
  }
}

export function createTransactionWithMultipleMessages(
  messages: any,
  memo: string,
  fee: string,
  denom: string,
  gasLimit: number,
  pubKey: string,
  sequence: number,
  accountNumber: number,
  chainId: string
) {
  const body = createBodyWithMultipleMessages(messages, memo);
  const feeMessage = createFee(fee, denom, gasLimit);
  const pubKeyDecoded = Buffer.from(pubKey, 'base64');

  const aminoSignerInfo = createSignerInfo(new Uint8Array(pubKeyDecoded), sequence, LEGACY_AMINO);
  const aminoAuthInfo = createAuthInfo(aminoSignerInfo, feeMessage);
  const aminoSignDigest = createStdSignDigestFromProto(messages, memo, fee, denom, gasLimit, sequence, accountNumber, chainId);

  const directSignerInfo = createSignerInfo(new Uint8Array(pubKeyDecoded), sequence, SIGN_DIRECT);
  const directAuthInfo = createAuthInfo(directSignerInfo, feeMessage);
  const directSignDoc = createSignDoc(body.toBinary(), directAuthInfo.toBinary(), chainId, accountNumber);

  const directSignDigest = keccak256ToBase64(directSignDoc.toBinary());

  return {
    legacyAmino: {
      body,
      authInfo: aminoAuthInfo,
      signBytes: aminoSignDigest
    },
    signDirect: {
      body,
      authInfo: directAuthInfo,
      signBytes: directSignDigest
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
  sequence: number,
  accountNumber: number,
  chainId: string
) {
  return createTransactionWithMultipleMessages([message], memo, fee, denom, gasLimit, pubKey, sequence, accountNumber, chainId);
}
