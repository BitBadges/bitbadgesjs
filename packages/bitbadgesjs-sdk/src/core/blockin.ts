import BitBadgesApi from '@/api-indexer/BitBadgesApi';
import { CosmosAddress } from '@/api-indexer/docs/interfaces';
import { BlockinAndGroup, BlockinAssetConditionGroup, BlockinOrGroup, OwnershipRequirements } from '@/api-indexer/requests/blockin';
import { ExchangeSIWBBAuthorizationCodePayload } from '@/api-indexer/requests/requests';
import { getChainDriver } from '@/chain-drivers/verifySig';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import { NumberType } from '@/common/string-numbers';
import { SupportedChain } from '@/common/types';
import { iAttestationsProof } from '@/interfaces/badges/core';
import { blsCreateProof, blsVerify, blsVerifyProof } from '@trevormil/bbs-signatures';
import { AndGroup, AssetConditionGroup, ChallengeParams, OrGroup } from 'blockin';
import { convertToCosmosAddress, getChainForAddress } from '../address-converter/converter';
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

  /**
   * Verifies the attestations proofs only. This does not require a call to the BitBadges API. Does not set verificationResponse.
   *
   * Note this only verifies the signatures / validity of the proofs. You are responsible for checking the contents of the proofs.
   */
  async verifyAttestationsPresentationSignatures() {
    if (!this.attestationsPresentations) {
      throw new Error('Attestations proofs must be set with setattestationsPresentations before calling verifyAttestationsPresentationSignatures');
    }

    try {
      for (const proof of this.attestationsPresentations) {
        await verifyAttestationsPresentationSignatures(proof, true);
      }

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
 * Creates a attestations proof that is well-formed according to the BitBadges expected format
 *
 * @category SIWBB Authentication
 */
export const createAttestationsProof = blsCreateProof;

/**
 * Verifies the attestations proofs well-formedness and signatures. This does not require a call to the BitBadges API.  Note this only verifies the signatures / validity of the proofs.
 * You are responsible for checking the contents of the proofs.
 *
 * @category SIWBB Authentication
 */
export const verifyAttestationsPresentationSignatures = async (
  body: Omit<iAttestationsProof<NumberType>, 'anchors' | 'holders' | 'updateHistory' | 'credential' | 'entropies'>,
  derivedProof?: boolean
) => {
  if (!body.attestationMessages.length || body.attestationMessages.some((m) => !m)) {
    throw new Error('Messages are required and cannot be empty');
  }

  if (body.messageFormat === 'json') {
    for (const message of body.attestationMessages) {
      try {
        JSON.parse(message);
      } catch (e) {
        throw new Error('Message is not valid JSON');
      }
    }
  }

  // Check data integrity proof
  if (body.dataIntegrityProof) {
    if (body.scheme === 'standard') {
      const address = body.dataIntegrityProof.signer;
      if (convertToCosmosAddress(address) !== convertToCosmosAddress(body.createdBy)) {
        throw new Error('Signer does not match creator');
      }

      const chain = getChainForAddress(address);
      await getChainDriver(chain).verifySignature(
        address,
        body.attestationMessages?.[0] ?? '',
        body.dataIntegrityProof.signature,
        body.dataIntegrityProof.publicKey
      );
    } else if (body.scheme === 'bbs') {
      if (!body.proofOfIssuance?.message || !body.proofOfIssuance.signature) {
        throw new Error('Proof of issuance is required for BBS scheme');
      }

      //proofOfIssuance is used for BBS attestations to establish the link between the signer and the attestation
      //The actual attestation is signed by a BBS key pair (not the creator's native key pair). This is done because BBS
      //signatures offer uniuqe properties like selective disclosure.
      //To establish the link between the actual creator and the BBS signer, we use the proofOfIssuance to basically say
      //"I approve the issuance of attestations signed with BBS+ <BBS public key> as my own."

      //Make sure the proof of issuance message contents actually establish the link between the signer and the attestation
      //Make sure the signer is the same as the proof signer
      //Note this may be different if you have a custom implementation
      //For BitBadges, we do this with the following message: "message": "I approve the issuance of attestations signed with BBS+ a5159099a24a8993b5eb8e62d04f6309bbcf360ae03135d42a89b3d94cbc2bc678f68926373b9ded9b8b9a27348bc755177209bf2074caea9a007a6c121655cd4dda5a6618bfc9cb38052d32807c6d5288189913aa76f6d49844c3648d4e6167 as my own.\n\n",
      const bbsSigner = body.proofOfIssuance.message.split(' ')[9];
      if (bbsSigner !== body.dataIntegrityProof.signer) {
        throw new Error('Proof signer does not match proof of issuance');
      }
      const address = body.proofOfIssuance.signer;
      const chain = getChainForAddress(address);

      if (convertToCosmosAddress(address) !== convertToCosmosAddress(body.createdBy)) {
        throw new Error('Signer does not match creator');
      }

      await getChainDriver(chain).verifySignature(
        address,
        body.proofOfIssuance.message,
        body.proofOfIssuance.signature,
        body.proofOfIssuance.publicKey
      );

      if (!derivedProof) {
        const isProofVerified = await blsVerify({
          signature: Uint8Array.from(Buffer.from(body.dataIntegrityProof.signature, 'hex')),
          publicKey: Uint8Array.from(Buffer.from(body.dataIntegrityProof.signer, 'hex')),
          messages: body.attestationMessages.map((message) => Uint8Array.from(Buffer.from(message, 'utf-8')))
        });

        if (!isProofVerified.verified) {
          throw new Error('Data integrity proof not verified');
        }
      } else {
        const isProofVerified = await blsVerifyProof({
          proof: Uint8Array.from(Buffer.from(body.dataIntegrityProof.signature, 'hex')),
          publicKey: Uint8Array.from(Buffer.from(body.dataIntegrityProof.signer, 'hex')),
          messages: body.attestationMessages.map((message) => Uint8Array.from(Buffer.from(message, 'utf-8'))),
          nonce: Uint8Array.from(Buffer.from('nonce', 'utf8'))
        });
        if (!isProofVerified.verified) {
          throw new Error('Data integrity proof not verified');
        }
      }
    } else {
      throw new Error('Invalid scheme');
    }
  } else {
    throw new Error('Data integrity proof is required');
  }
};

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
