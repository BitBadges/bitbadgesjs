import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { UintRange } from '@/core/uintRanges.js';
import type { AndGroup, AssetConditionGroup, ChallengeParams, OrGroup, OwnershipRequirements as BlockinOwnershipRequirements } from '@/blockin/index.js';
import { NativeAddress } from '../docs-types/interfaces.js';
import { iUintRange } from '@/interfaces/types/core.js';

/**
 * @category SIWBB
 */
export class SiwbbChallengeParams extends BaseNumberTypeClass<SiwbbChallengeParams> implements ChallengeParams {
  domain: string;
  statement: string;
  address: NativeAddress;
  uri: string;
  nonce: string;
  version?: string;
  chainId?: string;
  issuedAt?: string;
  expirationDate?: string;
  notBefore?: string;
  resources?: string[];
  assetOwnershipRequirements?: SiwbbAssetConditionGroup;

  constructor(data: ChallengeParams) {
    super();
    this.domain = data.domain;
    this.statement = data.statement;
    this.address = data.address;
    this.uri = data.uri;
    this.nonce = data.nonce;
    this.version = data.version;
    this.chainId = data.chainId;
    this.issuedAt = data.issuedAt;
    this.expirationDate = data.expirationDate;
    this.notBefore = data.notBefore;
    this.resources = data.resources;
    if (data.assetOwnershipRequirements) {
      if ((data.assetOwnershipRequirements as AndGroup)['$and']) {
        this.assetOwnershipRequirements = new SiwbbAndGroup(data.assetOwnershipRequirements as AndGroup);
      } else if ((data.assetOwnershipRequirements as OrGroup)['$or']) {
        this.assetOwnershipRequirements = new SiwbbOrGroup(data.assetOwnershipRequirements as OrGroup);
      } else {
        this.assetOwnershipRequirements = new OwnershipRequirements(data.assetOwnershipRequirements as OwnershipRequirements);
      }
    }
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): SiwbbChallengeParams {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SiwbbChallengeParams;
  }
}

/**
 * @category Interfaces
 */
export interface iAssetDetails {
  chain: string;
  collectionId: T | string;
  assetIds: (string | iUintRange)[];
  ownershipTimes: iUintRange[];
  mustOwnAmounts: iUintRange;
  additionalCriteria?: string;
  ownershipPartyCheck?: string;
}

/**
 * @category SIWBB
 */
export class SiwbbAssetDetails extends BaseNumberTypeClass<SiwbbAssetDetails> implements iAssetDetails {
  chain: string;
  collectionId: T | string;
  assetIds: (string | UintRange)[];
  ownershipTimes: UintRange[];
  mustOwnAmounts: UintRange;
  additionalCriteria?: string;
  ownershipPartyCheck?: string;

  constructor(data: iAssetDetails) {
    super();
    this.chain = data.chain;
    this.collectionId = data.collectionId;
    this.assetIds = data.assetIds.map((item) => {
      if ((item as UintRange).start || (item as UintRange).end) {
        return new UintRange(item as UintRange);
      } else {
        return item;
      }
    }) as (string | UintRange)[];
    this.ownershipTimes = data.ownershipTimes.map((item) => new UintRange(item));
    this.mustOwnAmounts = new UintRange(data.mustOwnAmounts);
    this.ownershipPartyCheck = data.ownershipPartyCheck;
  }

  getNumberFieldNames(): string[] {
    //TODO: Get a better solution. This may result in edge cases where collectionId is a string number and converts to a number
    try {
      if (typeof this.collectionId === 'string') {
        if (this.collectionId.startsWith('0x')) {
          return [];
        }
      }

      BigInt(this.collectionId as any);
      return [];
    } catch (e) {
      return [];
    }
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): SiwbbAssetDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SiwbbAssetDetails;
  }
}

/**
 * @category SIWBB
 */
export class SiwbbAndGroup extends BaseNumberTypeClass<SiwbbAndGroup> implements AndGroup {
  $and: SiwbbAssetConditionGroup[];

  constructor(data: AndGroup) {
    super();
    this.$and = data.$and.map((item: AssetConditionGroup) => {
      if ((item as AndGroup)['$and']) {
        return new SiwbbAndGroup(item as AndGroup);
      } else if ((item as OrGroup)['$or']) {
        return new SiwbbOrGroup(item as OrGroup);
      } else {
        return new OwnershipRequirements(item as OwnershipRequirements);
      }
    });
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): SiwbbAndGroup {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SiwbbAndGroup;
  }
}

/**
 * @category SIWBB
 */
export class SiwbbOrGroup extends BaseNumberTypeClass<SiwbbOrGroup> implements OrGroup {
  $or: SiwbbAssetConditionGroup[];

  constructor(data: OrGroup) {
    super();
    this.$or = data.$or.map((item: AssetConditionGroup) => {
      if ((item as AndGroup)['$and']) {
        return new SiwbbAndGroup(item as AndGroup);
      } else if ((item as OrGroup)['$or']) {
        return new SiwbbOrGroup(item as OrGroup);
      } else {
        return new OwnershipRequirements(item as OwnershipRequirements);
      }
    });
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): SiwbbOrGroup {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SiwbbOrGroup;
  }
}

/**
 * @category SIWBB
 */
export class OwnershipRequirements extends BaseNumberTypeClass<OwnershipRequirements> implements OwnershipRequirements {
  assets: SiwbbAssetDetails[];
  options?: {
    numMatchesForVerification?: string | number;
  };

  constructor(data: BlockinOwnershipRequirements) {
    super();
    this.assets = data.assets.map((item: BlockinOwnershipRequirements['assets'][0]) => new SiwbbAssetDetails(item));
    this.options = data.options;
  }

  getNumberFieldNames(): string[] {
    return ['options']; //TODO: This assumes all options are NumberType
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): OwnershipRequirements {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as OwnershipRequirements;
  }
}

/**
 * @category SIWBB
 */
export type SiwbbAssetConditionGroup = SiwbbAndGroup | SiwbbOrGroup | OwnershipRequirements;
