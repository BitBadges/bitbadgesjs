/**
 * BB-337 — signBytes must be the digest the pubkey in AuthInfo verifies.
 *
 * cosmos.crypto.secp256k1.PubKey.VerifySignature hashes with SHA-256.
 * cosmos.evm.crypto.v1.ethsecp256k1.PubKey.VerifySignature hashes with keccak256.
 * The payload used to keccak-hash both, so a normal bb1 key signing
 * signDirect.signBytes was rejected with code 4.
 */
import { createHash } from 'crypto';
import { SigningKey } from 'ethers';
import { Keccak } from 'sha3';
import { Coin } from '@/proto/cosmos/base/v1beta1/coin_pb.js';
import { MsgSend } from '@/proto/cosmos/bank/v1beta1/tx_pb.js';
import { PubKey as CosmosPubKey } from '@/proto/cosmos/crypto/secp256k1/keys_pb.js';
import { PubKey as EthPubKey } from '@/proto/cosmos/evm/crypto/v1/ethsecp256k1/keys_pb.js';
import { AuthInfo, SignDoc } from '@/proto/cosmos/tx/v1beta1/tx_pb.js';
import { createTransactionPayload, type TxContext } from './base.js';
import { serializeSignDoc } from './signDoc.js';
import {
  COSMOS_SECP256K1_TYPE_URL,
  ETH_SECP256K1_TYPE_URL,
  createStdSignDocFromProto,
  keccak256ToBase64,
  normalizeSignerPubKeyType,
  sha256ToBase64
} from './transaction.js';
import { createProtoMsg } from './utils.js';

const CHAIN_ID = 'bitbadges-1';
const ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const key = new SigningKey('0x' + '11'.repeat(32));
const PUBKEY_B64 = Buffer.from(key.compressedPublicKey.slice(2), 'hex').toString('base64');

function sha256B64(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('base64');
}

function keccakB64(bytes: Uint8Array): string {
  const hash = new Keccak(256);
  hash.update(Buffer.from(bytes));
  return Buffer.from(hash.digest('binary')).toString('base64');
}

function message() {
  return new MsgSend({
    fromAddress: ADDRESS,
    toAddress: ADDRESS,
    amount: [new Coin({ denom: 'ubadge', amount: '1' })]
  });
}

function context(sender: Partial<NonNullable<TxContext['sender']>> = {}): TxContext {
  return {
    chainIdOverride: CHAIN_ID,
    memo: 'bb-337',
    fee: { amount: '0', denom: 'ubadge', gas: '200000' },
    sender: {
      address: ADDRESS,
      sequence: 4,
      accountNumber: 7,
      publicKey: PUBKEY_B64,
      ...sender
    }
  };
}

function rebuiltSignDoc(payload: ReturnType<typeof createTransactionPayload>, accountNumber: bigint) {
  return new SignDoc({
    bodyBytes: payload.signDirect.body.toBinary() as Uint8Array<ArrayBuffer>,
    authInfoBytes: payload.signDirect.authInfo.toBinary() as Uint8Array<ArrayBuffer>,
    chainId: CHAIN_ID,
    accountNumber
  });
}

function expectSignatureRecoversKey(digestB64: string) {
  const digest = Buffer.from(digestB64, 'base64');
  expect(digest.length).toBe(32);
  const sig = key.sign(digest);
  const recovered = SigningKey.recoverPublicKey(digest, sig);
  expect(SigningKey.computePublicKey(recovered, true)).toBe(key.compressedPublicKey);
}

describe('BB-337 signBytes digest matches the AuthInfo pubkey', () => {
  it('pins sha256 and leaves the keccak helper byte-identical to sha3', () => {
    const sample = Uint8Array.from([1, 2, 3, 4]);
    expect(sha256ToBase64(sample)).toBe(sha256B64(sample));
    expect(keccak256ToBase64(sample)).toBe(keccakB64(sample));
    expect(sha256ToBase64(new Uint8Array())).toBe('47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=');
    expect(sha256B64(sample)).not.toBe(keccakB64(sample));
  });

  it('uses sha256 for a cosmos secp256k1 key and the signature verifies against that pubkey', () => {
    const payload = createTransactionPayload(context(), message());
    const doc = rebuiltSignDoc(payload, 7n);
    const raw = doc.toBinary();

    expect(Buffer.from(payload.signDirect.signDocBytes).equals(Buffer.from(raw))).toBe(true);
    expect(payload.signDirect.hashAlgorithm).toBe('sha256');
    expect(payload.signDirect.signBytes).toBe(sha256B64(raw));
    expect(payload.signDirect.signBytes).toBe(sha256ToBase64(raw));
    expect(payload.signDirect.signBytes).not.toBe(keccakB64(raw));
    expect(payload.signDirect.signBytes).not.toBe(keccak256ToBase64(raw));

    const auth = AuthInfo.fromBinary(payload.signDirect.authInfo.toBinary());
    const anyPk = auth.signerInfos[0].publicKey!;
    expect(anyPk.typeUrl).toBe(COSMOS_SECP256K1_TYPE_URL);
    expect(Buffer.from(CosmosPubKey.fromBinary(anyPk.value).key).toString('base64')).toBe(PUBKEY_B64);
    expectSignatureRecoversKey(payload.signDirect.signBytes);

    const amino = createStdSignDocFromProto(
      [createProtoMsg(message())],
      { amount: [{ denom: 'ubadge', amount: '0' }], gas: '200000' },
      CHAIN_ID,
      'bb-337',
      4,
      7
    );
    const aminoBytes = serializeSignDoc(amino);
    expect(payload.legacyAmino.hashAlgorithm).toBe('sha256');
    expect(Buffer.from(payload.legacyAmino.signDocBytes).equals(Buffer.from(aminoBytes))).toBe(true);
    expect(payload.legacyAmino.signBytes).toBe(sha256B64(aminoBytes));
    expect(payload.legacyAmino.signBytes).not.toBe(keccakB64(aminoBytes));
    const aminoAuth = AuthInfo.fromBinary(payload.legacyAmino.authInfo.toBinary());
    expect(aminoAuth.signerInfos[0].publicKey!.typeUrl).toBe(COSMOS_SECP256K1_TYPE_URL);
  });

  it('keeps keccak256 for an ethsecp256k1 key and does not change that digest helper', () => {
    const cosmos = createTransactionPayload(context(), message());
    const eth = createTransactionPayload(context({ pubKeyType: 'eth_secp256k1' }), message());
    const doc = rebuiltSignDoc(eth, 7n);
    const raw = doc.toBinary();

    expect(eth.signDirect.hashAlgorithm).toBe('keccak256');
    expect(eth.signDirect.signBytes).toBe(keccakB64(raw));
    expect(eth.signDirect.signBytes).toBe(keccak256ToBase64(raw));
    expect(eth.signDirect.signBytes).not.toBe(sha256B64(raw));
    expect(eth.signDirect.signBytes).not.toBe(cosmos.signDirect.signBytes);

    const auth = AuthInfo.fromBinary(eth.signDirect.authInfo.toBinary());
    const anyPk = auth.signerInfos[0].publicKey!;
    expect(anyPk.typeUrl).toBe(ETH_SECP256K1_TYPE_URL);
    expect(anyPk.typeUrl).not.toBe(COSMOS_SECP256K1_TYPE_URL);
    expect(Buffer.from(EthPubKey.fromBinary(anyPk.value).key).toString('base64')).toBe(PUBKEY_B64);
    expectSignatureRecoversKey(eth.signDirect.signBytes);

    expect(eth.legacyAmino.hashAlgorithm).toBe('keccak256');
    expect(eth.legacyAmino.signBytes).toBe(keccak256ToBase64(eth.legacyAmino.signDocBytes));
    expect(eth.legacyAmino.signBytes).not.toBe(sha256ToBase64(eth.legacyAmino.signDocBytes));
    const aminoAuth = AuthInfo.fromBinary(eth.legacyAmino.authInfo.toBinary());
    expect(aminoAuth.signerInfos[0].publicKey!.typeUrl).toBe(ETH_SECP256K1_TYPE_URL);

    // Same pubkey bytes, different type URL → different AuthInfo → different SignDoc.
    expect(Buffer.from(eth.signDirect.authInfo.toBinary()).equals(Buffer.from(cosmos.signDirect.authInfo.toBinary()))).toBe(false);
  });

  it('treats an omitted pubkey type as cosmos secp256k1', () => {
    const omitted = createTransactionPayload(context(), message());
    const explicit = createTransactionPayload(context({ pubKeyType: 'secp256k1' }), message());
    expect(explicit.signDirect.signBytes).toBe(omitted.signDirect.signBytes);
    expect(Buffer.from(explicit.signDirect.authInfo.toBinary()).equals(Buffer.from(omitted.signDirect.authInfo.toBinary()))).toBe(true);
    expect(explicit.legacyAmino.signBytes).toBe(omitted.legacyAmino.signBytes);
  });

  it('accepts account number 0', () => {
    const payload = createTransactionPayload(context({ accountNumber: 0, sequence: 0 }), message());
    const doc = rebuiltSignDoc(payload, 0n);
    expect(SignDoc.fromBinary(doc.toBinary()).accountNumber).toBe(0n);
    expect(payload.signDirect.signBytes).toBe(sha256B64(doc.toBinary()));
    expect(() => createTransactionPayload(context({ accountNumber: -1 }), message())).toThrow(/uint64/);
  });

  it('normalizes pubkey type aliases and rejects unknown types', () => {
    expect(normalizeSignerPubKeyType(undefined)).toBe('secp256k1');
    expect(normalizeSignerPubKeyType('')).toBe('secp256k1');
    expect(normalizeSignerPubKeyType('secp256k1')).toBe('secp256k1');
    expect(normalizeSignerPubKeyType('/cosmos.crypto.secp256k1.PubKey')).toBe('secp256k1');
    expect(normalizeSignerPubKeyType('eth_secp256k1')).toBe('ethsecp256k1');
    expect(normalizeSignerPubKeyType('ethsecp256k1')).toBe('ethsecp256k1');
    expect(normalizeSignerPubKeyType('/cosmos.evm.crypto.v1.ethsecp256k1.PubKey')).toBe('ethsecp256k1');
    expect(() => normalizeSignerPubKeyType('ed25519')).toThrow(/Unknown signer pubkey type/);
  });
});
