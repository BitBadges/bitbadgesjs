import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgSetIncomingApproval } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { UserIncomingApproval } from '@/core/approvals.js';
import type { NumberType } from '@/common/string-numbers.js';

/**
 * MsgSetIncomingApproval is a helper message to set a single incoming approval.
 *
 * @category Transactions
 */
export class MsgSetIncomingApproval extends CustomTypeClass<MsgSetIncomingApproval> implements iMsgSetIncomingApproval {
  creator: BitBadgesAddress;
  collectionId: string;
  approval: UserIncomingApproval;

  constructor(msg: iMsgSetIncomingApproval) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.approval = new UserIncomingApproval(msg.approval);
  }

  toProto(): protobadges.MsgSetIncomingApproval {
    return new protobadges.MsgSetIncomingApproval({
      creator: this.creator,
      collectionId: this.collectionId,
      approval: this.approval.toProto()
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSetIncomingApproval {
    return MsgSetIncomingApproval.fromProto(protobadges.MsgSetIncomingApproval.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSetIncomingApproval {
    return MsgSetIncomingApproval.fromProto(protobadges.MsgSetIncomingApproval.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(protoMsg: protobadges.MsgSetIncomingApproval, convertFunction: (item: string | number) => U): MsgSetIncomingApproval {
    return new MsgSetIncomingApproval({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      approval: protoMsg.approval ? UserIncomingApproval.fromProto(protoMsg.approval, convertFunction) : ({} as any)
    });
  }

  toBech32Addresses(prefix: string): MsgSetIncomingApproval {
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
