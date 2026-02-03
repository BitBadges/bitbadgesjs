import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protomanagersplitter from '@/proto/managersplitter/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgExecuteUniversalUpdateCollection } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { MsgUniversalUpdateCollection } from '../badges/msgUniversalUpdateCollection.js';

/**
 * MsgExecuteUniversalUpdateCollection executes a UniversalUpdateCollection message
 * through the manager splitter, checking permissions before execution.
 *
 * @category Transactions
 */
export class MsgExecuteUniversalUpdateCollection extends CustomTypeClass<MsgExecuteUniversalUpdateCollection> implements iMsgExecuteUniversalUpdateCollection {
  executor: BitBadgesAddress;
  managerSplitterAddress: BitBadgesAddress;
  universalUpdateCollectionMsg: MsgUniversalUpdateCollection;

  constructor(msg: iMsgExecuteUniversalUpdateCollection) {
    super();
    this.executor = msg.executor;
    this.managerSplitterAddress = msg.managerSplitterAddress;
    this.universalUpdateCollectionMsg = new MsgUniversalUpdateCollection(msg.universalUpdateCollectionMsg);
  }

  toProto(): protomanagersplitter.MsgExecuteUniversalUpdateCollection {
    return new protomanagersplitter.MsgExecuteUniversalUpdateCollection({
      executor: this.executor,
      managerSplitterAddress: this.managerSplitterAddress,
      universalUpdateCollectionMsg: this.universalUpdateCollectionMsg.toProto()
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExecuteUniversalUpdateCollection {
    return MsgExecuteUniversalUpdateCollection.fromProto(protomanagersplitter.MsgExecuteUniversalUpdateCollection.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExecuteUniversalUpdateCollection {
    return MsgExecuteUniversalUpdateCollection.fromProto(protomanagersplitter.MsgExecuteUniversalUpdateCollection.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(protoMsg: protomanagersplitter.MsgExecuteUniversalUpdateCollection, convertFunction: (item: string | number) => U): MsgExecuteUniversalUpdateCollection {
    return new MsgExecuteUniversalUpdateCollection({
      executor: protoMsg.executor,
      managerSplitterAddress: protoMsg.managerSplitterAddress,
      universalUpdateCollectionMsg: MsgUniversalUpdateCollection.fromProto(protoMsg.universalUpdateCollectionMsg!, convertFunction)
    });
  }

  toBech32Addresses(prefix: string): MsgExecuteUniversalUpdateCollection {
    return new MsgExecuteUniversalUpdateCollection({
      executor: getConvertFunctionFromPrefix(prefix)(this.executor),
      managerSplitterAddress: getConvertFunctionFromPrefix(prefix)(this.managerSplitterAddress),
      universalUpdateCollectionMsg: this.universalUpdateCollectionMsg.toBech32Addresses(prefix)
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"executeUniversalUpdateCollectionMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
