/**
 * BB-34 follow-up — the API/type-conversion layer must carry hash-derived
 * post-v34 account numbers (> 2^53) without corruption.
 *
 * The signing pipeline was fixed in 0.43.1. This pins the NON-signing side:
 * `accountNumber`/`sequence` are NumberType generics converted through
 * `getNumberFieldNames()`, so the converter the consumer picks decides
 * whether the value survives. `BigIntify`/`Stringify`/`NumberifyIfPossible`
 * must round-trip exactly; `Numberify` is inherently lossy (documented, not
 * throwing) — that hazard is pinned here so a behavior change is deliberate.
 */
import { BigIntify, Numberify, NumberifyIfPossible, Stringify } from '@/common/string-numbers.js';
import { AccountDoc } from './docs-types/docs.js';

const BIG_ACCOUNT = '11715262360359940575'; // live post-v34 mainnet assignment
const BIG_ACCOUNT_BIGINT = 11715262360359940575n;
const BIG_SEQUENCE = '1756500000000000123'; // nanosecond unordered-tx nonce

function makeDoc() {
  return new AccountDoc<string>({
    _docId: 'test',
    publicKey: '',
    accountNumber: BIG_ACCOUNT,
    pubKeyType: 'secp256k1',
    bitbadgesAddress: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
    ethAddress: '0x0000000000000000000000000000000000000000',
    sequence: BIG_SEQUENCE,
    balances: []
  });
}

describe('BB-34 — account numbers > 2^53 through the conversion layer', () => {
  it('BigIntify round-trips accountNumber and sequence exactly', () => {
    const doc = makeDoc().convert(BigIntify);
    expect(doc.accountNumber).toBe(BIG_ACCOUNT_BIGINT);
    expect(doc.sequence).toBe(1756500000000000123n);
  });

  it('Stringify round-trips exactly (bigint → string → bigint)', () => {
    const doc = makeDoc().convert(BigIntify).convert(Stringify);
    expect(doc.accountNumber).toBe(BIG_ACCOUNT);
    expect(doc.sequence).toBe(BIG_SEQUENCE);
    expect(BigInt(doc.accountNumber)).toBe(BIG_ACCOUNT_BIGINT);
  });

  it('NumberifyIfPossible falls back to the exact string instead of corrupting', () => {
    const doc = makeDoc().convert(NumberifyIfPossible as any);
    expect(doc.accountNumber).toBe(BIG_ACCOUNT);
    expect(doc.sequence).toBe(BIG_SEQUENCE);
  });

  it('Numberify is lossy for these values — the documented hazard', () => {
    // Deliberately pinned: Numberify silently rounds above 2^53, so it must
    // never be used on accountNumber/sequence (see the iAccountDoc JSDoc).
    // If Numberify's behavior is ever changed to throw, update this test
    // consciously — it guards against an *accidental* semantics change.
    const doc = makeDoc().convert(Numberify);
    expect(BigInt(doc.accountNumber)).not.toBe(BIG_ACCOUNT_BIGINT);
    expect(doc.accountNumber).toBe(Number(BIG_ACCOUNT));
  });
});
