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
export * from './uintRanges';
export * from './constants';
export * from './addressMappings';
export * from './permissions';
export * from './badgeMetadata';
export * from './metadataIds';
export * from './display';
export * from './firstMatches';
export * from './math';
export * from './timelines';
export * from './overlaps';
export * from './permission_checks';
export * from './userApprovals';
export * from './update_checks'
export * from './validate_permissions_updates';
export * from './approved_transfers_casts';
export * from './api-sdk';
export * from './converter';
export * from './aliases';

export * from './node-rest-api/account'
export * from './node-rest-api/balances'
export * from './node-rest-api/broadcast'
export * from './node-rest-api/coin'
export * from './node-rest-api/gov'
export * from './node-rest-api/ibc'
export * from './node-rest-api/staking'
