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
  type IndexerOutputFlags as OutputFlags,
} from '../utils/indexer-options.js';
import { requireBb1AddressStrict } from '../utils/address.js';
import {
  doesCollectionFollowSmartTokenProtocol,
  validateSmartTokenCollection,
  extractSmartTokenDetails,
  buildSmartTokenDepositMsg,
  buildSmartTokenWithdrawMsg
} from '../../core/smart-tokens.js';
import { resolveCoin, toBaseUnits } from '../../core/builders/shared.js';
import { BitBadgesCollection } from '../../api-indexer/BitBadgesCollection.js';
import { BigIntify } from '../../common/string-numbers.js';
async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  const res = await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts);
  const raw = res?.collection ?? res;
  if (!raw) return raw;
  try { return new BitBadgesCollection(raw).convert(BigIntify); } catch { return raw; }
}

function validateOrExit(collection: any, ctx: string): void {
  if (!collection) {
    process.stderr.write(`Error: collection not found while running ${ctx}.\n`);
    process.exit(2);
  }
  const result = validateSmartTokenCollection(collection);
  if (!result.valid) {
    process.stderr.write(`Error: collection is not a valid Smart Token (failed in ${ctx}):\n`);
    for (const e of result.errors) process.stderr.write(`  - ${e}\n`);
    if (result.warnings.length > 0) {
      process.stderr.write('Warnings:\n');
      for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
    }
    process.exit(2);
  }
  if (result.warnings.length > 0 && process.env.BB_QUIET !== '1') {
    process.stderr.write(`Warnings for ${ctx}:\n`);
    for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
  }
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
      .description('Browse Smart Token collections (auto-filtered to those passing the conformance validator).')
  )
).action(async (opts: NetworkFlags & OutputFlags) => {
  try {
    const res = await callApi('POST', '/browse', opts, { type: 'collections', category: 'smart-token' });
    const all: any[] = res?.collections?.['smart-token'] ?? res?.collections ?? [];
    const collections = all.filter((c: any) => doesCollectionFollowSmartTokenProtocol(c));
    const summary = collections.map((c: any) => {
      const d = extractSmartTokenDetails(c)!;
      return {
        collectionId: String(c.collectionId ?? c._docId ?? ''),
        backingAddress: d.backingAddress,
        backingDenom: d.backingDenom,
        tradable: d.tradable,
        aiAgentVault: d.aiAgentVault
      };
    });
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
    validateOrExit(collection, 'smart-tokens show');
    const d = extractSmartTokenDetails(collection)!;
    emit(
      {
        collectionId: String(collectionId),
        backingAddress: d.backingAddress,
        backingDenom: d.backingDenom,
        depositApprovalId: d.depositApproval.approvalId,
        withdrawApprovalId: d.withdrawApproval.approvalId,
        tradable: d.tradable,
        aiAgentVault: d.aiAgentVault,
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
    smartTokensCommand
      .command('status')
      .description('Compact status — collection id, backing denom, tradable + aiAgentVault flags.')
      .argument('<collection-id>', 'Smart Token collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'smart-tokens status');
    const d = extractSmartTokenDetails(collection)!;
    emit(
      {
        collectionId: String(collectionId),
        backingDenom: d.backingDenom,
        tradable: d.tradable,
        aiAgentVault: d.aiAgentVault,
        status: 'active'
      },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

// ── smart-tokens deposit ─────────────────────────────────────────────────────

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
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; amount: string; baseUnits?: boolean }
  ) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'smart-tokens deposit');
      const details = extractSmartTokenDetails(collection)!;
      let amount: string;
      if (opts.baseUnits) {
        amount = String(opts.amount).replace(/[_,]/g, '');
        if (!/^\d+$/.test(amount)) {
          process.stderr.write(`Error: --amount must be a non-negative integer when --base-units is set, got "${opts.amount}"\n`);
          process.exit(2);
        }
      } else {
        const resolved = resolveCoin(details.backingDenom);
        amount = toBaseUnits(Number(opts.amount), resolved.decimals);
      }
      const msg = buildSmartTokenDepositMsg({
        creator,
        collectionId: String(collectionId),
        amount,
        details
      });
      emit(msg, opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── smart-tokens withdraw ────────────────────────────────────────────────────

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
      .requiredOption(
        '--amount <n>',
        'Amount to withdraw. Interpreted as display units. Use --base-units to pass raw base units.'
      )
      .option('--base-units', 'Treat --amount as already-in-base-units')
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; amount: string; baseUnits?: boolean }
  ) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'smart-tokens withdraw');
      const details = extractSmartTokenDetails(collection)!;
      let amount: string;
      if (opts.baseUnits) {
        amount = String(opts.amount).replace(/[_,]/g, '');
        if (!/^\d+$/.test(amount)) {
          process.stderr.write(`Error: --amount must be a non-negative integer when --base-units is set, got "${opts.amount}"\n`);
          process.exit(2);
        }
      } else {
        const resolved = resolveCoin(details.backingDenom);
        amount = toBaseUnits(Number(opts.amount), resolved.decimals);
      }
      const msg = buildSmartTokenWithdrawMsg({
        creator,
        collectionId: String(collectionId),
        amount,
        details
      });
      emit(msg, opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// Per-standard `build` subcommand removed in CLI v2 (#0399).
// Use `bb build smart-token ...` (the canonical builder) instead.
