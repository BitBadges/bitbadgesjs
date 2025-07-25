import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as badges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetCollectionApprovals } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { CollectionApproval } from '@/core/approvals.js';
import { CollectionApprovalPermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetCollectionApprovals sets the collection approvals and canUpdateCollectionApprovals permission.
 *
 * @category Transactions
 */
export class MsgSetCollectionApprovals<T extends NumberType>
  extends CustomTypeClass<MsgSetCollectionApprovals<T>>
  implements iMsgSetCollectionApprovals<T>
{
  creator: BitBadgesAddress;
  collectionId: T;
  collectionApprovals: CollectionApproval<T>[];
  canUpdateCollectionApprovals: CollectionApprovalPermission<T>[];

  constructor(msg: iMsgSetCollectionApprovals<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.collectionApprovals = msg.collectionApprovals.map((approval) => new CollectionApproval(approval));
    this.canUpdateCollectionApprovals = msg.canUpdateCollectionApprovals.map((permission) => new CollectionApprovalPermission(permission));
  }

  toProto(): badges.MsgSetCollectionApprovals {
    return new badges.MsgSetCollectionApprovals({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      collectionApprovals: this.collectionApprovals.map((approval) => approval.toProto()),
      canUpdateCollectionApprovals: this.canUpdateCollectionApprovals.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetCollectionApprovals<NumberType> {
    return MsgSetCollectionApprovals.fromProto(badges.MsgSetCollectionApprovals.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetCollectionApprovals<NumberType> {
    return MsgSetCollectionApprovals.fromProto(badges.MsgSetCollectionApprovals.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: badges.MsgSetCollectionApprovals): MsgSetCollectionApprovals<NumberType> {
    return new MsgSetCollectionApprovals({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      collectionApprovals: protoMsg.collectionApprovals.map((approval) => CollectionApproval.fromProto(approval, Stringify)),
      canUpdateCollectionApprovals: protoMsg.canUpdateCollectionApprovals.map((permission) =>
        CollectionApprovalPermission.fromProto(permission, Stringify)
      )
    });
  }

  toBech32Addresses(prefix: string): MsgSetCollectionApprovals<T> {
    return new MsgSetCollectionApprovals({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      collectionApprovals: this.collectionApprovals,
      canUpdateCollectionApprovals: this.canUpdateCollectionApprovals
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setCollectionApprovalsMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
