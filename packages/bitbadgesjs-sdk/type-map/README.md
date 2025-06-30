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
- **core.ts**: Main badge types and structures
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
