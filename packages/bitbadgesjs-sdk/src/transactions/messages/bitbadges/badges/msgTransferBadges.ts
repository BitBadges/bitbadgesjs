import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { Stringify } from '@/common/string-numbers.js';
import * as protobadges from '@/proto/badges/tx_pb.js';
import type { iMsgTransferTokens } from './interfaces.js';

import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { Transfer } from '@/core/transfers.js';
import { CollectionId } from '@/interfaces/index.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';

/**
 * MsgTransferTokens represents a message to transfer tokens from one user to another.
 * For a transfer to be successful, the transfer has to satisfy the following conditions:
 * - Be approved on the collection level
 * - Be approved by the recipient's incoming transfers (if not forcefully overriden by the collection)
 * - Be approved by the sender's outgoing transfers (if not forcefully overriden by the collection)
 * - The sender must have enough tokens to transfer
 * - All restrictions and challenges for each approval must be satisfied (merkle challenges, approved amounts, max num transfers, ...)
 *
 * Note that the transfer transaction is atomic, meaning that either all transfers succeed or all fail.
 *
 * @category Transactions
 */
export class MsgTransferTokens<T extends NumberType> extends BaseNumberTypeClass<MsgTransferTokens<T>> implements iMsgTransferTokens<T> {
  creator: BitBadgesAddress;
  collectionId: CollectionId;
  transfers: Transfer<T>[];

  constructor(msg: iMsgTransferTokens<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.transfers = msg.transfers.map((x) => new Transfer(x));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgTransferTokens<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgTransferTokens<U>;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  toProto(): protobadges.MsgTransferTokens {
    return new protobadges.MsgTransferTokens(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgTransferTokens<U> {
    return MsgTransferTokens.fromProto(protobadges.MsgTransferTokens.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgTransferTokens<U> {
    return MsgTransferTokens.fromProto(protobadges.MsgTransferTokens.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(protoMsg: protobadges.MsgTransferTokens, convertFunction: (item: NumberType) => U): MsgTransferTokens<U> {
    return new MsgTransferTokens({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      transfers: protoMsg.transfers.map((x) => Transfer.fromProto(x, convertFunction))
    });
  }

  toBech32Addresses(prefix: string): MsgTransferTokens<T> {
    return new MsgTransferTokens({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      transfers: this.transfers.map((x) => x.toBech32Addresses(prefix))
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"transferTokensMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
