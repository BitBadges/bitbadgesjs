declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

export * from './api-indexer/index';
export * from './core/index';
export * from './common/index';
export * from './interfaces/index';
/**
 * @category Proto
 */
export * as proto from './proto/index';
export * from './transactions/index';
export * from './address-converter/index';
