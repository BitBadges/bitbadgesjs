import BitBadgesApi from '@/api-indexer/BitBadgesApi';
import { CosmosAddress } from '@/api-indexer/docs/interfaces';
import { BlockinAndGroup, BlockinAssetConditionGroup, BlockinOrGroup, OwnershipRequirements } from '@/api-indexer/requests/blockin';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import { NumberType } from '@/common/string-numbers';
import { SupportedChain } from '@/common/types';
import { iAttestationsProof } from '@/interfaces/badges/core';
import { AndGroup, AssetConditionGroup, OrGroup } from 'blockin';
import { AttestationsProof } from './secrets';

/**
 * @category Interfaces
 */
export interface iBlockinChallenge<T extends NumberType> {
  /** The user's address */
  address: string;
  /** The chain of the address */
  chain: SupportedChain;
  /** The ownership requirements for the user */
  ownershipRequirements?: AssetConditionGroup<T>;
  /**
   * The converted Cosmos address of params.address. This can be used as the
   * unique identifier for the user (e.g. avoid duplicate sign ins from equivalent 0x and cosmos1 addresses).
   */
  cosmosAddress: CosmosAddress;

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
export class BlockinChallenge<T extends NumberType> extends BaseNumberTypeClass<BlockinChallenge<T>> implements iBlockinChallenge<T> {
  address: string;
  chain: SupportedChain;
  ownershipRequirements?: BlockinAssetConditionGroup<T>;
  cosmosAddress: CosmosAddress;
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

  constructor(data: iBlockinChallenge<T>) {
    super();
    this.address = data.address;
    this.cosmosAddress = data.cosmosAddress;
    this.chain = data.chain;
    this.verificationResponse = data.verificationResponse;
    this.otherSignIns = data.otherSignIns;
    this.attestationsPresentations = data.attestationsPresentations?.map((proof) => new AttestationsProof(proof));
    if (data.ownershipRequirements) {
      if ((data.ownershipRequirements as AndGroup<T>)['$and']) {
        this.ownershipRequirements = new BlockinAndGroup(data.ownershipRequirements as AndGroup<T>);
      } else if ((data.ownershipRequirements as OrGroup<T>)['$or']) {
        this.ownershipRequirements = new BlockinOrGroup(data.ownershipRequirements as OrGroup<T>);
      } else {
        this.ownershipRequirements = new OwnershipRequirements(data.ownershipRequirements as OwnershipRequirements<T>);
      }
    }
  }

  /**
   * Verifies the asset ownership requirements only. This requires a call to the BitBadges API.
   *
   * Does not set verificationResponse.
   */
  async verifyAssets(api: BitBadgesApi<T>) {
    if (!this.ownershipRequirements) {
      return true;
    }

    try {
      await api.verifyOwnershipRequirements({
        address: this.address,
        assetOwnershipRequirements: this.ownershipRequirements
      });

      return true;
    } catch (e: any) {
      console.error(e);
      return false;
    }
  }


  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): BlockinChallenge<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as BlockinChallenge<U>;
  }
}

/**
 * @category SIWBB Authentication
 */
export interface VerifySIWBBOptions {
  /** The expected ownership requirements for the user */
  ownershipRequirements?: AssetConditionGroup<NumberType>;
  /** The expected socials sign ins for the user */
  otherSignIns?: ('discord' | 'twitter' | 'github' | 'google')[];
  /** How recent the challenge must be in milliseconds. Defaults to 10 minutes */
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
