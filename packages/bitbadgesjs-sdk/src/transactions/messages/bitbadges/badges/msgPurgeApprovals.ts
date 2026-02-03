import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgPurgeApprovals } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { ApprovalIdentifierDetails } from '@/core/misc.js';
import type { NumberType } from '@/common/string-numbers.js';

/**
 * MsgPurgeApprovals is a helper message to purge expired approvals.
 *
 * @category Transactions
 */
export class MsgPurgeApprovals extends CustomTypeClass<MsgPurgeApprovals> implements iMsgPurgeApprovals {
  creator: BitBadgesAddress;
  collectionId: string;
  purgeExpired: boolean;
  approverAddress: BitBadgesAddress;
  purgeCounterpartyApprovals: boolean;
  approvalsToPurge: ApprovalIdentifierDetails[];

  constructor(msg: iMsgPurgeApprovals) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.purgeExpired = msg.purgeExpired;
    this.approverAddress = msg.approverAddress;
    this.purgeCounterpartyApprovals = msg.purgeCounterpartyApprovals;
    this.approvalsToPurge = msg.approvalsToPurge.map((approval) => new ApprovalIdentifierDetails(approval));
  }

  toProto(): protobadges.MsgPurgeApprovals {
    return new protobadges.MsgPurgeApprovals({
      creator: this.creator,
      collectionId: this.collectionId,
      purgeExpired: this.purgeExpired,
      approverAddress: this.approverAddress,
      purgeCounterpartyApprovals: this.purgeCounterpartyApprovals,
      approvalsToPurge: this.approvalsToPurge.map((approval) => approval.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgPurgeApprovals {
    return MsgPurgeApprovals.fromProto(protobadges.MsgPurgeApprovals.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgPurgeApprovals {
    return MsgPurgeApprovals.fromProto(protobadges.MsgPurgeApprovals.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(protoMsg: protobadges.MsgPurgeApprovals, convertFunction: (item: string | number) => U): MsgPurgeApprovals {
    return new MsgPurgeApprovals({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      purgeExpired: protoMsg.purgeExpired,
      approverAddress: protoMsg.approverAddress,
      purgeCounterpartyApprovals: protoMsg.purgeCounterpartyApprovals,
      approvalsToPurge: protoMsg.approvalsToPurge.map((approval) => ApprovalIdentifierDetails.fromProto(approval, convertFunction))
    });
  }

  toBech32Addresses(prefix: string): MsgPurgeApprovals {
    return new MsgPurgeApprovals({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      purgeExpired: this.purgeExpired,
      approverAddress: getConvertFunctionFromPrefix(prefix)(this.approverAddress),
      purgeCounterpartyApprovals: this.purgeCounterpartyApprovals,
      approvalsToPurge: this.approvalsToPurge.map((approval) => approval.toBech32Addresses(prefix))
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"purgeApprovalsMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
