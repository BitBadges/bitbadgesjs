import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { SiwbbAndGroup, SiwbbAssetConditionGroup, SiwbbOrGroup, OwnershipRequirements } from '@/api-indexer/requests/blockin.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import { NumberType } from '@/common/string-numbers.js';
import { SupportedChain } from '@/common/types.js';
import type { AndGroup, AssetConditionGroup, OrGroup } from '@/blockin/index.js';

/**
 * @category Interfaces
 */
export interface iSiwbbChallenge {
  /** The user's address */
  address: string;
  /** The chain of the address */
  chain: SupportedChain;
  /** The ownership requirements for the user */
  ownershipRequirements?: AssetConditionGroup;
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
}

/**
 * @category SIWBB Authentication
 */
export class SiwbbChallenge extends BaseNumberTypeClass<SiwbbChallenge> implements iSiwbbChallenge {
  address: string;
  chain: SupportedChain;
  ownershipRequirements?: SiwbbAssetConditionGroup;
  bitbadgesAddress: BitBadgesAddress;
  verificationResponse?: {
    success: boolean;
    errorMessage?: string;
  };

  constructor(data: iSiwbbChallenge) {
    super();
    this.address = data.address;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.chain = data.chain;
    this.verificationResponse = data.verificationResponse;
    if (data.ownershipRequirements) {
      if ((data.ownershipRequirements as AndGroup)['$and']) {
        this.ownershipRequirements = new SiwbbAndGroup(data.ownershipRequirements as AndGroup);
      } else if ((data.ownershipRequirements as OrGroup)['$or']) {
        this.ownershipRequirements = new SiwbbOrGroup(data.ownershipRequirements as OrGroup);
      } else {
        this.ownershipRequirements = new OwnershipRequirements(data.ownershipRequirements as OwnershipRequirements);
      }
    }
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): SiwbbChallenge {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SiwbbChallenge;
  }
}

/**
 * @category SIWBB Authentication
 */
export interface VerifySIWBBOptions {
  /** How recent the challenge must be in milliseconds. Defaults to 10 minutes. If 0, we will not check the time. */
  issuedAtTimeWindowMs?: number;
  /**
   * Skip asset verification. This may be useful for simulations or testing.
   *
   * @deprecated Please do not use. Check requirements a claim or other means.
   */
  skipAssetVerification?: boolean;
}

/** @category SIWBB Authentication */
export interface AdditionalQueryParams {
  /** We will display this claim on the authorize screen. Just for display purpses. This is still to be checked by you post-authentication. */
  claimId?: string;
  /** For the claimId, we will hide the claim if the user has already completed it (successCount >= 1). */
  hideIfAlreadyClaimed?: boolean;
  /**
   * We will expect the claim verification to succeed. If false, we will not let user attempt to sign in.
   *
   * Note: This is not a replacement for checking the claim on your side because users can manipulate the client-side URL parameters.
   */
  expectVerifySuccess?: boolean;
}

/**
 * @category SIWBB Authentication
 */
export interface CodeGenQueryParams extends AdditionalQueryParams {
  /**
   * The redirect URI to redirect to after the user signs in. Must match the one in developer portal.
   */
  redirect_uri?: string;
  /**
   * The client ID to use for the SIWBB request. Must match the one in developer portal.
   */
  client_id: string;
  /**
   * The state to use for the SIWBB request.
   */
  state?: string;
  /**
   * The scopes to request (e.g. `completeClaims,approveSignInWithBitBadges`).
   */
  scope?: string;
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
