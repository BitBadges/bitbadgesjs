import { UpdateHistory } from '@/api-indexer/docs/docs.js';
import { CosmosAddress, UNIXMilliTimestamp } from '@/api-indexer/docs/interfaces.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, CustomTypeClass } from '@/common/base.js';
import { NumberType } from '@/common/string-numbers.js';
import { iAttestation, iAttestationsProof } from '@/interfaces/badges/core.js';

/**
 * @category Off-Chain Attestations
 */
export class AttestationsProof<T extends NumberType> extends BaseNumberTypeClass<AttestationsProof<T>> implements iAttestationsProof<T> {
  createdBy: CosmosAddress;
  createdAt: UNIXMilliTimestamp<T>;
  scheme: 'bbs' | 'standard';
  messageFormat: 'plaintext' | 'json';

  attestationMessages: string[];

  dataIntegrityProof: {
    signature: string;
    signer: string;
    publicKey?: string;
  };

  proofOfIssuance: {
    message: string;
    signer: string;
    signature: string;
    publicKey?: string;
  };

  name: string;
  image: string;
  description: string;

  entropies?: string[];
  updateHistory?: UpdateHistory<T>[];
  anchors?: {
    txHash?: string;
    message?: string;
  }[];

  constructor(data: iAttestationsProof<T>) {
    super();
    this.messageFormat = data.messageFormat;
    this.updateHistory = data.updateHistory?.map((update) => new UpdateHistory(update));
    this.createdBy = data.createdBy;
    this.scheme = data.scheme;
    this.attestationMessages = data.attestationMessages;
    this.entropies = data.entropies;
    this.dataIntegrityProof = data.dataIntegrityProof;
    this.proofOfIssuance = data.proofOfIssuance;
    this.name = data.name;
    this.image = data.image;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.anchors = data.anchors;
  }

  getNumberFieldNames(): string[] {
    return ['createdAt'];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): AttestationsProof<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as AttestationsProof<U>;
  }
}

/**
 * @category Off-Chain Attestations
 */
export class Attestation<T extends NumberType> extends CustomTypeClass<Attestation<T>> implements iAttestation<T> {
  createdBy: CosmosAddress;
  createdAt: UNIXMilliTimestamp<T>;

  proofOfIssuance: {
    message: string;
    signature: string;
    signer: string;
    publicKey?: string;
  };

  attestationId: string;
  inviteCode: string;

  type: string;
  scheme: 'bbs' | 'standard';
  messageFormat: 'plaintext' | 'json';
  attestationMessages: string[];

  dataIntegrityProof: {
    signature: string;
    signer: string;
    publicKey?: string;
  };

  name: string;
  image: string;
  description: string;

  holders: string[];
  anchors: {
    txHash?: string;
    message?: string;
  }[];

  constructor(data: iAttestation<T>) {
    super();
    this.createdBy = data.createdBy;
    this.messageFormat = data.messageFormat;
    this.proofOfIssuance = data.proofOfIssuance;
    this.inviteCode = data.inviteCode;
    this.attestationId = data.attestationId;
    this.type = data.type;
    this.scheme = data.scheme;
    this.attestationMessages = data.attestationMessages;
    this.dataIntegrityProof = data.dataIntegrityProof;
    this.name = data.name;
    this.image = data.image;
    this.description = data.description;
    this.holders = data.holders;
    this.anchors = data.anchors;
    this.createdAt = data.createdAt;
  }

  getNumberFieldNames(): string[] {
    return ['createdAt'];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): Attestation<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as Attestation<U>;
  }
}
