/**
 * `bitbadges-cli credit-tokens` — end-user surface for the Credit Token
 * standard. Mirrors the FE's `CreditTokenLayout`.
 *
 *   credit-tokens list <collection>          List all credit-* tiers
 *   credit-tokens show <collection>          Render details + status
 *   credit-tokens purchase <collection>      Buy N units via the scaled tier
 *
 * Creator-side construction lives at `bb build credit-token` — the
 * per-standard `build` subcommand was removed in CLI v2 (#0399).
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
import { resolveNetwork } from '../utils/io.js';
import { addDeployOptions, runEmitOrDeploy, type DeployOpts } from '../utils/deploy-options.js';
import { normalizeCollection } from '../utils/collection-options.js';
import {
  doesCollectionFollowCreditTokenProtocol,
  extractCreditTokenTiers,
  buildPurchaseCreditTokenMsg,
  quoteCreditTokenPurchase,
  type CreditTokenTier,
  bitbadgesApiCreditsCollectionId
} from '../../core/credit-tokens.js';
import { inspectStandardCollection } from '../../core/standard-inspection.js';
import { MAINNET_COINS_REGISTRY, TESTNET_COINS_REGISTRY } from '../../common/constants.js';

function requireSupportedPurchase(collection: any): void {
  const inspection = inspectStandardCollection(collection, 'credit-token');
  if (!inspection.configurationSupported) throw new Error(`Unsupported credit purchase configuration: ${inspection.issues.join('; ')}`);
}

function selectPurchaseTier(tiers: CreditTokenTier[], approvalId?: string): CreditTokenTier {
  const tier = approvalId ? tiers.find((item) => item.approvalId === approvalId) : tiers.length === 1 ? tiers[0] : undefined;
  if (!tier) throw new Error(`Choose --tier explicitly. Available tiers: ${tiers.map((item) => item.approvalId).join(', ') || 'none'}.`);
  return tier;
}

function parsePurchaseUnits(input: string): bigint {
  if (!/^\d+$/.test(input.trim()) || BigInt(input) <= 0n) throw new Error('--units must be a positive integer multiplier.');
  return BigInt(input);
}

async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  return normalizeCollection(await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts));
}

function validateOrExit(collection: any, ctx: string): void {
  if (!collection) {
    process.stderr.write(`Error: collection not found while running ${ctx}.\n`);
    process.exit(2);
  }
  if (!doesCollectionFollowCreditTokenProtocol(collection)) {
    process.stderr.write(
      `Error: collection is not a valid Credit Token collection (failed in ${ctx}). Pass a collection whose standards include "Credit Token" or has credit-* approvals.\n`
    );
    process.exit(2);
  }
}

// ── credit-tokens (parent) ────────────────────────────────────────────────

export const creditTokensCommand = new Command('credit-tokens').description(
  'End-user surface for the Credit Token standard — list tiers / show / purchase. Build new via `bb build credit-token`.'
);

addOutputFlags(
  addNetworkFlags(
    creditTokensCommand
      .command('list')
      .description('List all credit-* mint tiers in a collection.')
      .argument('<collection-id>', 'Credit Token collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'credit-tokens list');
    const tiers = inspectStandardCollection(collection, 'credit-token').configurationSupported ? extractCreditTokenTiers(collection.collectionApprovals) : [];
    emit({ collectionId: String(collectionId), tiers, inspection: inspectStandardCollection(collection, 'credit-token') }, opts);
  } catch (err) {
    emitError(err);
  }
});

addOutputFlags(
  addNetworkFlags(
    creditTokensCommand
      .command('show')
      .description('Render Credit Token collection details (symbol, decimals, alias path, tiers).')
      .argument('<collection-id>', 'Credit Token collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'credit-tokens show');
    const tiers = inspectStandardCollection(collection, 'credit-token').configurationSupported ? extractCreditTokenTiers(collection.collectionApprovals) : [];
    // `aliasPath.{symbol,decimals}` are the FE-build-time metadata; the
    // indexer's collection doc exposes paths via `aliasPaths[].denom`
    // only (chain proto doesn't carry symbol/decimals through). Use the
    // denom for display; let the caller resolve symbol+decimals via
    // `bb lookup <denom>` if needed.
    const aliases = collection.aliasPaths ?? collection.aliasPathsToAdd ?? [];
    const aliasPath = aliases.length === 1 ? aliases[0] : undefined;
    emit(
      {
        collectionId: String(collectionId),
        standards: collection.standards ?? [],
        inspection: inspectStandardCollection(collection, 'credit-token'),
        denom: aliasPath?.denom ?? null,
        tiers
      },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

addOutputFlags(addNetworkFlags(creditTokensCommand.command('quote')
  .description('Quote exact payment and minted units. Does not reserve inventory, check eligibility, or submit a transaction.')
  .argument('<collection-id>', 'Credit Token collection ID')
  .requiredOption('--units <n>', 'Integer purchase multiplier; legacy tiers require 1 pack')
  .option('--tier <approvalId>', 'Required when more than one purchase tier exists')
)).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { units: string; tier?: string }) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'credit-tokens quote');
    requireSupportedPurchase(collection);
    const tier = selectPurchaseTier(extractCreditTokenTiers(collection.collectionApprovals), opts.tier);
    const registry = resolveNetwork(opts as any) === 'mainnet' ? MAINNET_COINS_REGISTRY : TESTNET_COINS_REGISTRY;
    const paymentCoin = Object.values(registry).find((coin) => coin.baseDenom === tier.paymentDenom);
    const aliases = collection.aliasPaths ?? collection.aliasPathsToAdd ?? [];
    const alias = aliases.length === 1 ? aliases[0] : undefined;
    const quote = quoteCreditTokenPurchase(tier, parsePurchaseUnits(opts.units), {
      paymentDecimals: paymentCoin ? Number(paymentCoin.decimals) : undefined,
      creditDecimals: alias?.decimals === undefined ? undefined : Number(alias.decimals)
    });
    emit({ collectionId, observedAt: new Date(Date.now()).toISOString(), ...quote }, opts);
  } catch (err) {
    emitError(err);
  }
});

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      creditTokensCommand
        .command('purchase')
        .description(
          'Buy N units from ANY Credit Token collection by paying the payment denom. The standard is ' +
          'generic — anyone can deploy one; pass its <collection-id>. As a convenience, --api-credits ' +
          "targets BitBadges' OWN API-credits collection (one real example). Emits MsgTransferTokens to " +
          'pipe to `bb deploy`, or broadcast inline with --browser. Credits are NON-TRANSFERABLE: sign ' +
          'with the wallet that should hold them (--browser pins the signer to --creator). --burner is ' +
          'CREATE-ONLY so it is rejected here anyway.'
        )
        .argument('[collection-id]', 'Credit Token collection ID. Omit and pass --api-credits to use BitBadges’ own API-credits collection.')
        .requiredOption('--creator <address>', 'Buyer address — the wallet that will HOLD the (non-transferable) credits (bb1.../0x)')
        .requiredOption('--units <n>', 'Integer purchase multiplier, not display credits; quote first. Legacy tiers require 1 pack.')
        .option(
          '--tier <approvalId>',
          'Tier approval id; required when more than one purchase tier exists'
        )
        .option('--api-credits', "Shortcut for BitBadges’ OWN API-credits collection on this network (mainnet/local; not on testnet). Mutually exclusive with <collection-id>. Any Credit Token collection works via the positional arg — this is just BitBadges’ real instance.")
    )
  )
).action(
  async (
    collectionIdArg: string | undefined,
    opts: NetworkFlags & OutputFlags & DeployOpts & {
      creator: string; units: string; tier?: string; apiCredits?: boolean;
    }
  ) => {
    try {
      // Resolve which collection: the generic positional, or the
      // --api-credits shortcut for BitBadges' own instance. Exactly one.
      if (opts.apiCredits && collectionIdArg) {
        process.stderr.write('Error: pass either <collection-id> or --api-credits, not both.\n');
        process.exit(2);
      }
      if (!opts.apiCredits && !collectionIdArg) {
        process.stderr.write(
          'Error: pass a <collection-id> (any Credit Token collection), or --api-credits for BitBadges’ own API-credits collection.\n'
        );
        process.exit(2);
      }
      const collectionId = opts.apiCredits
        ? bitbadgesApiCreditsCollectionId(resolveNetwork(opts as any))
        : (collectionIdArg as string);
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'credit-tokens purchase');
      requireSupportedPurchase(collection);
      const tiers = inspectStandardCollection(collection, 'credit-token').configurationSupported ? extractCreditTokenTiers(collection.collectionApprovals) : [];
      if (tiers.length === 0) {
        process.stderr.write('Error: collection has no credit-* approvals.\n');
        process.exit(2);
      }
      const tier = selectPurchaseTier(tiers, opts.tier);
      if (!tier) {
        process.stderr.write(
          `Error: no matching tier. Available: ${tiers.map((t) => t.approvalId).join(', ')}.\n`
        );
        process.exit(2);
      }
      // Reject non-integer --units up-front; raw `BigInt(...)` throws
      // "Cannot convert <val> to a BigInt" which is too low-level for end users.
      if (!/^-?\d+$/.test(opts.units.trim())) {
        process.stderr.write(`Error: --units must be a positive integer, got "${opts.units}".\n`);
        process.exit(2);
      }
      const units = BigInt(opts.units);
      // Legacy (per-tier, non-scaled) approvals can't carry a multiplier
      // — buildPurchaseCreditTokenMsg emits exactly one unit and the CLI
      // emits one msg per invocation. Silently honoring `--units 5` here
      // would emit a single purchase while the user thinks they bought 5.
      // Reject instead and point at a scaled tier.
      if (!tier.isScaled && units > 1n) {
        const scaled = tiers.find((t) => t.isScaled);
        process.stderr.write(
          `Error: tier "${tier.approvalId}" is a legacy per-tier approval and can't buy ${units} units in one msg. ` +
          (scaled
            ? `Use --tier ${scaled.approvalId} (scaled) for multi-unit purchases, or run --units 1 ${units} times.\n`
            : `This collection has no scaled tier; run the command with --units 1, ${units} times.\n`)
        );
        process.exit(2);
      }
      const purchaseMsg = buildPurchaseCreditTokenMsg(creator, String(collectionId), tier, units);

      // No deploy flag → emit JSON (pipe to `bb deploy`). --browser →
      // broadcast inline; expectedAddress pinned to --creator because
      // credits are non-transferable (they land in whatever wallet
      // signs). --burner is CREATE-ONLY so the shared executor rejects
      // it for this MsgTransferTokens — which is also what we want
      // (a burner would strand the credits).
      await runEmitOrDeploy(purchaseMsg, opts, {
        emit: (m) => emit(m, opts),
        expectedAddress: creator
      });
    } catch (err) {
      emitError(err);
    }
  }
).addHelpText('after', `
Examples:
  # Any Credit Token collection (the standard is generic — anyone can deploy one):
  $ bb credit-tokens purchase 42 --creator bb1buyer...xyz --units 10 | bb deploy
  $ bb credit-tokens purchase 42 --creator bb1buyer...xyz --units 10 --tier credit-scaled | bb deploy
  # BitBadges' own API-credits collection (one real example), id resolved per network:
  $ bb credit-tokens purchase --api-credits --creator bb1buyer...xyz --units 10 --browser

Credits are NON-TRANSFERABLE: whatever wallet signs is where they live.
With --browser the signer is pinned to --creator. --burner is
CREATE-ONLY so it's rejected here (and would strand the credits anyway).
The --api-credits shortcut is just a convenience for BitBadges' own API
— it is NOT the only credit token; the standard is generic.
`);

// Per-standard `build` subcommand removed in CLI v2 (#0399).
// Use `bb build credit-token ...` (the canonical builder) instead.
