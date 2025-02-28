import type { JsonObject } from '@bufbuild/protobuf';
import type { NumberType } from './string-numbers.js';
import { BigIntify, Numberify, Stringify } from './string-numbers.js';

/**
 * @category API Requests / Responses
 */
export interface ParsedQs {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[];
}

/**
 * @category Utils
 */
export const parseArrayString = (str: undefined | string | string[] | ParsedQs | ParsedQs[]): undefined | string[] => {
  if (str === undefined) {
    return undefined;
  }

  if (typeof str === 'string') {
    try {
      return JSON.parse(str);
    } catch {
      return str.split(',');
    }
  }

  if (Array.isArray(str)) {
    return str.map((item) => item.toString());
  }

  return undefined;
};

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
  /**
   * Checks if the object has number fields.
   */
  hasNumberFields(): boolean;
}

/**
 * @category Utils
 */
export interface ConvertOptions {
  /**
   * Same object as the one passed in the convert function.
   *
   * By default, we create a deep copy of the object, but you can specify this if you are okay updating in-place.
   * This increases performance by a lot at scale since we don't need to deep copy the object.
   */
  keepOriginalObject?: boolean;
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

  hasNumberFields(): boolean {
    return false;
  }

  /**
   * @deprecated
   * This function is unnecessary as this field has no numeric types.
   * Please use the `.clone()` method instead.
   */
  convert<U extends NumberType>(_convertFunction?: (val: NumberType) => U, options?: ConvertOptions): CustomType<any> {
    return this.clone();
  }
}

/**
 * Base class that implements the CustomType interface. It provides default implementations for all methods.
 *
 * IMPORTANT: You must implement the `getNumberFieldNames` method yourself for this class to work properly.
 * Also, you will need to implement the `convert` method yourself if you want to use it in a typed manner. This
 * can be done by simply calling `convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options)` and casting the result to the correct type.
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

  hasNumberFields(): boolean {
    return true;
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): CustomType<any> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options);
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

  // Handle Arrays with a single loop
  if (Array.isArray(obj)) {
    const len = obj.length;
    const copy = new Array(len);
    for (let i = 0; i < len; i++) {
      copy[i] = deepCopyWithBigInts(obj[i]);
    }
    return copy as unknown as T;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return new Date(obj) as unknown as T;
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

//Attempt to get the current number type of the first present number field.
function getCurrentType<T extends CustomType<T>>(obj: T): 'string' | 'number' | 'bigint' | 'unknown' {
  let numberFields: string[] = [];
  //If the object implements the numberFields() method, then we know it's a NumberTypeConvertible object itself.
  //We can apply convertFunction to the number fields.
  if (typeof obj.getNumberFieldNames === 'function') {
    numberFields = obj.getNumberFieldNames();
  } else {
    return 'unknown';
  }

  for (const numberField of numberFields) {
    const value = (obj as any)[numberField];
    const valueType = typeof value;
    if (valueType === 'bigint' || valueType === 'number' || valueType === 'string') {
      return valueType;
    }
  }

  //If we didn't find any number fields, then we recursively check the fields of the object.
  const json: any = obj;
  for (const prop in json) {
    if (Object.prototype.hasOwnProperty.call(json, prop)) {
      const valueType = typeof json[prop] === 'object' && json[prop] !== null ? getCurrentType(json[prop]) : undefined;
      if (valueType && valueType !== 'unknown') {
        return valueType;
      }
    }
  }

  return 'unknown';
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
  convertFunction: (item: NumberType) => U,
  options?: ConvertOptions,
  depth = 0
): CustomType<any> {
  let numberFields: string[] = [];
  const Constructor = obj.constructor as new (data?: any) => any;

  //One huge optimization to avoid redundant conversions is to check if we are doing a bigint -> bigint conversion
  //Note we can't do this with string / numbers due to our NumberifyIfPossible approach)
  //If so, we can just apply the convertFunction to the value directly.
  const conversionType = typeof convertFunction(0);
  const isToBigInt = conversionType === 'bigint';
  if (depth === 0 && isToBigInt && getCurrentType(obj) === 'bigint') {
    return options?.keepOriginalObject ? obj : new Constructor(deepCopyPrimitives(obj));
  }

  //If the object implements the numberFields() method, then we know it's a NumberTypeConvertible object itself.
  //We can apply convertFunction to the number fields.
  if (typeof obj.getNumberFieldNames === 'function') {
    numberFields = obj.getNumberFieldNames();
  }

  const json: any = options?.keepOriginalObject ? obj : {};
  const object = obj as any;
  for (const prop in object) {
    if (Object.prototype.hasOwnProperty.call(object, prop)) {
      const value = object[prop];
      const valueType = typeof value;
      if (valueType !== 'undefined' && valueType !== 'function') {
        if (numberFields.includes(prop)) {
          if (valueType === 'bigint' || valueType === 'number' || valueType === 'string') {
            json[prop] = convertFunction(value);
          } else if (Array.isArray(value)) {
            json[prop] = value.map((item: any) => convertFunction(item));
          } else if (valueType === 'object' && value !== null) {
            for (const [key, val] of Object.entries(value)) {
              if (val !== undefined && val !== null) {
                value[key] = convertFunction(val as NumberType);
              }
            }
          }
        } else if (Array.isArray(value)) {
          //we assume no mixed types in arrays

          json[prop] = value.map((item: any) =>
            typeof item === 'object' && item !== null ? convertClassPropertiesAndMaintainNumberTypes(item, convertFunction, options, depth + 1) : item
          );
        } else if (typeof value === 'object' && value !== null) {
          json[prop] = convertClassPropertiesAndMaintainNumberTypes(value, convertFunction, options, depth + 1);
        } else {
          json[prop] = value;
        }
      }
    }
  }

  return depth === 0 ? (options?.keepOriginalObject ? json : new Constructor(deepCopyPrimitives(json))) : json;
}
