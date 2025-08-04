import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as badges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetCollectionMetadata } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { CollectionMetadataTimeline } from '@/core/misc.js';
import { TimedUpdatePermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetCollectionMetadata sets the collection metadata timeline and canUpdateCollectionMetadata permission.
 *
 * @category Transactions
 */
export class MsgSetCollectionMetadata<T extends NumberType>
  extends CustomTypeClass<MsgSetCollectionMetadata<T>>
  implements iMsgSetCollectionMetadata<T>
{
  creator: BitBadgesAddress;
  collectionId: T;
  collectionMetadataTimeline: CollectionMetadataTimeline<T>[];
  canUpdateCollectionMetadata: TimedUpdatePermission<T>[];

  constructor(msg: iMsgSetCollectionMetadata<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.collectionMetadataTimeline = msg.collectionMetadataTimeline.map((timeline) => new CollectionMetadataTimeline(timeline));
    this.canUpdateCollectionMetadata = msg.canUpdateCollectionMetadata.map((permission) => new TimedUpdatePermission(permission));
  }

  toProto(): badges.MsgSetCollectionMetadata {
    return new badges.MsgSetCollectionMetadata({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      collectionMetadataTimeline: this.collectionMetadataTimeline.map((timeline) => timeline.toProto()),
      canUpdateCollectionMetadata: this.canUpdateCollectionMetadata.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetCollectionMetadata<NumberType> {
    return MsgSetCollectionMetadata.fromProto(badges.MsgSetCollectionMetadata.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetCollectionMetadata<NumberType> {
    return MsgSetCollectionMetadata.fromProto(badges.MsgSetCollectionMetadata.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: badges.MsgSetCollectionMetadata): MsgSetCollectionMetadata<NumberType> {
    return new MsgSetCollectionMetadata({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      collectionMetadataTimeline: protoMsg.collectionMetadataTimeline.map((timeline) => CollectionMetadataTimeline.fromProto(timeline, Stringify)),
      canUpdateCollectionMetadata: protoMsg.canUpdateCollectionMetadata.map((permission) => TimedUpdatePermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetCollectionMetadata<T> {
    return new MsgSetCollectionMetadata({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      collectionMetadataTimeline: this.collectionMetadataTimeline,
      canUpdateCollectionMetadata: this.canUpdateCollectionMetadata
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setCollectionMetadataMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
