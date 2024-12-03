import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';
import { SiwbbAndGroup, SiwbbAssetConditionGroup, SiwbbOrGroup, OwnershipRequirements } from '@/api-indexer/requests/blockin.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import { NumberType } from '@/common/string-numbers.js';
import { SupportedChain } from '@/common/types.js';
import { iAttestationsProof } from '@/interfaces/badges/core.js';
import { AndGroup, AssetConditionGroup, OrGroup } from 'blockin';
import { AttestationsProof } from './secrets.js';

/**
 * @category Interfaces
 */
export interface iSiwbbChallenge<T extends NumberType> {
  /** The user's address */
  address: string;
  /** The chain of the address */
  chain: SupportedChain;
  /** The ownership requirements for the user */
  ownershipRequirements?: AssetConditionGroup<T>;
  /**
   * The converted BitBadges address of params.address. This can be used as the
   * unique identifier for the user (e.g. avoid duplicate sign ins from equivalent 0x and bb1 addresses).
   */
  bitbadgesAddress: BitBadgesAddress;

  /**
   * Verification response
   */
  verificationResponse?: {
    /**
     * Returns whether the current (message, signature) pair is valid and verified (i.e. signature is valid and any assets are owned).
     */
    success: boolean;
    /**
     * Returns the response message returned from verification.
     */
    errorMessage?: string;
  };

  /**
   * Derived data integrity proofs for any attestations requested.
   */
  attestationsPresentations?: iAttestationsProof<T>[];

  /** Other sign-ins that were requested */
  otherSignIns?: {
    discord?: { username: string; discriminator?: string | undefined; id: string } | undefined;
    github?: { username: string; id: string } | undefined;
    google?: { username: string; id: string } | undefined;
    twitter?: { username: string; id: string } | undefined;
  };
}

/**
 * @category SIWBB Authentication
 */
export class SiwbbChallenge<T extends NumberType> extends BaseNumberTypeClass<SiwbbChallenge<T>> implements iSiwbbChallenge<T> {
  address: string;
  chain: SupportedChain;
  ownershipRequirements?: SiwbbAssetConditionGroup<T>;
  bitbadgesAddress: BitBadgesAddress;
  verificationResponse?: {
    success: boolean;
    errorMessage?: string;
  };
  attestationsPresentations?: AttestationsProof<T>[];
  otherSignIns?: {
    discord?: { username: string; discriminator?: string | undefined; id: string } | undefined;
    github?: { username: string; id: string } | undefined;
    google?: { username: string; id: string } | undefined;
    twitter?: { username: string; id: string } | undefined;
  };

  constructor(data: iSiwbbChallenge<T>) {
    super();
    this.address = data.address;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.chain = data.chain;
    this.verificationResponse = data.verificationResponse;
    this.otherSignIns = data.otherSignIns;
    this.attestationsPresentations = data.attestationsPresentations?.map((proof) => new AttestationsProof(proof));
    if (data.ownershipRequirements) {
      if ((data.ownershipRequirements as AndGroup<T>)['$and']) {
        this.ownershipRequirements = new SiwbbAndGroup(data.ownershipRequirements as AndGroup<T>);
      } else if ((data.ownershipRequirements as OrGroup<T>)['$or']) {
        this.ownershipRequirements = new SiwbbOrGroup(data.ownershipRequirements as OrGroup<T>);
      } else {
        this.ownershipRequirements = new OwnershipRequirements(data.ownershipRequirements as OwnershipRequirements<T>);
      }
    }
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): SiwbbChallenge<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as SiwbbChallenge<U>;
  }
}

/**
 * @category SIWBB Authentication
 */
export interface VerifySIWBBOptions {
  /** The expected ownership requirements for the user */
  ownershipRequirements?: AssetConditionGroup<NumberType>;

  /** Claim ID to check for. */
  claimId?: string;
  /** If true, we will only check for the existence of the claim. */
  checkClaimedMinOnce?: boolean;
  /** If true, we will simulate the claim. Only compatible with non-indexed claims. */
  simulateClaim?: boolean;

  /** How recent the challenge must be in milliseconds. Defaults to 10 minutes. If 0, we will not check the time. */
  issuedAtTimeWindowMs?: number;
  /** Skip asset verification. This may be useful for simulations or testing */
  skipAssetVerification?: boolean;
}

/**
 * @category SIWBB Authentication
 */
export interface CodeGenQueryParams {
  ownershipRequirements?: AssetConditionGroup<NumberType>;
  expectVerifySuccess?: boolean;

  name?: string;
  description?: string;
  image?: string;

  otherSignIns?: ('discord' | 'twitter' | 'github' | 'google')[];

  redirect_uri?: string;
  client_id: string;
  state?: string;
  scope?: string;

  expectAttestationsPresentations?: boolean;

  claimId?: string;
  hideIfAlreadyClaimed?: boolean;
}

/**
 * @category SIWBB Authentication
 */
export const generateBitBadgesAuthUrl = (params: CodeGenQueryParams) => {
  let url = `https://bitbadges.io/siwbb/authorize?`;
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      if (typeof value === 'object') {
        const valueString = JSON.stringify(value);
        const encodedValue = encodeURIComponent(valueString);
        url = url.concat(`${key}=${encodedValue}&`);
      } else {
        url = url.concat(`${key}=${value}&`);
      }
    }
  }
  return url;
};
