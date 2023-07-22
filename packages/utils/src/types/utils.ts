import nano from "nano";
import { Identified, DeletableDocument } from "./db"

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


export function removeCouchDBDetails<T extends Object & { _id: string }>(x: T): T & Identified {
  return { ...x, _rev: undefined, _deleted: undefined }
}

export function getCouchDBDetails<T extends nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument>(x: T): nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument {
  return { _id: x._id, _rev: x._rev, _deleted: x._deleted }
}
