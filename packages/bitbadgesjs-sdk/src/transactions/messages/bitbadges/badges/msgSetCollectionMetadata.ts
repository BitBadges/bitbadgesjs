import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetCollectionMetadata } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { CollectionMetadata } from '@/core/misc.js';
import { ActionPermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';
import type { iCollectionMetadata } from '@/interfaces/types/core.js';

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
  collectionMetadata: iCollectionMetadata;
  canUpdateCollectionMetadata: ActionPermission<T>[];

  constructor(msg: iMsgSetCollectionMetadata<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.collectionMetadata = msg.collectionMetadata;
    this.canUpdateCollectionMetadata = msg.canUpdateCollectionMetadata.map((permission) => new ActionPermission(permission));
  }

  toProto(): protobadges.MsgSetCollectionMetadata {
    const collectionMetadata = new CollectionMetadata(this.collectionMetadata).toProto();
    return new protobadges.MsgSetCollectionMetadata({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      collectionMetadata: collectionMetadata,
      canUpdateCollectionMetadata: this.canUpdateCollectionMetadata.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetCollectionMetadata<NumberType> {
    return MsgSetCollectionMetadata.fromProto(protobadges.MsgSetCollectionMetadata.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetCollectionMetadata<NumberType> {
    return MsgSetCollectionMetadata.fromProto(protobadges.MsgSetCollectionMetadata.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgSetCollectionMetadata): MsgSetCollectionMetadata<NumberType> {
    const collectionMetadata = protoMsg.collectionMetadata
      ? CollectionMetadata.fromProto(protoMsg.collectionMetadata)
      : new CollectionMetadata({ uri: '', customData: '' });
    return new MsgSetCollectionMetadata({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      collectionMetadata: collectionMetadata,
      canUpdateCollectionMetadata: protoMsg.canUpdateCollectionMetadata.map((permission) => ActionPermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetCollectionMetadata<T> {
    return new MsgSetCollectionMetadata({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      collectionMetadata: this.collectionMetadata,
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
