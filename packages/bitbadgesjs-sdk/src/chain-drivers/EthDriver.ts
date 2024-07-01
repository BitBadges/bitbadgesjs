import { NumberType } from '@/common/string-numbers';
import { IChainDriver } from 'blockin';
import { AssetConditionGroup } from 'blockin/dist/types/verify.types';
import { recoverPersonalSignature } from 'eth-sig-util';
import { isAddress } from 'ethers';

/**
 * Ethereum implementation of the IChainDriver interface. This implementation is based off the Moralis API
 * and ethers.js library.
 *
 * For documentation regarding what each function does, see the IChainDriver interface.
 *
 * Note that the Blockin library also has many convenient, chain-generic functions that implement
 * this logic for creating / verifying challenges. Before using, you will have to setChainDriver(new EthDriver(.....)) first.
 */
export default class EthDriver implements IChainDriver<bigint> {
  moralisDetails;
  chain;
  constructor(chain: string, MORALIS_DETAILS: any) {
    this.moralisDetails = MORALIS_DETAILS
      ? MORALIS_DETAILS
      : {
          apiKey: ''
        };
    this.chain = chain;
  }

  async parseChallengeStringFromBytesToSign(txnBytes: Uint8Array) {
    return new TextDecoder().decode(txnBytes);
  }

  isValidAddress(address: string) {
    return isAddress(address);
  }

  async verifySignature(address: string, message: string, signature: string) {
    const recoveredAddr = recoverPersonalSignature({
      data: message,
      sig: signature
    });
    if (recoveredAddr.toLowerCase() !== address.toLowerCase()) {
      throw new Error(`Signature Invalid: Expected ${address} but got ${recoveredAddr}`);
    }
  }

  async verifyAssets(address: string, resources: string[], _assets: AssetConditionGroup<NumberType> | undefined, balancesSnapshot?: object) {
    throw new Error('Method not implemented.');
  }
}
