import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as badges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgSetOutgoingApproval } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { UserOutgoingApproval } from '@/core/approvals.js';
import type { NumberType } from '@/common/string-numbers.js';

/**
 * MsgSetOutgoingApproval is a helper message to set a single outgoing approval.
 *
 * @category Transactions
 */
export class MsgSetOutgoingApproval<T extends NumberType> extends CustomTypeClass<MsgSetOutgoingApproval<T>> implements iMsgSetOutgoingApproval<T> {
  creator: BitBadgesAddress;
  collectionId: string;
  approval: UserOutgoingApproval<T>;

  constructor(msg: iMsgSetOutgoingApproval<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.approval = new UserOutgoingApproval(msg.approval);
  }

  toProto(): badges.MsgSetOutgoingApproval {
    return new badges.MsgSetOutgoingApproval({
      creator: this.creator,
      collectionId: this.collectionId,
      approval: this.approval.toProto()
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSetOutgoingApproval<U> {
    return MsgSetOutgoingApproval.fromProto(badges.MsgSetOutgoingApproval.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSetOutgoingApproval<U> {
    return MsgSetOutgoingApproval.fromProto(badges.MsgSetOutgoingApproval.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: badges.MsgSetOutgoingApproval,
    convertFunction: (item: NumberType) => U
  ): MsgSetOutgoingApproval<U> {
    return new MsgSetOutgoingApproval({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      approval: protoMsg.approval ? UserOutgoingApproval.fromProto(protoMsg.approval, convertFunction) : ({} as any)
    });
  }

  toBech32Addresses(prefix: string): MsgSetOutgoingApproval<T> {
    return new MsgSetOutgoingApproval({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      approval: this.approval.toBech32Addresses(prefix)
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setOutgoingApprovalMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
