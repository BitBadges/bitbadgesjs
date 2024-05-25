import BitBadgesApi from '@/api-indexer/BitBadgesApi';
import { BlockinMessage, CosmosAddress } from '@/api-indexer/docs/interfaces';
import { BlockinChallengeParams } from '@/api-indexer/requests/blockin';
import { GetAndVerifySIWBBRequestPayload } from '@/api-indexer/requests/requests';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import { NumberType } from '@/common/string-numbers';
import { SupportedChain } from '@/common/types';
import { iSecretsProof } from '@/interfaces/badges/core';
import { blsCreateProof, blsVerify, blsVerifyProof } from '@trevormil/bbs-signatures';
import { ChallengeParams, IChainDriver, VerifyChallengeOptions, verifyChallenge } from 'blockin';
import { convertToCosmosAddress, getChainDriver, getChainForAddress, verifySignature } from '../address-converter/converter';
import { SecretsProof } from './secrets';

/**
 * @category Interfaces
 */
export interface iBlockinChallenge<T extends NumberType> {
  /** The user's address */
  address: string;
  /** The chain of the address */
  chain: SupportedChain;
  /** Some chains require the public key as well to verify signatures */
  publicKey?: string;
  /**
   * The corresponding message that was signed to obtain the signature.
   */
  message: BlockinMessage;
  /**
   * The signature of the message.
   */
  signature?: string;
  /**
   * The converted params for the message
   */
  params: ChallengeParams<T>;
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

  options?: VerifyChallengeOptions;

  /**
   * Derived data integrity proofs for any secrets requested.
   */
  secretsPresentations?: iSecretsProof<T>[];

  /** Other sign-ins that were requested */
  otherSignIns?: {
    discord?: { username: string; discriminator?: string | undefined; id: string } | undefined;
    github?: { username: string; id: string } | undefined;
    google?: { username: string; id: string } | undefined;
    twitter?: { username: string; id: string } | undefined;
  };

  /** Whether to allow reuse of BitBadges sign in */
  allowReuseOfBitBadgesSignIn?: boolean;
}

/**
 * @category SIWBB Authentication
 */
export class BlockinChallenge<T extends NumberType> extends BaseNumberTypeClass<BlockinChallenge<T>> implements iBlockinChallenge<T> {
  address: string;
  chain: SupportedChain;
  publicKey?: string;
  message: BlockinMessage;
  signature?: string;
  params: BlockinChallengeParams<T>;
  options?: VerifyChallengeOptions;
  cosmosAddress: CosmosAddress;
  verificationResponse?: {
    success: boolean;
    errorMessage?: string;
  };
  secretsPresentations?: SecretsProof<T>[];
  allowReuseOfBitBadgesSignIn?: boolean;
  otherSignIns?: {
    discord?: { username: string; discriminator?: string | undefined; id: string } | undefined;
    github?: { username: string; id: string } | undefined;
    google?: { username: string; id: string } | undefined;
    twitter?: { username: string; id: string } | undefined;
  };

  constructor(data: iBlockinChallenge<T>) {
    super();
    this.params = new BlockinChallengeParams(data.params);
    this.signature = data.signature;
    this.message = data.message;
    this.address = data.address;
    this.cosmosAddress = data.cosmosAddress;
    this.chain = data.chain;
    this.options = data.options;
    this.publicKey = data.publicKey;
    this.verificationResponse = data.verificationResponse;
    this.otherSignIns = data.otherSignIns;
    this.allowReuseOfBitBadgesSignIn = data.allowReuseOfBitBadgesSignIn;
    this.secretsPresentations = data.secretsPresentations?.map((proof) => new SecretsProof(proof));
  }

  static async FromSIWBBRequestId<T extends NumberType>(api: BitBadgesApi<T>, body: GetAndVerifySIWBBRequestPayload) {
    const SIWBBRequestRes = await api.getAndVerifySIWBBRequest(body);
    return SIWBBRequestRes.blockin;
  }

  /**
   * Verify function with all features (including asset ownership verification). This requires a call to the BitBadges API.
   *
   * Sets verificationResponse to the response from the API.
   */
  async verify(api: BitBadgesApi<T>, options: VerifyChallengeOptions) {
    try {
      await api.verifySIWBBRequest({
        message: this.message,
        signature: this.signature ?? '',
        publicKey: this.publicKey,
        secretsPresentations: this.secretsPresentations,
        options
      });

      this.options = options;
      this.verificationResponse = { success: true };
      return true;
    } catch (e: any) {
      console.error(e);
      this.verificationResponse = {
        success: false,
        errorMessage: e.errorMessage
      };

      return false;
    }
  }

  /**
   * Verify function with all offline features (no asset ownership verification). This does not require a call to the BitBadges API.
   *
   * Sets verificationResponse to the response.
   */
  async verifyOffline(options: VerifyChallengeOptions) {
    const chainDriver = getChainDriver(this.chain);
    try {
      const res = await verifyChallenge(
        chainDriver as IChainDriver<NumberType>,
        this.message,
        this.signature ?? '',
        {
          ...options,
          skipAssetVerification: true
        },
        this.publicKey
      );

      this.options = {
        ...options,
        skipAssetVerification: true
      };
      this.verificationResponse = res;

      return res.success;
    } catch (e: any) {
      console.error(e);
      this.verificationResponse = {
        success: false,
        errorMessage: e.errorMessage
      };

      return false;
    }
  }

  /**
   * Verifies the asset ownership requirements only. This requires a call to the BitBadges API.
   *
   * Does not set verificationResponse.
   */
  async verifyAssets(api: BitBadgesApi<T>) {
    if (!this.params.assetOwnershipRequirements) {
      return true;
    }

    try {
      await api.verifyOwnershipRequirements({
        cosmosAddress: this.cosmosAddress,
        assetOwnershipRequirements: this.params.assetOwnershipRequirements
      });

      return true;
    } catch (e: any) {
      console.error(e);
      return false;
    }
  }

  /**
   * Verifies the signature only. This does not require a call to the BitBadges API. Does not set verificationResponse.
   */
  async verifySignature() {
    if (!this.signature) {
      throw new Error('Signature must be set with setSignature before calling verifySignature');
    }

    try {
      await verifySignature(this.chain, this.address, this.message, this.signature, this.publicKey);
      return true;
    } catch (e: any) {
      console.error(e);
      return false;
    }
  }

  /**
   * Verifies the secrets proofs only. This does not require a call to the BitBadges API. Does not set verificationResponse.
   *
   * Note this only verifies the signatures / validity of the proofs. You are responsible for checking the contents of the proofs.
   */
  async verifySecretsPresentationSignatures() {
    if (!this.secretsPresentations) {
      throw new Error('Secrets proofs must be set with setsecretsPresentations before calling verifySecretsPresentationSignatures');
    }

    try {
      for (const proof of this.secretsPresentations) {
        await verifySecretsPresentationSignatures(proof, true);
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
 * Creates a secrets proof that is well-formed according to the BitBadges expected format
 *
 * @category SIWBB Authentication
 */
export const createSecretsProof = blsCreateProof;

/**
 * Verifies the secrets proofs well-formedness and signatures. This does not require a call to the BitBadges API.  Note this only verifies the signatures / validity of the proofs.
 * You are responsible for checking the contents of the proofs.
 *
 * @category SIWBB Authentication
 */
export const verifySecretsPresentationSignatures = async (
  body: Omit<iSecretsProof<NumberType>, 'anchors' | 'holders' | 'updateHistory' | 'credential' | 'entropies'>,
  derivedProof?: boolean
) => {
  if (!body.secretMessages.length || body.secretMessages.some((m) => !m)) {
    throw new Error('Messages are required and cannot be empty');
  }

  if (body.messageFormat === 'json') {
    for (const message of body.secretMessages) {
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
        body.secretMessages?.[0] ?? '',
        body.dataIntegrityProof.signature,
        body.dataIntegrityProof.publicKey
      );
    } else if (body.scheme === 'bbs') {
      if (!body.proofOfIssuance?.message || !body.proofOfIssuance.signature) {
        throw new Error('Proof of issuance is required for BBS scheme');
      }

      //proofOfIssuance is used for BBS secrets to establish the link between the signer and the secret
      //The actual secret is signed by a BBS key pair (not the creator's native key pair). This is done because BBS
      //signatures offer uniuqe properties like selective disclosure.
      //To establish the link between the actual creator and the BBS signer, we use the proofOfIssuance to basically say
      //"I approve the issuance of secrets signed with BBS+ <BBS public key> as my own."

      //Make sure the proof of issuance message contents actually establish the link between the signer and the secret
      //Make sure the signer is the same as the proof signer
      //Note this may be different if you have a custom implementation
      //For BitBadges, we do this with the following message: "message": "I approve the issuance of secrets signed with BBS+ a5159099a24a8993b5eb8e62d04f6309bbcf360ae03135d42a89b3d94cbc2bc678f68926373b9ded9b8b9a27348bc755177209bf2074caea9a007a6c121655cd4dda5a6618bfc9cb38052d32807c6d5288189913aa76f6d49844c3648d4e6167 as my own.\n\n",
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
          messages: body.secretMessages.map((message) => Uint8Array.from(Buffer.from(message, 'utf-8')))
        });

        if (!isProofVerified.verified) {
          throw new Error('Data integrity proof not verified');
        }
      } else {
        const isProofVerified = await blsVerifyProof({
          proof: Uint8Array.from(Buffer.from(body.dataIntegrityProof.signature, 'hex')),
          publicKey: Uint8Array.from(Buffer.from(body.dataIntegrityProof.signer, 'hex')),
          messages: body.secretMessages.map((message) => Uint8Array.from(Buffer.from(message, 'utf-8'))),
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
export interface CodeGenQueryParams {
  challengeParams: ChallengeParams<NumberType>;

  name: string;
  description: string;
  image: string;

  allowAddressSelect?: boolean;
  autoGenerateNonce?: boolean;

  verifyOptions?: VerifyChallengeOptions;
  expectVerifySuccess?: boolean;

  otherSignIns?: ('discord' | 'twitter' | 'github' | 'google')[];

  redirectUri?: string;
  clientId: string;
  state?: string;

  expectSecretsPresentations?: boolean;

  allowReuseOfBitBadgesSignIn?: boolean;
}

/**
 * @category SIWBB Authentication
 */
export const generateBitBadgesAuthUrl = (params: CodeGenQueryParams) => {
  let url = `https://bitbadges.io/auth/codegen?`;
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
