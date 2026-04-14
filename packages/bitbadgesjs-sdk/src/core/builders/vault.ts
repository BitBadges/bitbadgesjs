/**
 * Vault builder — creates a MsgUniversalUpdateCollection for a backed vault token.
 * @module core/builders/vault
 */
import {
  FOREVER,
  MAX_UINT64,
  BURN_ADDRESS,
  resolveCoin,
  toBaseUnits,
  parseDuration,
  buildMsg,
  buildAliasPath,
  sanitizeCosmosPathName,
  ibcBackedInvariants,
  generateAliasAddressForIBCBackedDenom,
  baselinePermissions
} from './shared.js';

export interface VaultParams {
  backingCoin: string; // USDC, BADGE, ATOM, OSMO
  name?: string;
  symbol?: string;
  image?: string;
  description?: string;
  dailyWithdrawLimit?: number; // max withdrawal per day (display units), 0 = unlimited
  require2fa?: string; // 2FA collection ID — if set, withdrawals require 2FA token ownership
  emergencyRecovery?: string; // bb1... recovery address for emergency migration
}

export function buildVault(params: VaultParams): any {
  const coin = resolveCoin(params.backingCoin);
  const backingAddr = generateAliasAddressForIBCBackedDenom(coin.denom);
  // Sanitize the symbol to the chain's wrapper-path regex
  // (`[a-zA-Z_{}-]+`) — see sanitizeCosmosPathName for the rule. Users
  // commonly include digits ("vUSDC9", "BADGE2") that would be rejected
  // at simulate time with "symbol contains invalid characters".
  const symbol = sanitizeCosmosPathName(params.symbol || 'v' + coin.symbol, 'symbol');

  const collectionApprovals: any[] = [
    // Deposit (backing). `toListId` excludes the backing address itself
    // so the backing alias can't receive its own wrapper tokens (which
    // would be nonsensical and matches the frontend VaultApprovalRegistry
    // default).
    {
      fromListId: backingAddr,
      toListId: `!${backingAddr}`,
      initiatedByListId: 'All',
      approvalId: 'vault-deposit',
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        mustPrioritize: true,
        allowBackedMinting: true,
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    },
    // Withdrawal (unbacking) — with optional daily limit and 2FA
    {
      fromListId: '!Mint',
      toListId: backingAddr,
      initiatedByListId: 'All',
      approvalId: `vault-withdraw-${Math.random().toString(16).slice(2, 10)}`,
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        mustPrioritize: true,
        allowBackedMinting: true,
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        ...(params.dailyWithdrawLimit ? {
          approvalAmounts: {
            overallApprovalAmount: '0',
            perToAddressApprovalAmount: '0',
            perFromAddressApprovalAmount: '0',
            perInitiatedByAddressApprovalAmount: toBaseUnits(params.dailyWithdrawLimit, coin.decimals),
            amountTrackerId: 'withdrawal-daily',
            resetTimeIntervals: {
              startTime: String(getMidnightTimestamp()),
              intervalLength: String(86400000)
            }
          }
        } : {}),
        ...(params.require2fa ? {
          mustOwnTokens: [{
            collectionId: params.require2fa,
            amountRange: { start: '1', end: MAX_UINT64 },
            ownershipTimes: FOREVER,
            tokenIds: [{ start: '1', end: '1' }],
            overrideWithCurrentTime: true,
            mustSatisfyForAllAssets: false
          }]
        } : {})
      }
    }
  ];

  // Emergency migration approval — forcefully moves all tokens to recovery address
  if (params.emergencyRecovery) {
    collectionApprovals.push({
      fromListId: '!Mint',
      toListId: params.emergencyRecovery,
      initiatedByListId: params.emergencyRecovery,
      approvalId: 'vault-emergency-migration',
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    });
  }

  const invariants = {
    ...ibcBackedInvariants(coin.denom),
    disablePoolCreation: true
  };

  return buildMsg({
    collectionApprovals,
    standards: ['Smart Token', 'Vault'],
    invariants,
    // Derive the denom from the (sanitized) symbol — chain enforces
    // global denom uniqueness, so a hardcoded 'uvault' would collide
    // for any user creating more than one vault on the same chain.
    aliasPathsToAdd: [buildAliasPath('u' + symbol.toLowerCase(), symbol, coin.decimals, coin.image)],
    collectionPermissions: baselinePermissions()
  });
}

/** Get next midnight UTC timestamp in ms */
function getMidnightTimestamp(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(0, 0, 0, 0);
  if (midnight.getTime() <= now.getTime()) midnight.setUTCDate(midnight.getUTCDate() + 1);
  return midnight.getTime();
}
