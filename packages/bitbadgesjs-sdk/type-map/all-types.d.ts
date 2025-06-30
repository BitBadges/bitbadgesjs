/**
 * Complete TypeScript declarations for BitBadges SDK
 * This file contains all exported types, interfaces, and classes
 * Generated automatically for AI agent consumption
 */

// Re-export all types from the main library
export * from '../src/index.js';

// Additional type information for AI agents
export namespace BitBadgesSDK {
  export interface TypeMap {
    core: {
      badges: typeof import('../src/interfaces/badges/core.js');
      approvals: typeof import('../src/interfaces/badges/approvals.js');
      permissions: typeof import('../src/interfaces/badges/permissions.js');
      userBalances: typeof import('../src/interfaces/badges/userBalances.js');
    };
    api: {
      indexer: typeof import('../src/api-indexer/index.js');
      nodeRest: typeof import('../src/node-rest-api/index.js');
    };
    transactions: typeof import('../src/transactions/index.js');
    proto: typeof import('../src/proto/index.js');
    common: typeof import('../src/common/index.js');
    addressConverter: typeof import('../src/address-converter/index.js');
    attestations: typeof import('../src/attestations/index.js');
  }
}

// Type helper for AI agents
export type AllExportedTypes = keyof BitBadgesSDK.TypeMap;
