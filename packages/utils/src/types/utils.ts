
/**
 * Deep copies an object, including BigInts.
 */
export function deepCopy<T>(obj: T): T {
  return deepCopyWithBigInts(obj);
}

function deepCopyWithBigInts<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    // Base case: return primitive values as-is
    return obj;
  }

  if (typeof obj === 'bigint') {
    return BigInt(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    // Create a deep copy of an array
    return obj.map((item) => deepCopyWithBigInts(item)) as unknown as T;
  }

  const copiedObj: Record<string, any> = {};

  // Deep copy each property of the object
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copiedObj[key] = deepCopyWithBigInts(obj[key]);
    }
  }

  return copiedObj as unknown as T;
}
