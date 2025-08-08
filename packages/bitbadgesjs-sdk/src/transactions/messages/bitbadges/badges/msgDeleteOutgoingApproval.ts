import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgDeleteOutgoingApproval } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import type { NumberType } from '@/common/string-numbers.js';

/**
 * MsgDeleteOutgoingApproval is a helper message to delete a single outgoing approval.
 *
 * @category Transactions
 */
export class MsgDeleteOutgoingApproval extends CustomTypeClass<MsgDeleteOutgoingApproval> implements iMsgDeleteOutgoingApproval {
  creator: BitBadgesAddress;
  collectionId: string;
  approvalId: string;

  constructor(msg: iMsgDeleteOutgoingApproval) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.approvalId = msg.approvalId;
  }

  toProto(): protobadges.MsgDeleteOutgoingApproval {
    return new protobadges.MsgDeleteOutgoingApproval({
      creator: this.creator,
      collectionId: this.collectionId,
      approvalId: this.approvalId
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgDeleteOutgoingApproval {
    return MsgDeleteOutgoingApproval.fromProto(protobadges.MsgDeleteOutgoingApproval.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgDeleteOutgoingApproval {
    return MsgDeleteOutgoingApproval.fromProto(protobadges.MsgDeleteOutgoingApproval.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgDeleteOutgoingApproval): MsgDeleteOutgoingApproval {
    return new MsgDeleteOutgoingApproval({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      approvalId: protoMsg.approvalId
    });
  }

  toBech32Addresses(prefix: string): MsgDeleteOutgoingApproval {
    return new MsgDeleteOutgoingApproval({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      approvalId: this.approvalId
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"deleteOutgoingApprovalMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
