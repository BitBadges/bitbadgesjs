/**
 * EIP-712 hashing that respects user-supplied EIP712Domain types.
 *
 * Why this isn't `ethers.TypedDataEncoder`:
 *   ethers v6 hard-codes the EIP712Domain schema and coerces
 *   `verifyingContract` to `address` and `salt` to `bytes32`. The
 *   canonical Cosmos EVM domain uses both as literal strings
 *   (`verifyingContract: "cosmos"`, `salt: "0"`), so any chain that
 *   relies on the cosmos/evm ante handler's EIP-712 verification must
 *   hash them as `string`. Native MetaMask / Privy / Coinbase Smart
 *   Wallet `eth_signTypedData_v4` accept the typed-data object directly
 *   and produce the right hash; ethers does not.
 *
 * This module computes the EIP-712 digest exactly the way the chain's
 * `eip712.GetEIP712TypedDataForMsg` path does, by reading the schema
 * out of the supplied `types` map and not making any assumptions about
 * EIP712Domain field encodings. Pair with any signer that takes a raw
 * 32-byte digest.
 */
import { keccak256, toUtf8Bytes, AbiCoder, getBytes, concat } from 'ethers';
import type { EIP712Domain, EIP712TypedData, EIP712Types } from './types.js';

const HEX_PREFIX_19_01 = '0x1901';

/**
 * Computes the canonical EIP-712 digest for a `{ domain, types, primaryType, message }`
 * payload. The result is what an EVM wallet signs via personal_sign on the
 * digest, or equivalently what `eth_signTypedData_v4` derives internally.
 */
export function hashTypedData(typed: EIP712TypedData): Uint8Array {
  const domainHash = hashStruct('EIP712Domain', toDomainStruct(typed.domain), typed.types);
  const messageHash = hashStruct(typed.primaryType, typed.message, typed.types);
  return getBytes(keccak256(concat([HEX_PREFIX_19_01, domainHash, messageHash])));
}

/**
 * Returns the 32-byte hash of a single struct value. Useful for callers who
 * want to verify intermediate digests against the chain's Go reference.
 */
export function hashStruct(primaryType: string, value: Record<string, unknown>, types: EIP712Types): Uint8Array {
  return getBytes(keccak256(encodeData(primaryType, value, types)));
}

/**
 * Returns the canonical type signature string for `primaryType` and all of
 * its transitively-referenced struct types, in the order required by EIP-712
 * (primary first, then references sorted alphabetically by name).
 */
export function encodeType(primaryType: string, types: EIP712Types): string {
  const refs = collectReferencedTypes(primaryType, types);
  refs.delete(primaryType);
  const sortedRefs = Array.from(refs).sort();
  const ordered = [primaryType, ...sortedRefs];
  return ordered.map((t) => formatType(t, types[t])).join('');
}

function formatType(name: string, fields: { name: string; type: string }[] | undefined): string {
  if (!fields) {
    throw new Error(`eip712/hash: type '${name}' is missing from the types map`);
  }
  return `${name}(${fields.map((f) => `${f.type} ${f.name}`).join(',')})`;
}

function collectReferencedTypes(primaryType: string, types: EIP712Types, found: Set<string> = new Set()): Set<string> {
  if (found.has(primaryType)) return found;
  if (!types[primaryType]) return found;
  found.add(primaryType);
  for (const field of types[primaryType]) {
    const baseType = baseStructType(field.type);
    if (baseType && types[baseType]) {
      collectReferencedTypes(baseType, types, found);
    }
  }
  return found;
}

/** Returns the base struct type if `type` is a struct (or array of struct), otherwise null. */
function baseStructType(type: string): string | null {
  const stripped = type.replace(/(\[\d*\])+$/g, '');
  return stripped;
}

function encodeData(primaryType: string, value: Record<string, unknown>, types: EIP712Types): Uint8Array {
  const th = getBytes(keccak256(toUtf8Bytes(encodeType(primaryType, types))));
  const fields = types[primaryType];
  const encoded: Uint8Array[] = [th];
  for (const field of fields) {
    encoded.push(encodeField(field.type, value[field.name], types));
  }
  return getBytes(concat(encoded));
}

function encodeField(type: string, value: unknown, types: EIP712Types): Uint8Array {
  if (type === 'string') {
    return getBytes(keccak256(toUtf8Bytes(String(value ?? ''))));
  }
  if (type === 'bytes') {
    const bytes = typeof value === 'string' ? getBytes(value) : (value as Uint8Array);
    return getBytes(keccak256(bytes));
  }
  // Array (T[] or fixed-size T[N]). EIP-712 hashes arrays as
  // keccak256(concat(encodeField(T, v_i)) for i in 0..n).
  const arrayMatch = type.match(/^(.*)\[(\d*)\]$/);
  if (arrayMatch) {
    const elemType = arrayMatch[1];
    const arr = (value ?? []) as unknown[];
    if (!Array.isArray(arr)) {
      throw new Error(`eip712/hash: expected array at field of type ${type}, got ${typeof arr}`);
    }
    const parts = arr.map((v) => encodeField(elemType, v, types));
    return getBytes(keccak256(concat(parts.length === 0 ? [new Uint8Array(0)] : parts)));
  }
  if (types[type]) {
    return getBytes(keccak256(encodeData(type, (value ?? {}) as Record<string, unknown>, types)));
  }
  // Static primitive: bool, address, intN, uintN, bytesN.
  // ethers' AbiCoder produces 32-byte left-padded encoding for these,
  // which matches EIP-712's `enc(value)` for atomic types.
  return getBytes(AbiCoder.defaultAbiCoder().encode([type], [value]));
}

/**
 * Domain values come in as a typed `EIP712Domain` object (with a
 * `chainId: bigint`); the hasher needs them as a generic record so the
 * recursive walker can treat the domain like any other struct.
 */
function toDomainStruct(d: EIP712Domain): Record<string, unknown> {
  return {
    name: d.name,
    version: d.version,
    chainId: d.chainId,
    verifyingContract: d.verifyingContract,
    salt: d.salt
  };
}
