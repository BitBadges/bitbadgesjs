import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import type { NumberType } from '@/common/string-numbers';
import { UintRange } from '@/core/uintRanges';
import type {
  AndGroup,
  AssetDetails,
  ChallengeParams,
  OrGroup,
  OwnershipRequirements as BlockinOwnershipRequirements
} from 'blockin/dist/types/verify.types';
import { NativeAddress } from '../docs';

/**
 * @category Blockin
 */
export class BlockinChallengeParams<T extends NumberType> extends BaseNumberTypeClass<BlockinChallengeParams<T>> implements ChallengeParams<T> {
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
  assetOwnershipRequirements?: BlockinAssetConditionGroup<T>;

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
        this.assetOwnershipRequirements = new BlockinAndGroup(data.assetOwnershipRequirements as AndGroup<T>);
      } else if ((data.assetOwnershipRequirements as OrGroup<T>)['$or']) {
        this.assetOwnershipRequirements = new BlockinOrGroup(data.assetOwnershipRequirements as OrGroup<T>);
      } else {
        this.assetOwnershipRequirements = new OwnershipRequirements(data.assetOwnershipRequirements as OwnershipRequirements<T>);
      }
    }
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): BlockinChallengeParams<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as BlockinChallengeParams<U>;
  }
}

/**
 * @category Blockin
 */
export class BlockinAssetDetails<T extends NumberType> extends BaseNumberTypeClass<BlockinAssetDetails<T>> implements AssetDetails<T> {
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

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): BlockinAssetDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as BlockinAssetDetails<U>;
  }
}

/**
 * @category Blockin
 */
export class BlockinAndGroup<T extends NumberType> extends BaseNumberTypeClass<BlockinAndGroup<T>> implements AndGroup<T> {
  $and: BlockinAssetConditionGroup<T>[];

  constructor(data: AndGroup<T>) {
    super();
    this.$and = data.$and.map((item) => {
      if ((item as AndGroup<T>)['$and']) {
        return new BlockinAndGroup(item as AndGroup<T>);
      } else if ((item as OrGroup<T>)['$or']) {
        return new BlockinOrGroup(item as OrGroup<T>);
      } else {
        return new OwnershipRequirements(item as OwnershipRequirements<T>);
      }
    });
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): BlockinAndGroup<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as BlockinAndGroup<U>;
  }
}

/**
 * @category Blockin
 */
export class BlockinOrGroup<T extends NumberType> extends BaseNumberTypeClass<BlockinOrGroup<T>> implements OrGroup<T> {
  $or: BlockinAssetConditionGroup<T>[];

  constructor(data: OrGroup<T>) {
    super();
    this.$or = data.$or.map((item) => {
      if ((item as AndGroup<T>)['$and']) {
        return new BlockinAndGroup(item as AndGroup<T>);
      } else if ((item as OrGroup<T>)['$or']) {
        return new BlockinOrGroup(item as OrGroup<T>);
      } else {
        return new OwnershipRequirements(item as OwnershipRequirements<T>);
      }
    });
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): BlockinOrGroup<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as BlockinOrGroup<U>;
  }
}

/**
 * @category Blockin
 */
export class OwnershipRequirements<T extends NumberType> extends BaseNumberTypeClass<OwnershipRequirements<T>> implements OwnershipRequirements<T> {
  assets: BlockinAssetDetails<T>[];
  options?: {
    numMatchesForVerification?: T;
  };

  constructor(data: BlockinOwnershipRequirements<T>) {
    super();
    this.assets = data.assets.map((item) => new BlockinAssetDetails(item));
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
 * @category Blockin
 */
export type BlockinAssetConditionGroup<T extends NumberType> = BlockinAndGroup<T> | BlockinOrGroup<T> | OwnershipRequirements<T>;
