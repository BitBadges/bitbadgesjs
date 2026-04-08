/**
 * Known system addresses on the BitBadges chain.
 * These are NOT user wallets — they are protocol-level addresses.
 */
export const KNOWN_SYSTEM_ADDRESSES: Record<string, string> = {
  'bb10d07y265gmmuvt4z0w9aw880jnsr700jelmk2z': 'Governance Module',
  'bb1jv65s3grqf6v6jl3dp4t6c9t9rk99cd8yzv04w': 'Community Pool',
  'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv': 'Burn Address',
  'bb17xpfvakm2amg962yls6f84z3kell8c5lnytnhv': 'Fee Collector (Network)',
  'bb1akp5qudlhyp08m4k6826hn8mhqwmely6xvr7t2': 'BitBadges Team',
  'Mint': 'Mint (new tokens)',
  'Burn': 'Burn (destroyed)',
  'Network Fee': 'Network Fee',
  'Protocol Fee': 'Protocol Fee'
};

/** Return a human-friendly label for an address, or shorten it */
export function labelAddress(addr: string): string {
  if (KNOWN_SYSTEM_ADDRESSES[addr]) return KNOWN_SYSTEM_ADDRESSES[addr];
  if (addr.length > 20) return addr.slice(0, 10) + '...' + addr.slice(-6);
  return addr;
}

/** Check if an address is a known system/fee address */
export function isSystemAddress(addr: string): boolean {
  return !!KNOWN_SYSTEM_ADDRESSES[addr];
}

/** Map internal message type names to human-friendly descriptions */
export function humanizeMessageType(type: string): string {
  const map: Record<string, string> = {
    MsgUniversalUpdateCollection: 'Create or update a token collection',
    MsgTransferTokens: 'Transfer tokens',
    MsgSend: 'Send coins',
    'cosmos.bank.v1beta1.MsgSend': 'Send coins',
    MsgTransfer: 'Cross-chain transfer',
    MsgDelegate: 'Stake tokens',
    MsgUndelegate: 'Unstake tokens',
    MsgBeginRedelegate: 'Move staked tokens to a different validator',
    MsgVote: 'Vote on a governance proposal',
    AltChainSwap: 'Cross-chain token swap'
  };
  return map[type] ?? type.replace(/^Msg/, '').replace(/([A-Z])/g, ' $1').trim();
}
