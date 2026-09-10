import { Command } from 'commander';
import { addIndexerNetworkOptions, addIndexerOutputOptions, callIndexer, emitIndexerResult, emitIndexerError } from '../utils/indexer-options.js';
import { normalizeCollection } from '../utils/collection-options.js';
import { requireBb1AddressStrict } from '../utils/address.js';
import { buildAgentVaultTransaction, extractAgentVaultDetails, getAgentVaultStatus, type AgentVaultAction } from '../../core/agent-vaults.js';

export const agentVaultsCommand = new Command('agent-vaults').description(
  'Verified Agent Vault v1 budgets. Transactions are unsigned; amounts are integer base units.'
);
const options = (cmd: Command) => addIndexerOutputOptions(addIndexerNetworkOptions(cmd));
const fetchCollection = async (id: string, opts: any) => normalizeCollection(await callIndexer('GET', `/collection/${encodeURIComponent(id)}`, opts));

options(agentVaultsCommand.command('list').description('Browse verified Agent Vaults in the Smart Token category.')).action(async (opts) => {
  try {
    const result = await callIndexer('POST', '/browse', opts, { type: 'collections', category: 'smart-token' });
    const rows = result?.collections?.['smart-token'] ?? result?.collections ?? [];
    if (!Array.isArray(rows)) throw new Error('Unexpected browse response');
    emitIndexerResult(
      rows.flatMap((c: any) => {
        const policy = extractAgentVaultDetails(c);
        return policy ? [{ collectionId: String(c.collectionId), policy }] : [];
      }),
      opts
    );
  } catch (error) {
    emitIndexerError(error);
  }
});

for (const action of ['show', 'status']) {
  options(
    agentVaultsCommand
      .command(action)
      .argument('<collection-id>')
      .description(
        action === 'show'
          ? 'Show verified immutable policy and recovery authority.'
          : 'Show indexed summary; unavailable execution data remains unknown.'
      )
  ).action(async (id: string, opts: any) => {
    try {
      const collection = await fetchCollection(id, opts);
      const policy = extractAgentVaultDetails(collection);
      if (!policy) throw new Error('Collection is not a verified Agent Vault v1');
      emitIndexerResult(
        {
          collectionId: id,
          policy,
          ...(action === 'status'
            ? {
                ...getAgentVaultStatus(collection, { now: String(Date.now()) }),
                indexedSummary: collection.standardsInfo?.['Agent Vault'] ?? null
              }
            : {})
        },
        opts
      );
    } catch (error) {
      emitIndexerError(error);
    }
  });
}

const descriptions: Record<AgentVaultAction, string> = {
  deposit: 'Fund the designated agent with receipts; the creator pays the backing coin.',
  withdraw: 'Redeem agent receipts within the on-chain policy.',
  pay: 'Build one atomic withdrawal and bank payment. Sign using bb deploy --browser.',
  vote: 'Authorize ongoing operation, not one payment. Limits continue after activation.',
  recover: 'Recover funds to the configured recovery account, bypassing withdrawal gates. Atomic browser signing required.'
};
for (const action of Object.keys(descriptions) as AgentVaultAction[]) {
  const cmd = options(
    agentVaultsCommand
      .command(action)
      .description(descriptions[action])
      .argument('<collection-id>')
      .requiredOption('--creator <address>', 'Signing account')
  );
  if (action !== 'vote') cmd.requiredOption('--amount <integer>', 'Positive amount in backing coin base units');
  if (action === 'pay') cmd.requiredOption('--to <address>', 'Payment recipient');
  if (action === 'vote') cmd.option('--yes-weight <integer>', 'Percent of assigned voting weight, 0–100', '100');
  cmd.action(async (id: string, opts: any) => {
    try {
      const collection = await fetchCollection(id, opts);
      emitIndexerResult(
        buildAgentVaultTransaction({
          action,
          collection,
          creator: requireBb1AddressStrict(opts.creator, '--creator'),
          amount: opts.amount,
          to: opts.to ? requireBb1AddressStrict(opts.to, '--to') : undefined,
          yesWeight: opts.yesWeight
        }),
        opts
      );
    } catch (error) {
      emitIndexerError(error);
    }
  });
}
