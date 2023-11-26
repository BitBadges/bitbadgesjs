/**
 * NumberType is a type that can be used to represent a number in JavaScript in multiple ways.
 * Because the blockchain supports numbers > 2^53, we need to use BigInts or strings to represent them.
 *
 * NumberType is a union of all the types that can be used to represent a number in JavaScript.
 *
 * @category Number Types
 */
export type NumberType = bigint | number | string | boolean;

/**
 * JSPrimitiveNumberType is a type that can be used to represent a number in JavaScript in multiple ways.
 * Because the blockchain supports numbers > 2^53, we need to use BigInts or strings to represent them.
 *
 * JSPrimitiveNumberType is a union of all the types that can be used to represent a number in JavaScript.
 * This is the same as NumberType, but without BigInts because they are not a primitive.
 *
 * @category Number Types
 */
export type JSPrimitiveNumberType = string | number | boolean;

/**
 * BigIntify takes a NumberType and returns its BigInt equivalent.
 *
 * @category Number Types
 */
export const BigIntify = (item: NumberType) => numberify(item, StringNumberStorageOptions.BigInt) as bigint;
/**
 * Stringify takes a NumberType and returns its string equivalent.
 *
 * @category Number Types
 */
export const Stringify = (item: NumberType) => numberify(item, StringNumberStorageOptions.String) as string;
/**
 * Numberify takes a NumberType and returns its JavaScript number equivalent.
 *
 * @category Number Types
 */
export const Numberify = (item: NumberType) => numberify(item, StringNumberStorageOptions.Number) as number;
/**
 * NumberifyIfPossible takes a NumberType and returns its JavaScript number equivalent if possible, otherwise returns its string equivalent.
 *
 * @category Number Types
 */
export const NumberifyIfPossible = (item: NumberType) => numberify(item, StringNumberStorageOptions.NumberIfPossible) as number | string;


enum StringNumberStorageOptions {
  String = 'String',
  BigInt = 'BigInt',
  Number = 'Number',
  NumberIfPossible = 'NumberIfPossible',
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
