import { verifyADR36Amino } from '@keplr-wallet/cosmos';
import { IChainDriver } from 'blockin';
import { AssetConditionGroup, NumberType } from 'blockin/dist/types/verify.types';
import { Buffer } from 'buffer';

/**
 * Cosmos implementation of the IChainDriver interface.
 *
 * For documentation regarding what each function does, see the IChainDriver interface.
 *
 * Note that the Blockin library also has many convenient, chain-generic functions that implement
 * this logic for creating / verifying challenges. Before using, you will have to setChainDriver(new CosmosDriver(.....)) first.
 */
export default class CosmosDriver implements IChainDriver<NumberType> {
  chain;
  constructor(chain: string) {
    this.chain = chain;
  }

  isValidAddress(address: string) {
    return false;
  }

  /**Not implemented */
  getPublicKeyFromAddress(address: string) {
    throw 'Not implemented';
  }
  async verifySignature(address: string, message: string, signature: string, publicKey?: string) {
    const prefix = 'cosmos';
    if (!publicKey) {
      throw new Error(`Public key must be provided for Cosmos signatures. We could not fetch it from the blockchain or BitBadges databases either.`);
    }

    const pubKeyBytes = Buffer.from(publicKey, 'base64');
    const signatureBytes = Buffer.from(signature, 'base64');

    const isRecovered = verifyADR36Amino(prefix, address, message, pubKeyBytes, signatureBytes, 'secp256k1');
    if (!isRecovered) {
      throw new Error(`Signature invalid for address ${address}`);
    }
  }

  async verifyAssets(
    address: string,
    resources: string[],
    _assets: AssetConditionGroup<NumberType> | undefined,
    balancesSnapshot?: object | undefined
  ) {
    throw new Error('Method not implemented.');
  }
}
