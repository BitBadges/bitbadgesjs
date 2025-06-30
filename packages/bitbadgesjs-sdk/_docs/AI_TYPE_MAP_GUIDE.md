# BitBadges SDK Type Map - AI Agent Guide

This guide explains how AI agents can effectively use the comprehensive type map generated for the BitBadges SDK.

## Quick Start

1. **Generate the type map:**

   ```bash
   npm run generate-type-map
   ```

2. **Primary file for AI consumption:**
   - `type-map/typedoc-output.json` (47MB) - Complete TypeDoc JSON output

## File Structure

```
type-map/
├── typedoc-output.json     # 🎯 PRIMARY: Complete type information (47MB)
├── all-types.d.ts         # TypeScript declarations
├── type-summary.md        # Human-readable overview
├── types-schema.json      # JSON schema
└── README.md              # Usage guide
```

## For AI Agents: Using `typedoc-output.json`

### 1. Loading the Data

```javascript
const typeData = JSON.parse(fs.readFileSync('type-map/typedoc-output.json', 'utf8'));
```

### 2. Key Data Structure

```json
{
  "name": "BitBadges SDK",
  "children": [
    {
      "name": "TypeName",
      "kind": "Interface|Class|Function|TypeAlias|Variable|Module",
      "comment": "Description and usage examples",
      "signatures": [...],        // Function signatures
      "properties": [...],        // Object properties
      "type": {...},             // Type references
      "extendedTypes": [...],    // Inheritance
      "implementedTypes": [...], // Interface implementations
      "children": [...]          // Nested types
    }
  ]
}
```

### 3. Type Discovery Patterns

#### Find All Interfaces

```javascript
const interfaces = typeData.children.filter((child) => child.kind === 'Interface');
```

#### Find All Functions

```javascript
const functions = typeData.children.filter((child) => child.kind === 'Function');
```

#### Find Types by Name

```javascript
const findType = (name) => typeData.children.find((child) => child.name === name);
```

#### Find Types by Category

```javascript
const badgeTypes = typeData.children.filter((child) => child.name.includes('Badge') || child.name.includes('Collection'));
```

### 4. Understanding Type Relationships

#### Inheritance Chain

```javascript
const getInheritanceChain = (type) => {
  const chain = [];
  let current = type;
  while (current.extendedTypes?.length > 0) {
    chain.push(current.extendedTypes[0]);
    current = findType(current.extendedTypes[0].name);
  }
  return chain;
};
```

#### Interface Implementations

```javascript
const getImplementations = (interfaceName) => {
  return typeData.children.filter((child) => child.implementedTypes?.some((impl) => impl.name === interfaceName));
};
```

#### Type References

```javascript
const getTypeReferences = (typeName) => {
  return typeData.children.filter((child) => child.type?.name === typeName || child.properties?.some((prop) => prop.type?.name === typeName));
};
```

## Key Type Categories

### Core Badge Types

- **Location**: `src/interfaces/badges/`
- **Key Files**: `core.ts`, `approvals.ts`, `permissions.ts`, `userBalances.ts`
- **Purpose**: Main badge definitions, approval mechanisms, permissions, user balances

### API Types

- **Location**: `src/api-indexer/`, `src/node-rest-api/`
- **Purpose**: API request/response types, query parameters, pagination

### Transaction Types

- **Location**: `src/transactions/`
- **Purpose**: Transaction building, signing, message types, broadcast

### Protocol Buffer Types

- **Location**: `src/proto/`
- **Purpose**: Generated protobuf types for blockchain communication

## Common AI Agent Use Cases

### 1. Type Validation

```javascript
const validateType = (typeName, data) => {
  const typeDef = findType(typeName);
  if (!typeDef) return false;

  // Check required properties
  const requiredProps = typeDef.properties?.filter((p) => !p.flags?.isOptional);
  return requiredProps?.every((prop) => data.hasOwnProperty(prop.name));
};
```

### 2. Code Generation

```javascript
const generateInterface = (typeName) => {
  const typeDef = findType(typeName);
  if (!typeDef || typeDef.kind !== 'Interface') return null;

  const properties = typeDef.properties?.map((prop) => `${prop.name}${prop.flags?.isOptional ? '?' : ''}: ${prop.type?.name};`).join('\n  ');

  return `interface ${typeName} {\n  ${properties}\n}`;
};
```

### 3. Function Signature Analysis

```javascript
const analyzeFunction = (functionName) => {
  const func = findType(functionName);
  if (!func || func.kind !== 'Function') return null;

  return func.signatures?.map((sig) => ({
    parameters: sig.parameters?.map((p) => ({
      name: p.name,
      type: p.type?.name,
      optional: p.flags?.isOptional
    })),
    returnType: sig.type?.name,
    comment: sig.comment?.summary
  }));
};
```

### 4. Type Compatibility

```javascript
const checkCompatibility = (sourceType, targetType) => {
  const source = findType(sourceType);
  const target = findType(targetType);

  if (!source || !target) return false;

  // Check if source extends target
  return source.extendedTypes?.some((ext) => ext.name === targetType) || source.implementedTypes?.some((impl) => impl.name === targetType);
};
```

## Best Practices for AI Agents

### 1. Cache the Data

- Load `typedoc-output.json` once and keep it in memory
- The file is 47MB, so it's comprehensive but large

### 2. Use Type Categories

- Group types by their purpose (core, API, transactions, proto)
- This helps understand the domain better

### 3. Leverage Comments

- JSDoc comments contain usage examples and descriptions
- Use `comment.summary` and `comment.description` fields

### 4. Follow Type Relationships

- Use `extendedTypes` and `implementedTypes` for inheritance
- Use `type` references for composition
- Use `children` for nested type structures

### 5. Handle Optional Properties

- Check `flags.isOptional` for optional properties
- Check `flags.isReadonly` for read-only properties

## Example: Complete Type Analysis

```javascript
const analyzeSDK = () => {
  const analysis = {
    totalTypes: typeData.children.length,
    interfaces: typeData.children.filter((t) => t.kind === 'Interface').length,
    classes: typeData.children.filter((t) => t.kind === 'Class').length,
    functions: typeData.children.filter((t) => t.kind === 'Function').length,
    typeAliases: typeData.children.filter((t) => t.kind === 'TypeAlias').length,
    categories: {
      badges: typeData.children.filter((t) => t.name.includes('Badge')).length,
      api: typeData.children.filter((t) => t.name.includes('Api') || t.name.includes('Request') || t.name.includes('Response')).length,
      transactions: typeData.children.filter((t) => t.name.includes('Tx') || t.name.includes('Msg')).length,
      proto: typeData.children.filter((t) => t.name.includes('Proto') || t.name.includes('pb')).length
    }
  };

  return analysis;
};
```

## Regeneration

To update the type map after code changes:

```bash
npm run generate-type-map
```

This will update all files with the latest type information from the source code.

## Troubleshooting

### Large File Size

- The 47MB JSON file is normal for a comprehensive SDK
- Consider loading it asynchronously or in chunks if memory is limited

### Missing Types

- Check if the type is in the `exclude` patterns in the script
- Ensure the type is properly exported from the main index

### Type Relationships

- Some relationships might be complex due to generics and unions
- Use the `type` field to trace through complex type references

## Support

For questions about the type map or BitBadges SDK:

- Check the generated `type-map/README.md`
- Review the `type-summary.md` for high-level overview
- Use the JSON schema for structure validation
