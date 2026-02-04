# Adding Support for New Proto Fields from Chain

This document outlines the process for adding support for new proto fields that are added to the BitBadges chain. This process ensures that the TypeScript SDK stays in sync with the blockchain's protocol buffer definitions.

## Overview

When new fields are added to proto messages in the BitBadges chain, the TypeScript SDK needs to be updated to support these new fields. This involves updating both the interface definitions and the corresponding TypeScript classes.

## Important Requirements

### Number Type Handling

- **Always use the `<T extends NumberType>` generic format** for any fields that represent numbers (amounts, IDs, counts, etc.)
- **Include all number fields in the `getNumberFieldNames()` array** in class objects
- This ensures proper type conversion and consistency across the SDK

### Auto-Staging Generated Files

- **After completing all updates, auto-stage any `*_pb.ts` files** that were generated
- These files are auto-generated and should be committed to version control

## Step-by-Step Process

### Step 1: Update Proto Files

First, run the script to fetch and update the proto files from the chain:

```bash
cd packages/bitbadgesjs-sdk
source ./scripts/get_and_create_proto_files.sh
```

This script will:

- Clone the latest proto definitions from the chain
- Generate updated TypeScript proto files
- Show you the differences in the generated files

### Step 2: Analyze Changes

Check the git differences to see what has changed:

```bash
git diff
```

Look for:

- New proto messages that were added
- New fields added to existing messages
- Changes in field types or structures

### Step 3: Update TypeScript Interfaces

For each new field or message, you need to update the corresponding TypeScript interfaces:

#### 3.1 Update Core Interfaces (`src/interfaces/types/core.ts`)

Add new interfaces for new messages or update existing interfaces for new fields:

```typescript
/**
 * @category Interfaces
 */
export interface iNewMessage<T extends NumberType> {
  /** Description of the field */
  fieldName: T;
  // ... other fields
}

/**
 * @category Interfaces
 */
export interface iUpdatedMessage<T extends NumberType> {
  // ... existing fields
  /** New field description */
  newField: string;
}
```

#### 3.2 Update API Indexer Interfaces (`src/api-indexer/docs/interfaces.ts`)

If the new fields are used in API responses, update the corresponding interfaces:

```typescript
/**
 * @category Interfaces
 */
export interface iApiMessage<T extends NumberType> {
  // ... existing fields
  /** New field for API responses */
  newField: string;
}
```

### Step 4: Update TypeScript Classes

For each interface, update the corresponding TypeScript class:

#### 4.1 Update Core Classes

Update the classes in `src/core/` directory:

```typescript
export class NewMessage<T extends NumberType> extends BaseNumberTypeClass<NewMessage<T>> implements iNewMessage<T> {
  fieldName: T;

  constructor(data: iNewMessage<T>) {
    super();
    this.fieldName = data.fieldName;
  }

  getNumberFieldNames(): string[] {
    return ['fieldName']; // Include number fields
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): NewMessage<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as NewMessage<U>;
  }

  static fromProto<T extends NumberType>(data: tokenization.NewMessage, convertFunction: (val: NumberType) => T): NewMessage<T> {
    return new NewMessage({
      fieldName: convertFunction(data.fieldName)
    });
  }
}
```

#### 4.2 Update Existing Classes

For existing classes with new fields:

```typescript
export class UpdatedMessage<T extends NumberType> extends BaseNumberTypeClass<UpdatedMessage<T>> implements iUpdatedMessage<T> {
  // ... existing fields
  newField: string;

  constructor(data: iUpdatedMessage<T>) {
    super();
    // ... existing assignments
    this.newField = data.newField;
  }

  // ... existing methods

  static fromProto<T extends NumberType>(data: tokenization.UpdatedMessage, convertFunction: (val: NumberType) => T): UpdatedMessage<T> {
    return new UpdatedMessage({
      // ... existing fields
      newField: data.newField
    });
  }
}
```

### Step 5: Update Imports

Make sure to update any import statements that reference the new interfaces or classes:

```typescript
import { iNewMessage, iUpdatedMessage } from '@/interfaces/types/core.js';
import { NewMessage, UpdatedMessage } from '@/core/misc.js';
```

### Step 6: Update Transaction Messages

If the new fields are used in transaction messages, update the corresponding message builders:

```typescript
// In src/transactions/messages/bitbadges/tokenization/
export function buildNewMessage(data: iNewMessage<NumberType>): tokenization.NewMessage {
  return new prototokenization.NewMessage({
    fieldName: data.fieldName.toString()
  });
}
```

### Step 7: Test Your Changes

1. Run the TypeScript compiler to check for errors:

   ```bash
   npm run build
   ```

2. Run tests to ensure nothing is broken:

   ```bash
   npm test
   ```

3. Test the new functionality manually if possible.

### Step 8: Update Sample Message Generation

For proper type schema generation, you need to update the `getSampleMsg.ts` file to include the new fields in the sample messages. While proto emit defaults will handle primitive types automatically, nested types need to be manually set.

**Critical Rules:**

1. **Arrays must contain at least one instance** of the element for proper type schema generation
2. **Number types must be emitted as strings** (e.g., `'0'` instead of `0`) for EIP-712 compatibility

Update `src/transactions/eip712/payload/samples/getSampleMsg.ts`:

```typescript
// Add the new fields to the cosmosCoinWrapperPathsToAdd sample
cosmosCoinWrapperPathsToAdd: [
  new CosmosCoinWrapperPathAddObject({
    denom: 'ibc:1234567890',
    tokenIds: [new UintRange()],
    ownershipTimes: [new UintRange()],
    symbol: '', // Add new field
    denomUnits: [
      // Add new field - MUST have at least one instance
      new DenomUnit({
        decimals: '0', // Number types as strings for EIP-712 compatibility
        symbol: ''
      })
    ]
  })
];
```

**Important Notes:**

- **Primitive types** (strings, booleans) are handled automatically by proto emit defaults
- **Complex nested objects** need manual initialization with at least one instance
- **Number fields** must use string values (e.g., `'0'`, `'100'`) for EIP-712 type schema compatibility
- **Arrays** cannot be empty `[]` - they must contain at least one properly initialized element

### Step 9: Auto-Stage Generated Files

After completing all updates and testing, auto-stage the generated proto files:

```bash
git add *_pb.ts
```

This ensures that the auto-generated TypeScript proto files are committed to version control.

## Common Patterns

### Number Fields

For fields that represent numbers (amounts, IDs, etc.):

```typescript
// Interface
export interface iExample<T extends NumberType> {
  amount: T;
}

// Class
export class Example<T extends NumberType> {
  amount: T;

  getNumberFieldNames(): string[] {
    return ['amount']; // Include in number fields
  }

  static fromProto<T extends NumberType>(data: tokenization.Example, convertFunction: (val: NumberType) => T): Example<T> {
    return new Example({
      amount: convertFunction(data.amount)
    });
  }
}
```

### Array Fields

For fields that are arrays:

```typescript
// Interface
export interface iExample<T extends NumberType> {
  items: iItem<T>[];
}

// Class
export class Example<T extends NumberType> {
  items: Item<T>[];

  constructor(data: iExample<T>) {
    this.items = data.items.map((item) => new Item(item));
  }

  static fromProto<T extends NumberType>(data: tokenization.Example, convertFunction: (val: NumberType) => T): Example<T> {
    return new Example({
      items: data.items.map((item) => Item.fromProto(item, convertFunction))
    });
  }
}
```

### Optional Fields

For optional fields:

```typescript
// Interface
export interface iExample<T extends NumberType> {
  optionalField?: string;
}

// Class
export class Example<T extends NumberType> {
  optionalField?: string;

  constructor(data: iExample<T>) {
    this.optionalField = data.optionalField;
  }

  static fromProto<T extends NumberType>(data: tokenization.Example, convertFunction: (val: NumberType) => T): Example<T> {
    return new Example({
      optionalField: data.optionalField
    });
  }
}
```

## Example: Adding DenomUnit Support

Here's a real example from adding support for the `DenomUnit` message:

### 1. Proto Changes

```protobuf
message DenomUnit {
  uint32 decimals = 1;
  string symbol = 2;
}

message CosmosCoinWrapperPath {
  // ... existing fields
  string symbol = 5;
  repeated DenomUnit denomUnits = 6;
}
```

### 2. Interface Updates

```typescript
// src/interfaces/types/core.ts
export interface iDenomUnit {
  decimals: number;
  symbol: string;
}

export interface iCosmosCoinWrapperPathAddObject<T extends NumberType> {
  // ... existing fields
  symbol: string;
  denomUnits: iDenomUnit[];
}
```

### 3. Class Updates

```typescript
// src/core/ibc-wrappers.ts
export class DenomUnit extends BaseNumberTypeClass<DenomUnit> implements iDenomUnit {
  decimals: number;
  symbol: string;

  constructor(data: iDenomUnit) {
    super();
    this.decimals = data.decimals;
    this.symbol = data.symbol;
  }

  getNumberFieldNames(): string[] {
    return ['decimals']; // Include number fields
  }

  static fromProto(data: tokenization.DenomUnit): DenomUnit {
    return new DenomUnit({
      decimals: data.decimals,
      symbol: data.symbol
    });
  }
}

export class CosmosCoinWrapperPathAddObject<T extends NumberType> {
  // ... existing fields
  symbol: string;
  denomUnits: DenomUnit[];

  constructor(data: iCosmosCoinWrapperPathAddObject<T>) {
    // ... existing assignments
    this.symbol = data.symbol;
    this.denomUnits = data.denomUnits.map((unit) => new DenomUnit(unit));
  }

  static fromProto<T extends NumberType>(
    data: tokenization.CosmosCoinWrapperPathAddObject,
    convertFunction: (val: NumberType) => T
  ): CosmosCoinWrapperPathAddObject<T> {
    return new CosmosCoinWrapperPathAddObject({
      // ... existing fields
      symbol: data.symbol,
      denomUnits: data.denomUnits.map((unit) => DenomUnit.fromProto(unit))
    });
  }
}
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure all new interfaces and classes are properly exported and imported.

2. **Type Errors**: Ensure that number fields are properly handled with the `NumberType` generic and conversion functions.

3. **Missing fromProto Methods**: Every class should have a `fromProto` static method to convert from the generated proto classes.

4. **Array Handling**: Remember to map over arrays when converting from proto to your classes.

5. **Missing Number Fields**: Always include number fields in `getNumberFieldNames()` array.

### Validation Checklist

- [ ] All new proto messages have corresponding interfaces
- [ ] All new fields are added to existing interfaces
- [ ] All interfaces have corresponding TypeScript classes
- [ ] All classes implement the correct interfaces
- [ ] All classes have proper `fromProto` methods
- [ ] All number fields use `<T extends NumberType>` generic format
- [ ] All number fields are included in `getNumberFieldNames()`
- [ ] All imports are updated
- [ ] Sample message generation is updated in `getSampleMsg.ts`
- [ ] TypeScript compilation passes
- [ ] Tests pass
- [ ] Documentation is updated if needed
- [ ] Generated `*_pb.ts` files are staged

## Conclusion

Following this process ensures that the TypeScript SDK remains in sync with the blockchain's proto definitions. Always test your changes thoroughly and make sure to follow the existing patterns in the codebase for consistency. Remember to auto-stage the generated proto files after completion.
