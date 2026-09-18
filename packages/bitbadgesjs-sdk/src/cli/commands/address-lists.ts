import { Command } from 'commander';
import { addIndexerOptions, callIndexer, emitIndexerResult, emitIndexerError } from '../utils/indexer-options.js';
import { normalizeCollection } from '../utils/collection-options.js';
import { requireBb1AddressStrict } from '../utils/address.js';
import { BalanceArray } from '../../core/balances.js';
import { buildAddressListMembershipMsg } from '../../core/address-list-membership.js';
export const addressListsCommand = new Command('address-lists').description(
  'Manage canonical on-chain membership collections with fresh member balances.'
);
for (const action of ['add', 'remove'] as const) {
  addIndexerOptions(
    addressListsCommand
      .command(action)
      .argument('<collection-id>', 'Membership collection ID')
      .requiredOption('--creator <address>', 'Current Manager')
      .requiredOption('--address <address>', 'Member wallet')
      .description(
        action === 'add'
          ? 'Add a missing member; rejects duplicate membership. Emits an unsigned proposal.'
          : 'Remove all canonical membership units. Emits an unsigned proposal.'
      )
  ).action(async (id: string, opts: any) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const address = requireBb1AddressStrict(opts.address, '--address');
      const [raw, state] = await Promise.all([
        callIndexer('GET', `/collection/${encodeURIComponent(id)}`, opts),
        callIndexer('POST', `/collection/${encodeURIComponent(id)}/balance/${encodeURIComponent(address)}`, opts, {})
      ]);
      const balances = state?.balance?.balances ?? state?.balances;
      if (!Array.isArray(balances)) throw new Error('Membership balance is unavailable. Retry before preparing a change.');
      const message = buildAddressListMembershipMsg({
        collection: normalizeCollection(raw),
        creator,
        address,
        action,
        currentBalances: BalanceArray.From(balances).convert(BigInt)
      });
      emitIndexerResult({ typeUrl: '/tokenization.MsgTransferTokens', value: message.toProto().toJson() }, opts);
    } catch (error) {
      emitIndexerError(error);
    }
  });
}
