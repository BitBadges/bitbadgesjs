import type { NumberType } from './string-numbers.js';
import { BigIntify, Numberify, Stringify } from './string-numbers.js';
import type { JsonObject } from '@bufbuild/protobuf';

/**
 * The CustomType interface is the base interface for all custom types in the SDK. It provides methods for comparing, converting, and cloning objects.
 *
 * @category Utils
 */
export interface CustomType<T extends CustomType<T>> {
  /**
   * Compares this object's fields to another object's fields for equality. Equality is determined by comparing the JSON representations of the objects.
   *
   * If `normalizeNumberTypes` is true, then all number types will be compared as strings (i.e. "1n" === "1" === 1). Else, they will be compared as their native types (i.e. 1n !== 1 !== "1").
   */
  equals<U extends CustomType<U>>(other: CustomType<U> | undefined | null, normalizeNumberTypes?: boolean): boolean;
  /**
   * Converts the object to a JSON object with all primitive types.
   */
  toJson(): JsonObject;
  /**
   * Converts the object to a JSON string.
   */
  toJsonString(): string;
  /**
   * Deep copies the object and returns a new instance.
   */
  clone(): T;
  /**
   * Internal helper method to convert the number fields of the object to a different NumberType equivalent.
   */
  getNumberFieldNames(): string[];
  /**
   * Converts the object to a different NumberType equivalent.
   */
  convert<U extends NumberType>(convertFunction?: (val: NumberType) => U): CustomType<any>;
}

/**
 * Base class that implements the CustomType interface. It provides default implementations for all methods.
 * This is to be used when the class and all of its fields are of primitive types (i.e. no number types).
 *
 * @category Utils
 */
export class CustomTypeClass<T extends CustomType<T>> implements CustomType<T> {
  toJson(): JsonObject {
    return convertClassPropertiesToJson(this);
  }

  toJsonString(): string {
    return JSON.stringify(this.toJson());
  }

  equals<U extends CustomType<U>>(other: CustomType<U> | null | undefined, normalizeNumberTypes?: boolean | undefined): boolean {
    return compareCustomTypes(this, other, normalizeNumberTypes);
  }

  clone(): T {
    const deepCopied = deepCopyPrimitives(this.toJson());
    const Constructor = this.constructor as new (data?: JsonObject) => T;
    return new Constructor(deepCopied);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  /**
   * @deprecated
   * This function is unnecessary as this field has no numeric types.
   * Please use the `.clone()` method instead.
   */
  convert<U extends NumberType>(_convertFunction?: (val: NumberType) => U): CustomType<any> {
    return this.clone();
  }
}

/**
 * Base class that implements the CustomType interface. It provides default implementations for all methods.
 *
 * IMPORTANT: You must implement the `getNumberFieldNames` method yourself for this class to work properly.
 * Also, you will need to implement the `convert` method yourself if you want to use it in a typed manner. This
 * can be done by simply calling `convertClassPropertiesAndMaintainNumberTypes(this, convertFunction)` and casting the result to the correct type.
 *
 * @category Utils
 */
export abstract class BaseNumberTypeClass<T extends CustomType<T>> implements CustomType<T> {
  toJson(): JsonObject {
    return convertClassPropertiesToJson(this);
  }

  toJsonString(): string {
    return JSON.stringify(this.toJson());
  }

  equals<U extends CustomType<U>>(other: CustomType<U> | null | undefined, normalizeNumberTypes?: boolean | undefined): boolean {
    return compareCustomTypes(this, other, normalizeNumberTypes);
  }

  clone(): T {
    const deepCopied = deepCopyPrimitives(this.toJson());
    const Constructor = this.constructor as new (data?: JsonObject) => T;
    return new Constructor(deepCopied);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): CustomType<any> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction);
  }
}

/**
 * Gets the converter function for a given number type (i.e. the equivalent of BigIntify, Numberify, or Stringify).
 *
 * @param val A value of the expected number type.
 *
 * @category Utils
 */
export function getConverterFunction<T extends NumberType>(val: T): (item: NumberType) => T {
  if (typeof val === 'bigint') {
    return BigIntify as (item: NumberType) => T;
  } else if (typeof val === 'number') {
    return Numberify as (item: NumberType) => T;
  } else {
    return Stringify as (item: NumberType) => T;
  }
}

/**
 * Compares two objects for equality, accounting for bigints.
 *
 * @category Utils
 */
function compareObjects(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) {
    return true;
  }

  if (typeof obj1 !== typeof obj2 || typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
    return false;
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false;
  }

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) {
      return false;
    }

    for (let i = 0; i < obj1.length; i++) {
      if (!compareObjects(obj1[i], obj2[i])) {
        return false;
      }
    }
  } else {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!Object.prototype.hasOwnProperty.call(obj2, key) || !compareObjects(obj1[key], obj2[key])) {
        return false;
      }
    }
  }

  if (typeof obj1 === 'bigint' || typeof obj2 === 'bigint') {
    return BigInt(obj1) === BigInt(obj2);
  }

  return true;
}

/**
 * Deep copy a JSON object, preserving bigints. Should not be used to preserve class instances.
 *
 * @category Utils
 */
export function deepCopyPrimitives<T>(obj: T): T {
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

/**
 * Compares two CustomType objects for equality, accounting for bigints.
 *
 * @category Utils
 */
export function compareCustomTypes<T extends CustomType<T>, U extends CustomType<U>>(
  obj1: CustomType<T> | undefined | null,
  obj2: CustomType<U> | undefined | null,
  normalizeNumberTypes?: boolean
) {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 === undefined || obj1 === null || obj2 === undefined || obj2 === null) {
    return false;
  }

  // All number types will be stringified the same way (1n, 1, "1") -> "1"
  if (normalizeNumberTypes) {
    return compareObjects(obj1.convert(Stringify).toJson(), obj2.convert(Stringify).toJson());
  } else {
    return compareObjects(obj1.toJson(), obj2.toJson());
  }
}

/**
 * @category Utils
 */
export function compareNumberTypeConvertibles<T extends CustomType<T>, U extends CustomType<U>>(
  obj1: CustomType<T> | undefined | null,
  obj2: CustomType<U> | undefined | null,
  normalizeNumberTypes?: boolean
) {
  return compareCustomTypes(obj1, obj2, normalizeNumberTypes);
}

/**
 * Converts a class instance to a JSON object, accounting for bigints.
 * Does not preserve functions.
 *
 * @category Utils
 */
export function convertClassPropertiesToJson(obj: any): JsonObject {
  const json: JsonObject = {};

  for (const prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      const value = obj[prop];
      if (typeof value !== 'undefined' && typeof value !== 'function') {
        if (Array.isArray(value)) {
          json[prop] = value.map((item: any) =>
            typeof item === 'object' && item !== null && typeof item.toJson === 'function' ? item.toJson() : item
          );
        } else if (typeof value === 'object' && value !== null && typeof value.toJson === 'function') {
          json[prop] = value.toJson();
        } else {
          json[prop] = value;
        }
      }
    }
  }

  return json;
}

/**
 * @category Utils
 */
export function deepCopy<T extends CustomType<any>>(obj: T): T {
  return convertClassPropertiesAndMaintainNumberTypes(obj, (item) => deepCopyPrimitives(item)) as T;
}

/**
 * Converts the number fields of a class instance to their new type, while maintaining the rest of the class structure.
 *
 * Lastly, it recalls the constructor of the class with the new JSON object.
 *
 * @category Utils
 */
export function convertClassPropertiesAndMaintainNumberTypes<U extends NumberType>(
  obj: CustomType<any>,
  convertFunction: (item: NumberType) => U
): CustomType<any> {
  const json: any = {};
  //TODO: A better solution would be to do this dynamically based on the object's class.
  let numberFields: string[] = [];

  //If the object implements the numberFields() method, then we know it's a NumberTypeConvertible object itself.
  //We can apply convertFunction to the number fields.
  if (typeof obj.getNumberFieldNames === 'function') {
    numberFields = obj.getNumberFieldNames();
  }

  const object = obj as any;
  for (const prop in object) {
    if (Object.prototype.hasOwnProperty.call(object, prop)) {
      const value = object[prop];
      if (typeof value !== 'undefined' && typeof value !== 'function') {
        if (numberFields.includes(prop)) {
          if (typeof value === 'bigint' || typeof value === 'number' || typeof value === 'string') {
            json[prop] = convertFunction(value);
          } else if (Array.isArray(value)) {
            json[prop] = value.map((item: any) => convertFunction(item));
          } else if (typeof value === 'object' && value !== null) {
            for (const [key, val] of Object.entries(value)) {
              if (val !== undefined && val !== null) {
                value[key] = convertFunction(val as NumberType);
              }
            }
          }
        } else if (Array.isArray(value)) {
          json[prop] = value.map((item: any) =>
            typeof item === 'object' && item !== null ? convertClassPropertiesAndMaintainNumberTypes(item, convertFunction) : item
          );
        } else if (typeof value === 'object' && value !== null) {
          json[prop] = convertClassPropertiesAndMaintainNumberTypes(value, convertFunction);
        } else {
          json[prop] = value;
        }
      }
    }
  }

  const Constructor = obj.constructor as new (data?: any) => any;
  return new Constructor(deepCopyPrimitives(json));
}
