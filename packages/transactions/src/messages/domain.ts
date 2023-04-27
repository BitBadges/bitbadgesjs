export function getDefaultDomainWithChainId(chainId: number) {
    return {
        name: 'BitBadges',
        version: '1.0.0',
        chainId,
        verifyingContract: '0x1a16c87927570239fecd343ad2654fd81682725e',
        salt: '0x5d1e2c0e9b8a5c395979525d5f6d5f0c595d5a5c5e5e5b5d5ecd5a5e5d2e54',
    }
}
