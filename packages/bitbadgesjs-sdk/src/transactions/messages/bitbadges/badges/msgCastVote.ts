import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgCastVote } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import type { NumberType } from '@/common/string-numbers.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgCastVote allows a voter to cast or update their vote for a voting challenge.
 *
 * @category Transactions
 */
export class MsgCastVote extends CustomTypeClass<MsgCastVote> implements iMsgCastVote {
  creator: BitBadgesAddress;
  collectionId: string | number;
  approvalLevel: string;
  approverAddress: BitBadgesAddress;
  approvalId: string;
  proposalId: string;
  yesWeight: string | number;

  constructor(msg: iMsgCastVote) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.approvalLevel = msg.approvalLevel;
    this.approverAddress = msg.approverAddress;
    this.approvalId = msg.approvalId;
    this.proposalId = msg.proposalId;
    this.yesWeight = msg.yesWeight;
  }

  toProto(): protobadges.MsgCastVote {
    return new protobadges.MsgCastVote({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      approvalLevel: this.approvalLevel,
      approverAddress: this.approverAddress,
      approvalId: this.approvalId,
      proposalId: this.proposalId,
      yesWeight: this.yesWeight.toString()
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgCastVote {
    return MsgCastVote.fromProto(protobadges.MsgCastVote.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgCastVote {
    return MsgCastVote.fromProto(protobadges.MsgCastVote.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgCastVote): MsgCastVote {
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

  toBech32Addresses(prefix: string): MsgCastVote {
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
