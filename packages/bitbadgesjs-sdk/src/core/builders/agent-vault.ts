/**
 * Agent Vault builder — a Smart Token whose withdrawal approval is gated for an
 * autonomous agent: a per-period spend cap, an optional time window, and an
 * optional multisig "unlock" vote. The human is the collection manager
 * (`--manager`); the agent holds the vault tokens and withdraws within these
 * guardrails.
 *
 * Distinct from the `Vault` standard (`./vault.ts`): an Agent Vault carries
 * `standards: ['Smart Token', 'Agent Vault']` and the richer gating below.
 * Ported from the cosmos-mcp reference implementation.
 *
 * @module core/builders/agent-vault
 */
import {
  FOREVER,
  MAX_UINT64,
  resolveCoin,
  toBaseUnits,
  buildMsg,
  buildAliasPath,
  sanitizeCosmosPathName,
  ibcBackedInvariants,
  generateAliasAddressForIBCBackedDenom,
  frozenPermissions,
  tokenMetadataEntry,
  metadataFromFlat,
  MetadataMissingError,
  approvalMetadata,
  stableHashId
} from './shared.js';

export type AgentVaultPeriod = 'daily' | 'weekly' | 'monthly';

export interface AgentVaultSigner {
  address: string;
  /** Voting weight (default 1). */
  weight?: number;
}

export interface AgentVaultParams {
  backingCoin: string; // USDC, BADGE, ATOM, OSMO
  /** Pre-hosted collection metadata URI. If provided, name/image/description are ignored. */
  uri?: string;
  name?: string;
  symbol?: string;
  image?: string;
  description?: string;
  /** Max the agent may withdraw per `period` (display units of the backing coin). 0/undefined = uncapped. */
  withdrawLimit?: number;
  /** Reset window for `withdrawLimit`. Default 'daily'. */
  period?: AgentVaultPeriod;
  /** Withdrawals invalid before this epoch-ms. */
  unlockAt?: number;
  /** Withdrawals invalid after this epoch-ms. */
  expiresAt?: number;
  /** Multisig signers whose weighted "yes" votes unlock withdrawals (one-time). */
  signers?: AgentVaultSigner[];
  /** Required yes-weight to unlock (N in N-of-M when weights are 1). Defaults to unanimous. Requires `signers`. */
  threshold?: number;
}

/** Stable IDs, matched by `extractAgentVaultDetails` (substring "deposit"/"withdraw"). */
export const AGENT_VAULT_DEPOSIT_APPROVAL_ID = 'agent-vault-deposit';
export const AGENT_VAULT_WITHDRAW_APPROVAL_PREFIX = 'agent-vault-withdraw';
/**
 * Prefix for the multisig withdraw proposal id. The actual proposalId is
 * `stableHashId(this, withdrawSeed)` so it is UNIQUE per vault — the indexer
 * keys VoteDocs by the bare proposalId (handleMsgCastVote `_docId = proposalId`),
 * so a constant would make two multisig vaults collide on one vote doc. Matches
 * the deterministic-proposalId convention in `bounty.ts`.
 */
export const AGENT_VAULT_WITHDRAW_PROPOSAL_PREFIX = 'agent-vault-withdraw-vote';

const PERIOD_MS: Record<AgentVaultPeriod, number> = {
  daily: 86_400_000,
  weekly: 604_800_000,
  monthly: 2_592_000_000 // 30d
};

/** Next midnight UTC (ms) — deterministic within a day; mirrors `vault.ts`. */
function nextMidnight(): number {
  const now = new Date();
  const m = new Date(now);
  m.setUTCHours(0, 0, 0, 0);
  if (m.getTime() <= now.getTime()) m.setUTCDate(m.getUTCDate() + 1);
  return m.getTime();
}

export function buildAgentVault(params: AgentVaultParams): any {
  const coin = resolveCoin(params.backingCoin);
  const backingAddr = generateAliasAddressForIBCBackedDenom(coin.denom);
  const symbol = sanitizeCosmosPathName(params.symbol || 'av' + coin.symbol, 'symbol');
  const period = params.period ?? 'daily';

  // Single deterministic seed shared by the withdraw approvalId AND the multisig
  // proposalId, so both are stable across replays yet unique per distinct vault
  // (the proposalId MUST be unique — the indexer keys VoteDocs by it).
  const withdrawSeed = {
    backing: coin.denom,
    symbol,
    withdrawLimit: params.withdrawLimit || 0,
    period,
    unlockAt: params.unlockAt || 0,
    expiresAt: params.expiresAt || 0,
    signers: (params.signers ?? []).map((s) => `${s.address}:${s.weight ?? 1}`).join(','),
    threshold: params.threshold || 0
  };

  // Withdrawal gating → approvalCriteria. No overridesFrom/To: the holder (agent)
  // must own the tokens to withdraw and the gating below caps the rate. (An
  // optional manager kill-switch adds its own forceful approval separately.)
  const withdrawCriteria: any = { mustPrioritize: true, allowBackedMinting: true };

  // Amount cap → per-initiator running tally, reset every `period`.
  if (params.withdrawLimit) {
    withdrawCriteria.approvalAmounts = {
      overallApprovalAmount: '0',
      perToAddressApprovalAmount: '0',
      perFromAddressApprovalAmount: '0',
      perInitiatedByAddressApprovalAmount: toBaseUnits(params.withdrawLimit, coin.decimals),
      amountTrackerId: `withdrawal-${period}`,
      resetTimeIntervals: {
        startTime: String(nextMidnight()),
        intervalLength: String(PERIOD_MS[period])
      }
    };
  }

  // Multisig → one-time voting-challenge unlock.
  if (params.signers && params.signers.length) {
    const voters = params.signers.map((s) => ({ address: s.address, weight: String(s.weight ?? 1) }));
    const totalWeight = voters.reduce((n, v) => n + Number(v.weight), 0);
    const threshold = params.threshold ?? totalWeight; // default: unanimous
    // Chain semantics (verified against x/tokenization/keeper/msg_server_cast_vote.go):
    // `quorumThreshold` is a PERCENTAGE (0–100) of total voter weight, and the
    // pass check is `floor(yesWeight*100/total) >= quorumThreshold` (GTE, integer
    // division). We map a required yes-weight `threshold` → floor(threshold /
    // totalWeight * 100). Because the chain ALSO floors, this is exact for any
    // total weight ≤ 100 (the floored percentages are strictly increasing, so
    // `threshold-1` weight always lands below the bar and N-of-M never passes
    // with fewer than N). Guard the input range — a threshold above the total
    // weight (e.g. a typo'd 5-of-3) or < 1 would otherwise silently clamp to
    // unanimous / 1%, hiding a misconfiguration.
    if (threshold < 1 || threshold > totalWeight) {
      throw new Error(
        `agent-vault: --threshold must be between 1 and the total signer weight (${totalWeight}), got ${threshold}.`
      );
    }
    const quorumPct = Math.max(1, Math.min(100, Math.floor((threshold / totalWeight) * 100)));
    withdrawCriteria.votingChallenges = [
      {
        proposalId: stableHashId(AGENT_VAULT_WITHDRAW_PROPOSAL_PREFIX, withdrawSeed),
        quorumThreshold: String(quorumPct),
        voters,
        uri: '',
        customData: '',
        resetAfterExecution: false, // one-time unlock — never re-arms
        delayAfterQuorum: '0'
      }
    ];
  }

  // Time window → restrict the withdraw approval's transferTimes.
  const withdrawTransferTimes =
    params.unlockAt || params.expiresAt
      ? [{ start: String(params.unlockAt ?? 1), end: String(params.expiresAt ?? MAX_UINT64) }]
      : FOREVER;

  const collectionApprovals: any[] = [
    // Deposit: anyone funds the backing alias → mints agent-vault tokens to the funder.
    {
      fromListId: backingAddr,
      toListId: `!${backingAddr}`,
      initiatedByListId: 'All',
      approvalId: AGENT_VAULT_DEPOSIT_APPROVAL_ID,
      ...approvalMetadata('Deposit', 'Open deposit — fund the vault to mint agent-vault tokens.'),
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: { mustPrioritize: true, allowBackedMinting: true }
    },
    // Withdrawal: burn agent-vault tokens → release backing coin, within the gating.
    {
      fromListId: '!Mint',
      toListId: backingAddr,
      initiatedByListId: 'All',
      // Deterministic suffix (not random) for replayable, diff-able builds.
      // The `agent-vault-withdraw-` prefix is load-bearing for detection.
      approvalId: stableHashId(AGENT_VAULT_WITHDRAW_APPROVAL_PREFIX, withdrawSeed),
      ...approvalMetadata(
        'Withdrawal',
        "Burn agent-vault tokens to withdraw backing coins, within the vault's gating (cap / time window / multisig)."
      ),
      transferTimes: withdrawTransferTimes,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: withdrawCriteria
    }
  ];

  const invariants = {
    ...ibcBackedInvariants(coin.denom),
    disablePoolCreation: true,
    // An Agent Vault is a wallet-like Smart Token holding an agent's funds, so
    // lock forceful post-mint transfers (matches buildSmartToken). The shared
    // ibcBackedInvariants() leaves this false, which `bb check` flags as
    // CRITICAL — and combined with frozenPermissions() below it ensures no
    // approval can ever forcibly move the agent's vault tokens out of band.
    noForcefulPostMintTransfers: true
  };

  const collectionSource = metadataFromFlat({
    uri: params.uri,
    name: params.name,
    description: params.description,
    image: params.image
  });
  if (!collectionSource) {
    throw new MetadataMissingError('agent-vault collectionMetadata', ['name', 'image', 'description']);
  }
  const aliasPath = buildAliasPath({
    denom: 'u' + symbol.toLowerCase(),
    symbol,
    decimals: coin.decimals,
    pathMetadata: collectionSource,
    unitMetadata: collectionSource
  });

  return buildMsg({
    collectionApprovals,
    standards: ['Smart Token', 'Agent Vault'],
    invariants,
    aliasPathsToAdd: [aliasPath],
    collectionMetadata: collectionSource,
    tokenMetadata: [tokenMetadataEntry(FOREVER, collectionSource, 'agent-vault token')],
    // Fully frozen — the manager cannot edit/revoke the withdraw approval
    // post-deposit and trap depositor funds (matches `vault.ts`).
    collectionPermissions: frozenPermissions()
  });
}
