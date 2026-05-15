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
import {
  doesCollectionFollowCreditTokenProtocol,
  extractCreditTokenTiers,
  buildPurchaseCreditTokenMsg
} from '../../core/credit-tokens.js';

async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  const res = await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts);
  return res?.collection ?? res;
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
    const tiers = extractCreditTokenTiers(collection.collectionApprovals);
    emit({ collectionId: String(collectionId), tiers }, opts);
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
    const tiers = extractCreditTokenTiers(collection.collectionApprovals);
    // `aliasPath.{symbol,decimals}` are the FE-build-time metadata; the
    // indexer's collection doc exposes paths via `aliasPaths[].denom`
    // only (chain proto doesn't carry symbol/decimals through). Use the
    // denom for display; let the caller resolve symbol+decimals via
    // `bb lookup <denom>` if needed.
    const aliasPath = (collection.aliasPaths ?? collection.aliasPathsToAdd ?? [])[0];
    emit(
      {
        collectionId: String(collectionId),
        standards: collection.standards ?? [],
        denom: aliasPath?.denom ?? null,
        tiers
      },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

addOutputFlags(
  addNetworkFlags(
    creditTokensCommand
      .command('purchase')
      .description(
        'Buy N units of credit tokens (e.g. API key / AI builder credits) by paying the payment denom. ' +
        'Emits MsgTransferTokens to pipe to `bb deploy`, OR use --deploy-with-browser for a one-shot. ' +
        'Credits are NON-TRANSFERABLE: sign with the wallet that should hold the credits — there is no ' +
        'burner path (a throwaway signer would strand the credits permanently).'
      )
      .argument('<collection-id>', 'Credit Token collection ID')
      .requiredOption('--creator <address>', 'Buyer address — the wallet that will HOLD the (non-transferable) credits (bb1.../0x)')
      .requiredOption('--units <n>', 'Number of units to purchase (integer)')
      .option(
        '--tier <approvalId>',
        'Tier approval id (default: the credit-scaled tier; required if only legacy per-tier approvals exist)'
      )
      .option('--deploy-with-browser', 'After building, hand off to the BitBadges /sign page for wallet signature + broadcast. Sign with the --creator wallet (credits are non-transferable).')
      .option('--sign-only', 'With --deploy-with-browser: have the wallet sign but not broadcast — returns the signed tx bytes.')
      .option('--frontend-url <url>', 'With --deploy-with-browser: override the frontend base URL.')
      .option('--no-open', 'With --deploy-with-browser: print the sign URL instead of auto-launching the browser.')
      .option('--timeout <seconds>', 'With --deploy-with-browser: how long to wait for the wallet to confirm (default 300, max 1800).')
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & {
      creator: string; units: string; tier?: string;
      deployWithBrowser?: boolean; signOnly?: boolean; frontendUrl?: string; open?: boolean; timeout?: string;
    }
  ) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'credit-tokens purchase');
      const tiers = extractCreditTokenTiers(collection.collectionApprovals);
      if (tiers.length === 0) {
        process.stderr.write('Error: collection has no credit-* approvals.\n');
        process.exit(2);
      }
      let tier = opts.tier ? tiers.find((t) => t.approvalId === opts.tier) : tiers.find((t) => t.isScaled) ?? tiers[0];
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

      // One-shot browser-sign path. Credits are non-transferable, so the
      // signer MUST be the wallet that should hold them — we pin
      // expectedAddress to --creator and deliberately offer NO burner
      // path (a throwaway signer would mint credits it can never move
      // out, permanently stranding the payment). Mirrors the
      // build.ts --deploy-with-browser bridge flow.
      if (opts.deployWithBrowser) {
        const { getApiUrl, getApiKeyForNetwork, resolveNetwork } = await import('../utils/io.js');
        const { bridgeSign, resolveFrontendUrl } = await import('../auth/browser-bridge.js');
        const networkName = resolveNetwork(opts as any);
        const frontendUrl = resolveFrontendUrl(networkName, opts.frontendUrl);
        const timeoutSec = opts.timeout ? Math.min(1800, Math.max(60, Number(opts.timeout))) : 300;
        process.stderr.write(
          `\nOpening ${frontendUrl}/sign — sign with ${creator} (credits are non-transferable; ` +
          `they land in whatever wallet signs)...\n`
        );
        try {
          const result = await bridgeSign({
            mode: 'tx',
            payload: {
              chain: 'cosmos',
              txsInfo: [{ type: purchaseMsg.typeUrl, msg: purchaseMsg.value }],
              expectedAddress: creator,
              signOnly: !!opts.signOnly,
            },
            baseUrl: getApiUrl(opts as any),
            frontendUrl,
            apiKey: getApiKeyForNetwork(opts as any),
            timeoutMs: timeoutSec * 1000,
            noOpen: opts.open === false,
          });
          if (result.error) {
            process.stderr.write(`Browser broadcast cancelled or rejected: ${result.error}\n`);
            process.exit(1);
          }
          const payload: any = opts.signOnly
            ? { success: !!result.signedTx, path: 'browser', mode: 'sign-only', signedTx: result.signedTx ?? null, chain: result.chain ?? 'cosmos' }
            : { success: !!result.hash, path: 'browser', mode: 'sign-and-broadcast', txHash: result.hash ?? null, chain: result.chain ?? 'cosmos' };
          process.stdout.write('\n' + JSON.stringify(payload, null, 2) + '\n');
          if (!payload.success) process.exit(1);
          return;
        } catch (err: any) {
          process.stderr.write(`Browser broadcast failed: ${err?.message || err}\n`);
          process.exit(1);
        }
      }

      emit(purchaseMsg, opts);
    } catch (err) {
      emitError(err);
    }
  }
).addHelpText('after', `
Examples:
  $ bb credit-tokens purchase 23 --creator bb1buyer...xyz --units 10 | bb deploy
  $ bb credit-tokens purchase 23 --creator bb1buyer...xyz --units 10 --tier premium-tier | bb deploy
  $ bb credit-tokens purchase 23 --creator bb1buyer...xyz --units 10 --deploy-with-browser

Credits (API key / AI builder credits) are NON-TRANSFERABLE: whatever
wallet signs is where they live. With --deploy-with-browser, sign with
the --creator wallet. There is intentionally no burner deploy path.
`);

// Per-standard `build` subcommand removed in CLI v2 (#0399).
// Use `bb build credit-token ...` (the canonical builder) instead.
