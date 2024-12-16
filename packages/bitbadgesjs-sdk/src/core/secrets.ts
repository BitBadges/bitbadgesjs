import { BitBadgesAddress, iUpdateHistory, UNIXMilliTimestamp } from '@/api-indexer/docs/interfaces.js';
import { convertClassPropertiesAndMaintainNumberTypes, ConvertOptions, CustomTypeClass } from '@/common/base.js';
import { NumberType } from '@/common/string-numbers.js';
import { iAttestation, iAttestationsProof } from '@/interfaces/badges/core.js';
import { UpdateHistory } from './misc.js';

/**
 * @category Off-Chain Attestations
 */
export class Attestation<T extends NumberType> extends CustomTypeClass<Attestation<T>> implements iAttestation<T> {
  createdBy: BitBadgesAddress;
  createdAt: UNIXMilliTimestamp<T>;

  proofOfIssuance?: {
    message: string;
    signature: string;
    signer: string;
    publicKey?: string;
  };

  attestationId: string;
  inviteCode: string;

  scheme: 'bbs' | 'standard' | 'custom' | string;
  originalProvider?: string;
  messageFormat: 'plaintext' | 'json';
  messages: string[];

  dataIntegrityProof?: {
    signature: string;
    signer: string;
    publicKey?: string;
    isDerived?: boolean;
  };

  name: string;
  image: string;
  description: string;

  holders: string[];
  allHolders?: string[];
  anchors: {
    txHash?: string;
    message?: string;
  }[];

  entropies: string[];
  publicVisibility?: boolean;

  constructor(data: iAttestation<T>) {
    super();
    this.createdBy = data.createdBy;
    this.messageFormat = data.messageFormat;
    this.proofOfIssuance = data.proofOfIssuance;
    this.inviteCode = data.inviteCode;
    this.attestationId = data.attestationId;
    this.scheme = data.scheme;
    this.messages = data.messages;
    this.dataIntegrityProof = data.dataIntegrityProof;
    this.name = data.name;
    this.image = data.image;
    this.description = data.description;
    this.holders = data.holders;
    this.originalProvider = data.originalProvider;
    this.anchors = data.anchors;
    this.allHolders = data.allHolders;
    this.createdAt = data.createdAt;
    this.entropies = data.entropies;
    this.publicVisibility = data.publicVisibility;
  }

  getNumberFieldNames(): string[] {
    return ['createdAt'];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): Attestation<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Attestation<U>;
  }
}

/**
 * @category Off-Chain Attestations
 */
export class AttestationsProof<T extends NumberType> extends Attestation<T> implements iAttestationsProof<T> {
  updateHistory: UpdateHistory<T>[];
  _docId: string;
  _id?: string | undefined;

  constructor(data: iAttestationsProof<T>) {
    super(data);
    this._docId = data._docId;
    this._id = data._id;
    this.updateHistory = data.updateHistory.map((x) => new UpdateHistory(x));
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): AttestationsProof<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AttestationsProof<U>;
  }
}
