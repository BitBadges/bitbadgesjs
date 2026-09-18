import { Command } from 'commander';
import { addIndexerNetworkOptions, addIndexerOutputOptions, callIndexer, emitIndexerResult, emitIndexerError } from '../utils/indexer-options.js';
import { normalizeCollection } from '../utils/collection-options.js';
import { addDeployOptions, runEmitOrDeploy } from '../utils/deploy-options.js';
import { requireBb1AddressStrict } from '../utils/address.js';
import {
  inspectSpendableCredit,
  quoteSpendableCreditPurchase,
  buildPurchaseSpendableCreditsMsg,
  buildConsumeSpendableCreditsMsg
} from '../../core/spendable-credits.js';

export const spendableCreditsCommand = new Command('spendable-credits').description(
  'Inspect, purchase, or consume whole service credits. Consumption is irreversible; delivery requires provider receipt acceptance.'
);
const common = (command: Command) => addIndexerOutputOptions(addIndexerNetworkOptions(command));
const load = async (id: string, opts: any) => normalizeCollection(await callIndexer('GET', `/collection/${encodeURIComponent(id)}`, opts));

common(
  spendableCreditsCommand
    .command('show')
    .argument('<collection-id>', 'Collection ID')
    .description('Inspect immutable provider, service, purchase and consumption terms.')
).action(async (id: string, opts: any) => {
  try {
    emitIndexerResult({ collectionId: id, ...inspectSpendableCredit(await load(id, opts)) }, opts);
  } catch (error) {
    emitIndexerError(error);
  }
});

common(
  spendableCreditsCommand
    .command('quote')
    .argument('<collection-id>', 'Collection ID')
    .description('Quote exact whole-pack payment and credits without signing.')
    .requiredOption('--units <packs>', 'Positive whole packs')
    .option('--approval-id <id>', 'Purchase option approval ID; required for multiple options')
).action(async (id: string, opts: any) => {
  try {
    const collection = await load(id, opts);
    const { paymentDenom, provider, serviceId } = inspectSpendableCredit(collection);
    emitIndexerResult(
      { collectionId: id, paymentDenom, provider, serviceId, ...quoteSpendableCreditPurchase(collection, opts.units, opts.approvalId) },
      opts
    );
  } catch (error) {
    emitIndexerError(error);
  }
});

addDeployOptions(
  common(
    spendableCreditsCommand
      .command('purchase')
      .argument('<collection-id>', 'Collection ID')
      .description('Prepare a paid purchase. Units are whole packs; credits remain nontransferable.')
      .requiredOption('--creator <address>', 'Buyer wallet')
      .requiredOption('--units <packs>', 'Positive whole packs')
      .option('--approval-id <id>', 'Purchase option approval ID; required when multiple options exist')
  )
).action(async (id: string, opts: any) => {
  try {
    const wallet = requireBb1AddressStrict(opts.creator, '--creator');
    const message = buildPurchaseSpendableCreditsMsg(await load(id, opts), wallet, opts.units, opts.approvalId);
    await runEmitOrDeploy(message, opts, { emit: (m) => emitIndexerResult(m, opts), expectedAddress: wallet });
  } catch (error) {
    emitIndexerError(error);
  }
});

addDeployOptions(
  common(
    spendableCreditsCommand
      .command('consume')
      .argument('<collection-id>', 'Collection ID')
      .description(
        'Prepare irreversible consumption for a provider-issued request. Retry receipt acceptance, never burn again after an ambiguous result.'
      )
      .requiredOption('--creator <address>', 'Holder wallet')
      .requiredOption('--units <credits>', 'Whole service credits requested by the provider')
      .requiredOption('--request-id <id>', 'Provider-issued service request ID')
  )
).action(async (id: string, opts: any) => {
  try {
    const wallet = requireBb1AddressStrict(opts.creator, '--creator');
    const collection = await load(id, opts);
    const config = inspectSpendableCredit(collection);
    const message = buildConsumeSpendableCreditsMsg(collection, {
      wallet,
      provider: config.provider,
      serviceId: config.serviceId,
      requestId: opts.requestId,
      units: opts.units
    });
    await runEmitOrDeploy(message, opts, { emit: (m) => emitIndexerResult(m, opts), expectedAddress: wallet });
  } catch (error) {
    emitIndexerError(error);
  }
});
