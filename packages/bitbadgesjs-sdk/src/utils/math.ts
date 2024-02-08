/**
 * Safe adds two uints and returns an error if the result is invalid.
 *
 * Note this doesn't actually overflow because we use bigint. This returns an error
 * if either of the inputs are negative.
 */
export function safeAddUints(a: bigint, b: bigint, allowNegative = false) {
  const result = a + b;
  if (allowNegative) return result;

  if (a < 0 || b < 0) {
    throw new Error("invalid uint64");
  }
  return result;
}

/**
 * Safe subtracts two uints and returns an error if the result is invalid.
 *
 * Underflows when result is less than 0.
 */
export function safeSubtractUints(left: bigint, right: bigint, allowNegative = false) {
  if (!allowNegative) {
    if (right > left) {
      throw new Error("underflow error");
    }

    if (left < 0 || right < 0) {
      throw new Error("invalid uint64");
    }
    return left - right;
  }

  return left - right;
}
