import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetTokenMetadata } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { TokenMetadataTimeline } from '@/core/misc.js';
import { TimedUpdateWithTokenIdsPermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetTokenMetadata sets the token metadata timeline and canUpdateTokenMetadata permission.
 *
 * @category Transactions
 */
export class MsgSetTokenMetadata<T extends NumberType> extends CustomTypeClass<MsgSetTokenMetadata<T>> implements iMsgSetTokenMetadata<T> {
  creator: BitBadgesAddress;
  collectionId: T;
  tokenMetadataTimeline: TokenMetadataTimeline<T>[];
  canUpdateTokenMetadata: TimedUpdateWithTokenIdsPermission<T>[];

  constructor(msg: iMsgSetTokenMetadata<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.tokenMetadataTimeline = msg.tokenMetadataTimeline.map((timeline) => new TokenMetadataTimeline(timeline));
    this.canUpdateTokenMetadata = msg.canUpdateTokenMetadata.map((permission) => new TimedUpdateWithTokenIdsPermission(permission));
  }

  toProto(): protobadges.MsgSetTokenMetadata {
    return new protobadges.MsgSetTokenMetadata({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      tokenMetadataTimeline: this.tokenMetadataTimeline.map((timeline) => timeline.toProto()),
      canUpdateTokenMetadata: this.canUpdateTokenMetadata.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetTokenMetadata<NumberType> {
    return MsgSetTokenMetadata.fromProto(protobadges.MsgSetTokenMetadata.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetTokenMetadata<NumberType> {
    return MsgSetTokenMetadata.fromProto(protobadges.MsgSetTokenMetadata.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgSetTokenMetadata): MsgSetTokenMetadata<NumberType> {
    return new MsgSetTokenMetadata({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      tokenMetadataTimeline: protoMsg.tokenMetadataTimeline.map((timeline) => TokenMetadataTimeline.fromProto(timeline, Stringify)),
      canUpdateTokenMetadata: protoMsg.canUpdateTokenMetadata.map((permission) => TimedUpdateWithTokenIdsPermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetTokenMetadata<T> {
    return new MsgSetTokenMetadata({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      tokenMetadataTimeline: this.tokenMetadataTimeline,
      canUpdateTokenMetadata: this.canUpdateTokenMetadata
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setTokenMetadataMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
