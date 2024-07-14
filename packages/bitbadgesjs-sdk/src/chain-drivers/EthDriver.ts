import type { NumberType } from '@/common/string-numbers.js';
import type { IChainDriver } from 'blockin';
import { AssetConditionGroup } from 'blockin/dist/types/verify.types';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { isAddress } from 'web3-validator';

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
    return isAddress(address, true);
  }

  async verifySignature(address: string, message: string, signature: string) {
    const recoveredAddr = recoverPersonalSignature({
      data: message,
      signature: signature
    });
    if (recoveredAddr.toLowerCase() !== address.toLowerCase()) {
      throw new Error(`Signature Invalid: Expected ${address} but got ${recoveredAddr}`);
    }
  }

  async verifyAssets(address: string, resources: string[], _assets: AssetConditionGroup<NumberType> | undefined, balancesSnapshot?: object) {
    throw new Error('Method not implemented.');
  }
}
