/**
 * `bitbadges-cli smart-tokens` — end-user surface for the Smart Token standard.
 *
 * Subcommands:
 *   list                    Browse Smart Token collections
 *   show <id>               Render one — backing address, denom, deposit/withdraw approval ids, status
 *   status <id>             Compact status summary
 *   deposit <id>            Emit MsgTransferTokens to mint Smart Token units (lock backing coin)
 *   withdraw <id>           Emit MsgTransferTokens to burn Smart Token units (release backing coin)
 *   build                   Alias for `bb build smart-token`
 *
 * Vaults are NOT a separate standard — they're Smart Tokens with the
 * cosmosCoinBackedPath invariant. This CLI covers vault flows transparently.
 *
 * Lifted from the FE's `SmartAccountLayout` + `BackedPathsDisplay`
 * (legacy folder name; the on-chain standard tag is "Smart Token").
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
  inspectSmartTokenCollection,
  selectSmartTokenApproval,
  validateSmartTokenCollection,
  buildSmartTokenDepositMsg,
  buildSmartTokenWithdrawMsg
} from '../../core/smart-tokens.js';
import { resolveCoin } from '../../core/builders/shared.js';
async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  return normalizeCollection(await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts));
}

function validateOrExit(collection: any, ctx: string): void {
  validateCollectionOrExit(collection, ctx, validateSmartTokenCollection, 'Smart Token');
}

/**
 * Resolve the smart-token `--amount` into base units of the backing
 * coin. Was duplicated byte-identically in `deposit` and `withdraw`.
 *
 * Intentionally NOT utils/amount.ts `resolveAmount` (0410): the denom
 * is collection-derived (`details.backingDenom`, always canonical) and
 * the amount is ALWAYS display-units of the backing coin —
 * resolveAmount's auto-rule treats a canonical denom as a base-units
 * passthrough, which would change behavior. `--base-units` overrides
 * to a raw integer passthrough.
 */
function resolveBackingAmount(rawAmount: string, baseUnits: boolean, backingDenom: string): string {
  if (!/^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(rawAmount)) throw new Error('--amount must be a positive decimal string');
  const decimals = baseUnits ? 0 : resolveCoin(backingDenom).decimals;
  const [whole, fraction = ''] = rawAmount.split('.');
  if (fraction.length > decimals) throw new Error('--amount has more decimal places than the backing coin supports');
  const amount = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
  if (amount <= 0n) throw new Error('--amount must be positive');
  return amount.toString();
}

// ── smart-tokens (parent) ────────────────────────────────────────────────────

export const smartTokensCommand = new Command('smart-tokens').description(
  'End-user surface for the Smart Token standard — list / show / status / deposit / withdraw. ' +
    'Build new via `bb build smart-token`. Smart Tokens are the unified primitive behind vaults, AI agent vaults, and tradable wrapped tokens.'
);

// ── smart-tokens list ────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    smartTokensCommand
      .command('list')
      .description('Browse recognized Smart Token collections, including unsupported configurations with explanations.')
  )
).action(async (opts: NetworkFlags & OutputFlags) => {
  try {
    const res = await callApi('POST', '/browse', opts, { type: 'collections', category: 'smart-token' });
    const all: any[] = res?.collections?.['smart-token'] ?? res?.collections ?? [];
    const summary = all
      .filter((c) => c.standards?.includes('Smart Token'))
      .map((c) => ({
        collectionId: String(c.collectionId ?? c._docId ?? ''),
        ...inspectSmartTokenCollection(c)
      }));
    emit(summary, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── smart-tokens show / status ───────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    smartTokensCommand
      .command('show')
      .description('Render a Smart Token — backing address, denom, deposit/withdraw approval ids, standards.')
      .argument('<collection-id>', 'Smart Token collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    emit({ collectionId: String(collectionId), standards: collection.standards, ...inspectSmartTokenCollection(collection) }, opts);
  } catch (err) {
    emitError(err);
  }
});

addOutputFlags(
  addNetworkFlags(
    smartTokensCommand
      .command('status')
      .description('Compact status — collection id, backing denom, tradable + aiAgentVault flags.')
      .argument('<collection-id>', 'Smart Token collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    emit({ collectionId: String(collectionId), ...inspectSmartTokenCollection(collection) }, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── smart-tokens deposit ─────────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      smartTokensCommand
        .command('deposit')
        .description(
          'Emit MsgTransferTokens to mint Smart Token units in exchange for the backing coin. ' +
            'The caller must hold the backing coin; the chain auto-routes it into the backing alias as the deposit approval fires.'
        )
        .argument('<collection-id>', 'Smart Token collection ID')
        .requiredOption('--creator <address>', 'Caller address (bb1.../0x... auto-normalized) — receives the minted Smart Token units')
        .requiredOption(
          '--amount <n>',
          'Amount to deposit. Interpreted as display units (e.g. 10 USDC → 10 Smart Token units backed by 10 USDC). Use --base-units to pass raw base units.'
        )
        .option('--base-units', 'Treat --amount as already-in-base-units')
        .option('--approval-id <id>', 'Required when multiple approvals support this action')
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
        validateOrExit(collection, 'smart-tokens deposit');
        const inspection = inspectSmartTokenCollection(collection);
        const approval = selectSmartTokenApproval(collection, 'deposit', opts.approvalId);
        if (!approval) throw new Error(`Choose --approval-id explicitly. Available: ${inspection.actions.deposit.approvalIds.join(', ')}`);
        const details = { backingAddress: inspection.backingAddress, backingDenom: inspection.backingDenom, depositApproval: approval };
        const amount = resolveBackingAmount(opts.amount, !!opts.baseUnits, details.backingDenom);
        const msg = buildSmartTokenDepositMsg({
          creator,
          collectionId: String(collectionId),
          amount,
          details
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
  $ bb smart-tokens deposit 88 --creator bb1user...xyz --amount 10 | bb deploy
  $ bb smart-tokens deposit 88 --creator bb1user...xyz --amount 10000000 --base-units | bb deploy
`
  );

// ── smart-tokens withdraw ────────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      smartTokensCommand
        .command('withdraw')
        .description(
          'Emit MsgTransferTokens to burn Smart Token units and release the backing coin. ' +
            'The caller must hold the Smart Token units; the chain auto-routes the backing coin out of the backing alias to the caller.'
        )
        .argument('<collection-id>', 'Smart Token collection ID')
        .requiredOption('--creator <address>', 'Caller address (bb1.../0x... auto-normalized) — burns Smart Token units, receives backing coin')
        .requiredOption('--amount <n>', 'Amount to withdraw. Interpreted as display units. Use --base-units to pass raw base units.')
        .option('--base-units', 'Treat --amount as already-in-base-units')
        .option('--approval-id <id>', 'Required when multiple approvals support this action')
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
        validateOrExit(collection, 'smart-tokens withdraw');
        const inspection = inspectSmartTokenCollection(collection);
        const approval = selectSmartTokenApproval(collection, 'withdraw', opts.approvalId);
        if (!approval) throw new Error(`Choose --approval-id explicitly. Available: ${inspection.actions.withdraw.approvalIds.join(', ')}`);
        const details = { backingAddress: inspection.backingAddress, backingDenom: inspection.backingDenom, withdrawApproval: approval };
        const amount = resolveBackingAmount(opts.amount, !!opts.baseUnits, details.backingDenom);
        const msg = buildSmartTokenWithdrawMsg({
          creator,
          collectionId: String(collectionId),
          amount,
          details
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
  $ bb smart-tokens withdraw 88 --creator bb1user...xyz --amount 5 | bb deploy
`
  );

// Per-standard `build` subcommand removed in CLI v2 (#0399).
// Use `bb build smart-token ...` (the canonical builder) instead.
