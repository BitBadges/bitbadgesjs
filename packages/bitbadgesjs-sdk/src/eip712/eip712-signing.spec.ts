/**
 * Tests for the EIP-712 signing helpers — pubkey recovery from a
 * typed-data signature, and the broadcast-body builder that wraps
 * everything into a legacyAmino TxRaw with an `ethsecp256k1.PubKey`
 * SignerInfo.
 *
 * These specs run offline. The chain-acceptance smoke test is in the
 * frontend EthereumContext PR — actual byte-exactness with the chain's
 * Go reference can only be verified end-to-end against testnet.
 */

import { computeAddress, ethers, getBytes, hexlify, SigningKey, Wallet } from 'ethers';
import { MsgSend } from '../proto/cosmos/bank/v1beta1/tx_pb.js';
import { MsgTransferTokens } from '../proto/tokenization/tx_pb.js';
import { TxRaw } from '../proto/cosmos/tx/v1beta1/tx_pb.js';
import { createProtoMsg } from '../transactions/messages/utils.js';
import { buildEIP712TypedData } from './build.js';
import { buildEip712TxBroadcastBody, buildEip712TxRaw } from './broadcast.js';
import { hashTypedData } from './hash.js';
import { recoverEvmPublicKey, stripRecoveryByte } from './recover.js';

const EIP155_CHAIN_ID = 50025;
const COSMOS_CHAIN_ID = 'bitbadges-2';
const FEE = { amount: '1000', denom: 'ubadge', gas: 200000 };

function sampleMsgSendTyped() {
  const msg = new MsgSend({
    fromAddress: 'bb1from',
    toAddress: 'bb1to',
    amount: [{ amount: '100', denom: 'ubadge' }]
  });
  return buildEIP712TypedData({
    messages: [createProtoMsg(msg)],
    cosmosChainId: COSMOS_CHAIN_ID,
    eip155ChainId: EIP155_CHAIN_ID,
    fee: FEE,
    memo: '',
    sequence: 0,
    accountNumber: 0
  });
}

describe('eip712/recover', () => {
  it('recovers the signer pubkey from a typed-data signature', async () => {
    const wallet = Wallet.createRandom();
    const typed = sampleMsgSendTyped();
    const digest = hashTypedData(typed);
    const sig = wallet.signingKey.sign(digest).serialized;

    const recovered = recoverEvmPublicKey(typed, sig);

    // Compressed pubkey is 33 bytes (0x02/0x03 + 32-byte x-coord).
    expect(recovered.compressedPubKeyBytes.length).toBe(33);
    expect(recovered.compressedPubKeyHex).toMatch(/^0x(02|03)[0-9a-f]{64}$/i);

    // Recovered eth address must match the wallet that signed.
    expect(recovered.ethAddress.toLowerCase()).toBe(wallet.address.toLowerCase());

    // Compressed → uncompressed → derived address should round-trip.
    const uncompressed = SigningKey.computePublicKey(recovered.compressedPubKeyHex, false);
    expect(computeAddress(uncompressed).toLowerCase()).toBe(wallet.address.toLowerCase());
  });

  it('strips the trailing recovery byte from a 65-byte signature', () => {
    const sig65 = '0x' + 'ab'.repeat(65);
    const stripped = stripRecoveryByte(sig65);
    expect(stripped.length).toBe(64);
    expect(hexlify(stripped)).toBe('0x' + 'ab'.repeat(64));
  });

  it('rejects signatures of unexpected length', () => {
    expect(() => stripRecoveryByte('0x' + 'ab'.repeat(64))).toThrow(/65-byte/);
  });
});

describe('eip712/broadcast', () => {
  it('produces a TxRaw with an ethsecp256k1 SignerInfo and stripped sig', async () => {
    const wallet = Wallet.createRandom();
    const typed = sampleMsgSendTyped();
    const digest = hashTypedData(typed);
    const sigHex = wallet.signingKey.sign(digest).serialized;
    const { compressedPubKeyBytes } = recoverEvmPublicKey(typed, sigHex);

    const msg = new MsgSend({
      fromAddress: 'bb1from',
      toAddress: 'bb1to',
      amount: [{ amount: '100', denom: 'ubadge' }]
    });

    const txRaw = buildEip712TxRaw({
      messages: [createProtoMsg(msg)],
      compressedPubKey: compressedPubKeyBytes,
      sequence: 0,
      fee: FEE,
      memo: '',
      signatureHex: sigHex
    });

    expect(txRaw).toBeInstanceOf(TxRaw);
    // Signature should be 64 bytes (recovery byte stripped) — what
    // the chain's ethsecp256k1.VerifySignature expects.
    expect(txRaw.signatures.length).toBe(1);
    expect(txRaw.signatures[0].length).toBe(64);
    // bodyBytes / authInfoBytes are non-empty.
    expect(txRaw.bodyBytes.length).toBeGreaterThan(0);
    expect(txRaw.authInfoBytes.length).toBeGreaterThan(0);
  });

  it('emits the ethsecp256k1 PubKey type-url in AuthInfo', async () => {
    const wallet = Wallet.createRandom();
    const typed = sampleMsgSendTyped();
    const sigHex = wallet.signingKey.sign(hashTypedData(typed)).serialized;
    const { compressedPubKeyBytes } = recoverEvmPublicKey(typed, sigHex);

    const msg = new MsgSend({ fromAddress: 'bb1from', toAddress: 'bb1to', amount: [{ amount: '100', denom: 'ubadge' }] });
    const txRaw = buildEip712TxRaw({
      messages: [createProtoMsg(msg)],
      compressedPubKey: compressedPubKeyBytes,
      sequence: 0,
      fee: FEE,
      memo: '',
      signatureHex: sigHex
    });

    // The type_url string is part of the protobuf-encoded AuthInfo
    // bytes — the exact wire format the chain's ante handler decodes
    // and dispatches on. Asserting it's literally present catches any
    // future regression that sends the wrong PubKey path.
    const authInfoStr = Buffer.from(txRaw.authInfoBytes).toString('latin1');
    expect(authInfoStr).toContain('cosmos.evm.crypto.v1.ethsecp256k1.PubKey');
    expect(authInfoStr).not.toContain('cosmos.crypto.secp256k1.PubKey');
  });

  it('builds a JSON-shaped broadcast body the LCD endpoint accepts', () => {
    const wallet = Wallet.createRandom();
    const typed = sampleMsgSendTyped();
    const sigHex = wallet.signingKey.sign(hashTypedData(typed)).serialized;
    const { compressedPubKeyBytes } = recoverEvmPublicKey(typed, sigHex);

    const msg = new MsgSend({ fromAddress: 'bb1from', toAddress: 'bb1to', amount: [{ amount: '100', denom: 'ubadge' }] });
    const body = buildEip712TxBroadcastBody({
      messages: [createProtoMsg(msg)],
      compressedPubKey: compressedPubKeyBytes,
      sequence: 0,
      fee: FEE,
      memo: '',
      signatureHex: sigHex
    });

    const parsed = JSON.parse(body);
    // generatePostBodyBroadcast emits tx_bytes as a JSON array of bytes
    // (`[<u8>, <u8>, ...]`), the format the indexer's /broadcast proxy
    // expects. Just assert the broadcast body is well-formed JSON with
    // both fields populated.
    expect(parsed).toHaveProperty('tx_bytes');
    expect(parsed).toHaveProperty('mode');
    expect(Array.isArray(parsed.tx_bytes)).toBe(true);
    expect(parsed.tx_bytes.length).toBeGreaterThan(0);
  });

  it('handles tokenization MsgTransferTokens through the same path', () => {
    const wallet = Wallet.createRandom();
    const msg = new MsgTransferTokens({
      creator: 'bb1creator',
      collectionId: '1',
      transfers: []
    });
    const typed = buildEIP712TypedData({
      messages: [createProtoMsg(msg)],
      cosmosChainId: COSMOS_CHAIN_ID,
      eip155ChainId: EIP155_CHAIN_ID,
      fee: FEE,
      memo: '',
      sequence: 0,
      accountNumber: 0
    });
    const sigHex = wallet.signingKey.sign(hashTypedData(typed)).serialized;
    const { compressedPubKeyBytes } = recoverEvmPublicKey(typed, sigHex);

    const txRaw = buildEip712TxRaw({
      messages: [createProtoMsg(msg)],
      compressedPubKey: compressedPubKeyBytes,
      sequence: 0,
      fee: FEE,
      memo: '',
      signatureHex: sigHex
    });

    expect(txRaw.signatures[0].length).toBe(64);
  });
});
