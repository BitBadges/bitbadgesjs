import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { Stringify } from '@/common/string-numbers.js';
import * as badges from '@/proto/badges/tx_pb.js';
import type { iMsgTransferBadges } from './interfaces.js';

import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';
import { Transfer } from '@/core/transfers.js';
import { CollectionId } from '@/interfaces/index.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';

/**
 * MsgTransferBadges represents a message to transfer badges from one user to another.
 * For a transfer to be successful, the transfer has to satisfy the following conditions:
 * - Be approved on the collection level
 * - Be approved by the recipient's incoming transfers (if not forcefully overriden by the collection)
 * - Be approved by the sender's outgoing transfers (if not forcefully overriden by the collection)
 * - The sender must have enough badges to transfer
 * - All restrictions and challenges for each approval must be satisfied (merkle challenges, approved amounts, max num transfers, ...)
 *
 * Note that the transfer transaction is atomic, meaning that either all transfers succeed or all fail.
 *
 * @category Transactions
 */
export class MsgTransferBadges<T extends NumberType> extends BaseNumberTypeClass<MsgTransferBadges<T>> implements iMsgTransferBadges<T> {
  creator: BitBadgesAddress;
  collectionId: CollectionId;
  transfers: Transfer<T>[];

  constructor(msg: iMsgTransferBadges<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.transfers = msg.transfers.map((x) => new Transfer(x));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgTransferBadges<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgTransferBadges<U>;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  toProto(): badges.MsgTransferBadges {
    return new badges.MsgTransferBadges(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgTransferBadges<U> {
    return MsgTransferBadges.fromProto(badges.MsgTransferBadges.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgTransferBadges<U> {
    return MsgTransferBadges.fromProto(badges.MsgTransferBadges.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(protoMsg: badges.MsgTransferBadges, convertFunction: (item: NumberType) => U): MsgTransferBadges<U> {
    return new MsgTransferBadges({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      transfers: protoMsg.transfers.map((x) => Transfer.fromProto(x, convertFunction))
    });
  }

  toBech32Addresses(prefix: string): MsgTransferBadges<T> {
    return new MsgTransferBadges({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      transfers: this.transfers.map((x) => x.toBech32Addresses(prefix))
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"transferBadgesMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
