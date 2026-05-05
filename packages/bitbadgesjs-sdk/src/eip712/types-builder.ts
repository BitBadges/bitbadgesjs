import { isPlainObject, msgFieldForIndex } from './message.js';
import { prefixForSubField, sanitizeTypedef, typeDefForPrefix, typeDefWithIndex, SANITIZE_ROOT_PREFIX } from './sanitize.js';
import type { EIP712TypeField, EIP712Types } from './types.js';

const TX_FIELD = 'Tx';
const MSG_TYPE_FIELD = 'type';
const ETH_BOOL = 'bool';
const ETH_INT64 = 'int64';
const ETH_STRING = 'string';
const EMPTY_ARRAY_SENTINEL = 'string[]';
const MAX_DUPLICATE_TYPE_DEFS = 1000;

/**
 * Builds the EIP-712 type schema for a flattened Cosmos sign-doc payload.
 *
 * Mirrors `cosmos/evm/ethereum/eip712/types.go::createEIP712Types` plus the
 * recursion in `recursivelyAddTypesToRoot`. Any deviation here changes the
 * EIP-712 hash and breaks chain-side verification, so this file is
 * intentionally a near-line-for-line port.
 */
export function buildEIP712Types(flattenedPayload: Record<string, unknown>, numPayloadMsgs: number): EIP712Types {
  const types: EIP712Types = {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'string' },
      { name: 'salt', type: 'string' }
    ],
    Tx: [
      { name: 'account_number', type: 'string' },
      { name: 'chain_id', type: 'string' },
      { name: 'fee', type: 'Fee' },
      { name: 'memo', type: 'string' },
      { name: 'sequence', type: 'string' }
      // timeout_height intentionally omitted — see Go reference comment.
    ],
    Fee: [
      { name: 'amount', type: 'Coin[]' },
      { name: 'gas', type: 'string' }
    ],
    Coin: [
      { name: 'denom', type: 'string' },
      { name: 'amount', type: 'string' }
    ]
  };

  for (let i = 0; i < numPayloadMsgs; i++) {
    const field = msgFieldForIndex(i);
    const msg = flattenedPayload[field];
    if (!isPlainObject(msg)) {
      throw new Error(`eip712: ${field} is not a JSON object`);
    }
    addMsgTypesToRoot(types, field, msg);
  }

  return types;
}

function addMsgTypesToRoot(types: EIP712Types, msgField: string, msg: Record<string, unknown>): void {
  const msgRootType = computeMsgRootType(msg);
  const msgTypeDef = recursivelyAddTypesToRoot(types, msgRootType, SANITIZE_ROOT_PREFIX, msg);

  // Append the message's typedef pairing onto the Tx schema in arrival order.
  types[TX_FIELD].push({ name: msgField, type: msgTypeDef });
}

function computeMsgRootType(msg: Record<string, unknown>): string {
  const msgType = msg[MSG_TYPE_FIELD];
  if (typeof msgType !== 'string' || msgType === '') {
    throw new Error('eip712: msg is missing a `type` string field');
  }
  // "cosmos-sdk/MsgSend" -> "TypeMsgSend"
  const tokens = msgType.split('/');
  const signature = tokens[tokens.length - 1];
  return `Type${signature}`;
}

function recursivelyAddTypesToRoot(
  typeMap: EIP712Types,
  rootType: string,
  prefix: string,
  payload: Record<string, unknown>
): string {
  const typesToAdd: EIP712TypeField[] = [];
  const typeDef = typeDefForPrefix(prefix, rootType);

  // Reverse-alphabetical key order (matches `strings.Compare(keys[i], keys[j]) > 0`).
  const sortedKeys = Object.keys(payload).sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));

  for (const fieldName of sortedKeys) {
    let field = payload[fieldName];
    if (field === undefined || field === null) continue;

    let isCollection = false;
    if (Array.isArray(field)) {
      if (field.length === 0) {
        // Empty arrays default to string[] — we can't introspect the element type.
        typesToAdd.push({ name: fieldName, type: EMPTY_ARRAY_SENTINEL });
        continue;
      }
      field = field[0];
      isCollection = true;
    }

    const ethType = ethTypeForJSValue(field);
    if (ethType !== '') {
      typesToAdd.push({ name: fieldName, type: isCollection ? `${ethType}[]` : ethType });
      continue;
    }

    if (isPlainObject(field)) {
      const fieldPrefix = prefixForSubField(prefix, fieldName);
      let fieldTypeDef = recursivelyAddTypesToRoot(typeMap, rootType, fieldPrefix, field);
      fieldTypeDef = sanitizeTypedef(fieldTypeDef);
      typesToAdd.push({ name: fieldName, type: isCollection ? `${fieldTypeDef}[]` : fieldTypeDef });
      continue;
    }

    // Anything else (functions, symbols, BigInts that slipped through) is a
    // bug at the producer side — surface loudly rather than silently coerce.
    throw new Error(`eip712: unsupported value at ${prefix}.${fieldName}`);
  }

  return addTypesToRoot(typeMap, typeDef, typesToAdd);
}

function ethTypeForJSValue(v: unknown): string {
  if (typeof v === 'boolean') return ETH_BOOL;
  // gjson treats every JSON number as a number; the Go reference maps it to
  // int64. The Amino sign doc emits all numerics as strings (account_number,
  // sequence, amounts, gas, ...), so we should rarely hit this branch in
  // practice — kept for parity with the reference.
  if (typeof v === 'number') return ETH_INT64;
  if (typeof v === 'string') return ETH_STRING;
  return '';
}

function addTypesToRoot(typeMap: EIP712Types, typeDef: string, types: EIP712TypeField[]): string {
  let indexAsDuplicate = 0;
  for (;;) {
    const indexedTypeDef = typeDefWithIndex(typeDef, indexAsDuplicate);
    const existing = typeMap[indexedTypeDef];

    if (existing && typesAreEqual(types, existing)) {
      return indexedTypeDef;
    }
    if (!existing) {
      typeMap[indexedTypeDef] = types;
      return indexedTypeDef;
    }
    indexAsDuplicate++;
    if (indexAsDuplicate >= MAX_DUPLICATE_TYPE_DEFS) {
      throw new Error('eip712: exceeded maximum duplicate type-def slots');
    }
  }
}

function typesAreEqual(a: EIP712TypeField[], b: EIP712TypeField[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].name !== b[i].name || a[i].type !== b[i].type) return false;
  }
  return true;
}
