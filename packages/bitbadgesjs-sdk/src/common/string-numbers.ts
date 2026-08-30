/**
 * @category Number Types
 */
export type NumberType = bigint | number | string;

/**
 * @category Number Types
 */
export type JSPrimitiveNumberType = string | number;

/**
 * @category Number Types
 */
export const BigIntify = (item: NumberType) => numberify(item, StringNumberStorageOptions.BigInt) as bigint;

/**
 * @category Number Types
 */
export const Stringify = (item: NumberType) => numberify(item, StringNumberStorageOptions.String) as string;

/**
 * Converts to a JS `number`. **Lossy above 2^53** — `Number.MAX_SAFE_INTEGER` —
 * and it does NOT throw: values are silently rounded.
 *
 * Values that legitimately exceed 2^53 on BitBadges include uint64 range
 * sentinels (`18446744073709551615`), post-v34 hash-derived account numbers,
 * and nanosecond unordered-tx sequence nonces (BB-34). Never use `Numberify`
 * on data that must round-trip exactly — especially `accountNumber` and
 * `sequence`, which feed signing. Use `BigIntify`, `Stringify`, or
 * `NumberifyIfPossible` (which falls back to a string) instead.
 *
 * @category Number Types
 */
export const Numberify = (item: NumberType) => numberify(item, StringNumberStorageOptions.Number) as number;

/**
 * Like {@link Numberify}, but returns the exact decimal string instead of a
 * corrupted number when the value does not fit a safe integer.
 *
 * @category Number Types
 */
export const NumberifyIfPossible = (item: NumberType) => numberify(item, StringNumberStorageOptions.NumberIfPossible) as number | string;

enum StringNumberStorageOptions {
  String = 'String',
  BigInt = 'BigInt',
  Number = 'Number',
  NumberIfPossible = 'NumberIfPossible'
}

function numberify(_item: NumberType, options?: StringNumberStorageOptions): NumberType {
  const item = BigInt(_item);
  if (options === StringNumberStorageOptions.String) {
    return item.toString();
  } else if (options === StringNumberStorageOptions.Number) {
    return Number(item);
  } else if (options === StringNumberStorageOptions.BigInt) {
    return BigInt(item);
  }

  if (item >= Number.MAX_SAFE_INTEGER) {
    return item.toString();
  } else {
    return Number(item);
  }
}
