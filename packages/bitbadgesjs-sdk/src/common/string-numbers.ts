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
 * @category Number Types
 */
export const Numberify = (item: NumberType) => numberify(item, StringNumberStorageOptions.Number) as number;

/**
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
