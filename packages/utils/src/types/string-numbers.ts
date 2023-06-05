export type NumberType = bigint | number | StringNumber | string;

//Non string number types
export type JSNumber = bigint | number;

export function convertNumberType<T extends NumberType, U extends NumberType>(item: T): U {
  if (typeof item === 'bigint') {
    return BigInt(item) as U;
  } else if (typeof item === 'number') {
    return Number(item) as U;
  } else {
    return item.toString() as U;
  }
}

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
 * @typedef {Object} StringNumber
 * @property {string} s - The string representation of the number.
 * @property {number} n - The number representation of the number.
 *
 * @example
 * const item: StringNumber = {
 *    s: '1000000',
 *    n: 1000000,
 * }
 */
export type StringNumber = string | number;

export enum StringNumberStorageOptions {
  String = 'String',
  Number = 'Number',
  NumberIfPossible = 'NumberIfPossible',
}

export function toStringNumber(_item: bigint | string | number, options?: StringNumberStorageOptions): StringNumber {
  const item = BigInt(_item);
  if (options === StringNumberStorageOptions.String) {
    return item.toString();
  } else if (options === StringNumberStorageOptions.Number) {
    return Number(item);
  }

  if (item >= Number.MAX_SAFE_INTEGER) {
    return item.toString();
  } else {
    return Number(item);
  }
}
