// @ts-nocheck
/* eslint-disable */
/**
 * Generated by the protoc-gen-ts.  DO NOT EDIT!
 * compiler version: 3.6.1
 * source: badges/ranges.proto
 * git: https://github.com/thesayyn/protoc-gen-ts */
import * as pb_1 from "google-protobuf";
export namespace trevormil.bitbadgeschain.badges {
    export class IdRange extends pb_1.Message {
        #one_of_decls: number[][] = [];
        constructor(data?: any[] | {
            start?: number;
            end?: number;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [], this.#one_of_decls);
            if (!Array.isArray(data) && typeof data == "object") {
                if ("start" in data && data.start != undefined) {
                    this.start = data.start;
                }
                if ("end" in data && data.end != undefined) {
                    this.end = data.end;
                }
            }
        }
        get start() {
            return pb_1.Message.getFieldWithDefault(this, 1, 0) as number;
        }
        set start(value: number) {
            pb_1.Message.setField(this, 1, value);
        }
        get end() {
            return pb_1.Message.getFieldWithDefault(this, 2, 0) as number;
        }
        set end(value: number) {
            pb_1.Message.setField(this, 2, value);
        }
        static fromObject(data: {
            start?: number;
            end?: number;
        }): IdRange {
            const message = new IdRange({});
            if (data.start != null) {
                message.start = data.start;
            }
            if (data.end != null) {
                message.end = data.end;
            }
            return message;
        }
        toObject() {
            const data: {
                start?: number;
                end?: number;
            } = {};
            if (this.start != null) {
                data.start = this.start;
            }
            if (this.end != null) {
                data.end = this.end;
            }
            return data;
        }
        serialize(): Uint8Array;
        serialize(w: pb_1.BinaryWriter): void;
        serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
            const writer = w || new pb_1.BinaryWriter();
            if (this.start != 0)
                writer.writeUint64(1, this.start);
            if (this.end != 0)
                writer.writeUint64(2, this.end);
            if (!w)
                return writer.getResultBuffer();
        }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): IdRange {
            const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes), message = new IdRange();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.start = reader.readUint64();
                        break;
                    case 2:
                        message.end = reader.readUint64();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
        serializeBinary(): Uint8Array {
            return this.serialize();
        }
        static deserializeBinary(bytes: Uint8Array): IdRange {
            return IdRange.deserialize(bytes);
        }
    }
    export class BalanceObject extends pb_1.Message {
        #one_of_decls: number[][] = [];
        constructor(data?: any[] | {
            balance?: number;
            id_ranges?: IdRange[];
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [2], this.#one_of_decls);
            if (!Array.isArray(data) && typeof data == "object") {
                if ("balance" in data && data.balance != undefined) {
                    this.balance = data.balance;
                }
                if ("id_ranges" in data && data.id_ranges != undefined) {
                    this.id_ranges = data.id_ranges;
                }
            }
        }
        get balance() {
            return pb_1.Message.getFieldWithDefault(this, 1, 0) as number;
        }
        set balance(value: number) {
            pb_1.Message.setField(this, 1, value);
        }
        get id_ranges() {
            return pb_1.Message.getRepeatedWrapperField(this, IdRange, 2) as IdRange[];
        }
        set id_ranges(value: IdRange[]) {
            pb_1.Message.setRepeatedWrapperField(this, 2, value);
        }
        static fromObject(data: {
            balance?: number;
            id_ranges?: ReturnType<typeof IdRange.prototype.toObject>[];
        }): BalanceObject {
            const message = new BalanceObject({});
            if (data.balance != null) {
                message.balance = data.balance;
            }
            if (data.id_ranges != null) {
                message.id_ranges = data.id_ranges.map(item => IdRange.fromObject(item));
            }
            return message;
        }
        toObject() {
            const data: {
                balance?: number;
                id_ranges?: ReturnType<typeof IdRange.prototype.toObject>[];
            } = {};
            if (this.balance != null) {
                data.balance = this.balance;
            }
            if (this.id_ranges != null) {
                data.id_ranges = this.id_ranges.map((item: IdRange) => item.toObject());
            }
            return data;
        }
        serialize(): Uint8Array;
        serialize(w: pb_1.BinaryWriter): void;
        serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
            const writer = w || new pb_1.BinaryWriter();
            if (this.balance != 0)
                writer.writeUint64(1, this.balance);
            if (this.id_ranges.length)
                writer.writeRepeatedMessage(2, this.id_ranges, (item: IdRange) => item.serialize(writer));
            if (!w)
                return writer.getResultBuffer();
        }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): BalanceObject {
            const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes), message = new BalanceObject();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.balance = reader.readUint64();
                        break;
                    case 2:
                        reader.readMessage(message.id_ranges, () => pb_1.Message.addToRepeatedWrapperField(message, 2, IdRange.deserialize(reader), IdRange));
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
        serializeBinary(): Uint8Array {
            return this.serialize();
        }
        static deserializeBinary(bytes: Uint8Array): BalanceObject {
            return BalanceObject.deserialize(bytes);
        }
    }
}