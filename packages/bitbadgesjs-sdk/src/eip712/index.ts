/**
 * EIP-712 typed-data construction for Cosmos-EVM signed transactions.
 *
 * Public entry: `wrapTxToTypedData(signDoc, eip155ChainId)` takes an Amino
 * StdSignDoc (the same shape `makeSignDoc` returns) and produces a
 * `{ domain, types, primaryType, message }` object that any
 * `eth_signTypedData_v4`-compatible signer (MetaMask, Privy embedded wallet,
 * ethers `Wallet.signTypedData`, viem) can sign directly.
 *
 * The chain's ante handler (cosmos/evm) reconstructs the same typed-data
 * during verification. The TS implementation here is a near-line-for-line
 * port of the canonical Go reference at
 * `cosmos/evm/ethereum/eip712/` (v0.6.0 — the version the BitBadges chain
 * pins). Updating that dependency may require updating this module.
 */
export * from './broadcast.js';
export * from './build.js';
export * from './domain.js';
export * from './hash.js';
export * from './message.js';
export * from './recover.js';
export * from './sanitize.js';
export * from './types.js';
export * from './types-builder.js';
export * from './wrap.js';
