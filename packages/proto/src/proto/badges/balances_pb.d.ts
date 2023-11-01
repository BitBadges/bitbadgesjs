// package: bitbadges.bitbadgeschain.badges
// file: badges/balances.proto

import * as jspb from "google-protobuf";
import * as gogoproto_gogo_pb from "../gogoproto/gogo_pb";
import * as badges_params_pb from "../badges/params_pb";

export class UintRange extends jspb.Message {
  getStart(): string;
  setStart(value: string): void;

  getEnd(): string;
  setEnd(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UintRange.AsObject;
  static toObject(includeInstance: boolean, msg: UintRange): UintRange.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UintRange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UintRange;
  static deserializeBinaryFromReader(message: UintRange, reader: jspb.BinaryReader): UintRange;
}

export namespace UintRange {
  export type AsObject = {
    start: string,
    end: string,
  }
}

export class Balance extends jspb.Message {
  getAmount(): string;
  setAmount(value: string): void;

  clearOwnershiptimesList(): void;
  getOwnershiptimesList(): Array<UintRange>;
  setOwnershiptimesList(value: Array<UintRange>): void;
  addOwnershiptimes(value?: UintRange, index?: number): UintRange;

  clearBadgeidsList(): void;
  getBadgeidsList(): Array<UintRange>;
  setBadgeidsList(value: Array<UintRange>): void;
  addBadgeids(value?: UintRange, index?: number): UintRange;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Balance.AsObject;
  static toObject(includeInstance: boolean, msg: Balance): Balance.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Balance, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Balance;
  static deserializeBinaryFromReader(message: Balance, reader: jspb.BinaryReader): Balance;
}

export namespace Balance {
  export type AsObject = {
    amount: string,
    ownershiptimesList: Array<UintRange.AsObject>,
    badgeidsList: Array<UintRange.AsObject>,
  }
}

export class MustOwnBadges extends jspb.Message {
  getCollectionid(): string;
  setCollectionid(value: string): void;

  hasAmountrange(): boolean;
  clearAmountrange(): void;
  getAmountrange(): UintRange | undefined;
  setAmountrange(value?: UintRange): void;

  clearOwnershiptimesList(): void;
  getOwnershiptimesList(): Array<UintRange>;
  setOwnershiptimesList(value: Array<UintRange>): void;
  addOwnershiptimes(value?: UintRange, index?: number): UintRange;

  clearBadgeidsList(): void;
  getBadgeidsList(): Array<UintRange>;
  setBadgeidsList(value: Array<UintRange>): void;
  addBadgeids(value?: UintRange, index?: number): UintRange;

  getOverridewithcurrenttime(): boolean;
  setOverridewithcurrenttime(value: boolean): void;

  getMustownall(): boolean;
  setMustownall(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MustOwnBadges.AsObject;
  static toObject(includeInstance: boolean, msg: MustOwnBadges): MustOwnBadges.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MustOwnBadges, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MustOwnBadges;
  static deserializeBinaryFromReader(message: MustOwnBadges, reader: jspb.BinaryReader): MustOwnBadges;
}

export namespace MustOwnBadges {
  export type AsObject = {
    collectionid: string,
    amountrange?: UintRange.AsObject,
    ownershiptimesList: Array<UintRange.AsObject>,
    badgeidsList: Array<UintRange.AsObject>,
    overridewithcurrenttime: boolean,
    mustownall: boolean,
  }
}

export class InheritedBalance extends jspb.Message {
  clearBadgeidsList(): void;
  getBadgeidsList(): Array<UintRange>;
  setBadgeidsList(value: Array<UintRange>): void;
  addBadgeids(value?: UintRange, index?: number): UintRange;

  getParentcollectionid(): string;
  setParentcollectionid(value: string): void;

  clearParentbadgeidsList(): void;
  getParentbadgeidsList(): Array<UintRange>;
  setParentbadgeidsList(value: Array<UintRange>): void;
  addParentbadgeids(value?: UintRange, index?: number): UintRange;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InheritedBalance.AsObject;
  static toObject(includeInstance: boolean, msg: InheritedBalance): InheritedBalance.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InheritedBalance, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InheritedBalance;
  static deserializeBinaryFromReader(message: InheritedBalance, reader: jspb.BinaryReader): InheritedBalance;
}

export namespace InheritedBalance {
  export type AsObject = {
    badgeidsList: Array<UintRange.AsObject>,
    parentcollectionid: string,
    parentbadgeidsList: Array<UintRange.AsObject>,
  }
}

