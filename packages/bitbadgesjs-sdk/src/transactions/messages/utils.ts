import type { Message, AnyMessage } from '@bufbuild/protobuf';
import { Any } from '@bufbuild/protobuf';

export interface MessageGenerated<T extends Message = AnyMessage> {
  message: Message;
  path: string;
}

export function createAnyMessage(msg: MessageGenerated) {
  return new Any({
    typeUrl: `/${msg.path}`,
    value: msg.message.toBinary()
  });
}
