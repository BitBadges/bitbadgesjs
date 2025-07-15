import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as badges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgDeleteIncomingApproval } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import type { NumberType } from '@/common/string-numbers.js';

/**
 * MsgDeleteIncomingApproval is a helper message to delete a single incoming approval.
 *
 * @category Transactions
 */
export class MsgDeleteIncomingApproval extends CustomTypeClass<MsgDeleteIncomingApproval> implements iMsgDeleteIncomingApproval {
  creator: BitBadgesAddress;
  collectionId: string;
  approvalId: string;

  constructor(msg: iMsgDeleteIncomingApproval) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.approvalId = msg.approvalId;
  }

  toProto(): badges.MsgDeleteIncomingApproval {
    return new badges.MsgDeleteIncomingApproval({
      creator: this.creator,
      collectionId: this.collectionId,
      approvalId: this.approvalId
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgDeleteIncomingApproval {
    return MsgDeleteIncomingApproval.fromProto(badges.MsgDeleteIncomingApproval.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgDeleteIncomingApproval {
    return MsgDeleteIncomingApproval.fromProto(badges.MsgDeleteIncomingApproval.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: badges.MsgDeleteIncomingApproval): MsgDeleteIncomingApproval {
    return new MsgDeleteIncomingApproval({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      approvalId: protoMsg.approvalId
    });
  }

  toBech32Addresses(prefix: string): MsgDeleteIncomingApproval {
    return new MsgDeleteIncomingApproval({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      approvalId: this.approvalId
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"deleteIncomingApprovalMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
