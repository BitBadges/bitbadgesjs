# Adding Support for New Message Types from Chain

This document outlines the process for adding support for new message types that are added to the BitBadges chain. This process ensures that the TypeScript SDK stays in sync with the blockchain's protocol buffer definitions and provides proper transaction building capabilities.

## Overview

When new message types are added to proto files in the BitBadges chain, the TypeScript SDK needs to be updated to support these new messages. This involves updating proto files, creating TypeScript interfaces and classes, adding them to transaction builders, and updating various registries and converters.

## Important Requirements

### Number Type Handling

- **Always use the `<T extends NumberType>` generic format** for any fields that represent numbers (amounts, IDs, counts, etc.)
- **Include all number fields in the `getNumberFieldNames()` array** in class objects
- This ensures proper type conversion and consistency across the SDK

### Message Type Structure

- **Follow the existing pattern** for message types in the SDK
- **Create both interface and class** for each message type
- **Implement proper proto conversion methods** (`toProto()`, `fromProto()`, `fromJson()`, etc.)
- **Add proper JSDoc comments** for documentation generation

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

- New message types that were added
- New fields added to existing messages
- Changes in message structures or types

### Step 3: Update TypeScript Interfaces

For each new message type, you need to create the corresponding TypeScript interfaces:

#### 3.1 Update Message Interfaces (`src/transactions/messages/bitbadges/badges/interfaces.ts`)

Add new interfaces for new message types:

```typescript
/**
 * @category Interfaces
 */
export interface iMsgNewMessageType<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** Description of the field */
  fieldName: T;
  // ... other fields
}
```

**Important Notes:**

- Always include `creator: BitBadgesAddress` as the first field
- Use `NumberType` generic for any numeric fields
- Add proper JSDoc comments for each field
- Follow the existing naming convention with `iMsg` prefix

### Step 4: Create TypeScript Message Classes

For each new message type, create the corresponding TypeScript class:

#### 4.1 Create Message Class File

Create a new file in `src/transactions/messages/bitbadges/badges/` directory:

```typescript
// src/transactions/messages/bitbadges/badges/msgNewMessageType.ts
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgNewMessageType } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgNewMessageType description of what this message does.
 *
 * @category Transactions
 */
export class MsgNewMessageType<T extends NumberType> extends CustomTypeClass<MsgNewMessageType<T>> implements iMsgNewMessageType<T> {
  creator: BitBadgesAddress;
  fieldName: T;

  constructor(msg: iMsgNewMessageType<T>) {
    super();
    this.creator = msg.creator;
    this.fieldName = msg.fieldName;
  }

  toProto(): protobadges.MsgNewMessageType {
    return new protobadges.MsgNewMessageType({
      creator: this.creator,
      fieldName: this.fieldName.toString() // Convert NumberType to string for proto
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgNewMessageType<NumberType> {
    return MsgNewMessageType.fromProto(protobadges.MsgNewMessageType.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgNewMessageType<NumberType> {
    return MsgNewMessageType.fromProto(protobadges.MsgNewMessageType.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgNewMessageType): MsgNewMessageType<NumberType> {
    return new MsgNewMessageType({
      creator: protoMsg.creator,
      fieldName: protoMsg.fieldName // Convert string to NumberType
    });
  }

  toBech32Addresses(prefix: string): MsgNewMessageType<T> {
    return new MsgNewMessageType({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      fieldName: this.fieldName
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"newMessageTypeMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
```

**Critical Requirements:**

- Extend `CustomTypeClass` and implement the interface
- Include `toProto()`, `fromProto()`, `fromJson()`, and `fromJsonString()` methods
- Include `toBech32Addresses()` for address conversion
- Include `toCosmWasmPayloadString()` for CosmWasm compatibility
- Convert `NumberType` to string in `toProto()` and vice versa in `fromProto()`

#### 4.2 Update Index File

Add the export to `src/transactions/messages/bitbadges/badges/index.ts`:

```typescript
export * from './msgNewMessageType.js';
```

### Step 5: Update Proto Type Registry

Add the new message types to the proto type registry for proper serialization:

#### 5.1 Update Object Converter (`src/transactions/amino/objectConverter.ts`)

Add the new message types to the `ProtoTypeRegistry`:

```typescript
import {
  MsgNewMessageType
  // ... other imports
} from '@/proto/badges/tx_pb.js';

export const ProtoTypeRegistry = createRegistry(
  // ... existing messages
  MsgNewMessageType
  // ... other messages
);
```

### Step 6: Update Amino Converters

Add the new message types to the amino converters for proper transaction signing:

#### 6.1 Update Registry (`src/transactions/amino/registry.ts`)

Add the new message types to the badges amino converters:

```typescript
import {
  MsgNewMessageType
  // ... other imports
} from '@/proto/badges/tx_pb.js';

export function createBadgesAminoConverters(): AminoConverters {
  return {
    // ... existing converters
    ...createAminoConverter(MsgNewMessageType, 'badges/NewMessageType')
    // ... other converters
  };
}
```

**Important Notes:**

- The amino type should match the proto option: `option (amino.name) = "badges/NewMessageType";`
- Use the same message class in both the import and the converter

### Step 7: Update Sample Message Generation

For proper type schema generation, you need to update the `getSampleMsg.ts` file to include the new message types in the sample messages.

#### 7.1 Update Sample Messages (`src/transactions/eip712/payload/samples/getSampleMsg.ts`)

Add the new message types to the `getSampleMsg` function:

```typescript
export function getSampleMsg(msgType: string, currMsg: any) {
  switch (msgType) {
    // ... existing cases
    case 'badges/NewMessageType':
      return {
        type: msgType,
        value: new MsgNewMessageType({
          creator: '',
          fieldName: '0' // Number types as strings for EIP-712 compatibility
        }).toJson({ emitDefaultValues: true })
      };
    // ... other cases
    default:
      return currMsg;
  }
}
```

**Critical Rules:**

- **Number types must be emitted as strings** (e.g., `'0'` instead of `0`) for EIP-712 compatibility
- Use `emitDefaultValues: true` to ensure all fields are included
- Follow the existing pattern for message type cases

### Step 8: Update Message Normalization

Add the new message types to the message normalization function for proper handling of optional fields:

#### 8.1 Update Base Transaction (`src/transactions/messages/base.ts`)

Add the new message types to the `normalizeMessagesIfNecessary` function:

```typescript
import {
  MsgNewMessageType
  // ... other imports
} from '@/proto/badges/tx_pb.js';

import {
  populateUndefinedForMsgNewMessageType
  // ... other imports
} from '@/transactions/eip712/payload/samples/getSampleMsg.js';

export const normalizeMessagesIfNecessary = (messages: MessageGenerated[]) => {
  const newMessages = messages.map((msg) => {
    const msgVal = msg.message;

    // ... existing conditions
    if (msgVal.getType().typeName === MsgNewMessageType.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgNewMessageType(msgVal as MsgNewMessageType));
    }
    // ... other conditions

    return msg;
  });

  return newMessages;
};
```

#### 8.2 Create Population Function

Create a population function for the new message type in `getSampleMsg.ts`:

```typescript
export function populateUndefinedForMsgNewMessageType(msg: MsgNewMessageType) {
  // Add any necessary field population logic here
  // For simple messages with only primitive types, this might be empty
  return msg;
}
```

### Step 9: Update BadgeCustomMsgType

If the new message type should be included in the `BadgeCustomMsgType` for WASM bindings, update the proto file:

#### 9.1 Update Proto File

Add the new message to the `BadgeCustomMsgType` in the proto file:

```protobuf
message BadgeCustomMsgType {
  // ... existing messages
  MsgNewMessageType newMessageTypeMsg = 12; // Use next available number
}
```

### Step 10: Test Your Changes

1. Run the TypeScript compiler to check for errors:

   ```bash
   bun run build
   ```

2. Run tests to ensure nothing is broken:

   ```bash
   bun test
   ```

3. Test the new functionality manually if possible.

### Step 11: Auto-Stage Generated Files

After completing all updates and testing, auto-stage the generated proto files:

```bash
git add *_pb.ts
```

This ensures that the auto-generated TypeScript proto files are committed to version control.

## Example: Adding Dynamic Store Message Types

Here's a real example from adding support for the Dynamic Store message types:

### 1. Proto Changes

```protobuf
message MsgCreateDynamicStore {
  option (cosmos.msg.v1.signer) = "creator";
  option (amino.name) = "badges/CreateDynamicStore";

  string creator = 1;
}

message MsgUpdateDynamicStore {
  option (cosmos.msg.v1.signer) = "creator";
  option (amino.name) = "badges/UpdateDynamicStore";

  string creator = 1;
  string storeId = 2;
}

message MsgDeleteDynamicStore {
  option (cosmos.msg.v1.signer) = "creator";
  option (amino.name) = "badges/DeleteDynamicStore";

  string creator = 1;
  string storeId = 2;
}

message MsgSetDynamicStoreValue {
  option (cosmos.msg.v1.signer) = "creator";
  option (amino.name) = "badges/SetDynamicStoreValue";

  string creator = 1;
  string storeId = 2;
  string address = 3;
  bool value = 4;
}
```

### 2. Interface Updates

```typescript
// src/transactions/messages/bitbadges/badges/interfaces.ts
export interface iMsgCreateDynamicStore {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
}

export interface iMsgUpdateDynamicStore<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the dynamic store to update. */
  storeId: T;
}

export interface iMsgDeleteDynamicStore<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the dynamic store to delete. */
  storeId: T;
}

export interface iMsgSetDynamicStoreValue<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the dynamic store. */
  storeId: T;
  /** The address for which to set the value. */
  address: BitBadgesAddress;
  /** The boolean value to set. */
  value: boolean;
}
```

### 3. Class Updates

```typescript
// src/transactions/messages/bitbadges/badges/msgCreateDynamicStore.ts
export class MsgCreateDynamicStore extends CustomTypeClass<MsgCreateDynamicStore> implements iMsgCreateDynamicStore {
  creator: BitBadgesAddress;

  constructor(msg: iMsgCreateDynamicStore) {
    super();
    this.creator = msg.creator;
  }

  toProto(): protobadges.MsgCreateDynamicStore {
    return new protobadges.MsgCreateDynamicStore({ creator: this.creator });
  }

  static fromProto(protoMsg: protobadges.MsgCreateDynamicStore): MsgCreateDynamicStore {
    return new MsgCreateDynamicStore({ creator: protoMsg.creator });
  }

  // ... other required methods
}
```

### 4. Registry Updates

```typescript
// src/transactions/amino/objectConverter.ts
export const ProtoTypeRegistry = createRegistry(
  // ... existing messages
  MsgCreateDynamicStore,
  MsgUpdateDynamicStore,
  MsgDeleteDynamicStore,
  MsgSetDynamicStoreValue
);

// src/transactions/amino/registry.ts
export function createBadgesAminoConverters(): AminoConverters {
  return {
    // ... existing converters
    ...createAminoConverter(MsgCreateDynamicStore, 'badges/CreateDynamicStore'),
    ...createAminoConverter(MsgUpdateDynamicStore, 'badges/UpdateDynamicStore'),
    ...createAminoConverter(MsgDeleteDynamicStore, 'badges/DeleteDynamicStore'),
    ...createAminoConverter(MsgSetDynamicStoreValue, 'badges/SetDynamicStoreValue')
  };
}
```

### 5. Sample Message Updates

```typescript
// src/transactions/eip712/payload/samples/getSampleMsg.ts
export function getSampleMsg(msgType: string, currMsg: any) {
  switch (msgType) {
    // ... existing cases
    case 'badges/CreateDynamicStore':
      return {
        type: msgType,
        value: new MsgCreateDynamicStore({
          creator: ''
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/UpdateDynamicStore':
      return {
        type: msgType,
        value: new MsgUpdateDynamicStore({
          creator: '',
          storeId: '0'
        }).toJson({ emitDefaultValues: true })
      };
    // ... other cases
  }
}
```

### 6. Message Normalization Updates

```typescript
// src/transactions/messages/base.ts
export const normalizeMessagesIfNecessary = (messages: MessageGenerated[]) => {
  const newMessages = messages.map((msg) => {
    const msgVal = msg.message;

    // ... existing conditions
    if (msgVal.getType().typeName === MsgCreateDynamicStore.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgCreateDynamicStore(msgVal as MsgCreateDynamicStore));
    } else if (msgVal.getType().typeName === MsgUpdateDynamicStore.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgUpdateDynamicStore(msgVal as MsgUpdateDynamicStore));
    } else if (msgVal.getType().typeName === MsgDeleteDynamicStore.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgDeleteDynamicStore(msgVal as MsgDeleteDynamicStore));
    } else if (msgVal.getType().typeName === MsgSetDynamicStoreValue.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgSetDynamicStoreValue(msgVal as MsgSetDynamicStoreValue));
    }
    // ... other conditions

    return msg;
  });

  return newMessages;
};
```

### 7. Population Functions

```typescript
// src/transactions/eip712/payload/samples/getSampleMsg.ts
export function populateUndefinedForMsgCreateDynamicStore(msg: MsgCreateDynamicStore) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgUpdateDynamicStore(msg: MsgUpdateDynamicStore) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgDeleteDynamicStore(msg: MsgDeleteDynamicStore) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgSetDynamicStoreValue(msg: MsgSetDynamicStoreValue) {
  // Simple message with only primitive types, no population needed
  return msg;
}
```

## Common Patterns

### Simple Messages

For messages with only primitive types:

```typescript
export interface iMsgSimple<T extends NumberType> {
  creator: BitBadgesAddress;
  fieldName: T;
}

export class MsgSimple<T extends NumberType> extends CustomTypeClass<MsgSimple<T>> implements iMsgSimple<T> {
  creator: BitBadgesAddress;
  fieldName: T;

  constructor(msg: iMsgSimple<T>) {
    super();
    this.creator = msg.creator;
    this.fieldName = msg.fieldName;
  }

  toProto(): protobadges.MsgSimple {
    return new protobadges.MsgSimple({
      creator: this.creator,
      fieldName: this.fieldName.toString()
    });
  }

  static fromProto(protoMsg: protobadges.MsgSimple): MsgSimple<NumberType> {
    return new MsgSimple({
      creator: protoMsg.creator,
      fieldName: protoMsg.fieldName
    });
  }

  // ... other required methods
}
```

### Messages with Complex Objects

For messages with complex nested objects:

```typescript
export interface iMsgComplex<T extends NumberType> {
  creator: BitBadgesAddress;
  complexObject: iComplexObject<T>;
}

export class MsgComplex<T extends NumberType> extends CustomTypeClass<MsgComplex<T>> implements iMsgComplex<T> {
  creator: BitBadgesAddress;
  complexObject: ComplexObject<T>;

  constructor(msg: iMsgComplex<T>) {
    super();
    this.creator = msg.creator;
    this.complexObject = new ComplexObject(msg.complexObject);
  }

  toProto(): protobadges.MsgComplex {
    return new protobadges.MsgComplex({
      creator: this.creator,
      complexObject: this.complexObject.toProto()
    });
  }

  static fromProto(protoMsg: protobadges.MsgComplex): MsgComplex<NumberType> {
    return new MsgComplex({
      creator: protoMsg.creator,
      complexObject: ComplexObject.fromProto(protoMsg.complexObject)
    });
  }

  // ... other required methods
}
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure all new message types are properly exported and imported.

2. **Type Errors**: Ensure that number fields are properly handled with the `NumberType` generic and conversion functions.

3. **Missing Proto Methods**: Every message class should have `toProto()`, `fromProto()`, `fromJson()`, and `fromJsonString()` methods.

4. **Amino Type Mismatch**: Ensure the amino type in the registry matches the proto option.

5. **Missing Number Fields**: Always include number fields in `getNumberFieldNames()` array.

6. **EIP-712 Compatibility**: Remember to use string values for number types in sample messages.

### Validation Checklist

- [ ] All new message types have corresponding interfaces
- [ ] All interfaces have corresponding TypeScript classes
- [ ] All classes implement the correct interfaces
- [ ] All classes have proper proto conversion methods
- [ ] All number fields use `<T extends NumberType>` generic format
- [ ] All number fields are included in `getNumberFieldNames()`
- [ ] All imports are updated
- [ ] Message types are added to proto type registry
- [ ] Message types are added to amino converters
- [ ] Sample message generation is updated in `getSampleMsg.ts`
- [ ] Message normalization is updated in `base.ts`
- [ ] Index file exports are updated
- [ ] TypeScript compilation passes
- [ ] Tests pass
- [ ] Documentation is updated if needed
- [ ] Generated `*_pb.ts` files are staged

## Gotchas and Common Mistakes

### 1. Number Type Conversion

**Problem**: Forgetting to convert between `NumberType` and string in proto methods.

**Solution**: Always convert `NumberType` to string in `toProto()` and vice versa in `fromProto()`:

```typescript
toProto(): protobadges.MsgExample {
  return new protobadges.MsgExample({
    amount: this.amount.toString() // Convert NumberType to string
  });
}

static fromProto(protoMsg: protobadges.MsgExample): MsgExample<NumberType> {
  return new MsgExample({
    amount: protoMsg.amount // Convert string to NumberType
  });
}
```

### 2. Amino Type Mismatch

**Problem**: Using wrong amino type in registry that doesn't match proto option.

**Solution**: Ensure the amino type matches exactly:

```protobuf
option (amino.name) = "badges/CreateDynamicStore";
```

```typescript
...createAminoConverter(MsgCreateDynamicStore, 'badges/CreateDynamicStore')
```

### 3. Missing Required Methods

**Problem**: Forgetting to implement required methods like `toBech32Addresses()` or `toCosmWasmPayloadString()`.

**Solution**: Always include all required methods in message classes:

```typescript
toBech32Addresses(prefix: string): MsgExample<T> {
  return new MsgExample({
    creator: getConvertFunctionFromPrefix(prefix)(this.creator),
    // ... other fields
  });
}

toCosmWasmPayloadString(): string {
  return `{"exampleMsg":${normalizeMessagesIfNecessary([
    {
      message: this.toProto(),
      path: this.toProto().getType().typeName
    }
  ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
}
```

### 4. EIP-712 String Values

**Problem**: Using number values instead of strings in sample messages.

**Solution**: Always use string values for number types in sample messages:

```typescript
case 'badges/Example':
  return {
    type: msgType,
    value: new MsgExample({
      creator: '',
      amount: '0' // Use string, not number
    }).toJson({ emitDefaultValues: true })
  };
```

### 5. Missing Index Export

**Problem**: Forgetting to export the new message class from the index file.

**Solution**: Always add the export to `index.ts`:

```typescript
export * from './msgNewMessageType.js';
```

### 6. CosmWasm Payload String Key

**Problem**: Using wrong key name in `toCosmWasmPayloadString()` method.

**Solution**: The key must match the field name in `BadgeCustomMsgType` proto message:

```typescript
toCosmWasmPayloadString(): string {
  return `{"createDynamicStoreMsg":${normalizeMessagesIfNecessary([
    {
      message: this.toProto(),
      path: this.toProto().getType().typeName
    }
  ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
}
```

The key `createDynamicStoreMsg` must match the field name in the proto:

```protobuf
message BadgeCustomMsgType {
  // ... other fields
  MsgCreateDynamicStore createDynamicStoreMsg = 8;
}
```

### 7. Import Order in Registry Files

**Problem**: Import order causing issues in registry files.

**Solution**: Maintain consistent import order and ensure all imports are present:

```typescript
// In objectConverter.ts and registry.ts
import {
  MsgCreateAddressLists,
  MsgCreateCollection,
  MsgCreateDynamicStore, // Add new imports in alphabetical order
  MsgDeleteCollection,
  MsgDeleteDynamicStore,
  MsgSetDynamicStoreValue,
  MsgTransferBadges,
  MsgUniversalUpdateCollection,
  MsgUpdateCollection,
  MsgUpdateDynamicStore,
  MsgUpdateUserApprovals
} from '@/proto/badges/tx_pb.js';
```

### 8. Message Normalization Order

**Problem**: Order of message normalization conditions affecting functionality.

**Solution**: Add new message conditions in logical order and ensure all conditions are covered:

```typescript
export const normalizeMessagesIfNecessary = (messages: MessageGenerated[]) => {
  const newMessages = messages.map((msg) => {
    const msgVal = msg.message;

    // Add new conditions in logical order
    if (msgVal.getType().typeName === MsgCreateDynamicStore.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgCreateDynamicStore(msgVal as MsgCreateDynamicStore));
    } else if (msgVal.getType().typeName === MsgDeleteDynamicStore.typeName) {
      msg = createProtoMsg(populateUndefinedForMsgDeleteDynamicStore(msgVal as MsgDeleteDynamicStore));
    }
    // ... other conditions

    return msg;
  });

  return newMessages;
};
```

### 9. Population Function Naming

**Problem**: Inconsistent naming of population functions.

**Solution**: Follow the exact naming pattern: `populateUndefinedForMsg{MessageName}`:

```typescript
export function populateUndefinedForMsgCreateDynamicStore(msg: MsgCreateDynamicStore) {
  // Implementation
}

export function populateUndefinedForMsgUpdateDynamicStore(msg: MsgUpdateDynamicStore) {
  // Implementation
}
```

### 10. TypeScript Generic Constraints

**Problem**: Forgetting to add `NumberType` import and generic constraints.

**Solution**: Always import `NumberType` and use proper generic constraints:

```typescript
import type { NumberType } from '@/common/string-numbers.js';

export class MsgExample<T extends NumberType> extends CustomTypeClass<MsgExample<T>> implements iMsgExample<T> {
  // Implementation
}
```

## Complete Implementation Example: Dynamic Store Messages

The Dynamic Store message types have been fully implemented in the SDK as a complete example of this process:

### Files Created/Modified:

1. **Interfaces** (`src/transactions/messages/bitbadges/badges/interfaces.ts`):

   - `iMsgCreateDynamicStore`
   - `iMsgUpdateDynamicStore<T extends NumberType>`
   - `iMsgDeleteDynamicStore<T extends NumberType>`
   - `iMsgSetDynamicStoreValue<T extends NumberType>`

2. **Message Classes**:

   - `src/transactions/messages/bitbadges/badges/msgCreateDynamicStore.ts`
   - `src/transactions/messages/bitbadges/badges/msgUpdateDynamicStore.ts`
   - `src/transactions/messages/bitbadges/badges/msgDeleteDynamicStore.ts`
   - `src/transactions/messages/bitbadges/badges/msgSetDynamicStoreValue.ts`

3. **Registry Updates**:

   - `src/transactions/amino/objectConverter.ts` - Added to `ProtoTypeRegistry`
   - `src/transactions/amino/registry.ts` - Added to `createBadgesAminoConverters()`

4. **Sample Messages** (`src/transactions/eip712/payload/samples/getSampleMsg.ts`):

   - Added sample message cases for all four message types
   - Added population functions for message normalization

5. **Message Normalization** (`src/transactions/messages/base.ts`):

   - Added normalization conditions for all four message types
   - Added imports for population functions

6. **Index Exports** (`src/transactions/messages/bitbadges/badges/index.ts`):
   - Added exports for all four message classes

### Verification:

The implementation has been verified with:

- ✅ TypeScript compilation successful
- ✅ No circular dependencies
- ✅ All imports properly configured
- ✅ Message types integrated into transaction building pipeline

## Conclusion

Following this process ensures that the TypeScript SDK remains in sync with the blockchain's proto definitions and provides proper transaction building capabilities for new message types. Always test your changes thoroughly and make sure to follow the existing patterns in the codebase for consistency. Remember to auto-stage the generated proto files after completion.

The key differences from adding proto fields are:

1. **Message-level changes** vs field-level changes
2. **Transaction building support** needs to be added
3. **Amino converters** need to be configured
4. **Sample message generation** needs to be updated
5. **Message normalization** needs to be handled
6. **Complete class structure** needs to be created

This comprehensive approach ensures that new message types are fully integrated into the SDK's transaction building and signing capabilities.

### Final Checklist for New Message Types:

- [ ] ✅ Proto files updated and generated
- [ ] ✅ Interfaces created with proper JSDoc comments
- [ ] ✅ Message classes created with all required methods
- [ ] ✅ Index file exports updated
- [ ] ✅ Proto type registry updated
- [ ] ✅ Amino converters configured
- [ ] ✅ Sample message generation updated
- [ ] ✅ Population functions created
- [ ] ✅ Message normalization updated
- [ ] ✅ TypeScript compilation successful
- [ ] ✅ No circular dependencies
- [ ] ✅ Generated proto files staged
