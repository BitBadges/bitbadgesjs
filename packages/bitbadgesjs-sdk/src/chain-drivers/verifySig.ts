import BtcDriver from '@/chain-drivers/BtcDriver';
import CosmosDriver from '@/chain-drivers/CosmosDriver';
import EthDriver from '@/chain-drivers/EthDriver';
import SolDriver from '@/chain-drivers/SolDriver';
import { SupportedChain } from '@/common/types';

const ethDriver = new EthDriver('0x1', undefined);
const solDriver = new SolDriver('');
const cosmosDriver = new CosmosDriver('bitbadges_1-1');
const btcDriver = new BtcDriver('Bitcoin');

/**
 * @category Address Utils
 */
export const getChainDriver = (chain: string) => {
  switch (chain) {
    case 'Cosmos':
      return cosmosDriver;
    case 'Ethereum':
      return ethDriver;
    case 'Solana':
      return solDriver;
    case 'Bitcoin':
      return btcDriver;
    default:
      return ethDriver;
  }
};
/**
 * Verifies a (message, signature) pair using any native chain's supported signature verification method.
 *
 * For certain chains (Cosmos), we also additionally need th epublicKey or else the function will fail.
 *
 * @category Address Utils
 */
export function verifySignature(chain: SupportedChain, address: string, message: string, signature: string, publicKey?: string) {
  const driver = getChainDriver(chain);
  return driver.verifySignature(address, message, signature, publicKey);
}
