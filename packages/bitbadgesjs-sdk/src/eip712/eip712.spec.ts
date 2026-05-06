/**
 * Unit tests for the EIP-712 typed-data builder. Exercise:
 *   - Domain construction matches the Cosmos EVM constants.
 *   - sanitizeTypedef matches the Go reference's munging rules.
 *   - Message flattening converts `msgs[]` → `msg0/msg1/...`.
 *   - Type-tree generation is deterministic, dedup'd, and matches the
 *     reverse-alphabetical key order from the Go reference.
 *   - End-to-end round-trip: typed-data → ethers signTypedData → ecRecover
 *     yields the signer address.
 */

import { ethers } from 'ethers';
import {
  COSMOS_EVM_EIP712_DOMAIN_NAME,
  COSMOS_EVM_EIP712_DOMAIN_VERSION,
  COSMOS_EVM_EIP712_VERIFYING_CONTRACT,
  COSMOS_EVM_EIP712_SALT,
  createEIP712Domain
} from './domain.js';
import { flattenPayloadMessages, msgFieldForIndex } from './message.js';
import { sanitizeTypedef } from './sanitize.js';
import { encodeType, hashTypedData } from './hash.js';
import { buildEIP712Types } from './types-builder.js';
import { wrapTxToTypedData } from './wrap.js';

function msgSendSignDoc() {
  return {
    account_number: '0',
    chain_id: 'bitbadges_50025-1',
    fee: {
      amount: [{ amount: '1000', denom: 'ubadge' }],
      gas: '200000'
    },
    memo: '',
    msgs: [
      {
        type: 'cosmos-sdk/MsgSend',
        value: {
          from_address: 'bb1from',
          to_address: 'bb1to',
          amount: [{ amount: '100', denom: 'ubadge' }]
        }
      }
    ],
    sequence: '0'
  };
}

describe('eip712/domain', () => {
  it('builds the canonical Cosmos EVM domain', () => {
    const d = createEIP712Domain(50025);
    expect(d.name).toBe(COSMOS_EVM_EIP712_DOMAIN_NAME);
    expect(d.version).toBe(COSMOS_EVM_EIP712_DOMAIN_VERSION);
    expect(d.verifyingContract).toBe(COSMOS_EVM_EIP712_VERIFYING_CONTRACT);
    expect(d.salt).toBe(COSMOS_EVM_EIP712_SALT);
    expect(d.chainId).toBe(50025n);
  });

  it('accepts bigint chain id', () => {
    expect(createEIP712Domain(90123n).chainId).toBe(90123n);
  });
});

describe('eip712/sanitize', () => {
  it.each([
    ['_', 'Type'],
    ['_.value', 'TypeValue'],
    ['_.value.amount', 'TypeValueAmount'],
    ['_.foo_bar', 'TypeFooBar'],
    ['_.foo_bar.baz_qux', 'TypeFooBarBazQux']
  ])('sanitizeTypedef(%j) → %j', (input, expected) => {
    expect(sanitizeTypedef(input)).toBe(expected);
  });
});

describe('eip712/message', () => {
  it('flattens msgs into msg0/msg1', () => {
    const flat = flattenPayloadMessages({
      msgs: [{ a: 1 }, { b: 2 }],
      account_number: '0'
    });
    expect(flat.numPayloadMsgs).toBe(2);
    expect(flat.payload[msgFieldForIndex(0)]).toEqual({ a: 1 });
    expect(flat.payload[msgFieldForIndex(1)]).toEqual({ b: 2 });
    expect(flat.payload['msgs']).toBeUndefined();
    expect(flat.payload['account_number']).toBe('0');
  });

  it('throws on missing msgs field', () => {
    expect(() => flattenPayloadMessages({ account_number: '0' } as any)).toThrow(/no `msgs`/);
  });

  it('throws on non-array msgs field', () => {
    expect(() => flattenPayloadMessages({ msgs: 'oops' } as any)).toThrow(/array/);
  });

  it('throws on non-object msg', () => {
    expect(() => flattenPayloadMessages({ msgs: ['not-an-object'] } as any)).toThrow(/JSON object/);
  });
});

describe('eip712/types-builder', () => {
  it('emits the standard scaffolding types', () => {
    const { payload, numPayloadMsgs } = flattenPayloadMessages(msgSendSignDoc());
    const types = buildEIP712Types(payload, numPayloadMsgs);

    expect(Object.keys(types)).toEqual(expect.arrayContaining(['EIP712Domain', 'Tx', 'Fee', 'Coin']));
    // Scaffolding never gets reordered or stripped.
    expect(types.Coin).toEqual([
      { name: 'denom', type: 'string' },
      { name: 'amount', type: 'string' }
    ]);
  });

  it('appends msg0 to Tx schema with the sanitised root type', () => {
    const { payload, numPayloadMsgs } = flattenPayloadMessages(msgSendSignDoc());
    const types = buildEIP712Types(payload, numPayloadMsgs);

    // Tx.msg0 should point at TypeMsgSend{n} (n=0 unless dedup elsewhere).
    const msg0 = types.Tx.find((t) => t.name === 'msg0');
    expect(msg0).toBeDefined();
    expect(msg0!.type).toMatch(/^TypeMsgSend\d+$/);
  });

  it('orders fields reverse-alphabetically per the Go reference', () => {
    const { payload, numPayloadMsgs } = flattenPayloadMessages(msgSendSignDoc());
    const types = buildEIP712Types(payload, numPayloadMsgs);

    // _.value sorted descending: value > type, then within value:
    //   to_address > from_address > amount.
    // The exact dedup index can shift, so we look up the outer value type
    // through Tx → msg0 → typeName → its `value` field type.
    const msg0TypeName = types.Tx.find((t) => t.name === 'msg0')!.type;
    const valueTypeName = types[msg0TypeName].find((f) => f.name === 'value')!.type;
    const fields = types[valueTypeName].map((f) => f.name);
    expect(fields).toEqual(['to_address', 'from_address', 'amount']);
  });

  it('dedups identical nested types and indexes divergent ones', () => {
    // Two msgs with a `value.foo` sub-object that have DIFFERENT shapes.
    // The first becomes TypeValueFoo0, the second should be promoted to
    // TypeValueFoo1.
    const doc = {
      account_number: '0',
      chain_id: 'x',
      fee: { amount: [], gas: '0' },
      memo: '',
      sequence: '0',
      msgs: [
        { type: 'pkg/MsgA', value: { foo: { a: 'hello' } } },
        { type: 'pkg/MsgB', value: { foo: { b: 1 } } }
      ]
    };
    const { payload, numPayloadMsgs } = flattenPayloadMessages(doc);
    const types = buildEIP712Types(payload, numPayloadMsgs);

    const fooKeys = Object.keys(types).filter((k) => k.startsWith('TypeValueFoo'));
    expect(fooKeys.sort()).toEqual(['TypeValueFoo0', 'TypeValueFoo1']);
  });

  it('handles nested arrays of objects without panicking', () => {
    const { payload, numPayloadMsgs } = flattenPayloadMessages(msgSendSignDoc());
    const types = buildEIP712Types(payload, numPayloadMsgs);
    // Walk Tx → msg0 → value → amount and assert it resolves to a
    // collection type (TypeValueAmount[] or similar).
    const msg0TypeName = types.Tx.find((t) => t.name === 'msg0')!.type;
    const valueTypeName = types[msg0TypeName].find((f) => f.name === 'value')!.type;
    const amountField = types[valueTypeName].find((f) => f.name === 'amount');
    expect(amountField).toBeDefined();
    expect(amountField!.type).toMatch(/\[\]$/);
  });

  it('uses the string[] sentinel for empty arrays', () => {
    const doc = {
      account_number: '0',
      chain_id: 'x',
      fee: { amount: [], gas: '0' },
      memo: '',
      sequence: '0',
      msgs: [{ type: 'pkg/MsgEmpty', value: { tags: [] } }]
    };
    const { payload, numPayloadMsgs } = flattenPayloadMessages(doc);
    const types = buildEIP712Types(payload, numPayloadMsgs);

    const valueType = Object.entries(types).find(([k]) => k.startsWith('TypeValue'));
    const tagsField = valueType![1].find((f) => f.name === 'tags');
    expect(tagsField!.type).toBe('string[]');
  });
});

describe('eip712/wrap end-to-end', () => {
  it('produces a TypedData object with the expected shape', () => {
    const td = wrapTxToTypedData(msgSendSignDoc(), 50025);
    expect(td.primaryType).toBe('Tx');
    expect(td.domain.chainId).toBe(50025n);
    expect(td.types['EIP712Domain']).toBeDefined();
    expect(td.message.msg0).toBeDefined();
    expect((td.message as any).msgs).toBeUndefined();
  });

  // The canonical Cosmos EVM domain (`verifyingContract: "cosmos"`,
  // `salt: "0"`) is rejected by ethers v6's TypedDataEncoder, which
  // hard-codes those fields to `address` and `bytes32`. We use our own
  // `hashTypedData` (which respects the types map) and then sign the
  // resulting digest with any signer. MetaMask / Privy / Coinbase Smart
  // Wallet `eth_signTypedData_v4` produce the same digest for the same
  // input — they accept the typed-data object directly.
  it('round-trips through hashTypedData + ecRecover and recovers the signer', async () => {
    const td = wrapTxToTypedData(msgSendSignDoc(), 50025);

    const wallet = ethers.Wallet.createRandom();
    const digest = hashTypedData(td);
    const sig = wallet.signingKey.sign(digest).serialized;

    const recovered = ethers.recoverAddress(digest, sig);
    expect(recovered.toLowerCase()).toBe(wallet.address.toLowerCase());
  });

  // Sanity: the same input produces the same digest twice (no hidden
  // sources of nondeterminism like map iteration order).
  it('hashTypedData is deterministic', () => {
    const td = wrapTxToTypedData(msgSendSignDoc(), 50025);
    const a = hashTypedData(td);
    const b = hashTypedData(td);
    expect(ethers.hexlify(a)).toBe(ethers.hexlify(b));
  });

  // Encoded type signatures for the static scaffolding types must match
  // EIP-712 spec exactly — these are the constants the chain's Go
  // reference produces, so any divergence breaks signature verification.
  it('encodes scaffolding type signatures canonically', () => {
    const td = wrapTxToTypedData(msgSendSignDoc(), 50025);
    expect(encodeType('Coin', td.types)).toBe('Coin(string denom,string amount)');
    expect(encodeType('Fee', td.types)).toBe('Fee(Coin[] amount,string gas)Coin(string denom,string amount)');
    expect(encodeType('EIP712Domain', td.types)).toBe(
      'EIP712Domain(string name,string version,uint256 chainId,string verifyingContract,string salt)'
    );
  });
});
