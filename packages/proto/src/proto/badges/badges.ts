// @ts-nocheck
/* eslint-disable */
/**
 * Generated by the protoc-gen-ts.  DO NOT EDIT!
 * compiler version: 3.6.1
 * source: badges/badges.proto
 * git: https://github.com/thesayyn/protoc-gen-ts */
import * as dependency_1 from "./../google/protobuf/any";
import * as dependency_2 from "./ranges";
import * as dependency_3 from "./uris";
import * as pb_1 from "google-protobuf";
export namespace trevormil.bitbadgeschain.badges {
    export class BitBadge extends pb_1.Message {
        #one_of_decls: number[][] = [];
        constructor(data?: any[] | {
            id?: number;
            uri?: dependency_3.trevormil.bitbadgeschain.badges.UriObject;
            arbitraryBytes?: Uint8Array;
            manager?: number;
            permissions?: number;
            freezeRanges?: dependency_2.trevormil.bitbadgeschain.badges.IdRange[];
            nextSubassetId?: number;
            subassetSupplys?: dependency_2.trevormil.bitbadgeschain.badges.BalanceObject[];
            defaultSubassetSupply?: number;
            standard?: number;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [10, 13], this.#one_of_decls);
            if (!Array.isArray(data) && typeof data == "object") {
                if ("id" in data && data.id != undefined) {
                    this.id = data.id;
                }
                if ("uri" in data && data.uri != undefined) {
                    this.uri = data.uri;
                }
                if ("arbitraryBytes" in data && data.arbitraryBytes != undefined) {
                    this.arbitraryBytes = data.arbitraryBytes;
                }
                if ("manager" in data && data.manager != undefined) {
                    this.manager = data.manager;
                }
                if ("permissions" in data && data.permissions != undefined) {
                    this.permissions = data.permissions;
                }
                if ("freezeRanges" in data && data.freezeRanges != undefined) {
                    this.freezeRanges = data.freezeRanges;
                }
                if ("nextSubassetId" in data && data.nextSubassetId != undefined) {
                    this.nextSubassetId = data.nextSubassetId;
                }
                if ("subassetSupplys" in data && data.subassetSupplys != undefined) {
                    this.subassetSupplys = data.subassetSupplys;
                }
                if ("defaultSubassetSupply" in data && data.defaultSubassetSupply != undefined) {
                    this.defaultSubassetSupply = data.defaultSubassetSupply;
                }
                if ("standard" in data && data.standard != undefined) {
                    this.standard = data.standard;
                }
            }
        }
        get id() {
            return pb_1.Message.getFieldWithDefault(this, 1, 0) as number;
        }
        set id(value: number) {
            pb_1.Message.setField(this, 1, value);
        }
        get uri() {
            return pb_1.Message.getWrapperField(this, dependency_3.trevormil.bitbadgeschain.badges.UriObject, 2) as dependency_3.trevormil.bitbadgeschain.badges.UriObject;
        }
        set uri(value: dependency_3.trevormil.bitbadgeschain.badges.UriObject) {
            pb_1.Message.setWrapperField(this, 2, value);
        }
        get has_uri() {
            return pb_1.Message.getField(this, 2) != null;
        }
        get arbitraryBytes() {
            return pb_1.Message.getFieldWithDefault(this, 3, new Uint8Array()) as Uint8Array;
        }
        set arbitraryBytes(value: Uint8Array) {
            pb_1.Message.setField(this, 3, value);
        }
        get manager() {
            return pb_1.Message.getFieldWithDefault(this, 4, 0) as number;
        }
        set manager(value: number) {
            pb_1.Message.setField(this, 4, value);
        }
        get permissions() {
            return pb_1.Message.getFieldWithDefault(this, 5, 0) as number;
        }
        set permissions(value: number) {
            pb_1.Message.setField(this, 5, value);
        }
        get freezeRanges() {
            return pb_1.Message.getRepeatedWrapperField(this, dependency_2.trevormil.bitbadgeschain.badges.IdRange, 10) as dependency_2.trevormil.bitbadgeschain.badges.IdRange[];
        }
        set freezeRanges(value: dependency_2.trevormil.bitbadgeschain.badges.IdRange[]) {
            pb_1.Message.setRepeatedWrapperField(this, 10, value);
        }
        get nextSubassetId() {
            return pb_1.Message.getFieldWithDefault(this, 12, 0) as number;
        }
        set nextSubassetId(value: number) {
            pb_1.Message.setField(this, 12, value);
        }
        get subassetSupplys() {
            return pb_1.Message.getRepeatedWrapperField(this, dependency_2.trevormil.bitbadgeschain.badges.BalanceObject, 13) as dependency_2.trevormil.bitbadgeschain.badges.BalanceObject[];
        }
        set subassetSupplys(value: dependency_2.trevormil.bitbadgeschain.badges.BalanceObject[]) {
            pb_1.Message.setRepeatedWrapperField(this, 13, value);
        }
        get defaultSubassetSupply() {
            return pb_1.Message.getFieldWithDefault(this, 14, 0) as number;
        }
        set defaultSubassetSupply(value: number) {
            pb_1.Message.setField(this, 14, value);
        }
        get standard() {
            return pb_1.Message.getFieldWithDefault(this, 15, 0) as number;
        }
        set standard(value: number) {
            pb_1.Message.setField(this, 15, value);
        }
        static fromObject(data: {
            id?: number;
            uri?: ReturnType<typeof dependency_3.trevormil.bitbadgeschain.badges.UriObject.prototype.toObject>;
            arbitraryBytes?: Uint8Array;
            manager?: number;
            permissions?: number;
            freezeRanges?: ReturnType<typeof dependency_2.trevormil.bitbadgeschain.badges.IdRange.prototype.toObject>[];
            nextSubassetId?: number;
            subassetSupplys?: ReturnType<typeof dependency_2.trevormil.bitbadgeschain.badges.BalanceObject.prototype.toObject>[];
            defaultSubassetSupply?: number;
            standard?: number;
        }): BitBadge {
            const message = new BitBadge({});
            if (data.id != null) {
                message.id = data.id;
            }
            if (data.uri != null) {
                message.uri = dependency_3.trevormil.bitbadgeschain.badges.UriObject.fromObject(data.uri);
            }
            if (data.arbitraryBytes != null) {
                message.arbitraryBytes = data.arbitraryBytes;
            }
            if (data.manager != null) {
                message.manager = data.manager;
            }
            if (data.permissions != null) {
                message.permissions = data.permissions;
            }
            if (data.freezeRanges != null) {
                message.freezeRanges = data.freezeRanges.map(item => dependency_2.trevormil.bitbadgeschain.badges.IdRange.fromObject(item));
            }
            if (data.nextSubassetId != null) {
                message.nextSubassetId = data.nextSubassetId;
            }
            if (data.subassetSupplys != null) {
                message.subassetSupplys = data.subassetSupplys.map(item => dependency_2.trevormil.bitbadgeschain.badges.BalanceObject.fromObject(item));
            }
            if (data.defaultSubassetSupply != null) {
                message.defaultSubassetSupply = data.defaultSubassetSupply;
            }
            if (data.standard != null) {
                message.standard = data.standard;
            }
            return message;
        }
        toObject() {
            const data: {
                id?: number;
                uri?: ReturnType<typeof dependency_3.trevormil.bitbadgeschain.badges.UriObject.prototype.toObject>;
                arbitraryBytes?: Uint8Array;
                manager?: number;
                permissions?: number;
                freezeRanges?: ReturnType<typeof dependency_2.trevormil.bitbadgeschain.badges.IdRange.prototype.toObject>[];
                nextSubassetId?: number;
                subassetSupplys?: ReturnType<typeof dependency_2.trevormil.bitbadgeschain.badges.BalanceObject.prototype.toObject>[];
                defaultSubassetSupply?: number;
                standard?: number;
            } = {};
            if (this.id != null) {
                data.id = this.id;
            }
            if (this.uri != null) {
                data.uri = this.uri.toObject();
            }
            if (this.arbitraryBytes != null) {
                data.arbitraryBytes = this.arbitraryBytes;
            }
            if (this.manager != null) {
                data.manager = this.manager;
            }
            if (this.permissions != null) {
                data.permissions = this.permissions;
            }
            if (this.freezeRanges != null) {
                data.freezeRanges = this.freezeRanges.map((item: dependency_2.trevormil.bitbadgeschain.badges.IdRange) => item.toObject());
            }
            if (this.nextSubassetId != null) {
                data.nextSubassetId = this.nextSubassetId;
            }
            if (this.subassetSupplys != null) {
                data.subassetSupplys = this.subassetSupplys.map((item: dependency_2.trevormil.bitbadgeschain.badges.BalanceObject) => item.toObject());
            }
            if (this.defaultSubassetSupply != null) {
                data.defaultSubassetSupply = this.defaultSubassetSupply;
            }
            if (this.standard != null) {
                data.standard = this.standard;
            }
            return data;
        }
        serialize(): Uint8Array;
        serialize(w: pb_1.BinaryWriter): void;
        serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
            const writer = w || new pb_1.BinaryWriter();
            if (this.id != 0)
                writer.writeUint64(1, this.id);
            if (this.has_uri)
                writer.writeMessage(2, this.uri, () => this.uri.serialize(writer));
            if (this.arbitraryBytes.length)
                writer.writeBytes(3, this.arbitraryBytes);
            if (this.manager != 0)
                writer.writeUint64(4, this.manager);
            if (this.permissions != 0)
                writer.writeUint64(5, this.permissions);
            if (this.freezeRanges.length)
                writer.writeRepeatedMessage(10, this.freezeRanges, (item: dependency_2.trevormil.bitbadgeschain.badges.IdRange) => item.serialize(writer));
            if (this.nextSubassetId != 0)
                writer.writeUint64(12, this.nextSubassetId);
            if (this.subassetSupplys.length)
                writer.writeRepeatedMessage(13, this.subassetSupplys, (item: dependency_2.trevormil.bitbadgeschain.badges.BalanceObject) => item.serialize(writer));
            if (this.defaultSubassetSupply != 0)
                writer.writeUint64(14, this.defaultSubassetSupply);
            if (this.standard != 0)
                writer.writeUint64(15, this.standard);
            if (!w)
                return writer.getResultBuffer();
        }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): BitBadge {
            const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes), message = new BitBadge();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.id = reader.readUint64();
                        break;
                    case 2:
                        reader.readMessage(message.uri, () => message.uri = dependency_3.trevormil.bitbadgeschain.badges.UriObject.deserialize(reader));
                        break;
                    case 3:
                        message.arbitraryBytes = reader.readBytes();
                        break;
                    case 4:
                        message.manager = reader.readUint64();
                        break;
                    case 5:
                        message.permissions = reader.readUint64();
                        break;
                    case 10:
                        reader.readMessage(message.freezeRanges, () => pb_1.Message.addToRepeatedWrapperField(message, 10, dependency_2.trevormil.bitbadgeschain.badges.IdRange.deserialize(reader), dependency_2.trevormil.bitbadgeschain.badges.IdRange));
                        break;
                    case 12:
                        message.nextSubassetId = reader.readUint64();
                        break;
                    case 13:
                        reader.readMessage(message.subassetSupplys, () => pb_1.Message.addToRepeatedWrapperField(message, 13, dependency_2.trevormil.bitbadgeschain.badges.BalanceObject.deserialize(reader), dependency_2.trevormil.bitbadgeschain.badges.BalanceObject));
                        break;
                    case 14:
                        message.defaultSubassetSupply = reader.readUint64();
                        break;
                    case 15:
                        message.standard = reader.readUint64();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
        serializeBinary(): Uint8Array {
            return this.serialize();
        }
        static deserializeBinary(bytes: Uint8Array): BitBadge {
            return BitBadge.deserialize(bytes);
        }
    }
}