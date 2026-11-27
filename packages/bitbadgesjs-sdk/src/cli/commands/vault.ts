/**
 * `bitbadges-cli vault` — end-user surface for the Vault standard.
 *
 * Subcommands:
 *   list                    Browse Vault collections
 *   show <id>               Render vault details — backing coin, withdrawal tiers, 2FA gates, emergency recovery
 *   status <id>             Compact status summary
 *   deposit <id>            Emit MsgTransferTokens to deposit backing coin and mint vault tokens
 *   withdraw <id>           Emit MsgTransferTokens to burn vault tokens and release backing coin
 *   emergency-migrate <id>  Emit MsgTransferTokens for configured emergency recovery migration
 *   build                   Alias for `bb build vault` (wired in cli/index.ts)
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
  inspectVaultCollection,
  validateVaultCollection,
  selectVaultApproval,
  buildVaultDepositMsg,
  buildVaultWithdrawMsg,
  buildVaultEmergencyMigrateMsg
} from '../../core/vaults.js';
import { resolveCoin } from '../../core/builders/shared.js';

async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  return normalizeCollection(await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts));
}

function validateOrExit(collection: any, ctx: string): void {
  validateCollectionOrExit(collection, ctx, validateVaultCollection, 'Vault');
}

function resolveBackingAmount(rawAmount: string, baseUnits: boolean, backingDenom: string): string {
  if (!/^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(rawAmount)) throw new Error('--amount must be a positive decimal string');
  const decimals = baseUnits ? 0 : resolveCoin(backingDenom).decimals;
  const [whole, fraction = ''] = rawAmount.split('.');
  if (fraction.length > decimals) throw new Error('--amount has more decimal places than the backing coin supports');
  const amount = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
  if (amount <= 0n) throw new Error('--amount must be positive');
  return amount.toString();
}

// ── vault (parent) ───────────────────────────────────────────────────────────

export const vaultCommand = new Command('vault')
  .alias('vaults')
  .description(
    'End-user surface for the Vault standard — list / show / status / deposit / withdraw / emergency-migrate. ' +
      'Build new via `bb build vault` (or `bb vault build`).'
  );

// ── vault list ───────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    vaultCommand
      .command('list')
      .description('Browse recognized Vault collections, including unsupported configurations with explanations.')
  )
).action(async (opts: NetworkFlags & OutputFlags) => {
  try {
    const res = await callApi('POST', '/browse', opts, { type: 'collections', category: 'smart-token' });
    const all: any[] = res?.collections?.['smart-token'] ?? res?.collections?.smartToken ?? res?.collections ?? [];
    const summary = all
      .filter((c) => c.standards?.includes('Vault'))
      .map((c) => ({
        collectionId: String(c.collectionId ?? c._docId ?? ''),
        ...inspectVaultCollection(c)
      }));
    emit(summary, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── vault show / status ──────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    vaultCommand
      .command('show')
      .description('Render a Vault — backing address, denom, deposit/withdraw tiers, 2FA gates, emergency recovery, standards.')
      .argument('<collection-id>', 'Vault collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    emit({ collectionId: String(collectionId), standards: collection.standards ?? [], ...inspectVaultCollection(collection) }, opts);
  } catch (err) {
    emitError(err);
  }
});

addOutputFlags(
  addNetworkFlags(
    vaultCommand
      .command('status')
      .description('Compact Vault status — backing denom, withdrawal limits, 2FA requirements, emergency recovery.')
      .argument('<collection-id>', 'Vault collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    emit({ collectionId: String(collectionId), ...inspectVaultCollection(collection) }, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── vault deposit ────────────────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      vaultCommand
        .command('deposit')
        .description(
          'Emit MsgTransferTokens to deposit the backing coin and mint Vault tokens. ' +
            'The caller must hold the backing coin; the chain routes it into the backing alias.'
        )
        .argument('<collection-id>', 'Vault collection ID')
        .requiredOption('--creator <address>', 'Caller address (bb1...) — receives the minted Vault tokens')
        .requiredOption(
          '--amount <n>',
          'Amount to deposit in display units (e.g. 10 USDC). Use --base-units to pass raw base units.'
        )
        .option('--base-units', 'Treat --amount as already-in-base-units')
        .option('--approval-id <id>', 'Required when multiple approvals support deposit')
    )
  )
)
  .action(
    async (
      collectionId: string,
      opts: NetworkFlags & OutputFlags & { creator: string; amount: string; baseUnits?: boolean; approvalId?: string }
    ) => {
      try {
        const creator = requireBb1AddressStrict(opts.creator, '--creator');
        const collection = await fetchCollection(collectionId, opts);
        validateOrExit(collection, 'vault deposit');
        const inspection = inspectVaultCollection(collection);
        const approval = selectVaultApproval(collection, 'deposit', opts.approvalId);
        if (!approval) {
          throw new Error(`Choose --approval-id explicitly. Available: ${inspection.actions.deposit.approvalIds.join(', ')}`);
        }
        const amount = resolveBackingAmount(opts.amount, !!opts.baseUnits, inspection.backingDenom);
        const msg = buildVaultDepositMsg({
          creator,
          collectionId: String(collectionId),
          amount,
          details: { backingAddress: inspection.backingAddress, backingDenom: inspection.backingDenom, depositApproval: approval }
        });
        await runEmitOrDeploy(msg, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
      } catch (err) {
        emitError(err);
      }
    }
  )
  .addHelpText(
    'after',
    `
Examples:
  $ bb vault deposit 88 --creator bb1user...xyz --amount 10 | bb deploy
  $ bb vault deposit 88 --creator bb1user...xyz --amount 10000000 --base-units | bb deploy
`
  );

// ── vault withdraw ───────────────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      vaultCommand
        .command('withdraw')
        .description(
          'Emit MsgTransferTokens to burn Vault tokens and withdraw the backing coin. ' +
            'Subject to configured daily limits and 2FA token requirements.'
        )
        .argument('<collection-id>', 'Vault collection ID')
        .requiredOption('--creator <address>', 'Caller address (bb1...) — burns Vault tokens and receives backing coin')
        .requiredOption('--amount <n>', 'Amount to withdraw in display units. Use --base-units to pass raw base units.')
        .option('--base-units', 'Treat --amount as already-in-base-units')
        .option('--approval-id <id>', 'Required when multiple withdrawal tiers exist')
    )
  )
)
  .action(
    async (
      collectionId: string,
      opts: NetworkFlags & OutputFlags & { creator: string; amount: string; baseUnits?: boolean; approvalId?: string }
    ) => {
      try {
        const creator = requireBb1AddressStrict(opts.creator, '--creator');
        const collection = await fetchCollection(collectionId, opts);
        validateOrExit(collection, 'vault withdraw');
        const inspection = inspectVaultCollection(collection);
        const approval = selectVaultApproval(collection, 'withdraw', opts.approvalId);
        if (!approval) {
          throw new Error(`Choose --approval-id explicitly. Available: ${inspection.actions.withdraw.approvalIds.join(', ')}`);
        }
        const amount = resolveBackingAmount(opts.amount, !!opts.baseUnits, inspection.backingDenom);
        const msg = buildVaultWithdrawMsg({
          creator,
          collectionId: String(collectionId),
          amount,
          details: { backingAddress: inspection.backingAddress, backingDenom: inspection.backingDenom, withdrawApproval: approval }
        });
        await runEmitOrDeploy(msg, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
      } catch (err) {
        emitError(err);
      }
    }
  )
  .addHelpText(
    'after',
    `
Examples:
  $ bb vault withdraw 88 --creator bb1user...xyz --amount 5 | bb deploy
`
  );

// ── vault emergency-migrate ──────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      vaultCommand
        .command('emergency-migrate')
        .description(
          'Emit MsgTransferTokens using the configured vault-emergency-migration approval to move Vault tokens to the recovery address.'
        )
        .argument('<collection-id>', 'Vault collection ID')
        .requiredOption('--creator <address>', 'Configured recovery address initiating the emergency migration (bb1...)')
        .requiredOption('--from <address>', 'Holder address whose Vault tokens are being migrated (bb1...)')
        .requiredOption('--amount <n>', 'Amount to migrate in display units. Use --base-units to pass raw base units.')
        .option('--base-units', 'Treat --amount as already-in-base-units')
    )
  )
)
  .action(
    async (
      collectionId: string,
      opts: NetworkFlags & OutputFlags & { creator: string; from: string; amount: string; baseUnits?: boolean }
    ) => {
      try {
        const creator = requireBb1AddressStrict(opts.creator, '--creator');
        const from = requireBb1AddressStrict(opts.from, '--from');
        const collection = await fetchCollection(collectionId, opts);
        validateOrExit(collection, 'vault emergency-migrate');
        const inspection = inspectVaultCollection(collection);
        if (!inspection.emergencyRecovery) {
          throw new Error('This vault does not configure an emergency migration recovery approval.');
        }
        const amount = resolveBackingAmount(opts.amount, !!opts.baseUnits, inspection.backingDenom);
        const msg = buildVaultEmergencyMigrateMsg({
          creator,
          from,
          collectionId: String(collectionId),
          amount,
          recovery: inspection.emergencyRecovery
        });
        await runEmitOrDeploy(msg, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
      } catch (err) {
        emitError(err);
      }
    }
  )
  .addHelpText(
    'after',
    `
Examples:
  $ bb vault emergency-migrate 88 --creator bb1recovery...xyz --from bb1holder...abc --amount 10 | bb deploy
`
  );
