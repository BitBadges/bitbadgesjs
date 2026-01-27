// Local type definitions extracted from blockin library
// This avoids pulling in crypto/UI dependencies from the full blockin package

export type NumberType = string | bigint | number;

export interface UintRange<T extends NumberType> {
  start: T;
  end: T;
}

export interface AndGroup<T extends NumberType> {
  $and: AssetConditionGroup<T>[];
}

export interface OrGroup<T extends NumberType> {
  $or: AssetConditionGroup<T>[];
}

export interface AssetDetails<T extends NumberType> {
  chain: string;
  collectionId: T | string;
  assetIds: (string | UintRange<T>)[];
  ownershipTimes: UintRange<T>[];
  mustOwnAmounts: UintRange<T>;
  additionalCriteria?: string;
  ownershipPartyCheck?: string;
}

export interface OwnershipRequirements<T extends NumberType> {
  assets: AssetDetails<T>[];
  options?: {
    numMatchesForVerification?: T; // 0 or undefined = must satisfy all
  };
}

export type AssetConditionGroup<T extends NumberType> = AndGroup<T> | OrGroup<T> | OwnershipRequirements<T>;

/**
 * Interface for EIP-4361 Challenge - Sign in With Ethereum
 *
 * For more information and documentation, view the EIP proposal.
 *
 * We extend it to support assets.
 */
export interface ChallengeParams<T extends NumberType> {
  domain: string;
  statement: string;
  address: string;
  uri: string;
  nonce: string;
  version?: string;
  chainId?: string;
  issuedAt?: string;
  expirationDate?: string;
  notBefore?: string;
  resources?: string[];
  assetOwnershipRequirements?: AssetConditionGroup<T>;
}

/**
 * Options that can be specified when calling verifyChallenge()
 */
export type VerifyChallengeOptions = {
  /**
   * Optionally define the expected details to check. If the challenge was edited and the details
   * do not match, the challenge will fail verification.
   */
  expectedChallengeParams?: Partial<ChallengeParams<NumberType>>;

  /**
   * Optional function to call before verification. This is useful to verify the challenge is
   * valid before proceeding with verification.
   *
   * Note you can use expectedChallengeParams to verify values equal as expected.
   *
   * This function is useful if you need to implement custom logic other than strict equality).
   * For example, assert that only one of assets A, B, or C are defined and not all three.
   */
  beforeVerification?: (params: ChallengeParams<NumberType>) => Promise<void>;

  /**
   * For verification of assets, instead of dynamically fetching the assets, you can specify a snapshot of the assets.
   *
   * This is useful if you have a snapshot, balances will not change, or you are verifying in an offline manner.
   */
  balancesSnapshot?: object;

  /**
   * If true, we do not check timestamps (expirationDate / notBefore). This is useful if you are verifying a challenge that is expected to be verified at a future time.
   */
  skipTimestampVerification?: boolean;

  /**
   * If true, we do not check asset ownership. This is useful if you are verifying a challenge that is expected to be verified at a future time.
   */
  skipAssetVerification?: boolean;

  /**
   * The earliest issued At ISO date string that is valid. For example, if you want to verify a challenge that was issued within the last minute, you can specify this to be 1 minute ago.
   */
  earliestIssuedAt?: string;

  /**
   * If set, we will verify the issuedAt is within this amount of ms ago (i.e. issuedAt >= Date.now() - issuedAtTimeWindowMs)
   */
  issuedAtTimeWindowMs?: number;

  /**
   * If true, we do not check the signature. You can pass in an undefined ChainDriver
   */
  skipSignatureVerification?: boolean;
};

