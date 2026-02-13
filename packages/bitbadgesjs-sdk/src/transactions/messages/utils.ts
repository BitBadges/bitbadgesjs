import type { Message, AnyMessage } from '@bufbuild/protobuf';
import { Any } from '@bufbuild/protobuf';

export interface MessageGenerated<T extends Message<T> = AnyMessage> {
  message: Message<T>;
  path: string;
}

export function createAnyMessage(msg: MessageGenerated) {
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
