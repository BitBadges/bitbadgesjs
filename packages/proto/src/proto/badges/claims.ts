// @ts-nocheck
/* eslint-disable */
/**
 * Generated by the protoc-gen-ts.  DO NOT EDIT!
 * compiler version: 3.6.1
 * source: badges/claims.proto
 * git: https://github.com/thesayyn/protoc-gen-ts */
import * as dependency_1 from "./balances";
import * as dependency_2 from "./ranges";
import * as pb_1 from "google-protobuf";
export namespace bitbadges.bitbadgeschain.badges {
    export enum ClaimType {
        MerkleTree = 0,
        FirstCome = 1
    }
    export class Claim extends pb_1.Message {
        #one_of_decls: number[][] = [];
        constructor(data?: any[] | {
            balances?: dependency_1.bitbadges.bitbadgeschain.badges.Balance[];
            codeRoot?: string;
            whitelistRoot?: string;
            incrementIdsBy?: number;
            amount?: number;
            badgeIds?: dependency_2.bitbadges.bitbadgeschain.badges.IdRange[];
            restrictOptions?: number;
            uri?: string;
            timeRange?: dependency_2.bitbadges.bitbadgeschain.badges.IdRange;
            expectedMerkleProofLength?: number;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [1, 6], this.#one_of_decls);
            if (!Array.isArray(data) && typeof data == "object") {
                if ("balances" in data && data.balances != undefined) {
                    this.balances = data.balances;
                }
                if ("codeRoot" in data && data.codeRoot != undefined) {
                    this.codeRoot = data.codeRoot;
                }
                if ("whitelistRoot" in data && data.whitelistRoot != undefined) {
                    this.whitelistRoot = data.whitelistRoot;
                }
                if ("incrementIdsBy" in data && data.incrementIdsBy != undefined) {
                    this.incrementIdsBy = data.incrementIdsBy;
                }
                if ("amount" in data && data.amount != undefined) {
                    this.amount = data.amount;
                }
                if ("badgeIds" in data && data.badgeIds != undefined) {
                    this.badgeIds = data.badgeIds;
                }
                if ("restrictOptions" in data && data.restrictOptions != undefined) {
                    this.restrictOptions = data.restrictOptions;
                }
                if ("uri" in data && data.uri != undefined) {
                    this.uri = data.uri;
                }
                if ("timeRange" in data && data.timeRange != undefined) {
                    this.timeRange = data.timeRange;
                }
                if ("expectedMerkleProofLength" in data && data.expectedMerkleProofLength != undefined) {
                    this.expectedMerkleProofLength = data.expectedMerkleProofLength;
                }
            }
        }
        get balances() {
            return pb_1.Message.getRepeatedWrapperField(this, dependency_1.bitbadges.bitbadgeschain.badges.Balance, 1) as dependency_1.bitbadges.bitbadgeschain.badges.Balance[];
        }
        set balances(value: dependency_1.bitbadges.bitbadgeschain.badges.Balance[]) {
            pb_1.Message.setRepeatedWrapperField(this, 1, value);
        }
        get codeRoot() {
            return pb_1.Message.getFieldWithDefault(this, 2, "") as string;
        }
        set codeRoot(value: string) {
            pb_1.Message.setField(this, 2, value);
        }
        get whitelistRoot() {
            return pb_1.Message.getFieldWithDefault(this, 3, "") as string;
        }
        set whitelistRoot(value: string) {
            pb_1.Message.setField(this, 3, value);
        }
        get incrementIdsBy() {
            return pb_1.Message.getFieldWithDefault(this, 4, 0) as number;
        }
        set incrementIdsBy(value: number) {
            pb_1.Message.setField(this, 4, value);
        }
        get amount() {
            return pb_1.Message.getFieldWithDefault(this, 5, 0) as number;
        }
        set amount(value: number) {
            pb_1.Message.setField(this, 5, value);
        }
        get badgeIds() {
            return pb_1.Message.getRepeatedWrapperField(this, dependency_2.bitbadges.bitbadgeschain.badges.IdRange, 6) as dependency_2.bitbadges.bitbadgeschain.badges.IdRange[];
        }
        set badgeIds(value: dependency_2.bitbadges.bitbadgeschain.badges.IdRange[]) {
            pb_1.Message.setRepeatedWrapperField(this, 6, value);
        }
        get restrictOptions() {
            return pb_1.Message.getFieldWithDefault(this, 7, 0) as number;
        }
        set restrictOptions(value: number) {
            pb_1.Message.setField(this, 7, value);
        }
        get uri() {
            return pb_1.Message.getFieldWithDefault(this, 8, "") as string;
        }
        set uri(value: string) {
            pb_1.Message.setField(this, 8, value);
        }
        get timeRange() {
            return pb_1.Message.getWrapperField(this, dependency_2.bitbadges.bitbadgeschain.badges.IdRange, 9) as dependency_2.bitbadges.bitbadgeschain.badges.IdRange;
        }
        set timeRange(value: dependency_2.bitbadges.bitbadgeschain.badges.IdRange) {
            pb_1.Message.setWrapperField(this, 9, value);
        }
        get has_timeRange() {
            return pb_1.Message.getField(this, 9) != null;
        }
        get expectedMerkleProofLength() {
            return pb_1.Message.getFieldWithDefault(this, 10, 0) as number;
        }
        set expectedMerkleProofLength(value: number) {
            pb_1.Message.setField(this, 10, value);
        }
        static fromObject(data: {
            balances?: ReturnType<typeof dependency_1.bitbadges.bitbadgeschain.badges.Balance.prototype.toObject>[];
            codeRoot?: string;
            whitelistRoot?: string;
            incrementIdsBy?: number;
            amount?: number;
            badgeIds?: ReturnType<typeof dependency_2.bitbadges.bitbadgeschain.badges.IdRange.prototype.toObject>[];
            restrictOptions?: number;
            uri?: string;
            timeRange?: ReturnType<typeof dependency_2.bitbadges.bitbadgeschain.badges.IdRange.prototype.toObject>;
            expectedMerkleProofLength?: number;
        }): Claim {
            const message = new Claim({});
            if (data.balances != null) {
                message.balances = data.balances.map(item => dependency_1.bitbadges.bitbadgeschain.badges.Balance.fromObject(item));
            }
            if (data.codeRoot != null) {
                message.codeRoot = data.codeRoot;
            }
            if (data.whitelistRoot != null) {
                message.whitelistRoot = data.whitelistRoot;
            }
            if (data.incrementIdsBy != null) {
                message.incrementIdsBy = data.incrementIdsBy;
            }
            if (data.amount != null) {
                message.amount = data.amount;
            }
            if (data.badgeIds != null) {
                message.badgeIds = data.badgeIds.map(item => dependency_2.bitbadges.bitbadgeschain.badges.IdRange.fromObject(item));
            }
            if (data.restrictOptions != null) {
                message.restrictOptions = data.restrictOptions;
            }
            if (data.uri != null) {
                message.uri = data.uri;
            }
            if (data.timeRange != null) {
                message.timeRange = dependency_2.bitbadges.bitbadgeschain.badges.IdRange.fromObject(data.timeRange);
            }
            if (data.expectedMerkleProofLength != null) {
                message.expectedMerkleProofLength = data.expectedMerkleProofLength;
            }
            return message;
        }
        toObject() {
            const data: {
                balances?: ReturnType<typeof dependency_1.bitbadges.bitbadgeschain.badges.Balance.prototype.toObject>[];
                codeRoot?: string;
                whitelistRoot?: string;
                incrementIdsBy?: number;
                amount?: number;
                badgeIds?: ReturnType<typeof dependency_2.bitbadges.bitbadgeschain.badges.IdRange.prototype.toObject>[];
                restrictOptions?: number;
                uri?: string;
                timeRange?: ReturnType<typeof dependency_2.bitbadges.bitbadgeschain.badges.IdRange.prototype.toObject>;
                expectedMerkleProofLength?: number;
            } = {};
            if (this.balances != null) {
                data.balances = this.balances.map((item: dependency_1.bitbadges.bitbadgeschain.badges.Balance) => item.toObject());
            }
            if (this.codeRoot != null) {
                data.codeRoot = this.codeRoot;
            }
            if (this.whitelistRoot != null) {
                data.whitelistRoot = this.whitelistRoot;
            }
            if (this.incrementIdsBy != null) {
                data.incrementIdsBy = this.incrementIdsBy;
            }
            if (this.amount != null) {
                data.amount = this.amount;
            }
            if (this.badgeIds != null) {
                data.badgeIds = this.badgeIds.map((item: dependency_2.bitbadges.bitbadgeschain.badges.IdRange) => item.toObject());
            }
            if (this.restrictOptions != null) {
                data.restrictOptions = this.restrictOptions;
            }
            if (this.uri != null) {
                data.uri = this.uri;
            }
            if (this.timeRange != null) {
                data.timeRange = this.timeRange.toObject();
            }
            if (this.expectedMerkleProofLength != null) {
                data.expectedMerkleProofLength = this.expectedMerkleProofLength;
            }
            return data;
        }
        serialize(): Uint8Array;
        serialize(w: pb_1.BinaryWriter): void;
        serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
            const writer = w || new pb_1.BinaryWriter();
            if (this.balances.length)
                writer.writeRepeatedMessage(1, this.balances, (item: dependency_1.bitbadges.bitbadgeschain.badges.Balance) => item.serialize(writer));
            if (this.codeRoot.length)
                writer.writeString(2, this.codeRoot);
            if (this.whitelistRoot.length)
                writer.writeString(3, this.whitelistRoot);
            if (this.incrementIdsBy != 0)
                writer.writeUint64(4, this.incrementIdsBy);
            if (this.amount != 0)
                writer.writeUint64(5, this.amount);
            if (this.badgeIds.length)
                writer.writeRepeatedMessage(6, this.badgeIds, (item: dependency_2.bitbadges.bitbadgeschain.badges.IdRange) => item.serialize(writer));
            if (this.restrictOptions != 0)
                writer.writeUint64(7, this.restrictOptions);
            if (this.uri.length)
                writer.writeString(8, this.uri);
            if (this.has_timeRange)
                writer.writeMessage(9, this.timeRange, () => this.timeRange.serialize(writer));
            if (this.expectedMerkleProofLength != 0)
                writer.writeUint64(10, this.expectedMerkleProofLength);
            if (!w)
                return writer.getResultBuffer();
        }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): Claim {
            const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes), message = new Claim();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        reader.readMessage(message.balances, () => pb_1.Message.addToRepeatedWrapperField(message, 1, dependency_1.bitbadges.bitbadgeschain.badges.Balance.deserialize(reader), dependency_1.bitbadges.bitbadgeschain.badges.Balance));
                        break;
                    case 2:
                        message.codeRoot = reader.readString();
                        break;
                    case 3:
                        message.whitelistRoot = reader.readString();
                        break;
                    case 4:
                        message.incrementIdsBy = reader.readUint64();
                        break;
                    case 5:
                        message.amount = reader.readUint64();
                        break;
                    case 6:
                        reader.readMessage(message.badgeIds, () => pb_1.Message.addToRepeatedWrapperField(message, 6, dependency_2.bitbadges.bitbadgeschain.badges.IdRange.deserialize(reader), dependency_2.bitbadges.bitbadgeschain.badges.IdRange));
                        break;
                    case 7:
                        message.restrictOptions = reader.readUint64();
                        break;
                    case 8:
                        message.uri = reader.readString();
                        break;
                    case 9:
                        reader.readMessage(message.timeRange, () => message.timeRange = dependency_2.bitbadges.bitbadgeschain.badges.IdRange.deserialize(reader));
                        break;
                    case 10:
                        message.expectedMerkleProofLength = reader.readUint64();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
        serializeBinary(): Uint8Array {
            return this.serialize();
        }
        static deserializeBinary(bytes: Uint8Array): Claim {
            return Claim.deserialize(bytes);
        }
    }
}