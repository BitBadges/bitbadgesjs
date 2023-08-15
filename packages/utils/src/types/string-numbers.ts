/**
 * @category Number Types
 */
export type NumberType = bigint | number | string | boolean;
/**
 * @category Number Types
 */
export type JSPrimitiveNumberType = string | number | boolean;

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

/**
 * Struct to represent a numeric value as both a string and a JavaScript number.
 * This is what we will store in the CouchDB database to avoid precision issues with JavaScript numbers.
 *
 * For ease of use, this will only be used for values from the blockchain which can be > 2^53 or Number.MAX_SAFE_INTEGER.
 * For all other values, we will use JavaScript numbers. One example is Cosmos SDK coin amounts, which are represented as strings
 * and can be > 2^53 (e.g. { amount: '10000000000000000000000000000000000', denom: 'badge' }). Another is badge IDs.
 *
 * We will use this for both storing within CouchDB and for sending over the API HTTP.
 *
 * By default, we will attempt to store the value in the database as a JavaScript number if possible (for CouchDB compatibility).
 * If not, we will store it as a string. For queries, we need to handle both cases which can be done by checking the $type field with Mango.
 *
 * @category Number Types
 */
export enum StringNumberStorageOptions {
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
