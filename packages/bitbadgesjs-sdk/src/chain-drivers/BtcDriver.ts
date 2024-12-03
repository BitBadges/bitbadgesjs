import { Verifier } from 'bip322-js';

import type { IChainDriver } from 'blockin';
import type { AssetConditionGroup, NumberType } from 'blockin/dist/types/verify.types';

/**
 * Ethereum implementation of the IChainDriver interface. This implementation is based off the Moralis API
 * and ethers.js library.
 *
 * For documentation regarding what each function does, see the IChainDriver interface.
 *
 * Note that the Blockin library also has many convenient, chain-generic functions that implement
 * this logic for creating / verifying challenges. Before using, you will have to setChainDriver(new EthDriver(.....)) first.
 */
export default class BtcDriver implements IChainDriver<bigint> {
  chain;
  constructor(chain: string) {
    this.chain = chain;
  }

  async parseChallengeStringFromBytesToSign(txnBytes: Uint8Array) {
    return new TextDecoder().decode(txnBytes);
  }

  isValidAddress(address: string) {
    return false;
  }

  async verifySignature(address: string, message: string, signature: string) {
    const isValidSignature = Verifier.verifySignature(address, message, signature);
    if (!isValidSignature) {
      throw new Error('Signature Invalid');
    }
  }

  async verifyAssets(address: string, resources: string[], _assets: AssetConditionGroup<NumberType> | undefined, balancesSnapshot?: object) {
    throw new Error('Method not implemented.');
  }
}
