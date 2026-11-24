/**
 * BB-337 — `bb deploy --gen-payload` must tell an external signer to sign
 * the digest that matches the pubkey embedded in authInfoBytes.
 */
import { createHash } from 'crypto';
import { SigningKey } from 'ethers';
import { Keccak } from 'sha3';
import { PubKey as CosmosPubKey } from '@/proto/cosmos/crypto/secp256k1/keys_pb.js';
import { PubKey as EthPubKey } from '@/proto/cosmos/evm/crypto/v1/ethsecp256k1/keys_pb.js';
import { AuthInfo, SignDoc } from '@/proto/cosmos/tx/v1beta1/tx_pb.js';
import { COSMOS_SECP256K1_TYPE_URL, ETH_SECP256K1_TYPE_URL } from '../../transactions/messages/transaction.js';
import { runGenPayload } from './gen-tx-payload.js';

const ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const key = new SigningKey('0x' + '22'.repeat(32));
const PUBKEY_B64 = Buffer.from(key.compressedPublicKey.slice(2), 'hex').toString('base64');

const msg = {
  typeUrl: '/tokenization.MsgDeleteCollection',
  value: { creator: ADDRESS, collectionId: '1' }
};

function sha256B64(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('base64');
}

function keccakB64(bytes: Uint8Array): string {
  const hash = new Keccak(256);
  hash.update(Buffer.from(bytes));
  return Buffer.from(hash.digest('binary')).toString('base64');
}

async function genPayload(extra: Record<string, unknown> = {}) {
  let out = '';
  const write = jest.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
    out += String(chunk);
    return true;
  });
  const exit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error('process.exit ' + code);
  }) as any);
  try {
    await runGenPayload(JSON.stringify(msg), {
      from: ADDRESS,
      fetch: false,
      accountNumber: '0',
      sequence: '3',
      publicKey: PUBKEY_B64,
      chainId: 'bitbadges-1',
      url: 'http://127.0.0.1:9',
      fee: '0',
      feeDenom: 'ubadge',
      gas: '200000',
      memo: 'bb-337',
      ...extra
    });
  } finally {
    write.mockRestore();
    exit.mockRestore();
  }
  const env = JSON.parse(out);
  expect(env.ok).toBe(true);
  return env.data;
}

function rebuiltFromEnvelope(data: any, accountNumber: bigint) {
  return new SignDoc({
    bodyBytes: Uint8Array.from(Buffer.from(data.signDirect.bodyBytes, 'base64')),
    authInfoBytes: Uint8Array.from(Buffer.from(data.signDirect.authInfoBytes, 'base64')),
    chainId: data.chainId,
    accountNumber
  });
}

describe('gen-payload signBytes (BB-337)', () => {
  it('emits sha256(SignDoc) for a cosmos secp256k1 key, including account number 0', async () => {
    const data = await genPayload();
    expect(data.sender.accountNumber).toBe('0');
    expect(data.sender.pubKeyType).toBe(COSMOS_SECP256K1_TYPE_URL);

    const doc = rebuiltFromEnvelope(data, 0n);
    const raw = doc.toBinary();
    expect(SignDoc.fromBinary(raw).accountNumber).toBe(0n);
    expect(data.signDirect.hashAlgorithm).toBe('sha256');
    expect(data.signDirect.signBytes).toBe(sha256B64(raw));
    expect(data.signDirect.signBytes).not.toBe(keccakB64(raw));
    expect(Buffer.from(data.signDirect.signDocBytes, 'base64').equals(Buffer.from(raw))).toBe(true);

    const auth = AuthInfo.fromBinary(Buffer.from(data.signDirect.authInfoBytes, 'base64'));
    const anyPk = auth.signerInfos[0].publicKey!;
    expect(anyPk.typeUrl).toBe(COSMOS_SECP256K1_TYPE_URL);
    expect(Buffer.from(CosmosPubKey.fromBinary(anyPk.value).key).toString('base64')).toBe(PUBKEY_B64);

    const digest = Buffer.from(data.signDirect.signBytes, 'base64');
    const recovered = SigningKey.recoverPublicKey(digest, key.sign(digest));
    expect(SigningKey.computePublicKey(recovered, true)).toBe(key.compressedPublicKey);

    const aminoRaw = Buffer.from(data.legacyAmino.signDocBytes, 'base64');
    expect(data.legacyAmino.hashAlgorithm).toBe('sha256');
    expect(data.legacyAmino.signBytes).toBe(sha256B64(aminoRaw));
    expect(data.legacyAmino.signBytes).not.toBe(keccakB64(aminoRaw));

    const instructions = data.instructions.join('\n');
    expect(instructions).toContain('sha256');
    expect(instructions).toContain(COSMOS_SECP256K1_TYPE_URL);
    expect(instructions).toContain('do not hash them again');
    expect(instructions).not.toContain('keccak256');
  });

  it('emits keccak256(SignDoc) only when the pubkey type is ethsecp256k1', async () => {
    const data = await genPayload({ pubkeyType: 'eth_secp256k1' });
    const raw = rebuiltFromEnvelope(data, 0n).toBinary();

    expect(data.sender.pubKeyType).toBe(ETH_SECP256K1_TYPE_URL);
    expect(data.signDirect.hashAlgorithm).toBe('keccak256');
    expect(data.signDirect.signBytes).toBe(keccakB64(raw));
    expect(data.signDirect.signBytes).not.toBe(sha256B64(raw));
    expect(Buffer.from(data.signDirect.signDocBytes, 'base64').equals(Buffer.from(raw))).toBe(true);

    const auth = AuthInfo.fromBinary(Buffer.from(data.signDirect.authInfoBytes, 'base64'));
    const anyPk = auth.signerInfos[0].publicKey!;
    expect(anyPk.typeUrl).toBe(ETH_SECP256K1_TYPE_URL);
    expect(Buffer.from(EthPubKey.fromBinary(anyPk.value).key).toString('base64')).toBe(PUBKEY_B64);

    const aminoRaw = Buffer.from(data.legacyAmino.signDocBytes, 'base64');
    expect(data.legacyAmino.hashAlgorithm).toBe('keccak256');
    expect(data.legacyAmino.signBytes).toBe(keccakB64(aminoRaw));

    const instructions = data.instructions.join('\n');
    expect(instructions).toContain('keccak256');
    expect(instructions).toContain(ETH_SECP256K1_TYPE_URL);
    expect(instructions).toContain('do not hash them again');
  });
});
