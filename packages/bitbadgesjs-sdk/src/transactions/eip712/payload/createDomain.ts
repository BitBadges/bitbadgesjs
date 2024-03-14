export const NAME = 'BitBadges';
export const VERSION = '1.0.0';
export const VERIFYING_CONTRACT = '0xa607FcD07cfe8d84cA839e4D6EdEE4B1A6789603';
export const SALT = '0x5d1e2c0e9b8a5c395979525d5f6d5f0c595d5a5c5e5e5b5d5ecd5a5e5d2e5412';

const createDomain = (chainId: number) => ({
  name: NAME,
  version: VERSION,
  chainId,
  verifyingContract: VERIFYING_CONTRACT,
  salt: SALT
});

export default createDomain;
