export function getDefaultDomainWithChainId(chainId: number) {
  return {
    name: 'BitBadges',
    version: '1.0.0',
    chainId,
    verifyingContract: 'cosmos',
    salt: '0',
  }
}
