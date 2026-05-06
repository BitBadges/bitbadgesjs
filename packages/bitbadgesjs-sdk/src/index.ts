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
export * from './signing/index.js';

// Re-export SIWBB types by name so consumers (indexer's auth/siwe
// module, frontend siwbb authorize page) can `import { ChallengeParams }
// from 'bitbadges'` without reaching into deep subpaths.
//
// Skipped here to avoid collisions with already-public symbols:
//   - `NumberType` (from `common/`)
//   - `OwnershipRequirements` (`api-indexer/requests/blockin.ts` exports
//     a class of the same name; consumers that want the interface can
//     reference the class type, since the class `implements
//     OwnershipRequirements<T>`).
export type {
  AndGroup,
  OrGroup,
  AssetDetails,
  AssetConditionGroup,
  ChallengeParams,
  VerifyChallengeOptions
} from './blockin/index.js';
