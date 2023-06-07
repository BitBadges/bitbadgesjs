import { CouchDBDetailsExcluded } from "./db"

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function removeCouchDBDetails<T extends Object>(x: T): T & CouchDBDetailsExcluded {
  return { ...x, _id: undefined, _rev: undefined, _deleted: undefined }
}
