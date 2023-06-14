declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

export * from './collections';
export * from './types/db';
export * from './types/coin';
export * from './types/permissions';
export * from './types/users';
export * from './types/collections';
export * from './types/activity';
export * from './types/api';
export * from './types/indexer';
export * from './types/string-numbers';
export * from './types/metadata';
export * from './types/routes';
export * from './types/types';
export * from './types/transfers';
export * from './chains';
export * from './balances';
export * from './distribution';
export * from './balances';
export * from './idRanges';
export * from './constants';
export * from './transferMappings';
export * from './permissions';
export * from './badgeMetadata';
export * from './metadataIds';
export * from './display';
export * from './approvals';
export * from './math';
