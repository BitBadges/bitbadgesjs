import type { Message, AnyMessage } from '@bufbuild/protobuf';
import { Any } from '@bufbuild/protobuf';

export interface MessageGenerated<T extends Message<T> = AnyMessage> {
  message: Message<T>;
  path: string;
}

/**
 * Walk a bufbuild proto message and recursively set effectively-empty
 * (default-valued) message-typed sub-fields to `undefined`. Required
 * for EIP-712 typed-data parity with the chain.
 *
 * Why: BitBadges' SDK class hierarchy auto-fills nested struct fields
 * with `new SubType({})` even when the user passes an empty input. With
 * the proto schema using `(gogoproto.nullable) = true`, the chain's
 * `MarshalAminoJSON` only omits a field when the pointer is nil — but
 * a non-nil pointer to an all-zero struct still emits `field: {}`. The
 * resulting empty struct types in the typed-data tree trigger
 * go-ethereum's `apitypes.EncodeType` empty-type bug (renders
 * `TypeName)` instead of `TypeName()`), which diverges from
 * `eth-sig-util` (what MetaMask uses), so signatures fail to verify.
 *
 * `dropEmptyProtoSubMessages` walks the proto via bufbuild reflection
 * and sets any sub-message with no on-wire content (i.e.
 * `subMsg.toBinary().length === 0` after recursing into its children)
 * back to `undefined`, so the field is omitted from the wire entirely.
 * Repeated message fields whose individual elements are empty are kept
 * (an empty element in a list is meaningful position-wise), but the
 * elements themselves are recursed into in case they contain droppable
 * sub-messages.
 */
export function dropEmptyProtoSubMessages<T extends Message<T> = AnyMessage>(msg: Message<T>): void {
  const fields = msg.getType().fields.list();
  for (const field of fields) {
    if (field.kind !== 'message') continue;
    const ln = field.localName as keyof typeof msg;
    const v = (msg as unknown as Record<string, unknown>)[field.localName];
    if (v == null) continue;

    if (field.repeated) {
      const arr = v as unknown[];
      for (const elem of arr) {
        if (elem != null && typeof (elem as { getType?: () => unknown }).getType === 'function') {
          dropEmptyProtoSubMessages(elem as Message);
        }
      }
      continue;
    }

    // Singular message field. Recurse first so deeply-empty descendants
    // get pruned, then check if this whole sub-message is now empty.
    const sub = v as Message;
    dropEmptyProtoSubMessages(sub);
    if (sub.toBinary().length === 0) {
      (msg as unknown as Record<string, unknown>)[field.localName] = undefined;
    }
  }
}

export function createAnyMessage(msg: MessageGenerated) {
  // Strip effectively-empty sub-messages from the wire representation
  // so the chain's amino re-marshaler omits them via `omitempty` and
  // the EIP-712 typed-data tree contains no empty struct types.
  dropEmptyProtoSubMessages(msg.message);
  return new Any({
    typeUrl: `/${msg.path}`,
    value: msg.message.toBinary()
  });
}

export function createProtoMsg<T extends Message<T> = AnyMessage>(msg: T): MessageGenerated<T> {
  const msgType = msg.getType();
  return {
    message: msg,
    path: msgType.typeName
  };
}

/**
 * Normalizes messages by ensuring they have the proper structure.
 * Because the current and other code doesn't support Msgs with optional / empty fields,
 * we need to populate undefined fields with empty default values.
 */
export const normalizeMessagesIfNecessary = (messages: MessageGenerated[]): MessageGenerated[] => {
  const newMessages = messages.map((msg) => {
    const msgVal = msg.message;
    return createProtoMsg(msgVal);
  });

  return newMessages;
};
