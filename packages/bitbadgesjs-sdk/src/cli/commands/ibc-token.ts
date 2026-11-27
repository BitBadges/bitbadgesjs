/**
 * `bitbadges-cli ibc-token` — end-user surface for the IBC Token Factory standard.
 *
 * Subcommands:
 *   show <id>    Inspect wrapper paths, full Cosmos denoms, alias addresses, and wrap/unwrap approvals
 *   status <id>  Compact IBC Token Factory status summary
 *   wrap <id>    Emit MsgTransferTokens to wrap collection tokens into wrapped Cosmos coins
 *   unwrap <id>  Emit MsgTransferTokens to unwrap wrapped Cosmos coins back into collection tokens
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
  inspectIbcTokenCollection,
  validateIbcTokenCollection,
  selectIbcWrapperPath,
  selectIbcWrapperApproval,
  resolveIbcTokenAmount,
  buildIbcTokenWrapMsg,
  buildIbcTokenUnwrapMsg
} from '../../core/ibc-tokens.js';

async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  return normalizeCollection(await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts));
}

function validateOrExit(collection: any, ctx: string): void {
  validateCollectionOrExit(collection, ctx, validateIbcTokenCollection, 'IBC Token Factory');
}

// ── ibc-token (parent) ───────────────────────────────────────────────────────

export const ibcTokenCommand = new Command('ibc-token')
  .alias('ibc-tokens')
  .description(
    'End-user surface for the IBC Token Factory standard — show / status / wrap / unwrap. ' +
      'Inspects Cosmos Coin wrapper paths (`badges:<id>:<denom>`) and builds unsigned wrap/unwrap transfers.'
  );

// ── ibc-token show ───────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    ibcTokenCommand
      .command('show')
      .description('Render IBC Token Factory details — wrapper paths, full denoms, alias addresses, approvals, standards.')
      .argument('<collection-id>', 'IBC Token Factory collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    emit(
      { collectionId: String(collectionId), standards: collection.standards ?? [], ...inspectIbcTokenCollection(collection) },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

// ── ibc-token status ─────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    ibcTokenCommand
      .command('status')
      .description('Compact IBC Token Factory status — wrapper denoms, alias addresses, wrap/unwrap actions, warnings.')
      .argument('<collection-id>', 'IBC Token Factory collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    const inspection = inspectIbcTokenCollection(collection);
    emit(
      {
        collectionId: String(collectionId),
        recognized: inspection.recognized,
        configurationSupported: inspection.configurationSupported,
        wrapperPathCount: inspection.wrapperPaths.length,
        wrapperDenoms: inspection.wrapperPaths.map((p) => p.denom),
        fullDenoms: inspection.wrapperPaths.map((p) => p.fullDenom),
        aliasDenoms: inspection.aliasPaths.map((p) => p.denom),
        backingDenom: inspection.backingDenom,
        actions: inspection.actions,
        issues: inspection.issues,
        warnings: inspection.warnings,
        eligibility: inspection.eligibility,
        authority: inspection.authority
      },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

// ── ibc-token wrap ───────────────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      ibcTokenCommand
        .command('wrap')
        .description(
          'Emit MsgTransferTokens to wrap collection tokens into the Cosmos/IBC wrapper coin (transfers tokens to the wrapper path alias).'
        )
        .argument('<collection-id>', 'IBC Token Factory collection ID')
        .requiredOption('--creator <address>', 'Holder address wrapping collection tokens (bb1...)')
        .requiredOption('--amount <n>', 'Amount to wrap in display units (using wrapper path default decimals). Use --base-units for raw base units.')
        .option('--denom <denom>', 'Wrapper path denom, full denom, or symbol (required when multiple wrapper paths exist)')
        .option('--token-id <n>', 'Token ID to wrap (defaults to wrapper path token ID)')
        .option('--base-units', 'Treat --amount as already-in-base-units')
        .option('--approval-id <id>', 'Explicit wrap approval ID (required when multiple wrap approvals exist)')
    )
  )
)
  .action(
    async (
      collectionId: string,
      opts: NetworkFlags &
        OutputFlags & { creator: string; amount: string; denom?: string; tokenId?: string; baseUnits?: boolean; approvalId?: string }
    ) => {
      try {
        const creator = requireBb1AddressStrict(opts.creator, '--creator');
        const collection = await fetchCollection(collectionId, opts);
        validateOrExit(collection, 'ibc-token wrap');
        const path = selectIbcWrapperPath(collection, opts.denom);
        const approval = selectIbcWrapperApproval(collection, 'wrap', opts.approvalId);
        const amount = resolveIbcTokenAmount(opts.amount, !!opts.baseUnits, path.defaultDecimals);
        const msg = buildIbcTokenWrapMsg({
          creator,
          collectionId: String(collectionId),
          amount,
          path,
          tokenId: opts.tokenId,
          approval
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
  $ bb ibc-token wrap 42 --creator bb1user...xyz --amount 10 | bb deploy
  $ bb ibc-token wrap 42 --creator bb1user...xyz --amount 1000000 --base-units --denom umytoken | bb deploy
`
  );

// ── ibc-token unwrap ─────────────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      ibcTokenCommand
        .command('unwrap')
        .description(
          'Emit MsgTransferTokens to unwrap wrapped Cosmos/IBC coins back into collection tokens (transfers from the wrapper path alias).'
        )
        .argument('<collection-id>', 'IBC Token Factory collection ID')
        .requiredOption('--creator <address>', 'Holder address unwrapping Cosmos coins back into collection tokens (bb1...)')
        .requiredOption('--amount <n>', 'Amount to unwrap in display units (using wrapper path default decimals). Use --base-units for raw base units.')
        .option('--denom <denom>', 'Wrapper path denom, full denom, or symbol (required when multiple wrapper paths exist)')
        .option('--token-id <n>', 'Token ID to unwrap (defaults to wrapper path token ID)')
        .option('--base-units', 'Treat --amount as already-in-base-units')
        .option('--approval-id <id>', 'Explicit unwrap approval ID (required when multiple unwrap approvals exist)')
    )
  )
)
  .action(
    async (
      collectionId: string,
      opts: NetworkFlags &
        OutputFlags & { creator: string; amount: string; denom?: string; tokenId?: string; baseUnits?: boolean; approvalId?: string }
    ) => {
      try {
        const creator = requireBb1AddressStrict(opts.creator, '--creator');
        const collection = await fetchCollection(collectionId, opts);
        validateOrExit(collection, 'ibc-token unwrap');
        const path = selectIbcWrapperPath(collection, opts.denom);
        const approval = selectIbcWrapperApproval(collection, 'unwrap', opts.approvalId);
        const amount = resolveIbcTokenAmount(opts.amount, !!opts.baseUnits, path.defaultDecimals);
        const msg = buildIbcTokenUnwrapMsg({
          creator,
          collectionId: String(collectionId),
          amount,
          path,
          tokenId: opts.tokenId,
          approval
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
  $ bb ibc-token unwrap 42 --creator bb1user...xyz --amount 5 | bb deploy
`
  );
