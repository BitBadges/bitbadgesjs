import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as prototokenization from '@/proto/tokenization/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgCastVote } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import type { NumberType } from '@/common/string-numbers.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../utils.js';

/**
 * MsgCastVote allows a voter to cast or update their vote for a voting challenge.
 *
 * @category Transactions
 */
export class MsgCastVote<T extends NumberType> extends CustomTypeClass<MsgCastVote<T>> implements iMsgCastVote<T> {
  creator: BitBadgesAddress;
  collectionId: T;
  approvalLevel: string;
  approverAddress: BitBadgesAddress;
  approvalId: string;
  proposalId: string;
  yesWeight: T;

  constructor(msg: iMsgCastVote<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.approvalLevel = msg.approvalLevel;
    this.approverAddress = msg.approverAddress;
    this.approvalId = msg.approvalId;
    this.proposalId = msg.proposalId;
    this.yesWeight = msg.yesWeight;
  }

  toProto(): prototokenization.MsgCastVote {
    return new prototokenization.MsgCastVote({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      approvalLevel: this.approvalLevel,
      approverAddress: this.approverAddress,
      approvalId: this.approvalId,
      proposalId: this.proposalId,
      yesWeight: this.yesWeight.toString()
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgCastVote<NumberType> {
    return MsgCastVote.fromProto(prototokenization.MsgCastVote.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgCastVote<NumberType> {
    return MsgCastVote.fromProto(prototokenization.MsgCastVote.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: prototokenization.MsgCastVote): MsgCastVote<NumberType> {
    return new MsgCastVote({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      approvalLevel: protoMsg.approvalLevel,
      approverAddress: protoMsg.approverAddress,
      approvalId: protoMsg.approvalId,
      proposalId: protoMsg.proposalId,
      yesWeight: protoMsg.yesWeight
    });
  }

  toBech32Addresses(prefix: string): MsgCastVote<T> {
    return new MsgCastVote({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      approvalLevel: this.approvalLevel,
      approverAddress: getConvertFunctionFromPrefix(prefix)(this.approverAddress),
      approvalId: this.approvalId,
      proposalId: this.proposalId,
      yesWeight: this.yesWeight
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"castVoteMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
