# BitBadges SDK - Complete Type Reference

This document provides a comprehensive overview of all types, interfaces, classes, and functions available in the BitBadges SDK.

## Table of Contents

### Core Types
- [Core Badge Types](#core-badge-types)
- [Approval Types](#approval-types)
- [Permission Types](#permission-types)
- [User Balance Types](#user-balance-types)

### API Types
- [API Indexer Types](#api-indexer-types)
- [Node REST API Types](#node-rest-api-types)

### Transaction Types
- [Transaction Types](#transaction-types)
- [Message Types](#message-types)

### Protocol Buffer Types
- [Proto Types](#proto-types)

### Utility Types
- [Common Types](#common-types)
- [Address Converter Types](#address-converter-types)
- [Attestation Types](#attestation-types)

## Type Categories

### Core Badge Types (`src/interfaces/badges/core.ts`)
Main badge types and structures including:
- Badge definitions
- Collection metadata
- Transfer configurations
- Timeline configurations

### Approval Types (`src/interfaces/badges/approvals.ts`)
Approval and authorization types including:
- Approval mechanisms
- Authorization rules
- Transfer approvals
- Collection approvals

### Permission Types (`src/interfaces/badges/permissions.ts`)
Permission and access control types including:
- Transfer permissions
- Update permissions
- Management permissions
- Custom permission types

### User Balance Types (`src/interfaces/badges/userBalances.ts`)
User balance and ownership types including:
- Balance tracking
- Ownership records
- Transfer history
- Balance updates

### API Indexer Types (`src/api-indexer/`)
Indexer API types and responses including:
- Query parameters
- Response structures
- Pagination types
- Filter options

### Node REST API Types (`src/node-rest-api/`)
Node REST API types including:
- Endpoint parameters
- Response formats
- Error types
- Authentication types

### Transaction Types (`src/transactions/`)
Transaction building and signing types including:
- Transaction builders
- Signing utilities
- Message types
- Broadcast types

### Protocol Buffer Types (`src/proto/`)
Generated protobuf types for all modules including:
- Badge protocol types
- Cosmos SDK types
- IBC types
- Custom module types

### Common Types (`src/common/`)
Common utility types including:
- Constants
- Base types
- Utility functions
- Shared interfaces

### Address Converter Types (`src/address-converter/`)
Address conversion types including:
- Address formats
- Conversion utilities
- Validation types
- Chain-specific types

### Attestation Types (`src/attestations/`)
Attestation types including:
- Attestation structures
- Verification types
- Proof types
- Validation utilities

## Usage for AI Agents

The most comprehensive type information is available in `typedoc-output.json`, which contains:
- Complete type definitions
- Function signatures
- Property types
- Inheritance relationships
- Import/export information
- JSDoc comments and descriptions

## Type Discovery

To discover all available types programmatically:

1. Load `typedoc-output.json`
2. Navigate the `children` array
3. Use the `kind` field to identify type categories:
   - `Interface`: TypeScript interfaces
   - `Class`: Class definitions
   - `Function`: Function definitions
   - `TypeAlias`: Type aliases
   - `Variable`: Variable declarations
   - `Module`: Module definitions

## Type Relationships

The JSON output includes comprehensive relationship information:
- `extendedTypes`: Inheritance relationships
- `implementedTypes`: Interface implementations
- `type`: Type references
- `signatures`: Function signatures with parameters and return types
- `properties`: Object properties with types and optionality
- `children`: Nested type definitions

