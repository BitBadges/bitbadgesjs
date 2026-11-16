import { createHash } from 'crypto';
import { bech32 } from 'bech32';
import { cosmosAddressFromPublicKey } from './converter.js';

/**
 * Compressed secp256k1 pubkey used as a stable cosmosAddressFromPublicKey vector.
 * Independent expected value is ripemd160(sha256(pubkey)) bech32-encoded, matching
 * cosmos.crypto.secp256k1.PubKey derivation (the pre-BB-332 node:crypto path).
 */
const COMPRESSED_PUBKEY_HEX = '0293a9c4c92c9a8a70d5b029c3db0d9e209d051fe1933adcdb6da1342264b2c4c3';
const PINNED_BB_ADDRESS = 'bb1tmcxv7vet974le2qelattpvm8s4ap4cdtzstn2';

function nodeCryptoAddress(compressedPubKeyHex: string, prefix: string): string {
  const sha256Hash = createHash('sha256').update(Buffer.from(compressedPubKeyHex, 'hex')).digest();
  const ripemd160Hash = createHash('ripemd160').update(sha256Hash).digest();
  return bech32.encode(prefix, bech32.toWords(ripemd160Hash));
}

describe('cosmosAddressFromPublicKey', () => {
  it('matches node crypto ripemd160(sha256(compressedPubKey)) and a pinned vector', () => {
    const expected = nodeCryptoAddress(COMPRESSED_PUBKEY_HEX, 'bb');
    expect(expected).toBe(PINNED_BB_ADDRESS);
    expect(cosmosAddressFromPublicKey(COMPRESSED_PUBKEY_HEX)).toBe(expected);
    expect(cosmosAddressFromPublicKey(COMPRESSED_PUBKEY_HEX, 'cosmos')).toBe(nodeCryptoAddress(COMPRESSED_PUBKEY_HEX, 'cosmos'));
  });
});
