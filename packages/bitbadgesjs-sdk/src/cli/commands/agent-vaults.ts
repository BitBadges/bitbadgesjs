/**
 * `bitbadges-cli agent-vaults` — end-user surface for the Agent Vault standard.
 *
 * An Agent Vault is a Smart Token (`standards: ['Smart Token','Agent Vault']`)
 * whose withdrawal is gated for an autonomous agent: a per-period spend cap, an
 * optional time window, and/or a one-time multisig "unlock" vote. The human is
 * the manager; the agent holds the vault tokens and withdraws within the gating.
 *
 * Subcommands:
 *   list                Browse Agent Vault collections
 *   show <id>           Backing address/denom, approval ids, parsed gating
 *   status <id>         Compact status summary
 *   deposit <id>        Emit MsgTransferTokens to fund the vault (mint tokens)
 *   withdraw <id>       Emit MsgTransferTokens to withdraw (burn tokens), gated
 *   pay <id>            Emit {messages:[withdraw, bank send]} — atomic vault→recipient
 *   vote <id>           Emit MsgCastVote toward the multisig withdrawal unlock
 *
 * Build new via `bb build agent-vault`.
 */

import { Command } from 'commander';
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  callIndexer as callApi,
  emitIndexerResult as emit,
  emitIndexerError as emitError,
  type IndexerNetworkFlags as NetworkFlags,
  type IndexerOutputFlags as OutputFlags
} from '../utils/indexer-options.js';
import { requireBb1AddressStrict } from '../utils/address.js';
import { addDeployOptions, runEmitOrDeploy } from '../utils/deploy-options.js';
import { normalizeCollection, validateCollectionOrExit } from '../utils/collection-options.js';
import {
  doesCollectionFollowAgentVaultProtocol,
  validateAgentVaultCollection,
  extractAgentVaultDetails,
  buildAgentVaultDepositMsg,
  buildAgentVaultWithdrawMsg,
  buildAgentVaultPayMsgs,
  buildAgentVaultVoteMsg
} from '../../core/agent-vaults.js';
import { resolveCoin, toBaseUnits } from '../../core/builders/shared.js';

async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  return normalizeCollection(await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts));
}

function validateOrExit(collection: any, ctx: string): void {
  validateCollectionOrExit(collection, ctx, validateAgentVaultCollection, 'Agent Vault');
}

/**
 * Resolve `--amount` into base units of the backing coin (display units by
 * default; `--base-units` for a raw integer passthrough). Mirrors the
 * smart-tokens helper: the denom is collection-derived + canonical.
 */
function resolveBackingAmount(rawAmount: string, baseUnits: boolean, backingDenom: string): string {
  if (baseUnits) {
    const a = String(rawAmount).replace(/[_,]/g, '');
    if (!/^\d+$/.test(a)) {
      process.stderr.write(`Error: --amount must be a non-negative integer when --base-units is set, got "${rawAmount}"\n`);
      process.exit(2);
    }
    return a;
  }
  const resolved = resolveCoin(backingDenom);
  return toBaseUnits(Number(rawAmount), resolved.decimals);
}

// ── agent-vaults (parent) ─────────────────────────────────────────────────────

export const agentVaultsCommand = new Command('agent-vaults').description(
  'End-user surface for the Agent Vault standard — list / show / status / deposit / withdraw / pay / vote. ' +
    'An Agent Vault is a Smart Token with a gated withdrawal (per-period cap, time window, multisig unlock). Build new via `bb build agent-vault`.'
);

// ── agent-vaults list ──────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    agentVaultsCommand
      .command('list')
      .description('Browse Agent Vault collections (Smart Tokens carrying the "Agent Vault" standard).')
  )
).action(async (opts: NetworkFlags & OutputFlags) => {
  try {
    // Agent Vaults are Smart Tokens; browse that category then filter by the
    // Agent Vault conformance validator (robust regardless of indexer category).
    const res = await callApi('POST', '/browse', opts, { type: 'collections', category: 'smart-token' });
    const all: any[] = res?.collections?.['smart-token'] ?? res?.collections ?? [];
    const collections = all.filter((c: any) => doesCollectionFollowAgentVaultProtocol(c));
    const summary = collections.map((c: any) => {
      const d = extractAgentVaultDetails(c)!;
      return {
        collectionId: String(c.collectionId ?? c._docId ?? ''),
        backingAddress: d.backingAddress,
        backingDenom: d.backingDenom,
        gating: d.gating
      };
    });
    emit(summary, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── agent-vaults show / status ─────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    agentVaultsCommand
      .command('show')
      .description('Render an Agent Vault — backing address/denom, deposit/withdraw approval ids, and parsed gating.')
      .argument('<collection-id>', 'Agent Vault collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'agent-vaults show');
    const d = extractAgentVaultDetails(collection)!;
    emit(
      {
        collectionId: String(collectionId),
        backingAddress: d.backingAddress,
        backingDenom: d.backingDenom,
        depositApprovalId: d.depositApproval.approvalId,
        withdrawApprovalId: d.withdrawApproval.approvalId,
        gating: d.gating,
        standards: collection.standards
      },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

addOutputFlags(
  addNetworkFlags(
    agentVaultsCommand
      .command('status')
      .description('Compact status — collection id, backing denom, and a gating summary.')
      .argument('<collection-id>', 'Agent Vault collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'agent-vaults status');
    const d = extractAgentVaultDetails(collection)!;
    emit(
      {
        collectionId: String(collectionId),
        backingDenom: d.backingDenom,
        cap: d.gating.cap ?? null,
        timeWindow: d.gating.timeWindow ?? null,
        multisig: d.gating.multisig ? { quorumThreshold: d.gating.multisig.quorumThreshold, voters: d.gating.multisig.voters.length } : null,
        status: 'active'
      },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

// ── agent-vaults deposit ────────────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      agentVaultsCommand
        .command('deposit')
        .description('Emit MsgTransferTokens to fund the vault — mint agent-vault tokens in exchange for the backing coin.')
        .argument('<collection-id>', 'Agent Vault collection ID')
        .requiredOption('--creator <address>', 'Caller address (bb1.../0x... auto-normalized) — receives the minted vault tokens')
        .requiredOption('--amount <n>', 'Amount to deposit. Display units of the backing coin; use --base-units for raw base units.')
        .option('--base-units', 'Treat --amount as already-in-base-units')
    )
  )
).action(
  async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string; amount: string; baseUnits?: boolean }) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'agent-vaults deposit');
      const details = extractAgentVaultDetails(collection)!;
      const amount = resolveBackingAmount(opts.amount, !!opts.baseUnits, details.backingDenom);
      const msg = buildAgentVaultDepositMsg({ creator, collectionId: String(collectionId), amount, details });
      await runEmitOrDeploy(msg, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
    } catch (err) {
      emitError(err);
    }
  }
).addHelpText('after', `
Examples:
  $ bb agent-vaults deposit 42 --creator bb1user...xyz --amount 100 | bb deploy
`);

// ── agent-vaults withdraw ─────────────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      agentVaultsCommand
        .command('withdraw')
        .description('Emit MsgTransferTokens to withdraw — burn agent-vault tokens to release the backing coin (subject to the vault gating).')
        .argument('<collection-id>', 'Agent Vault collection ID')
        .requiredOption('--creator <address>', 'Caller address (the agent holding the vault tokens)')
        .requiredOption('--amount <n>', 'Amount to withdraw. Display units; use --base-units for raw base units.')
        .option('--base-units', 'Treat --amount as already-in-base-units')
    )
  )
).action(
  async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string; amount: string; baseUnits?: boolean }) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'agent-vaults withdraw');
      const details = extractAgentVaultDetails(collection)!;
      const amount = resolveBackingAmount(opts.amount, !!opts.baseUnits, details.backingDenom);
      const msg = buildAgentVaultWithdrawMsg({ creator, collectionId: String(collectionId), amount, details });
      await runEmitOrDeploy(msg, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
    } catch (err) {
      emitError(err);
    }
  }
).addHelpText('after', `
Examples:
  $ bb agent-vaults withdraw 42 --creator bb1agent...xyz --amount 5 | bb deploy
`);

// ── agent-vaults pay ──────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    agentVaultsCommand
      .command('pay')
      .description(
        'Emit {messages:[MsgTransferTokens(withdraw), bank MsgSend]} — atomically withdraw (gated) and send the released backing coin to a recipient. ' +
          'If the gated leg fails, the send never executes. Pipe to `bb deploy`.'
      )
      .argument('<collection-id>', 'Agent Vault collection ID')
      .requiredOption('--creator <address>', 'Caller address (the agent holding the vault tokens)')
      .requiredOption('--amount <n>', 'Amount to pay. Display units; use --base-units for raw base units.')
      .requiredOption('--to <address>', 'Recipient address (bb1...) of the released backing coin')
      .option('--base-units', 'Treat --amount as already-in-base-units')
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; amount: string; to: string; baseUnits?: boolean }
  ) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const to = requireBb1AddressStrict(opts.to, '--to');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'agent-vaults pay');
      const details = extractAgentVaultDetails(collection)!;
      const amount = resolveBackingAmount(opts.amount, !!opts.baseUnits, details.backingDenom);
      const messages = buildAgentVaultPayMsgs({ creator, collectionId: String(collectionId), amount, details, to });
      emit({ messages }, opts);
    } catch (err) {
      emitError(err);
    }
  }
).addHelpText('after', `
Examples:
  $ bb agent-vaults pay 42 --creator bb1agent...xyz --amount 5 --to bb1vendor...abc | bb deploy
`);

// ── agent-vaults vote ─────────────────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      agentVaultsCommand
        .command('vote')
        .description('Emit MsgCastVote toward the vault\'s multisig withdrawal unlock. Only meaningful for vaults built with --signers.')
        .argument('<collection-id>', 'Agent Vault collection ID')
        .requiredOption('--creator <address>', 'Voter address (a configured signer)')
        .option('--yes-weight <n>', 'Yes vote as a 0–100 percent of this voter\'s weight (default 100)', '100')
    )
  )
).action(
  async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string; yesWeight?: string }) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'agent-vaults vote');
      const details = extractAgentVaultDetails(collection)!;
      if (!details.gating.multisig) {
        process.stderr.write('Error: this Agent Vault has no multisig gating — there is nothing to vote on.\n');
        process.exit(2);
      }
      const msg = buildAgentVaultVoteMsg({ creator, collectionId: String(collectionId), details, yesWeight: opts.yesWeight });
      await runEmitOrDeploy(msg, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
    } catch (err) {
      emitError(err);
    }
  }
).addHelpText('after', `
Examples:
  $ bb agent-vaults vote 42 --creator bb1signer...xyz | bb deploy
`);
