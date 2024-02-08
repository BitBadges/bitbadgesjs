import { AnyMessage, Message } from "@bufbuild/protobuf";

export function createProtoMsg<T extends Message<T> = AnyMessage>(msg: T) {
  return {
    message: msg,
    path: msg.getType().typeName
  };
}
