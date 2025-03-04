/**
 * A little hacky way to extend the built-in Array class to allow for type checking.
 *
 * ElementType[]:
 * Actually, behind the scenes, the base Array class uses the wrapped type, so here we just need to do hacky type casting
 * wherever ElementType[] is used.
 *
 * ElementType (singular):
 * If ElementType is returned, that is fine.
 * If ElementType is used as a callback, that is fine. It is inferred and offers the extended functionality.
 * If ElementType is used as a parameter, it is fine but if we want to allow for using the iType interface instead of needing to call new Type(),
 * then we need to implement that in the child interface.
 *
 * The following functions use plain ElementType via a parameter. Consider extending to support iType instead.
 * concat, fill, push, with, indexOf, lastIndexOf, splice, unshift, includes
 *
 *
 * Although, note that includes, indexOf, lastIndexOf are equal to the === operator, so if we do new Type(iType) === element, then it will always be false.
 *
 * @category Utils
 */
export class BaseTypedArray<ArrayType extends ElementType[], ElementType> extends Array<ElementType> {
  //TODO: Support the other splice overloads with the ...items: ElementType[] parameter?
  //TODO: Support reduce / reduceRight
  //TODO: Other concat overload?
  //TODO: flat()?

  /**
   * @hidden
   */
  map<U>(callbackfn: (value: ElementType, index: number, array: ElementType[]) => U, thisArg?: any): U[] {
    return super.map(callbackfn as any, thisArg);
  }

  /**
   * @hidden
   */
  find<S extends ElementType>(predicate: (value: ElementType, index: number, obj: ElementType[]) => value is S, thisArg?: any): S | undefined;
  find(predicate: (value: ElementType, index: number, obj: ElementType[]) => unknown, thisArg?: any): ElementType | undefined;
  find(predicate: unknown, thisArg?: unknown): ElementType | undefined {
    return super.find(predicate as any, thisArg);
  }

  /**
   * @hidden
   */
  findLast<S extends ElementType>(predicate: (value: ElementType, index: number, array: ElementType[]) => value is S, thisArg?: any): S | undefined;
  findLast(predicate: (value: ElementType, index: number, array: ElementType[]) => unknown, thisArg?: any): ElementType | undefined;
  findLast(predicate: unknown, thisArg?: unknown): ElementType | undefined {
    return super.findLast(predicate as any, thisArg);
  }

  /**
   * @hidden
   */
  findLastIndex(predicate: (value: ElementType, index: number, array: ElementType[]) => unknown, thisArg?: any): number {
    return super.findLastIndex(predicate as any, thisArg);
  }

  /**
   * @hidden
   */
  findIndex(predicate: (value: ElementType, index: number, obj: ElementType[]) => unknown, thisArg?: any): number {
    return super.findIndex(predicate as any, thisArg);
  }

  /**
   * @hidden
   */
  filter(predicate: (value: ElementType, index: number, array: ElementType[]) => unknown, thisArg?: any): ArrayType {
    return super.filter(predicate as any, thisArg) as any;
  }
  /**
   * @hidden
   */
  reverse(): ArrayType {
    return super.reverse() as ArrayType;
  }
  /**
   * @hidden
   */
  slice(start?: number, end?: number): ArrayType {
    return super.slice(start, end) as ArrayType;
  }
  /**
   * @hidden
   */
  concat(...items: ConcatArray<ElementType>[]): ArrayType {
    return super.concat(...items) as ArrayType;
  }
  /**
   * @hidden
   */
  splice(start: number, deleteCount?: number): ArrayType {
    return super.splice(start, deleteCount) as ArrayType;
  }
  /**
   * @hidden
   */
  toSpliced(start: number, deleteCount?: number): ArrayType {
    return super.splice(start, deleteCount) as ArrayType;
  }

  /**
   * @hidden
   */
  every<S extends ElementType>(predicate: (value: ElementType, index: number, array: ElementType[]) => value is S, thisArg?: any): this is S[];
  every(predicate: (value: ElementType, index: number, array: ElementType[]) => unknown, thisArg?: any): boolean;
  every(predicate: unknown, thisArg?: unknown): boolean {
    return super.every(predicate as any, thisArg);
  }

  /**
   * @hidden
   */
  some(callback: (value: ElementType, index: number, array: ElementType[]) => unknown, thisArg?: any): boolean {
    return super.some(callback as any, thisArg);
  }

  /**
   * @hidden
   */
  forEach(callback: (value: ElementType, index: number, array: ElementType[]) => void, thisArg?: any): void {
    super.forEach(callback as any, thisArg);
  }
  /**
   * @hidden
   */
  toReversed(): ArrayType {
    return super.reverse() as ArrayType;
  }
  /**
   * @hidden
   */
  toSorted(compareFn?: (a: ElementType, b: ElementType) => number): ArrayType {
    return super.toSorted(compareFn) as ArrayType;
  }
  /**
   * @hidden
   */
  with(index: number, value: ElementType): ArrayType {
    return super.with(index, value) as ArrayType;
  }

  /**
   * @hidden
   */
  flatMap<U, This = undefined>(
    callback: (this: This, value: ElementType, index: number, array: ElementType[]) => U | readonly U[],
    thisArg?: This | undefined
  ): U[] {
    return super.flatMap(callback as any, thisArg) as U[];
  }


  /**
   * @hidden
   */
  flat<A, D extends number = 1>(this: A, depth?: D | undefined): FlatArray<A, D>[] {
    return super.flat(depth) as FlatArray<A, D>[];
  }
}
