#!/bin/bash

# Script to generate a comprehensive type map for BitBadges SDK
# This is designed for AI agents to understand the complete type structure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Generating comprehensive type map for BitBadges SDK...${NC}"

# Create output directory
OUTPUT_DIR="./type-map"
mkdir -p "$OUTPUT_DIR"

# Generate TypeDoc JSON output for programmatic access
echo -e "${YELLOW}📝 Generating TypeDoc JSON output...${NC}"
# Use --out /dev/null to discard HTML output, only generate JSON
npx typedoc --json "$OUTPUT_DIR/typedoc-output.json" \
  --out /dev/null \
  --entryPoints "./src" \
  --exclude "**/*.spec.ts" \
  --excludeExternals \
  --searchInComments \
  --tsconfig "./tsconfig.json" \
  --externalPattern "./node_modules/**" \
  --includeVersion \
  --hideGenerator

# Create a comprehensive type summary
echo -e "${YELLOW}📊 Creating comprehensive type summary...${NC}"

cat > "$OUTPUT_DIR/type-summary.md" << 'EOF'
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
Main token types and structures including:
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

EOF

# Generate a TypeScript declaration file that exports all types
echo -e "${YELLOW}🔧 Generating TypeScript declaration file...${NC}"

cat > "$OUTPUT_DIR/all-types.d.ts" << 'EOF'
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
EOF

# Create a JSON schema file for all types
echo -e "${YELLOW}📋 Generating JSON schema...${NC}"

cat > "$OUTPUT_DIR/types-schema.json" << 'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BitBadges SDK Type Schema",
  "description": "Complete type schema for BitBadges SDK",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "description": "SDK version"
    },
    "generatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "When this schema was generated"
    },
    "typeCategories": {
      "type": "object",
      "description": "All type categories in the SDK",
      "properties": {
        "core": {
          "type": "object",
          "description": "Core token types and interfaces"
        },
        "api": {
          "type": "object",
          "description": "API-related types"
        },
        "transactions": {
          "type": "object",
          "description": "Transaction and message types"
        },
        "proto": {
          "type": "object",
          "description": "Protocol buffer types"
        },
        "common": {
          "type": "object",
          "description": "Common utility types"
        },
        "addressConverter": {
          "type": "object",
          "description": "Address conversion types"
        },
        "attestations": {
          "type": "object",
          "description": "Attestation types"
        }
      }
    }
  }
}
EOF

# Create a comprehensive README for the type map
echo -e "${YELLOW}📖 Creating type map README...${NC}"

cat > "$OUTPUT_DIR/README.md" << 'EOF'
# BitBadges SDK Type Map

This directory contains a comprehensive type map of the BitBadges SDK, generated specifically for AI agents and developers to understand the complete type structure.

## Files Overview

### 📄 `typedoc-output.json`
Complete TypeDoc JSON output containing all types, interfaces, classes, and functions with full metadata. This is the primary file for AI agents to consume.

### 📝 `type-summary.md`
Human-readable summary of all type categories and their purposes.

### 🔧 `all-types.d.ts`
TypeScript declaration file that re-exports all types for easy consumption.

### 📋 `types-schema.json`
JSON schema describing the overall type structure.

## Usage for AI Agents

### 1. Type Discovery
Use `typedoc-output.json` to discover all available types:
```json
{
  "children": [
    {
      "name": "TypeName",
      "kind": "Interface|Class|Function|TypeAlias",
      "comment": "Description",
      "signatures": [...],
      "properties": [...]
    }
  ]
}
```

### 2. Type Relationships
The JSON output includes:
- Inheritance relationships (`extendedTypes`)
- Interface implementations (`implementedTypes`)
- Type references (`type`)
- Import/export relationships
- Function signatures with parameters and return types
- Object properties with types and optionality

### 3. Documentation Access
- Type summary: High-level overview
- JSON schema: Type structure schema

### 4. TypeScript Integration
Use `all-types.d.ts` for TypeScript intellisense and type checking.

## Key Type Categories

### Core Types (`src/interfaces/badges/`)
- **core.ts**: Main token types and structures
- **approvals.ts**: Approval and authorization types
- **permissions.ts**: Permission and access control types
- **userBalances.ts**: User balance and ownership types

### API Types
- **api-indexer/**: Indexer API types and responses
- **node-rest-api/**: Node REST API types

### Transaction Types
- **transactions/**: Transaction building and signing types
- **messages/**: Protocol message types

### Protocol Buffer Types
- **proto/**: Generated protobuf types for all modules

## Regeneration

To regenerate this type map:

```bash
./scripts/generate-type-map.sh
```

This will update all files with the latest type information from the source code.

## Notes for AI Agents

1. **Type Hierarchy**: Check the `kind` field in the JSON to understand type relationships
2. **Comments**: Use the `comment` field for type descriptions and usage examples
3. **Signatures**: Function signatures include parameter types and return types
4. **Properties**: Interface and class properties include types and optionality
5. **References**: Use `type` fields to trace type references and dependencies
6. **Inheritance**: Check `extendedTypes` and `implementedTypes` for inheritance relationships

## Version Information

Generated from BitBadges SDK version: $(node -p "require('../package.json').version")
Generated at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

# Update the JSON schema with actual version and timestamp
VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Use jq to update the JSON schema if available, otherwise use sed
if command -v jq &> /dev/null; then
  jq --arg version "$VERSION" --arg timestamp "$TIMESTAMP" \
    '.version = $version | .generatedAt = $timestamp' \
    "$OUTPUT_DIR/types-schema.json" > "$OUTPUT_DIR/types-schema.json.tmp" && \
    mv "$OUTPUT_DIR/types-schema.json.tmp" "$OUTPUT_DIR/types-schema.json"
else
  sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$OUTPUT_DIR/types-schema.json"
  sed -i "s/\"generatedAt\": \"[^\"]*\"/\"generatedAt\": \"$TIMESTAMP\"/" "$OUTPUT_DIR/types-schema.json"
fi

# Make the script executable
chmod +x "$0"

echo -e "${GREEN}✅ Type map generation complete!${NC}"
echo -e "${BLUE}📁 Output directory: $OUTPUT_DIR${NC}"
echo -e "${BLUE}📄 Main files:${NC}"
echo -e "  - ${YELLOW}typedoc-output.json${NC} - Complete TypeDoc JSON (for AI agents)"
echo -e "  - ${YELLOW}all-types.d.ts${NC} - TypeScript declarations"
echo -e "  - ${YELLOW}type-summary.md${NC} - Human-readable summary"
echo -e "  - ${YELLOW}types-schema.json${NC} - JSON schema"
echo -e "  - ${YELLOW}README.md${NC} - Usage guide"

echo -e "\n${GREEN}�� Ready for AI agent consumption!${NC}"
echo -e "${BLUE}💡 The typedoc-output.json file contains the most comprehensive type information.${NC}"
