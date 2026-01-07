import { Coin } from '@/proto/cosmos/base/v1beta1/coin_pb.js';
import { PubKey as SECP256k1 } from '@/proto/cosmos/crypto/secp256k1/keys_pb.js';
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

// Converts an array of Protobuf MessageGenerated
// objects to Amino representations using the registry.
export function convertProtoMessagesToAmino(protoMessages: MessageGenerated[]) {
  return protoMessages.map((wrappedProtoMsg) => {
    const protoObject = convertProtoMessageToObject(wrappedProtoMsg.message);
    return AminoTypes.toAmino(protoObject);
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
