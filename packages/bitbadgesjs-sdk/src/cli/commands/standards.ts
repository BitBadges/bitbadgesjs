import { Command, Option } from 'commander';
import {
  addIndexerNetworkOptions,
  addIndexerOutputOptions,
  callIndexer,
  emitIndexerResult,
  emitIndexerError,
  type IndexerNetworkFlags,
  type IndexerOutputFlags
} from '../utils/indexer-options.js';
import { normalizeCollection } from '../utils/collection-options.js';
import { inspectStandardCollection, type InspectableStandard } from '../../core/standard-inspection.js';

export const standardsCommand = new Command('standards').description(
  'Inspect supported standard profiles without treating discovery tags as execution guarantees.'
);
addIndexerOutputOptions(
  addIndexerNetworkOptions(
    standardsCommand
      .command('inspect')
      .argument('<collection-id>', 'Collection to inspect')
      .addOption(
        new Option('--family <family>', 'Bounded consumer profile to inspect')
          .choices(['smart-token', 'credit-token', 'address-list', 'spendable-credit'])
          .makeOptionMandatory()
      )
      .description(
        'Report recognition, supported actions, explicit selection requirements and unsupported configuration. Does not check balances, permissions or live eligibility.'
      )
  )
).action(async (collectionId: string, opts: IndexerNetworkFlags & IndexerOutputFlags & { family: InspectableStandard }) => {
  try {
    const collection = normalizeCollection(await callIndexer('GET', `/collection/${encodeURIComponent(collectionId)}`, opts));
    emitIndexerResult({ collectionId, family: opts.family, ...inspectStandardCollection(collection, opts.family) }, opts);
  } catch (error) {
    emitIndexerError(error);
  }
});
