export type NumberType = bigint | number | string | boolean;
export type JSPrimitiveNumberType = string | number | boolean;

export const BigIntify = (item: NumberType) => numberify(item, StringNumberStorageOptions.String) as bigint;
export const Stringify = (item: NumberType) => numberify(item, StringNumberStorageOptions.String) as string;
export const Numberify = (item: NumberType) => numberify(item, StringNumberStorageOptions.Number) as number;
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
 */
// export interface JSPrimitiveNumberType DEPRECATED in favor of native primitive types. Use NumberType and numberify() instead.

export enum StringNumberStorageOptions {
  String = 'String',
  Number = 'Number',
  NumberIfPossible = 'NumberIfPossible',
}

export function numberify(_item: NumberType, options?: StringNumberStorageOptions): NumberType {
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
