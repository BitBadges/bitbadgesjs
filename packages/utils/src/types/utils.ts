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

  if (Array.isArray(obj)) {
    // Create a deep copy of an array
    return obj.map((item) => deepCopyWithBigInts(item)) as unknown as T;
  }

  // Create a deep copy of an object
  const copiedObj = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      copiedObj[key] = deepCopyWithBigInts(obj[key]);
    }
  }
  return copiedObj;
}


export function removeCouchDBDetails<T extends Object & { _id: string }>(x: T): T & Identified {
  return { ...x, _rev: undefined, _deleted: undefined }
}

export function getCouchDBDetails<T extends nano.Document & DeletableDocument>(x: T): nano.Document & DeletableDocument {
  return { _id: x._id, _rev: x._rev, _deleted: x._deleted }
}
