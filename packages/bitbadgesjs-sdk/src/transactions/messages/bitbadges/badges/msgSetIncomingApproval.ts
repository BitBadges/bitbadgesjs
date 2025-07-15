import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as badges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgSetIncomingApproval } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { UserIncomingApproval } from '@/core/approvals.js';
import type { NumberType } from '@/common/string-numbers.js';

/**
 * MsgSetIncomingApproval is a helper message to set a single incoming approval.
 *
 * @category Transactions
 */
export class MsgSetIncomingApproval<T extends NumberType> extends CustomTypeClass<MsgSetIncomingApproval<T>> implements iMsgSetIncomingApproval<T> {
  creator: BitBadgesAddress;
  collectionId: string;
  approval: UserIncomingApproval<T>;

  constructor(msg: iMsgSetIncomingApproval<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.approval = new UserIncomingApproval(msg.approval);
  }

  toProto(): badges.MsgSetIncomingApproval {
    return new badges.MsgSetIncomingApproval({
      creator: this.creator,
      collectionId: this.collectionId,
      approval: this.approval.toProto()
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSetIncomingApproval<U> {
    return MsgSetIncomingApproval.fromProto(badges.MsgSetIncomingApproval.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSetIncomingApproval<U> {
    return MsgSetIncomingApproval.fromProto(badges.MsgSetIncomingApproval.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: badges.MsgSetIncomingApproval,
    convertFunction: (item: NumberType) => U
  ): MsgSetIncomingApproval<U> {
    return new MsgSetIncomingApproval({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      approval: protoMsg.approval ? UserIncomingApproval.fromProto(protoMsg.approval, convertFunction) : ({} as any)
    });
  }

  toBech32Addresses(prefix: string): MsgSetIncomingApproval<T> {
    return new MsgSetIncomingApproval({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      approval: this.approval.toBech32Addresses(prefix)
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setIncomingApprovalMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
