import type { NumberType } from './string-numbers.js';

/**
 * Max value for a uint64.
 *
 * @category Math
 */
export const GO_MAX_UINT_64 = 18446744073709551615n;

/**
 * Safe adds two uints and returns an error if the result is invalid.
 *
 * Note this doesn't actually overflow because we use bigint. This returns an error
 * if either of the inputs are negative.
 *
 * @category Math
 */
export function safeAdd<T extends NumberType>(a: T, b: T): T {
  if (typeof a !== typeof b) {
    throw new Error('mismatched types for uint64 addition');
  }

  //Takes a little hardcoding to make the types work
  let result: T;
  if (typeof a === 'bigint' && typeof b === 'bigint') {
    result = (a + b) as T;
  } else if (typeof a === 'string' && typeof b === 'string') {
    result = (BigInt(a) + BigInt(b)).toString() as T;
  } else {
    result = (Number(a) + Number(b)) as T;
  }

  return result;
}

/**
 * Safe subtracts two uints and returns an error if the result is invalid.
 *
 * Underflows when result is less than 0.
 *
 * @category Math
 */
export function safeSubtract<T extends NumberType>(left: T, right: T, allowNegative = false): T {
  if (typeof left !== typeof right) {
    throw new Error('mismatched types for uint64 subtraction');
  }

  //Takes a little hardcoding to make the types work
  let result: T;
  if (typeof left === 'bigint' && typeof right === 'bigint') {
    result = (left - right) as T;
  } else if (typeof left === 'string' && typeof right === 'string') {
    result = (BigInt(left) - BigInt(right)).toString() as T;
  } else {
    result = (Number(left) - Number(right)) as T;
  }

  const isNegative = BigInt(result) < 0;
  if (isNegative && !allowNegative) {
    throw new Error('Underflow when subtracting uint64s');
  }

  return result;
}

/**
 * Safe casts a value to an expected type. First paramter is an example of the expected type. Second parameter is the value to cast.
 *
 * @category Math
 */
export function castNumberType<T extends NumberType>(expectedType: T, valToCast: NumberType): T {
  if (typeof expectedType === 'bigint') {
    return BigInt(valToCast) as T;
  } else if (typeof expectedType === 'string') {
    return valToCast.toString() as T;
  } else if (typeof expectedType === 'number') {
    return Number(valToCast) as T;
  }

  throw new Error('invalid type');
}

/**
 * Safe subtracts two uints and returns an error if the result is invalid. Keeps the left type.
 *
 * @category Math
 */
export function safeSubtractKeepLeft<T extends NumberType>(left: T, right: NumberType): T {
  return safeSubtract(left, castNumberType(left, right)) as T;
}

/**
 * Safe subtracts two uints and returns an error if the result is invalid. Keeps the right type.
 *
 * @category Math
 */
export function safeSubtractKeepRight<T extends NumberType>(left: NumberType, right: T): T {
  return safeSubtract(castNumberType(right, left), right) as T;
}

/**
 * Safe adds two uints and returns an error if the result is invalid. Keeps the left type.
 *
 * @category Math
 */
export function safeAddKeepLeft<T extends NumberType>(left: T, right: NumberType): T {
  return safeAdd(left, castNumberType(left, right)) as T;
}

/**
 * Safe adds two uints and returns an error if the result is invalid. Keeps the right type.
 *
 * @category Math

 */
export function safeAddKeepRight<T extends NumberType>(left: NumberType, right: T): T {
  return safeAdd(castNumberType(right, left), right) as T;
}

/**
 * Safe multiplies two uints and returns an error if the result is invalid.
 *
 * @category Math
 */
export function safeMultiply<T extends NumberType>(left: T, right: T): T {
  if (typeof left !== typeof right) {
    throw new Error('mismatched types for uint64 multiplication');
  }

  //Takes a little hardcoding to make the types work
  let result: T;
  if (typeof left === 'bigint' && typeof right === 'bigint') {
    result = (left * right) as T;
  } else if (typeof left === 'string' && typeof right === 'string') {
    result = (BigInt(left) * BigInt(right)).toString() as T;
  } else {
    result = (Number(left) * Number(right)) as T;
  }

  return result;
}

/**
 * Safe multiplies two uints and returns an error if the result is invalid. Keeps the left type.
 *
 * @category Math
 */
export function safeMultiplyKeepLeft<T extends NumberType>(left: T, right: NumberType): T {
  return safeMultiply(left, castNumberType(left, right)) as T;
}

/**
 * Safe multiplies two uints and returns an error if the result is invalid. Keeps the right type.
 *
 * @category Math
 */
export function safeMultiplyKeepRight<T extends NumberType>(left: NumberType, right: T): T {
  return safeMultiply(castNumberType(right, left), right) as T;
}

/**
 * Min of two bigints.
 *
 * @category Math
 */
export function bigIntMin<T extends NumberType>(a: T, b: T): T {
  return a > b ? b : a;
}

/**
 * Max of two bigints.
 *
 * @category Math
 */
export function bigIntMax<T extends NumberType>(a: T, b: T): T {
  return a > b ? a : b;
}
