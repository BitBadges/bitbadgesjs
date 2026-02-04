import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as prototokenization from '@/proto/tokenization/tx_pb.js';

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
export class MsgPurgeApprovals<T extends NumberType> extends CustomTypeClass<MsgPurgeApprovals<T>> implements iMsgPurgeApprovals<T> {
  creator: BitBadgesAddress;
  collectionId: string;
  purgeExpired: boolean;
  approverAddress: BitBadgesAddress;
  purgeCounterpartyApprovals: boolean;
  approvalsToPurge: ApprovalIdentifierDetails<T>[];

  constructor(msg: iMsgPurgeApprovals<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.purgeExpired = msg.purgeExpired;
    this.approverAddress = msg.approverAddress;
    this.purgeCounterpartyApprovals = msg.purgeCounterpartyApprovals;
    this.approvalsToPurge = msg.approvalsToPurge.map((approval) => new ApprovalIdentifierDetails(approval));
  }

  toProto(): prototokenization.MsgPurgeApprovals {
    return new prototokenization.MsgPurgeApprovals({
      creator: this.creator,
      collectionId: this.collectionId,
      purgeExpired: this.purgeExpired,
      approverAddress: this.approverAddress,
      purgeCounterpartyApprovals: this.purgeCounterpartyApprovals,
      approvalsToPurge: this.approvalsToPurge.map((approval) => approval.toProto())
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgPurgeApprovals<U> {
    return MsgPurgeApprovals.fromProto(prototokenization.MsgPurgeApprovals.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgPurgeApprovals<U> {
    return MsgPurgeApprovals.fromProto(prototokenization.MsgPurgeApprovals.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(protoMsg: prototokenization.MsgPurgeApprovals, convertFunction: (item: NumberType) => U): MsgPurgeApprovals<U> {
    return new MsgPurgeApprovals({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      purgeExpired: protoMsg.purgeExpired,
      approverAddress: protoMsg.approverAddress,
      purgeCounterpartyApprovals: protoMsg.purgeCounterpartyApprovals,
      approvalsToPurge: protoMsg.approvalsToPurge.map((approval) => ApprovalIdentifierDetails.fromProto(approval, convertFunction))
    });
  }

  toBech32Addresses(prefix: string): MsgPurgeApprovals<T> {
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
