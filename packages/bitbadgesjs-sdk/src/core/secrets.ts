import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, CustomTypeClass } from '@/common/base';
import { iSecret, iSecretsProof } from '@/interfaces/badges/core';
import { CosmosAddress, NumberType, UpdateHistory } from '..';

/**
 * @category Off-Chain Secrets
 */
export class SecretsProof<T extends NumberType> extends BaseNumberTypeClass<SecretsProof<T>> implements iSecretsProof<T> {
  createdBy: CosmosAddress;
  scheme: 'bbs' | 'standard';
  messageFormat: 'plaintext' | 'json';

  secretMessages: string[];

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

  constructor(data: iSecretsProof<T>) {
    super();
    this.messageFormat = data.messageFormat;
    this.updateHistory = data.updateHistory?.map((update) => new UpdateHistory(update));
    this.createdBy = data.createdBy;
    this.scheme = data.scheme;
    this.secretMessages = data.secretMessages;
    this.entropies = data.entropies;
    this.dataIntegrityProof = data.dataIntegrityProof;
    this.proofOfIssuance = data.proofOfIssuance;
    this.name = data.name;
    this.image = data.image;
    this.description = data.description;
    this.anchors = data.anchors;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): SecretsProof<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as SecretsProof<U>;
  }
}

/**
 * @category Off-Chain Secrets
 */
export class Secret extends CustomTypeClass<Secret> implements iSecret {
  createdBy: CosmosAddress;

  proofOfIssuance: {
    message: string;
    signature: string;
    signer: string;
    publicKey?: string;
  };

  secretId: string;

  type: string;
  scheme: 'bbs' | 'standard';
  messageFormat: 'plaintext' | 'json';
  secretMessages: string[];

  dataIntegrityProof: {
    signature: string;
    signer: string;
    publicKey?: string;
  };

  name: string;
  image: string;
  description: string;

  viewers: string[];
  anchors: {
    txHash?: string;
    message?: string;
  }[];

  constructor(data: iSecret) {
    super();
    this.createdBy = data.createdBy;
    this.messageFormat = data.messageFormat;
    this.proofOfIssuance = data.proofOfIssuance;
    this.secretId = data.secretId;
    this.type = data.type;
    this.scheme = data.scheme;
    this.secretMessages = data.secretMessages;
    this.dataIntegrityProof = data.dataIntegrityProof;
    this.name = data.name;
    this.image = data.image;
    this.description = data.description;
    this.viewers = data.viewers;
    this.anchors = data.anchors;
  }
}
