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

export * from './core/index.js';
export * from './api-indexer/index.js';
export * from './common/index.js';
export * from './interfaces/index.js';
export * as proto from './proto/index.js';
export * from './proto/index.js';

export * from './transactions/index.js';
export * from './address-converter/index.js';
export * from './node-rest-api/index.js';
export * from './gamm/index.js';
