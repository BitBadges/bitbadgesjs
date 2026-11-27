/**
 * `bitbadges-cli issuer-controlled` — end-user surface for the Issuer-Controlled Tokens standard.
 *
 * Subcommands:
 *   show <id>      Inspect issuer authority, mutable permissions, approvals, and frozen state
 *   status <id>    Compact status summary
 *   mint <id>      Emit MsgTransferTokens for manager-initiated minting
 *   transfer <id>  Emit MsgTransferTokens for manager-controlled holder-to-holder transfers
 *   revoke <id>    Emit MsgTransferTokens to burn/revoke tokens from a holder
 *   freeze <id>    Emit MsgUniversalUpdateCollection to permanently freeze the collection
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
import { requireBb1AddressStrict, resolveRecipientList } from '../utils/address.js';
import { addDeployOptions, runEmitOrDeploy } from '../utils/deploy-options.js';
import { normalizeCollection, validateCollectionOrExit } from '../utils/collection-options.js';
import {
  inspectIssuerControlledCollection,
  validateIssuerControlledCollection,
  selectIssuerControlledApproval,
  buildIssuerControlledMintMsg,
  buildIssuerControlledTransferMsg,
  buildIssuerControlledRevokeMsg,
  buildIssuerControlledFreezeMsg
} from '../../core/issuer-controlled.js';

async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  return normalizeCollection(await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts));
}

function validateOrExit(collection: any, ctx: string): void {
  validateCollectionOrExit(collection, ctx, validateIssuerControlledCollection, 'Issuer-Controlled Tokens');
}

// ── issuer-controlled (parent) ───────────────────────────────────────────────

export const issuerControlledCommand = new Command('issuer-controlled').description(
  'End-user surface for the Issuer-Controlled Tokens standard — show / status / mint / transfer / revoke / freeze.'
);

// ── issuer-controlled show / status ──────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    issuerControlledCommand
      .command('show')
      .description('Render Issuer-Controlled collection details — manager, mutable permissions, approvals, override warnings.')
      .argument('<collection-id>', 'Issuer-Controlled collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    emit(
      { collectionId: String(collectionId), standards: collection.standards ?? [], ...inspectIssuerControlledCollection(collection) },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

addOutputFlags(
  addNetworkFlags(
    issuerControlledCommand
      .command('status')
      .description('Compact Issuer-Controlled status — manager, frozen state, available actions, mutable permissions.')
      .argument('<collection-id>', 'Issuer-Controlled collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    emit({ collectionId: String(collectionId), ...inspectIssuerControlledCollection(collection) }, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── issuer-controlled mint ───────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      issuerControlledCommand
        .command('mint')
        .description('Emit MsgTransferTokens for the manager to mint tokens to one or more recipients.')
        .argument('<collection-id>', 'Issuer-Controlled collection ID')
        .requiredOption('--creator <address>', 'Collection manager address (bb1...)')
        .requiredOption('--to <addresses>', 'Recipient bb1... address(es), comma-separated')
        .option('--token-id <n>', 'Token ID to mint (default 1)', '1')
        .option('--amount <n>', 'Base-unit integer amount per recipient (default 1)', '1')
        .option('--approval-id <id>', 'Explicit mint approval ID (required when multiple mint approvals exist)')
    )
  )
)
  .action(
    async (
      collectionId: string,
      opts: NetworkFlags &
        OutputFlags & { creator: string; to: string; tokenId?: string; amount?: string; approvalId?: string }
    ) => {
      try {
        const creator = requireBb1AddressStrict(opts.creator, '--creator');
        const recipients = resolveRecipientList(opts.to, '--to');
        const collection = await fetchCollection(collectionId, opts);
        validateOrExit(collection, 'issuer-controlled mint');
        const inspection = inspectIssuerControlledCollection(collection);
        const approval = selectIssuerControlledApproval(collection, 'mint', opts.approvalId);
        const msg = buildIssuerControlledMintMsg({
          creator,
          manager: inspection.manager,
          collectionId: String(collectionId),
          recipients,
          tokenId: opts.tokenId,
          amount: opts.amount,
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
  $ bb issuer-controlled mint 55 --creator bb1mgr...xyz --to bb1user...abc --token-id 1 --amount 10 | bb deploy
`
  );

// ── issuer-controlled transfer ───────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      issuerControlledCommand
        .command('transfer')
        .description('Emit MsgTransferTokens for the manager to move tokens from one holder to recipient(s).')
        .argument('<collection-id>', 'Issuer-Controlled collection ID')
        .requiredOption('--creator <address>', 'Collection manager address (bb1...)')
        .requiredOption('--from <address>', 'Source holder address (bb1...)')
        .requiredOption('--to <addresses>', 'Recipient bb1... address(es), comma-separated')
        .option('--token-id <n>', 'Token ID to transfer (default 1)', '1')
        .option('--amount <n>', 'Base-unit integer amount per recipient (default 1)', '1')
        .option('--approval-id <id>', 'Explicit transfer approval ID (required when multiple transfer approvals exist)')
    )
  )
)
  .action(
    async (
      collectionId: string,
      opts: NetworkFlags &
        OutputFlags & { creator: string; from: string; to: string; tokenId?: string; amount?: string; approvalId?: string }
    ) => {
      try {
        const creator = requireBb1AddressStrict(opts.creator, '--creator');
        const from = requireBb1AddressStrict(opts.from, '--from');
        const recipients = resolveRecipientList(opts.to, '--to');
        const collection = await fetchCollection(collectionId, opts);
        validateOrExit(collection, 'issuer-controlled transfer');
        const inspection = inspectIssuerControlledCollection(collection);
        const approval = selectIssuerControlledApproval(collection, 'transfer', opts.approvalId);
        const msg = buildIssuerControlledTransferMsg({
          creator,
          manager: inspection.manager,
          collectionId: String(collectionId),
          from,
          recipients,
          tokenId: opts.tokenId,
          amount: opts.amount,
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
  $ bb issuer-controlled transfer 55 --creator bb1mgr...xyz --from bb1alice... --to bb1bob... --token-id 1 --amount 5 | bb deploy
`
  );

// ── issuer-controlled revoke ─────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      issuerControlledCommand
        .command('revoke')
        .description('Emit MsgTransferTokens for the manager to revoke (burn) tokens from a holder.')
        .argument('<collection-id>', 'Issuer-Controlled collection ID')
        .requiredOption('--creator <address>', 'Collection manager address (bb1...)')
        .requiredOption('--from <address>', 'Holder address whose tokens will be burned (bb1...)')
        .option('--token-id <n>', 'Token ID to revoke (default 1)', '1')
        .option('--amount <n>', 'Base-unit integer amount to revoke (default 1)', '1')
        .option('--approval-id <id>', 'Explicit revoke approval ID (required when multiple revoke approvals exist)')
    )
  )
)
  .action(
    async (
      collectionId: string,
      opts: NetworkFlags &
        OutputFlags & { creator: string; from: string; tokenId?: string; amount?: string; approvalId?: string }
    ) => {
      try {
        const creator = requireBb1AddressStrict(opts.creator, '--creator');
        const from = requireBb1AddressStrict(opts.from, '--from');
        const collection = await fetchCollection(collectionId, opts);
        validateOrExit(collection, 'issuer-controlled revoke');
        const inspection = inspectIssuerControlledCollection(collection);
        const approval = selectIssuerControlledApproval(collection, 'revoke', opts.approvalId);
        const msg = buildIssuerControlledRevokeMsg({
          creator,
          manager: inspection.manager,
          collectionId: String(collectionId),
          from,
          tokenId: opts.tokenId,
          amount: opts.amount,
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
  $ bb issuer-controlled revoke 55 --creator bb1mgr...xyz --from bb1holder...abc --token-id 1 --amount 1 | bb deploy
`
  );

// ── issuer-controlled freeze ─────────────────────────────────────────────────

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      issuerControlledCommand
        .command('freeze')
        .description(
          'Emit MsgUniversalUpdateCollection to permanently freeze the collection (clears manager, removes approvals, locks permissions).'
        )
        .argument('<collection-id>', 'Issuer-Controlled collection ID')
        .requiredOption('--creator <address>', 'Current collection manager address (bb1...)')
    )
  )
)
  .action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'issuer-controlled freeze');
      const inspection = inspectIssuerControlledCollection(collection);
      if (inspection.isFrozen) {
        throw new Error('Collection is already frozen (no active manager or approvals).');
      }
      const msg = buildIssuerControlledFreezeMsg({
        creator,
        manager: inspection.manager,
        collectionId: String(collectionId)
      });
      await runEmitOrDeploy(msg, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
    } catch (err) {
      emitError(err);
    }
  })
  .addHelpText(
    'after',
    `
Examples:
  $ bb issuer-controlled freeze 55 --creator bb1mgr...xyz | bb deploy
`
  );
