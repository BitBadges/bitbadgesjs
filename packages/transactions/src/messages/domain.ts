export function getDefaultDomainWithChainId(chainId: number) {
  return {
    name: 'Cosmos Web3',
    version: '1.0.0',
    chainId,
    verifyingContract: 'cosmos',
    salt: '0',
  }
}
