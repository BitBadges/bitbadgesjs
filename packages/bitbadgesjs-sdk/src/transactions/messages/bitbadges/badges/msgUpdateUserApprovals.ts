import * as protobadges from '@/proto/badges/tx_pb.js';

import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { Stringify } from '@/common/string-numbers.js';
import { UserIncomingApproval, UserOutgoingApproval } from '@/core/approvals.js';
import { UserPermissions } from '@/core/permissions.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type { iMsgUpdateUserApprovals } from './interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { CollectionId } from '@/interfaces/index.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgUpdateUserApprovals represents the message for updating user approvals.
 *
 * For a transfer to be successful, the transfer has to satisfy the following conditions:
 * - Be approved on the collection level
 * - Be approved by the recipient's incoming transfers (if not forcefully overriden by the collection)
 * - Be approved by the sender's outgoing transfers (if not forcefully overriden by the collection)
 * - The sender must have enough tokens to transfer
 * - All restrictions and challenges for each approval must be satisfied (merkle challenges, approved amounts, max num transfers, ...)
 *
 * For successful execution, the user must have the necessary permissions to update the corresponding fields. If not, it will throw an error.
 * Permissions are updated last, so any permissions checked are the permissions BEFORE the update.
 *
 * To specify you would like to update a field, the corresponding update field must be set to true. If it is set to false, we ignore it.
 *
 * @category Transactions
 */
export class MsgUpdateUserApprovals<T extends NumberType>
  extends BaseNumberTypeClass<MsgUpdateUserApprovals<T>>
  implements iMsgUpdateUserApprovals<T>
{
  creator: BitBadgesAddress;
  collectionId: CollectionId;
  updateOutgoingApprovals?: boolean;
  outgoingApprovals?: UserOutgoingApproval<T>[];
  updateIncomingApprovals?: boolean;
  incomingApprovals?: UserIncomingApproval<T>[];
  updateAutoApproveSelfInitiatedOutgoingTransfers?: boolean;
  autoApproveSelfInitiatedOutgoingTransfers?: boolean;
  updateAutoApproveSelfInitiatedIncomingTransfers?: boolean;
  autoApproveSelfInitiatedIncomingTransfers?: boolean;
  updateAutoApproveAllIncomingTransfers?: boolean;
  autoApproveAllIncomingTransfers?: boolean;
  updateUserPermissions?: boolean;
  userPermissions?: UserPermissions<T>;

  constructor(msg: iMsgUpdateUserApprovals<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.updateOutgoingApprovals = msg.updateOutgoingApprovals;
    this.outgoingApprovals = msg.outgoingApprovals?.map((x) => new UserOutgoingApproval(x));
    this.updateIncomingApprovals = msg.updateIncomingApprovals;
    this.incomingApprovals = msg.incomingApprovals?.map((x) => new UserIncomingApproval(x));
    this.updateAutoApproveSelfInitiatedOutgoingTransfers = msg.updateAutoApproveSelfInitiatedOutgoingTransfers;
    this.autoApproveSelfInitiatedOutgoingTransfers = msg.autoApproveSelfInitiatedOutgoingTransfers;
    this.updateAutoApproveSelfInitiatedIncomingTransfers = msg.updateAutoApproveSelfInitiatedIncomingTransfers;
    this.autoApproveSelfInitiatedIncomingTransfers = msg.autoApproveSelfInitiatedIncomingTransfers;
    this.updateAutoApproveAllIncomingTransfers = msg.updateAutoApproveAllIncomingTransfers;
    this.autoApproveAllIncomingTransfers = msg.autoApproveAllIncomingTransfers;
    this.updateUserPermissions = msg.updateUserPermissions;
    this.userPermissions = msg.userPermissions ? new UserPermissions(msg.userPermissions) : undefined;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgUpdateUserApprovals<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgUpdateUserApprovals<U>;
  }

  toProto(): protobadges.MsgUpdateUserApprovals {
    return new protobadges.MsgUpdateUserApprovals(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgUpdateUserApprovals<U> {
    return MsgUpdateUserApprovals.fromProto(protobadges.MsgUpdateUserApprovals.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgUpdateUserApprovals<U> {
    return MsgUpdateUserApprovals.fromProto(protobadges.MsgUpdateUserApprovals.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: protobadges.MsgUpdateUserApprovals,
    convertFunction: (item: NumberType) => U
  ): MsgUpdateUserApprovals<U> {
    return new MsgUpdateUserApprovals({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      updateOutgoingApprovals: protoMsg.updateOutgoingApprovals,
      outgoingApprovals: protoMsg.outgoingApprovals.map((x) => UserOutgoingApproval.fromProto(x, convertFunction)),
      updateIncomingApprovals: protoMsg.updateIncomingApprovals,
      incomingApprovals: protoMsg.incomingApprovals.map((x) => UserIncomingApproval.fromProto(x, convertFunction)),
      updateAutoApproveSelfInitiatedOutgoingTransfers: protoMsg.updateAutoApproveSelfInitiatedOutgoingTransfers,
      autoApproveSelfInitiatedOutgoingTransfers: protoMsg.autoApproveSelfInitiatedOutgoingTransfers,
      updateAutoApproveSelfInitiatedIncomingTransfers: protoMsg.updateAutoApproveSelfInitiatedIncomingTransfers,
      autoApproveSelfInitiatedIncomingTransfers: protoMsg.autoApproveSelfInitiatedIncomingTransfers,
      updateAutoApproveAllIncomingTransfers: protoMsg.updateAutoApproveAllIncomingTransfers,
      autoApproveAllIncomingTransfers: protoMsg.autoApproveAllIncomingTransfers,
      updateUserPermissions: protoMsg.updateUserPermissions,
      userPermissions: protoMsg.userPermissions
        ? UserPermissions.fromProto(protoMsg.userPermissions, convertFunction)
        : new UserPermissions({
            canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
            canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
            canUpdateIncomingApprovals: [],
            canUpdateOutgoingApprovals: [],
            canUpdateAutoApproveAllIncomingTransfers: []
          })
    });
  }

  toBech32Addresses(prefix: string): MsgUpdateUserApprovals<T> {
    return new MsgUpdateUserApprovals<T>({
      ...this,
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      outgoingApprovals: this.outgoingApprovals?.map((x) => x.toBech32Addresses(prefix)),
      incomingApprovals: this.incomingApprovals?.map((x) => x.toBech32Addresses(prefix)),
      userPermissions: this.userPermissions?.toBech32Addresses(prefix)
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"updateUserApprovalsMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
