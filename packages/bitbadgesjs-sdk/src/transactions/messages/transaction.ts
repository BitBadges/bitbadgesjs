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
import { createAnyMessage } from './utils.js';

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

// Field names that are typed `string` in the .proto IDL but tagged
// `(gogoproto.customtype) = "Uint"` — i.e. cosmos-sdk math.Uint.
// On the chain side these emit `"0"` for the zero value (non-nullable
// customtype, no omitempty). bufbuild's `toJson({emitDefaultValues:true})`
// emits `""` for unset string fields, including these. We coerce
// `""` → `"0"` for any property whose key matches, so the SDK's
// amino JSON matches the chain's `MarshalAminoJSON` output.
//
// Generated from `grep '(gogoproto.customtype) = "Uint"' bitbadgeschain/proto/`.
// If a future proto adds a new Uint field, add its name here (or
// regenerate the set).
const UINT_CUSTOMTYPE_FIELD_NAMES = new Set<string>([
  'affiliate_percentage', 'amount', 'approvalTrackerVersions', 'challengeTrackers', 'chargePeriodLength',
  'collectionId', 'collectionStatsIds', 'decimals', 'delayAfterQuorum', 'durationFromTimestamp',
  'end', 'ethSignatureTrackers', 'expectedProofLength', 'gasLimit', 'holderCount',
  'incrementOwnershipTimesBy', 'incrementTokenIdsBy', 'intervalLength', 'lastUpdatedAt',
  'maxScalingMultiplier', 'maxSupplyPerId', 'maxUsesPerLeaf', 'nextAddressListCounter',
  'nextCollectionId', 'nextDynamicStoreId', 'nextManagerSplitterId', 'numPurged', 'numTransfers',
  'overallApprovalAmount', 'overallMaxNumTransfers', 'overrideTimestamp', 'percentage',
  'perFromAddressApprovalAmount', 'perFromAddressMaxNumTransfers', 'perInitiatedByAddressApprovalAmount',
  'perInitiatedByAddressMaxNumTransfers', 'perToAddressApprovalAmount', 'perToAddressMaxNumTransfers',
  'quorumReachedTimestamp', 'quorumThreshold', 'scalingMultiplier', 'start', 'startTime', 'storeId',
  'timezoneOffsetMinutes', 'total_amount', 'version', 'votedAt', 'weight', 'yesWeight'
]);

// Recursively strips fields that gogoproto's `MarshalAminoJSON`
// omits via `omitempty`: empty strings, `false` bools, empty arrays,
// `null`, and `undefined`. Empty objects (`{}`) are kept — gogoproto
// emits the field with a struct value even when all inner fields
// dropped to zero (e.g. `senderChecks: {}`). `"0"` strings stay
// (Uint custom types are non-`omitempty` and emit `"0"` for zero).
//
// Also coerces `""` → `"0"` for fields whose key matches a known
// gogoproto Uint customtype (see `UINT_CUSTOMTYPE_FIELD_NAMES`),
// because bufbuild emits `""` for unset string fields but the chain
// emits `"0"` for unset Uint customs.
//
// Required for EIP-712 typed-data parity. The chain's verifier
// reconstructs the signDoc by re-amino-marshaling the proto messages
// via Go's `MarshalAminoJSON`, which prunes these defaults. If the
// SDK's typed-data includes them, the keccak diverges from the
// chain's reconstruction → "signature verification failed".
function pruneAminoEmpties(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(pruneAminoEmpties);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      let pv = pruneAminoEmpties(v);
      // Coerce empty-string Uint customs to "0" before omitempty checks
      // so they emit (chain always emits Uint zero as "0").
      if (pv === '' && UINT_CUSTOMTYPE_FIELD_NAMES.has(k)) {
        pv = '0';
      }
      if (pv === '' || pv === false || pv === null || pv === undefined) continue;
      if (Array.isArray(pv) && pv.length === 0) continue;
      out[k] = pv;
    }
    return out;
  }
  return value;
}

// Converts an array of Protobuf MessageGenerated
// objects to Amino representations using the registry.
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
