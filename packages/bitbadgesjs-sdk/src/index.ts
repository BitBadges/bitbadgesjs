declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

//check if process is defined
if (typeof process === 'undefined') {
  //for the chrome extension
} else {
  process.env.BBS_SIGNATURES_MODE = 'WASM';
}

export * from './core/index';
export * from './api-indexer/index';
export * from './common/index';
export * from './interfaces/index';
/**
 * @category Proto
 */
export * as proto from './proto/index';
export * from './transactions/index';
export * from './address-converter/index';
export * from './auth/index';
