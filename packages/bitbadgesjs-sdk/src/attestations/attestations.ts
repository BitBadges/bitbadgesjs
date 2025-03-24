import { getChainForAddress } from '@/address-converter/converter.js';
import { getChainDriver } from '@/chain-drivers/verifySig.js';
import { blsCreateProof, blsVerify, blsVerifyProof } from '@trevormil/bbs-signatures';

/**
 * Creates a attestations proof that is well-formed according to the BitBadges expected format
 *
 * @category SIWBB Authentication
 */
export const createAttestationsProof = blsCreateProof;

export interface VerifyAttestationSignaturesParameters {
  /** Must be 'bbs' or 'standard' */
  scheme: 'bbs' | 'standard' | string;
  /** The messages to attest to. Must be length 1 for standard */
  messages: string[];
  messageFormat: 'json' | 'plaintext';
  /**
   * The data integrity proof.
   *
   * For standard, this is the signature of the attestation.
   * For BBS, this is the actual BBS signature.
   */
  dataIntegrityProof?: {
    /** The signature of the attestation. */
    signature: string;
    /** The signer of the attestation. */
    signer: string;
    /** The public key of the signer (if needed) */
    publicKey?: string;
    /** Whether the proof is derived. Only applicable for BBS. */
    isDerived?: boolean;
  };
  /** The proof of issuance. Must be provided for BBS. Leave blank for standard. */
  proofOfIssuance?: {
    /** The message of the proof of issuance. */
    message: string;
    /** The signature of the proof of issuance. */
    signature: string;
    /** The signer of the proof of issuance. */
    signer: string;
    /** The public key of the signer (if needed) */
    publicKey?: string;
  };
}

/**
 * Verifies the attestations proofs well-formedness and signatures. This does not require a call to the BitBadges API.  Note this only verifies the signatures / validity of the proofs.
 * You are responsible for checking the contents of the proofs and everything else.
 *
 * Note this only works if scheme = 'bbs' or 'standard' (the BitBadges native ones).
 *
 * Alias of `verifyAttestationsignatures`
 *
 * @category SIWBB Authentication
 */
export const verifyAttestation = async (body: VerifyAttestationSignaturesParameters) => {
  await verifyAttestationSignatures(body);
};

/**
 * Verifies the attestations proofs well-formedness and signatures. This does not require a call to the BitBadges API.  Note this only verifies the signatures / validity of the proofs.
 * You are responsible for checking the contents of the proofs and everything else
 *
 * Alias of `verifyAttestation`
 *
 * Note this only works if scheme = 'bbs' or 'standard' (the BitBadges native ones).
 *
 * @category SIWBB Authentication
 */
export const verifyAttestationSignatures = async (
  body: VerifyAttestationSignaturesParameters,
  options?: {
    getSignerFromProofOfIssuance?: (proofOfIssuance: { message: string; signature: string; signer: string; publicKey?: string }) => string;
  }
) => {
  if (body.scheme !== 'bbs' && body.scheme !== 'standard') {
    throw new Error('Invalid scheme. Only BitBadges native schemes are supported (scheme = bbs, standard)');
  }

  if (!body.messages.length || body.messages.some((m) => !m)) {
    throw new Error('Messages are required and cannot be empty');
  }

  if (body.messageFormat === 'json') {
    for (const message of body.messages) {
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
      const chain = getChainForAddress(address);
      await getChainDriver(chain).verifySignature(
        address,
        body.messages?.[0] ?? '',
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
      const bbsSigner = options?.getSignerFromProofOfIssuance
        ? options.getSignerFromProofOfIssuance(body.proofOfIssuance)
        : body.proofOfIssuance.message.split(' ')[9];
      if (bbsSigner !== body.dataIntegrityProof.signer) {
        throw new Error('Proof signer does not match proof of issuance');
      }

      const address = body.proofOfIssuance.signer;
      const chain = getChainForAddress(address);

      await getChainDriver(chain).verifySignature(
        address,
        body.proofOfIssuance.message,
        body.proofOfIssuance.signature,
        body.proofOfIssuance.publicKey
      );

      const derivedProof = body.dataIntegrityProof.isDerived;
      if (!derivedProof) {
        const isProofVerified = await blsVerify({
          signature: Uint8Array.from(Buffer.from(body.dataIntegrityProof.signature, 'hex')),
          publicKey: Uint8Array.from(Buffer.from(body.dataIntegrityProof.signer, 'hex')),
          messages: body.messages.map((message) => Uint8Array.from(Buffer.from(message, 'utf-8')))
        });

        if (!isProofVerified.verified) {
          throw new Error('Data integrity proof not verified');
        }
      } else {
        const isProofVerified = await blsVerifyProof({
          proof: Uint8Array.from(Buffer.from(body.dataIntegrityProof.signature, 'hex')),
          publicKey: Uint8Array.from(Buffer.from(body.dataIntegrityProof.signer, 'hex')),
          messages: body.messages.map((message) => Uint8Array.from(Buffer.from(message, 'utf-8'))),
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
