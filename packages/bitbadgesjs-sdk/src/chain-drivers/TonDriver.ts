import type { IChainDriver } from 'blockin';
import type { AssetConditionGroup } from 'blockin/dist/types/verify.types';
import { Address } from '@ton/core';
import { NumberType } from '@/common/string-numbers.js';
import * as nacl from 'tweetnacl';

/**
 * TON implementation of the IChainDriver interface.
 *
 * For documentation regarding what each function does, see the IChainDriver interface.
 *
 * Note that the Blockin library also has many convenient, chain-generic functions that implement
 * this logic for creating / verifying challenges. Before using, you will have to setChainDriver(new TonDriver(.....)) first.
 */
export default class TonDriver implements IChainDriver<bigint> {
  chain;
  constructor(chain: string) {
    this.chain = chain;
  }

  async parseChallengeStringFromBytesToSign(txnBytes: Uint8Array) {
    return new TextDecoder().decode(txnBytes);
  }

  isValidAddress(address: string) {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  async verifySignature(address: string, message: string, signature: string) {
    const tonAddress = Address.parse(address);
    const messageBytes = Buffer.from(message, 'utf8');
    const signatureBytes = Buffer.from(signature, 'hex');
    const publicKeyBytes = Buffer.from(tonAddress.hash.slice(0, 32));

    const verified = await nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    if (!verified) {
      throw new Error('Signature Invalid');
    }
  }

  async verifyAssets(address: string, resources: string[], _assets: AssetConditionGroup<NumberType> | undefined) {
    throw new Error('Method not implemented.');
  }
}
