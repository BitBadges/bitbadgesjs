import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { UintRange } from '@/core/uintRanges.js';
import type {
  AndGroup,
  AssetDetails,
  ChallengeParams,
  OrGroup,
  OwnershipRequirements as BlockinOwnershipRequirements
} from 'blockin/dist/types/verify.types';
import { NativeAddress } from '../docs/interfaces.js';

/**
 * @category SIWBB
 */
export class SiwbbChallengeParams<T extends NumberType> extends BaseNumberTypeClass<SiwbbChallengeParams<T>> implements ChallengeParams<T> {
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
  assetOwnershipRequirements?: SiwbbAssetConditionGroup<T>;

  constructor(data: ChallengeParams<T>) {
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
      if ((data.assetOwnershipRequirements as AndGroup<T>)['$and']) {
        this.assetOwnershipRequirements = new SiwbbAndGroup(data.assetOwnershipRequirements as AndGroup<T>);
      } else if ((data.assetOwnershipRequirements as OrGroup<T>)['$or']) {
        this.assetOwnershipRequirements = new SiwbbOrGroup(data.assetOwnershipRequirements as OrGroup<T>);
      } else {
        this.assetOwnershipRequirements = new OwnershipRequirements(data.assetOwnershipRequirements as OwnershipRequirements<T>);
      }
    }
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): SiwbbChallengeParams<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as SiwbbChallengeParams<U>;
  }
}

/**
 * @category SIWBB
 */
export class SiwbbAssetDetails<T extends NumberType> extends BaseNumberTypeClass<SiwbbAssetDetails<T>> implements AssetDetails<T> {
  chain: string;
  collectionId: T | string;
  assetIds: (string | UintRange<T>)[];
  ownershipTimes: UintRange<T>[];
  mustOwnAmounts: UintRange<T>;
  additionalCriteria?: string;

  constructor(data: AssetDetails<T>) {
    super();
    this.chain = data.chain;
    this.collectionId = data.collectionId;
    this.assetIds = data.assetIds.map((item) => {
      if ((item as UintRange<T>).start || (item as UintRange<T>).end) {
        return new UintRange(item as UintRange<T>);
      } else {
        return item;
      }
    }) as (string | UintRange<T>)[];
    this.ownershipTimes = data.ownershipTimes.map((item) => new UintRange(item));
    this.mustOwnAmounts = new UintRange(data.mustOwnAmounts);
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
      return ['collectionId'];
    } catch (e) {
      return [];
    }
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): SiwbbAssetDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as SiwbbAssetDetails<U>;
  }
}

/**
 * @category SIWBB
 */
export class SiwbbAndGroup<T extends NumberType> extends BaseNumberTypeClass<SiwbbAndGroup<T>> implements AndGroup<T> {
  $and: SiwbbAssetConditionGroup<T>[];

  constructor(data: AndGroup<T>) {
    super();
    this.$and = data.$and.map((item) => {
      if ((item as AndGroup<T>)['$and']) {
        return new SiwbbAndGroup(item as AndGroup<T>);
      } else if ((item as OrGroup<T>)['$or']) {
        return new SiwbbOrGroup(item as OrGroup<T>);
      } else {
        return new OwnershipRequirements(item as OwnershipRequirements<T>);
      }
    });
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): SiwbbAndGroup<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as SiwbbAndGroup<U>;
  }
}

/**
 * @category SIWBB
 */
export class SiwbbOrGroup<T extends NumberType> extends BaseNumberTypeClass<SiwbbOrGroup<T>> implements OrGroup<T> {
  $or: SiwbbAssetConditionGroup<T>[];

  constructor(data: OrGroup<T>) {
    super();
    this.$or = data.$or.map((item) => {
      if ((item as AndGroup<T>)['$and']) {
        return new SiwbbAndGroup(item as AndGroup<T>);
      } else if ((item as OrGroup<T>)['$or']) {
        return new SiwbbOrGroup(item as OrGroup<T>);
      } else {
        return new OwnershipRequirements(item as OwnershipRequirements<T>);
      }
    });
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): SiwbbOrGroup<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as SiwbbOrGroup<U>;
  }
}

/**
 * @category SIWBB
 */
export class OwnershipRequirements<T extends NumberType> extends BaseNumberTypeClass<OwnershipRequirements<T>> implements OwnershipRequirements<T> {
  assets: SiwbbAssetDetails<T>[];
  options?: {
    numMatchesForVerification?: T;
  };

  constructor(data: BlockinOwnershipRequirements<T>) {
    super();
    this.assets = data.assets.map((item) => new SiwbbAssetDetails(item));
    this.options = data.options;
  }

  getNumberFieldNames(): string[] {
    return ['options']; //TODO: This assumes all options are NumberType
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): OwnershipRequirements<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as OwnershipRequirements<U>;
  }
}

/**
 * @category SIWBB
 */
export type SiwbbAssetConditionGroup<T extends NumberType> = SiwbbAndGroup<T> | SiwbbOrGroup<T> | OwnershipRequirements<T>;
