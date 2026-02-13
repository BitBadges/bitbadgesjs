import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as prototokenization from '@/proto/tokenization/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetTokenMetadata } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../utils.js';
import { TokenMetadata } from '@/core/misc.js';
import { TokenIdsActionPermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetTokenMetadata sets the token metadata timeline and canUpdateTokenMetadata permission.
 *
 * @category Transactions
 */
export class MsgSetTokenMetadata<T extends NumberType> extends CustomTypeClass<MsgSetTokenMetadata<T>> implements iMsgSetTokenMetadata<T> {
  creator: BitBadgesAddress;
  collectionId: T;
  tokenMetadata: TokenMetadata<T>[];
  canUpdateTokenMetadata: TokenIdsActionPermission<T>[];

  constructor(msg: iMsgSetTokenMetadata<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.tokenMetadata = msg.tokenMetadata.map((tm) => new TokenMetadata(tm));
    this.canUpdateTokenMetadata = msg.canUpdateTokenMetadata.map((permission) => new TokenIdsActionPermission(permission));
  }

  toProto(): prototokenization.MsgSetTokenMetadata {
    return new prototokenization.MsgSetTokenMetadata({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      tokenMetadata: this.tokenMetadata.map((tm) => tm.toProto()),
      canUpdateTokenMetadata: this.canUpdateTokenMetadata.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetTokenMetadata<NumberType> {
    return MsgSetTokenMetadata.fromProto(prototokenization.MsgSetTokenMetadata.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetTokenMetadata<NumberType> {
    return MsgSetTokenMetadata.fromProto(prototokenization.MsgSetTokenMetadata.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: prototokenization.MsgSetTokenMetadata): MsgSetTokenMetadata<NumberType> {
    const tokenMetadata = protoMsg.tokenMetadata.map((tm) => TokenMetadata.fromProto(tm, Stringify));
    return new MsgSetTokenMetadata({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      tokenMetadata: tokenMetadata,
      canUpdateTokenMetadata: protoMsg.canUpdateTokenMetadata.map((permission) => TokenIdsActionPermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetTokenMetadata<T> {
    return new MsgSetTokenMetadata({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      tokenMetadata: this.tokenMetadata,
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
