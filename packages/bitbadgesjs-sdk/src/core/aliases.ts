import { CollectionId } from '@/interfaces/index.js';
import { bech32 } from 'bech32';
import crypto from 'crypto';
import type { NumberType } from '../common/string-numbers.js';

const AddressGenerationPrefix = 0x09;
const AccountGenerationPrefix = 0x08;
const DenomGenerationPrefix = 0x0c;

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

function uint64ToBufferBE(number: NumberType): Buffer {
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
export function getAliasDerivationKeysForBadge(collectionId: CollectionId, badgeId: NumberType) {
  const collectionIdNum = Number(collectionId.split('-')[0]);

  const derivationKey = [Buffer.from([AccountGenerationPrefix]), uint64ToBufferBE(collectionIdNum), uint64ToBufferBE(badgeId)];
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
export function getAliasDerivationKeysForList(id: NumberType) {
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
