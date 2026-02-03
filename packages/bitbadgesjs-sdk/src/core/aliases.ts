import { CollectionId } from '@/interfaces/index.js';
import { bech32 } from 'bech32';
import crypto from 'crypto';
import type { NumberType } from '../common/string-numbers.js';

const AddressGenerationPrefix = 0x09;
const AccountGenerationPrefix = 0x08;
const DenomGenerationPrefix = 0x0c;
const BackedPathGenerationPrefix = 0x12;

function Module(moduleName: string, ...derivationKeys: Buffer[]) {
  let mKey = Buffer.from(moduleName);

  if (derivationKeys.length === 0) {
    throw new Error('derivationKeys must not be empty');
  }

  mKey = Buffer.concat([mKey, Buffer.from([0])]);
  let addr = Hash('module', Buffer.concat([mKey, derivationKeys[0]]));

  for (let i = 1; i < derivationKeys.length; i++) {
    addr = Derive(addr, derivationKeys[i]);
  }

  return addr;
}

function Hash(typ: string | Buffer, key: Buffer) {
  const hasher = crypto.createHash('sha256');
  hasher.update(typ);
  const th = hasher.digest();

  const hasher2 = crypto.createHash('sha256');
  hasher2.update(th);
  hasher2.update(key);
  const finalDigest = hasher2.digest().toString('hex');
  return finalDigest;
}

function Derive(address: string, key: Buffer) {
  return Hash(Buffer.from(address, 'hex'), key);
}

function uint64ToBufferBE(number: string | number): Buffer {
  number = Number(number);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(number / 0x100000000), 0);
  buffer.writeUInt32BE(number >>> 0, 4);
  return buffer;
}

/**
 * Generates a non-claimable alias address. For badge module derivations, use module name = "badges". Get the detivation keys from `getAliasDerivationKeysForBadge` or `getAliasDerivationKeysForCollection`.
 * For lists, get the derivation keys from `getAliasDerivationKeysForList`.
 *
 * @category Aliases
 */
export function generateAlias(moduleName: string, derivationKeys: Buffer[]) {
  const address = Module(moduleName, ...derivationKeys);
  const cosmosPrefix = 'bb';
  const words = bech32.toWords(Buffer.from(address, 'hex'));
  const bech32Address = bech32.encode(cosmosPrefix, words);
  return bech32Address;
}

/**
 * Derivation keys for a badge alias to be used in `generateAlias`.
 *
 * @category Aliases
 */
export function getAliasDerivationKeysForBadge(collectionId: CollectionId, tokenId: string | number) {
  const collectionIdNum = Number(collectionId.split('-')[0]);

  const derivationKey = [Buffer.from([AccountGenerationPrefix]), uint64ToBufferBE(collectionIdNum), uint64ToBufferBE(tokenId)];
  return derivationKey;
}

/**
 * Derivation keys for a collection alias to be used in `generateAlias`.
 *
 * @category Aliases
 */
export function getAliasDerivationKeysForCollection(collectionId: CollectionId) {
  const collectionIdNum = Number(collectionId.split('-')[0]);
  const derivationKey = [Buffer.from([AccountGenerationPrefix]), uint64ToBufferBE(collectionIdNum)];
  return derivationKey;
}

/**
 * Derivation keys for a list alias to be used in `generateAlias`.
 *
 * For this, we use an incrementing ID, similar to collections on-chain.
 *
 * @category Aliases
 */
export function getAliasDerivationKeysForList(id: string | number) {
  const derivationKey = [Buffer.from([AddressGenerationPrefix]), uint64ToBufferBE(id)];
  return derivationKey;
}

/**
 * Generate denom alias address for account
 *
 * @category Aliases
 */
export function getAliasDerivationKeysForDenom(denom: string) {
  const derivationKey = [Buffer.from([DenomGenerationPrefix]), Buffer.from(denom, 'utf8')];
  return derivationKey;
}

/**
 * Generate denom alias address for account
 *
 * @category Aliases
 */
export function generateAliasAddressForDenom(denom: string) {
  const derivationKey = getAliasDerivationKeysForDenom(denom);
  return generateAlias('badges', derivationKey);
}

/**
 * Derivation keys for an IBC backed denom alias to be used in `generateAlias`.
 *
 * @category Aliases
 */
export function getAliasDerivationKeysForIBCBackedDenom(ibcDenom: string) {
  const derivationKey = [Buffer.from([BackedPathGenerationPrefix]), Buffer.from(ibcDenom, 'utf8')];
  return derivationKey;
}

/**
 * Generate IBC backed denom alias address for account
 *
 * @category Aliases
 */
export function generateAliasAddressForIBCBackedDenom(ibcDenom: string) {
  const derivationKey = getAliasDerivationKeysForIBCBackedDenom(ibcDenom);
  return generateAlias('badges', derivationKey);
}

const SenderPrefix = 'ibc-hook-intermediary';

/**
 * SHA256 hash function using Node.js crypto.
 * Takes a Uint8Array and returns a Uint8Array of the hash.
 */
function sha256(data: Uint8Array): Uint8Array {
  const hash = crypto.createHash('sha256');
  hash.update(Buffer.from(data));
  return new Uint8Array(hash.digest());
}

/**
 * Convert bytes to bech32 address using the bech32 library.
 * Takes a prefix string and Uint8Array bytes, returns bech32 encoded string.
 */
function toBech32(prefix: string, data: Uint8Array): string {
  const words = bech32.toWords(Buffer.from(data));
  return bech32.encode(prefix, words);
}

/**
 * Derive an intermediate sender address for an IBC transfer hook.
 *
 * @category Aliases
 */
export function deriveIntermediateSender(channel: string, originalSender: string, bech32Prefix: string): string {
  try {
    // Step 1: Format as "channel/originalSender" (matching Go's fmt.Sprintf("%s/%s", channel, originalSender))
    const senderStr = `${channel}/${originalSender}`;

    // Step 2: Hash with prefix (matching Go's address.Hash(SenderPrefix, []byte(senderStr)))
    // address.Hash does: sha256(sha256(prefix) + data)
    // First hash the prefix, then concatenate with data, then hash again
    const prefixBytes = new Uint8Array(Buffer.from(SenderPrefix, 'utf8'));
    const senderStrBytes = new Uint8Array(Buffer.from(senderStr, 'utf8'));
    const hashedPrefix = sha256(prefixBytes);
    const combined = new Uint8Array(hashedPrefix.length + senderStrBytes.length);
    combined.set(hashedPrefix, 0);
    combined.set(senderStrBytes, hashedPrefix.length);
    const hash = sha256(combined);

    // Step 3: Use full 32-byte hash for address
    // Note: While Go's types.AccAddress is typically 20 bytes, the bech32 encoding
    // of the full hash matches the expected output
    const addressBytes = hash;

    // Step 4: Convert to bech32 (matching Go's types.Bech32ifyAddressBytes)
    const intermediateSenderBech32 = toBech32(bech32Prefix, addressBytes);

    return intermediateSenderBech32;
  } catch (error) {
    console.error('Failed to derive intermediate sender:', error);
    throw new Error(`Failed to derive intermediate sender: ${error instanceof Error ? error.message : String(error)}`);
  }
}
